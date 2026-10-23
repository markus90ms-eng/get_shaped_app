/* Get Shaped – Freitextanalyse v3. Lokal, ohne Upload persönlicher Tagebuchdaten. */
(() => {
'use strict';
const $ = id => document.getElementById(id);
const foods=window.GetShapedNutrition?.foods||[];
const round=x=>Math.round(x*10)/10;
const number=s=>{const x=Number(String(s??'').replace(',','.'));return Number.isFinite(x)?x:NaN};
const normalize=s=>String(s??'').toLocaleLowerCase('de').replace(/ß/g,'ss')
  .normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ae/g,'a').replace(/oe/g,'o').replace(/ue/g,'u')
  .replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const unitExpr='milliliter|gramm|liter|esslöffel|essloffel|teelöffel|teeloffel|stücke|stück|stuecke|stueck|tassen|tasse|kg|ml|gr|g|l|el|tl|stk\\.?';
const beginRx=new RegExp('^(\\d+(?:[.,]\\d+)?)\\s*(?:('+unitExpr+')\\s*)?\\s+(.+?)\\s*$','i');
const endRx=new RegExp('^(.+?)\\s+(\\d+(?:[.,]\\d+)?)\\s*('+unitExpr+')\\s*$','i');
const lowNumbers={ein:1,eine:1,einen:1,einem:1,einer:1,zwei:2,drei:3,vier:4,fuenf:5,fünf:5,sechs:6,sieben:7,acht:8,neun:9,zehn:10,halbe:0.5,halb:0.5,halben:0.5};
let lastText='', components=[], basis=null, timer=null, replaying=false, lastError='',researchTimer=null,lastLookup=0,lookupBusy=false,lookupToken=0;
const PRODUCT_STORE='get_shaped_local_product_lookup_v1';
const learned=(()=>{try{return JSON.parse(localStorage.getItem(PRODUCT_STORE)||'{}')}catch(_){return {}}})();
const externalCache=new Map();
function findLearnedProduct(label){
 const key=normalize(label);
 const f=learned[key];
 return f&&Number.isFinite(f.kcal)&&Number.isFinite(f.p)&&Number.isFinite(f.c)&&Number.isFinite(f.f)
    ? {...f,aliases:[key],piece:f.piece||null}:null;
}
const getUnit=()=>$('foodUnit')?.value||'g';
const setUnit=u=>{if($('foodUnit'))$('foodUnit').value=u};
function show(msg,warn=false) {
  const out=$('nutFeedback')||$('speechHelp');
  if(out){out.textContent=msg;out.className=warn?'warnline':'hint';out.classList.remove('hidden');}
}
function setBreakdown(items,warning='') {
 const out=$('gsBreakdown');if(!out)return;
 if(!items?.length){out.innerHTML=warning?'<p class="warnline">'+escape(warning)+'</p>':'';return;}
 const total=items.reduce((a,x)=>a+x.kcal,0);
 out.innerHTML='<div class="card" style="box-shadow:none;padding:13px;margin:10px 0;background:#f3f8f1">'+
 '<h3 style="margin:0 0 8px">Automatische Aufschlüsselung</h3>'+
 items.map(x=>'<div class="macro"><span>'+escape(x.name)+' · '+escape(round(x.qty))+' '+escape(x.unit)+(x.assumption?' <small>('+escape(x.assumption)+')</small>':'')+(x.source&&x.source.startsWith('https://')?' <small><a href="'+escape(x.source)+'" target="_blank" rel="noopener noreferrer">Quelle</a></small>':'')+'</span><b>'+escape(Math.round(x.kcal))+' kcal</b></div>').join('')+
 '<div class="macro" style="border-top:1px solid #c4d8c5;margin-top:6px"><strong>Gesamt</strong><strong>'+Math.round(total)+' kcal</strong></div>'+
 '<p class="sub" style="margin:7px 0 0">Orientierungswerte, keine exakte Messung. Bei unbekannten Zutaten wird die Berechnung nicht gespeichert.</p></div>';
}
function standardize(text){
 let s=String(text||'').trim();
 s=s.replace(/\bkaffe\b/gi,'Kaffee').replace(/\bmichl\b/gi,'Milch').replace(/\bmich\b(?=\s+\d[,.]\d\s*(?:prozent|%))/gi,'Milch');
 // Erst den Fettgehalt als Eigenschaft der Milch anhängen, nicht als weitere Lebensmittelmenge verstehen.
 s=s.replace(/\b(milch)\s+mit\s+(\d+(?:[,.]\d+)?)\s*(?:prozent|%)\s*(?:fettgehalt|fettanteil|fett)?/gi,'$1 $2 %');
 s=s.replace(/\b(milch)\s+(\d+(?:[,.]\d+)?)\s*(?:prozent|%)\s*(?:fettgehalt|fettanteil|fett)?/gi,'$1 $2 %');
 s=s.replace(/\b(milch)\s+(?:mit\s+)?(ein(?:em|er)?\s+)?komma\s+fünf\s*(?:prozent|%)\s*(?:fettgehalt|fett)?/gi,'$1 1,5 %');
 // "Milch mit einem Fettgehalt von 1,5 %" und typische Diktat-Varianten.
 s=s.replace(/\b(milch)\s+mit\s+(?:einem\s+)?fettgehalt\s+von\s+(\d+(?:[,.]\d+)?)\s*(?:prozent|%)/gi,'$1 $2 %');
 s=s.replace(/\b(milch)\s+(?:mit\s+)?(?:einem\s+)?fettgehalt\s+von\s+(\d+(?:[,.]\d+)?)\s*(?:prozent|%)/gi,'$1 $2 %');
 s=s.replace(/\b(?:dazu|auch|noch|bitte)\s*[.!]?\s*$/i,'');
 return s;
}
function cleanPrefix(text){
 let s=standardize(text);
 for(let i=0;i<9;i++){
   const old=s;
   s=s.replace(/^\s*(?:heute|gestern)(?:\s+(?:morgen|mittag|abend|zum\s+mittag(?:essen)?))?\s*[,:]?\s*/i,'')
    .replace(/^\s*(?:ich\s+(?:habe|hab|hatte|esse|aß|ass)|habe\s+ich|hatte\s+ich|es\s+gab|gab\s+es)\s*/i,'')
    .replace(/^\s*(?:zum|als|fürs)\s+(?:frühstück|fruehstueck|mittag(?:essen)?|abendessen)\s*[,:]?\s*/i,'')
    .replace(/^\s*(?:ungefähr|ungefaehr|ca\.?|circa|etwa|und\s+zwar)\s*/i,'');
   if(s===old)break;
 }
 return s.replace(/\s+(?:gegessen|verzehrt|getrunken|gehabt|gegessen habe|ausgetrunken)\s*[.!]?\s*$/i,'').trim();
}
function splitFood(text){
 // Kommas in Dezimalzahlen dürfen nicht als Trennzeichen gelten.
 const raw=cleanPrefix(text).replace(/(\d),(\d)/g,'$1§$2');
 return raw.split(/\s*(?:,|;|\+|\bund\b|\bsowie\b|\bplus\b|\bmit\b)\s*/i)
   .map(s=>s.replace(/§/g,',').replace(/^\s*(?:insgesamt|zusammen|ca\.?|circa|etwa|ungefähr|ungefaehr)\s+(?=\d)/i,'').trim()).filter(Boolean);
}
function findFood(label){
 const key=normalize(label),k=' '+key+' ';
 // Nicht eine beliebige Marke mit einem ähnlichen Produkt gleichsetzen.
 if(/nur nur natur/.test(key)){
   if(/selleriesalat/.test(key))return foods.find(f=>f.name.includes('NUR NUR NATUR Bio-Selleriesalat'))||null;
   return null;
 }
 if(/aldi/.test(key)&&/bio/.test(key)&&/kalamata/.test(key))
   return foods.find(f=>f.name.includes('ALDI SÜD BIO Kalamata'))||null;
 const allowed=new Set('natur bio frisch frische gekochte gekocht gegart gebraten gebratenen roh rohe rohen getrocknet getrocknete getrockneten schwarz schwarzer schwarzen fettarm ungesusst ungesuesst ungezückert'.split(' ').map(normalize));
 const matches=[];
 for(const f of foods)for(const a of f.aliases||[]){
  const alias=normalize(a);
  if(!alias)continue;
  if(key===alias){matches.push({f,score:1000+alias.length});continue;}
  if(!k.includes(' '+alias+' '))continue;
  const other=key.replace(alias,' ').trim().split(' ').filter(Boolean);
  if(other.every(w=>allowed.has(w)))matches.push({f,score:alias.length});
 }
 matches.sort((a,b)=>b.score-a.score);
 return matches[0]?.f||null;
}
function unitInfo(count,unit,item){
 const u=normalize(unit);
 if(!(count>0&&count<=10000))return null;
 let qty=count,displayUnit='g',mass=count,assumption='';
 if(u==='kg'){qty=count*1000;mass=qty;}
 else if(u==='l'||u==='liter'){qty=count*1000;displayUnit='ml';}
 else if(['ml','milliliter'].includes(u)){displayUnit='ml';}
 else if(['g','gr','gramm'].includes(u)){}
 else if(['tl','teeloffel'].includes(u)){qty=count*5;displayUnit='ml';assumption='Teelöffel ≈ 5 ml';}
 else if(['el','essloffel'].includes(u)){qty=count*15;displayUnit='ml';assumption='Esslöffel ≈ 15 ml';}
 else if(['tasse','tassen'].includes(u)){
   if(/kaffee|tee/.test(normalize(item.name))){qty=count*200;displayUnit='ml';assumption='Tasse ≈ 200 ml';}
   else return null;
 }
 else if(['stuck','stucke','stueck','stuecke','stk'].includes(u)){
   if(!item.piece)return null;
   displayUnit='Stück';mass=count*item.piece;
   assumption='Stückgewicht ≈ '+item.piece+' g';
 }
 else if(!u){
   if(/kaffee|tee/.test(normalize(item.name))){qty=count*200;displayUnit='ml';assumption='Tasse Kaffee ≈ 200 ml (ohne Zucker)';}
   else if(item.piece){displayUnit='Stück';mass=count*item.piece;assumption='Stückgewicht ≈ '+item.piece+' g';}
   else return null;
 }else return null;
 if(displayUnit==='ml'){
  const label=normalize(item.name);
  mass=qty*(label.includes('olivenol')||label.includes('rapsol')||label.includes('kokosol')||label.includes('ghee')?0.91:
     label.includes('milch')?1.03:1);
 }
 return (mass>0&&mass<=10000)?{qty,unit:displayUnit,mass,assumption}:null;
}
function itemFromSegment(segment){
 let s=segment.trim().replace(/\s+(?:auch|noch|dazu|gegessen|getrunken)\s*[.!]?$/i,'').trim();
 s=s.replace(/^(einer|einem|einen|eine|ein|zwei|drei|vier|fünf|fuenf|sechs|sieben|acht|neun|zehn|halb|halbe|halben)\b/i,
  m=>String(lowNumbers[m.toLocaleLowerCase('de')]??m));
 const fwd=s.match(beginRx),back=s.match(endRx);
 let label,amount,unit;
 if(fwd){label=fwd[3];amount=number(fwd[1]);unit=fwd[2]||'';}
 else if(back){label=back[1];amount=number(back[2]);unit=back[3];}
 else {
   const plain=findFood(s);
   if(plain&&/kaffee|tee/i.test(plain.name)){label=s;amount=1;unit='';}
   else return {error:'Keine eindeutige Menge für „'+s+'“ (z. B. 20 g oder 100 ml).'};
 }
 const food=findFood(label)||findLearnedProduct(label);
 if(!food)return {error:'Lebensmittel „'+label.trim()+'“ nicht erkannt. Ich suche nach dem Produkt.',unknown:{label:label.trim(),amount,unit}};
 const q=unitInfo(amount,unit,food);
 if(!q)return {error:'Die Einheit/Portionsgröße bei „'+label.trim()+'“ ist nicht eindeutig.'};
 const ratio=q.mass/100;
 return {entry:{name:food.name,qty:q.qty,unit:q.unit,grams:q.mass,
   kcal:food.kcal*ratio,p:food.p*ratio,c:food.c*ratio,f:food.f*ratio,
   assumption:q.assumption,source:food.source||'lokale Referenztabelle'}};
}
function parseFreeText(text){
 const parts=splitFood(text);
 if(!parts.length)return {error:'Bitte ein Lebensmittel oder Gericht nennen.',entries:[]};
 let entries=[];
 for(const p of parts){
  const r=itemFromSegment(p);
  if(r.error)return {error:r.error,entries,unknown:r.unknown||null};
  entries.push(r.entry);
 }
 return {entries};
}
function gramsFromSaved(f) {
 if(Number(f.quantity)>0)return Number(f.quantity);
 const m=String(f.grams||'').match(/^\s*(\d+(?:[.,]\d+)?)/);
 return m?number(m[1]):NaN;
}
function unitFromSaved(f){
 if(['g','ml','Stück'].includes(f.unit))return f.unit;
 const s=String(f.grams||'');
 return /\bml\b/i.test(s)?'ml':/stück|stueck|\bstk\b/i.test(s)?'Stück':'g';
}
function oldMeal(text){
 if(!/\b(gestern|vorgestern|vortag|rest|reste|übrig|ubrig)\b/i.test(text))return null;
 const m=text.match(new RegExp('(\\d+(?:[.,]\\d+)?)\\s*(g|gramm|kg|ml|milliliter|stück|stueck)','i'));
 if(!m)return {error:'Bitte bei Resten die Portion nennen, z. B. 550 g von der Pfanne von gestern.'};
 const unit=/stück|stueck/i.test(m[2])?'Stück':/ml|milliliter/i.test(m[2])?'ml':'g';
 const qty=number(m[1])*(/kg/i.test(m[2])?1000:1);
 const list=typeof recentFoodOptions==='function'?recentFoodOptions():[];
 const query=normalize(text.replace(m[0],' ').replace(/^(heute|zum mittag)/i,''))
   .split(' ').filter(w=>w.length>2&&!new Set(['gestern','vorgestern','vortag','der','die','das','den','von','vom','reste','rest','ich','habe','gegessen','und','mittag','pfanne','heute','zum']).has(w));
 const date=new Date(selected+'T12:00:00');date.setDate(date.getDate()-(/vorgestern/i.test(text)?2:1));
 const y=datestr(date);
 const matches=list.filter(f=>unitFromSaved(f)===unit&&gramsFromSaved(f)>0).map(f=>({f,score:query.filter(w=>normalize(f.name).includes(w)).length*5+(f._date===y?2:0)}))
   .filter(x=>query.length?x.score>=5:x.f._date===y).sort((a,b)=>b.score-a.score);
 if(!matches.length||matches[1]&&matches[0].score===matches[1].score)return {error:'Kein eindeutig passendes Gericht im Verlauf gefunden. Verwende die Gerichtsauswahl.'};
 const f=matches[0].f,original=gramsFromSaved(f),u=unitFromSaved(f);
 const adjusted={qty,unit};
 if(!(original>0)||u!==adjusted.unit)return {error:'Die gespeicherte Portion hat eine andere Einheit oder kein bekanntes Gewicht.'};
 const factor=adjusted.qty/original,entry={name:f.name,qty:adjusted.qty,unit:adjusted.unit,grams:adjusted.qty,
   kcal:Number(f.kcal)*factor,p:Number(f.p)*factor,c:Number(f.c)*factor,f:Number(f.f)*factor,
   source:'gespeichertes Gericht vom '+(f._date||'früheren Tag'),assumption:'gleiches Rezept wie zuvor'};
 return {entries:[entry],saved:true};
}
function summarize(entries){
 let t={kcal:0,p:0,c:0,f:0,grams:0};for(const x of entries){for(const k of ['kcal','p','c','f'])t[k]+=x[k];t.grams+=x.grams}
 return t;
}
function fillDraft(entries,source){
 const total=summarize(entries);
 const single=entries.length===1;
 const qty=single?entries[0].qty:total.grams,unit=single?entries[0].unit:'g';
 const name=entries.map(x=>x.name).join(' + ');
 $('foodName').value=name;$('foodGrams').value=round(qty);setUnit(unit);
 for(const [id,key] of [['foodKcal','kcal'],['foodProtein','p'],['foodCarbs','c'],['foodFat','f']])$(id).value=round(total[key]);
 $('foodNote').value='Automatische Schätzung aus Freitext: '+entries.map(x=>round(x.qty)+' '+x.unit+' '+x.name+(x.assumption?' ('+x.assumption+')':'')).join('; ')+'.'+(entries.length>1?' Zusammengefasste Masse nur orientierend; beim Garen kann sie sich ändern.':'');
 window.GSMealDraftComponents=entries.map(x=>({name:x.name,quantity:round(x.qty),unit:x.unit,kcal:round(x.kcal),p:round(x.p),c:round(x.c),f:round(x.f),assumption:x.assumption||'',source:x.source||''}));
 components=entries;lastText=source;
 basis={name,qty,unit,kcal:total.kcal,p:total.p,c:total.c,f:total.f};
 setBreakdown(entries);
 show('Alle '+entries.length+' Bestandteile erkannt. Gesamt ca. '+Math.round(total.kcal)+' kcal. Prüfe angenommene Portionsgrößen wie Kaffeetassen und Dattelstücke.');
}
function clearDraft(because){
 components=[];basis=null;lastText='';window.GSMealDraftComponents=null;
 for(const id of ['foodKcal','foodProtein','foodCarbs','foodFat'])$(id).value='';
 setBreakdown([],because);
}

const LOOKUP_URL='https://world.openfoodfacts.org/cgi/search.pl';
let currentUnknown=null,productOffers=[],lastSearchTerm='';
function renderProductOffers(term,records,info){
 const node=$('gsProductLookup');
 if(!node)return;
 if(!records?.length){node.innerHTML='<div class="warnline">'+escape(info||'Kein übereinstimmendes Produkt gefunden. Bitte genauer benennen oder den Barcode prüfen.')+'</div>';return;}
 node.innerHTML='<div class="hint"><strong>Produktrecherche: '+escape(term)+'</strong><p class="sub">Ergebnisse von Open Food Facts (ODbL). Bei ähnlich benannten Produkten bitte Marke und Etikett vergleichen; keine ungeprüfte Auswahl.</p>'+
 records.map((p,i)=>'<button type="button" class="btn second small" data-choose-product="'+i+'" style="display:block;width:100%;text-align:left;margin:6px 0">'+escape(p.name)+' · '+escape(p.brand||'Marke nicht angegeben')+' — '+Math.round(p.kcal)+' kcal/100 g</button>').join('')+
 '<p class="sub">Suchbegriffe des unbekannten Produkts werden für diese Recherche an Open Food Facts übertragen; deine Tagebuchhistorie und Fotos nicht.</p></div>';
}
function offerScore(p,label){
 const target=normalize(label),name=normalize(p.name),brand=normalize(p.brand);
 const words=target.split(' ').filter(x=>x.length>2&&!['bio','von','aldi','sud','sued','natur','nur'].includes(x));
 const good=words.filter(x=>name.includes(x)||brand.includes(x)).length;
 return good/Math.max(words.length,1)*10+(target===name?20:0)+(target===brand+' '+name?20:0);
}
async function researchUnknown(term,fullText,force=false) {
 const query=String(term||'').trim().slice(0,95),needle=normalize(query);
 if(!query||lookupBusy)return;
 if(!force&&Date.now()-lastLookup<6500)return;
 const ownToken=++lookupToken;
 const node=$('gsProductLookup');
 if(!node)return;
 lastLookup=Date.now();lastSearchTerm=query;currentUnknown=query;lookupBusy=true;
 node.innerHTML='<div class="hint">🔎 Recherchiere automatisch „'+escape(query)+'“ in der Produktdatenbank …</div>';
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),11500);
 try{
   let url=new URL(LOOKUP_URL);
   for(const [key,value] of [['search_terms',query],['search_simple','1'],['action','process'],['json','1'],['page_size','12'],['fields','code,product_name,product_name_de,brands,nutriments']])url.searchParams.set(key,value);
   const response=await fetch(url.toString(),{signal:controller.signal,headers:{Accept:'application/json'}});
   if(!response.ok)throw Error('HTTP '+response.status);
   const data=await response.json();
   let candidates=(data.products||[]).map(p=>{
      let m=p.nutriments||{},kcal=Number(m['energy-kcal_100g']);
      if(!Number.isFinite(kcal)) {const kj=Number(m['energy-kj_100g']);kcal=Number.isFinite(kj)?kj/4.184:NaN}
      const pro=Number(m.proteins_100g),carbs=Number(m.carbohydrates_100g),fat=Number(m.fat_100g);
      if(![kcal,pro,carbs,fat].every(Number.isFinite)||kcal<0||kcal>900||pro<0||carbs<0||fat<0||pro>100||carbs>100||fat>100)return null;
      const name=String(p.product_name_de||p.product_name||'').trim();
      return name?{name,brand:String(p.brands||''),kcal,p:pro,c:carbs,f:fat,code:String(p.code||'')}:null;
   }).filter(Boolean);
   candidates.sort((a,b)=>offerScore(b,query)-offerScore(a,query));
   if(ownToken!==lookupToken||$('quickSpeech').value.trim()!==fullText)return;
   productOffers=candidates.slice(0,7);
   const best=candidates[0],second=candidates[1];
   // Nur bei eindeutig identischem Produkt und Brand automatisch übernehmen.
   const score=best?offerScore(best,query):0,score2=second?offerScore(second,query):0;
   const strong=best&&score>=26&&score-score2>8&&normalize(query)===normalize(best.name+' '+best.brand);
   if(strong){learnProduct(query,best);analyze(fullText,false);return}
   renderProductOffers(query,productOffers,candidates.length?'':"Keine vollständigen, passenden Nährwertangaben in der Datenbank gefunden.");
 }catch(e){
   if(ownToken!==lookupToken||$('quickSpeech').value.trim()!==fullText)return;
   renderProductOffers(query,[],'Automatische Produktrecherche derzeit nicht erreichbar. Grund: '+e.message+'. Die App kann dieses Produkt ohne überprüfte Nährwerte nicht automatisch berechnen.');
 }finally{clearTimeout(timeout);lookupBusy=false}
}
function learnProduct(key,p){
 const item={name:p.name+' · '+(p.brand||'Produkt'),kcal:p.kcal,p:p.p,c:p.c,f:p.f,source:'Open Food Facts'+(p.code?' / Barcode '+p.code:'')};
 learned[normalize(key)]=item;
 try{localStorage.setItem(PRODUCT_STORE,JSON.stringify(learned))}catch(_){}
}
function chooseProduct(index) {
 const p=productOffers[index],term=currentUnknown;
 if(!p||!term)return;
 learnProduct(term,p);
 $('gsProductLookup').innerHTML='';
 const text=$('quickSpeech').value.trim();
 if(text)analyze(text,false);
 else show('Produkt gespeichert. Bitte Mahlzeit erneut auswerten.');
}

