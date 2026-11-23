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


/** Stage 127: pure transition contract for future audited admin abandonment.
 * This is a dry-run state machine, NOT a Sheets mutation or public endpoint.
 */
function invStagingAbandonmentTransition_(plan,journal,child,audit) {
  if(!plan||plan.action!=='ABANDON_WITH_AUDIT'||
     plan.approved!==false||plan.executable!==false||
     plan.journalFrom!=='PREPARED'||plan.journalTo!=='ABANDONED'||
     plan.childFrom!=='ACTIVE'||plan.childTo!=='DELETED'||
     plan.auditAction!=='ABANDON_PARTIAL_PALLET')
    throw Error('BLOCKED: invalid abandonment plan');
  if(String(journal.ParentSubmissionID)!==plan.parentSubmissionId||
     String(journal.Status).toUpperCase()!=='PREPARED'||
     String(child.EntryID)!==plan.childEntryId||
     String(child.ParentEntryID)!==plan.parentSubmissionId||
     String(child.Status).toUpperCase()!=='ACTIVE')
    throw Error('BLOCKED: concurrent change or wrong record');
  if(!audit||audit.action!==plan.auditAction||
     audit.entryId!==plan.childEntryId||
     audit.reason!==plan.reason||!audit.changedBy||
     !audit.changedAt)
    throw Error('BLOCKED: immutable audit details required');
  return {
    journal:{...journal,Status:'ABANDONED'},
    child:{...child,Status:'DELETED'},
    audit:{...audit},
    retryDecision:{action:'BLOCK',reason:'ABANDONED_JOURNAL'},
    dryRun:true,databaseWrites:0
  };
}

/** Stage 127: in-memory contract matrix, zero writes. */
function testStagingPartialPalletTransitionContract() {
  invAssertStagingOnly_();
  const admin=invRequireAdmin_(),parent='STAGING-TRANSITION-FIXTURE';
  const plan={parentSubmissionId:parent,action:'ABANDON_WITH_AUDIT',
    journalFrom:'PREPARED',journalTo:'ABANDONED',
    childEntryId:parent+'-001',childFrom:'ACTIVE',childTo:'DELETED',
    auditAction:'ABANDON_PARTIAL_PALLET',
    reason:'Administrator reviewed interrupted synthetic test',
    approved:false,executable:false};
  const journal={ParentSubmissionID:parent,Status:'PREPARED'};
  const child={EntryID:plan.childEntryId,ParentEntryID:parent,Status:'ACTIVE'};
  const audit={action:plan.auditAction,entryId:plan.childEntryId,
    reason:plan.reason,changedBy:admin.email,changedAt:'2026-11-23T00:00:00Z'};
  const next=invStagingAbandonmentTransition_(plan,journal,child,audit);
  if(next.journal.Status!=='ABANDONED'||next.child.Status!=='DELETED'||
     next.retryDecision.action!=='BLOCK'||next.databaseWrites!==0||
     journal.Status!=='PREPARED'||child.Status!=='ACTIVE')
    throw Error('FAIL: state transition contract');
  let blocked=0;
  const reject=(label,fn)=>{
    try {fn();}catch(_){blocked++;return;}
    throw Error('FAIL: unsafe '+label+' accepted');
  };
  reject('missing audit',()=>invStagingAbandonmentTransition_(plan,journal,child,null));
  reject('wrong reason',()=>invStagingAbandonmentTransition_(plan,journal,child,
    {...audit,reason:'different'}));
  reject('wrong author',()=>invStagingAbandonmentTransition_(plan,journal,child,
    {...audit,changedBy:''}));
  reject('wrong journal',()=>invStagingAbandonmentTransition_(plan,
    {...journal,Status:'COMMITTED'},child,audit));
  reject('already abandoned',()=>invStagingAbandonmentTransition_(plan,
    {...journal,Status:'ABANDONED'},child,audit));
  reject('deleted child',()=>invStagingAbandonmentTransition_(plan,journal,
    {...child,Status:'DELETED'},audit));
  reject('wrong child',()=>invStagingAbandonmentTransition_(plan,journal,
    {...child,EntryID:'OTHER'},audit));
  reject('executable plan',()=>invStagingAbandonmentTransition_(
    {...plan,executable:true},journal,child,audit));
  console.log(JSON.stringify({phase:'TRANSITION_CONTRACT_PASS',
    stagingOnly:true,pureInMemory:true,tests:blocked+1,
    unsafeCasesRejected:blocked,databaseWrites:0}));
}


/** Stage 130 — staging-only guarded administrator resolution.
 * NEVER call without separate explicit approval for the named staging record.
 * No public RPC, no production use. Requires audit tab to already exist.
 * Journal transition is last, so any interruption remains fail-closed.
 */
