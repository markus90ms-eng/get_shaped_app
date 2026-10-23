/* Get Shaped – Datenprüfung: findet widersprüchliche oder unplausible Einträge und rechnet Zutaten auf Wunsch mit den aktuellen Katalogwerten neu. */
(() => {
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const r1=x=>Math.round(x*10)/10;
const n=x=>{const v=Number(String(x??'').replace(',','.'));return Number.isFinite(v)?v:NaN};
const norm=s=>window.GSFoodIndex?.norm?window.GSFoodIndex.norm(s):String(s||'').toLowerCase();
const MAX_SHOWN=60;

// Neuberechnung einer Zutat aus dem aktuellen Katalog; null, wenn nichts Passendes gefunden wird.
function recomputeComponent(c){
  const m=window.GSFoodIndex?.match?.(c.name);
  const q=n(c.quantity??c.qty);
  if(!m||!(q>0))return null;
  let k;
  if(c.unit==='Stück'){if(!m.virtualPiece)return null;k=q}
  else if(c.unit==='g'||c.unit==='ml'){k=q/100}
  else return null;
  return {name:c.name,matched:m.name,kcal:m.kcal*k,p:m.p*k,c:m.c*k,f:m.f*k};
}
function checkFood(food,date){
  const issues=[];
  const kcal=n(food.kcal),p=n(food.p)||0,c=n(food.c)||0,f=n(food.f)||0,qty=n(food.quantity);
  if(!Number.isFinite(kcal)){issues.push({type:'warn',text:'Keine Kalorien eingetragen.'});return {issues}}
  const expected=4*p+4*c+9*f;
  if(kcal>=50&&expected>0&&Math.abs(kcal-expected)>Math.max(35,kcal*0.2))
    issues.push({type:'warn',text:'Kalorien passen nicht zu den Nährwerten: eingetragen '+Math.round(kcal)+' kcal, aus Eiweiß/KH/Fett ergeben sich ca. '+Math.round(expected)+' kcal.'});
  if(qty>0&&(food.unit==='g'||food.unit==='ml')){
    if(kcal/qty>9.3)issues.push({type:'error',text:'Mehr als 9 kcal pro '+food.unit+' ist unmöglich ('+Math.round(kcal)+' kcal für '+qty+' '+food.unit+').'});
    if(p+c+f>qty*1.05)issues.push({type:'error',text:'Eiweiß, KH und Fett wiegen zusammen mehr ('+r1(p+c+f)+' g) als die Portion ('+qty+' '+food.unit+').'});
  }
  if(kcal>1800)issues.push({type:'warn',text:'Sehr hoher Einzelwert: '+Math.round(kcal)+' kcal.'});
  let fix=null;
  if(Array.isArray(food.components)&&food.components.length){
    const rows=food.components.map(x=>({old:x,fresh:recomputeComponent(x)}));
    const diffs=rows.filter(r=>r.fresh&&Math.abs(r.fresh.kcal-n(r.old.kcal))>Math.max(10,n(r.old.kcal)*0.1));
    if(diffs.length){
      issues.push({type:'info',text:diffs.map(r=>esc(r.old.name)+': gespeichert '+Math.round(n(r.old.kcal))+' kcal, laut Katalog („'+esc(r.fresh.matched)+'“) '+Math.round(r.fresh.kcal)+' kcal').join(' · '),html:true});
      fix=rows;
    }
  }
  return {issues,fix};
}
function applyFix(date,id){
  const food=db.days?.[date]?.foods?.find(x=>x.id===id);if(!food)return false;
  const res=checkFood(food,date);if(!res.fix)return false;
  let sum={kcal:0,p:0,c:0,f:0};
  food.components=res.fix.map(r=>{
    const src=r.fresh||{kcal:n(r.old.kcal)||0,p:n(r.old.p)||0,c:n(r.old.c)||0,f:n(r.old.f)||0};
    sum.kcal+=src.kcal;sum.p+=src.p;sum.c+=src.c;sum.f+=src.f;
    return {...r.old,kcal:r1(src.kcal),p:r1(src.p),c:r1(src.c),f:r1(src.f)};
  });
  food.kcal=r1(sum.kcal);food.p=r1(sum.p);food.c=r1(sum.c);food.f=r1(sum.f);
  return true;
}
function scan(){
  const found=[];
  for(const date of Object.keys(db.days||{}).sort().reverse()){
    const foods=db.days[date].foods||[],seen=new Map();
    for(const food of foods){
      const r=checkFood(food,date);
      const key=norm(food.name)+'|'+food.quantity+'|'+food.unit+'|'+food.kcal;
      if(seen.has(key))r.issues.push({type:'info',text:'Möglicherweise doppelt eingetragen (gleicher Name, Menge und Kalorien am selben Tag).'});
      seen.set(key,true);
      if(r.issues.length)found.push({date,food,issues:r.issues,fix:!!r.fix});
    }
  }
  return found;
}
function renderResult(found,total){
  const host=$('gsCheckResult');if(!host)return;
  if(!found.length){host.innerHTML='<p class="hint">✓ '+total+' Einträge geprüft – keine Auffälligkeiten.</p>';return}
  const fixable=found.filter(x=>x.fix).length;
  const icon={error:'⛔',warn:'⚠️',info:'ℹ️'};
  host.innerHTML='<p class="sub"><b>'+found.length+'</b> von '+total+' Einträgen auffällig'+(found.length>MAX_SHOWN?' (die neuesten '+MAX_SHOWN+' werden gezeigt)':'')+'.</p>'+
   (fixable?'<button type="button" class="btn second" id="gsCheckFixAll" style="width:100%;margin-bottom:10px">Alle '+fixable+' Zutaten-Abweichungen neu berechnen</button>':'')+
   found.slice(0,MAX_SHOWN).map(x=>'<div class="entry" style="align-items:flex-start"><div class="entry-main"><div class="entry-name">'+esc(x.food.name)+'</div><div class="entry-detail">'+esc(x.date.split('-').reverse().join('.'))+' · '+esc(x.food.grams||'')+' · '+Math.round(n(x.food.kcal)||0)+' kcal'+
     x.issues.map(i=>'<div style="margin-top:4px">'+icon[i.type]+' '+(i.html?i.text:esc(i.text))+'</div>').join('')+
     '</div><div class="btnrow" style="margin-top:8px"><button type="button" class="btn small ghost" data-check-open="'+esc(x.date)+'">Öffnen</button>'+(x.fix?'<button type="button" class="btn small second" data-check-fix="'+esc(x.date)+'|'+esc(x.food.id)+'">Neu berechnen</button>':'')+'</div></div></div>').join('');
}
function run(){
  const total=Object.values(db.days||{}).reduce((a,d)=>a+(d.foods||[]).length,0);
  const found=scan();renderResult(found,total);
}
function setup(){
  const grid=document.querySelector('#tab-einstellungen .grid');
  if(!grid||$('gsCheckCard'))return;
  const card=document.createElement('article');card.className='card';card.id='gsCheckCard';card.style.gridColumn='1 / -1';
  card.innerHTML='<h2>🔍 Daten prüfen</h2><p class="sub">Sucht Einträge, bei denen Kalorien und Nährwerte nicht zusammenpassen, Werte unmöglich sind oder die gespeicherten Zutatenwerte vom aktuellen Katalog abweichen. Es wird nichts ohne deine Bestätigung geändert. Mach vorher ein JSON-Backup.</p><button type="button" class="btn" id="gsCheckRun" style="width:100%">Einträge prüfen</button><div id="gsCheckResult" style="margin-top:12px"></div>';
  grid.appendChild(card);
  $('gsCheckRun').onclick=run;
  card.addEventListener('click',e=>{
    const open=e.target.closest('[data-check-open]');
    if(open){selected=open.dataset.checkOpen;render();showTab('heute');return}
    const fix=e.target.closest('[data-check-fix]');
    if(fix){
      const [date,id]=fix.dataset.checkFix.split('|');
      if(!confirm('Zutaten dieses Eintrags mit den aktuellen Katalogwerten neu berechnen?'))return;
      if(applyFix(date,id)){persist();refreshRecent();render();run();toast('Eintrag neu berechnet ✓')}
      return;
    }
    if(e.target.closest('#gsCheckFixAll')){
      const todo=scan().filter(x=>x.fix);
      if(!confirm(todo.length+' Einträge mit den aktuellen Katalogwerten neu berechnen? (Vorher ein Backup machen.)'))return;
      let done=0;for(const x of todo)if(applyFix(x.date,x.food.id))done++;
      persist();refreshRecent();render();run();toast(done+' Einträge neu berechnet ✓');
    }
  });
}
window.GSDataCheck={scan,checkFood,applyFix,recomputeComponent};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(setup,80));else setTimeout(setup,80);
})();
