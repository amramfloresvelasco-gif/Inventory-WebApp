const fs=require('fs'),vm=require('vm'),assert=require('assert');
const ctx=vm.createContext({});
vm.runInContext(fs.readFileSync('src/OwnershipExclusions.gs','utf8'),ctx);
const parse=ctx.invOwnershipTokensFromRows_;
assert.deepStrictEqual(Array.from(parse([{Token:'JYP',Active:true},{Token:'OTS',Active:false},{Token:'Dios',Active:'TRUE'}])),['JYP','DIOS']);
assert.throws(()=>parse([{Token:'JYP',Active:true},{Token:'jyp',Active:true}]),/Duplicate/);
assert.throws(()=>parse([{Token:'bad token',Active:true}]),/Invalid/);
let reads=0;
ctx.INV_DB_ID='test';
ctx.SpreadsheetApp={openById:()=>({getSheetByName:()=>null})};
assert.strictEqual(ctx.invOwnershipConfig_().configured,false);
assert.strictEqual(Array.from(ctx.invOwnershipConfig_().tokens).length,4);
ctx.SpreadsheetApp={openById:()=>({getSheetByName:()=>({
 getRange:(row,col,n,w)=>({getDisplayValues:()=>[['Token','Active','UpdatedAt','UpdatedBy']],getValues:()=>[['JYP',true,'',''],['OTS',false,'','']]}),
 getLastRow:()=>3
})})};
const configured=ctx.invOwnershipConfig_();
assert.strictEqual(configured.configured,true);
assert.deepStrictEqual(Array.from(configured.tokens),['JYP']);
console.log('Ownership exclusion configuration tests passed');

const base=[{Token:'JYP',Active:true,UpdatedAt:'2026-11-15',UpdatedBy:'admin@example.com'},
 {Token:'OTS',Active:false,UpdatedAt:'2026-11-15',UpdatedBy:'admin@example.com'}];
const rev=ctx.invOwnershipRevision_(base);
assert.notStrictEqual(rev,ctx.invOwnershipRevision_([{...base[0]},{...base[1],Active:true}]));
assert.notStrictEqual(rev,ctx.invOwnershipRevision_([{...base[0]},{...base[1],UpdatedBy:'other@example.com'}]));
assert.notStrictEqual(rev,ctx.invOwnershipRevision_([base[0]]));
assert.strictEqual(typeof configured.revision,'string');
assert.strictEqual(configured.rows.length,2);
