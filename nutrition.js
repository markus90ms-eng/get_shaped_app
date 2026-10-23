/* Get Shaped – automatische Nährwertberechnung (ohne private Daten und API-Schlüssel). */
(() => {
'use strict';
const $n=id=>document.getElementById(id);
const val=v=>{let n=Number(String(v??'').replace(',','.'));return Number.isFinite(n)?n:NaN};
const one=v=>Math.round(v*10)/10;
const clean=s=>String(s??'').toLocaleLowerCase('de').replace(/ß/g,'ss').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
const escn=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Orientierung pro 100 g essbarem Anteil: kcal, Protein, Kohlenhydrate, Fett.
// Bei Marke, Garmethode, Wasserverlust und Fettzugabe abweichende Werte möglich.
const catalogue = [
['Ei',143,12.6,0.7,9.5,'ei|eier|huehnerei',55],
['Kaffee schwarz (aufgebrüht)',2,0.1,0.3,0,'kaffee|kaffe|kaffee schwarz|schwarzer kaffee|filterkaffee|kaffe schwarz'],
['Datteln getrocknet',282,2.5,65,0.4,'dattel|datteln|trocken datteln|getrocknete datteln|date|dates',8],
['Hähnchenbrust roh',110,23,0,1.5,'haehnchenbrust roh|hahnchenbrust roh|haehnchenbrust|hahnchenbrust|huehnerbrust|huhnchenbrust'],
['Hähnchenbrust gegart',165,31,0,3.6,'haehnchenbrust gegart|haehnchenbrust gebraten|haehnchenbrust gekocht|haehnchen gekocht|hahnchen gegart'],
['Putenbrust',110,24,0,1.4,'putenbrust|pute|putenschnitzel'],
['Rinderhack',220,19,0,16,'rinderhackfleisch|rinderhack|hackfleisch rind'],
['Rindersteak',190,26,0,9,'rindersteak|rindfleisch|steak'],
['Lachs',208,20,0,13,'lachsfilet|lachs'],
['Thunfisch in Wasser',110,25,0,1,'thunfisch in wasser|thunfisch natur|thunfisch'],
['Garnelen',99,24,0.2,0.3,'garnelen|shrimps'],
['Magerquark',67,12,4,0.2,'magerquark|quark mager|quark 0'],
['Quark 20 %',102,11,4,4.4,'quark 20 prozent|quark 20|speisequark 20|quark'],
['Tvorog',120,17,3,4.5,'tvorog|tworog'],
['Skyr natur',63,11,4,0.2,'skyr'],
['Joghurt griechisch 10 %',133,4,4,10,'griechischer joghurt 10|griechisches joghurt 10|joghurt griechisch 10'],
['Joghurt natur',63,3.5,4.8,3.5,'naturjoghurt|joghurt 3 5|joghurt'],
['Hüttenkäse',100,12,3,4,'huettenkaese|korniger frischkase|koerniger frischkaese|cottage cheese'],
['Feta',265,14,4,21,'feta|schafskaese'],
['Mozzarella',253,19,2,19,'mozzarella'],
['Gouda',356,25,2.2,28,'gouda'],
['Parmesan',392,36,0,26,'parmesan'],
['Butter',744,0.7,0.6,82,'butter'],
['Ghee',900,0,0,100,'ghee|butterschmalz'],
['Olivenöl',884,0,0,100,'olivenol|olivenoel|olivenöl'],
['Rapsöl',884,0,0,100,'rapsol|rapsoel'],
['Kokosöl',884,0,0,100,'kokosol|kokosoel'],
['Sahne 30 %',292,2.3,3.4,30,'schlagsahne|sahne 30|sahne'],
['Milch 1,5 %',47,3.4,4.9,1.5,'milch 1 5|fettarme milch|milch 1 5 prozent|milch 1 5 prozent fett|milch fettarm 1 5'],
['Vollmilch',64,3.3,4.8,3.5,'vollmilch|milch 3 5|milch'],
['Mandeln',579,21,9,50,'mandeln|mandel'],
['Walnüsse',654,15,7,65,'walnusse|walnuss'],
['Haselnüsse',628,15,7,61,'haselnusse|haselnuss'],
['Cashewkerne',553,18,27,44,'cashewkerne|cashew|cashews'],
['Nussmischung',610,18,12,55,'nussmischung|nusse gemischt'],
['Chiasamen',486,17,8,31,'chiasamen|chia'],
['Leinsamen',534,18,2,42,'leinsamen'],
['Kürbiskerne',559,30,11,49,'kurbiskerne'],
['Avocado',160,2,1.8,15,'avocado',145],
['Zucchini',17,1.2,2.1,0.3,'zucchini'],
['Brokkoli',34,2.8,4,0.4,'brokkoli|broccoli'],
['Blumenkohl',25,1.9,2.3,0.3,'blumenkohl'],
['Spinat',23,2.9,1.4,0.4,'blattspinat|spinat'],
['Paprika',31,1,5,0.3,'paprika'],
['Tomate',18,0.9,2.6,0.2,'tomaten|tomate',120],
['Gurke',12,0.6,1.8,0.2,'salatgurke|gurke'],
['Champignons',22,3.1,1.1,0.3,'champignons|champignon'],
['Zwiebel',40,1.1,7.6,0.1,'zwiebeln|zwiebel',90],
['Knoblauch',149,6.4,29,0.5,'knoblauchzehe|knoblauch',4],
['Karotte',41,0.9,7,0.2,'karotten|karotte|mohren|mohre',85],
['Butternut-Kürbis',45,1,10,0.1,'butternut kurbis|butternut|kurbis'],
['Sauerkraut',19,1,2.2,0.1,'sauerkraut'],
['Kopfsalat',14,1.4,1.3,0.2,'kopfsalat|salat'],
['Linsen gekocht',116,9,17,0.4,'linsen gekocht|gekochte linsen|linsen'],
['Kichererbsen gekocht',164,8.9,19,2.6,'kichererbsen gekocht|kichererbsen'],
['Buchweizen gekocht',92,3.4,20,0.6,'buchweizen gekocht|gekochter buchweizen'],
['Buchweizen trocken',340,13,71,3.4,'buchweizen trocken|buchweizen ungekocht|buchweizen'],
['Reis gekocht',130,2.7,28,0.3,'reis gekocht|gekochter reis'],
['Reis trocken',350,7,78,0.6,'reis trocken|reis roh|reis ungekocht|reis'],
['Kartoffeln gekocht',77,2,17,0.1,'kartoffeln gekocht|pellkartoffeln|kartoffeln|kartoffel'],
['Haferflocken',372,13.5,58,7,'haferflocken'],
['Vollkornbrot',230,9,38,4,'vollkornbrot',45],
['Banane',89,1.1,20,0.3,'bananen|banane',120],
['Apfel',52,0.3,11,0.2,'apfel',160],
['Himbeeren',43,1.2,5,0.7,'himbeeren'],
['Blaubeeren',57,0.7,12,0.3,'blaubeeren|heidelbeeren'],
['Erdbeeren',32,0.8,5.5,0.3,'erdbeeren'],
['Zartbitterschokolade 85 %',600,12,19,52,'zartbitterschokolade 85|schokolade 85'],
['Erdnussmus',600,26,12,50,'erdnussmus|erdnussbutter'],
['Tofu natur',120,13,1,7,'tofu'],
['Hummus',240,7,13,17,'hummus']
];
const dbItems=catalogue.map(r=>({name:r[0],kcal:r[1],p:r[2],c:r[3],f:r[4],piece:r[6]||null,aliases:r[5].split('|').map(clean)}));
let basis=null, expected='', offers=[], busy=false, lastLookup=0;
const fieldIds=['foodKcal','foodProtein','foodCarbs','foodFat'];
const signature=()=>clean($n('foodName').value)+'|'+String($n('foodGrams').value).trim();
function message(s,warning=false){const x=$n('nutFeedback');x.textContent=s;x.className=warning?'warnline':'hint';x.classList.remove('hidden')}
function clearMessage(){const x=$n('nutFeedback');if(x)x.classList.add('hidden')}
function findFood(label){const n=' '+clean(label)+' ';for(const f of dbItems)if(f.aliases.some(a=>n.includes(' '+a+' ')))return f;return null}
function parseUnit(amount,unit,f){
  const n=val(amount),u=clean(unit);
  if(!(n>0&&n<=10000))return NaN;
  if(u==='kg')return n*1000;
  if(u==='g'||u==='gramm'||u==='gr'||u==='ml')return n;
  if(u==='l'||u==='liter')return n*1000;
  if(u==='el'||u==='essloffel')return n*(f.name.includes('öl')||f.name==='Ghee'?13.5:15);
  if(u==='tl'||u==='teeloffel')return n*(f.name.includes('öl')||f.name==='Ghee'?4.5:5);
  if(u===''||u==='stk'||u==='stuck'||u==='stucke')return f.piece?n*f.piece:NaN;
  return NaN;
}
function parseIngredients(source, separateGrams){
  const raw=String(source||'').replace(/^\s*(?:heute(?:\s+mittag)?|zum\s+(?:mittag|abendessen|fruhstuck)|ich\s+(?:habe|hatte))\s*/i,'').replace(/^\s*[a-zäöü -]*pfanne\s+mit\s+/i,'').trim();
  if(!raw)return {error:'Bitte Lebensmittel und Mengen nennen.'};
  // Nur tatsächlich erkennbare Zutatmengen berechnen, niemals unbekannte Bestandteile ignorieren.
  const segments=raw.split(/\s*(?:,|;|\+|\bund\b)\s*/i).filter(Boolean);
  const entries=[];
  for(const chunk of segments){
    let m=chunk.match(/^\s*(\d+(?:[.,]\d+)?)\s*(kg|gramm|gr|g|ml|liter|l|el|tl|stk\.?|stuck(?:e)?|stück(?:e)?)?\s+(.+?)\s*$/i);
    let amount,unit,label;
    if(m){amount=m[1];unit=m[2]||'';label=m[3]}
    else {m=chunk.match(/^\s*(.+?)\s+(\d+(?:[.,]\d+)?)\s*(kg|gramm|gr|g|ml|liter|l|el|tl|stk\.?|stuck(?:e)?|stück(?:e)?)\s*$/i);
      if(m){label=m[1];amount=m[2];unit=m[3]}
      else if(segments.length===1&&separateGrams>0){label=raw;amount=separateGrams;unit='g'}
      else return {error:'Bitte die Menge ergänzen: „'+chunk.trim()+'“, z. B. „150 g '+chunk.trim()+'“.'};
    }
    const product=findFood(label);
    if(!product)return {error:'Zutat nicht in der lokalen Referenztabelle: '+label.trim()+'. Nutze die Produktsuche oder präzisiere die Bezeichnung.',unknown:label.trim()};
    const grams=parseUnit(amount,unit,product);
    if(!Number.isFinite(grams)||grams<=0||grams>10000)return {error:'Menge von '+label.trim()+' nicht eindeutig. Bitte in Gramm angeben.'};
    entries.push({product,grams});
  }
  return entries.length?{entries}:{error:'Keine Zutaten erkannt.'};
}
function fillValues(totals,name,grams,info){
  $n('foodName').value=name;
  $n('foodGrams').value=one(grams);
  for(const [field,key] of [['foodKcal','kcal'],['foodProtein','p'],['foodCarbs','c'],['foodFat','f']])$n(field).value=one(totals[key]);
  if(info)$n('foodNote').value=($n('foodNote').value.trim()?$n('foodNote').value.trim()+' | ':'')+info;
  expected=signature();
}
function setBasis(food, grams, name, note){
  if(!(grams>0))return;
  basis={name:name||$n('foodName').value,grams,kcal:Number(food.kcal),p:Number(food.p),c:Number(food.c),f:Number(food.f),note};
}
function fillBasis(grams){
  if(!basis||!(grams>0)||clean($n('foodName').value)!==clean(basis.name))return false;
  const ratio=grams/basis.grams;
  for(const [field,k] of [['foodKcal','kcal'],['foodProtein','p'],['foodCarbs','c'],['foodFat','f']])$n(field).value=one(basis[k]*ratio);
  expected=signature();message('Für '+one(grams)+' g proportional berechnet: ca. '+one(basis.kcal*ratio)+' kcal. Bei gekochten Gerichten muss die ursprüngliche Portion als fertiges Gericht gewogen sein.');
  return true;
}
function trySaved(name,grams){
  const opts=typeof recentFoodOptions==='function'?recentFoodOptions():[];
  const hits=opts.filter(f=>clean(f.name)===clean(name)&&val(f.grams)>0);
  if(hits.length!==1||!(grams>0))return false;
  const f=hits[0],factor=grams/val(f.grams);
  // Eindeutige Quelle behalten und gleiche Portion proportional umrechnen.
  fillValues({kcal:f.kcal*factor,p:f.p*factor,c:f.c*factor,f:f.f*factor},f.name,grams,'Übernommen aus '+f._date+'; Portionsgröße proportional berechnet.');
  setBasis(f,val(f.grams),f.name,'historisch');
  message('Gespeichertes Gericht wiederverwendet: '+one(grams)+' g und ca. '+one(f.kcal*factor)+' kcal.');
  return true;
}
function calcLocal(){
  const initial=$n('foodName').value.trim(),grams=val($n('foodGrams').value);
  if(!initial){message('Bitte Lebensmittel oder Zutaten eingeben.',true);return false}
  if(trySaved(initial,grams))return true;
  const parsed=parseIngredients(initial,grams);
  if(parsed.error){message(parsed.error,true);return false}
  let totals={kcal:0,p:0,c:0,f:0},weight=0;
  for(const {product,grams:g} of parsed.entries){weight+=g;for(const k of Object.keys(totals))totals[k]+=product[k]*g/100}
  const name=parsed.entries.length===1?parsed.entries[0].product.name:initial;
  let note='Schätzung aus lokaler Grundnahrungsmitteltabelle: '+parsed.entries.map(i=>i.product.name+' '+one(i.grams)+' g').join(', ')+'.';
  if(parsed.entries.length>1)note+=' Gewichte vor einem möglichen Garverlust addiert; für Teilportionen fertiges Gesamtgewicht nötig.';
  fillValues(totals,name,weight,note);setBasis(totals,weight,name,'lokal');
  $n('nutProducts').innerHTML='';offers=[];
  message('Berechnet: ca. '+one(totals.kcal)+' kcal, '+one(totals.p)+' g Protein, '+one(totals.c)+' g Kohlenhydrate, '+one(totals.f)+' g Fett. '+(parsed.entries.length>1?'Für Restportionen das fertige Gericht wiegen.':'Produkt und Zubereitung können abweichen.'));
  return true;
}
async function searchProducts(){
  if(busy)return;
  const current=$n('foodName').value.trim(),parsed=parseIngredients(current,val($n('foodGrams').value));
  const query=String(parsed.unknown||current).replace(/^\d+(?:[,.]\d+)?\s*(?:g|kg|gramm|ml)\s*/i,'').trim().slice(0,85);
  if(!query){message('Bitte zunächst ein Lebensmittel nennen.',true);return}
  if(Date.now()-lastLookup<6500){message('Bitte vor der nächsten Produktsuche einen kurzen Moment lassen (Datenbankbegrenzung).',true);return}
  lastLookup=Date.now();busy=true;const dest=$n('nutProducts');dest.textContent='Suche Produkt-Nährwerte …';
  const controller=new AbortController(),t=setTimeout(()=>controller.abort(),12000);
  try {
    const url=new URL('https://world.openfoodfacts.org/cgi/search.pl');
    [['search_terms',query],['search_simple','1'],['action','process'],['json','1'],['page_size','12'],['fields','code,product_name,brands,nutriments']].forEach(([k,v])=>url.searchParams.set(k,v));
    const r=await fetch(url.toString(),{signal:controller.signal,headers:{Accept:'application/json'}});
    if(!r.ok)throw new Error('Server '+r.status);
    const data=await r.json();
    offers=(data.products||[]).map(x=>{
      const n=x.nutriments||{};
      let kcal=val(n['energy-kcal_100g']);
      if(!Number.isFinite(kcal)){const kj=val(n['energy-kj_100g']);kcal=Number.isFinite(kj)?kj/4.184:NaN}
      const p=val(n.proteins_100g),c=val(n.carbohydrates_100g),f=val(n.fat_100g);
      if(!x.product_name||![kcal,p,c,f].every(Number.isFinite)||kcal<0||kcal>900||[p,c,f].some(v=>v<0||v>100))return null;
      return {name:String(x.product_name),brand:String(x.brands||''),kcal,p,c,f,barcode:x.code||''};
    }).filter(Boolean).slice(0,7);
    if(!offers.length){dest.textContent='Keine vollständigen Produktdaten gefunden.';message('Auch für diesen Suchbegriff gibt es keine vollständigen Werte. Bitte Lebensmittel, Marke oder Menge genauer angeben.',true);return}
    dest.innerHTML='<p class="sub">Online-Treffer von Open Food Facts (ODbL). Bitte dein tatsächliches Produkt auswählen:</p>'+offers.map((p,i)=>'<button class="btn second small" type="button" data-off-idx="'+i+'" style="display:block;width:100%;margin:6px 0;text-align:left">'+escn(p.name)+' · '+escn(p.brand)+' — '+one(p.kcal)+' kcal / 100 g</button>').join('');
    message('Produktvorschläge gefunden. Vergleiche Marke und Etikett, bevor du übernimmst.');
  }catch(e){dest.textContent='Suche nicht verfügbar. Nutze die lokale Berechnung oder versuche es später erneut.';message('Online-Abfrage fehlgeschlagen: '+e.message,true)}
  finally{clearTimeout(t);busy=false}
}
function chooseProduct(i){
  const p=offers[i],grams=val($n('foodGrams').value);
  if(!p)return;
  if(!(grams>0)){message('Bitte zuerst im Feld „Portion“ die Menge in Gramm angeben.',true);return}
  const totals={kcal:p.kcal*grams/100,p:p.p*grams/100,c:p.c*grams/100,f:p.f*grams/100};
  fillValues(totals,p.name,grams,'Quelle: Open Food Facts (ODbL), '+(p.barcode?'Barcode '+p.barcode+', ':'')+'Produktdaten bitte prüfen.');
  setBasis(totals,grams,p.name,'openfoodfacts');$n('nutProducts').innerHTML='';
  message('Produkt übernommen: ca. '+one(totals.kcal)+' kcal für '+one(grams)+' g. Prüfe die Verpackung.');
}
function captureBasis(){
  const grams=val($n('foodGrams').value);
  if(!(grams>0)||!$n('foodKcal').value.trim())return;
  setBasis({kcal:val($n('foodKcal').value),p:val($n('foodProtein').value)||0,c:val($n('foodCarbs').value)||0,f:val($n('foodFat').value)||0},grams,$n('foodName').value,'gespeichert');
  expected=signature();
}
function fromSpeech(){
  const spoken=$n('quickSpeech').value.trim();
  if(!spoken){message('Bitte zunächst einen Satz sprechen oder eingeben.',true);return}
  if(/\b(gestern|vorgestern|vortag|rest|reste|ubrig|übrig)\b/i.test(spoken)){
    // Die vorhandene Logik erkennt Gerichte des Vortags und skaliert Portionen.
    window.parseQuickSpeech();
    if($n('foodKcal').value.trim()&&$n('foodGrams').value.trim()){captureBasis();message('Vorheriges Gericht übernommen. Prüfe, ob das richtige Gericht und die gewünschte Portion erkannt wurden.');}
    else message('Gericht vom Vortag nicht eindeutig erkannt. Wähle es aus „Kürzlich gegessene Gerichte“ aus.',true);
    return;
  }
  // Neue Zutaten inklusive Mengen aus einem gesprochenen Satz übernehmen.
  $n('foodName').value=spoken.replace(/^\s*(?:heute\s+mittag|heute|zum\s+mittag(?:essen)?|ich\s+habe|ich\s+hatte)\s*/i,'').trim();
  for(const id of fieldIds)$n(id).value='';
  basis=null;expected='';
  if(!calcLocal())message('Satz erfasst. Bitte Mengen/Zutaten präzisieren oder „Produkt recherchieren“ wählen.',true);
}
function setup(){
  if(!$n('saveFood')||!$n('foodKcal'))return;
  const loc=$n('foodKcal').closest('.fieldrow');
  const elm=document.createElement('div');elm.innerHTML=
    '<p class="hint" style="margin:6px 0 12px">Nährwerte werden aus Lebensmitteln und Mengen geschätzt. Beispiele: „250 g Magerquark“ oder „200 g Hähnchenbrust, 150 g Zucchini und 10 g Olivenöl“. Für Reste kannst du ein gespeichertes Gericht auswählen.</p>'+
    '<div class="btnrow" style="margin:9px 0 12px"><button type="button" class="btn" id="nutCalculate">⚡ Automatisch berechnen</button><button type="button" class="btn second" id="nutSearch">🔎 Produkt recherchieren</button></div>'+
    '<div id="nutFeedback" role="status" class="hint hidden"></div><div id="nutProducts" style="margin:9px 0"></div>';
  loc.insertAdjacentElement('afterend',elm);
  const oldLabel=document.querySelector('label[for="foodKcal"]');
  if(oldLabel)oldLabel.textContent='Kalorien der Portion (automatisch)';
  $n('foodKcal').placeholder='Wird berechnet';
  $n('nutCalculate').onclick=()=>calcLocal();
  $n('nutSearch').onclick=()=>searchProducts();
  $n('nutProducts').onclick=e=>{const b=e.target.closest('[data-off-idx]');if(b)chooseProduct(Number(b.dataset.offIdx))};
  // Die ursprüngliche Sprach- und Verlaufssuche bleibt erhalten.
  $n('parseSpeech').onclick=fromSpeech;
  $n('recentMeals').addEventListener('change',()=>{if($n('foodKcal').value.trim()){captureBasis();message('Vorher gespeichertes Gericht gewählt. Menge ändern: Kalorien werden mit angepasst.')}});
  $n('foodEntries').addEventListener('click',e=>{if(e.target.closest('[data-edit-food]')){captureBasis();clearMessage()}});
  $n('foodGrams').addEventListener('input',()=>{
    const g=val($n('foodGrams').value);
    if(basis&&clean($n('foodName').value)===clean(basis.name)&&g>0)fillBasis(g);
    else if(expected&&signature()!==expected){for(const id of fieldIds)$n(id).value='';expected='';message('Portion geändert: Bitte Nährwerte neu berechnen.',true)}
  });
  $n('foodName').addEventListener('input',()=>{
    if(expected&&signature()!==expected){for(const id of fieldIds)$n(id).value='';basis=null;expected='';message('Lebensmittel geändert: Bitte neu berechnen.',true)}
  });
  const originalSave=window.recordFood;
  $n('saveFood').onclick=async()=>{
    if(!$n('foodName').value.trim()&&$n('quickSpeech').value.trim())fromSpeech();
    if(expected&&signature()!==expected){
      if(!fillBasis(val($n('foodGrams').value)))for(const id of fieldIds)$n(id).value='';
    }
    if(!$n('foodKcal').value.trim()){
      const ok=calcLocal();
      if(!ok){message('Noch kein eindeutiger Nährwert. Bitte Zutaten präzisieren oder einen Produkt-Treffer wählen; keine 0-kcal-Schätzung.',true);return}
    }
    originalSave();
    if(!$n('foodName').value.trim()){basis=null;expected='';$n('quickSpeech').value='';$n('nutProducts').innerHTML='';clearMessage()}
  };
  // Fehlendes Bilderkennungs-Backend von GitHub Pages nicht als funktionierende KI ausgeben.
  $n('analyzePhoto').textContent='📷 Foto einschätzen';
  $n('analyzePhoto').onclick=()=>{
    const hasPhoto=!$n('photoPreview').classList.contains('hidden');
    if(!hasPhoto){message('Bitte zuerst ein Foto aufnehmen.',true);return}
    if($n('foodName').value.trim()){calcLocal();message('Das Foto wurde gespeichert; die Schätzung basiert auf deinen Zutaten und Mengen. Eine automatische Bildanalyse ist ohne gesicherten KI-Dienst nicht verfügbar.',true)}
    else message('Foto erfasst. Eine echte automatische Bilderkennung ist noch nicht angebunden. Sprich oder schreibe die Zutaten und Menge – die App berechnet die Nährwerte. Über „Fotos teilen“ kannst du das Bild in ChatGPT zeigen.',true);
  };
  $n('speechHelp').textContent='Sage z. B. „200 g Hähnchenbrust und 150 g Zucchini“ oder „550 g von der Pfanne von gestern“. Bekannte Gerichte werden umgerechnet, neue Zutaten automatisch geschätzt.';
  // Keine Änderungen an privater Historie, Foto-Datenbank oder JSON-Backup.
}
window.GetShapedNutrition = {foods:dbItems.map(f=>({...f})),normalize:clean};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);
else setup();
})();