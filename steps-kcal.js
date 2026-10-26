/* Get Shaped – Schritte in Kalorien umrechnen (Spaziergang, Walkingpad / Laufband, Stepper).
   Mit deiner Schrittlänge (Standard 60 cm) wird aus Schritten und – falls angegeben – Dauer die Gehgeschwindigkeit bestimmt;
   daraus ergibt sich der Mehrverbrauch über Ruhe (MET-Werte nach Compendium of Physical Activities, gerundet).
   Ohne Dauer wird sie aus der Schrittzahl und einer typischen Schrittfrequenz geschätzt. Alles bleibt eine grobe Schätzung. */
(() => {
'use strict';
const $=id=>document.getElementById(id);
const WALK_TYPES=['Spaziergang','Walkingpad / Laufband'];
const STEP_TYPES=[...WALK_TYPES,'Stepper'];
// Schritte pro Minute je Intensität (Annahme, wenn keine Dauer eingetragen ist)
const CADENCE={walk:{Leicht:90,Moderat:110,Intensiv:125},stepper:{Leicht:80,Moderat:100,Intensiv:120}};
// MET über Gehgeschwindigkeit (km/h): Stützpunkte, dazwischen linear
const SPEED_MET=[[2.5,2.3],[3.2,2.8],[4,3.0],[4.8,3.5],[5.6,4.3],[6.4,5.0],[7.2,7.0],[8.5,8.5]];
try{METS['Walkingpad / Laufband']=[2.8,3.8,6.0]}catch(_){}

const stepLen=()=>{const v=Number(settings?.stepLengthCm);return v>=30&&v<=120?v:60};
const intensityOf=a=>['Leicht','Moderat','Intensiv'].includes(a.intensity)?a.intensity:'Moderat';
function metFromSpeed(v){
  const t=SPEED_MET;if(v<=t[0][0])return t[0][1];if(v>=t[t.length-1][0])return t[t.length-1][1];
  for(let i=1;i<t.length;i++)if(v<=t[i][0]){const [x0,y0]=t[i-1],[x1,y1]=t[i];return y0+(y1-y0)*(v-x0)/(x1-x0)}
  return 3.5;
}
// Ergebnis {mins, met, km, speed, estimated} oder null, wenn die normale Berechnung gelten soll.
function derive(a){
  const type=String(a?.type||'').trim();
  if(!STEP_TYPES.includes(type))return null;
  const steps=Number(a.steps),mins=Number(a.mins);
  if(!(steps>0)||steps>100000)return null;
  const km=steps*stepLen()/100000;                                  // Schritte × cm → km
  if(WALK_TYPES.includes(type)){
    if(mins>0){
      const speed=km/(mins/60);
      if(speed<1.5||speed>9)return null;
      return {mins,met:metFromSpeed(speed),km,speed,estimated:false};
    }
    const cad=CADENCE.walk[intensityOf(a)],m=steps/cad,speed=km/(m/60);
    return {mins:m,met:metFromSpeed(speed),km,speed,estimated:true};
  }
  if(mins>0)return null;                                            // Stepper mit Dauer: normale Berechnung über Intensität
  const levels=METS['Stepper'],idx={Leicht:0,Moderat:1,Intensiv:2}[intensityOf(a)];
  return {mins:steps/CADENCE.stepper[intensityOf(a)],met:levels[idx],km,speed:null,estimated:true};
}
const baseBurn=window.activityBurn;
window.activityBurn=function(a,weight){
  const d=derive(a);
  if(d)return Math.max(0,Math.round((d.met-1)*3.5*weight/200*d.mins));
  return baseBurn.apply(this,arguments);
};
// Tagesart automatisch erkennen: Schritte ohne Dauer zählen mit der geschätzten Dauer; Walkingpad zählt wie Spaziergang.
const baseAuto=window.autoDayType;
window.autoDayType=function(d){
  const acts=(d.activity||[]).map(a=>{
    const x=derive(a),type=a.type==='Walkingpad / Laufband'?'Spaziergang':a.type;
    return {...a,type,mins:Number(a.mins)>0?a.mins:(x?Math.round(x.mins):a.mins)};
  });
  return baseAuto({...d,activity:acts});
};

const fmt1=x=>(Math.round(x*10)/10).toLocaleString('de-DE');
function decorate(){
  const host=$('activityEntries');if(!host)return;
  const list=[...(day().activity||[])].reverse();
  host.querySelectorAll('.entry').forEach((el,i)=>{
    const a=list[i];if(!a||el.querySelector('.gs-stepinfo'))return;
    const d=derive(a);if(!d)return;
    const detail=el.querySelector('.entry-detail');if(!detail)return;
    const info=document.createElement('div');info.className='gs-stepinfo';info.style.marginTop='4px';
    if(a.type==='Stepper'){info.textContent='ca. '+Math.round(d.mins)+' Min. geschätzt (Schritte ÷ typische Schrittfrequenz am Stepper)';detail.appendChild(info);return}
    info.textContent='≈ '+fmt1(d.km)+' km bei '+stepLen()+' cm Schrittlänge'+(d.estimated?' · ca. '+Math.round(d.mins)+' Min. geschätzt'+(d.speed?' ('+fmt1(d.speed)+' km/h)':''):' · '+fmt1(d.speed)+' km/h');
    detail.appendChild(info);
  });
}
const baseRender=window.render;
if(typeof baseRender==='function')window.render=function(){const r=baseRender.apply(this,arguments);try{decorate()}catch(e){console.error(e)}return r};

function setup(){
  // Hinweistext zur Bewegung anpassen
  document.querySelectorAll('#tab-heute .sub').forEach(p=>{
    if(/Schrittzahlen ohne Zeit/.test(p.textContent))p.textContent='Dauer ODER Schritte genügen: Bei Spaziergang, Walkingpad / Laufband und Stepper rechne ich Schritte mit deiner Schrittlänge in verbrannte kcal um (grobe Schätzung). Mit Dauer und Schritten wird die Gehgeschwindigkeit berücksichtigt.';
  });
  const grid=document.querySelector('#tab-einstellungen .grid');
  if(grid&&!$('gsStepCard')){
    const card=document.createElement('article');card.className='card';card.id='gsStepCard';
    card.innerHTML='<h2>👣 Schrittlänge</h2><p class="sub">Damit werden Schritte in Strecke und verbrannte Kalorien umgerechnet.</p><div class="field"><label class="label" for="gsStepLen">Schrittlänge (cm)</label><input id="gsStepLen" type="number" inputmode="numeric" min="30" max="120" step="1"/></div><button type="button" class="btn second" id="gsStepSave" style="width:100%">Speichern</button>';
    grid.appendChild(card);
    $('gsStepLen').value=stepLen();
    $('gsStepSave').onclick=()=>{
      const v=Number($('gsStepLen').value);
      if(!(v>=30&&v<=120)){toast('Bitte eine Schrittlänge zwischen 30 und 120 cm angeben.');return}
      settings.stepLengthCm=Math.round(v);try{localStorage.setItem(CONFIG,JSON.stringify(settings))}catch(_){}
      render();toast('Schrittlänge gespeichert ✓');
    };
  }
  try{render()}catch(_){}
}
window.GSSteps={derive,stepLen,metFromSpeed};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(setup,240));else setTimeout(setup,240);
})();
