/* Get Shaped – Überraschung: Beim ersten Öffnen am 24.10.2026 erscheint einmalig ein Geburtstagsgruß. */
(() => {
'use strict';
const DATE='2026-10-24',KEY='get_shaped_birthday_2026_shown';
const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const seen=()=>{try{return localStorage.getItem(KEY)==='1'}catch(_){return false}};
const mark=()=>{try{localStorage.setItem(KEY,'1')}catch(_){}};

function show(){
  const style=document.createElement('style');
  style.textContent='#gsBirthday{position:fixed;inset:0;z-index:300;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(14,30,25,.78);animation:gsFade .5s ease}'+
   '#gsBirthday .gs-card{position:relative;max-width:360px;width:100%;text-align:center;background:linear-gradient(160deg,#fffefa,#f3ead7);color:#4a2a2e;border-radius:28px;padding:38px 26px 30px;box-shadow:0 24px 70px #0006;animation:gsPop .7s cubic-bezier(.2,1.3,.4,1)}'+
   '#gsBirthday .gs-heart{font-size:58px;line-height:1;animation:gsBeat 1.4s ease-in-out infinite}'+
   '#gsBirthday h2{margin:14px 0 6px;font-size:30px;letter-spacing:-.5px;color:#a3243b}'+
   '#gsBirthday p{margin:0 0 24px;font-size:24px;font-weight:700;color:#5a2230}'+
   '#gsBirthday .gs-confetti{position:absolute;inset:0;overflow:hidden;border-radius:28px;pointer-events:none}'+
   '#gsBirthday .gs-confetti i{position:absolute;top:-14px;width:8px;height:14px;border-radius:2px;opacity:.9;animation:gsFall linear infinite}'+
   '@keyframes gsFade{from{opacity:0}to{opacity:1}}@keyframes gsPop{from{transform:scale(.6);opacity:0}to{transform:scale(1);opacity:1}}'+
   '@keyframes gsBeat{0%,100%{transform:scale(1)}15%{transform:scale(1.18)}30%{transform:scale(1)}45%{transform:scale(1.12)}}'+
   '@keyframes gsFall{to{transform:translateY(520px) rotate(540deg)}}'+
   '@media (prefers-reduced-motion:reduce){#gsBirthday *{animation:none!important}}';
  document.head.appendChild(style);
  const colors=['#e0556d','#f2b84b','#5bb99b','#6c8ee8','#c97bd6'];
  const confetti=Array.from({length:34},(_,i)=>'<i style="left:'+(Math.random()*100).toFixed(1)+'%;background:'+colors[i%colors.length]+';animation-duration:'+(3+Math.random()*3).toFixed(1)+'s;animation-delay:'+(-Math.random()*5).toFixed(1)+'s"></i>').join('');
  const el=document.createElement('div');el.id='gsBirthday';el.setAttribute('role','dialog');el.setAttribute('aria-label','Geburtstagsgruß');
  el.innerHTML='<div class="gs-card"><div class="gs-confetti">'+confetti+'</div><div class="gs-heart">❤️</div><h2>Happy Birthday</h2><p>Ich liebe Dich</p><button type="button" class="btn" id="gsBirthdayClose" style="width:100%">Danke 🥰</button></div>';
  document.body.appendChild(el);
  const close=()=>{el.remove();style.remove()};
  el.querySelector('#gsBirthdayClose').onclick=close;
  el.addEventListener('click',e=>{if(e.target===el)close()});
}
function run(){
  if(today()!==DATE||seen())return;
  mark();                       // nur beim ersten Öffnen – auch wenn der Gruß nicht weggetippt wird
  show();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,300));else setTimeout(run,300);
})();