function invStagingAbandonPartialPallet_(input) {
  invAssertStagingOnly_();
  const admin=invRequireAdmin_();
  const parent=String(input&&input.parentSubmissionId||'').trim();
  const reason=String(input&&input.reason||'').trim();
  const confirmation=String(input&&input.confirmation||'').trim();
  if(parent!=='STAGING-PARTIAL-0001'||
     confirmation!=='ABANDON STAGING-PARTIAL-0001')
    throw Error('BLOCKED: exact staging parent and explicit confirmation required');
  const lock=LockService.getScriptLock();
  if(!lock.tryLock(15000))throw Error('BLOCKED: staging database busy');
  try {
    invAssertStagingOnly_();
    const journalSheet=SpreadsheetApp.openById(INV_DB_ID)
      .getSheetByName('PalletSubmissionJournal');
    const entrySheet=invSheet_('CountEntries');
    const auditSheet=SpreadsheetApp.openById(INV_DB_ID)
      .getSheetByName('CountEntryAudit');
    if(!journalSheet||!auditSheet)
      throw Error('BLOCKED: journal or immutable audit tab missing');
    const auditHeaders=['AuditID','EntryID','SessionID','Action','OldValue',
      'NewValue','Reason','ChangedBy','ChangedAt'];
    const actualAudit=auditSheet.getRange(1,1,1,9).getDisplayValues()[0];
    if(actualAudit.join('|')!==auditHeaders.join('|'))
      throw Error('BLOCKED: audit schema mismatch');
    const journalHeaders=['ParentSubmissionID','SessionID','IntentJSON',
      'Status','CreatedAt','CreatedBy'];
    if(journalSheet.getRange(1,1,1,6).getDisplayValues()[0].join('|')!==
       journalHeaders.join('|'))
      throw Error('BLOCKED: journal schema mismatch');
    const rawJournal=journalSheet.getLastRow()>1?
      journalSheet.getRange(2,1,journalSheet.getLastRow()-1,6).getValues():[];
    const journals=rawJournal.map(row=>Object.fromEntries(
      journalHeaders.map((name,i)=>[name,row[i]])));
    const entries=invRows_('CountEntries');
    const plan=invStagingPlanPartialAbandonment_(
      journals,entries,parent,reason,admin);
    const journalIndex=journals.findIndex(r=>
      String(r.ParentSubmissionID)===parent);
    const childIndex=entries.findIndex(r=>
      String(r.EntryID)===plan.childEntryId);
    if(journalIndex<0||childIndex<0)
      throw Error('BLOCKED: row lookup changed');
    const journal=journals[journalIndex],child=entries[childIndex];
    const now=new Date();
    const audit={
      action:plan.auditAction,entryId:plan.childEntryId,
      reason:plan.reason,changedBy:admin.email,changedAt:now
    };
    invStagingAbandonmentTransition_(plan,journal,child,audit);
    // Guard against a repeated or interrupted attempt: do not append a
    // second audit or overwrite an existing historical decision.
    const priorAudit=auditSheet.getLastRow()>1?
      auditSheet.getRange(2,1,auditSheet.getLastRow()-1,9).getValues():[];
    if(priorAudit.some(row=>String(row[1])===plan.childEntryId&&
       String(row[3])===plan.auditAction))
      throw Error('BLOCKED: prior abandonment audit exists');
    // Ordered, append-only audit first. If any subsequent write fails,
    // PREPARED or ACTIVE remains visible and preflight stays blocked.
    auditSheet.getRange(auditSheet.getLastRow()+1,1,1,9).setValues([[
      'AUD-'+Utilities.getUuid(),plan.childEntryId,String(child.SessionID),
      plan.auditAction,
      JSON.stringify({status:'ACTIVE',parentSubmissionId:parent,
        itemId:String(child.WSItemID),quantity:child.Quantity,
        team:String(child.Team),locationId:String(child.LocationID)}),
      JSON.stringify({status:'DELETED',journalStatus:'ABANDONED'}),
      plan.reason,admin.email,now
    ]]);
    entrySheet.getRange(childIndex+2,14).setValue('DELETED');
    journalSheet.getRange(journalIndex+2,4).setValue('ABANDONED');
    const outcome={phase:'ADMIN_ABANDONED',stagingOnly:true,
      parentSubmissionId:parent,childEntryId:plan.childEntryId,
      journalStatus:'ABANDONED',childStatus:'DELETED',auditAppended:1};
    console.log(JSON.stringify(outcome));
    return outcome;
  }finally{lock.releaseLock();}
}


