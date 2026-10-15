const {test}=require('node:test');
const assert=require('node:assert/strict');
const {estimate,readMacros}=require('../nutrition');
test('the user’s breakfast, including the boterham typo, produces all three foods',()=>{
 const result=estimate('2x eitjes, met spek en een witte botherham');
 assert.equal(result.complete,true);assert.deepEqual(result.items.map(i=>[i.name,i.grams]),[['Ei',100],['Spek, gebakken',30],['Wit brood',35]]);
 assert.ok(result.assumptions.some(s=>s.includes('standaardportie')));
});
test('Dutch counts, grams, decimals, litres, spoons and negative ingredients',()=>{
 for(const [text,expected]of [
  ['twee eieren met drie boterhammen',[100,105]],
  ['150 g kip met 200 gram rijst',[150,200]],
  ['0,25 liter melk met 40g cornflakes',[250,40]],
  ['een glas melk',[200]],
  ['een eetlepel olijfolie',[13.5]],
  ['2 eieren zonder spek',[100]],
  ['ei 75g',[75]],
  ['cornflakes met melk',[40,200]],
 ]){const result=estimate(text);assert.equal(result.complete,true,text+JSON.stringify(result.issues));assert.deepEqual(result.items.map(i=>i.grams),expected,text)}
});
test('specific foods are not counted twice and milk variants change nutrition',()=>{
 assert.equal(estimate('een witte boterham').items.length,1);
 assert.equal(estimate('volkorenbrood met pindakaas').items.length,2);
 assert.equal(estimate('volle melk').items[0].fat,3.5);
 assert.equal(estimate('magere melk').items[0].fat,0.1);
});
test('unknown foods, raw rice and invalid portions cannot silently become a complete estimate',()=>{
 for(const text of ['pizza met kip','pasta met pesto','100g droge rijst','0 eieren','6000g kip','','een salade met avocado'])assert.equal(estimate(text).complete,false,text);
});
test('ChatGPT JSON and labelled Dutch macro totals are parsed; incomplete or implausible answers rejected',()=>{
 assert.deepEqual(readMacros('```json\n{"protein":28,"carbs":18,"fat":30}\n```'),{protein:28,carbs:18,fat:30});
 assert.deepEqual(readMacros('Eiwit: 28,5 g, koolhydraten: 18 g, vet: 30 g'),{protein:28.5,carbs:18,fat:30});
 for(const text of ['Geen idee','{"protein":-1,"carbs":18,"fat":30}','{"protein":28,"carbs":18}','{"protein":1001,"carbs":0,"fat":0}','{"protein":"28","carbs":18,"fat":30}'])assert.throws(()=>readMacros(text));
});
