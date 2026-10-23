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
function buildList(){
  const seen=new Map();
  for(const e of window.GSFoodIndex?.entries?.()||[]){
    const key=norm(e.name);
    if(!key||seen.has(key)||![e.kcal,e.p,e.c,e.f].every(Number.isFinite))continue;
    seen.set(key,{key,name:e.name,kcal:e.kcal,p:e.p,c:e.c,f:e.f,unit:e.unit==='ml'||/milch|bruhe|saft|kaffee|\btee\b/.test(key)?'ml':'g',piece:!!e.virtualPiece});
  }
  const counts=usageCounts();
  const items=[...seen.values()].map(x=>({...x,uses:counts.get(x.key)||0}));
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
  const top=[...list].filter(x=>x.uses>0).sort((a,b)=>b.uses-a.uses||a.name.localeCompare(b.name,'de')).slice(0,TOP);
  const opt=(x)=>'<option value="'+list.indexOf(x)+'">'+esc(label(x,false))+'</option>';
  sel.innerHTML='<option value="">— Frei eingeben —</option>'+
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
function rebuildActivities(selectValue){
  const sel=$('activityType');if(!sel)return;
  const custom=[...new Set([...readCustom(),...historyActivityTypes()])].sort((a,b)=>a.localeCompare(b,'de'));
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
window.GSPresets={rebuildPresets,rebuildActivities,buildList};
})();
