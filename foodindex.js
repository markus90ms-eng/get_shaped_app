/* Get Shaped – Lebensmittel-Index: Katalog + Presets + komplette Historie + privater Katalog, mit Tippfehler-Toleranz. */
(() => {
'use strict';
const PRIVATE_CATALOGUE='get_shaped_private_catalogue_v1';
const FILLER=new Set(['natur','bio','frisch','frische','frischer','gekochte','gekochter','gekocht','gegart','gegarte','gebraten','gebratene','roh','rohe','rohen','getrocknet','getrocknete','schwarz','schwarzer','fettarm','ungesusst','von','vom','der','die','das','den','dem','ein','eine','einen','etwas','ca','circa','etwa','mit','ohne','aus']);
const norm=s=>String(s??'').toLocaleLowerCase('de').replace(/ß/g,'ss').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/ae/g,'a').replace(/oe/g,'o').replace(/ue/g,'u').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ')
  .replace(/\blife plus\b|\blifeplus\b/g,'lp').replace(/\btrip+le\b|\btripel\b/g,'triple');   // Schreibvarianten: „Life Plus“, „Tripple“
const stem=w=>w.length>5?w.replace(/(en|er|n|e|s)$/,''):w;
const tokens=s=>norm(s).split(' ').filter(Boolean);
const num=x=>{if(x===null||x===undefined||String(x).trim()==='')return NaN;const n=Number(String(x).replace(',','.'));return Number.isFinite(n)?n:NaN};
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
  const add=(name,qty,unit,kcal,p,c,f,source,meal=false)=>{
    if(!name||!(qty>0)||!Number.isFinite(kcal))return;
    const key=norm(name);if(!key)return;
    let per,piece=null,virtualPiece=false;
    if(unit==='Stück'){per={kcal,p,c,f};per={kcal:kcal/qty,p:p/qty,c:c/qty,f:f/qty};piece=100;virtualPiece=true}
    else per=perHundred(kcal,p,c,f,qty);
    out.set(key,{name,kcal:per.kcal,p:per.p,c:per.c,f:per.f,piece,virtualPiece,unit:unit==='ml'?'ml':'g',meal,aliases:[key],source});
  };
  for(const date of dates)for(const food of days[date].foods||[]){
    const qty=num(food.quantity)>0?num(food.quantity):num(String(food.grams||'').match(/^\s*(\d+(?:[.,]\d+)?)/)?.[1]);
    const unit=['g','ml','Stück'].includes(food.unit)?food.unit:'g';
    if(food.components?.length>1){
      for(const x of food.components)add(x.name,num(x.quantity),x.unit||'g',num(x.kcal),num(x.p)||0,num(x.c)||0,num(x.f)||0,'Verlauf '+date);
    }
    add(food.name,qty,unit,num(food.kcal),num(food.p)||0,num(food.c)||0,num(food.f)||0,'Verlauf '+date,food.components?.length>1);
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
const pick=(x,...keys)=>{for(const k of keys){const v=num(x[k]);if(Number.isFinite(v))return v}return NaN};
function complete(x){return x?.name&&[pick(x,'kcal'),pick(x,'protein_g','protein','p'),pick(x,'kohlenhydrate_g','carbs','c'),pick(x,'fett_g','fat','f')].every(Number.isFinite)}
function privateEntries(){
  return readPrivate().filter(complete).map(x=>{
    const plain=String(x.name).replace(/\s*\(.*?\)\s*/g,' ').trim();
    const names=[x.name,plain,...(x.aliases||[])].map(norm).filter(Boolean);
    const base=pick(x,'menge')>0?pick(x,'menge'):100;
    const q=perHundred(pick(x,'kcal'),pick(x,'protein_g','protein','p'),pick(x,'kohlenhydrate_g','carbs','c'),pick(x,'fett_g','fat','f'),base);
    const fib=pick(x,'ballaststoffe_g');
    const kw=(x.schluesselwoerter||[]).map(norm).flatMap(k=>k.split(' ')).filter(Boolean);
    return {name:x.name,...q,kw,fiber100:Number.isFinite(fib)?fib*100/base:undefined,virtualPiece:x.pro_stueck===true,piece:x.pro_stueck===true?100:(pick(x,'stueckgewicht_g')>0?pick(x,'stueckgewicht_g'):null),unit:String(x.einheit||'').toLowerCase()==='ml'?'ml':'g',aliases:[...new Set(names)],source:x.marke_oder_quelle||'Privater Katalog'};
  });
}
let extraBase=[];
// Zusätzliche Basiseinträge (z. B. Schätzwerte für Gerichte); niedrigste Priorität.
function registerBase(list){extraBase=extraBase.concat(list);cache=null}
function refresh(){cache=null;usageCache=null}
function recipeEntries(){
  let list=[];try{list=settings.recipes||[]}catch(_){}
  return list.filter(r=>r&&r.name&&r.per100).map(r=>({name:r.name,kcal:r.per100.kcal,p:r.per100.p,c:r.per100.c,f:r.per100.f,fiber100:r.per100.fiber,
    piece:r.portionGrams>0?r.portionGrams:null,unit:'g',aliases:[...new Set([r.name,...(r.aliases||[]),(r.name.split(/\s+/).length>1&&r.name.split(/\s+/)[0].length>=4)?r.name.split(/\s+/)[0]:''].filter(Boolean).map(norm))],source:'Eigenes Rezept',recipe:true,id:r.id}));
}
function entries(){
  if(cache&&Date.now()-cacheAt<2000)return cache;
  // Reihenfolge = Priorität bei Gleichstand: privater Katalog > Verlauf > Presets > Grundkatalog.
  const tier=(list,t)=>list.map(e=>Object.assign(e,{tier:t}));
  cache=[...tier(recipeEntries(),0),...tier(privateEntries(),0),...tier(historyEntries().reverse(),1),...tier(presetEntries(),2),...tier((window.GetShapedNutrition?.foods||[]).map(x=>({...x})),3),...tier(extraBase.map(x=>({...x})),3)];
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
// Reihenfolge der Suche: 1. eigene Produktliste (Rezepte, eigener Katalog, bisher Gegessenes), 2. Grund- und Schätzwerte; Netzrecherche erst danach (in der App).
function match(label){
  const key=norm(label);if(!key)return null;
  const q=key.split(' ').filter(w=>!FILLER.has(w));
  const qt=q.length?q:key.split(' ');
  const keyWords=key.split(' ');
  const all=entries();
  const search=(list)=>{
    let best=null,tie=false;
    for(const e of list){
      for(const raw of e.aliases||[]){
        const alias=norm(raw),words=alias.split(' '),core=words.filter(w=>!FILLER.has(w));
        let s=key===alias?1000:score(qt,core.length?core:words);
        if(s<0)continue;
        s+=words.filter(w=>FILLER.has(w)&&keyWords.includes(w)).length*20;               // „gebraten“, „roh“ … bevorzugen die passende Variante
        if(!words.some(w=>FILLER.has(w))&&!keyWords.some(w=>FILLER.has(w)))s+=5;       // ohne Zusatz gewinnt der Eintrag ohne Zusatz-Alias
        if(!best||s>best.s||(s===best.s&&(e.tier??9)<(best.e.tier??9))){best={e,s};tie=false}
        else if(s===best.s&&e.tier===best.e.tier&&best.e!==e&&norm(best.e.name)!==norm(e.name))tie=Math.abs(best.e.kcal-e.kcal)>Math.max(5,best.e.kcal*0.1);
      }
    }
    return best&&!tie?{...best.e}:null;
  };
  return search(all.filter(e=>(e.tier??9)<=1))||search(all);
}
function importCatalogue(json){
  const list=Array.isArray(json)?json:(json?.lebensmittel||json?.foods||[]);
  if(!Array.isArray(list)||!list.length)throw Error('Keine Lebensmittel gefunden');
  const merged=new Map(readPrivate().map(x=>[norm(x.name),x]));
  const skipped=[];
  for(const x of list){
    if(!x?.name)continue;
    if(!complete(x)){skipped.push(x.name);continue}       // ohne vollständige Nährwerte keine Scheingenauigkeit
    merged.set(norm(x.name),x);
  }
  localStorage.setItem(PRIVATE_CATALOGUE,JSON.stringify([...merged.values()]));
  cache=null;try{window.dispatchEvent(new Event('gs-catalogue-changed'))}catch(_){}return {total:merged.size,skipped};
}
function setupImportUI(){
  const grid=document.querySelector('#tab-einstellungen .grid');
  if(!grid||document.getElementById('gsCatalogueImport'))return;
  const card=document.createElement('article');card.className='card';card.id='gsCatalogueImport';
  card.innerHTML='<h2>🥗 Eigener Lebensmittel-Katalog</h2><p class="sub">Importiere deine Lebensmittel mit Nährwerten (JSON). Sie werden nur in diesem Browser gespeichert und bei der Freitext-Erkennung bevorzugt. Dein bisheriger Verlauf wird automatisch mit erkannt.</p><label class="btn second" style="display:block;text-align:center;cursor:pointer" for="gsCatalogueFile">Katalog importieren</label><input id="gsCatalogueFile" type="file" accept="application/json,.json" multiple style="display:none"/><p class="sub" id="gsCatalogueInfo"></p>';
  grid.appendChild(card);
  const info=card.querySelector('#gsCatalogueInfo');
  const refresh=()=>{info.textContent=readPrivate().length+' eigene Lebensmittel · '+historyEntries().length+' aus dem Verlauf erkannt'};
  card.querySelector('#gsCatalogueFile').onchange=async e=>{
    const files=[...(e.target.files||[])];if(!files.length)return;
    const skipped=[];let total=0;
    try{
      for(const file of files){const r=importCatalogue(JSON.parse(await file.text()));total=r.total;skipped.push(...r.skipped)}
      info.textContent=total+' Lebensmittel im Katalog ✓'+(skipped.length?' · '+skipped.length+' ohne vollständige Nährwerte übersprungen: '+skipped.join(', '):'');
    }catch(err){info.textContent='Import fehlgeschlagen: '+err.message}
    e.target.value='';
  };
  refresh();
}

/* ---------- Intelligente Suche ---------- */
const STOP=new Set(['mit','und','ein','eine','einen','einem','einer','von','vom','der','die','das','den','dem','bitte','ich','habe','hab','hatte','heute','gestern','mittag','abend','abends','morgens','zum','als','fruhstuck','mittagessen','abendessen','noch','auch','dazu','wasser','ca','circa','etwa','gegessen','getrunken','trinke','esse','in','aus','plus']);
const QTY_WORDS={ein:1,eine:1,einen:1,einem:1,einer:1,zwei:2,drei:3,vier:4};
// Beschreibt der ganze Satz ein einzelnes Produkt samt seiner Bestandteile („LP Shake mit Triple Protein und Daily“)?
function phrase(text){
  let raw=String(text||'').trim(),qty=null,unit='';
  const m=raw.match(/^\s*(\d+(?:[.,]\d+)?)\s*(kg|gramm|gr|g|ml|liter|l|el|tl|stk\.?|stück|stueck|x)?\s+(.*)$/i);
  if(m){qty=Number(m[1].replace(',','.'));unit=(m[2]||'').toLowerCase();raw=m[3]}
  else{const w=raw.match(/^\s*(ein|eine|einen|einem|einer|zwei|drei|vier)\s+(.*)$/i);if(w){qty=QTY_WORDS[w[1].toLowerCase()];raw=w[2]}}
  const R=norm(raw).split(' ').filter(Boolean);
  if(!R.length)return null;
  let best=null;
  for(const e of entries()){
    const kw=e.kw||[];
    for(const aliasRaw of e.aliases||[]){
      const A=norm(aliasRaw).split(' ').filter(Boolean);
      if(!A.length)continue;
      let dist=0,ok=true;const used=new Set();
      for(const a of A){
        let bd=Infinity,bi=-1;R.forEach((r,i)=>{const d=tokenDistance(r,a);if(d<bd){bd=d;bi=i}});
        if(!Number.isFinite(bd)){ok=false;break}
        dist+=bd;used.add(bi);
      }
      if(!ok)continue;
      const extras=R.filter((_,i)=>!used.has(i));
      const kwHit=extras.filter(x=>kw.some(k=>tokenDistance(x,k)<Infinity));
      if(!extras.every(x=>STOP.has(x)||kwHit.includes(x)))continue;     // fremde Wörter -> es sind mehrere Lebensmittel
      const score=A.join('').length*2-dist*3+kwHit.length*2;
      if(!best||score>best.score||(score===best.score&&(e.tier??9)<(best.e.tier??9)))best={e,score,kwUsed:kwHit.length};
    }
  }
  return best?{entry:{...best.e},qty,unit,kwUsed:best.kwUsed}:null;
}
function bigrams(s){const t='  '+s+' ',o=[];for(let i=0;i<t.length-2;i++)o.push(t.slice(i,i+3));return o}
function dice(a,b){const A=bigrams(a),B=bigrams(b),used=new Array(B.length).fill(false);let hit=0;for(const x of A){const j=B.findIndex((y,i)=>!used[i]&&y===x);if(j>=0){used[j]=true;hit++}}return 2*hit/(A.length+B.length)}
let usageCache=null,usageAt=0;
function usage(){
  if(usageCache&&Date.now()-usageAt<2000)return usageCache;
  const c=new Map();let days={};try{days=db.days||{}}catch(_){}
  for(const d of Object.values(days))for(const f of d.foods||[]){
    const names=Array.isArray(f.components)&&f.components.length>1?f.components.map(x=>x.name):[f.name];
    for(const n of names){const k=norm(n);if(k)c.set(k,(c.get(k)||0)+1)}
  }
  usageCache=c;usageAt=Date.now();return c;
}
// Ähnliche Lebensmittel zu einer (falsch geschriebenen oder unvollständigen) Eingabe, häufig Genutztes bevorzugt.
function suggest(label,limit=5){
  const key=norm(label);if(!key)return [];
  const q=key.split(' ').filter(w=>w&&!FILLER.has(w)&&!STOP.has(w));
  const qt=q.length?q:key.split(' '),qj=qt.join(' ');
  const counts=usage(),byName=new Map();
  for(const e of entries()){
    if(e.meal)continue;
    let best=0;
    for(const aliasRaw of e.aliases||[]){
      const al=norm(aliasRaw),A=al.split(' ').filter(Boolean);if(!A.length)continue;
      const near=(t,a)=>tokenDistance(t,a)<Infinity||(t.length>=3&&a.startsWith(t))||(a.length>=4&&t.startsWith(a));
      const cover=qt.filter(t=>A.some(a=>near(t,a))).length/qt.length;
      const back=A.filter(a=>qt.some(t=>near(t,a))).length/A.length;
      const s=cover*0.45+back*0.2+dice(qj,al)*0.35;
      if(s>best)best=s;
    }
    best+=Math.min(0.15,(counts.get(norm(e.name))||0)*0.03)+((e.tier??9)<=1?0.08:0);   // eigene Produktliste bevorzugen
    if(best>=0.4){const k=norm(e.name),old=byName.get(k);if(!old||old.s<best)byName.set(k,{e,s:best})}
  }
  // Nahezu identische Einträge (gleiche Nährwerte) nur einmal anbieten.
  const out=[],seen=new Set();
  for(const x of [...byName.values()].sort((a,b)=>b.s-a.s)){
    const sig=Math.round(x.e.kcal/3)+'|'+Math.round(x.e.p)+'|'+Math.round(x.e.f);
    if(seen.has(sig))continue;seen.add(sig);out.push(x.e);if(out.length>=limit)break;
  }
  return out;
}
// Zuletzt verwendete Menge eines Lebensmittels (für „Menge nicht genannt“).
function lastPortion(name){
  const key=norm(name);let days={};try{days=db.days||{}}catch(_){}
  for(const date of Object.keys(days).sort().reverse()){
    const foods=[...(days[date].foods||[])].reverse();
    for(const f of foods){
      const comps=Array.isArray(f.components)&&f.components.length?f.components:[f];
      for(const c of comps)if(norm(c.name)===key){const q=Number(c.quantity??c.qty);if(q>0)return {qty:q,unit:c.unit||'g'}}
    }
  }
  return null;
}
window.GSFoodIndex={match,norm,importCatalogue,entries,historyEntries,phrase,suggest,lastPortion,registerBase,refresh};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setupImportUI);else setupImportUI();
})();
