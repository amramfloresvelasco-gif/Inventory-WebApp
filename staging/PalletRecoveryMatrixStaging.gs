/** Stage 63 — PURE recovery matrix. No Sheets calls, no data mutations.
 * Run only in isolated staging Apps Script, never production.
 * All tests use synthetic in-memory objects.
 */
function testStagingPalletRecoveryMatrix() {
  invAssertStagingOnly_();
  const parent='STAGING-RECOVERY-PURE-0001';
  const request={parentSubmissionId:parent,sessionId:'STAGING-SESSION-001',
    locationId:'STAGING-LOC-001',productId:'STAGING-FG-001',
    pallets:2,casesPerPallet:10,partialCases:3,looseBottles:2,
    entryMethod:'Manual',notes:'PURE RECOVERY TEST'};
  const identity={team:'A',email:'abe.flores@bsbco.com'};
  const intent=invPalletIntent_(request,identity);
  const scope={sessionId:request.sessionId,locationId:request.locationId,
    productId:request.productId,team:'A',email:identity.email,
    entryMethod:'Manual',notes:request.notes};
  const children=intent.children.map(c=>({
    EntryID:c.entryId,ParentEntryID:parent,UOM:c.uom,Quantity:c.quantity,
    Status:'ACTIVE',PalletMultiplier:1,SessionID:scope.sessionId,
    LocationID:scope.locationId,WSItemID:scope.productId,Team:scope.team,
    EnteredBy:scope.email,EntryMethod:scope.entryMethod,Notes:scope.notes
  }));
  const journal=[{ParentSubmissionID:parent,IntentJSON:JSON.stringify(intent),
    Status:'PREPARED'}];
  let passed=0;
  function check(name,condition) {
    if(!condition)throw new Error('FAILED '+name);
    console.log('PASS '+name);passed++;
  }
  function state(rows) {return invClassifyPalletFamily_(intent,rows,scope).state;}
  function action(rows) {return invPalletJournalReconcile_(intent,rows,scope).action;}
  check('first intent writes journal',invPalletJournalDecision_(intent,[]).action==='WRITE_INTENT');
  check('prepared retry inspects',invPalletJournalDecision_(intent,journal).action==='INSPECT_CHILDREN');
  check('empty family can write',state([])==='EMPTY'&&action([])==='WRITE_CHILDREN');
  check('complete family acknowledged',state(children)==='COMPLETE'&&action(children)==='ACKNOWLEDGE');
  check('partial family blocks',state(children.slice(0,2))==='PARTIAL'&&action(children.slice(0,2))==='BLOCK');
  check('one child missing blocks',state(children.slice(0,3))==='PARTIAL'&&action(children.slice(0,3))==='BLOCK');
  check('duplicate child blocks',state([...children,children[0]])==='BLOCKED'&&action([...children,children[0]])==='BLOCK');
  const altered=children.map(c=>({...c}));altered[0].Quantity=999;
  check('altered quantity blocks',state(altered)==='BLOCKED'&&action(altered)==='BLOCK');
  const changedParent=children.map(c=>({...c}));changedParent[0].ParentEntryID='WRONG-PARENT';
  check('parent mismatch blocks',state(changedParent)==='BLOCKED');
  const alteredScope=children.map(c=>({...c}));alteredScope[0].Team='B';
  check('team mismatch blocks',state(alteredScope)==='BLOCKED');
  const changed=invPalletIntent_({...request,partialCases:4},identity);
  check('changed retry intent blocks',invPalletJournalDecision_(changed,journal).reason==='INTENT_CHANGED');
  check('duplicate journal blocks',invPalletJournalDecision_(intent,[...journal,...journal]).reason==='DUPLICATE_JOURNAL');
  check('invalid stored JSON blocks',invPalletJournalDecision_(intent,[{...journal,IntentJSON:'{'}]).reason==='INVALID_STORED_INTENT');
  check('unknown journal status blocks',invPalletJournalDecision_(intent,[{...journal,Status:'UNKNOWN'}]).reason==='UNKNOWN_JOURNAL_STATUS');
  check('committed retry inspects',invPalletJournalDecision_(intent,[{...journal,Status:'COMMITTED'}]).action==='INSPECT_CHILDREN');
  console.log(JSON.stringify({phase:'PASS',stagingOnly:true,pureInMemory:true,
    testCases:passed,databaseWrites:0}));
}
