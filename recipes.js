/* Get Shaped – Eigene Rezepte (Kuchen, Chili con Carne …): Zutaten des ganzen Rezepts + Gewicht des fertigen Gerichts
   ergeben Nährwerte pro 100 g. Gegessen wird dann nur noch die Menge des fertigen Gerichts ("250 g Chili con Carne").
   Rezepte liegen in den Einstellungen und damit im JSON-Backup. */
(() => {
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const r1=x=>Math.round(x*10)/10;
let editingId=null,parsed=null,pendingUnknown=null;

function recipes(){settings.recipes=settings.recipes||[];return settings.recipes}
function saveSettings(){try{localStorage.setItem(CONFIG,JSON.stringify(settings))}catch(_){}}
function parseIngredients(text){
  const t=String(text||'').replace(/\([^)]*\)/g,' ').split(/\n+/).map(x=>x.replace(/\s+/g,' ').trim()).filter(Boolean).join(', ');
  if(!t)return {error:'Bitte die Zutaten mit Mengen eintragen.',entries:[]};
  return window.GSMealParserV3.parseFreeText(t);
}
function totals(entries){
  const t={kcal:0,p:0,c:0,f:0,grams:0};
  for(const e of entries){t.kcal+=e.kcal;t.p+=e.p;t.c+=e.c;t.f+=e.f;t.grams+=e.grams}
  const fib=window.GSFiber?window.GSFiber.fiberOfFood({name:'Rezept',components:entries.map(e=>({name:e.name,quantity:e.qty,unit:e.unit}))}):{grams:0,partial:true};
  t.fiber=fib.grams;t.fiberPartial=fib.partial;return t;
}

/* ---------- Oberfläche ---------- */
function injectStyle(){
  if($('gsRecipeStyle'))return;
  const s=document.createElement('style');s.id='gsRecipeStyle';
  s.textContent='#gsRecipe{position:fixed;inset:0;z-index:195;background:rgba(10,20,17,.55);display:none;align-items:flex-end;justify-content:center}'+
   '#gsRecipe .gs-sheet{background:var(--paper);width:100%;max-width:600px;max-height:92vh;border-radius:22px 22px 0 0;display:flex;flex-direction:column;overflow:hidden}'+
   '#gsRecipe .gs-body{overflow:auto;padding:14px 16px 28px;-webkit-overflow-scrolling:touch}'+
   '#gsRecipe .gs-head{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:14px 16px;border-bottom:1px solid var(--border)}#gsRecipe h2{margin:0;font-size:18px}'+
   '.gs-rline{display:flex;justify-content:space-between;gap:8px;padding:7px 0;border-bottom:1px solid var(--border);font-size:13px}.gs-rline:last-child{border:0}';
  document.head.appendChild(s);
}
function ensureModal(){
  let el=$('gsRecipe');if(el)return el;
  injectStyle();
  el=document.createElement('div');el.id='gsRecipe';
  el.innerHTML='<div class="gs-sheet" role="dialog" aria-label="Rezept"><div class="gs-head"><h2 id="gsRecipeTitle">🍲 Rezept anlegen</h2><button type="button" class="btn small second" id="gsRecipeClose">Schließen</button></div>'+
   '<div class="gs-body">'+
   '<div class="field"><label class="label" for="gsRecipeName">Name des Gerichts</label><input id="gsRecipeName" placeholder="z. B. Chili con Carne oder Apfelkuchen"/></div>'+
   '<div class="field"><label class="label" for="gsRecipeAliases">Auch erkennen als (optional, mit Komma getrennt)</label><input id="gsRecipeAliases" placeholder="z. B. Chili, Hackchili"/></div>'+
   '<div class="field"><label class="label" for="gsRecipeIng">Zutaten des ganzen Rezepts (eine pro Zeile, mit Mengen)</label><textarea id="gsRecipeIng" rows="7" placeholder="500 g Rinderhack\\n2 Zwiebeln\\n400 g Tomaten\\n200 g Kidneybohnen\\n1 EL Olivenöl"></textarea></div>'+
   '<div class="fieldrow"><div class="field"><label class="label" for="gsRecipeWeight">Gewicht fertig (g)</label><input id="gsRecipeWeight" type="number" inputmode="decimal" min="1" step="any" placeholder="gewogen, ohne Topf"/></div><div class="field"><label class="label" for="gsRecipePortions">Portionen (optional)</label><input id="gsRecipePortions" type="number" inputmode="numeric" min="1" step="1" placeholder="z. B. 4"/></div></div>'+
   '<p class="sub" style="margin-top:-4px">Beim Kochen verdampft Wasser: Wiege das fertige Gericht (Kuchen nach dem Backen, Eintopf ohne Topf). Ohne Angabe nehme ich die Summe der Zutaten.</p>'+
   '<button type="button" class="btn second" id="gsRecipeCalc" style="width:100%">Berechnen</button>'+
   '<div id="gsRecipeResult" style="margin-top:12px"></div></div></div>';
  document.body.appendChild(el);
  $('gsRecipeClose').onclick=close;
  el.addEventListener('click',e=>{if(e.target===el)close()});
  $('gsRecipeCalc').onclick=calculate;
  $('gsRecipeResult').addEventListener('click',onResultClick);
  return el;
}
function open(recipe){
  const el=ensureModal();
  editingId=recipe?.id||null;parsed=null;pendingUnknown=null;
  $('gsRecipeTitle').textContent=recipe?'🍲 Rezept bearbeiten':'🍲 Rezept anlegen';
  $('gsRecipeName').value=recipe?.name||'';$('gsRecipeAliases').value=(recipe?.aliases||[]).join(', ');$('gsRecipeIng').value=recipe?.ingredientsText||'';
  $('gsRecipeWeight').value=recipe?.totalGrams||'';$('gsRecipePortions').value=recipe?.portions||'';
  $('gsRecipeResult').innerHTML='';
  el.style.display='flex';document.body.style.overflow='hidden';
  if(recipe)calculate();
}
function close(){const el=$('gsRecipe');if(el)el.style.display='none';document.body.style.overflow=''}

function calculate(){
  const out=$('gsRecipeResult'),res=parseIngredients($('gsRecipeIng').value);
  pendingUnknown=null;parsed=null;
  if(res.error){
    if(res.kind==='unknown'&&res.label){
      pendingUnknown=res.label;
      const sug=window.GSFoodIndex.suggest(res.label,4);
      out.innerHTML='<div class="warnline">„'+esc(res.label)+'“ kenne ich noch nicht.</div>'+
       (sug.length?'<div class="hint" style="margin-top:8px"><strong>Meintest du …?</strong><div class="btnrow" style="margin-top:6px">'+sug.map(e=>'<button type="button" class="btn second small" style="flex:1 1 100%;text-align:left" data-r-sug="'+esc(e.name)+'"><b>'+esc(e.name)+'</b> <span class="gs-meta">pro 100 '+(e.unit==='ml'?'ml':'g')+': '+Math.round(e.kcal)+' kcal</span></button>').join('')+'</div></div>':'')+
       '<div class="hint" style="margin-top:8px"><strong>Oder Werte pro 100 g selbst eintragen</strong><div class="triple" style="margin-top:6px"><div class="field"><label class="label" for="rK">kcal</label><input id="rK" type="number" inputmode="decimal" step="any"/></div><div class="field"><label class="label" for="rP">Eiweiß</label><input id="rP" type="number" inputmode="decimal" step="any"/></div><div class="field"><label class="label" for="rC">KH</label><input id="rC" type="number" inputmode="decimal" step="any"/></div></div><div class="field"><label class="label" for="rF">Fett</label><input id="rF" type="number" inputmode="decimal" step="any"/></div><button type="button" class="btn small" data-r-manual="1" style="width:100%">Speichern und weiter</button></div>';
    }else out.innerHTML='<div class="warnline">'+esc(res.error)+'</div>';
    return;
  }
  const missing=res.entries.filter(e=>e.assumed);
  if(missing.length){out.innerHTML='<div class="warnline">Bei diesen Zutaten fehlt die Menge: '+missing.map(e=>esc(e.name)).join(', ')+'. Bitte in der Zeile ergänzen (z. B. „200 g …“).</div>';return}
  const t=totals(res.entries),finished=Number($('gsRecipeWeight').value)>0?Number($('gsRecipeWeight').value):Math.round(t.grams);
  const k=100/finished,portions=Number($('gsRecipePortions').value)>0?Number($('gsRecipePortions').value):0,pg=portions?finished/portions:0;
  parsed={entries:res.entries,totals:t,finished,portions,per100:{kcal:r1(t.kcal*k),p:r1(t.p*k),c:r1(t.c*k),f:r1(t.f*k),fiber:r1(t.fiber*k)},portionGrams:pg?Math.round(pg):0};
  out.innerHTML='<div class="card" style="box-shadow:none;padding:12px;background:var(--green2)"><h3 style="margin:0 0 8px">Zutaten</h3>'+
    res.entries.map(e=>'<div class="gs-rline"><span>'+esc(e.name)+' · '+r1(e.qty)+' '+esc(e.unit)+(e.assumption?' <small>('+esc(e.assumption)+')</small>':'')+'</span><b>'+Math.round(e.kcal)+' kcal</b></div>').join('')+
    '<div class="gs-rline"><strong>Gesamt ('+Math.round(finished)+' g fertig)</strong><strong>'+Math.round(t.kcal)+' kcal</strong></div></div>'+
    '<div class="mini-stats" style="margin:10px 0"><span>Pro 100 g <strong>'+Math.round(parsed.per100.kcal)+' kcal</strong></span><span>Eiweiß <strong>'+parsed.per100.p+' g</strong></span><span>KH <strong>'+parsed.per100.c+' g</strong></span><span>Fett <strong>'+parsed.per100.f+' g</strong></span>'+
    (portions?'<span>1 Portion ≈ <strong>'+parsed.portionGrams+' g / '+Math.round(t.kcal/portions)+' kcal</strong></span>':'')+'</div>'+
    (t.grams&&Math.abs(finished-t.grams)/t.grams>0.5?'<p class="warnline">Das fertige Gewicht weicht stark von der Summe der Zutaten ('+Math.round(t.grams)+' g) ab. Bitte prüfen.</p>':'')+
    '<button type="button" class="btn" id="gsRecipeSave" style="width:100%">'+(editingId?'Änderungen speichern':'Rezept speichern')+'</button>'+
    (editingId?'<button type="button" class="btn warn" id="gsRecipeDelete" style="width:100%;margin-top:8px">Rezept löschen</button>':'');
}
function onResultClick(e){
  const sg=e.target.closest('[data-r-sug]');
  if(sg){
    const ta=$('gsRecipeIng'),label=pendingUnknown||'';
    const rx=new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i');
    const plain=sg.dataset.rSug.replace(/[,;]/g,' ').replace(/\s+/g,' ').trim();
    ta.value=rx.test(ta.value)?ta.value.replace(rx,()=>plain):ta.value;calculate();return;
  }
  if(e.target.closest('[data-r-manual]')){
    const v=id=>{const x=String($(id).value).replace(',','.').trim();return x===''?NaN:Number(x)};
    const vals=[v('rK'),v('rP'),v('rC'),v('rF')];
    if(!vals.every(Number.isFinite)||vals[0]<0||vals[0]>950){toast('Bitte kcal, Eiweiß, KH und Fett pro 100 g eintragen.');return}
    window.GSFoodIndex.importCatalogue([{name:pendingUnknown,aliases:[pendingUnknown],menge:100,einheit:'g',kcal:vals[0],protein_g:vals[1],kohlenhydrate_g:vals[2],fett_g:vals[3],sicher:false,marke_oder_quelle:'Selbst eingetragen (Rezept)'}]);
    window.GSFoodIndex.refresh();calculate();return;
  }
  if(e.target.closest('#gsRecipeSave'))return save();
  if(e.target.closest('#gsRecipeDelete')){
    if(!confirm('Rezept wirklich löschen? Bereits gegessene Einträge bleiben erhalten.'))return;
    const list=recipes(),i=list.findIndex(r=>r.id===editingId);if(i>=0)list.splice(i,1);
    saveSettings();afterChange();close();toast('Rezept gelöscht');
  }
}
function save(){
  const name=$('gsRecipeName').value.trim();
  if(!name){toast('Bitte dem Gericht einen Namen geben.');$('gsRecipeName').focus();return}
  if(!parsed)return;
  const list=recipes();
  const rec={id:editingId||uuid(),name,aliases:$('gsRecipeAliases').value.split(',').map(x=>x.trim()).filter(Boolean),ingredientsText:$('gsRecipeIng').value.trim(),
    ingredients:parsed.entries.map(e=>({name:e.name,quantity:r1(e.qty),unit:e.unit,kcal:r1(e.kcal),p:r1(e.p),c:r1(e.c),f:r1(e.f)})),
    totalGrams:parsed.finished,portions:parsed.portions||0,portionGrams:parsed.portionGrams||0,per100:parsed.per100,updated:new Date().toISOString()};
  const i=list.findIndex(r=>r.id===rec.id);
  if(i>=0)list[i]=rec;else list.push(rec);
  saveSettings();afterChange();close();
  toast('Rezept gespeichert ✓ – tippe z. B. „250 g '+name+'“');
}
function afterChange(){
  window.GSFoodIndex.refresh();
  try{window.dispatchEvent(new Event('gs-catalogue-changed'))}catch(_){}
  try{window.GSPresets?.rebuildPresets?.()}catch(_){}
  renderList();
}

/* ---------- Einstieg und Verwaltung ---------- */
function renderList(){
  const host=$('gsRecipeList');if(!host)return;
  const list=recipes();
  host.innerHTML=list.length?list.map(r=>'<div class="entry"><div class="entry-main"><div class="entry-name">'+esc(r.name)+'</div><div class="entry-detail">'+Math.round(r.per100.kcal)+' kcal · '+r.per100.p+' g Eiweiß pro 100 g'+(r.portions?' · '+r.portions+' Portionen':'')+'</div></div><button type="button" class="btn small second" data-recipe-edit="'+esc(r.id)+'">Bearbeiten</button></div>').join(''):'<p class="sub">Noch keine eigenen Rezepte.</p>';
}
function setup(){
  const meal=$('mealCard');
  if(meal&&!$('gsRecipeBtn')){
    const btn=document.createElement('button');btn.type='button';btn.id='gsRecipeBtn';btn.className='btn ghost small';btn.textContent='🍲 Rezept anlegen';
    const line=meal.querySelector('.camera-line');if(line)line.appendChild(btn);
    btn.onclick=()=>open();
  }
  const grid=document.querySelector('#tab-einstellungen .grid');
  if(grid&&!$('gsRecipeCard')){
    const card=document.createElement('article');card.className='card';card.id='gsRecipeCard';
    card.innerHTML='<h2>🍲 Meine Rezepte</h2><p class="sub">Kuchen, Chili con Carne, Eintöpfe … Einmal mit allen Zutaten anlegen, danach genügt „250 g Chili“.</p><div id="gsRecipeList"></div><button type="button" class="btn" id="gsRecipeNew" style="width:100%;margin-top:10px">＋ Neues Rezept</button>';
    grid.appendChild(card);
    $('gsRecipeNew').onclick=()=>open();
    $('gsRecipeList').addEventListener('click',e=>{const b=e.target.closest('[data-recipe-edit]');if(b)open(recipes().find(r=>r.id===b.dataset.recipeEdit))});
    renderList();
  }
}
window.GSRecipes={open,recipes,totals};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(setup,220));else setTimeout(setup,220);
})();
