// Tests für die Lebensmittelerkennung mit rein synthetischen Daten (keine privaten Einträge).
import vm from 'node:vm';import fs from 'node:fs';import assert from 'node:assert/strict';
const store={};
const ctx={console,setTimeout,clearTimeout,localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=v},dispatchEvent(){},Event:class{},document:{getElementById:()=>null,readyState:'complete',addEventListener(){},querySelector:()=>null}};
ctx.window=ctx;vm.createContext(ctx);
ctx.db={days:{'2026-01-02':{foods:[
  {name:'Linsen-Curry',quantity:400,unit:'g',kcal:520,p:30,c:60,f:14,components:[{name:'Linsen, gekocht',quantity:300,unit:'g',kcal:348,p:27,c:51,f:1},{name:'Kokosmilch',quantity:100,unit:'ml',kcal:170,p:2,c:3,f:17}]},
  {name:'Proteinriegel Haselnuss',quantity:1,unit:'Stück',kcal:210,p:20,c:15,f:9}]}}};
for(const f of ['initial_data.js','nutrition.js','foodindex.js','water-fiber.js'])vm.runInContext(fs.readFileSync(new URL('../'+f,import.meta.url),'utf8'),ctx);
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
const W=ctx.GSWaterFiber;
assert.equal(W.fiberPer100('Chiasamen'),34);
assert.equal(W.fiberPer100('Hähnchen-Butternut-Pfanne'),null);
const f=W.fiberOfFood({name:'Linsen-Curry',components:[{name:'Linsen, gekocht',quantity:300,unit:'g'}]});
assert.equal(Math.round(f.grams),24);assert.equal(f.partial,false);
assert.equal(W.fiberOfFood({name:'Mystery-Pfanne',quantity:300,unit:'g'}).partial,true);
console.log('App-Tests ok');
