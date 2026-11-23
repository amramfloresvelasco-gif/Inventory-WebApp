/** Stage 68 — STAGING-ONLY read-only administrator inspection of incomplete pallet family.
 * No database mutations, no public RPC, no automatic repair.
 */
function testStagingPartialPalletAdminInspection() {
  invAssertStagingOnly_();
  // Staging inspection requires an administrator; Count A/B is chosen per entry,
  // never inferred from legacy user team assignment or team-lock columns.
  // This diagnostic is read-only and exposes no public RPC.
  const user=invUser_();
  if(user.role!=='administrator')
    throw Error('BLOCKED: authorized staging administrator required');
  const parent='STAGING-PARTIAL-0001';
  const journals=invPalletJournalRows_().filter(r=>String(r.ParentSubmissionID)===parent);
  if(journals.length!==1)throw Error('REVIEW: expected exactly one journal, found '+journals.length);
  const record=journals[0];
  let intent;
  try{intent=JSON.parse(String(record.IntentJSON||''));}
  catch(_){throw Error('REVIEW: stored journal intent cannot be parsed');}
  if(!intent||intent.parentSubmissionId!==parent||!Array.isArray(intent.children))
    throw Error('REVIEW: invalid stored intent');
  if(String(record.Status).toUpperCase()!=='PREPARED')
    throw Error('REVIEW: unexpected journal status');
  const entries=invRows_('CountEntries');
  const scope={sessionId:intent.sessionId,locationId:intent.locationId,
    productId:intent.productId,team:intent.team,email:intent.email,
    entryMethod:intent.entryMethod,notes:intent.notes};
  const state=invClassifyPalletFamily_(intent,entries,scope);
  const decision=invPalletJournalDecision_(intent,invPalletJournalRows_());
  const familyRows=entries.filter(r=>String(r.ParentEntryID)===parent||
    intent.children.some(c=>c.entryId===String(r.EntryID)));
  const result={phase:'ADMIN_INSPECTION',stagingOnly:true,readOnly:true,
    testerRole:user.role,parentSubmissionId:parent,
    journalCount:journals.length,journalStatus:String(record.Status),
    expectedChildren:intent.children.length,observedChildren:familyRows.length,
    state:state.state,matchedCount:state.matched.length,
    missingCount:state.missing.length,issueCount:state.issues.length,
    journalDecision:decision.action,adminReviewRequired:state.state!=='COMPLETE'};
  console.log(JSON.stringify(result));
  if(state.state!=='PARTIAL'||state.matched.length!==1||
     state.missing.length!==3||familyRows.length!==1||
     decision.action!=='INSPECT_CHILDREN')
    throw Error('FAIL: staging partial family differs from expected; investigate manually');
  console.log(JSON.stringify({phase:'PASS',stagingOnly:true,readOnly:true,
    partialFamilyConfirmed:true,databaseWrites:0,adminReviewRequired:true}));
}


/** Stage 124: preview a safe administrator resolution, without changing Sheets.
 * The incomplete synthetic family must never be silently completed or deleted.
 * This checks that a future explicit, audited abandonment could deactivate
 * the single child while retaining the immutable PREPARED journal.
 */
