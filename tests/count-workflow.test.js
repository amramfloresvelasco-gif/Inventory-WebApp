/** Run: node tests/count-workflow.test.js
 * Executes production Code.gs in an isolated VM with fake Sheets.
 * Does not connect to Apps Script or modify a real database.
 */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const entries=[],audit=[];
const reference={locations:[{LocationID:'L1'}],products:[{WSItemID:'P1',ClassOfMaterial:'Raw Material',DefaultUOM:'Each'}]};
let user={email:'a@example.com',role:'counter'};
const countKeys=['EntryID','SessionID','Team','LocationID','WSItemID','UOM','Quantity','ParentEntryID','PalletMultiplier','EnteredBy','EnteredAt','EntryMethod','Notes','Status'];
const auditKeys=['AuditID','EntryID','SessionID','Action','OldValue','NewValue','Reason','ChangedBy','ChangedAt'];
const context=vm.createContext({
  Date,Map,Set,JSON,Number,String,Error,Math,
  INV_RAW_UOMS:['Each','Pounds','Gallons'],
  invUser_:()=>user,
  invSession_:id=>{if(id!=='S1')throw Error('Session missing');},
  invReference_:()=>reference,
  invRows_:name=>name==='CountEntries'?entries:name==='CountEntryAudit'?audit:(()=>{throw Error('Unexpected table '+name)})(),
  invSheet_:name=>{
    const rows=name==='CountEntries'?entries:audit;
    const keys=name==='CountEntries'?countKeys:auditKeys;
    return {
      getLastRow:()=>rows.length+1,
      getRange:(row,col)=>({
        setValues:values=>{for(let i=0;i<values.length;i++)rows[row-2+i]=Object.fromEntries(keys.map((k,j)=>[k,values[i][j]]));},
        setValue:value=>{rows[row-2][keys[col-1]]=value;}
      })
    };
  },
  LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock:()=>{}})},
  Utilities:{getUuid:()=> 'TEST-UUID'}
});
const mocks={invUser_:context.invUser_,invSession_:context.invSession_,
  invReference_:context.invReference_,invRows_:context.invRows_,invSheet_:context.invSheet_};
const code=fs.readFileSync(path.join(__dirname,'../src/Code.gs'),'utf8');
vm.runInContext(code,context,{filename:'Code.gs'});
// Code.gs declares real database helpers; replace them AFTER loading the source.
Object.assign(context,mocks);
const save=request=>vm.runInContext('apiInventorySaveCount',context)(request);
const markEmpty=request=>vm.runInContext('apiInventoryMarkEmpty',context)(request);
const remove=request=>vm.runInContext('apiInventoryDeleteEntry',context)(request);
const count=(entryId,quantity=2)=>({team:'A',sessionId:'S1',locationId:'L1',productId:'P1',uom:'Each',entryId,quantity,entryMethod:'Manual'});
let passed=0;
function check(label,fn){try{fn();passed++;console.log('PASS '+label);}catch(e){throw Error(label+': '+e.message,{cause:e});}}
function reject(label,fn){check(label,()=>assert.throws(fn));}
reject('missing count selection',()=>save({...count('COUNT-000099'),team:''}));
reject('invalid count selection',()=>save({...count('COUNT-000099'),team:'C'}));
check('save',()=>assert.equal(save(count('COUNT-000001')).duplicate,false));
reject('retry cannot change count side',()=>save({...count('COUNT-000001'),team:'B'}));
check('idempotent retry',()=>assert.equal(save(count('COUNT-000001')).duplicate,true));
reject('altered duplicate payload',()=>save(count('COUNT-000001',3)));
reject('forged EMPTY entry method',()=>save({...count('COUNT-000002'),entryMethod:'EMPTY'}));
reject('blank quantity',()=>save(count('COUNT-000002','')));
reject('whitespace quantity',()=>save(count('COUNT-000002','   ')));
reject('boolean quantity',()=>save(count('COUNT-000002',true)));
reject('array quantity',()=>save(count('COUNT-000002',[1])));
reject('exponential string quantity',()=>save(count('COUNT-000002','1e3')));
reject('EMPTY blocked by active item',()=>markEmpty({team:'A',sessionId:'S1',locationId:'L1',entryId:'EMPTY-000001'}));
user={...user,email:'b@example.com'};
reject('cross-user delete',()=>remove({sessionId:'S1',entryId:'COUNT-000001'}));
user={...user,email:'a@example.com'};
check('owner deletion',()=>assert.equal(remove({sessionId:'S1',entryId:'COUNT-000001'}).ok,true));
reject('deleted count retry',()=>save(count('COUNT-000001')));
check('EMPTY after deletion',()=>assert.equal(markEmpty({team:'A',sessionId:'S1',locationId:'L1',entryId:'EMPTY-000001'}).ok,true));
reject('count blocked by EMPTY',()=>save(count('COUNT-000003')));
check('delete EMPTY',()=>assert.equal(remove({sessionId:'S1',entryId:'EMPTY-000001'}).ok,true));
reject('deleted EMPTY retry',()=>markEmpty({team:'A',sessionId:'S1',locationId:'L1',entryId:'EMPTY-000001'}));
check('new count after EMPTY removal',()=>assert.equal(save(count('COUNT-000004')).duplicate,false));
reject('duplicate ID different method',()=>save({...count('COUNT-000004'),entryMethod:'Barcode'}));
reject('negative quantity',()=>save(count('COUNT-000005',-1)));
reject('fractional quantity',()=>save(count('COUNT-000005',1.5)));
reject('invalid product',()=>save({...count('COUNT-000005'),productId:'MISSING'}));
reject('invalid location',()=>save({...count('COUNT-000005'),locationId:'MISSING'}));
reference.locations.push({...reference.locations[0]});
reject('duplicate active location blocks count',()=>save(count('COUNT-000007')));
reject('duplicate active location blocks EMPTY',()=>markEmpty({team:'A',sessionId:'S1',locationId:'L1',entryId:'EMPTY-000007'}));
reference.locations.pop();
reference.products.push({...reference.products[0]});
reject('duplicate active product blocks count',()=>save(count('COUNT-000007')));
reference.products.pop();
check('admin can remove counter entry',()=>{user={...user,email:'admin@example.com',role:'administrator'};assert.equal(remove({sessionId:'S1',entryId:'COUNT-000004'}).ok,true);});
check('admin deletion is audited',()=>assert.equal(audit[audit.length-1].ChangedBy,'admin@example.com'));
check('deleted entry no longer visible to owner',()=>{user={...user,email:'a@example.com',role:'counter'};assert.equal(vm.runInContext('apiInventoryMyEntries',context)({sessionId:'S1',locationId:'L1'}).length,0);});
check('same user can save Count B',()=>assert.equal(save({...count('COUNT-000008'),team:'B'}).duplicate,false));
check('integer string quantity accepted',()=>assert.equal(save(count('COUNT-000006','3')).duplicate,false));
assert.equal(entries.length,5);
assert.equal(audit.length,3);
console.log('PASS '+passed+'/'+passed+' mocked workflow checks; no external services accessed.');

