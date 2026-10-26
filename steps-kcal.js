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
const CADENCE={walk:{Leicht:90,Moderat:110,Intensiv:125},stepper:{Leicht:90,Moderat:110,Intensiv:130}};   // echte Schritte pro Minute
// MET über Gehgeschwindigkeit (km/h): Stützpunkte, dazwischen linear
const SPEED_MET=[[2.5,2.3],[3.2,2.8],[4,3.0],[4.8,3.5],[5.6,4.3],[6.4,5.0],[7.2,7.0],[8.5,8.5]];
try{METS['Walkingpad / Laufband']=[2.8,3.8,6.0]}catch(_){}

const stepLen=()=>{const v=Number(settings?.stepLengthCm);return v>=30&&v<=120?v:60};
// Viele Stepper zählen nur jeden zweiten Schritt (links + rechts = 1). Standard: ja, abschaltbar.
const stepperFactor=()=>settings?.stepperCountsHalf===false?1:2;
const intensityOf=a=>['Leicht','Moderat','Intensiv'].includes(a.intensity)?a.intensity:'Moderat';
function metFromSpeed(v){
  const t=SPEED_MET;if(v<=t[0][0])return t[0][1];if(v>=t[t.length-1][0])return t[t.length-1][1];
  for(let i=1;i<t.length;i++)if(v<=t[i][0]){const [x0,y0]=t[i-1],[x1,y1]=t[i];return y0+(y1-y0)*(v-x0)/(x1-x0)}
  return 3.5;
}
// Eigene Schrittfrequenz aus bisherigen Einträgen mit Dauer UND Schritten (Median, mindestens 3 Einträge).
function personalCadence(type){
  const v=[];let days={};try{days=db.days||{}}catch(_){}
  for(const d of Object.values(days))for(const a of d.activity||[]){
    if(String(a.type||'').trim()!==type)continue;
    const m=Number(a.mins),st=Number(a.steps);
    if(m>=5&&st>0){const c=st/m;if(c>=15&&c<=220)v.push(c)}
  }
  if(v.length<3)return null;
  v.sort((x,y)=>x-y);const mid=Math.floor(v.length/2);
  return {cad:v.length%2?v[mid]:(v[mid-1]+v[mid])/2,n:v.length};
}
// Ergebnis {mins, met, km, speed, estimated, steps(real), source} oder null, wenn die normale Berechnung gelten soll.
function derive(a){
  const type=String(a?.type||'').trim();
  if(!STEP_TYPES.includes(type))return null;
  const steps=Number(a.steps),mins=Number(a.mins);
  if(!(steps>0)||steps>100000)return null;
  const int=intensityOf(a),personal=personalCadence(type);
  if(WALK_TYPES.includes(type)){
    const km=steps*stepLen()/100000;                                  // Schritte × cm → km
    if(mins>0){
      const speed=km/(mins/60);
      if(speed<1.5||speed>9)return null;
      return {mins,met:metFromSpeed(speed),km,speed,estimated:false,steps};
    }
    const def=CADENCE.walk,cad=personal?personal.cad*def[int]/def.Moderat:def[int],m=steps/cad,speed=km/(m/60);
    return {mins:m,met:metFromSpeed(speed),km,speed,estimated:true,steps,source:personal?'deinen bisherigen Einträgen ('+personal.n+')':'Standardannahme'};
  }
  if(mins>0)return null;                                            // Stepper mit Dauer: normale Berechnung über Intensität
  const levels=METS['Stepper'],idx={Leicht:0,Moderat:1,Intensiv:2}[int],def=CADENCE.stepper;
  // Frequenz in GEZÄHLTEN Schritten pro Minute: eigene Einträge, sonst typische echte Frequenz geteilt durch den Zählfaktor.
  const counted=personal?personal.cad*def[int]/def.Moderat:def[int]/stepperFactor();
  return {mins:steps/counted,met:levels[idx],km:0,speed:null,estimated:true,steps:steps*stepperFactor(),source:personal?'deinen bisherigen Einträgen ('+personal.n+')':'Standardannahme'};
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
    if(a.type==='Stepper'){
      info.textContent=(stepperFactor()===2?'gezählt '+Math.round(a.steps).toLocaleString('de-DE')+' ≈ '+Math.round(d.steps).toLocaleString('de-DE')+' echte Schritte · ':'')+'ca. '+Math.round(d.mins)+' Min. geschätzt'+(d.source?' (nach '+d.source+')':'');
      detail.appendChild(info);return;
    }
    info.textContent='≈ '+fmt1(d.km)+' km bei '+stepLen()+' cm Schrittlänge'+(d.estimated?' · ca. '+Math.round(d.mins)+' Min. geschätzt'+(d.speed?' ('+fmt1(d.speed)+' km/h'+(d.source?', nach '+d.source:'')+')':''):' · '+fmt1(d.speed)+' km/h');
    detail.appendChild(info);
  });
}
const baseRender=window.render;
if(typeof baseRender==='function')window.render=function(){const r=baseRender.apply(this,arguments);try{decorate()}catch(e){console.error(e)}return r};

