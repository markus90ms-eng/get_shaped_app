/* Get Shaped – Backup-Erinnerung: weist darauf hin, wenn das letzte JSON-Backup älter als 7 Tage ist. */
(() => {
'use strict';
const KEY='get_shaped_last_backup',DAYS=7;
const read=()=>{try{return Number(localStorage.getItem(KEY))||0}catch(_){return 0}};
const write=()=>{try{localStorage.setItem(KEY,String(Date.now()))}catch(_){}};
function hasData(){try{return typeof db!=='undefined'&&Object.values(db.days||{}).some(d=>d.foods?.length)}catch(_){return false}}
function setup(){
  const exportBtn=document.getElementById('exportJSON'),tab=document.getElementById('tab-heute');
  if(!exportBtn||!tab)return;
  exportBtn.addEventListener('click',()=>{write();const b=document.getElementById('gsBackupHint');if(b)b.remove()});
  if(!hasData())return;
  const last=read(),age=last?Math.floor((Date.now()-last)/864e5):null;
  if(last&&age<DAYS)return;
  const box=document.createElement('div');box.id='gsBackupHint';box.className='warnline';box.style.margin='0 0 14px';
  box.innerHTML='💾 '+(last?'Dein letztes Backup ist '+age+' Tage alt.':'Du hast noch kein Backup gemacht.')+' Browserdaten können auf dem iPhone verloren gehen. <button type="button" class="btn small" id="gsBackupGo" style="margin-top:8px">Zum Backup</button>';
  tab.insertBefore(box,tab.firstChild);
  box.querySelector('#gsBackupGo').onclick=()=>{document.querySelector('[data-tab="verlauf"]')?.click();setTimeout(()=>document.getElementById('exportJSON')?.scrollIntoView({behavior:'smooth',block:'center'}),150)};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(setup,0));else setTimeout(setup,0);
})();
