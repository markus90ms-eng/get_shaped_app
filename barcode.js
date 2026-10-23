/* Get Shaped – Barcode-Scanner: Kamera oder Foto lesen, Nährwerte aus Open Food Facts holen und in die Mahlzeit übernehmen. */
(() => {
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const r1=x=>Math.round(x*10)/10;
const API='https://world.openfoodfacts.org/api/v2/product/';
let stream=null,reader=null,product=null,scanning=false,zxingPromise=null;

function loadZXing(){
  if(window.ZXing)return Promise.resolve(window.ZXing);
  zxingPromise=zxingPromise||new Promise((res,rej)=>{
    const s=document.createElement('script');s.src='./vendor/zxing.min.js';
    s.onload=()=>window.ZXing?res(window.ZXing):rej(Error('Scanner-Bibliothek defekt'));
    s.onerror=()=>{zxingPromise=null;rej(Error('Scanner-Bibliothek konnte nicht geladen werden (offline?)'))};
    document.head.appendChild(s);
  });
  return zxingPromise;
}
const validCode=c=>/^\d{8}$|^\d{12,14}$/.test(c);
// Prüfziffer für EAN-8/UPC-A/EAN-13/GTIN-14 – verhindert falsche Treffer durch Lesefehler.
function checkDigitOk(code){
  const d=code.split('').map(Number),last=d.pop();
  const sum=d.reverse().reduce((a,x,i)=>a+x*(i%2===0?3:1),0);
  return (10-sum%10)%10===last;
}

/* ---------- Open Food Facts ---------- */
function energyKcal(n){
  let k=Number(n['energy-kcal_100g']);
  if(!Number.isFinite(k)){const kj=Number(n['energy_100g']??n['energy-kj_100g']);if(Number.isFinite(kj))k=kj/4.184}
  return k;
}
async function lookup(code){
  const ctl=new AbortController(),t=setTimeout(()=>ctl.abort(),12000);
  try{
    const r=await fetch(API+code+'.json?fields=product_name,product_name_de,brands,nutriments,serving_quantity,quantity',{signal:ctl.signal,headers:{Accept:'application/json'}});
    if(!r.ok)throw Error('Server '+r.status);
    const data=await r.json();
    if(data.status!==1||!data.product)return {notFound:true};
    const p=data.product,n=p.nutriments||{};
    const name=String(p.product_name_de||p.product_name||'').trim();
    const item={code,name:name||'Unbekanntes Produkt',brand:String(p.brands||'').split(',')[0].trim(),
      kcal:energyKcal(n),p:Number(n.proteins_100g),c:Number(n.carbohydrates_100g),f:Number(n.fat_100g),
      fiber:n.fiber_100g===undefined?NaN:Number(n.fiber_100g),
      unit:/\bml\b|\bl\b/i.test(String(p.quantity||''))?'ml':'g',
      serving:Number(p.serving_quantity)>0?Number(p.serving_quantity):null};
    item.complete=[item.kcal,item.p,item.c,item.f].every(Number.isFinite)&&item.kcal>=0&&item.kcal<=950;
    return item;
  }finally{clearTimeout(t)}
}

/* ---------- Oberfläche ---------- */
function overlay(){
  let el=$('gsScanner');if(el)return el;
  el=document.createElement('div');el.id='gsScanner';
  el.style.cssText='position:fixed;inset:0;z-index:200;background:rgba(10,20,17,.94);display:none;overflow:auto;padding:16px;color:#fff';
  el.innerHTML='<div style="max-width:520px;margin:0 auto">'+
    '<div class="section-head" style="margin-bottom:10px"><h2 style="margin:0;color:#fff">▮▯▮ Barcode scannen</h2><button type="button" class="btn small second" id="gsScanClose">Schließen</button></div>'+
    '<video id="gsScanVideo" playsinline muted style="width:100%;border-radius:16px;background:#000;max-height:46vh;object-fit:cover"></video>'+
    '<p class="hint" id="gsScanStatus" style="margin:10px 0">Halte den Barcode ruhig in das Bild.</p>'+
    '<div class="fieldrow"><div class="field"><label class="label" style="color:#cfe0d6" for="gsScanManual">Oder Nummer eintippen</label><input id="gsScanManual" inputmode="numeric" placeholder="z. B. 4006381333931"/></div><div class="field" style="align-self:end"><button type="button" class="btn" id="gsScanGo" style="width:100%">Suchen</button></div></div>'+
    '<label class="btn second" for="gsScanPhoto" style="display:block;text-align:center;cursor:pointer;margin-bottom:10px">📷 Foto vom Barcode aufnehmen</label><input id="gsScanPhoto" type="file" accept="image/*" capture="environment" style="display:none"/>'+
    '<div id="gsScanResult"></div></div>';
  document.body.appendChild(el);
  el.querySelector('#gsScanClose').onclick=close;
  el.querySelector('#gsScanGo').onclick=()=>handle(el.querySelector('#gsScanManual').value.replace(/\D/g,''));
  el.querySelector('#gsScanManual').addEventListener('keydown',e=>{if(e.key==='Enter')el.querySelector('#gsScanGo').click()});
  el.querySelector('#gsScanPhoto').onchange=decodeFile;
  return el;
}
const status=(msg,warn=false)=>{const s=$('gsScanStatus');if(s){s.textContent=msg;s.className=warn?'warnline':'hint'}};
function stopCamera(){
  scanning=false;
  try{reader?.reset()}catch(_){}
  reader=null;
  if(stream){stream.getTracks().forEach(t=>t.stop());stream=null}
  const v=$('gsScanVideo');if(v)v.srcObject=null;
}
function close(){stopCamera();const el=$('gsScanner');if(el)el.style.display='none';document.body.style.overflow=''}

async function open(){
  const el=overlay();el.style.display='block';document.body.style.overflow='hidden';
  $('gsScanResult').innerHTML='';product=null;$('gsScanManual').value='';
  if(!navigator.mediaDevices?.getUserMedia){status('Kamera nicht verfügbar. Tippe die Nummer ein oder nimm ein Foto vom Barcode auf.',true);return}
  try{
    status('Kamera wird gestartet …');
    const ZX=await loadZXing();
    reader=new ZX.BrowserMultiFormatReader(new Map([[ZX.DecodeHintType.POSSIBLE_FORMATS,[ZX.BarcodeFormat.EAN_13,ZX.BarcodeFormat.EAN_8,ZX.BarcodeFormat.UPC_A,ZX.BarcodeFormat.UPC_E]]]),300);
    scanning=true;
    await reader.decodeFromConstraints({video:{facingMode:{ideal:'environment'},width:{ideal:1280}}},$('gsScanVideo'),(result)=>{
      if(!scanning||!result)return;
      const code=String(result.getText());
      if(validCode(code)&&checkDigitOk(code)){scanning=false;handle(code)}
    });
    status('Halte den Barcode ruhig in das Bild.');
  }catch(e){
    stopCamera();
    status((e&&e.name==='NotAllowedError'?'Kamerazugriff wurde abgelehnt (iPhone: Einstellungen → Safari → Kamera). ':'Kamera nicht startbar: '+(e.message||e)+'. ')+'Tippe die Nummer ein oder nimm ein Foto vom Barcode auf.',true);
  }
}
async function decodeFile(e){
  const file=e.target.files?.[0];e.target.value='';if(!file)return;
  status('Foto wird gelesen …');
  try{
    const ZX=await loadZXing(),url=URL.createObjectURL(file);
    const r=new ZX.BrowserMultiFormatReader();
    const res=await r.decodeFromImageUrl(url);URL.revokeObjectURL(url);
    const code=String(res.getText());
    if(!validCode(code)||!checkDigitOk(code))throw Error('Ungültiger Code gelesen: '+code);
    handle(code);
  }catch(err){status('Im Foto wurde kein lesbarer Barcode gefunden. Näher heran, mehr Licht, oder Nummer eintippen. ('+(err.message||err)+')',true)}
}
async function handle(code){
  if(!validCode(code)){status('Bitte eine gültige Nummer (8, 12, 13 oder 14 Ziffern) eingeben.',true);return}
  if(!checkDigitOk(code)){status('Die Prüfziffer stimmt nicht – bitte Nummer prüfen.',true);return}
  stopCamera();
  status('Suche Produkt '+code+' bei Open Food Facts …');$('gsScanResult').innerHTML='';
  try{
    const item=await lookup(code);
    if(item.notFound){status('Zu dieser Nummer gibt es kein Produkt in Open Food Facts. Du kannst die Werte vom Etikett selbst eintragen.',true);manualCard(code);return}
    product=item;
    if(!item.complete){status('„'+item.name+'“ gefunden, aber ohne vollständige Nährwerte. Bitte vom Etikett ergänzen.',true);manualCard(code,item);return}
    status('Produkt gefunden. Menge prüfen und übernehmen.');
    resultCard(item);
  }catch(e){status('Produktsuche nicht erreichbar ('+(e.name==='AbortError'?'Zeitüberschreitung':e.message)+'). Bist du online?',true)}
}
function resultCard(item){
  const defQty=item.serving||100;
  $('gsScanResult').innerHTML='<div class="card" style="color:var(--ink)"><h3>'+esc(item.name)+(item.brand?' · '+esc(item.brand):'')+'</h3>'+
    '<p class="sub">Pro 100 '+item.unit+': '+Math.round(item.kcal)+' kcal · '+r1(item.p)+' g P · '+r1(item.c)+' g KH · '+r1(item.f)+' g F'+(Number.isFinite(item.fiber)?' · '+r1(item.fiber)+' g Ballaststoffe':'')+'</p>'+
    '<div class="fieldrow"><div class="field"><label class="label" for="gsScanQty">Menge ('+item.unit+')</label><input id="gsScanQty" type="number" inputmode="decimal" min="1" step="any" value="'+defQty+'"/></div><div class="field"><span class="label">Portion</span><div class="pill" id="gsScanSum" style="padding:11px;display:block"></div></div></div>'+
    '<button type="button" class="btn" id="gsScanApply" style="width:100%">In Mahlzeit übernehmen</button>'+
    '<p class="sub" style="margin-bottom:0">Daten: Open Food Facts (ODbL) – von Nutzern gepflegt, bitte bei Auffälligkeiten mit dem Etikett vergleichen.'+(item.serving?' Portionsgröße laut Hersteller: '+item.serving+' '+item.unit+'.':'')+'</p></div>';
  const upd=()=>{const q=Number($('gsScanQty').value)||0;$('gsScanSum').textContent=Math.round(item.kcal*q/100)+' kcal'};
  $('gsScanQty').oninput=upd;upd();
  $('gsScanApply').onclick=()=>apply(item,Number($('gsScanQty').value));
}
function manualCard(code,item){
  const n=item?.name&&item.name!=='Unbekanntes Produkt'?item.name:'';
  $('gsScanResult').innerHTML='<div class="card" style="color:var(--ink)"><h3>Produkt selbst eintragen</h3><div class="field"><label class="label" for="gsManName">Name</label><input id="gsManName" value="'+esc(n)+'" placeholder="Produktname"/></div>'+
   '<div class="triple"><div class="field"><label class="label" for="gsManKcal">kcal / 100 g</label><input id="gsManKcal" type="number" inputmode="decimal" step="any"/></div><div class="field"><label class="label" for="gsManP">Protein</label><input id="gsManP" type="number" inputmode="decimal" step="any"/></div><div class="field"><label class="label" for="gsManC">KH</label><input id="gsManC" type="number" inputmode="decimal" step="any"/></div></div>'+
   '<div class="fieldrow"><div class="field"><label class="label" for="gsManF">Fett</label><input id="gsManF" type="number" inputmode="decimal" step="any"/></div><div class="field"><label class="label" for="gsManFib">Ballaststoffe</label><input id="gsManFib" type="number" inputmode="decimal" step="any"/></div></div>'+
   '<button type="button" class="btn" id="gsManGo" style="width:100%">Weiter</button></div>';
  $('gsManGo').onclick=()=>{
    const v=id=>Number(String($(id).value).replace(',','.'));
    const it={code,name:$('gsManName').value.trim(),brand:'',kcal:v('gsManKcal'),p:v('gsManP'),c:v('gsManC'),f:v('gsManF'),fiber:$('gsManFib').value===''?NaN:v('gsManFib'),unit:'g',serving:null,manual:true};
    if(!it.name||![it.kcal,it.p,it.c,it.f].every(Number.isFinite)){toast('Bitte Name und alle vier Nährwerte eintragen.');return}
    resultCard(it);
  };
}
function apply(item,qty){
  if(!(qty>0)){toast('Bitte eine Menge eingeben.');return}
  const k=qty/100,label=item.name+(item.brand?' · '+item.brand:'');
  window.GSMealDraftComponents=null;
  $('quickSpeech').value='';
  $('foodName').value=label;
  if($('foodUnit'))$('foodUnit').value=item.unit;
  $('foodGrams').value=qty;
  $('foodKcal').value=r1(item.kcal*k);$('foodProtein').value=r1(item.p*k);$('foodCarbs').value=r1(item.c*k);$('foodFat').value=r1(item.f*k);
  if($('foodFiber'))$('foodFiber').value=Number.isFinite(item.fiber)?r1(item.fiber*k):'';
  $('foodNote').value='Barcode '+item.code+(item.manual?' (vom Etikett eingetragen)':' · Open Food Facts');
  remember(item,label);
  close();
  $('mealCard')?.scrollIntoView({behavior:'smooth',block:'start'});
  toast('Produkt übernommen – bitte „Mahlzeit speichern“ tippen');
}
// Produkt für die Freitext-Erkennung merken ("100 g <Name>" wird künftig erkannt).
function remember(item,label){
  try{
    window.GSFoodIndex?.importCatalogue([{name:label,aliases:[item.name,item.brand?item.brand+' '+item.name:''].filter(Boolean),menge:100,einheit:item.unit,kcal:item.kcal,protein_g:item.p,kohlenhydrate_g:item.c,fett_g:item.f,ballaststoffe_g:Number.isFinite(item.fiber)?item.fiber:null,marke_oder_quelle:'Barcode '+item.code}]);
  }catch(e){console.warn('Produkt konnte nicht gemerkt werden',e)}
}

function setup(){
  if($('gsScanBtn'))return;
  const line=document.querySelector('#mealCard .camera-line');if(!line)return;
  const btn=document.createElement('button');btn.type='button';btn.id='gsScanBtn';btn.className='btn second';btn.style.fontSize='13px';btn.textContent='▮▯ Barcode';
  line.appendChild(btn);btn.onclick=open;
  document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
}
window.GSBarcode={checkDigitOk,validCode,lookup,open};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(setup,40));else setTimeout(setup,40);
})();
