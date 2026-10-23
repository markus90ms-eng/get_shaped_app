/* Get Shaped – Wochenansicht und Verlaufsdiagramme (Gewicht, Taille, Oberschenkel mit 7-Tage-Schnitt). */
(() => {
'use strict';
const $=id=>document.getElementById(id);
const DAY=864e5;
const WD=['So','Mo','Di','Mi','Do','Fr','Sa'];
let weekOffset=0,metric='weight';
const METRICS={weight:{label:'Gewicht',unit:'kg',min:30,max:300},waist:{label:'Taille',unit:'cm',min:30,max:250},thigh:{label:'Oberschenkel',unit:'cm',min:20,max:120}};
const parse=s=>new Date(s+'T12:00:00');
const fmt1=x=>(Math.round(x*10)/10).toLocaleString('de-DE');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const avg=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null;

function mondayOf(dateStr){
  const d=parse(dateStr),dow=(d.getDay()+6)%7;           // Montag = 0
  d.setDate(d.getDate()-dow+weekOffset*7);
  return d;
}
function weekData(){
  const start=mondayOf(selected),days=[];
  for(let i=0;i<7;i++){
    const t=new Date(start);t.setDate(start.getDate()+i);
    const date=datestr(t),d=db.days?.[date];
    const logged=!!d?.foods?.length;
    const a=logged?calc(d):null,fr=d?frame(d):null;
    const fib=logged&&window.GSFiber?window.GSFiber.fiberOfDay(d):null;
    days.push({date,t,d,logged,a,fr,
      fiber:fib?fib.grams:null,fiberPartial:fib?.partial,
      mins:(d?.activity||[]).reduce((n,x)=>n+num(x.mins),0),
      archive:!logged&&d?.archive&&d.archive.low!=null?(d.archive.low+d.archive.high)/2:null});
  }
  return {start,days};
}
function renderWeek(){
  const host=$('gsWeekCard');if(!host)return;
  const {start,days}=weekData(),logged=days.filter(x=>x.logged);
  const end=days[6].t,label=start.toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit'})+' – '+end.toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric'});
  const inRange=logged.filter(x=>x.a.kcal>=x.fr.low&&x.a.kcal<=x.fr.high).length;
  const proteinOk=logged.filter(x=>x.a.p>=settings.protein).length;
  const fiberDays=logged.filter(x=>x.fiber>0);
  const stat=(k,v,sub)=>'<div class="kpi"><div class="meta">'+k+'</div><div class="num" style="font-size:22px">'+v+'</div>'+(sub?'<div class="tiny">'+sub+'</div>':'')+'</div>';
  host.innerHTML='<div class="section-head"><h2>🗓 Woche</h2><span class="pill">'+esc(label)+'</span></div>'+
   '<div class="btnrow" style="margin:10px 0"><button type="button" class="btn second small" data-week="-1">‹ Woche zurück</button><button type="button" class="btn second small" data-week="0">Diese Woche</button><button type="button" class="btn second small" data-week="1">Woche vor ›</button></div>'+
   '<div class="kpis">'+
     stat('Ø Kalorien',logged.length?fmt(avg(logged.map(x=>x.a.kcal)))+' kcal':'—','an '+logged.length+' erfassten Tagen')+
     stat('Im Kalorienrahmen',logged.length?inRange+' / '+logged.length:'—','Tage')+
     stat('Ø Protein',logged.length?fmt(avg(logged.map(x=>x.a.p)))+' g':'—',logged.length?proteinOk+' Tage ≥ '+settings.protein+' g':'')+
     stat('Bewegung',fmt(days.reduce((n,x)=>n+x.mins,0))+' Min.','gesamt')+
     stat('Ø Ballaststoffe',fiberDays.length?fmt(avg(fiberDays.map(x=>x.fiber)))+' g':'—','Schätzung')+
   '</div>'+
   '<div style="margin-top:14px">'+days.map(x=>{
      const name=WD[x.t.getDay()]+' '+x.t.toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit'});
      const pct=x.logged?Math.min(100,100*x.a.kcal/x.fr.high):(x.archive?Math.min(100,100*x.archive/(frame(x.d||{}).high||1)):0);
      const val=x.logged?fmt(x.a.kcal)+' kcal':(x.archive?'≈ '+fmt(x.archive)+' kcal':'—');
      const flag=x.logged?(x.a.kcal<x.fr.low?'unter Rahmen':x.a.kcal>x.fr.high?'über Rahmen':'im Rahmen'):(x.archive?'Archiv-Schätzung':'nicht erfasst');
      return '<div class="trend-row" data-go-date="'+x.date+'" style="cursor:pointer"><span class="date" style="width:74px">'+name+'</span><div class="bar"><div class="fill" style="width:'+pct+'%;opacity:'+(x.logged?1:.5)+'"></div></div><b style="min-width:92px">'+val+'</b></div><div class="sub" style="margin:-4px 0 6px 86px;font-size:11px">'+
        flag+(x.logged?' · '+fmt(x.a.p)+' g P':'')+(x.mins?' · '+fmt(x.mins)+' Min. Bewegung':'')+'</div>';
   }).join('')+'</div>'+
   '<p class="sub" style="margin-bottom:0">Leere Tage zählen nicht in den Durchschnitt. Tippe auf einen Tag, um ihn zu öffnen.</p>';
}

