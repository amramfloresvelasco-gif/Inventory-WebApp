const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync('src/WSSnapshots.gs','utf8');
const ctx=vm.createContext({});
vm.runInContext(source,ctx); // Entire Apps Script file must parse.
const tokens=['JYP','OTS','Dios','SCG'];
for(const name of ['JYP OTS Explorer','Dios Azul','SCG-Barrel'])
  assert.strictEqual(ctx.invExtendedOwnershipExcluded_(name,tokens),true,name);
for(const name of ['Pickers Original','LOTS of flavor','Dioses'])
  assert.strictEqual(ctx.invExtendedOwnershipExcluded_(name,tokens),false,name);
const rows=[
 {WSItemID:'103182',ItemName:'Pickers Flavor',ClassOfMaterial:'Blending Ingredient',UOM:'FluidOunces',Warehouse:'344',Quantity:2},
 {WSItemID:'103182',ItemName:'Pickers Flavor',ClassOfMaterial:'Blending Ingredient',UOM:'FluidOunces',Warehouse:'344',Quantity:3},
 {WSItemID:'103180',ItemName:'JYP OTS Flavor',ClassOfMaterial:'Blending Ingredient',UOM:'FluidOunces',Warehouse:'344',Quantity:8},
 {WSItemID:'9',ItemName:'Other',ClassOfMaterial:'Fermentation Support',UOM:'FluidOunces',Warehouse:'344',Quantity:9}
];
const result=ctx.invExtendedLegacyUomWatchlist_(rows,tokens);
assert.strictEqual(result.items.length,1);
assert.strictEqual(result.items[0].SourceQuantity,5);
assert.strictEqual(result.items[0].EffectiveQuantity,0);
assert.strictEqual(result.nonzeroCount,1);
assert.strictEqual(ctx.invExtendedLegacyUomWatchlist_([{...rows[0],Quantity:0}],tokens).nonzeroCount,0);
assert.throws(()=>ctx.invExtendedLegacyUomWatchlist_([{...rows[0],Quantity:'bad'}],tokens),/Invalid legacy/);
console.log('Extended legacy report syntax, ownership and source-quantity tests passed');

const standard=ctx.invExtendedStandardBlending_([
 {WSItemID:'100',ItemName:'Pickers Syrup',ClassOfMaterial:'Blending Ingredient',UOM:'Gallons',Warehouse:'344',Quantity:2},
 {WSItemID:'100',ItemName:'Pickers Syrup',ClassOfMaterial:'Blending Ingredient',UOM:'Gallons',Warehouse:'344',Quantity:3},
 {WSItemID:'100',ItemName:'Pickers Syrup',ClassOfMaterial:'Blending Ingredient',UOM:'Gallons',Warehouse:'1592',Quantity:4},
 {WSItemID:'200',ItemName:'JYP Ingredient',ClassOfMaterial:'Blending Ingredient',UOM:'Pounds',Warehouse:'344',Quantity:10},
 {WSItemID:'300',ItemName:'Unsupported',ClassOfMaterial:'Blending Ingredient',UOM:'FluidOunces',Warehouse:'344',Quantity:1}
],tokens);
assert.strictEqual(standard.length,2);
assert.strictEqual(standard[0].SourceQuantity,5);
assert.strictEqual(standard[0].EffectiveQuantity,5);
assert.strictEqual(standard[0].Rows,2);
assert.strictEqual(standard[1].Warehouse,'1592');
assert.throws(()=>ctx.invExtendedStandardBlending_([{WSItemID:'1',ItemName:'X',ClassOfMaterial:'Blending Ingredient',UOM:'Each',Warehouse:'344',Quantity:-1}],tokens),/Invalid standard/);
console.log('Standard blending grouping tests passed');

const barrels=ctx.invExtendedBarrels_([
 {WSItemID:'B1',ItemName:'BMD Barrel',ClassOfMaterial:'BARREL',UOM:'Each',Warehouse:'344',Quantity:2},
 {WSItemID:'B1',ItemName:'BMD Barrel',ClassOfMaterial:'BARREL',UOM:'Each',Warehouse:'344',Quantity:3},
 {WSItemID:'B2',ItemName:'JYP Barrel',ClassOfMaterial:'BARREL',UOM:'Each',Warehouse:'344',Quantity:4},
 {WSItemID:'B1',ItemName:'BMD Barrel',ClassOfMaterial:'BARREL',UOM:'Each',Warehouse:'1592',Quantity:1}
],tokens);
assert.strictEqual(barrels.length,2);
assert.strictEqual(barrels[0].SourceQuantity,5);
assert.strictEqual(barrels[0].EffectiveQuantity,0);
assert.strictEqual(barrels[1].Warehouse,'1592');
assert.throws(()=>ctx.invExtendedBarrels_([{WSItemID:'B1',ItemName:'X',ClassOfMaterial:'BARREL',UOM:'Each',Warehouse:'344',Quantity:-1}],tokens),/Invalid barrel/);
console.log('Barrel source-preserving tests passed');
