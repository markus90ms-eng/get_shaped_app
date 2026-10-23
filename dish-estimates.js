/* Get Shaped – Schätzwerte für häufige Gerichte und Kuchen, die du noch nie eingetragen hast („ein Stück Apfelkuchen“, „Chili con Carne“).
   Durchschnittswerte pro 100 g mit typischer Portion; Rezepte schwanken stark. Eigene Rezepte und eigene Einträge haben immer Vorrang. */
(() => {
'use strict';
const NOTE='Schätzwert (Durchschnitt)';
// [Name, Aliase, kcal, Eiweiß, KH, Fett, Gramm je Stück/Portion]
const DISHES=[
  ['Apfelkuchen',['Apfelkuchen','Apfel Kuchen','Gedeckter Apfelkuchen','Apfelstreuselkuchen'],240,3.5,36,9.5,120],
  ['Käsekuchen',['Käsekuchen','Quarkkuchen','Käse Kuchen'],265,8.5,25,14,130],
  ['Schokoladenkuchen',['Schokoladenkuchen','Schokokuchen','Schoko Kuchen'],400,5,48,21,90],
  ['Rührkuchen',['Rührkuchen','Marmorkuchen','Sandkuchen','Kuchen'],390,5.5,51,18,80],
  ['Streuselkuchen',['Streuselkuchen','Butterkuchen','Blechkuchen'],380,5,52,17,100],
  ['Brownie',['Brownie','Brownies'],430,5,50,24,60],
  ['Muffin',['Muffin','Muffins'],380,5,48,18,90],
  ['Pfannkuchen',['Pfannkuchen','Eierkuchen','Crêpe','Crepe','Palatschinken'],220,6.5,30,8,80],
  ['Chili con Carne',['Chili con Carne','Chili','Chilli con Carne','Chilli'],120,9,9,5.5,350],
  ['Spaghetti Bolognese',['Spaghetti Bolognese','Bolognese','Nudeln mit Hackfleischsoße','Spaghetti mit Bolognese'],150,7.5,19,4.5,400],
  ['Lasagne',['Lasagne','Lasagna'],165,8,14,8.5,350],
  ['Gulasch',['Gulasch','Rindergulasch','Gulaschsuppe'],130,14,3,7,300],
  ['Linseneintopf',['Linseneintopf','Linsensuppe','Linsen Eintopf'],80,5,10,2,400],
  ['Gemüsesuppe',['Gemüsesuppe','Gemüse Suppe','Gemüseeintopf'],35,1,5,1.2,350],
  ['Hühnersuppe',['Hühnersuppe','Hühnchensuppe','Hühnerbrühe mit Einlage'],40,4,3,1.2,350],
  ['Pizza Margherita',['Pizza Margherita','Pizza','Margherita'],240,10,30,9,350],
  ['Schnitzel paniert',['Schnitzel','Wiener Schnitzel','Schweineschnitzel','Schnitzel paniert'],240,19,12,13,150],
  ['Bratkartoffeln',['Bratkartoffeln','Röstkartoffeln'],150,3,20,6.5,250],
  ['Kartoffelsalat',['Kartoffelsalat'],130,2,17,6,200],
  ['Pommes frites',['Pommes frites','Pommes','Fritten'],300,4,38,14,150],
  ['Currywurst',['Currywurst'],250,11,9,19,250],
  ['Döner Kebab',['Döner','Döner Kebab','Dönerbrot'],215,11,22,9,350],
  ['Rührei',['Rührei','Rühreier'],165,11,1.5,12.5,150],
  ['Nudelsalat',['Nudelsalat'],165,4,17,9,200]
];
function register(){
  const idx=window.GSFoodIndex;if(!idx?.registerBase)return;
  idx.registerBase(DISHES.map(([name,aliases,kcal,p,c,f,piece])=>({name,aliases:[...new Set(aliases.map(idx.norm))],kcal,p,c,f,piece,unit:'g',estimate:true,source:NOTE})));
}
window.GSDishEstimates={DISHES};
register();
})();
