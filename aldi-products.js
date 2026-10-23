/* Get Shaped – ALDI-SÜD-Produkte nach den Nährwertangaben auf aldi-sued.de (abgerufen am 23.10.2026, pro 100 g).
   Ersetzt frühere Schätzwerte aus dem ChatGPT-Katalog. */
(() => {
'use strict';
const FLAG='get_shaped_aldi_v1',BASE='https://www.aldi-sued.de/produkt/';
const ITEMS=[
  {name:'NUR NUR NATUR Bio-Selleriesalat (ALDI SÜD)',aliases:['NUR NUR NATUR Selleriesalat','Selleriesalat von Nur Nur Natur','Nur nur Natur Selleriesalat Aldi Süd','Bio-Selleriesalat Aldi Süd'],
   kcal:41,protein_g:0.7,kohlenhydrate_g:7,fett_g:0.2,ballaststoffe_g:2.8,slug:'nur-nur-natur-bio-sauerkonserven-190-g-selleriesalat-000000000592725003'},
  {name:'BIO Kalamata-Oliven (ALDI SÜD)',aliases:['ALDI SÜD BIO Kalamata Oliven','Bio-Oliven entsteint Kalamata Aldi Süd','Aldi Bio Kalamata Oliven','Nur Nur Natur Kalamata Aldi Süd','Kalamata Oliven von Nur Nur Natur'],
   kcal:250,protein_g:1.2,kohlenhydrate_g:0.1,fett_g:26.2,ballaststoffe_g:4.4,slug:'bio-bio-oliven-entsteint-180-g-kalamata-000000000484535002'},
  {name:'NUR NUR NATUR Bio-Gewürzgurken (ALDI SÜD)',aliases:['Gewürzgurken im Glas','Gewürzgurken','Nur Nur Natur Gewürzgurken','saure Gurken eingelegt'],
   kcal:30,protein_g:0.8,kohlenhydrate_g:4.9,fett_g:0.2,ballaststoffe_g:1.1,slug:'nur-nur-natur-bio-gewuerzgurken-360-g-000000000000510156'}
];
// Namen früherer Einträge, die durch die obigen ersetzt werden.
const SUPERSEDED=['gewurzgurken im glas','nur nur natur kalamata oliven produkt nicht verifiziert'];
function migrate(){
  try{
    if(localStorage.getItem(FLAG)==='1'||!window.GSFoodIndex?.importCatalogue)return;
    const KEY='get_shaped_private_catalogue_v1',norm=window.GSFoodIndex.norm;
    const old=JSON.parse(localStorage.getItem(KEY)||'[]');
    const kept=old.filter(x=>!SUPERSEDED.includes(norm(x?.name||'')));
    if(kept.length!==old.length)localStorage.setItem(KEY,JSON.stringify(kept));
    window.GSFoodIndex.importCatalogue(ITEMS.map(x=>({name:x.name,aliases:x.aliases,menge:100,einheit:'g',kcal:x.kcal,protein_g:x.protein_g,kohlenhydrate_g:x.kohlenhydrate_g,fett_g:x.fett_g,ballaststoffe_g:x.ballaststoffe_g,sicher:true,marke_oder_quelle:BASE+x.slug})));
    localStorage.setItem(FLAG,'1');
  }catch(e){console.error('ALDI-Produkte konnten nicht aktualisiert werden',e)}
}
window.GSAldi={ITEMS,migrate};
migrate();
})();
