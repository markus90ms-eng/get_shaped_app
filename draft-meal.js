/* Get Shaped – Entwurf der Mahlzeiten-Eingabe: Was du eingetippt hast, bleibt erhalten, wenn du kurz in eine andere App oder einen anderen Tab wechselst
   (iOS beendet Seiten im Hintergrund). Gelöscht wird der Entwurf nur durch „Abbrechen“ oder nach dem Speichern. */
(() => {
'use strict';
const $=id=>document.getElementById(id);
const KEY='get_shaped_meal_draft';
const FIELDS=['quickSpeech','foodName','foodGrams','foodUnit','foodKcal','foodProtein','foodCarbs','foodFat','foodFiber','foodNote'];
let last='';
function snapshot(){const o={};for(const id of FIELDS)o[id]=$(id)?$(id).value:'';return o}
function hasContent(o){return FIELDS.some(id=>id!=='foodUnit'&&String(o[id]||'').trim()!=='')}
function save(){
  try{
    if(typeof editingFoodID!=='undefined'&&editingFoodID)return;           // beim Bearbeiten eines vorhandenen Eintrags keinen Entwurf anlegen
    const o=snapshot(),s=JSON.stringify(o);if(s===last)return;last=s;
    if(hasContent(o))localStorage.setItem(KEY,s);else localStorage.removeItem(KEY);
  }catch(_){}
}
function clear(){last='';try{localStorage.removeItem(KEY)}catch(_){}}
function restore(){
  let d=null;try{d=JSON.parse(localStorage.getItem(KEY)||'null')}catch(_){}
  if(!d||!hasContent(d))return;
  if(FIELDS.some(id=>id!=='foodUnit'&&$(id)&&String($(id).value).trim()!==''))return;   // nichts überschreiben
  for(const id of FIELDS)if($(id)&&d[id]!==undefined)$(id).value=d[id];
  last=JSON.stringify(d);
  if(d.quickSpeech&&d.quickSpeech.trim())$('quickSpeech').dispatchEvent(new Event('input',{bubbles:true}));   // Auswertung neu anstoßen
  try{toast('Eingabe wiederhergestellt')}catch(_){}
}
function setup(){
  if(!$('quickSpeech')||$('gsDraftReady'))return;
  const marker=document.createElement('span');marker.id='gsDraftReady';marker.hidden=true;document.body.appendChild(marker);
  // Speichern und Abbrechen leeren den Entwurf (beide rufen resetMeal auf).
  const baseReset=window.resetMeal;
  if(typeof baseReset==='function')window.resetMeal=function(){const r=baseReset.apply(this,arguments);clear();return r};
  for(const id of FIELDS)$(id)?.addEventListener('input',save);
  setInterval(save,1500);                                                    // erfasst auch programmatisch gesetzte Werte (Vorschläge, Vorlagen)
  document.addEventListener('visibilitychange',()=>{if(document.hidden)save()});
  window.addEventListener('pagehide',save);
  restore();
}
window.GSDraftMeal={save,clear,restore};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(setup,300));else setTimeout(setup,300);
})();
