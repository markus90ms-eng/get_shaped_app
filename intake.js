/* Get Shaped: Freitext und Mengenverarbeitung v2 – keine Übertragung von Tagebuchdaten */
(() => {
 'use strict';
 const $=id=>document.getElementById(id);
 const N=window.GetShapedNutrition||{};
 const foods=N.foods||[];
 const norm=s=>String(s??'').toLocaleLowerCase('de').replace(/ß/g,'ss').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').replace(/ae/g,'a').replace(/oe/g,'o').replace(/ue/g,'u').trim().replace(/\s+/g,' ');
 const n=v=>{let x=Number(String(v??'').replace(',','.'));return Number.isFinite(x)?x:NaN};
 const rd=x=>Math.round(x*10)/10;
 const unitParts='milliliter|esslöffel|essloffel|teelöffel|teeloffel|gramm|stücke|stück|stuecke|stueck|liter|kg|ml|stk\\.?|gr|g|el|tl|l';
 const startPattern=new RegExp('^(\\d+(?:[.,]\\d+)?)\\s*(?:('+unitParts+')\\s*)?\\s+(.+)$','i');
 const endPattern=new RegExp('^(.+?)\\s+(\\d+(?:[.,]\\d+)?)\\s*('+unitParts+')$','i');
 const qtyPattern=new RegExp('(\\d+(?:[.,]\\d+)?)\\s*('+unitParts+')(?:\\b|\\.)','i');
 const words={'einer':1,'einem':1,'einen':1,'eine':1,'ein':1,'zwei':2,'drei':3,'vier':4,'fünf':5,'fuenf':5,'sechs':6,'sieben':7,'acht':8,'neun':9,'zehn':10,'elf':11,'zwölf':12,'zwoelf':12,'halbe':.5,'halb':.5};
 const stop=new Set('ich habe hatte heute gestern vorgestern von vom der die das den dem ein eine einer zum zur mittag mittagessen frühstück fruhstuck abendessen abends morgens esse gegessen gekocht ca etwa ungefähr ungefahr rest reste restportion ubrig noch die und sowie nach von mit es gab das war wurden'.split(' '));
 const readUnit=()=>$('foodUnit')?.value||'g';
 const setUnit=u=>{if($('foodUnit'))$('foodUnit').value=u};
 const sign=()=>norm($('foodName').value)+'|'+$('foodGrams').value+'|'+readUnit();
 let basis=null,signature='',processedSpeech='',busy=false;

 function notify(msg,warn=false){
   const el=$('nutFeedback')||$('speechHelp');
   if(!el)return;
   el.textContent=msg;el.className=warn?'warnline':'hint';el.classList.remove('hidden');
 }
 function foodByName(label){
   const key=norm(label);
   const allowed=new Set('bio frisch frische rohen roh gebraten gegart gekocht hart weich mittelweich natur gedunstet gedampft gedämpft gebacken klein große grosse fettarm natürlich'.split(' ').map(norm));
   let matches=[];
   for(const f of foods)for(const a of f.aliases||[]){
     const alias=norm(a);
     if(key===alias){matches.push({f,score:100+alias.length});continue;}
     if(!(' '+key+' ').includes(' '+alias+' '))continue;
     const remaining=key.replace(alias,' ').trim().split(' ').filter(Boolean);
     if(remaining.length&&remaining.every(w=>allowed.has(w)))matches.push({f,score:alias.length});
   }
   matches.sort((a,b)=>b.score-a.score);
   return matches[0]?.f||null;
 }
 function unitOf(raw,qty,item){
   const u=norm(raw);
   if(u==='kg')return {qty:qty*1000,unit:'g'};
   if(u==='l'||u==='liter')return {qty:qty*1000,unit:'ml'};
   if(['el','essloffel'].includes(u))return {qty:qty*15,unit:'ml',approx:true};
   if(['tl','teeloffel'].includes(u))return {qty:qty*5,unit:'ml',approx:true};
   if(['ml','milliliter'].includes(u))return {qty,unit:'ml'};
   if(['stuck','stucke','stueck','stuecke','stk'].includes(u))return {qty,unit:'Stück'};
   if(['g','gr','gramm'].includes(u))return {qty,unit:'g'};
   if(!u&&item.piece)return {qty,unit:'Stück',approx:true};
   return null;
 }
 function gramMass(q,u,item){
   if(!(q>0&&q<=10000))return NaN;
   if(u==='Stück')return item.piece?q*item.piece:NaN;
   if(u==='ml'){
     const k=norm(item.name);
     return q*(/öl/i.test(item.name)||/ghee|butterschmalz/i.test(item.name)?.91:/milch|kefir/.test(k)?1.03:1);
   }
   return q;
 }
 function normalizePhrase(source){
   let text=String(source||'').trim();
   for(let i=0;i<7;i++){
     let old=text;
     text=text.replace(/^(?:heute|gestern)(?:\s+(?:morgen|mittag|abend))?\s*[,:]?\s*/i,'')
       .replace(/^(?:zum|als|fürs|fuers)\s+(?:frühstück|fruehstueck|mittag(?:essen)?|abendessen)\s*[,:]?\s*/i,'')
       .replace(/^(?:ich\s+(?:habe|hab|hatte|esse|aß|ass)|habe\s+ich|hab\s+ich|hatte\s+ich|es\s+gab|gab\s+es)\s*/i,'')
       .replace(/^(?:ca\.?|etwa|ungefähr|ungefaehr|insgesamt|davon)\s*/i,'');
     if(text===old)break;
   }
   return text.replace(/\s+(?:gegessen|verzehrt|gegessen habe|gehabt)\s*[.!]?\s*$/i,'').trim();
 }
 function splitParts(source){
   return normalizePhrase(source).replace(/(\d),(\d)/g,'$1§$2')
     .split(/\s*(?:,|;|\+|\bund\b|\bplus\b|\bmit\b(?=\s*(?:\d|ein\b|eine\b|zwei\b|drei\b|vier\b|fünf\b|fuenf\b)))\s*/i)
     .map(x=>x.replace(/§/g,',').trim()).filter(Boolean);
 }
 function parseText(source,fallback=null){
   const segments=splitParts(source), entries=[];
   if(!segments.length)return {error:'Keine Mahlzeit erkannt.'};
   for(let chunk of segments){
     chunk=chunk.replace(/^(einer|einem|einen|eine|ein|zwei|drei|vier|fünf|fuenf|sechs|sieben|acht|neun|zehn|elf|zwölf|zwoelf|halbe|halb)\b/i,m=>String(words[m.toLowerCase()]??m));
     const a=chunk.match(startPattern),b=chunk.match(endPattern);
     let name,quantity,rawUnit;
     if(a){quantity=n(a[1]);rawUnit=a[2]||'';name=a[3];}
     else if(b){name=b[1];quantity=n(b[2]);rawUnit=b[3];}
     else if(segments.length===1&&fallback&&fallback.qty>0){name=chunk;quantity=fallback.qty;rawUnit=fallback.unit;}
     else return {error:'Menge bei „'+chunk+'“ nicht eindeutig. Diktiere z. B. „150 Gramm '+chunk+'“.'};
     const item=foodByName(name);
     if(!item)return {error:'„'+name+'“ konnte nicht sicher zugeordnet werden. Bitte Produkt auswählen oder Zutaten genauer benennen.',unknown:name};
     const amount=unitOf(rawUnit,quantity,item);
     if(!amount)return {error:'Für „'+name+'“ fehlt die Einheit. Bitte Gramm, Milliliter oder Stück angeben.'};
     const mass=gramMass(amount.qty,amount.unit,item);
     if(!(mass>0&&mass<=10000))return {error:'Für „'+name+'“ kann kein verlässliches Stückgewicht geschätzt werden. Bitte Gramm angeben.'};
     entries.push({item,qty:amount.qty,unit:amount.unit,mass,approx:!!amount.approx});
   }
   return {entries};
 }
 function savedQuantity(f){
   if(n(f.quantity)>0)return n(f.quantity);
   const m=String(f.grams||'').match(/^\s*(\d+(?:[.,]\d+)?)/);
   return m?n(m[1]):NaN;
 }
 function savedUnit(f){
   if(['g','ml','Stück'].includes(f.unit))return f.unit;
   let s=String(f.grams||'');
   return /\bml\b/i.test(s)?'ml':/stück|stueck|\bstk\b/i.test(s)?'Stück':'g';
 }
 function setValues(name,qty,unit,total,description){
   $('foodName').value=name;$('foodGrams').value=rd(qty);setUnit(unit);
   for(const [id,key] of [['foodKcal','kcal'],['foodProtein','p'],['foodCarbs','c'],['foodFat','f']])$(id).value=rd(total[key]);
   if(description)$('foodNote').value=description;
   signature=sign();
 }
 function remember(name,qty,unit,total,type){
   basis={name:norm(name),qty,unit,kcal:n(total.kcal),p:n(total.p),c:n(total.c),f:n(total.f),type};
   signature=sign();
 }
 function scale(qty,unit){
   if(!basis||!(qty>0)||basis.name!==norm($('foodName').value)||basis.unit!==unit)return false;
   let ratio=qty/basis.qty;
   for(const [id,key] of [['foodKcal','kcal'],['foodProtein','p'],['foodCarbs','c'],['foodFat','f']])$(id).value=rd(basis[key]*ratio);
   signature=sign();
   notify('Menge angepasst: '+rd(qty)+' '+unit+', ca. '+rd(basis.kcal*ratio)+' kcal.');
   return true;
 }
 function fromSaved(f,qty,unit){
   const b=savedQuantity(f),originalUnit=savedUnit(f);
   if(!(b>0&&qty>0)||unit!==originalUnit){notify('Dieses Gericht wurde ursprünglich in '+originalUnit+' erfasst. Bitte dieselbe Einheit verwenden.',true);return false}
   let ratio=qty/b,tot={kcal:n(f.kcal)*ratio,p:n(f.p)*ratio,c:n(f.c)*ratio,f:n(f.f)*ratio};
   setValues(f.name,qty,unit,tot,'Übernommen aus '+(f._date||'gespeichertem Rezept')+'; Portion proportional umgerechnet. '+(f.note||''));
   remember(f.name,b,unit,f,'saved');
   notify('Gespeichertes Gericht übernommen: '+rd(qty)+' '+unit+' · '+rd(tot.kcal)+' kcal. Das Rezept muss unverändert sein.');
   return true;
 }
 function findSaved(spoken){
   const m=spoken.match(qtyPattern);
   if(!m)return {error:'Bitte die Restportion direkt im Satz nennen, z. B. „550 g von der Pfanne von gestern“.'};
   const amount=unitOf(m[2],n(m[1]),{piece:true});
   if(!amount)return {error:'Einheit der Restportion nicht erkannt.'};
   const date=new Date(selected+'T12:00:00');
   date.setDate(date.getDate()-(/vorgestern/i.test(spoken)?2:1));
   const prev=datestr(date), yesterday=/gestern|vortag/i.test(spoken);
   const wanted=norm(spoken.replace(m[0],' ')).replace(/hahnchenpfanne/g,'hahnchen pfanne').replace(/gemusepfanne/g,'gemuse pfanne');
   const tokens=wanted.split(' ').filter(w=>w.length>2&&!stop.has(w));
   const options=(typeof recentFoodOptions==='function'?recentFoodOptions():[])
     .filter(f=>savedQuantity(f)>0&&savedUnit(f)===amount.unit)
     .map(f=>{
       const title=norm(f.name),overlap=tokens.filter(w=>title.includes(w)).length;
       return {f,score:overlap*5+(yesterday&&f._date===prev?2:0),overlap,sameDay:f._date===prev};
     })
     .filter(x=>tokens.length?x.overlap>0:x.sameDay)
     .sort((a,b)=>b.score-a.score);
   if(!options.length)return {error:'Kein gespeichertes Gericht passt eindeutig. Wähle es aus „Kürzlich gegessene Gerichte“.'};
   if(options[1]&&options[0].score===options[1].score)return {error:'Mehrere Gerichte passen auf deine Beschreibung. Bitte den Gerichtnamen genauer nennen oder das Gericht auswählen.'};
   return {food:options[0].f,...amount};
 }
 function fromParsed(result){
   if(!result?.entries?.length)return false;
   let total={kcal:0,p:0,c:0,f:0},mass=0;
   for(const {item,mass:g} of result.entries){mass+=g;for(const k of Object.keys(total))total[k]+=item[k]*g/100;}
   const single=result.entries.length===1;
   const qty=single?result.entries[0].qty:mass,unit=single?result.entries[0].unit:'g';
   const name=single?result.entries[0].item.name:result.entries.map(x=>x.item.name).join(', ');
   let desc='Nährwerte aus Orientierungswerten: '+result.entries.map(x=>rd(x.qty)+' '+x.unit+' '+x.item.name).join('; ')+'.';
   if(result.entries.some(x=>x.unit==='ml'))desc+=' Flüssigkeiten mit angenäherter Dichte in Gramm umgerechnet.';
   if(!single)desc+=' Gewicht der Zutaten vor dem Garen; fertige Teilportionen können anderes Gewicht haben.';
   setValues(name,qty,unit,total,desc);remember(name,qty,unit,total,'local');
   notify('Erkannt: '+rd(qty)+' '+unit+' · ca. '+rd(total.kcal)+' kcal · '+rd(total.p)+' g Protein · '+rd(total.c)+' g KH · '+rd(total.f)+' g Fett.'+(single?'':' Für Reste das spätere fertige Gesamtgewicht beachten.'));
   return true;
 }
 function parseSpeech(){
   const sentence=$('quickSpeech').value.trim();
   if(!sentence){notify('Bitte zuerst deine Mahlzeit sprechen oder schreiben.',true);return false}
   if(/\b(?:gestern|vorgestern|vortag|rest|reste|übrig|ubrig)\b/i.test(sentence)){
     const match=findSaved(sentence);
     if(!match.error){
       const success=fromSaved(match.food,match.qty,match.unit);
       if(success)processedSpeech=sentence;
       return success;
     }
     const fallback=parseText(sentence);
     if(fallback.entries?.length){const success=fromParsed(fallback);if(success)processedSpeech=sentence;return success;}
     notify(match.error,true);return false;
   }
   const parsed=parseText(sentence);
   if(parsed.error){notify(parsed.error,true);if(parsed.unknown)$('foodName').value=parsed.unknown;return false}
   if(fromParsed(parsed)){processedSpeech=sentence;return true}
   return false;
 }
 function parseManual(){
   const name=$('foodName').value.trim(),qty=n($('foodGrams').value),unit=readUnit();
   if(!name){notify('Bitte zuerst Lebensmittel oder Freitext eintragen.',true);return false}
   const list=typeof recentFoodOptions==='function'?recentFoodOptions():[];
   const saved=list.filter(f=>norm(f.name)===norm(name)&&savedUnit(f)===unit&&savedQuantity(f)>0);
   if(saved.length===1&&qty>0)return fromSaved(saved[0],qty,unit);
   const parsed=parseText(name,qty>0?{qty,unit}:null);
   if(parsed.error){notify(parsed.error,true);return false}
   return fromParsed(parsed);
 }
 function setup(){
   if(!$('foodGrams')||!$('parseSpeech')||!foods.length)return;
   // Entfernt alte, fehlerhafte Listener für Mengen und Freitext, ohne Form oder gespeicherte Daten neu anzulegen.
   for(const id of ['foodGrams','foodName','recentMeals']){
     const old=$(id),repl=old.cloneNode(true);old.replaceWith(repl);
   }
   $('parseSpeech').onclick=()=>parseSpeech();
   $('nutCalculate').onclick=()=>{if($('quickSpeech').value.trim()&&processedSpeech!==$('quickSpeech').value.trim())parseSpeech();else if(signature===sign()&&$('foodKcal').value.trim())notify('Die Mengen und Nährwerte sind bereits übernommen. Du kannst die Mahlzeit speichern.');else parseManual()};
   $('recentMeals').onchange=e=>{
     const idx=Number(e.target.value),food=window._recentFoodOptions?.[idx];
     if(e.target.value!==''&&food)fromSaved(food,savedQuantity(food),savedUnit(food));
   };
   $('foodGrams').oninput=()=>{
     const q=n($('foodGrams').value);
     if(scale(q,readUnit()))return;
     if(signature&&sign()!==signature){for(const id of ['foodKcal','foodProtein','foodCarbs','foodFat'])$(id).value='';signature='';notify('Menge verändert: Nährwerte erneut automatisch berechnen.',true)}
   };
   $('foodUnit').onchange=()=>{
     if(scale(n($('foodGrams').value),readUnit()))return;
     signature='';basis=null;
     for(const id of ['foodKcal','foodProtein','foodCarbs','foodFat'])$(id).value='';
     notify('Einheit geändert. Tippe auf „Automatisch berechnen“ – bei verschiedenen Einheiten ist keine direkte Portion-Umrechnung möglich.',true);
   };
   $('foodName').oninput=()=>{
     if(signature&&sign()!==signature){signature='';basis=null;for(const id of ['foodKcal','foodProtein','foodCarbs','foodFat'])$(id).value=''}
   };
   $('preset').addEventListener('change',()=>{
     const key=$('preset').value,ref=typeof presets!=='undefined'?presets[key]:null;
     if(!ref)return;
     const u=key==='egg'?'Stück':'g';setUnit(u);
     const name=$('foodName').value,qty=n($('foodGrams').value);
     if(qty>0){
       let total={kcal:ref.kcal,p:ref.p,c:ref.c,f:ref.f};
       remember(name,qty,u,{kcal:total.kcal,p:total.p,c:total.c,f:total.f},'preset');
       signature=sign();
     }
   });
   $('foodEntries').addEventListener('click',e=>{
     if(!e.target.closest('[data-edit-food]'))return;
     const f=day().foods.find(x=>x.id===e.target.closest('[data-edit-food]').dataset.editFood);
     if(!f)return;
     const q=savedQuantity(f),u=savedUnit(f);if(q>0){setUnit(u);$('foodGrams').value=q;remember(f.name,q,u,f,'editing')}
   });
   const save=$('saveFood');
   save.onclick=()=>{
     const sentence=$('quickSpeech').value.trim();
     if(sentence&&processedSpeech!==sentence){if(!parseSpeech())return}
     if(signature&&sign()!==signature&&!scale(n($('foodGrams').value),readUnit())){
       for(const id of ['foodKcal','foodProtein','foodCarbs','foodFat'])$(id).value='';
     }
     if(!$('foodKcal').value.trim()&&!parseManual()){notify('Noch keine sichere Nährwertberechnung. Bitte Lebensmittel konkretisieren oder das passende Produkt wählen.',true);return}
     recordFood();
     if(!$('foodName').value.trim()){processedSpeech='';basis=null;signature='';$('quickSpeech').value=''}
   };
   // Foto wird lokal gespeichert, ohne abgesicherten KI-Bilderkennungsdienst keine seriöse vollautomatische Schätzung.
   $('analyzePhoto').textContent='📷 Foto prüfen';
   $('analyzePhoto').onclick=()=>{
     if($('photoPreview').classList.contains('hidden')){notify('Bitte zuerst ein Foto aufnehmen.',true);return}
     if($('quickSpeech').value.trim()){parseSpeech();return}
     notify('Foto vorhanden. Eine zuverlässige automatische Lebensmittel- und Mengenanalyse nur aus dem Foto ist noch nicht angebunden. Tippe „Fotos teilen“, um das Bild im Chat auswerten zu lassen; alternativ genügt ein diktierter Satz mit Mengenangaben.',true);
   };
   $('speechHelp').textContent='Beispiele: „250 ml Milch 1,5 Prozent und 2 Eier“, „200 g Hähnchen, 150 g Zucchini und 10 g Olivenöl“ oder „550 g von der Pfanne von gestern“. Mengen und Einheiten werden automatisch übernommen.';
 }
 window.GSMealParser={parseText,findSaved,savedQuantity,savedUnit,foodByName};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);
 else setup();
})();