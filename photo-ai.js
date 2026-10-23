/* Get Shaped – Foto-Analyse über ein eigenes Backend (siehe worker/README.md).
   Das Backend erkennt Lebensmittel und schätzt Gramm; die Nährwerte rechnet weiterhin die App aus ihrer Tabelle. */
(() => {
'use strict';
const $=id=>document.getElementById(id);
const URL_KEY='get_shaped_photo_backend',CONSENT_KEY='get_shaped_photo_consent';
const read=k=>{try{return localStorage.getItem(k)||''}catch(_){return ''}};
const write=(k,v)=>{try{localStorage.setItem(k,v)}catch(_){}};
const REFS=[['','Kein Referenzobjekt'],['Teller, Durchmesser ca. 26 cm','Teller (26 cm)'],['Teller, Durchmesser ca. 22 cm','Teller (22 cm)'],['1-Euro-Münze (23,25 mm)','1-€-Münze'],['Kreditkarte (85,6 × 54 mm)','Kreditkarte'],['Esslöffel','Esslöffel'],['Hand / Faust','Hand / Faust']];

function backendUrl(){return read(URL_KEY).trim()}
function confirmPrivacy(){
  if(read(CONSENT_KEY)==='1')return true;
  const ok=confirm('Datenschutz-Hinweis\n\nDas Foto wird an dein eigenes Backend und von dort zur Analyse an die Anthropic-API gesendet. Es wird nicht in der App-Historie weitergegeben. Fortfahren?');
  if(ok)write(CONSENT_KEY,'1');
  return ok;
}
async function analyze(original){
  const url=backendUrl();
  if(!url)return original?.();
  const photos=[pendingPhoto,pendingPhotoSide].filter(Boolean);
  if(!photos.length){toast('Bitte zuerst ein Foto aufnehmen oder auswählen.');return}
  if(!confirmPrivacy())return;
  const btn=$('analyzePhoto'),warn=$('aiWarning'),label=btn.textContent;
  btn.disabled=true;btn.textContent='✦ Analysiere …';warn.classList.add('hidden');
  const ctl=new AbortController(),t=setTimeout(()=>ctl.abort(),45000);
  try{
    const r=await fetch(url,{method:'POST',signal:ctl.signal,headers:{'Content-Type':'application/json','X-App-Token':localStorage.getItem(TOK)||''},
      body:JSON.stringify({images:photos,hint:$('foodName').value.trim(),reference:$('gsPhotoRef')?.value||''})});
    const body=await r.json().catch(()=>({}));
    if(!r.ok)throw Error(body.error||'Server '+r.status);
    if(!body.items?.length)throw Error('Auf dem Foto wurden keine Lebensmittel erkannt');
    const text=body.items.map(i=>i.grams+' '+i.unit+' '+i.name).join(', ');
    $('quickSpeech').value=text;
    $('quickSpeech').dispatchEvent(new Event('input',{bubbles:true}));       // startet die lokale Nährwert-Berechnung
    const low=body.items.filter(i=>i.confidence==='niedrig').map(i=>i.name);
    warn.textContent='KI-Schätzung der Mengen – bitte prüfen und im Textfeld anpassen. Die Nährwerte kommen aus deiner Lebensmitteltabelle.'+
      (body.uncertainty?' Unsicher: '+body.uncertainty:'')+(low.length?' Niedrige Sicherheit: '+low.join(', ')+'.':'');
    warn.classList.remove('hidden');
    toast('Foto analysiert – Mengen bitte prüfen');
  }catch(e){
    warn.textContent='Foto-Analyse nicht möglich: '+(e.name==='AbortError'?'Zeitüberschreitung':e.message)+'. Du kannst die Mahlzeit auch per Text eintragen.';
    warn.classList.remove('hidden');
  }finally{clearTimeout(t);btn.disabled=false;btn.textContent=label}
}
function setup(){
  const btn=$('analyzePhoto');if(!btn||$('gsPhotoRef'))return;
  const original=btn.onclick;
  const sel=document.createElement('select');sel.id='gsPhotoRef';sel.setAttribute('aria-label','Referenzobjekt im Foto');sel.style.cssText='width:auto;flex:1 1 150px;font-size:13px';
  sel.innerHTML=REFS.map(([v,l])=>'<option value="'+v+'">'+l+'</option>').join('');
  btn.insertAdjacentElement('afterend',sel);
  btn.onclick=()=>analyze(original);
  const grid=document.querySelector('#tab-einstellungen .grid');
  if(grid&&!$('gsPhotoBackendCard')){
    const card=document.createElement('article');card.className='card';card.id='gsPhotoBackendCard';
    card.innerHTML='<h2>📷 Foto-Analyse (Backend)</h2><p class="sub">Trage hier die Adresse deines eigenen Backends ein (Anleitung: <code>worker/README.md</code> im Repo). Den Zugangscode gibst du oben unter „Optionale Foto-KI“ ein. Ohne Adresse bleibt „Foto prüfen“ eine reine Foto-Ablage.</p>'+
      '<div class="field"><label class="label" for="gsBackendUrl">Backend-Adresse</label><input id="gsBackendUrl" type="url" placeholder="https://get-shaped-photo.<name>.workers.dev" value="'+read(URL_KEY).replace(/"/g,'&quot;')+'"/></div>'+
      '<button type="button" class="btn second" id="gsBackendSave" style="width:100%">Adresse speichern</button>'+
      '<p class="warnline" style="margin-bottom:0">Fotos werden bei Nutzung an dein Backend und die Anthropic-API übertragen; Kosten entstehen pro Analyse.</p>';
    grid.appendChild(card);
    $('gsBackendSave').onclick=()=>{
      const v=$('gsBackendUrl').value.trim();
      if(v&&!/^https:\/\//.test(v)){toast('Die Adresse muss mit https:// beginnen.');return}
      write(URL_KEY,v);toast(v?'Backend gespeichert ✓':'Backend entfernt');
    };
  }
}
window.GSPhotoAI={analyze};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(setup,70));else setTimeout(setup,70);
})();