function testStagingPartialPalletResolutionPreview() {
  invAssertStagingOnly_();
  const user=invRequireAdmin_();
  const parent='STAGING-PARTIAL-0001';
  const journals=invPalletJournalRows_().filter(r=>String(r.ParentSubmissionID)===parent);
  if(journals.length!==1)throw Error('BLOCKED: expected one original journal');
  const record=journals[0];
  if(String(record.Status).trim().toUpperCase()!=='PREPARED')
    throw Error('BLOCKED: original journal status changed');
  let intent;
  try {intent=JSON.parse(String(record.IntentJSON||''));}
  catch(_) {throw Error('BLOCKED: journal JSON invalid');}
  if(!intent||intent.parentSubmissionId!==parent||!Array.isArray(intent.children)||
     intent.children.length!==4)throw Error('BLOCKED: unexpected intent');
  const entries=invRows_('CountEntries');
  const scope={sessionId:intent.sessionId,locationId:intent.locationId,
    productId:intent.productId,team:intent.team,email:intent.email,
    entryMethod:intent.entryMethod,notes:intent.notes};
  const state=invClassifyPalletFamily_(intent,entries,scope);
  const familyRows=entries.filter(r=>String(r.ParentEntryID||'')===parent||
    intent.children.some(c=>c.entryId===String(r.EntryID)));
  if(state.state!=='PARTIAL'||state.matched.length!==1||
     state.missing.length!==3||state.issues.length!==0||
     familyRows.length!==1||
     String(familyRows[0].Status).trim().toUpperCase()!=='ACTIVE')
    throw Error('BLOCKED: family changed since administrator inspection');
  // Do not execute this proposal. Journal status cannot be repurposed to
  // COMMITTED: that means a fully saved family in existing retry semantics.
  const preview={
    phase:'ADMIN_RESOLUTION_PREVIEW',stagingOnly:true,readOnly:true,
    databaseWrites:0,parentSubmissionId:parent,
    currentState:'PARTIAL',expectedChildren:4,existingActiveChildren:1,
    missingChildren:3,administratorRole:user.role,
    proposedAction:'ABANDON_WITH_AUDIT',approved:false,
    requiredDesign:[
      'Explicit administrator confirmation and reason',
      'Dedicated terminal ABANDONED journal state and retry rejection',
      'Deactivate existing child with immutable audit record',
      'Atomic lock and revalidation before any mutation',
      'Keep original journal intent and child history'
    ],
    changesPerformed:0,readyToExecute:false
  };
  console.log(JSON.stringify(preview));
  return preview;
}


/** Stage 125 — pure, fail-closed resolution planner.
 * Returns a proposed audit/deactivation plan; never writes to Sheets.
 * This does NOT authorize execution or change journal retry semantics.
 */
function invStagingPlanPartialAbandonment_(journalRows,entries,parent,reason,admin) {
  const why=String(reason||'').trim();
  if(!admin||admin.role!=='administrator'||!String(admin.email||'').trim())
    throw Error('BLOCKED: administrator required');
  if(why.length<15||why.length>200)
    throw Error('BLOCKED: administrator reason must be 15–200 characters');
  const records=journalRows.filter(r=>String(r.ParentSubmissionID)===parent);
  if(records.length!==1)throw Error('BLOCKED: journal missing or duplicated');
  const record=records[0];
  if(String(record.Status).trim().toUpperCase()!=='PREPARED')
    throw Error('BLOCKED: journal must remain PREPARED for review');
  let intent;
  try {intent=JSON.parse(String(record.IntentJSON||''));}
  catch(_) {throw Error('BLOCKED: invalid journal JSON');}
  if(!intent||intent.parentSubmissionId!==parent||!Array.isArray(intent.children)||
     intent.children.length!==4)throw Error('BLOCKED: unexpected journal intent');
  const scope={sessionId:intent.sessionId,locationId:intent.locationId,
    productId:intent.productId,team:intent.team,email:intent.email,
    entryMethod:intent.entryMethod,notes:intent.notes};
  const state=invClassifyPalletFamily_(intent,entries,scope);
  const family=entries.filter(r=>String(r.ParentEntryID||'')===parent||
    intent.children.some(c=>c.entryId===String(r.EntryID)));
  if(state.state!=='PARTIAL'||state.matched.length!==1||
     state.missing.length!==3||state.issues.length!==0||
     family.length!==1||String(family[0].Status).toUpperCase()!=='ACTIVE')
    throw Error('BLOCKED: unexpected partial family; manual investigation required');
  return {
    parentSubmissionId:parent,action:'ABANDON_WITH_AUDIT',
    journalFrom:'PREPARED',journalTo:'ABANDONED',
    childEntryId:String(family[0].EntryID),
    childFrom:'ACTIVE',childTo:'DELETED',
    auditAction:'ABANDON_PARTIAL_PALLET',reason:why,
    approved:false,executable:false
  };
}