/* ---------- Diagramm ---------- */
function series(key){
  const pts=[];
  for(const [date,d] of Object.entries(db.days||{})){
    const raw=d.measures?.[key];if(raw===''||raw==null)continue;
    const v=num(raw),m=METRICS[key];
    if(v>m.min&&v<m.max)pts.push({date,t:parse(date).getTime(),v});
  }
  return pts.sort((a,b)=>a.t-b.t);
}
function movingAverage(pts){
  return pts.map(p=>{const win=pts.filter(q=>q.t<=p.t&&q.t>p.t-7*DAY);return {...p,ma:avg(win.map(q=>q.v))}});
}
function renderChart(){
  const host=$('gsTrendCard');if(!host)return;
  const m=METRICS[metric],all=movingAverage(series(metric)),shown=all.slice(-60);
  const tabs=Object.entries(METRICS).map(([k,x])=>'<button type="button" class="btn small '+(k===metric?'':'second')+'" data-metric="'+k+'">'+x.label+'</button>').join('');
  let body;
  if(shown.length<2){
    body='<div class="empty">Mindestens zwei Messungen nötig. Trage Werte unter „Körper & Wohlbefinden“ ein.</div>';
  }else{
    const W=360,H=170,L=38,R=10,T=12,B=26;
    const t0=shown[0].t,t1=shown[shown.length-1].t,span=Math.max(t1-t0,DAY);
    const vals=shown.flatMap(p=>[p.v,p.ma]),lo=Math.floor(Math.min(...vals)-.5),hi=Math.ceil(Math.max(...vals)+.5),rng=Math.max(hi-lo,1);
    const x=t=>L+(t-t0)/span*(W-L-R),y=v=>T+(1-(v-lo)/rng)*(H-T-B);
    const line=shown.map((p,i)=>(i?'L':'M')+x(p.t).toFixed(1)+' '+y(p.ma).toFixed(1)).join(' ');
    const ticks=[lo,lo+rng/2,hi].map(v=>'<g><line x1="'+L+'" x2="'+(W-R)+'" y1="'+y(v)+'" y2="'+y(v)+'" stroke="var(--border)" stroke-width="1"/><text x="'+(L-6)+'" y="'+(y(v)+4)+'" text-anchor="end" font-size="10" fill="var(--muted)">'+fmt1(v)+'</text></g>').join('');
    const dots=shown.map(p=>'<circle cx="'+x(p.t).toFixed(1)+'" cy="'+y(p.v).toFixed(1)+'" r="3" fill="var(--green2)" stroke="var(--green)" stroke-width="1"><title>'+p.date+': '+fmt1(p.v)+' '+m.unit+'</title></circle>').join('');
    const d0=new Date(t0).toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit'}),d1=new Date(t1).toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit'});
    const last=shown[shown.length-1],ref=shown.find(p=>p.t>=last.t-14*DAY)||shown[0];
    const delta=last.ma-ref.ma;
    body='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+m.label+' im Verlauf mit 7-Tage-Schnitt" style="width:100%;height:auto;display:block">'+ticks+
      '<path d="'+line+'" fill="none" stroke="var(--green)" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>'+dots+
      '<text x="'+L+'" y="'+(H-6)+'" font-size="10" fill="var(--muted)">'+d0+'</text><text x="'+(W-R)+'" y="'+(H-6)+'" text-anchor="end" font-size="10" fill="var(--muted)">'+d1+'</text></svg>'+
      '<div class="mini-stats" style="margin-top:8px"><span>Aktuell <strong>'+fmt1(last.v)+' '+m.unit+'</strong></span><span>7-Tage-Schnitt <strong>'+fmt1(last.ma)+' '+m.unit+'</strong></span>'+
      (ref!==last?'<span>Letzte 14 Tage <strong>'+(delta>0?'+':'')+fmt1(delta)+' '+m.unit+'</strong></span>':'')+'</div>'+
      '<p class="sub" style="margin-bottom:0">Punkte = Einzelmessungen, Linie = gleitender 7-Tage-Schnitt. Tageswerte schwanken durch Wassereinlagerung, Salz und Zyklus – achte auf die Linie, nicht auf einzelne Punkte.</p>';
  }
  host.innerHTML='<div class="section-head"><h2>📈 Verlauf</h2></div><div class="btnrow" style="margin:10px 0">'+tabs+'</div>'+body;
}
function ensureUI(){
  const tab=$('tab-verlauf');if(!tab||$('gsWeekCard'))return !!$('gsWeekCard');
  const wrap=document.createElement('div');wrap.className='stack';wrap.style.marginBottom='16px';
  wrap.innerHTML='<article class="card" id="gsWeekCard"></article><article class="card" id="gsTrendCard"></article>';
  tab.insertBefore(wrap,tab.firstChild);
  wrap.addEventListener('click',e=>{
    const w=e.target.closest('[data-week]');
    if(w){const v=Number(w.dataset.week);weekOffset=v===0?0:weekOffset+v;renderWeek();return}
    const m=e.target.closest('[data-metric]');
    if(m){metric=m.dataset.metric;renderChart();return}
    const g=e.target.closest('[data-go-date]');
    if(g){selected=g.dataset.goDate;weekOffset=0;render();showTab('heute')}
  });
  return true;
}
function renderAll(){if(!ensureUI())return;renderWeek();renderChart()}
const baseTrend=window.renderTrend;
if(typeof baseTrend==='function'){
  window.renderTrend=function(){const r=baseTrend.apply(this,arguments);try{renderAll()}catch(e){console.error(e)}return r};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(ensureUI,0));else setTimeout(ensureUI,0);
window.GSTrends={renderAll,movingAverage,series};
})();