// Stage 36: execute the actual production identity/count-selection/session helpers, not mocks.
const authCtx=vm.createContext({Date,Map,Set,JSON,Number,String,Error,Math});
vm.runInContext(code,authCtx,{filename:'Code.gs'});
let authEmail='counter@example.com';
let authUsers=[{Email:authEmail,Status:'Active',Role:'counter',AssignedTeam:'A',TeamLocked:true}];
let authSessions=[{SessionID:'S-OPEN',Status:'OPEN'},{SessionID:'S-CLOSED',Status:'CLOSED'}];
authCtx.invEmail_=()=>authEmail;
authCtx.invRows_=name=>name==='AppUsers'?authUsers:name==='InventorySessions'?authSessions:(()=>{throw Error('Unexpected auth table '+name)})();
const realUser=()=>vm.runInContext('invUser_',authCtx)();
const realSelection=request=>vm.runInContext('invCountSelection_',authCtx)(request);
const realSession=id=>vm.runInContext('invSession_',authCtx)(id);
check('production active counter identity',()=>assert.equal(realUser().role,'counter'));
check('Count A selection',()=>assert.equal(realSelection({team:'A'}),'A'));
check('production open session',()=>assert.equal(realSession('S-OPEN').Status,'OPEN'));
authUsers[0].Status='Inactive';
reject('production inactive account',()=>realUser());
authUsers[0].Status='Active';authUsers[0].Role='viewer';
reject('production invalid role',()=>realUser());
authUsers[0].Role='counter';authUsers[0].TeamLocked=false;
check('unlocked counter may choose Count B',()=>assert.equal(realSelection({team:'B'}),'B'));
reject('invalid Count C',()=>realSelection({team:'C'}));
reject('missing count selection',()=>realSelection({}));authUsers.push({...authUsers[0]});
reject('production duplicate user account',()=>realUser());
authUsers.pop();
reject('production closed session',()=>realSession('S-CLOSED'));
reject('production unknown session',()=>realSession('S-UNKNOWN'));
authSessions.push({...authSessions[0]});
reject('production duplicate session',()=>realSession('S-OPEN'));
authSessions.pop();
check('production authorization restored',()=>{assert.equal(realUser().role,'counter');assert.equal(realSelection({team:'A'}),'A');assert.equal(realSession('S-OPEN').Status,'OPEN');});
console.log('Stage 36: production identity/count-selection/session helper checks passed');