function analyze(text,allowSearch=true){
 const content=String(text||'').trim();
 if(!content){clearDraft();return false}
 const recovered=oldMeal(content);
 const p=recovered||parseFreeText(content);
 if(p.error){
  clearDraft(p.error);
  setBreakdown([],p.error);
  lastError=p.error;
  show(p.error+' Es wird keine unvollständige Kalorienzahl gespeichert.',true);
  if(p.unknown&&allowSearch){
    const lookup=()=>researchUnknown(p.unknown.label,content);
    if(!lookupBusy&&Date.now()-lastLookup>=6500)lookup();
    else if(!lookupBusy){clearTimeout(researchTimer);researchTimer=setTimeout(lookup,6500-Math.min(6499,Date.now()-lastLookup));}
  }
  return false;
 }
 lastError='';fillDraft(p.entries,content);return true;
}
function applySaved(f,qty,unit){
 const original=gramsFromSaved(f);
 if(!(original>0)||unit!==unitFromSaved(f)){show('Gespeicherte Portion ohne umrechenbares Gewicht. Bitte die Originaleinheit verwenden.',true);return false}
 const fac=qty/original;
 return fillDraft([{name:f.name,qty,unit,grams:unit==='g'?qty:qty,
   kcal:Number(f.kcal)*fac,p:Number(f.p)*fac,c:Number(f.c)*fac,f:Number(f.f)*fac,
   assumption:'gleiches Rezept',source:'gespeicherte Mahlzeit'}],''),true;
}
function onQuantityChanged(){
 const q=number($('foodGrams').value),u=getUnit();
 if(components.length>1){clearDraft('Mehrere Lebensmittel: Bitte die Einzelmengen im Freitext ändern. Das Gesamtgewicht lässt sich nicht eindeutig verteilen.');return;}
 if(!basis||!(q>0)||basis.unit!==u||$('foodName').value!==basis.name){
  if(components.length)clearDraft('Portion geändert. Bitte neu berechnen, damit keine alten Werte verwendet werden.');
  return;
 }
 const fac=q/basis.qty;
 const rows=components.map(x=>({...x,qty:x.qty*fac,grams:x.grams*fac,kcal:x.kcal*fac,p:x.p*fac,c:x.c*fac,f:x.f*fac}));
 fillDraft(rows,lastText);
}
function editExisting(f){
 components=[];lastText='';window.GSMealDraftComponents=null;basis=null;lastError='';
 const q=gramsFromSaved(f);if(q>0){$('foodGrams').value=q;setUnit(unitFromSaved(f));}
 if(f.components?.length){
   const c=f.components.map(x=>({name:x.name,qty:Number(x.quantity??x.qty),unit:x.unit||'g',grams:Number(x.grams??x.quantity??0),kcal:Number(x.kcal)||0,p:Number(x.p)||0,c:Number(x.c)||0,f:Number(x.f)||0,assumption:x.assumption||'',source:x.source||''}));
   setBreakdown(c);window.GSMealDraftComponents=f.components.map(x=>({...x}));
 }else setBreakdown([]);
}
function setup(){
 if(!$('quickSpeech')||!$('foodGrams')||!foods.length)return;
 // Ein einziges aktives Analysemodul – inklusive eigener Bedienoberfläche.
 if(!$('nutCalculate')){
   const form=document.createElement('div');form.id='gsAutoCalcControls';
   form.innerHTML='<div class="btnrow" style="margin:8px 0"><button type="button" class="btn" id="nutCalculate">⚡ Mahlzeit berechnen</button><button type="button" class="btn second" id="gsSearchManually">🔎 Produkt recherchieren</button></div><div id="nutFeedback" class="hint hidden" role="status"></div>';
   $('foodKcal').closest('.fieldrow').insertAdjacentElement('afterend',form);
 }
 if($('gsSearchManually'))$('gsSearchManually').onclick=()=>{
   const query=String($('foodName').value||$('quickSpeech').value||'').trim();
   if(!query){show('Bitte Lebensmittel oder Marke nennen.',true);return;}
   researchUnknown(query,$('quickSpeech').value.trim(),true);
 };
 // Ältere Parser greifen an dieselben Felder: die neue Eingabe übernimmt ihre Ereignisse.
 for(const id of ['foodGrams','foodName','foodUnit','recentMeals']){
  const old=$(id),clone=old.cloneNode(true);old.replaceWith(clone);
 }
 const preview=document.createElement('div');preview.id='gsBreakdown';preview.setAttribute('aria-live','polite');
 $('quickSpeech').closest('.field').appendChild(preview);
 const productLookup=document.createElement('div');productLookup.id='gsProductLookup';productLookup.setAttribute('aria-live','polite');
 $('quickSpeech').closest('.field').appendChild(productLookup);
 productLookup.addEventListener('click',e=>{const el=e.target.closest('[data-choose-product]');if(el)chooseProduct(Number(el.dataset.chooseProduct));});
 $('parseSpeech').onclick=()=>analyze($('quickSpeech').value);
 $('quickSpeech').addEventListener('input',()=>{
  clearTimeout(timer);
  const s=$('quickSpeech').value.trim();
  if(!s){if(components.length)clearDraft();setBreakdown([]);return;}
  timer=setTimeout(()=>analyze(s),500);
 });
 $('nutCalculate').onclick=()=>{
  if($('quickSpeech').value.trim())return analyze($('quickSpeech').value);
  const name=$('foodName').value.trim(),qty=number($('foodGrams').value),unit=getUnit();
  if(!name){show('Bitte Lebensmittel oder Gericht nennen.',true);return;}
  if(qty>0){
   const matches=(typeof recentFoodOptions==='function'?recentFoodOptions():[]).filter(f=>normalize(f.name)===normalize(name)&&unitFromSaved(f)===unit);
   if(matches.length===1){applySaved(matches[0],qty,unit);return;}
   const r=parseFreeText(qty+' '+unit+' '+name);
   if(r.error){show(r.error,true);return;}
   fillDraft(r.entries,'');return;
  }
  return analyze(name);
 };
 $('foodGrams').addEventListener('input',onQuantityChanged);
 $('foodUnit').addEventListener('change',onQuantityChanged);
 $('foodName').addEventListener('input',()=>{if(components.length)clearDraft('Lebensmittelbezeichnung geändert; bitte neu berechnen.')});
 $('preset').addEventListener('change',()=>{if($('preset').value){$('quickSpeech').value='';components=[];basis=null;lastText='';window.GSMealDraftComponents=null;setBreakdown([]);}});
 $('nutProducts')?.addEventListener('click',e=>{if(e.target.closest('[data-off-idx]')){$('quickSpeech').value='';components=[];basis=null;lastText='';window.GSMealDraftComponents=null;setBreakdown([]);}});
 $('recentMeals').addEventListener('change',e=>{
  const k=e.target.value,f=window._recentFoodOptions?.[Number(k)];
  if(k!==''&&f){$('quickSpeech').value='';lastText='';applySaved(f,gramsFromSaved(f),unitFromSaved(f));}
 });
 $('foodEntries').addEventListener('click',e=>{
  const b=e.target.closest('[data-edit-food]');if(!b)return;
  const f=day().foods.find(x=>x.id===b.dataset.editFood);
  if(f)setTimeout(()=>editExisting(f),0);
 });
 // Bewahrt die vorhandene Speicher-, Foto- und lokale Historienfunktion.
 $('saveFood').onclick=()=>{
  const speech=$('quickSpeech').value.trim();
  if(speech&&!replaying &&(!components.length||speech!==lastText)){if(!analyze(speech))return;}
  if(!String($('foodKcal').value).trim()){
   if(speech){show(lastError||'Die Freitextangaben sind noch nicht vollständig erkannt.',true);return}
   const name=$('foodName').value.trim(),qty=number($('foodGrams').value);
   if(!(qty>0)){show('Bitte Menge und Lebensmittel benennen, damit die App automatisch rechnen kann.',true);return;}
   const p=parseFreeText(qty+' '+getUnit()+' '+name);
   if(p.error){show(p.error,true);return;}
   fillDraft(p.entries,'');
  }
  // Bei bearbeiteten Alt-Einträgen ohne neuen Freitext bestehende Komponenten beibehalten.
  recordFood();
  if(!$('foodName').value.trim()){
    lastText='';components=[];basis=null;window.GSMealDraftComponents=null;
    $('quickSpeech').value='';setBreakdown([]);lastError='';
  }
 };
 $('analyzePhoto').textContent='📷 Foto prüfen';
 $('analyzePhoto').onclick=()=>{
  if($('photoPreview').classList.contains('hidden')){show('Bitte zuerst das Foto aufnehmen.',true);return;}
  if($('quickSpeech').value.trim())return analyze($('quickSpeech').value);
  show('Das Foto ist gespeichert. Für automatische Bilderkennung und Portionsermittlung fehlt noch ein sicherer Bildanalysedienst; aus einem einzelnen Bild sind Grammangaben nicht verlässlich. Du kannst das Foto im Chat teilen.',true);
 };
 $('speechHelp').textContent='Freitext wird automatisch aufgeschlüsselt. Beispiel: „Einen Kaffee mit 100 ml Milch 1,5 % und 20 g Datteln“. Unbekannte Markenprodukte werden online gesucht; unklare Treffer musst du nur einmal zuordnen.';
 const badge=$('gsBuildVersion');if(badge)badge.textContent='Get Shaped · Analyse-Version 18 · Online-Produktsuche verfügbar';
 const update=$('gsForceUpdate');if(update)update.onclick=async()=>{
   try{await navigator.serviceWorker?.getRegistration()?.then(reg=>reg?.update())}catch(_){}
   const url=new URL(window.location.href);url.searchParams.set('appVersion','18');url.searchParams.set('refresh',String(Date.now()));
   window.location.replace(url.toString());
 };
}
window.GSMealParserV3={parseFreeText,standardize,splitFood,itemFromSegment,oldMeal,summarize,researchUnknown,offerScore};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);
else setup();
})();