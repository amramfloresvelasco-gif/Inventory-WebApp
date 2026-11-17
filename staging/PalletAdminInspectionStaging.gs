/** Stage 68 — STAGING-ONLY read-only administrator inspection of incomplete pallet family.
 * No database mutations, no public RPC, no automatic repair.
 */
function testStagingPartialPalletAdminInspection() {
  invAssertStagingOnly_();
  // Test-only diagnostic: authenticated staging counter may inspect synthetic fixture.
  // Production administrator permission is unchanged; no public RPC is exposed.
  const user=invUser_();
  if(user.email!=='abe.flores@bsbco.com'||user.team!=='A'||!user.teamLocked)
    throw Error('BLOCKED: unexpected staging test identity');
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
