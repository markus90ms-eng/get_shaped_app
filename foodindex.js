/* Get Shaped – Lebensmittel-Index: Katalog + Presets + komplette Historie + privater Katalog, mit Tippfehler-Toleranz. */
(() => {
'use strict';
const PRIVATE_CATALOGUE='get_shaped_private_catalogue_v1';
const FILLER=new Set(['natur','bio','frisch','frische','frischer','gekochte','gekochter','gekocht','gegart','gegarte','gebraten','gebratene','roh','rohe','rohen','getrocknet','getrocknete','schwarz','schwarzer','fettarm','ungesusst','von','vom','der','die','das','den','dem','ein','eine','einen','etwas','ca','circa','etwa','mit','ohne','aus']);
const norm=s=>String(s??'').toLocaleLowerCase('de').replace(/ß/g,'ss').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/ae/g,'a').replace(/oe/g,'o').replace(/ue/g,'u').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
const stem=w=>w.length>5?w.replace(/(en|er|n|e|s)$/,''):w;
const tokens=s=>norm(s).split(' ').filter(Boolean);
const num=x=>{const n=Number(String(x??'').replace(',','.'));return Number.isFinite(n)?n:NaN};
function lev(a,b){
  if(Math.abs(a.length-b.length)>2)return 9;
  let prev=Array.from({length:b.length+1},(_,i)=>i);
  for(let i=1;i<=a.length;i++){
    const cur=[i];
    for(let j=1;j<=b.length;j++)cur[j]=Math.min(prev[j]+1,cur[j-1]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));
    prev=cur;
  }
  return prev[b.length];
}
function tokenDistance(a,b){
  if(a===b)return 0;
  const sa=stem(a),sb=stem(b);
  if(sa===sb)return 0.5;
  const d=lev(sa,sb),len=Math.min(sa.length,sb.length);
  if(len>=9&&d<=2)return d;
  if(len>=5&&d<=1)return d;
  return Infinity;
}
let cache=null,cacheAt=0;
function readPrivate(){try{const v=JSON.parse(localStorage.getItem(PRIVATE_CATALOGUE)||'[]');return Array.isArray(v)?v:[]}catch(_){return []}}
function perHundred(kcal,p,c,f,qty){
  const k=100/qty;
  return {kcal:kcal*k,p:p*k,c:c*k,f:f*k};
}
function historyEntries(){
  const out=new Map();
  let days={};try{days=(typeof db!=='undefined'&&db.days)||{}}catch(_){}
  const dates=Object.keys(days).sort();                 // aufsteigend: neuere Einträge überschreiben ältere
  const add=(name,qty,unit,kcal,p,c,f,source)=>{
    if(!name||!(qty>0)||!Number.isFinite(kcal))return;
    const key=norm(name);if(!key)return;
    let per,piece=null,virtualPiece=false;
    if(unit==='Stück'){per={kcal,p,c,f};per={kcal:kcal/qty,p:p/qty,c:c/qty,f:f/qty};piece=100;virtualPiece=true}
    else per=perHundred(kcal,p,c,f,qty);
    out.set(key,{name,kcal:per.kcal,p:per.p,c:per.c,f:per.f,piece,virtualPiece,aliases:[key],source});
  };
  for(const date of dates)for(const food of days[date].foods||[]){
    const qty=num(food.quantity)>0?num(food.quantity):num(String(food.grams||'').match(/^\s*(\d+(?:[.,]\d+)?)/)?.[1]);
    const unit=['g','ml','Stück'].includes(food.unit)?food.unit:'g';
    if(food.components?.length>1){
      for(const x of food.components)add(x.name,num(x.quantity),x.unit||'g',num(x.kcal),num(x.p)||0,num(x.c)||0,num(x.f)||0,'Verlauf '+date);
    }
    add(food.name,qty,unit,num(food.kcal),num(food.p)||0,num(food.c)||0,num(food.f)||0,'Verlauf '+date);
  }
  return [...out.values()];
}
function presetEntries(){
  const presets=window.TRACKER_SEED?.presets||{};
  return Object.values(presets).filter(x=>x.unit>0).map(x=>{
    const per=perHundred(x.kcal,x.p,x.c,x.f,x.unit);
    const isCount=x.unit===1;
    return {name:x.name.replace(/\s*·.*$/,''),...(isCount?{kcal:x.kcal,p:x.p,c:x.c,f:x.f,piece:100,virtualPiece:true}:per),aliases:[norm(x.name.replace(/\s*·.*$/,''))],source:'Preset'};
  });
}
function privateEntries(){
  return readPrivate().filter(x=>x?.name&&Number.isFinite(num(x.kcal))).map(x=>{
    const names=[x.name,...(x.aliases||[])].map(norm).filter(Boolean);
    const per=String(x.per||'100 g');
    const base=num(per.match(/[\d.,]+/)?.[0])||100;
    const q=perHundred(num(x.kcal),num(x.protein??x.p)||0,num(x.carbs??x.c)||0,num(x.fat??x.f)||0,base);
    return {name:x.name,...q,piece:num(x.stueckgewicht_g)>0?num(x.stueckgewicht_g):null,aliases:names,source:x.marke_oder_quelle||'Privater Katalog'};
  });
}
function entries(){
  if(cache&&Date.now()-cacheAt<2000)return cache;
  // Reihenfolge = Priorität bei Gleichstand: privater Katalog > Verlauf > Presets > Grundkatalog.
  cache=[...privateEntries(),...historyEntries().reverse(),...presetEntries(),...(window.GetShapedNutrition?.foods||[])];
  cacheAt=Date.now();return cache;
}
function score(queryTokens,aliasTokens){
  if(!queryTokens.length||!aliasTokens.length)return -1;
  let dist=0;
  for(const a of aliasTokens){                         // jedes Wort des Alias muss in der Anfrage vorkommen
    const best=Math.min(...queryTokens.map(q=>tokenDistance(q,a)));
    if(!Number.isFinite(best))return -1;dist+=best;
  }
  for(const q of queryTokens){                          // und jedes Wort der Anfrage im Alias – sonst wäre es ein anderes Lebensmittel
    const best=Math.min(...aliasTokens.map(a=>tokenDistance(q,a)));
    if(!Number.isFinite(best))return -1;
  }
  return 100+aliasTokens.join('').length-dist*5;
}
function match(label){
  const key=norm(label);if(!key)return null;
  const q=key.split(' ').filter(w=>!FILLER.has(w));
  const qt=q.length?q:key.split(' ');
  let best=null,tie=false;
  for(const e of entries()){
    for(const raw of e.aliases||[]){
      const alias=norm(raw),words=alias.split(' '),core=words.filter(w=>!FILLER.has(w));
      let s=key===alias?1000:score(qt,core.length?core:words);
      if(s<0)continue;
      s+=words.filter(w=>FILLER.has(w)&&key.split(' ').includes(w)).length*20;   // „gebraten“, „roh“ … bevorzugen die passende Variante
      if(!best||s>best.s){best={e,s};tie=false}
      else if(s===best.s&&best.e!==e&&norm(best.e.name)!==norm(e.name))tie=Math.abs(best.e.kcal-e.kcal)>Math.max(5,best.e.kcal*0.1);
    }
  }
  return best&&!tie?{...best.e}:null;
}
function importCatalogue(json){
  const list=Array.isArray(json)?json:(json?.lebensmittel||json?.foods||[]);
  if(!Array.isArray(list)||!list.length)throw Error('Keine Lebensmittel gefunden');
  const merged=new Map(readPrivate().map(x=>[norm(x.name),x]));
  for(const x of list)if(x?.name)merged.set(norm(x.name),x);
  localStorage.setItem(PRIVATE_CATALOGUE,JSON.stringify([...merged.values()]));
  cache=null;return merged.size;
}
function setupImportUI(){
  const grid=document.querySelector('#tab-einstellungen .grid');
  if(!grid||document.getElementById('gsCatalogueImport'))return;
  const card=document.createElement('article');card.className='card';card.id='gsCatalogueImport';
  card.innerHTML='<h2>🥗 Eigener Lebensmittel-Katalog</h2><p class="sub">Importiere deine Lebensmittel mit Nährwerten (JSON). Sie werden nur in diesem Browser gespeichert und bei der Freitext-Erkennung bevorzugt. Dein bisheriger Verlauf wird automatisch mit erkannt.</p><label class="btn second" style="display:block;text-align:center;cursor:pointer" for="gsCatalogueFile">Katalog importieren</label><input id="gsCatalogueFile" type="file" accept="application/json,.json" style="display:none"/><p class="sub" id="gsCatalogueInfo"></p>';
  grid.appendChild(card);
  const info=card.querySelector('#gsCatalogueInfo');
  const refresh=()=>{info.textContent=readPrivate().length+' eigene Lebensmittel · '+historyEntries().length+' aus dem Verlauf erkannt'};
  card.querySelector('#gsCatalogueFile').onchange=async e=>{
    const file=e.target.files?.[0];if(!file)return;
    try{const n=importCatalogue(JSON.parse(await file.text()));info.textContent=n+' Lebensmittel importiert ✓'}
    catch(err){info.textContent='Import fehlgeschlagen: '+err.message}
    e.target.value='';setTimeout(refresh,2500);
  };
  refresh();
}
window.GSFoodIndex={match,norm,importCatalogue,entries,historyEntries};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setupImportUI);else setupImportUI();
})();
