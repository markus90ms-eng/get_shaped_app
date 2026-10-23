// Tests für die Lebensmittelerkennung mit rein synthetischen Daten (keine privaten Einträge).
import vm from 'node:vm';import fs from 'node:fs';import assert from 'node:assert/strict';
const store={};
const ctx={console,setTimeout,clearTimeout,localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=v},dispatchEvent(){},Event:class{},document:{getElementById:()=>null,readyState:'complete',addEventListener(){},querySelector:()=>null}};
ctx.window=ctx;vm.createContext(ctx);
ctx.db={days:{'2026-01-02':{foods:[
  {name:'Linsen-Curry',quantity:400,unit:'g',kcal:520,p:30,c:60,f:14,components:[{name:'Linsen, gekocht',quantity:300,unit:'g',kcal:348,p:27,c:51,f:1},{name:'Kokosmilch',quantity:100,unit:'ml',kcal:170,p:2,c:3,f:17}]},
  {name:'Proteinriegel Haselnuss',quantity:1,unit:'Stück',kcal:210,p:20,c:15,f:9}]}}};
for(const f of ['initial_data.js','nutrition.js','foodindex.js','fiber.js','lp-products.js'])vm.runInContext(fs.readFileSync(new URL('../'+f,import.meta.url),'utf8'),ctx);
const match=q=>ctx.GSFoodIndex.match(q);
const name=q=>match(q)?.name;

// Grundkatalog, Tippfehler, Mehrzahl
assert.equal(name('Brokoli'),'Brokkoli');
assert.equal(name('Avocados'),'Avocado');
assert.equal(name('Hähnchenbrust gebraten'),'Hähnchenbrust gegart');
assert.equal(name('Hähnchenbrust roh'),'Hähnchenbrust roh');
// Unbekanntes wird NICHT geraten
assert.equal(match('Raclettekäse'),null);
// Verlauf: Einzelzutaten und Stück-Portionen werden erkannt
assert.equal(name('Kokosmilch'),'Kokosmilch');
assert.equal(match('Proteinriegel Haselnuss').virtualPiece,true);
// Privater Katalog: Schema, unvollständige Einträge werden übersprungen
const r=ctx.GSFoodIndex.importCatalogue({lebensmittel:[
  {name:'Testquark',aliases:['quarki'],menge:100,einheit:'g',kcal:70,protein_g:12,kohlenhydrate_g:4,fett_g:0.2,sicher:true},
  {name:'Ohne Werte',aliases:[],menge:100,einheit:'g',kcal:null,protein_g:null,kohlenhydrate_g:null,fett_g:null}]});
assert.equal(JSON.stringify(r.skipped),'["Ohne Werte"]');
assert.equal(name('quarki'),'Testquark');
assert.equal(match('Ohne Werte'),null);
// Ballaststoffe: Tabelle, Zutatenlisten, Mischgerichte bleiben unbekannt
const W=ctx.GSFiber;
assert.equal(W.fiberPer100('Chiasamen'),34);
assert.equal(W.fiberPer100('Hähnchen-Butternut-Pfanne'),null);
const f=W.fiberOfFood({name:'Linsen-Curry',components:[{name:'Linsen, gekocht',quantity:300,unit:'g'}]});
assert.equal(Math.round(f.grams),24);assert.equal(f.partial,false);
assert.equal(W.fiberOfFood({name:'Mystery-Pfanne',quantity:300,unit:'g'}).partial,true);
// Lifeplus nach Etikett: 1 Stück = 1 Portion, Ballaststoffe pro Stück
const shake=match('LP Shake');
assert.equal(shake.virtualPiece,true);assert.equal(Math.round(shake.kcal),117);assert.equal(shake.p,20);
assert.equal(name('Triple Protein'),'LP Triple Protein Vanille');
assert.equal(name('Daily BioBasics'),'LP Daily Plus');
assert.equal(Math.round(W.fiberOfFood({name:'LP Shake',quantity:1,unit:'Stück'}).grams*10)/10,13.2);
assert.equal(W.fiberOfFood({name:'LP Shake',quantity:2,unit:'Stück'}).partial,false);
// Eigener Katalog hat Vorrang vor widersprüchlichen Verlaufswerten (kein „nicht erkannt“ mehr)
ctx.db.days['2026-01-03']={foods:[{name:'Testquark',quantity:100,unit:'g',kcal:150,p:12,c:4,f:9}]};
ctx.GSFoodIndex.entries();           // Cache neu aufbauen lassen
await new Promise(r=>setTimeout(r,2100));
assert.equal(match('Testquark').kcal,70);
// Tvorog nach Fettstufe, Nuggetz
for(const f of ['dairy-products.js'])vm.runInContext(fs.readFileSync(new URL('../'+f,import.meta.url),'utf8'),ctx);
assert.equal(match('Tvorog 9 %').kcal,158);assert.equal(match('Tvorog').kcal,130);assert.equal(match('Tvorog 18 %').f,18);
assert.equal(name('Geflügelnuggetz'),'Reinert Geflügel Nuggetz');
// Intelligente Suche: Beschreibung eines Produkts samt Bestandteilen, Vorschläge bei Unklarem
const ph=ctx.GSFoodIndex.phrase('Life Plus Shake mit Tripple Proteine und Daily');
assert.equal(ph.entry.name,'LP Shake');assert.ok(ph.kwUsed>0);
assert.equal(ctx.GSFoodIndex.phrase('Magerquark mit Daily'),null);          // fremdes Wort -> mehrere Lebensmittel
assert.ok(ctx.GSFoodIndex.suggest('Quark Himbeer',5).some(e=>/quark/i.test(e.name)));
assert.equal(ctx.GSFoodIndex.suggest('Quatschwort',5).length,0);
// Rezepte: eigene Rezepte vor Schätzwerten; Kurzname aus dem ersten Wort
for(const f of ['dish-estimates.js'])vm.runInContext(fs.readFileSync(new URL('../'+f,import.meta.url),'utf8'),ctx);
const est=ctx.GSFoodIndex.match('Chili con Carne');assert.equal(est.estimate,true);assert.equal(est.kcal,120);
vm.runInContext("var settings={recipes:[{id:'r1',name:'Chili con Carne',aliases:[],per100:{kcal:150,p:10.8,c:5.4,f:8.7,fiber:2},portionGrams:275,portions:4}]}",ctx);
ctx.GSFoodIndex.refresh();
await new Promise(r=>setTimeout(r,10));
assert.equal(match('Chili con Carne').kcal,150);assert.equal(match('Chili').kcal,150);assert.equal(match('Chili').recipe,true);
console.log('App-Tests ok');
