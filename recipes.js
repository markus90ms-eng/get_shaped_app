/* Get Shaped – Eigene Rezepte (Kuchen, Chili con Carne …): Zutaten des ganzen Rezepts + Gewicht des fertigen Gerichts
   ergeben Nährwerte pro 100 g. Gegessen wird dann nur noch die Menge des fertigen Gerichts ("250 g Chili con Carne").
   Unbekannte Zutaten werden automatisch gesucht (eigene Liste, Richtwerte, Open Food Facts) und zur Auswahl angeboten.
   Die Eingabe bleibt als Entwurf erhalten, auch wenn die App kurz verlassen wird; gelöscht wird sie nur mit „Abbrechen“ oder nach dem Speichern. */
(() => {
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const r1=x=>Math.round(x*10)/10;
const DRAFT='get_shaped_recipe_draft';
let editingId=null,parsed=null,unknowns=[],calcToken=0;

function recipes(){settings.recipes=settings.recipes||[];return settings.recipes}
function saveSettings(){try{localStorage.setItem(CONFIG,JSON.stringify(settings))}catch(_){}}
const P=()=>window.GSMealParserV3;

/* ---------- Entwurf ---------- */
function readDraft(){try{return JSON.parse(localStorage.getItem(DRAFT)||'null')}catch(_){return null}}
function writeDraft(extra={}){
  if(!$('gsRecipe'))return;
  const d={editingId,name:$('gsRecipeName').value,aliases:$('gsRecipeAliases').value,ing:$('gsRecipeIng').value,weight:$('gsRecipeWeight').value,portions:$('gsRecipePortions').value,
    open:$('gsRecipe').style.display==='flex',...extra};
  const empty=!d.name&&!d.ing&&!d.weight&&!d.portions&&!d.aliases;
  try{if(empty)localStorage.removeItem(DRAFT);else localStorage.setItem(DRAFT,JSON.stringify(d))}catch(_){}
}
function clearDraft(){try{localStorage.removeItem(DRAFT)}catch(_){}}

/* ---------- Berechnung ---------- */
function ingredientLines(text){
  return String(text||'').replace(/\([^)]*\)/g,' ').split(/\n+/).map(x=>x.replace(/\s+/g,' ').trim()).filter(Boolean);
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
   '.gs-rline{display:flex;justify-content:space-between;gap:8px;padding:7px 0;border-bottom:1px solid var(--border);font-size:13px}.gs-rline:last-child{border:0}'+
   '.gs-unk{margin:10px 0;padding:10px 12px;border-radius:14px;background:var(--green2)}.gs-unk label.opt{display:flex;gap:8px;align-items:flex-start;padding:6px 0;font-size:13px;border-bottom:1px solid var(--border)}.gs-unk label.opt:last-of-type{border:0}.gs-unk input[type=radio]{width:auto;margin-top:3px}'+
   '.gs-unk .triple input{padding:8px}';
  document.head.appendChild(s);
}
function ensureModal(){
  let el=$('gsRecipe');if(el)return el;
  injectStyle();
  el=document.createElement('div');el.id='gsRecipe';
  el.innerHTML='<div class="gs-sheet" role="dialog" aria-label="Rezept"><div class="gs-head"><h2 id="gsRecipeTitle">🍲 Rezept anlegen</h2><button type="button" class="btn small second" id="gsRecipeClose" title="Eingabe bleibt als Entwurf erhalten">Schließen</button></div>'+
   '<div class="gs-body">'+
   '<div class="field"><label class="label" for="gsRecipeName">Name des Gerichts</label><input id="gsRecipeName" placeholder="z. B. Chili con Carne oder Apfelkuchen"/></div>'+
   '<div class="field"><label class="label" for="gsRecipeAliases">Auch erkennen als (optional, mit Komma getrennt)</label><input id="gsRecipeAliases" placeholder="z. B. Chili, Hackchili"/></div>'+
   '<div class="field"><label class="label" for="gsRecipeIng">Zutaten des ganzen Rezepts (eine pro Zeile, mit Mengen)</label><textarea id="gsRecipeIng" rows="7" placeholder="500 g Rinderhack\n2 Zwiebeln\n400 g Tomaten\n200 g Kidneybohnen\n1 EL Olivenöl"></textarea></div>'+
   '<div class="fieldrow"><div class="field"><label class="label" for="gsRecipeWeight">Gewicht fertig (g)</label><input id="gsRecipeWeight" type="number" inputmode="decimal" min="1" step="any" placeholder="gewogen, ohne Topf"/></div><div class="field"><label class="label" for="gsRecipePortions">Portionen (optional)</label><input id="gsRecipePortions" type="number" inputmode="numeric" min="1" step="1" placeholder="z. B. 4"/></div></div>'+
   '<p class="sub" style="margin-top:-4px">Beim Kochen verdampft Wasser: Wiege das fertige Gericht (Kuchen nach dem Backen, Eintopf ohne Topf). Ohne Angabe nehme ich die Summe der Zutaten. Die Nährwerte der Zutaten suche ich selbst.</p>'+
   '<button type="button" class="btn second" id="gsRecipeCalc" style="width:100%">Berechnen</button>'+
   '<div id="gsRecipeResult" style="margin-top:12px"></div>'+
   '<button type="button" class="btn ghost" id="gsRecipeCancel" style="width:100%;margin-top:14px">✕ Abbrechen und Eingabe verwerfen</button></div></div>';
  document.body.appendChild(el);
  $('gsRecipeClose').onclick=()=>{writeDraft({open:false});hide()};
  $('gsRecipeCancel').onclick=()=>{
    const d=readDraft();
    if((d||$('gsRecipeName').value||$('gsRecipeIng').value)&&!confirm('Eingabe wirklich verwerfen?'))return;
    clearDraft();hide();
  };
  el.addEventListener('click',e=>{if(e.target===el){writeDraft({open:false});hide()}});
  $('gsRecipeCalc').onclick=calculate;
  $('gsRecipeResult').addEventListener('click',onResultClick);
  for(const id of ['gsRecipeName','gsRecipeAliases','gsRecipeIng','gsRecipeWeight','gsRecipePortions'])$(id).addEventListener('input',()=>writeDraft());
  // Beim Wechsel in eine andere App/einen anderen Tab den Entwurf sofort sichern.
  document.addEventListener('visibilitychange',()=>{if(document.hidden)writeDraft()});
  window.addEventListener('pagehide',()=>writeDraft());
  return el;
}
function show(){const el=ensureModal();el.style.display='flex';document.body.style.overflow='hidden'}
function hide(){const el=$('gsRecipe');if(el)el.style.display='none';document.body.style.overflow=''}
function fill(v){
  $('gsRecipeTitle').textContent=v.editingId?'🍲 Rezept bearbeiten':'🍲 Rezept anlegen';
  $('gsRecipeName').value=v.name||'';$('gsRecipeAliases').value=v.aliases||'';$('gsRecipeIng').value=v.ing||'';
  $('gsRecipeWeight').value=v.weight||'';$('gsRecipePortions').value=v.portions||'';
  $('gsRecipeResult').innerHTML='';parsed=null;unknowns=[];
}
function open(recipe){
  ensureModal();
  const draft=readDraft();
  if(recipe){
    editingId=recipe.id;
    // Ein offener Entwurf zum selben Rezept hat Vorrang vor dem gespeicherten Stand.
    fill(draft&&draft.editingId===recipe.id?draft:{editingId:recipe.id,name:recipe.name,aliases:(recipe.aliases||[]).join(', '),ing:recipe.ingredientsText,weight:recipe.totalGrams,portions:recipe.portions});
  }else if(draft&&!draft.editingId){
    editingId=null;fill(draft);
    toast('Entwurf fortgesetzt');
  }else{editingId=null;fill({})}
  show();writeDraft({open:true});
  if($('gsRecipeIng').value.trim())calculate();
}

async function calculate(){
  const out=$('gsRecipeResult'),lines=ingredientLines($('gsRecipeIng').value),token=++calcToken;
  parsed=null;unknowns=[];
  if(!lines.length){out.innerHTML='<div class="warnline">Bitte die Zutaten mit Mengen eintragen.</div>';return}
  const rows=lines.map(line=>({line,res:P().parseFreeText(line)}));
  const bad=rows.filter(r=>r.res.error);
  if(bad.length){
    const unk=bad.filter(r=>r.res.kind==='unknown'&&r.res.label);
    const other=bad.filter(r=>!(r.res.kind==='unknown'&&r.res.label));
    unknowns=unk.map(r=>({line:r.line,label:r.res.label,sug:window.GSFoodIndex.suggest(r.res.label,3,{noDishes:true}),online:null,onlineError:'',pick:'',manual:false}));
    renderUnknowns(other.map(r=>r.res.error));
    // Online-Recherche für alle unbekannten Zutaten, nacheinander; Anzeige aktualisiert sich laufend.
    for(const u of unknowns){
      try{u.online=(await P().fetchCandidates(u.label)).slice(0,4)}catch(e){u.online=[];u.onlineError=e.name==='AbortError'?'Zeitüberschreitung':e.message}
      if(token!==calcToken)return;
      renderUnknowns(other.map(r=>r.res.error));
    }
    return;
  }
  const entries=rows.flatMap(r=>r.res.entries);
  const missing=entries.filter(e=>e.assumed);
  if(missing.length){out.innerHTML='<div class="warnline">Bei diesen Zutaten fehlt die Menge: '+missing.map(e=>esc(e.name)).join(', ')+'. Bitte in der Zeile ergänzen (z. B. „200 g …“).</div>';return}
  showResult(entries);
}
function renderUnknowns(otherErrors=[]){
  const out=$('gsRecipeResult');
  const optLabel=(e)=>esc(e.name)+' <span class="gs-meta">pro 100 '+(e.unit==='ml'?'ml':'g')+': '+Math.round(e.kcal)+' kcal · '+r1(e.p)+' g E · '+r1(e.c)+' g KH · '+r1(e.f)+' g F</span>';
  out.innerHTML=(otherErrors.length?'<div class="warnline">'+otherErrors.map(esc).join('<br>')+'</div>':'')+
    '<p class="sub"><b>Diese Zutaten habe ich noch nicht in deiner Liste.</b> Ich habe passende Einträge gesucht – wähle aus, dann rechne ich weiter.</p>'+
    unknowns.map((u,i)=>{
      const nl=window.GSFoodIndex.norm(u.label),like=n=>{const x=window.GSFoodIndex.norm(n);return x.includes(nl)||nl.includes(x)};
      // Vorauswahl: Treffer, dessen Name zur Zutat passt (eigene Liste vor Netz); sonst erster Netz-Treffer; sonst erster Richtwert.
      let first='m';
      const sIdx=u.sug.findIndex(e=>like(e.name)),oIdx=(u.online||[]).findIndex(e=>like(e.name));
      if(sIdx>=0)first='s'+sIdx;else if(oIdx>=0)first='o'+oIdx;else if(u.online&&u.online.length)first='o0';else if(u.sug.length)first='s0';
      const pick=u.pick||first;
      return '<div class="gs-unk" data-unk="'+i+'"><strong>„'+esc(u.label)+'“</strong> <span class="gs-meta">(Zeile: '+esc(u.line)+')</span>'+
       u.sug.map((e,k)=>'<label class="opt"><input type="radio" name="gsU'+i+'" value="s'+k+'"'+(pick==='s'+k?' checked':'')+'/> <span>'+optLabel(e)+' <span class="gs-meta">· '+(e.generic||e.estimate?'Richtwert':'eigene Liste')+'</span></span></label>').join('')+
       (u.online===null?'<p class="sub">🔎 Suche im Netz …</p>':(u.online.map((e,k)=>'<label class="opt"><input type="radio" name="gsU'+i+'" value="o'+k+'"'+(pick==='o'+k?' checked':'')+'/> <span><b>'+esc(e.name)+'</b>'+(e.brand?' · '+esc(e.brand):'')+' <span class="gs-meta">pro 100 g: '+Math.round(e.kcal)+' kcal · '+r1(e.p)+' g E · '+r1(e.c)+' g KH · '+r1(e.f)+' g F · Open Food Facts</span></span></label>').join('')+(u.online.length?'':'<p class="sub">Im Netz nichts Passendes gefunden'+(u.onlineError?' ('+esc(u.onlineError)+')':'')+'.</p>')))+
       '<label class="opt"><input type="radio" name="gsU'+i+'" value="m"'+(pick==='m'?' checked':'')+'/> <span>Werte selbst eintragen</span></label>'+
       '<div class="triple" data-manual="'+i+'" style="'+(pick==='m'?'':'display:none;')+'margin-top:6px"><div class="field"><input data-m="k" type="number" inputmode="decimal" step="any" placeholder="kcal"/></div><div class="field"><input data-m="p" type="number" inputmode="decimal" step="any" placeholder="Eiweiß"/></div><div class="field"><input data-m="c" type="number" inputmode="decimal" step="any" placeholder="KH"/></div></div>'+
       '<div class="field" data-manual-f="'+i+'" style="'+(pick==='m'?'':'display:none;')+'"><input data-m="f" type="number" inputmode="decimal" step="any" placeholder="Fett (pro 100 g)"/></div></div>';
    }).join('')+
    '<button type="button" class="btn" data-r-apply="1" style="width:100%">Auswahl übernehmen und berechnen</button>';
}
function applyUnknowns(){
  const out=$('gsRecipeResult');
  let ta=$('gsRecipeIng').value;
  for(let i=0;i<unknowns.length;i++){
    const u=unknowns[i],block=out.querySelector('[data-unk="'+i+'"]');
    const val=block.querySelector('input[type=radio]:checked')?.value||'';
    if(!val){toast('Bitte für „'+u.label+'“ eine Auswahl treffen.');return}
    const rx=new RegExp(u.label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i');
    if(val[0]==='s'){
      const e=u.sug[Number(val.slice(1))];
      const plain=e.name.replace(/[,;()]/g,' ').replace(/\s+/g,' ').trim();
      ta=ta.replace(rx,()=>plain);
    }else if(val[0]==='o'){
      P().learnProduct(u.label,u.online[Number(val.slice(1))]);
    }else{
      const g=k=>{const x=String(block.querySelector('[data-m="'+k+'"]').value).replace(',','.').trim();return x===''?NaN:Number(x)};
      const v=[g('k'),g('p'),g('c'),g('f')];
      if(!v.every(Number.isFinite)||v[0]<0||v[0]>950){toast('Bitte für „'+u.label+'“ kcal, Eiweiß, KH und Fett eintragen.');return}
      window.GSFoodIndex.importCatalogue([{name:u.label,aliases:[u.label],menge:100,einheit:'g',kcal:v[0],protein_g:v[1],kohlenhydrate_g:v[2],fett_g:v[3],sicher:false,marke_oder_quelle:'Selbst eingetragen (Rezept)'}]);
    }
  }
  $('gsRecipeIng').value=ta;writeDraft();
  window.GSFoodIndex.refresh();calculate();
}
function showResult(entries){
  const out=$('gsRecipeResult');
  const t=totals(entries),finished=Number($('gsRecipeWeight').value)>0?Number($('gsRecipeWeight').value):Math.round(t.grams);
  const k=100/finished,portions=Number($('gsRecipePortions').value)>0?Number($('gsRecipePortions').value):0,pg=portions?finished/portions:0;
  parsed={entries,totals:t,finished,portions,per100:{kcal:r1(t.kcal*k),p:r1(t.p*k),c:r1(t.c*k),f:r1(t.f*k),fiber:r1(t.fiber*k)},portionGrams:pg?Math.round(pg):0};
  out.innerHTML='<div class="card" style="box-shadow:none;padding:12px;background:var(--green2)"><h3 style="margin:0 0 8px">Zutaten</h3>'+
    entries.map(e=>'<div class="gs-rline"><span>'+esc(e.name)+' · '+r1(e.qty)+' '+esc(e.unit)+(e.assumption?' <small>('+esc(e.assumption)+')</small>':'')+'</span><b>'+Math.round(e.kcal)+' kcal</b></div>').join('')+
    '<div class="gs-rline"><strong>Gesamt ('+Math.round(finished)+' g fertig)</strong><strong>'+Math.round(t.kcal)+' kcal</strong></div></div>'+
    '<div class="mini-stats" style="margin:10px 0"><span>Pro 100 g <strong>'+Math.round(parsed.per100.kcal)+' kcal</strong></span><span>Eiweiß <strong>'+parsed.per100.p+' g</strong></span><span>KH <strong>'+parsed.per100.c+' g</strong></span><span>Fett <strong>'+parsed.per100.f+' g</strong></span>'+
    (portions?'<span>1 Portion ≈ <strong>'+parsed.portionGrams+' g / '+Math.round(t.kcal/portions)+' kcal</strong></span>':'')+'</div>'+
    (t.grams&&Math.abs(finished-t.grams)/t.grams>0.5?'<p class="warnline">Das fertige Gewicht weicht stark von der Summe der Zutaten ('+Math.round(t.grams)+' g) ab. Bitte prüfen.</p>':'')+
    '<button type="button" class="btn" id="gsRecipeSave" style="width:100%">'+(editingId?'Änderungen speichern':'Rezept speichern')+'</button>'+
    (editingId?'<button type="button" class="btn warn" id="gsRecipeDelete" style="width:100%;margin-top:8px">Rezept löschen</button>':'');
}
function onResultClick(e){
  if(e.target.closest('[data-r-apply]'))return applyUnknowns();
  const radio=e.target.closest('input[type=radio]');
  if(radio){
    const block=radio.closest('[data-unk]');if(!block)return;
    const i=block.dataset.unk,show=radio.value==='m';
    unknowns[i].pick=radio.value;
    block.querySelector('[data-manual="'+i+'"]').style.display=show?'':'none';
    block.querySelector('[data-manual-f="'+i+'"]').style.display=show?'':'none';
    return;
  }
  if(e.target.closest('#gsRecipeSave'))return save();
  if(e.target.closest('#gsRecipeDelete')){
    if(!confirm('Rezept wirklich löschen? Bereits gegessene Einträge bleiben erhalten.'))return;
    const list=recipes(),i=list.findIndex(r=>r.id===editingId);if(i>=0)list.splice(i,1);
    saveSettings();afterChange();clearDraft();hide();toast('Rezept gelöscht');
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
  saveSettings();afterChange();clearDraft();hide();
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
  // Nach einem Neuladen (z. B. weil iOS die Seite im Hintergrund beendet hat) den offenen Entwurf wiederherstellen.
  const d=readDraft();
  if(d&&d.open){
    ensureModal();editingId=d.editingId||null;fill(d);show();
    if(d.ing&&d.ing.trim())calculate();
  }
}
window.GSRecipes={open,recipes,totals};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(setup,260));else setTimeout(setup,260);
})();
