/* Get Shaped – Schnellvorlagen aus dem gesamten Lebensmittelbestand (häufigste zuerst) und eigene Bewegungsarten. */
(() => {
'use strict';
const $=id=>document.getElementById(id);
const CUSTOM_KEY='get_shaped_custom_activities';
const BASE_ACTIVITIES=['Spaziergang','Stepper','Homeworkout','Krafttraining Gym','Mobility / Dehnen','Haushalt / Gartenarbeit','Sauna','Sonstiges'];
const TOP=12;
const norm=s=>window.GSFoodIndex?.norm?window.GSFoodIndex.norm(s):String(s||'').toLowerCase();
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const r1=x=>Math.round(x*10)/10;

/* ---------- Schnellvorlage ---------- */
let list=[],active=null;
function usageCounts(){
  const counts=new Map();
  let days={};try{days=db.days||{}}catch(_){}
  for(const d of Object.values(days))for(const f of d.foods||[]){
    const names=Array.isArray(f.components)&&f.components.length>1?f.components.map(c=>c.name):[f.name];
    for(const n of names){const k=norm(n);if(k)counts.set(k,(counts.get(k)||0)+1)}
  }
  return counts;
}
// Mischgerichte gehören nicht in die Vorlagen – dort stehen nur einzelne Lebensmittel.
const MEAL=/pfanne|eintopf|suppe|auflauf|curry|bowl|obstbecher|syrniki|gericht|rezept|\bmit\b|\bund\b|\+|\bvom vortag\b/;
// Gleiches Lebensmittel unter leicht anderem Namen (z. B. „Quark 20 %“ und „Quark, 20 % Fett i. Tr.“):
// gleiche Einheit, praktisch identische Nährwerte und der kürzere Name steckt vollständig im längeren.
const NAME_NOISE=new Set(['fett','i','tr','in','der','trockenmasse','natur','standardwert','durchschnitt','prozent']);
const nameTokens=key=>new Set(key.split(' ').filter(w=>w&&!NAME_NOISE.has(w)));
function sameNutrition(a,b){
  return a.unit===b.unit&&a.piece===b.piece&&Math.abs(a.kcal-b.kcal)<=Math.max(3,a.kcal*0.03)&&['p','c','f'].every(k=>Math.abs(a[k]-b[k])<=1);
}
function sameName(a,b){
  const x=nameTokens(a.key),y=nameTokens(b.key);
  if(!x.size||!y.size)return false;
  const [small,big]=x.size<=y.size?[x,y]:[y,x];
  return [...small].every(t=>big.has(t));
}
function dedupe(items){
  const kept=[];
  for(const it of items){   // Reihenfolge = Priorität (eigener Katalog vor Verlauf, Presets, Grundkatalog)
    const twin=kept.find(k=>sameNutrition(k,it)&&sameName(k,it));
    if(twin){twin.uses=Math.max(twin.uses,it.uses);continue}
    kept.push(it);
  }
  return kept.sort((a,b)=>a.name.localeCompare(b.name,'de'));
}
function buildList(){
  const seen=new Map();
  for(const e of window.GSFoodIndex?.entries?.()||[]){
    const key=norm(e.name);
    if(!key||e.meal||MEAL.test(key)||seen.has(key)||![e.kcal,e.p,e.c,e.f].every(Number.isFinite))continue;
    seen.set(key,{key,name:e.name,kcal:e.kcal,p:e.p,c:e.c,f:e.f,unit:e.unit==='ml'||/milch|bruhe|saft|kaffee|\btee\b/.test(key)?'ml':'g',piece:!!e.virtualPiece});
  }
  const counts=usageCounts();
  const items=dedupe([...seen.values()].map(x=>({...x,uses:counts.get(x.key)||0})));
  return items.sort((a,b)=>a.name.localeCompare(b.name,'de'));
}
function qtyOf(item){return item.piece?1:100}
function label(item,withUses){
  const q=item.piece?'1 Stück':'100 '+item.unit;
  return item.name+' · '+q+' · '+Math.round(item.kcal)+' kcal'+(withUses&&item.uses?' · '+item.uses+'×':'');
}
function rebuildPresets(){
  const sel=$('preset');if(!sel)return;
  const keep=sel.value;
  list=buildList();
  const favKeys=new Set(window.GSFavorites?.foods?.()||[]);
  const favs=list.filter(x=>favKeys.has(x.key));
  const top=[...list].filter(x=>x.uses>0&&!favKeys.has(x.key)).sort((a,b)=>b.uses-a.uses||a.name.localeCompare(b.name,'de')).slice(0,TOP);
  const opt=(x)=>'<option value="'+list.indexOf(x)+'">'+esc(label(x,false))+'</option>';
  sel.innerHTML='<option value="">— Frei eingeben —</option>'+
    (favs.length?'<optgroup label="★ Favoriten">'+favs.map(opt).join('')+'</optgroup>':'')+
    (top.length?'<optgroup label="⭐ Häufig genutzt">'+top.map(x=>'<option value="'+list.indexOf(x)+'">'+esc(label(x,true))+'</option>').join('')+'</optgroup>':'')+
    '<optgroup label="Alle Lebensmittel ('+list.length+')">'+list.map(opt).join('')+'</optgroup>';
  if(keep!==''&&sel.querySelector('option[value="'+keep+'"]'))sel.value=keep;
}
function fill(item,qty){
  const ratio=qty/qtyOf(item);
  const set=(id,v)=>{const el=$(id);if(el)el.value=v};
  set('foodKcal',r1(item.kcal*ratio));set('foodProtein',r1(item.p*ratio));set('foodCarbs',r1(item.c*ratio));set('foodFat',r1(item.f*ratio));
}
function onPresetChange(){
  const sel=$('preset'),item=sel.value===''?null:list[Number(sel.value)];
  active=item;
  if(!item)return;
  window.GSMealDraftComponents=null;
  $('foodName').value=item.name;
  if($('foodUnit'))$('foodUnit').value=item.piece?'Stück':item.unit;
  $('foodGrams').value=qtyOf(item);
  fill(item,qtyOf(item));
  const note=$('foodNote');if(note)note.value='';
  try{presetActive=null}catch(_){}
}
function onGramsInput(){
  if(!active||$('foodName').value!==active.name)return;
  const q=Number(String($('foodGrams').value).replace(',','.'));
  if(q>0)fill(active,q);
}

/* ---------- Bewegungsarten ---------- */
const readCustom=()=>{try{const v=JSON.parse(localStorage.getItem(CUSTOM_KEY)||'[]');return Array.isArray(v)?v.filter(x=>typeof x==='string'&&x.trim()):[]}catch(_){return []}};
const writeCustom=v=>{try{localStorage.setItem(CUSTOM_KEY,JSON.stringify(v))}catch(_){}};
function historyActivityTypes(){
  const out=new Set();let days={};try{days=db.days||{}}catch(_){}
  for(const d of Object.values(days))for(const a of d.activity||[])if(a?.type&&!BASE_ACTIVITIES.includes(a.type))out.add(String(a.type).trim());
  return [...out];
}
// Richtwerte (MET leicht/moderat/intensiv) für häufige eigene Bewegungsarten; Unbekanntes bleibt bei „Sonstiges“.
const MET_KEYWORDS=[
  [/rad|bike|cycl|spinning/,[4,6.8,10]],[/lauf|jogg|run/,[6,8.3,11.5]],[/schwimm/,[4.5,6,9.8]],[/yoga/,[2,2.5,4]],[/pilates/,[2.5,3,4]],
  [/wander|hik/,[4,5.3,7]],[/tanz/,[3,4.8,7]],[/hiit|intervall|crossfit/,[6,8,10]],[/rudern/,[4.8,7,8.5]],[/kletter|boulder/,[5,7.5,8]],
  [/tennis/,[5,7.3,8]],[/badminton/,[4.5,5.5,7]],[/fussball|fußball/,[5,7,10]],[/box/,[5,7.8,9]],[/seilspring/,[8,11,12]],[/crosstrainer|ellipt/,[4.6,5,7]],
  [/ski|langlauf/,[5,7,9]],[/zumba|aerobic/,[4.5,6.5,8]],[/walking|nordic/,[3.5,4.8,6]],[/treppen/,[4,6,8.8]]
];
function applyMets(types){
  let met;try{met=METS}catch(_){return}
  for(const type of types){
    if(met[type])continue;
    const n=String(type).toLocaleLowerCase('de');
    const hit=MET_KEYWORDS.find(([rx])=>rx.test(n));
    if(hit)met[type]=hit[1];
  }
}
function rebuildActivities(selectValue){
  const sel=$('activityType');if(!sel)return;
  const custom=[...new Set([...readCustom(),...historyActivityTypes()])].sort((a,b)=>a.localeCompare(b,'de'));
  applyMets(custom);
  const keep=selectValue??sel.value;
  const base=BASE_ACTIVITIES.filter(x=>x!=='Sonstiges');
  sel.innerHTML=[...base,...custom,'Sonstiges'].map(x=>'<option>'+esc(x)+'</option>').join('')+'<option value="__custom__">✎ Andere Art eingeben …</option>';
  if([...sel.options].some(o=>o.value===keep))sel.value=keep;
}
function setupActivities(){
  const sel=$('activityType'),save=$('saveActivity');
  if(!sel||!save||$('activityCustom'))return;
  const field=sel.closest('.field');
  const input=document.createElement('input');
  input.id='activityCustom';input.placeholder='z. B. Radfahren, Yoga, Schwimmen …';input.maxLength=40;input.className='hidden';input.style.marginTop='8px';input.setAttribute('aria-label','Eigene Bewegungsart');
  field.appendChild(input);
  rebuildActivities();
  sel.addEventListener('change',()=>{input.classList.toggle('hidden',sel.value!=='__custom__');if(sel.value==='__custom__')input.focus()});
  const original=window.addActivity;
  save.onclick=()=>{
    if(sel.value==='__custom__'){
      const name=input.value.replace(/\s+/g,' ').trim();
      if(!name){toast('Bitte die Bewegungsart eingeben.');input.focus();return}
      const known=[...BASE_ACTIVITIES,...readCustom(),...historyActivityTypes()].find(x=>x.toLocaleLowerCase('de')===name.toLocaleLowerCase('de'));
      const type=known||name;
      if(!known)writeCustom([...readCustom(),type]);
      rebuildActivities(type);sel.value=type;
      input.value='';input.classList.add('hidden');
    }
    original();
    rebuildActivities(sel.value);
  };
}

/* ---------- Aktualisierung ---------- */
function refreshAll(){try{rebuildPresets()}catch(e){console.error(e)}}
const baseRefresh=window.refreshRecent;
if(typeof baseRefresh==='function'){
  window.refreshRecent=function(){const r=baseRefresh.apply(this,arguments);refreshAll();return r};
}
function setup(){
  const sel=$('preset');if(!sel)return;
  sel.onchange=onPresetChange;
  $('foodGrams')?.addEventListener('input',onGramsInput);
  window.addEventListener('gs-catalogue-changed',refreshAll);
  refreshAll();
  setupActivities();
  // Verlauf kann sich auch durch Löschen/Import ändern: beim Öffnen der Heute-Ansicht nachziehen.
  document.querySelector('[data-tab="heute"]')?.addEventListener('click',()=>{try{refreshRecent()}catch(_){refreshAll()}});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(setup,0));else setTimeout(setup,0);
window.GSPresets={rebuildPresets,rebuildActivities,buildList,selected:()=>active,item:i=>list[i]};
})();
