/** STAGING ONLY: controlled first real private pallet writer test.
 * Paste as a NEW .gs file in the isolated staging Apps Script project.
 * Never paste or execute in production. Rerunning the same test is idempotent.
 */
function testStagingPalletWriterFirstSave() {
  invAssertStagingOnly_();
  const parent = 'STAGING-LIVE-PALLET-0001';
  const request = {
    parentSubmissionId: parent,
    sessionId: 'STAGING-SESSION-001',
    locationId: 'STAGING-LOC-001',
    productId: 'STAGING-FG-001',
    pallets: 2,
    casesPerPallet: 10,
    partialCases: 3,
    looseBottles: 2,
    entryMethod: 'Manual',
    notes: 'STAGING ONLY pallet writer test'
  };
  const user = invUser_();
  if (user.email !== 'abe.flores@bsbco.com' || invTeam_(user) !== 'A')
    throw new Error('BLOCKED: unexpected staging counter identity');
  invSession_(request.sessionId);
  const ref = invReference_();
  if (!ref.locations.some(x => String(x.LocationID) === request.locationId) ||
      !ref.products.some(x => String(x.WSItemID) === request.productId))
    throw new Error('BLOCKED: staging references missing');
  const beforeJ = invPalletJournalRows_();
  const beforeC = invRows_('CountEntries');
  const ownJ = beforeJ.filter(x => String(x.ParentSubmissionID) === parent);
  const ownC = beforeC.filter(x => String(x.ParentEntryID) === parent);
  if (beforeJ.length !== ownJ.length || beforeC.length !== ownC.length ||
      ownJ.length > 1 || (ownC.length !== 0 && ownC.length !== 4))
    throw new Error('BLOCKED: unexpected existing staging records; inspect manually');
  console.log(JSON.stringify({phase:'BEFORE',journalRows:beforeJ.length,countRows:beforeC.length}));
  // The first call writes one immutable PREPARED journal and four count children.
  // On a retry it must recognize the original intent and avoid duplicate rows.
  const first = invSavePalletFamilyPrivate_(request);
  console.log(JSON.stringify({phase:'FIRST',result:first}));
  const afterJ = invPalletJournalRows_();
  const afterC = invRows_('CountEntries');
  const children = afterC.filter(x => String(x.ParentEntryID) === parent);
  const expected = invPlanPalletChildren_(request);
  if (afterJ.length !== 1 || afterC.length !== 4 ||
      children.length !== 4 || expected.childCount !== 4 ||
      String(afterJ[0].Status).toUpperCase() !== 'PREPARED' ||
      String(afterJ[0].ParentSubmissionID) !== parent)
    throw new Error('FAILED: unexpected journal or child row counts');
  const byId = new Map(children.map(x => [String(x.EntryID), x]));
  if (byId.size !== 4 || expected.children.some(c => {
    const row = byId.get(c.entryId);
    return !row || String(row.UOM) !== c.uom ||
      Number(row.Quantity) !== c.quantity ||
      String(row.Status).toUpperCase() !== 'ACTIVE';
  })) throw new Error('FAILED: child row mismatch');
  const retry = invSavePalletFamilyPrivate_(request);
  if (!retry.ok || !retry.duplicate ||
      invPalletJournalRows_().length !== 1 ||
      invRows_('CountEntries').length !== 4)
    throw new Error('FAILED: identical retry created duplicates or failed');
  console.log(JSON.stringify({
    phase:'PASS',stagingOnly:true,parentSubmissionId:parent,
    journalRows:1,countRows:4,
    childIds:expected.children.map(c => c.entryId),
    quantities:expected.children.map(c => c.quantity),
    retryDuplicate:true
  }));
}
