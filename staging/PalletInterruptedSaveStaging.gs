/** Staging only: durable journal interruption before child write. */
function testStagingInterruptedPalletSave() {
  invAssertStagingOnly_();
  const request={parentSubmissionId:'STAGING-INTERRUPT-0001',sessionId:'STAGING-SESSION-001',locationId:'STAGING-LOC-001',productId:'STAGING-FG-001',pallets:1,casesPerPallet:7,partialCases:2,looseBottles:1,entryMethod:'Manual',notes:'STAGING interruption test'};
  const user=invUser_();
  if(user.email!=='abe.flores@bsbco.com'||invTeam_(user)!=='A')throw Error('BLOCKED identity');
  invSession_(request.sessionId);
  const ref=invReference_();
  if(!ref.locations.some(x=>String(x.LocationID)===request.locationId)||!ref.products.some(x=>String(x.WSItemID)===request.productId))throw Error('BLOCKED references');
  const beforeJ=invPalletJournalRows_(),beforeC=invRows_('CountEntries'),parent=request.parentSubmissionId;
  if(beforeJ.some(x=>String(x.ParentSubmissionID)===parent)||beforeC.some(x=>String(x.ParentEntryID)===parent||String(x.EntryID).startsWith(parent+'-')))throw Error('BLOCKED parent already used');
  const intent=invPalletIntent_(request,{email:user.email,team:'A'});
  const lock=LockService.getScriptLock();
  if(!lock.tryLock(15000))throw Error('BLOCKED lock busy');
  try {
    invAssertStagingOnly_();
    if(!invPalletJournalPrepare_(intent).prepared)throw Error('FAILED journal prepare');
  }finally{lock.releaseLock();}
  const j=invPalletJournalRows_(),c=invRows_('CountEntries');
  if(j.length!==beforeJ.length+1||c.length!==beforeC.length||j.filter(x=>String(x.ParentSubmissionID)===parent&&String(x.Status)==='PREPARED').length!==1)throw Error('FAILED interruption state');
  console.log(JSON.stringify({phase:'INTERRUPTED_AFTER_JOURNAL',journalDelta:1,countDelta:0}));
  const result=invSavePalletFamilyPrivate_(request);
  if(!result.ok||result.duplicate||result.childCount!==3)throw Error('FAILED recovery');
  const after=invRows_('CountEntries');
  const scope={sessionId:request.sessionId,locationId:request.locationId,productId:request.productId,team:'A',email:user.email,entryMethod:request.entryMethod,notes:request.notes};
  if(after.length!==beforeC.length+3||invClassifyPalletFamily_(intent,after,scope).state!=='COMPLETE'||invPalletJournalRows_().length!==j.length)throw Error('FAILED recovery verification');
  const retry=invSavePalletFamilyPrivate_(request);
  if(!retry.ok||!retry.duplicate||invRows_('CountEntries').length!==after.length||invPalletJournalRows_().length!==j.length)throw Error('FAILED idempotent retry');
  console.log(JSON.stringify({phase:'PASS',stagingOnly:true,interruption:'JOURNAL_ONLY',journalDelta:1,countDelta:3,quantities:[7,2,1],retryDuplicate:true}));
}
