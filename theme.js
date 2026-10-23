/* Get Shaped – Theme-Auswahl (Automatisch / Hell / Dunkel). */
(() => {
'use strict';
const KEY='get_shaped_theme';
const read=()=>{try{return localStorage.getItem(KEY)||'auto'}catch(_){return 'auto'}};
function apply(mode){
  const root=document.documentElement;
  if(mode==='auto')delete root.dataset.theme;else root.dataset.theme=mode;
  const dark=mode==='dark'||(mode==='auto'&&matchMedia('(prefers-color-scheme: dark)').matches);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content',dark?'#0f2a24':'#163c35');
}
function setup(){
  const grid=document.querySelector('#tab-einstellungen .grid');
  if(!grid||document.getElementById('gsThemeCard'))return;
  const card=document.createElement('article');card.className='card';card.id='gsThemeCard';
  card.innerHTML='<h2>🌙 Darstellung</h2><p class="sub">„Automatisch“ folgt der Einstellung deines iPhones.</p><div class="btnrow" id="gsThemeButtons"></div>';
  grid.appendChild(card);
  const box=card.querySelector('#gsThemeButtons');
  const draw=()=>{const cur=read();box.innerHTML=[['auto','Automatisch'],['light','Hell'],['dark','Dunkel']].map(([k,l])=>'<button type="button" class="btn small '+(k===cur?'':'second')+'" data-theme-set="'+k+'">'+l+'</button>').join('')};
  box.addEventListener('click',e=>{const b=e.target.closest('[data-theme-set]');if(!b)return;try{localStorage.setItem(KEY,b.dataset.themeSet)}catch(_){}apply(b.dataset.themeSet);draw()});
  draw();
}
apply(read());
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change',()=>apply(read()));
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
})();
