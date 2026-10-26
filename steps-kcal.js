/* Get Shaped – Schritte in Kalorien umrechnen (Spaziergang, Walkingpad / Laufband, Stepper).
   Einträge mit Dauer werden wie bisher berechnet. Trägst du NUR Schritte ein, wird die Dauer aus deiner eigenen Schrittfrequenz
   (Median deiner Einträge mit Dauer und Schritten) bzw. einer Standardannahme geschätzt und dann wie jeder Eintrag mit Dauer gerechnet.
   Die Schrittlänge dient nur der Anzeige der Strecke. Alles bleibt eine grobe Schätzung. */
(() => {
'use strict';
const $=id=>document.getElementById(id);
const WALK_TYPES=['Spaziergang','Walkingpad / Laufband'];
const STEP_TYPES=[...WALK_TYPES,'Stepper'];
// Schritte pro Minute je Intensität (Annahme, wenn keine Dauer eingetragen ist)
const CADENCE={walk:{Leicht:90,Moderat:110,Intensiv:125},stepper:{Leicht:90,Moderat:110,Intensiv:130}};   // echte Schritte pro Minute
try{METS['Walkingpad / Laufband']=[2.8,3.8,6.0]}catch(_){}

const stepLen=()=>{const v=Number(settings?.stepLengthCm);return v>=30&&v<=120?v:60};
// Viele Stepper zählen nur jeden zweiten Schritt (links + rechts = 1). Standard: ja, abschaltbar.
const stepperFactor=()=>settings?.stepperCountsHalf===false?1:2;
const intensityOf=a=>['Leicht','Moderat','Intensiv'].includes(a.intensity)?a.intensity:'Moderat';
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
// Nur für Einträge OHNE Dauer: Dauer = Schritte ÷ Schrittfrequenz, Verbrauch dann wie bei jedem Eintrag mit Dauer (MET nach Intensität).
// Einträge mit Dauer (auch mit Schritten) bleiben unverändert (normale Berechnung).
function derive(a){
  const type=String(a?.type||'').trim();
  if(!STEP_TYPES.includes(type))return null;
  const steps=Number(a.steps),mins=Number(a.mins);
  if(!(steps>0)||steps>100000||mins>0)return null;
  const int=intensityOf(a),personal=personalCadence(type),idx={Leicht:0,Moderat:1,Intensiv:2}[int];
  const source=personal?'deinen bisherigen Einträgen ('+personal.n+')':'Standardannahme';
  const met=(METS[type]||METS.Sonstiges)[idx];
  if(WALK_TYPES.includes(type)){
    const def=CADENCE.walk,cad=personal?personal.cad*def[int]/def.Moderat:def[int];
    return {mins:steps/cad,met,km:steps*stepLen()/100000,estimated:true,steps,source};
  }
  // Stepper: Frequenz in GEZÄHLTEN Schritten pro Minute: eigene Einträge, sonst typische echte Frequenz geteilt durch den Zählfaktor.
  const def=CADENCE.stepper,counted=personal?personal.cad*def[int]/def.Moderat:def[int]/stepperFactor();
  return {mins:steps/counted,met,km:0,estimated:true,steps:steps*stepperFactor(),source};
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
    const detail=el.querySelector('.entry-detail');if(!detail)return;
    const d=derive(a),steps=Number(a.steps);
    let text='';
    if(a.type==='Stepper'){
      if(d)text=(stepperFactor()===2?'gezählt '+Math.round(steps).toLocaleString('de-DE')+' ≈ '+Math.round(d.steps).toLocaleString('de-DE')+' echte Schritte · ':'')+'ca. '+Math.round(d.mins)+' Min. geschätzt (nach '+d.source+')';
    }else if(WALK_TYPES.includes(a.type)&&steps>0){
      text='≈ '+fmt1(steps*stepLen()/100000)+' km bei '+stepLen()+' cm Schrittlänge'+(d?' · ca. '+Math.round(d.mins)+' Min. geschätzt (nach '+d.source+')':'');
    }
    if(!text)return;
    const info=document.createElement('div');info.className='gs-stepinfo';info.style.marginTop='4px';info.textContent=text;
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
    if(/Schrittzahlen ohne Zeit/.test(p.textContent))p.textContent='Dauer ODER Schritte genügen: Einträge mit Dauer rechne ich wie bisher. Trägst du bei Spaziergang, Walkingpad / Laufband oder Stepper nur Schritte ein, schätze ich die Dauer aus deiner üblichen Schrittfrequenz und berechne daraus die verbrannten kcal (grobe Schätzung).';
  });
  const grid=document.querySelector('#tab-einstellungen .grid');
  if(grid&&!$('gsStepCard')){
    const card=document.createElement('article');card.className='card';card.id='gsStepCard';
    card.innerHTML='<h2>👣 Schritte & Stepper</h2><p class="sub">Die Schrittlänge dient der Streckenanzeige. Die Kalorien rechne ich aus Dauer und Intensität; bei reinen Schrittzahlen aus der geschätzten Dauer.</p>'+
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
window.GSSteps={derive,stepLen};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(setup,240));else setTimeout(setup,240);
})();
