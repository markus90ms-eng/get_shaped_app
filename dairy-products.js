/* Get Shaped – Tvorog nach Fettstufe, Hüttenkäse (ALDI) und Reinert Geflügel Nuggetz.
   Tvorog: Richtwerte aus russischen/internationalen Nährwerttabellen (schwanken je nach Hersteller – Etikett oder Barcode gehen vor).
   Hüttenkäse natur: aldi-sued.de (Gervais). Nuggetz: Angabe auf rewe.de, Kaufland-Packung kann abweichen. */
(() => {
'use strict';
const FLAG='get_shaped_dairy_v1';
const TV='Richtwert (Nährwerttabellen), schwankt je nach Hersteller';
const ITEMS=[
  {name:'Tvorog 5 %',aliases:['Tvorog','Tworog','Twarog','Tvorog 5','Tworog 5','Twarog 5','Tvorog 5%'],kcal:130,protein_g:16.5,kohlenhydrate_g:3.5,fett_g:5,src:TV},
  {name:'Tvorog 0-1,8 % (mager)',aliases:['Tvorog 0','Tvorog 0%','Tvorog mager','Tvorog fettarm','Tworog 0','Tvorog 1','Tvorog 2','Tvorog 1,8'],kcal:85,protein_g:17,kohlenhydrate_g:3.5,fett_g:0.5,src:TV},
  {name:'Tvorog 9 %',aliases:['Tvorog 9','Tvorog 9%','Tworog 9','Twarog 9'],kcal:158,protein_g:15.5,kohlenhydrate_g:3,fett_g:9,src:TV},
  {name:'Tvorog 18 %',aliases:['Tvorog 18','Tvorog 18%','Tworog 18','Twarog 18','Tvorog fett'],kcal:235,protein_g:15,kohlenhydrate_g:2.5,fett_g:18,src:TV},
  {name:'Hüttenkäse natur (ALDI, Gervais)',aliases:['Hüttenkäse ALDI','Hüttenkäse natur ALDI','Hüttenkäse Gervais','Gervais Hüttenkäse'],kcal:87,protein_g:12.3,kohlenhydrate_g:1.5,fett_g:3.2,
   src:'https://www.aldi-sued.de/produkt/gervais-huettenkaese-400-g-000000000000204788'},
  {name:'Reinert Geflügel Nuggetz',aliases:['Geflügelnuggetz','Geflügel Nuggetz','Reinert Nuggetz','Reinert Geflügelnuggetz','Geflügelschinkenwürfel','Geflügel Schinkenwürfel','Schinkenwürfel','Nuggetz'],kcal:150,protein_g:25,kohlenhydrate_g:1,fett_g:5,
   src:'https://www.rewe.de/shop/p/reinert-gefluegel-nuggetz-100-gefluegel-3x40g/7827354 (REWE-Angabe, Kaufland-Packung bitte vergleichen)'}
];
// Frühere ChatGPT-Schätzungen, die ersetzt werden (normalisierte Namen).
const SUPERSEDED=['tvorog tworog standardwert','schinkenwurfel','schinkenwurfel mager'];
function migrate(){
  try{
    if(localStorage.getItem(FLAG)==='1'||!window.GSFoodIndex?.importCatalogue)return;
    const KEY='get_shaped_private_catalogue_v1',norm=window.GSFoodIndex.norm;
    const old=JSON.parse(localStorage.getItem(KEY)||'[]');
    const kept=old.filter(x=>!SUPERSEDED.includes(norm(x?.name||'')));
    if(kept.length!==old.length)localStorage.setItem(KEY,JSON.stringify(kept));
    window.GSFoodIndex.importCatalogue(ITEMS.map(x=>({name:x.name,aliases:x.aliases,menge:100,einheit:'g',kcal:x.kcal,protein_g:x.protein_g,kohlenhydrate_g:x.kohlenhydrate_g,fett_g:x.fett_g,ballaststoffe_g:0,sicher:false,marke_oder_quelle:x.src})));
    localStorage.setItem(FLAG,'1');
  }catch(e){console.error('Milchprodukte konnten nicht angelegt werden',e)}
}
window.GSDairy={ITEMS,migrate};
migrate();
})();
