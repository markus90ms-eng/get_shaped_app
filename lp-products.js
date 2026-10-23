/* Get Shaped – Lifeplus-Produkte nach Herstelleretikett (Produktinformationsblätter DE, Art.-Nr. 4136 und 5530).
   Jeder Eintrag steht „pro Portion“ und wird als 1 Stück eingetragen. Ersetzt die früheren Schätzwerte aus dem ChatGPT-Katalog. */
(() => {
'use strict';
const FLAG='get_shaped_lp_v1';
const SOURCE='Lifeplus Etikett 4136/5530';
const ITEMS=[
  {name:'LP Shake',aliases:['LP Shake','Lifeplus Shake','LP Eiweißshake'],kcal:117,protein_g:20,kohlenhydrate_g:1,fett_g:0.8,ballaststoffe_g:13.2,
   note:'1 Messlöffel Triple Protein Vanille (27,1 g) + 1 Portion Daily Plus (26,2 g) mit Wasser. Daily Plus hat keinen Brennwert auf dem Etikett: 26 kcal geschätzt (13 g Ballaststoffe × 2 kcal).'},
  {name:'LP Triple Protein Vanille',aliases:['LP Triple Protein','Lifeplus Triple Protein','Triple Protein','Triple Protein Shake','LP Protein'],kcal:91,protein_g:20,kohlenhydrate_g:1,fett_g:0.8,ballaststoffe_g:0.2,
   note:'1 gestrichener 60-cc-Messlöffel = 27,1 g'},
  {name:'LP Daily Plus',aliases:['LP Daily Plus','Lifeplus Daily Plus','Daily Plus','LP Daily','Daily BioBasics','Lifeplus Daily BioBasics','BioBasics'],kcal:26,protein_g:0,kohlenhydrate_g:0,fett_g:0,ballaststoffe_g:13,
   note:'2 gestrichene 20-cc-Messlöffel = 26,2 g. Kein Brennwert auf dem Etikett: 26 kcal geschätzt (13 g Ballaststoffe × 2 kcal).'}
];
function migrate(){
  try{
    if(localStorage.getItem(FLAG)==='1'||!window.GSFoodIndex?.importCatalogue)return;
    // Frühere, ungenaue Lifeplus-Einträge („Variante nicht spezifiziert“) entfernen.
    const KEY='get_shaped_private_catalogue_v1';
    const old=JSON.parse(localStorage.getItem(KEY)||'[]');
    const kept=old.filter(x=>!/lifeplus/i.test(x?.name||'')||!/variante nicht spezifiziert/i.test(x.name));
    if(kept.length!==old.length)localStorage.setItem(KEY,JSON.stringify(kept));
    window.GSFoodIndex.importCatalogue(ITEMS.map(x=>({name:x.name,aliases:x.aliases,menge:100,einheit:'g',pro_stueck:true,
      kcal:x.kcal,protein_g:x.protein_g,kohlenhydrate_g:x.kohlenhydrate_g,fett_g:x.fett_g,ballaststoffe_g:x.ballaststoffe_g,sicher:true,marke_oder_quelle:SOURCE+' · '+x.note})));
    localStorage.setItem(FLAG,'1');
  }catch(e){console.error('Lifeplus-Produkte konnten nicht angelegt werden',e)}
}
window.GSLifeplus={ITEMS,migrate};
migrate();
if(typeof document!=='undefined'&&document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{try{window.GSPresets?.rebuildPresets?.()}catch(_){}} ,100));
})();
