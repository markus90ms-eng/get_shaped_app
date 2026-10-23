/* Get Shaped – Apple-Health-Werte per Kurzbefehl übernehmen.
   Der Kurzbefehl öffnet: <App-Adresse>#health?weight=60.2&steps=8421&sleep=7.5[&waist=66.5][&date=JJJJ-MM-TT]
   Alles läuft lokal im Browser; es werden keine Daten an Server gesendet. */
(() => {
'use strict';
const $=id=>document.getElementById(id);
const STEP_TYPE='Schritte (Apple Health)';
const clean=v=>{if(v==null||v==='')return NaN;const n=Number(String(v).replace(',','.'));return Number.isFinite(n)?n:NaN};

function parseHash(){
  const h=location.hash||'';
  if(!/^#health\?/.test(h))return null;
  const q=new URLSearchParams(h.slice('#health?'.length));
  return {date:q.get('date')||'',weight:clean(q.get('weight')),waist:clean(q.get('waist')),steps:clean(q.get('steps')),sleep:clean(q.get('sleep'))};
}
function fmt(n){return String(Math.round(n*100)/100).replace('.',',')}
function importValues(v){
  const date=/^\d{4}-\d{2}-\d{2}$/.test(v.date)?v.date:datestr(new Date());
  const keep=selected;selected=date;
  const d=day(),done=[];
  d.measures=d.measures||{};
  if(v.weight>30&&v.weight<300){d.measures.weight=String(v.weight);done.push('Gewicht '+fmt(v.weight)+' kg')}
  if(v.waist>30&&v.waist<250){d.measures.waist=String(v.waist);done.push('Taille '+fmt(v.waist)+' cm')}
  if(v.steps>=0&&v.steps<200000){
    d.activity=(d.activity||[]).filter(a=>a.type!==STEP_TYPE);
    d.activity.push({id:uuid(),type:STEP_TYPE,mins:0,steps:Math.round(v.steps),intensity:'Leicht',note:'Aus Apple Health'});
    done.push(Math.round(v.steps).toLocaleString('de-DE')+' Schritte');
  }
  if(v.sleep>0&&v.sleep<24){
    const text='Schlaf '+fmt(v.sleep)+' h';
    const feel=String(d.measures.feel||'');
    d.measures.feel=/Schlaf [\d,]+ h/.test(feel)?feel.replace(/Schlaf [\d,]+ h/,text):(feel?feel+' · ':'')+text;
    done.push(text);
  }
  persist();
  selected=keep;
  return {date,done};
}
function run(){
  const v=parseHash();if(!v)return;
  history.replaceState(null,'',location.pathname+location.search);
  const r=importValues(v);
  render();
  toast(r.done.length?'Aus Health übernommen ('+r.date.split('-').reverse().join('.')+'): '+r.done.join(', '):'Keine gültigen Health-Werte im Link.');
}
function setupHelp(){
  const grid=document.querySelector('#tab-einstellungen .grid');
  if(!grid||$('gsHealthCard'))return;
  const base=location.origin+location.pathname;
  const card=document.createElement('article');card.className='card';card.id='gsHealthCard';
  card.innerHTML='<h2>❤️ Apple Health per Kurzbefehl</h2>'+
   '<p class="sub">Webseiten dürfen Apple Health nicht direkt lesen. Mit der Kurzbefehle-App bekommst du Gewicht, Schritte und Schlaf trotzdem automatisch in die App:</p>'+
   '<ol class="sub" style="padding-left:18px;line-height:1.6"><li>Kurzbefehle → neuer Kurzbefehl.</li><li>„Health-Werte finden“: Körpergewicht (zuletzt 1), Schritte (Summe heute), Schlafanalyse (Dauer).</li><li>„Text“-Aktion mit dem Link unten, die Platzhalter durch die Health-Werte ersetzen.</li><li>„URLs öffnen“ anhängen. Optional als Automation jeden Abend ausführen.</li></ol>'+
   '<label class="label" for="gsHealthLink">Link-Vorlage</label><input id="gsHealthLink" readonly value="'+base+'#health?weight=GEWICHT&steps=SCHRITTE&sleep=SCHLAF_STUNDEN"/>'+
   '<button type="button" class="btn second" id="gsHealthCopy" style="margin-top:8px;width:100%">Link kopieren</button>'+
   '<p class="sub" style="margin-bottom:0">Optional: <code>&amp;waist=</code> (Taille in cm) und <code>&amp;date=JJJJ-MM-TT</code>. Vorhandene Werte des Tages werden überschrieben, Schritte nicht doppelt gezählt.</p>';
  grid.appendChild(card);
  $('gsHealthCopy').onclick=async()=>{try{await navigator.clipboard.writeText($('gsHealthLink').value);toast('Link kopiert ✓')}catch(_){$('gsHealthLink').select();toast('Bitte Link manuell kopieren')}};
}
window.GSHealth={parseHash,importValues};
const start=()=>{try{setupHelp();run()}catch(e){console.error(e)}};
window.addEventListener('hashchange',()=>{try{run()}catch(e){console.error(e)}});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(start,60));else setTimeout(start,60);
})();
