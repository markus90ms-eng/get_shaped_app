/* Get Shaped – „Abbrechen“ für die Mahlzeiten-Eingabe: leert alle Felder, Vorschläge, Fotos und beendet das Bearbeiten in einem Tipp. */
(() => {
'use strict';
const $=id=>document.getElementById(id);
const FIELDS=['quickSpeech','foodName','foodGrams','foodKcal','foodProtein','foodCarbs','foodFat','foodFiber','foodNote'];
function hasInput(){
  return FIELDS.some(id=>$(id)&&String($(id).value).trim()!=='')||!!editingFoodID||!!pendingPhoto||!!pendingPhotoSide;
}
function cancel(){
  const wasEditing=!!editingFoodID;
  if(!hasInput()){toast('Nichts zu verwerfen');return}
  const q=$('quickSpeech');q.value='';q.dispatchEvent(new Event('input',{bubbles:true}));      // beendet Entwurf und Berechnung
  for(const id of ['gsProductLookup','gsSuggest','gsBreakdown'])if($(id))$(id).innerHTML='';
  $('nutFeedback')?.classList.add('hidden');$('aiWarning')?.classList.add('hidden');
  resetMeal();
  if($('foodFiber'))$('foodFiber').value='';
  if($('recentMeals'))$('recentMeals').value='';
  window.GSMealDraftComponents=null;
  toast(wasEditing?'Änderung verworfen':'Eingabe verworfen');
}
function setup(){
  const save=$('saveFood');if(!save||$('gsCancelInput'))return;
  const btn=document.createElement('button');btn.type='button';btn.id='gsCancelInput';btn.className='btn ghost';btn.textContent='✕ Abbrechen';
  btn.style.cssText='width:100%;margin-top:8px';btn.onclick=cancel;
  save.insertAdjacentElement('afterend',btn);
}
window.GSCancelInput={cancel};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(setup,230));else setTimeout(setup,230);
})();
