/* Get Shaped – Wasser & Ballaststoffe. Ballaststoffe werden aus Zutaten geschätzt (nie als gemessener Wert dargestellt). */
(() => {
'use strict';
const GOAL_KEY='get_shaped_water_goal',FIBER_KEY='get_shaped_fiber_goal';
const readNum=(k,fallback)=>{try{const v=Number(localStorage.getItem(k));return v>0?v:fallback}catch(_){return fallback}};
const writeNum=(k,v)=>{try{localStorage.setItem(k,String(v))}catch(_){}};
const $=id=>document.getElementById(id);
const norm=s=>window.GSFoodIndex?.norm?window.GSFoodIndex.norm(s):String(s||'').toLowerCase();
const fmt1=x=>(Math.round(x*10)/10).toLocaleString('de-DE');

// Ballaststoffe in g pro 100 g (Richtwerte aus üblichen Nährwerttabellen). Spezifischere Muster zuerst.
const FIBER=[
 [/chia/,34],[/leinsamen/,27],[/haferflocken/,10],[/mandel/,12],[/walnuss|walnus/,7],[/haselnuss|haselnus/,10],[/cashew/,3],[/kurbis ?kern|kurbiskern/,6],
 [/nuss(mischung| mix)/,8],[/erdnuss/,6],[/sesam/,12],[/linsen/,8],[/kichererbsen/,7],[/kidneybohnen|rote bohnen/,6.5],[/buchweizen.*gekocht/,2.7],[/buchweizen/,10],
 [/reis.*gekocht/,0.4],[/reis/,1.3],[/kartoffel/,1.8],[/vollkornbrot/,7],[/avocado/,6.7],[/brokkoli|broccoli/,2.6],[/blumenkohl/,2.4],[/rosenkohl/,3.8],
 [/spinat/,2.2],[/zucchini/,1.1],[/paprika/,2],[/tomate/,1.2],[/gurke/,0.5],[/champignon|pilze/,1],[/zwiebel/,1.7],[/knoblauch/,2.1],[/karotte|mohre/,2.8],
 [/butternut/,2],[/sauerkraut/,2.5],[/selleriesalat/,1.5],[/salat/,1.3],[/knollensellerie|sellerie knolle/,1.8],[/stangensellerie|staudensellerie/,1.6],[/sellerie/,1.8],
 [/mais/,2.4],[/medjool/,6.7],[/dattel|dates/,8],[/banane/,2.6],[/apfelessig/,0],[/apfel/,2.4],[/himbeer/,6.5],[/blaubeer|heidelbeer/,2.4],[/erdbeer/,2],[/ananas/,1.4],
 [/orange|apfelsine/,2.2],[/papaya/,1.7],[/pflaume/,1.4],[/wassermelone/,0.4],[/obstbecher/,2],[/oliven/,3.3],[/hummus/,6],[/tofu/,1.2],[/matcha/,38],
 [/kakao/,33],[/zartbitter|schokolade/,11],[/mehl/,3],[/gewurzgurke/,1],[/sojasauce|soja sauce/,0.8],[/biobasics/,0],
 // faserfreie Lebensmittel: ausdrücklich 0, damit sie nicht als „unbekannt“ gelten
 [/hahn|huhn|pute|rind|steak|entrecote|ribeye|lachs|forelle|thunfisch|garnele|shrimp|schinken|speck|bacon|pollefino/,0],
 [/\bei\b|eier|eiklar|eiweiss/,0],[/quark|skyr|joghurt|huttenkase|frischkase|tvorog|tworog|milch|sahne|schlagrahm/,0],
 [/butter|ghee|butterschmalz|\bol\b|olivenol|rapsol|kokosol/,0],[/feta|gouda|mozzarella|parmesan|comte|harzer|kase/,0],
 [/kaffee|kaffe|\btee\b|bruhe|essig|xylit|birkenzucker|gelatine|protein/,0]
];
function fiberPer100(name){
  const known=window.GSFoodIndex?.match?.(name);
  if(known&&Number.isFinite(known.fiber100))return known.fiber100;   // z. B. per Barcode eingelesene Produkte
  const n=norm(name);
  if(/pfanne|eintopf|suppe|auflauf|curry|bowl|syrniki|gericht|\bmit\b|\bund\b/.test(n))return null;   // Mischgerichte: Zutaten unbekannt
  for(const [rx,v] of FIBER)if(rx.test(n))return v;
  return null;
}
function gramsOf(c){
  const q=Number(c.quantity??c.qty);
  if(!(q>0))return NaN;
  if(c.unit==='Stück'){const m=window.GSFoodIndex?.match?.(c.name);return m?.piece&&!m.virtualPiece?q*m.piece:NaN}
  return q;                                                    // g und ml werden 1:1 gerechnet
}
// Ergebnis: {grams, partial}; partial=true, wenn Zutaten ohne bekannten Ballaststoffwert fehlen.
function fiberOfFood(food){
  if(food.fiber!==undefined&&food.fiber!==null&&food.fiber!==''&&Number.isFinite(Number(food.fiber)))return {grams:Number(food.fiber),partial:false};
  const parts=Array.isArray(food.components)&&food.components.length?food.components:[{name:food.name,quantity:food.quantity,unit:food.unit}];
  let sum=0,partial=false;
  for(const c of parts){
    const per=fiberPer100(c.name),g=gramsOf(c);
    if(per===null||!Number.isFinite(g)){partial=true;continue}
    sum+=per*g/100;
  }
  return {grams:sum,partial};
}
function fiberOfDay(d){
  let grams=0,partial=false;
  for(const f of d.foods||[]){const r=fiberOfFood(f);grams+=r.grams;partial=partial||r.partial}
  return {grams,partial};
}
const waterOf=d=>(d.water||[]).reduce((a,w)=>a+(Number(w.ml)||0),0);

function addWater(ml){
  if(!(ml>0&&ml<=5000))return;
  const d=day();d.water=d.water||[];
  d.water.push({id:uuid(),ml,time:new Date().toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})});
  persist();render();
}
function undoWater(){
  const d=day();if(!d.water?.length){toast('Kein Wassereintrag vorhanden');return}
  d.water.pop();persist();render();
}
function ensureUI(){
  if($('gsWaterCard'))return true;
  const balance=$('kcalNow')?.closest('.card'),carbRow=$('carbNow')?.closest('.macro');
  if(!balance||!carbRow)return false;
  carbRow.insertAdjacentHTML('afterend','<div class="macro"><span>🥬 Ballaststoffe <small id="fiberHint" style="color:var(--muted)"></small></span><b id="fiberNow">0 / 30 g</b></div>');
  const card=document.createElement('article');card.className='card';card.id='gsWaterCard';
  card.innerHTML='<div class="section-head"><h2>💧 Wasser</h2><span class="pill" id="waterPill">0 / 2.000 ml</span></div>'+
   '<div class="progress"><i id="waterBar"></i></div>'+
   '<div class="btnrow" style="margin-top:10px"><button type="button" class="btn second" data-water="250">+250 ml</button><button type="button" class="btn second" data-water="500">+500 ml</button><button type="button" class="btn second" id="waterCustom">+ …</button></div>'+
   '<div class="btnrow" style="margin-top:8px"><button type="button" class="btn ghost small" id="waterUndo">↶ Letzten Eintrag entfernen</button><button type="button" class="btn ghost small" id="waterGoal">Ziele ändern</button></div>'+
   '<p class="sub" id="waterNote" style="margin-bottom:0">Kaffee, Tee und Brühe zählst du selbst mit – die App rechnet nichts automatisch dazu.</p>';
  balance.insertAdjacentElement('afterend',card);
  card.addEventListener('click',e=>{
    const b=e.target.closest('[data-water]');if(b)addWater(Number(b.dataset.water));
  });
  $('waterCustom').onclick=()=>{const v=Number(String(prompt('Wie viel ml?','300')||'').replace(',','.'));if(v>0)addWater(v);else if(v)toast('Bitte eine Menge zwischen 1 und 5000 ml angeben')};
  $('waterUndo').onclick=undoWater;
  $('waterGoal').onclick=()=>{
    const w=Number(String(prompt('Wasserziel pro Tag (ml)',readNum(GOAL_KEY,2000))||'').replace(',','.'));
    if(w>=250&&w<=8000)writeNum(GOAL_KEY,Math.round(w));
    const f=Number(String(prompt('Ballaststoff-Ziel pro Tag (g)',readNum(FIBER_KEY,30))||'').replace(',','.'));
    if(f>=5&&f<=100)writeNum(FIBER_KEY,Math.round(f));
    render();
  };
  return true;
}
function renderExtras(){
  if(!ensureUI())return;
  const d=day(),ml=waterOf(d),goal=readNum(GOAL_KEY,2000),fgoal=readNum(FIBER_KEY,30),fib=fiberOfDay(d);
  $('waterPill').textContent=ml.toLocaleString('de-DE')+' / '+goal.toLocaleString('de-DE')+' ml';
  $('waterBar').style.width=Math.min(100,100*ml/goal)+'%';
  $('fiberNow').textContent=(fib.partial?'≥ ':'')+fmt1(fib.grams)+' / '+fgoal+' g';
  $('fiberHint').textContent=(d.foods||[]).length?(fib.partial?'(Schätzung, nicht alle Zutaten bekannt)':'(Schätzung)'):'';
}
// In die bestehende Render-Funktion einhängen, ohne sie zu ersetzen.
const baseRender=window.render;
if(typeof baseRender==='function'){
  window.render=function(){const r=baseRender.apply(this,arguments);try{renderExtras()}catch(e){console.error(e)}return r};
}
// Tagesbericht ergänzen.
const baseSummary=window.summary;
if(typeof baseSummary==='function'){
  window.summary=function(){
    const text=baseSummary.apply(this,arguments);
    try{
      const d=day(),fib=fiberOfDay(d),ml=waterOf(d);
      return text+'\n\nWasser: '+ml+' ml (Ziel '+readNum(GOAL_KEY,2000)+' ml)\nBallaststoffe: '+(fib.partial?'mind. ':'ca. ')+fmt1(fib.grams)+' g (Schätzung aus Zutaten, Ziel '+readNum(FIBER_KEY,30)+' g)';
    }catch(_){return text}
  };
}
window.GSWaterFiber={fiberPer100,fiberOfFood,fiberOfDay,waterOf};
const start=()=>{try{render()}catch(_){}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(start,0));else setTimeout(start,0);
})();