function renderStats(){
  const el=$('gsStepStats');if(!el)return;
  const rows=STEP_TYPES.map(t=>{const p=personalCadence(t);return p?'<div>'+t+': Ø <b>'+Math.round(p.cad)+' gezählte Schritte/Min.</b> aus '+p.n+' Einträgen mit Dauer und Schritten</div>':''}).filter(Boolean);
  let entries=0;try{for(const d of Object.values(db.days||{}))for(const a of d.activity||[])if(derive(a))entries++}catch(_){}
  el.innerHTML=(rows.length?'<b>Aus deinen bisherigen Einträgen:</b>'+rows.join('')+'Diese Frequenz nutze ich, wenn du künftig nur Schritte ohne Dauer einträgst. ':'Sobald du mindestens 3 Einträge mit Dauer <i>und</i> Schritten hast, lerne ich deine eigene Schrittfrequenz. ')+
    (entries?'<br>'+entries+' bisherige Einträge werden mit diesen Werten berechnet.':'');
}
function setup(){
  // Hinweistext zur Bewegung anpassen
  document.querySelectorAll('#tab-heute .sub').forEach(p=>{
    if(/Schrittzahlen ohne Zeit/.test(p.textContent))p.textContent='Dauer ODER Schritte genügen: Bei Spaziergang, Walkingpad / Laufband und Stepper rechne ich Schritte mit deiner Schrittlänge in verbrannte kcal um (grobe Schätzung). Mit Dauer und Schritten wird die Gehgeschwindigkeit berücksichtigt.';
  });
  const grid=document.querySelector('#tab-einstellungen .grid');
  if(grid&&!$('gsStepCard')){
    const card=document.createElement('article');card.className='card';card.id='gsStepCard';
    card.innerHTML='<h2>👣 Schritte & Stepper</h2><p class="sub">Damit werden Schritte in Strecke und verbrannte Kalorien umgerechnet.</p>'+
      '<div class="field"><label class="label" for="gsStepLen">Schrittlänge (cm)</label><input id="gsStepLen" type="number" inputmode="numeric" min="30" max="120" step="1"/></div>'+
      '<div id="gsStepHint" class="hint" style="margin-bottom:10px"></div>'+
      '<div class="fieldrow"><div class="field"><label class="label" for="gsCalKm">Bekannte Strecke (km)</label><input id="gsCalKm" type="number" inputmode="decimal" step="any" placeholder="z. B. 3,2"/></div><div class="field"><label class="label" for="gsCalSteps">Dafür gezählte Schritte</label><input id="gsCalSteps" type="number" inputmode="numeric" placeholder="z. B. 5000"/></div></div>'+
      '<button type="button" class="btn second" id="gsCalGo" style="width:100%;margin-bottom:10px">Schrittlänge aus Strecke berechnen</button>'+
      '<label class="opt" style="margin:6px 0 12px"><input type="checkbox" id="gsStepperHalf"/> <span>Mein Stepper zählt nur <b>jeden zweiten Schritt</b> (links + rechts = 1)</span></label>'+
      '<button type="button" class="btn" id="gsStepSave" style="width:100%">Speichern</button>'+
      '<div id="gsStepStats" class="sub" style="margin-top:12px"></div>';
    grid.appendChild(card);
    $('gsStepLen').value=stepLen();$('gsStepperHalf').checked=stepperFactor()===2;
    const h=Number(knowledge?.profile?.heightCm);
    $('gsStepHint').innerHTML=(h>100&&h<230?'Richtwert aus deiner Körpergröße ('+h+' cm): etwa <b>'+Math.round(h*0.415)+' cm</b> (0,415 × Größe). <button type="button" class="btn small ghost" id="gsStepFromHeight">Übernehmen</button><br>':'')+
      'Am genauesten: eine bekannte Strecke gehen (z. B. Walkingpad-Anzeige in km) und Schritte zählen, dann unten berechnen.';
    $('gsStepFromHeight')?.addEventListener('click',()=>{$('gsStepLen').value=Math.round(h*0.415)});
    $('gsCalGo').onclick=()=>{
      const km=Number(String($('gsCalKm').value).replace(',','.')),st=Number($('gsCalSteps').value);
      if(!(km>0&&st>0)){toast('Bitte Strecke und Schritte eintragen.');return}
      const cm=Math.round(km*100000/st);
      if(cm<30||cm>120){toast('Ergibt '+cm+' cm – das ist unplausibel. Bitte Werte prüfen.');return}
      $('gsStepLen').value=cm;toast('Schrittlänge ≈ '+cm+' cm – zum Übernehmen „Speichern“ tippen');
    };
    $('gsStepSave').onclick=()=>{
      const v=Number($('gsStepLen').value);
      if(!(v>=30&&v<=120)){toast('Bitte eine Schrittlänge zwischen 30 und 120 cm angeben.');return}
      settings.stepLengthCm=Math.round(v);settings.stepperCountsHalf=$('gsStepperHalf').checked;
      try{localStorage.setItem(CONFIG,JSON.stringify(settings))}catch(_){}
      render();renderStats();toast('Gespeichert ✓ – bisherige Einträge sind neu berechnet');
    };
    renderStats();
  }
  try{render()}catch(_){}
}
window.GSSteps={derive,stepLen,metFromSpeed};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(setup,240));else setTimeout(setup,240);
})();
