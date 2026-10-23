/* Get Shaped – Favoriten: einzelne Lebensmittel (Schnellvorlage) und ganze Mahlzeiten (Wiederverwenden). Liegt in den Einstellungen und damit im JSON-Backup. */
(() => {
'use strict';
const $=id=>document.getElementById(id);
const norm=s=>window.GSFoodIndex?.norm?window.GSFoodIndex.norm(s):String(s||'').toLowerCase();
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function store(){settings.favorites=settings.favorites||{foods:[],meals:[]};settings.favorites.hidden=settings.favorites.hidden||[];settings.favorites.foods=settings.favorites.foods||[];settings.favorites.meals=settings.favorites.meals||[];return settings.favorites}
function save(){try{localStorage.setItem(CONFIG,JSON.stringify(settings))}catch(_){}}
const foods=()=>store().foods;
const meals=()=>store().meals;
const hidden=()=>store().hidden;                       // [{key,name}] – aus der Schnellvorlage ausgeblendete Lebensmittel
function hide(key,name){
  const h=hidden();if(!h.some(x=>x.key===key))h.push({key,name});
  const fav=foods(),i=fav.indexOf(key);if(i>=0)fav.splice(i,1);
  save();
}
function unhide(key){const h=hidden(),i=h.findIndex(x=>x.key===key);if(i>=0){h.splice(i,1);save()}}

/* ----- Lebensmittel-Favoriten (Stern neben der Schnellvorlage) ----- */
function updateStar(){
  const btn=$('gsFavFood');if(!btn)return;
  const item=window.GSPresets?.selected?.();
  btn.disabled=!item;
  const on=!!item&&foods().includes(item.key);
  btn.textContent=on?'★ Favorit':'☆ Favorit';
  btn.title=on?'Aus Favoriten entfernen':'Als Favorit merken';
}
function toggleFood(){
  const item=window.GSPresets?.selected?.();if(!item)return;
  const f=foods(),i=f.indexOf(item.key);
  if(i>=0)f.splice(i,1);else f.push(item.key);
  save();window.GSPresets.rebuildPresets();
  const sel=$('preset');
  const idx=window.GSPresets.buildList().findIndex(x=>x.key===item.key);
  // Auswahl auf den Eintrag in der (neu aufgebauten) Liste zurücksetzen
  const opt=[...sel.options].find(o=>o.value===String(idx));if(opt)sel.value=opt.value;
  updateStar();toast(i>=0?'Aus Favoriten entfernt':'Als Favorit gespeichert ★');
}

/* ----- Mahlzeiten-Favoriten (Stern am Eintrag unter „Gegessen“) ----- */
function decorateEntries(){
  const host=$('foodEntries');if(!host)return;
  const day_=day(),keys=new Set(meals().map(m=>norm(m.name)));
  host.querySelectorAll('[data-del-food]').forEach(del=>{
    if(del.previousElementSibling?.dataset?.favMeal)return;
    const id=del.dataset.delFood,f=day_.foods.find(x=>x.id===id);if(!f)return;
    const on=keys.has(norm(f.name));
    const b=document.createElement('button');b.type='button';b.className='delete';b.dataset.favMeal=id;b.style.color=on?'#c9902b':'';
    b.title=on?'Aus Favoriten entfernen':'Mahlzeit als Favorit merken';b.setAttribute('aria-label',b.title);b.textContent=on?'★':'☆';
    del.insertAdjacentElement('beforebegin',b);
  });
}
function toggleMeal(id){
  const f=day().foods.find(x=>x.id===id);if(!f)return;
  const m=meals(),key=norm(f.name),i=m.findIndex(x=>norm(x.name)===key);
  if(i>=0){m.splice(i,1);toast('Aus Favoriten entfernt')}
  else{
    m.push({name:f.name,grams:f.grams,quantity:f.quantity,unit:f.unit,kcal:f.kcal,p:f.p,c:f.c,f:f.f,fiber:f.fiber,components:f.components||[],note:f.note||''});
    toast('Mahlzeit als Favorit gespeichert ★');
  }
  save();refreshRecent();render();
}
function rebuildRecent(){
  const sel=$('recentMeals'),favs=meals();
  if(!sel||!favs.length)return;
  const recent=(window._recentFoodOptions||[]).filter(r=>!favs.some(m=>norm(m.name)===norm(r.name)));
  const favObjs=favs.map(m=>({...m,_date:'Favorit'}));
  window._recentFoodOptions=[...favObjs,...recent];
  const label=(f,i,fav)=>'<option value="'+i+'">'+esc(f.name)+' · '+esc(f.grams||'Portion')+' · '+fmt(f.kcal)+' kcal'+(fav?'':' ('+esc(f._date)+')')+'</option>';
  sel.innerHTML='<option value="">— Gericht auswählen —</option><optgroup label="★ Favoriten">'+favObjs.map((f,i)=>label(f,i,true)).join('')+'</optgroup>'+
    (recent.length?'<optgroup label="Zuletzt gegessen">'+recent.map((f,i)=>label(f,favObjs.length+i,false)).join('')+'</optgroup>':'');
}

function setup(){
  const sel=$('preset');
  if(sel&&!$('gsFavFood')){
    const btn=document.createElement('button');btn.type='button';btn.id='gsFavFood';btn.className='btn ghost small';btn.style.marginTop='8px';
    ($('gsPresetBtn')||sel).insertAdjacentElement('afterend',btn);
    btn.onclick=toggleFood;
    sel.addEventListener('change',()=>setTimeout(updateStar,0));
    updateStar();
  }
  $('foodEntries')?.addEventListener('click',e=>{const b=e.target.closest('[data-fav-meal]');if(b){e.stopPropagation();toggleMeal(b.dataset.favMeal)}},true);
  decorateEntries();
}
const baseRender=window.render;
if(typeof baseRender==='function')window.render=function(){const r=baseRender.apply(this,arguments);try{decorateEntries()}catch(e){console.error(e)}return r};
const baseRefresh=window.refreshRecent;
if(typeof baseRefresh==='function')window.refreshRecent=function(){const r=baseRefresh.apply(this,arguments);try{rebuildRecent()}catch(e){console.error(e)}return r};
window.GSFavorites={foods,meals,hidden,hide,unhide};
const start=()=>{try{setup();window.GSPresets?.rebuildPresets?.();refreshRecent();render()}catch(e){console.error(e)}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(start,20));else setTimeout(start,20);
})();