/** Stage 131: check required staging audit infrastructure without creating it. */
function testStagingAbandonmentAuditPreflight() {
  invAssertStagingOnly_();
  invRequireAdmin_();
  const db=SpreadsheetApp.openById(INV_DB_ID);
  const sheet=db.getSheetByName('CountEntryAudit');
  const headers=['AuditID','EntryID','SessionID','Action','OldValue',
    'NewValue','Reason','ChangedBy','ChangedAt'];
  const actual=sheet?sheet.getRange(1,1,1,9).getDisplayValues()[0]:[];
  const ready=actual.join('|')===headers.join('|');
  const result={phase:'ABANDONMENT_AUDIT_PREFLIGHT',stagingOnly:true,
    readOnly:true,databaseWrites:0,auditTabExists:!!sheet,
    auditSchemaValid:ready,readyForAbandonment:ready,
    blocker:ready?null:'COUNT_ENTRY_AUDIT_TAB_MISSING_OR_INVALID'};
  console.log(JSON.stringify(result));
  return result;
}

/** Stage 131: detect interrupted abandonment writes without modifying data. */
function testStagingAbandonmentRecoveryInspection() {
  invAssertStagingOnly_();
  invRequireAdmin_();
  const parent='STAGING-PARTIAL-0001';
  const journal=invPalletJournalRows_().filter(r=>
    String(r.ParentSubmissionID)===parent);
  if(journal.length!==1)throw Error('BLOCKED: unexpected journal count');
  const entries=invRows_('CountEntries').filter(r=>
    String(r.ParentEntryID)===parent);
  const auditSheet=SpreadsheetApp.openById(INV_DB_ID)
    .getSheetByName('CountEntryAudit');
  const auditRows=auditSheet&&auditSheet.getLastRow()>1?
    auditSheet.getRange(2,1,auditSheet.getLastRow()-1,9).getValues():[];
  const abandonmentAudit=auditRows.filter(r=>
    String(r[3])==='ABANDON_PARTIAL_PALLET'&&
    entries.some(e=>String(e.EntryID)===String(r[1])));
  const status=String(journal[0].Status).toUpperCase();
  const active=entries.filter(r=>String(r.Status).toUpperCase()==='ACTIVE').length;
  const deleted=entries.filter(r=>String(r.Status).toUpperCase()==='DELETED').length;
  const phase=status==='PREPARED'&&active===1&&deleted===0&&abandonmentAudit.length===0?
    'AWAITING_APPROVAL':status==='ABANDONED'&&active===0&&deleted===1&&
    abandonmentAudit.length===1?'ABANDONED_WITH_AUDIT':'MANUAL_RECOVERY_REQUIRED';
  const result={phase:'ABANDONMENT_RECOVERY_INSPECTION',stagingOnly:true,
    readOnly:true,databaseWrites:0,state:phase,journalStatus:status,
    activeChildren:active,deletedChildren:deleted,
    abandonmentAuditRows:abandonmentAudit.length};
  console.log(JSON.stringify(result));
  return result;
}


/** Stage 132 — ONE-TIME STAGING-ONLY audit schema installer.
 * Explicitly run by an administrator; never runs automatically.
 * Creates ONLY the missing CountEntryAudit tab, never overwrites existing data.
 */
function installStagingCountEntryAuditSchema() {
  invAssertStagingOnly_();
  const admin=invRequireAdmin_();
  const db=SpreadsheetApp.openById(INV_DB_ID);
  const headers=['AuditID','EntryID','SessionID','Action','OldValue',
    'NewValue','Reason','ChangedBy','ChangedAt'];
  const lock=LockService.getScriptLock();
  if(!lock.tryLock(15000))throw Error('BLOCKED: staging database busy');
  try {
    invAssertStagingOnly_();
    let sheet=db.getSheetByName('CountEntryAudit');
    if(sheet) {
      const actual=sheet.getRange(1,1,1,headers.length).getDisplayValues()[0];
      if(actual.join('|')!==headers.join('|'))
        throw Error('BLOCKED: existing audit tab has unexpected schema');
      console.log(JSON.stringify({phase:'AUDIT_SCHEMA_READY',stagingOnly:true,
        alreadyExists:true,databaseWrites:0}));
      return {ok:true,alreadyExists:true};
    }
    sheet=db.insertSheet('CountEntryAudit');
    sheet.getRange(1,1,1,headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    console.log(JSON.stringify({phase:'AUDIT_SCHEMA_CREATED',stagingOnly:true,
      createdBy:admin.role,tab:'CountEntryAudit',columns:headers.length,
      existingDataOverwritten:false}));
    return {ok:true,created:true};
  }finally{lock.releaseLock();}
}
