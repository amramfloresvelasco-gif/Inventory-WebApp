const fs=require('fs'),vm=require('vm'),assert=require('assert');
const context=vm.createContext({});
vm.runInContext(fs.readFileSync('src/ProductIndexPreview.gs','utf8'),context);
const preview=context.invPreviewProductIndex_;
const raw=[{RawMaterialId:'91',MaterialName:'Bottle',ClassOfMaterial:'Packaging',UnitOfMeasure:'Each'},
{RawMaterialId:'91',MaterialName:'Bottle',ClassOfMaterial:'Packaging',UnitOfMeasure:'Each'},
{RawMaterialId:'92',MaterialName:'Excluded',ClassOfMaterial:'Fermentation Support'}];
const fg=[{'Master Id':'73','Master Name':'Gin 750mL/12pk'}];
const packs=[{WSItemID:'73',UnitsPerCase:12,PlannerStatus:'Inactive'}];
let r=preview(raw,fg,packs);
assert.strictEqual(r.ready,true);
assert.strictEqual(r.products.length,2);
assert.strictEqual(r.products[0].Barcode,'91');
assert.strictEqual(r.products[1].Barcode,'Gin 750mL/12pk');
assert.strictEqual(r.products[1].UnitsPerCase,12);
assert.strictEqual(r.products[1].Active,true);
r=preview(raw,fg,[]);
assert.strictEqual(r.ready,false);
assert.strictEqual(r.products[1].Active,true);
assert.strictEqual(r.products[1].UnitsPerCase,'');
r=preview([...raw,{...raw[0],MaterialName:'Other'}],fg,packs);
assert.strictEqual(r.ready,false);
assert(r.issues.some(x=>x.reason.includes('Conflicting records')));
console.log('ProductIndex preview: 9 assertions PASS');
