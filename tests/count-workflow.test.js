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
let user={email:'a@example.com',role:'counter',team:'A',teamLocked:true};
const countKeys=['EntryID','SessionID','Team','LocationID','WSItemID','UOM','Quantity','ParentEntryID','PalletMultiplier','EnteredBy','EnteredAt','EntryMethod','Notes','Status'];
const auditKeys=['AuditID','EntryID','SessionID','Action','OldValue','NewValue','Reason','ChangedBy','ChangedAt'];
const context=vm.createContext({
  Date,Map,Set,JSON,Number,String,Error,Math,
  INV_RAW_UOMS:['Each','Pounds','Gallons'],
  invUser_:()=>user,
  invTeam_:u=>u.team,
  invSession_:id=>{if(id!=='S1')throw Error('Session missing');},
  invReference_:()=>({locations:[{LocationID:'L1'}],products:[{WSItemID:'P1',ClassOfMaterial:'Raw Material',DefaultUOM:'Each'}]}),
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
const code=fs.readFileSync(path.join(__dirname,'../src/Code.gs'),'utf8');
vm.runInContext(code,context,{filename:'Code.gs'});
const save=request=>vm.runInContext('apiInventorySaveCount',context)(request);
const markEmpty=request=>vm.runInContext('apiInventoryMarkEmpty',context)(request);
const remove=request=>vm.runInContext('apiInventoryDeleteEntry',context)(request);
const count=(entryId,quantity=2)=>({sessionId:'S1',locationId:'L1',productId:'P1',uom:'Each',entryId,quantity,entryMethod:'Manual'});
let passed=0;
function check(label,fn){try{fn();passed++;console.log('PASS '+label);}catch(e){throw Error(label+': '+e.message,{cause:e});}}
function reject(label,fn){check(label,()=>assert.throws(fn));}
check('save',()=>assert.equal(save(count('COUNT-000001')).duplicate,false));
check('idempotent retry',()=>assert.equal(save(count('COUNT-000001')).duplicate,true));
reject('altered duplicate payload',()=>save(count('COUNT-000001',3)));
reject('forged EMPTY entry method',()=>save({...count('COUNT-000002'),entryMethod:'EMPTY'}));
reject('blank quantity',()=>save(count('COUNT-000002','')));
reject('EMPTY blocked by active item',()=>markEmpty({sessionId:'S1',locationId:'L1',entryId:'EMPTY-000001'}));
user={...user,email:'b@example.com'};
reject('cross-user delete',()=>remove({sessionId:'S1',entryId:'COUNT-000001'}));
user={...user,email:'a@example.com'};
check('owner deletion',()=>assert.equal(remove({sessionId:'S1',entryId:'COUNT-000001'}).ok,true));
reject('deleted count retry',()=>save(count('COUNT-000001')));
check('EMPTY after deletion',()=>assert.equal(markEmpty({sessionId:'S1',locationId:'L1',entryId:'EMPTY-000001'}).ok,true));
reject('count blocked by EMPTY',()=>save(count('COUNT-000003')));
check('delete EMPTY',()=>assert.equal(remove({sessionId:'S1',entryId:'EMPTY-000001'}).ok,true));
reject('deleted EMPTY retry',()=>markEmpty({sessionId:'S1',locationId:'L1',entryId:'EMPTY-000001'}));
assert.equal(entries.length,2);
assert.equal(audit.length,2);
console.log('PASS '+passed+'/'+passed+' mocked workflow checks; no external services accessed.');
