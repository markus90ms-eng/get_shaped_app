/* Get Shaped – manuelles Ballaststofffeld, CSV-Export mit Wasser und Ballaststoffen. */
(() => {
'use strict';
const $=id=>document.getElementById(id);
const csvCell=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
const round1=x=>Math.round(x*10)/10;

function setup(){
  if(!$('foodProtein')||$('foodFiber'))return;
  const triple=$('foodProtein').closest('.triple');
  triple.insertAdjacentHTML('afterend','<div class="field"><label class="label" for="foodFiber">Ballaststoffe (g, optional – sonst Schätzung aus den Zutaten)</label><input id="foodFiber" type="number" inputmode="decimal" min="0" step="any" placeholder="automatisch"/></div>');

  // Beim Bearbeiten den gespeicherten Wert wieder einblenden.
  $('foodEntries').addEventListener('click',e=>{
    const b=e.target.closest('[data-edit-food]');if(!b)return;
    setTimeout(()=>{const f=day().foods.find(x=>x.id===b.dataset.editFood);$('foodFiber').value=f&&f.fiber!==undefined&&f.fiber!==null?f.fiber:''},0);
  });

  const baseRecord=window.recordFood;
  window.recordFood=function(){
    const raw=$('foodFiber').value.trim(),editing=editingFoodID,d=day(),before=d.foods.length;
    const result=baseRecord.apply(this,arguments);
    const saved=editing?d.foods.find(x=>x.id===editing):(d.foods.length>before?d.foods[d.foods.length-1]:null);
    if(saved){
      if(raw!==''&&Number.isFinite(Number(raw.replace(',','.'))))saved.fiber=round1(Number(raw.replace(',','.')));
      else delete saved.fiber;
      persist();render();
      $('foodFiber').value='';
    }
    return result;
  };

  $('exportCSV').onclick=exportCSV;
}

function exportCSV(){
  const header=['Datum','Typ','Name','Portion','Kalorien','Protein_g','Kohlenhydrate_g','Fett_g','Ballaststoffe_g','Wasser_ml','Minuten','Schritte','Notiz'];
  const rows=[header];
  const dates=Object.keys(db.days||{}).sort();
  for(const date of dates){
    const d=db.days[date];
    for(const f of d.foods||[]){
      const fib=window.GSWaterFiber?.fiberOfFood?window.GSWaterFiber.fiberOfFood(f):null;
      const fiber=f.fiber!==undefined&&f.fiber!==null?f.fiber:(fib?(fib.partial?'≥ ':'')+round1(fib.grams):'');
      rows.push([date,'Essen',f.name,f.grams,f.kcal,f.p,f.c,f.f,fiber,'','','',f.note]);
    }
    for(const a of d.activity||[])rows.push([date,'Bewegung',a.type,'','','','','','','',a.mins,a.steps,a.note]);
    const ml=(d.water||[]).reduce((n,w)=>n+(Number(w.ml)||0),0);
    if(ml>0)rows.push([date,'Wasser','','','','','','','',ml,'','','']);
    const m=d.measures;
    if(m&&Object.values(m).some(v=>v!==''&&v!==undefined&&v!==null))rows.push([date,'Messwerte','Gewicht '+(m.weight||'')+' / Taille '+(m.waist||'')+' / Oberschenkel '+(m.thigh||''),'','','','','','','','','',m.feel]);
  }
  const csv='﻿'+rows.map(r=>r.map(csvCell).join(';')).join('\n');
  download('get-shaped-'+datestr(new Date())+'.csv',csv,'text/csv;charset=utf-8');
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(setup,0));else setTimeout(setup,0);
})();
