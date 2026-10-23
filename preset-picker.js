/* Get Shaped – Auswahl der Schnellvorlage mit fett gesetztem Lebensmittelnamen und Suchfeld. Das ursprüngliche <select> bleibt unsichtbar als Datenquelle erhalten. */
(() => {
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>window.GSFoodIndex?.norm?window.GSFoodIndex.norm(s):String(s||'').toLowerCase();

function groups(){
  const sel=$('preset');if(!sel)return [];
  return [...sel.querySelectorAll('optgroup')].map(g=>({
    label:g.label,
    items:[...g.querySelectorAll('option')].map(o=>({value:o.value,item:window.GSPresets?.item?.(Number(o.value)),uses:/ · (\d+)×$/.exec(o.textContent)?.[1]})).filter(x=>x.item)
  }));
}
const meta=(x)=>(x.item.piece?'1 Stück':'100 '+x.item.unit)+' · '+Math.round(x.item.kcal)+' kcal'+(x.uses?' · '+x.uses+'× gegessen':'');

function syncButton(){
  const btn=$('gsPresetBtn'),sel=$('preset');if(!btn||!sel)return;
  const item=sel.value===''?null:window.GSPresets?.item?.(Number(sel.value));
  btn.innerHTML=item?'<b>'+esc(item.name)+'</b> <span class="gs-meta">'+esc((item.piece?'1 Stück':'100 '+item.unit)+' · '+Math.round(item.kcal)+' kcal')+'</span>':'<span class="gs-meta">— Frei eingeben —</span>';
}
function render(filter=''){
  const host=$('gsPickerList');if(!host)return;
  const q=norm(filter).split(' ').filter(Boolean);
  const html=['<button type="button" class="gs-row" data-pick="">— Frei eingeben —</button>'];
  for(const g of groups()){
    const rows=g.items.filter(x=>q.every(w=>norm(x.item.name).includes(w)));
    if(!rows.length)continue;
    html.push('<div class="gs-group">'+esc(g.label)+'</div>');
    for(const x of rows)html.push('<button type="button" class="gs-row" data-pick="'+esc(x.value)+'"><b>'+esc(x.item.name)+'</b><span class="gs-meta">'+esc(meta(x))+'</span></button>');
  }
  if(html.length===1)html.push('<p class="sub" style="padding:14px">Kein Lebensmittel gefunden. Du kannst es frei eintippen oder per Barcode hinzufügen.</p>');
  host.innerHTML=html.join('');
}
function open(){
  let el=$('gsPicker');
  if(!el){
    el=document.createElement('div');el.id='gsPicker';
    el.innerHTML='<div class="gs-sheet" role="dialog" aria-label="Schnellvorlage wählen"><div class="gs-head"><input id="gsPickerSearch" type="search" placeholder="Lebensmittel suchen …" autocomplete="off"/><button type="button" class="btn small second" id="gsPickerClose">Schließen</button></div><div id="gsPickerList"></div></div>';
    document.body.appendChild(el);
    $('gsPickerClose').onclick=close;
    el.addEventListener('click',e=>{if(e.target===el)close()});
    $('gsPickerSearch').addEventListener('input',e=>render(e.target.value));
    $('gsPickerList').addEventListener('click',e=>{
      const b=e.target.closest('[data-pick]');if(!b)return;
      const sel=$('preset');sel.value=b.dataset.pick;
      sel.dispatchEvent(new Event('change',{bubbles:true}));
      syncButton();close();
    });
  }
  el.style.display='flex';document.body.style.overflow='hidden';
  $('gsPickerSearch').value='';render();
  setTimeout(()=>$('gsPickerSearch').focus(),50);
}
function close(){const el=$('gsPicker');if(el)el.style.display='none';document.body.style.overflow=''}

function injectStyle(){
  if($('gsPickerStyle'))return;
  const s=document.createElement('style');s.id='gsPickerStyle';
  s.textContent='#gsPresetBtn{width:100%;text-align:left;background:#fff;border:1px solid #cad8ce;border-radius:12px;padding:11px 12px;color:var(--ink);display:flex;gap:8px;align-items:baseline;flex-wrap:wrap}'+
   '#gsPresetBtn b,.gs-row b{font-weight:800;color:var(--ink)}.gs-meta{font-size:12px;color:var(--muted);font-weight:400}'+
   '#gsPicker{position:fixed;inset:0;z-index:190;background:rgba(10,20,17,.55);display:none;align-items:flex-end;justify-content:center}'+
   '.gs-sheet{background:var(--paper);width:100%;max-width:560px;max-height:86vh;border-radius:22px 22px 0 0;display:flex;flex-direction:column;overflow:hidden}'+
   '.gs-head{display:flex;gap:8px;padding:14px;border-bottom:1px solid var(--border)}.gs-head input{flex:1}'+
   '#gsPickerList{overflow:auto;padding:4px 8px 24px;-webkit-overflow-scrolling:touch}'+
   '.gs-group{position:sticky;top:0;background:var(--paper);font-size:12px;font-weight:800;color:var(--muted);padding:12px 8px 6px;text-transform:uppercase;letter-spacing:.4px}'+
   '.gs-row{display:flex;flex-direction:column;gap:2px;width:100%;text-align:left;background:transparent;border:0;border-bottom:1px solid var(--border);padding:11px 8px;color:var(--ink);font-size:15px}.gs-row:active{background:var(--green2)}';
  document.head.appendChild(s);
}
function setup(){
  const sel=$('preset');if(!sel||$('gsPresetBtn'))return;
  injectStyle();
  const btn=document.createElement('button');btn.type='button';btn.id='gsPresetBtn';btn.setAttribute('aria-haspopup','dialog');
  sel.style.display='none';sel.insertAdjacentElement('afterend',btn);
  btn.onclick=open;
  sel.addEventListener('change',syncButton);
  // Zurücksetzen nach dem Speichern setzt nur den Wert des (unsichtbaren) select – Anzeige nachziehen.
  const baseReset=window.resetMeal;
  if(typeof baseReset==='function')window.resetMeal=function(){const r=baseReset.apply(this,arguments);syncButton();return r};
  document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
  syncButton();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(setup,10));else setTimeout(setup,10);
})();
