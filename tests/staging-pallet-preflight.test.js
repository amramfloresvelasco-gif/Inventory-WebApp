'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const HEADERS=['ParentSubmissionID','SessionID','IntentJSON','Status','CreatedAt','CreatedBy'];
let journal=[],entries=[],teamB=true,adminAccount=true,adminAssignedTeam='',userRole='administrator',scriptAuthorized=true;
const context=vm.createContext({
  console:{log:()=>{}},Set,Number,String,JSON,
  invAssertStagingOnly_:()=>{if(!scriptAuthorized)throw Error('Wrong staging project')},
  invUser_:()=>({email:'staging-admin@example.com',role:userRole}),
  invRows_:name=>({
    AppUsers:[...(adminAccount?[{Email:'admin@example.com',Role:'administrator',Status:'Active',AssignedTeam:adminAssignedTeam,TeamLocked:!!adminAssignedTeam}]:[]),
      {Email:'a@example.com',Role:'counter',Status:'Active',AssignedTeam:'A',TeamLocked:true},
      ...(teamB?[{Email:'b@example.com',Role:'counter',Status:'Active',AssignedTeam:'B',TeamLocked:true}]:[])],
    InventorySessions:[{SessionID:'S1',Status:'OPEN'}],
    Locations:[{LocationID:'L1',Active:true}],
    ProductIndex:[{WSItemID:'FG1',Active:true,ClassOfMaterial:'Finished Good',UnitsPerCase:12}],
    CountEntries:entries
  })[name],
  SpreadsheetApp:{openById:()=>({getSheetByName:()=>({
    getLastRow:()=>journal.length+1,
    getRange:(row,col,n)=>({
      getDisplayValues:()=>[HEADERS],
      getValues:()=>journal
    })
  })})},
  INV_DB_ID:'STAGING_ONLY'
});
for(const file of ['PalletChildPlanner','PalletIntentContract','PalletFamilyRecovery'])
 vm.runInContext(fs.readFileSync('src/'+file+'.gs','utf8'),context);
vm.runInContext(fs.readFileSync('staging/PalletTeamIsolationStaging.gs','utf8'),context);
const preflight=vm.runInContext('testStagingPalletIntegrationPreflight',context);
assert.equal(preflight().readyForCountABTest,true);
userRole='counter';
assert.throws(()=>preflight(),/authorized staging administrator/);
userRole='administrator';
adminAccount=false;
assert(preflight().blockers.includes('NO_ACTIVE_STAGING_ADMINISTRATOR'));
assert.equal(preflight().readyForCountABTest,false);
adminAccount=true;
teamB=false;
adminAssignedTeam='B';
// Administrator alone is sufficient to test Count A and Count B.
assert.equal(preflight().readyForCountABTest,true);
assert.equal(preflight().activeTestUsers,2);
adminAssignedTeam='';
teamB=true;
const intent=vm.runInContext('invPalletIntent_',context)({
 parentSubmissionId:'PARENT-TEST-123',sessionId:'S1',locationId:'L1',
 productId:'FG1',pallets:1,casesPerPallet:10,partialCases:0,looseBottles:0
},{email:'a@example.com',team:'A'});
journal=[[intent.parentSubmissionId,'S1',JSON.stringify(intent),'PREPARED','now',intent.email]];
assert.equal(preflight().journalHealth.empty,1);
assert(preflight().blockers.includes('PALLET_PREPARED_INTENT_WITHOUT_CHILDREN'));
assert.equal(preflight().readyForCountABTest,false);
entries=[{EntryID:intent.children[0].entryId,ParentEntryID:intent.parentSubmissionId,
 SessionID:'S1',LocationID:'L1',WSItemID:'FG1',Team:'A',EnteredBy:'a@example.com',
 EntryMethod:'Manual',Notes:'',UOM:'Case',Quantity:10,PalletMultiplier:1,Status:'ACTIVE'}];
assert.equal(preflight().journalHealth.complete,1);
journal[0][3]='COMMITTED';
assert.equal(preflight().journalHealth.complete,1);
// A partially persisted family is never considered ready.
const secondIntent=vm.runInContext('invPalletIntent_',context)({
 parentSubmissionId:'PARENT-TEST-456',sessionId:'S1',locationId:'L1',
 productId:'FG1',pallets:2,casesPerPallet:10,partialCases:0,looseBottles:0
},{email:'a@example.com',team:'A'});
journal=[[secondIntent.parentSubmissionId,'S1',JSON.stringify(secondIntent),'PREPARED','now',secondIntent.email]];
entries=[{...entries[0],EntryID:secondIntent.children[0].entryId,
 ParentEntryID:secondIntent.parentSubmissionId}];
assert.equal(preflight().journalHealth.partial,1);
assert.equal(preflight().reviewRows[0].journalRow,2);
assert.equal(preflight().reviewRows[0].missingChildren,1);
assert.equal(preflight().reviewRows[0].matchedChildren,1);
assert.equal(preflight().readyForCountABTest,false);
// A duplicate journal parent or a forged child plan must block readiness.
journal.push([...journal[0]]);
assert.equal(preflight().journalHealth.invalid,1);
journal.pop();
journal[0][2]=JSON.stringify({...secondIntent,totalCases:999});
assert.equal(preflight().journalHealth.invalid,1);
// Restore one complete family before testing corrupt JSON and orphans.
journal=[[intent.parentSubmissionId,'S1',JSON.stringify(intent),'PREPARED','now',intent.email]];
entries=[{...entries[0],EntryID:intent.children[0].entryId,
 ParentEntryID:intent.parentSubmissionId}];
assert.equal(preflight().journalHealth.complete,1);
journal[0][2]='invalid json';
assert(preflight().blockers.includes('PALLET_JOURNAL_REQUIRES_ADMIN_REVIEW'));
journal=[];
assert.equal(preflight().journalHealth.orphan,1);
assert.equal(preflight().readyForCountABTest,false);
scriptAuthorized=false;
assert.throws(()=>preflight(),/Wrong staging project/);
console.log('Staging preflight: readiness, team isolation, journal integrity, orphan and staging guard passed');
