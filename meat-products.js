/* Get Shaped – Fleisch nach Sorte und Zustand (roh / gebraten). Die Gewichte unterscheiden sich stark: gebratenes Fleisch hat ca. 25–30 % Garverlust,
   deshalb ist pro 100 g gebraten mehr Eiweiß, Fett und Energie enthalten als roh. Wiege das Fleisch immer in dem Zustand, den du auswählst.
   Hähnchenoberkeule/Pollefino: NUR NUR NATUR Landhähnchen Schenkelsteaks (aldi-sued.de). Übrige Sorten: gerundete Richtwerte aus Nährwerttabellen, kein Etikett. */
(() => {
'use strict';
const FLAG='get_shaped_meat_v1';
const ALDI='https://www.aldi-sued.de/produkt/nur-nur-natur-bio-landhaehnchen-schenkelsteaks-350-g-000000000000525704';
const COOK=(raw,factor)=>({kcal:Math.round(raw.kcal*factor),p:Math.round(raw.p*factor*10)/10,f:Math.round(raw.f*factor*10)/10});
const KINDS=[
  {key:'Rinderfilet',raw:{kcal:121,p:21.4,f:4.0},factor:1.3,
   rawAliases:['Rinderfilet','Filet','Rinderfilet roh','Filet roh','Rinderfilet Steak roh'],
   cookedAliases:['Rinderfilet gebraten','Rinderfilet gegart','Filet gebraten','Filetsteak','Filetsteak gebraten','Steak Filet','Rinderfilet Steak']},
  {key:'Entrecôte',raw:{kcal:190,p:20.0,f:12.5},factor:1.28,
   rawAliases:['Entrecôte','Entrecote','Rib-Eye','Ribeye','Entrecôte roh','Rib-Eye-Steak roh'],
   cookedAliases:['Entrecôte gebraten','Entrecote gebraten','Entrecôte gegart','Entrecôte Steak','Entrecote Steak','Ribeye gebraten','Rib-Eye-Steak']},
  {key:'Kalbfleisch',raw:{kcal:98,p:21.0,f:1.5},factor:1.35,
   rawAliases:['Kalbfleisch','Kalb','Kalbsfilet','Kalbsschnitzel','Kalbfleisch roh','Kalbsschnitzel roh'],
   cookedAliases:['Kalbfleisch gebraten','Kalb gebraten','Kalbsfilet gebraten','Kalbsschnitzel gebraten','Kalbfleisch gegart']},
  {key:'Hähnchenoberkeule ohne Knochen',raw:{kcal:134,p:19.0,f:6.5},factor:1.35,source:ALDI,
   rawAliases:['Hähnchenoberkeule','Hähnchenoberkeule ohne Knochen','Pollefino','Pollefino roh','Oberkeule ohne Knochen','Hähnchenschenkelsteaks','Landhähnchen Schenkelsteaks','Nur Nur Natur Schenkelsteaks'],
   cookedAliases:['Hähnchenoberkeule gebraten','Hähnchenoberkeule gegart','Pollefino gebraten','Pollefino gegart','Oberkeule gebraten','Schenkelsteaks gebraten']}
];
// Frühere Schätzwerte, die durch die Einträge oben ersetzt werden (normalisierte Namen).
const SUPERSEDED=['entrecote nach fruherer tracking schatzung'];
function entries(){
  const out=[];
  for(const k of KINDS){
    const src=k.source||'Richtwert (Nährwerttabellen, gerundet)';
    out.push({name:k.key+' roh',aliases:k.rawAliases,kcal:k.raw.kcal,protein_g:k.raw.p,kohlenhydrate_g:0,fett_g:k.raw.f,sicher:!!k.source,
      marke_oder_quelle:src+' · Gewicht roh (vor dem Braten)'});
    const c=COOK(k.raw,k.factor);
    out.push({name:k.key+' gebraten',aliases:k.cookedAliases,kcal:c.kcal,protein_g:c.p,kohlenhydrate_g:0,fett_g:c.f,sicher:false,
      marke_oder_quelle:src+' · Gewicht gebraten, berechnet mit ca. '+Math.round((1-1/k.factor)*100)+' % Garverlust, ohne Bratfett'});
  }
  return out.map(x=>({...x,menge:100,einheit:'g'}));
}
function migrate(){
  try{
    if(localStorage.getItem(FLAG)==='1'||!window.GSFoodIndex?.importCatalogue)return;
    const KEY='get_shaped_private_catalogue_v1',norm=window.GSFoodIndex.norm;
    const old=JSON.parse(localStorage.getItem(KEY)||'[]');
    const kept=old.filter(x=>!SUPERSEDED.includes(norm(x?.name||'')));
    if(kept.length!==old.length)localStorage.setItem(KEY,JSON.stringify(kept));
    window.GSFoodIndex.importCatalogue(entries());
    localStorage.setItem(FLAG,'1');
  }catch(e){console.error('Fleisch-Einträge konnten nicht angelegt werden',e)}
}
window.GSMeat={entries,migrate};
migrate();
})();
