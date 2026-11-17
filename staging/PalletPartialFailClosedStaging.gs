/** Stage 67: STAGING ONLY. One-time partial child write; verifies retry fails closed.
 * Intentionally leaves one PREPARED journal + one child for admin review.
 */
function testStagingPartialPalletFailClosed() {
  invAssertStagingOnly_();
  const request={parentSubmissionId:'STAGING-PARTIAL-0001',
    sessionId:'STAGING-SESSION-001',locationId:'STAGING-LOC-001',
    productId:'STAGING-FG-001',pallets:2,casesPerPallet:8,
    partialCases:3,looseBottles:1,entryMethod:'Manual',
    notes:'STAGING ONLY partial family failure test'};
  const user=invUser_();
  if(user.email!=='abe.flores@bsbco.com'||invTeam_(user)!=='A')
    throw Error('BLOCKED: unexpected staging identity');
  invSession_(request.sessionId);
  const ref=invReference_();
  if(!ref.locations.some(x=>String(x.LocationID)===request.locationId)||
     !ref.products.some(x=>String(x.WSItemID)===request.productId))
    throw Error('BLOCKED: staging reference missing');
  const parent=request.parentSubmissionId;
  const beforeJ=invPalletJournalRows_(),beforeC=invRows_('CountEntries');
  if(beforeJ.some(x=>String(x.ParentSubmissionID)===parent)||
     beforeC.some(x=>String(x.ParentEntryID)===parent||
       String(x.EntryID).startsWith(parent+'-')))
    throw Error('BLOCKED: parent already used; no writes made');
  const intent=invPalletIntent_(request,{email:user.email,team:'A'});
  const child=intent.children[0],lock=LockService.getScriptLock();
  if(!lock.tryLock(15000))throw Error('BLOCKED: staging lock busy');
  try {
    invAssertStagingOnly_();
    if(!invPalletJournalPrepare_(intent).prepared)
      throw Error('FAILED: journal prepare');
    const sheet=invSheet_('CountEntries');
    sheet.getRange(sheet.getLastRow()+1,1,1,14).setValues([[
      child.entryId,request.sessionId,'A',request.locationId,request.productId,
      child.uom,child.quantity,parent,1,user.email,new Date(),
      request.entryMethod,request.notes,'ACTIVE'
    ]]);
  }finally{lock.releaseLock();}
  const afterJ=invPalletJournalRows_(),afterC=invRows_('CountEntries');
  const scope={sessionId:request.sessionId,locationId:request.locationId,
    productId:request.productId,team:'A',email:user.email,
    entryMethod:request.entryMethod,notes:request.notes};
  if(afterJ.length!==beforeJ.length+1||afterC.length!==beforeC.length+1||
     afterJ.filter(x=>String(x.ParentSubmissionID)===parent&&
       String(x.Status)==='PREPARED').length!==1||
     invClassifyPalletFamily_(intent,afterC,scope).state!=='PARTIAL')
    throw Error('FAILED: partial setup inconsistent; inspect staging');
  console.log(JSON.stringify({phase:'PARTIAL_CREATED',journalDelta:1,
    countDelta:1,expectedChildren:intent.children.length}));
  let error='';
  try {invSavePalletFamilyPrivate_(request);}
  catch(e){error=String(e&&e.message||e);}
  if(!error.includes('Pallet family PARTIAL')||
     !error.includes('Contact administrator'))
    throw Error('FAILED: retry did not fail closed; response='+error);
  const finalJ=invPalletJournalRows_(),finalC=invRows_('CountEntries');
  if(finalJ.length!==afterJ.length||finalC.length!==afterC.length||
     invClassifyPalletFamily_(intent,finalC,scope).state!=='PARTIAL')
    throw Error('FAILED: retry mutated partial family; inspect staging');
  console.log(JSON.stringify({phase:'PASS',stagingOnly:true,
    retryBlocked:true,reason:'PARTIAL',journalDelta:1,countDelta:1,
    additionalWritesOnRetry:0,adminReviewRequired:true}));
}
