/** Administrator-only, read-only PalletSubmissionJournal schema preflight.
 * Never creates sheets, changes headers, or enables pallet submissions.
 */
function apiInventoryPalletJournalPreflight() {
  invRequireAdmin_();
  const spreadsheet=SpreadsheetApp.openById(INV_DB_ID);
  const sheet=spreadsheet.getSheetByName('PalletSubmissionJournal');
  if(!sheet) return invPalletJournalProvisioningDecision_(false,null,0);
  const expectedWidth=6;
  const lastRow=sheet.getLastRow();
  const lastColumn=sheet.getLastColumn();
  // Do not treat extra populated columns as an acceptable journal schema.
  const headers=lastRow>=1&&lastColumn===expectedWidth
    ?sheet.getRange(1,1,1,expectedWidth).getDisplayValues()[0]:[];
  const result=invPalletJournalProvisioningDecision_(true,headers,
    lastRow>=1?lastRow-1:0);
  return {...result,lastRow,lastColumn};
}
