/* Get Shaped – Schnelleingabe mit mehreren Lebensmitteln: Jedes Lebensmittel wird als eigener Eintrag gespeichert
   (einzeln löschen, ändern, wiederverwenden). Abschaltbar über die Option unter dem Eingabefeld. */
(() => {
'use strict';
const $=id=>document.getElementById(id);
const KEY='get_shaped_split_foods';
const enabled=()=>{try{return localStorage.getItem(KEY)!=='0'}catch(_){return true}};
const r1v=x=>Math.round(Number(x||0)*10)/10;

function saveSplit(parts){
  const name=$('foodName').value.trim();
  if(!name){toast('Bitte Lebensmittel benennen.');return false}
  const d=day(),time=new Date().toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'});
  const photo=pendingPhoto?uuid():null,photoSide=pendingPhotoSide?uuid():null;
  const created=parts.map((c,i)=>{
    const qty=Number(c.quantity??c.qty)||0,unit=c.unit||'g';
    return {id:uuid(),name:c.name,grams:qty?r1v(qty)+' '+unit:'',quantity:qty,unit,
      components:[{...c}],kcal:r1v(c.kcal),p:r1v(c.p),c:r1v(c.c),f:r1v(c.f),
      note:[c.assumption||'',($('foodNote').value||'').replace(/^Automatische Schätzung[^|]*$/,'')].map(x=>x.trim()).filter(Boolean).join(' · '),
      time,photo:i===0?photo:null,photoSide:i===0?photoSide:null};
  });
  d.foods.push(...created);
  if(!persist()){d.foods.splice(d.foods.length-created.length,created.length);return false}
  if(pendingPhoto&&photo)photoPut(photo,pendingPhoto);
  if(pendingPhotoSide&&photoSide)photoPut(photoSide,pendingPhotoSide);
  resetMeal();window.GSMealDraftComponents=null;refreshRecent();render();
  toast(created.length+' Lebensmittel einzeln gespeichert ✓');
  return true;
}
function setup(){
  const box=$('quickSpeech');if(!box||$('gsSplitOption'))return;
  const base=window.recordFood;
  window.recordFood=function(){
    const parts=window.GSMealDraftComponents;
    if(enabled()&&!editingFoodID&&Array.isArray(parts)&&parts.length>1){
      const r=saveSplit(parts);
      return r;
    }
    return base.apply(this,arguments);
  };
  const label=document.createElement('label');label.id='gsSplitOption';label.className='opt';label.style.margin='8px 0 0';
  label.innerHTML='<input type="checkbox" id="gsSplitCheck"/> <span>Mehrere Lebensmittel als <b>einzelne Einträge</b> speichern</span>';
  box.closest('.field').insertBefore(label,box.nextElementSibling);
  const cb=label.querySelector('input');cb.checked=enabled();
  cb.onchange=()=>{try{localStorage.setItem(KEY,cb.checked?'1':'0')}catch(_){}};
}
window.GSSplitSave={saveSplit};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(setup,200));else setTimeout(setup,200);
})();