/** Stage 125 — pure planner regression matrix, no spreadsheet writes.
 * Existing Stage 124 live inspection already verified the real fixture.
 */
function testStagingPartialPalletResolutionPlan() {
  invAssertStagingOnly_();
  const admin=invRequireAdmin_();
  const parent='STAGING-PLAN-FIXTURE-0001';
  const request={parentSubmissionId:parent,sessionId:'STAGING-SESSION-001',
    locationId:'STAGING-LOC-001',productId:'STAGING-FG-001',
    pallets:2,casesPerPallet:8,partialCases:3,looseBottles:1,
    entryMethod:'Manual',notes:'PURE STAGING FIXTURE'};
  const intent=invPalletIntent_(request,{email:admin.email,team:'A'});
  const journals=[{ParentSubmissionID:parent,Status:'PREPARED',
    IntentJSON:JSON.stringify(intent)}];
  const child=intent.children[0];
  const entries=[{EntryID:child.entryId,ParentEntryID:parent,
    SessionID:request.sessionId,LocationID:request.locationId,
    WSItemID:request.productId,Team:'A',EnteredBy:admin.email,
    EntryMethod:request.entryMethod,Notes:request.notes,
    UOM:child.uom,Quantity:child.quantity,PalletMultiplier:1,Status:'ACTIVE'}];
  const reason='Administrator reviewed synthetic interrupted test';
  const plan=invStagingPlanPartialAbandonment_(journals,entries,parent,reason,admin);
  if(plan.executable!==false||plan.approved!==false||
     plan.childEntryId!==child.entryId||plan.journalTo!=='ABANDONED')
    throw Error('FAIL: unexpected resolution plan');
  let blocked=0;
  const reject=(name,fn)=>{
    try {fn();}catch(_) {blocked++;return;}
    throw Error('FAIL: '+name+' should be blocked');
  };
  reject('nonadmin',()=>invStagingPlanPartialAbandonment_(journals,entries,parent,reason,
    {email:admin.email,role:'counter'}));
  reject('missing reason',()=>invStagingPlanPartialAbandonment_(journals,entries,parent,'',admin));
  reject('duplicate journal',()=>invStagingPlanPartialAbandonment_(
    [...journals,...journals],entries,parent,reason,admin));
  reject('wrong journal status',()=>invStagingPlanPartialAbandonment_(
    [{...journals[0],Status:'COMMITTED'}],entries,parent,reason,admin));
  reject('already abandoned',()=>invStagingPlanPartialAbandonment_(
    [{...journals[0],Status:'ABANDONED'}],entries,parent,reason,admin));
  reject('changed intent',()=>invStagingPlanPartialAbandonment_(
    [{...journals[0],IntentJSON:JSON.stringify({...intent,parentSubmissionId:'OTHER'})}],
    entries,parent,reason,admin));
  reject('unexpected extra child',()=>invStagingPlanPartialAbandonment_(journals,
    [...entries,{...entries[0],EntryID:'UNEXPECTED-CHILD',ParentEntryID:parent}],parent,reason,admin));
  reject('missing child',()=>invStagingPlanPartialAbandonment_(journals,[],parent,reason,admin));
  reject('extra child',()=>invStagingPlanPartialAbandonment_(journals,
    [...entries,{...entries[0]}],parent,reason,admin));
  reject('tampered child',()=>invStagingPlanPartialAbandonment_(journals,
    [{...entries[0],Quantity:999}],parent,reason,admin));
  reject('deleted child',()=>invStagingPlanPartialAbandonment_(journals,
    [{...entries[0],Status:'DELETED'}],parent,reason,admin));
  console.log(JSON.stringify({phase:'RESOLUTION_PLAN_TEST',stagingOnly:true,
    pureInMemory:true,passed:blocked+1,blockedUnsafeScenarios:blocked,
    databaseWrites:0,executable:false}));
}
