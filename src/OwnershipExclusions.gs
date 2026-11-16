/** Extended Report 2 ONLY. Never apply these tokens to physical counting or Report 1. */
const INV_OWNERSHIP_DEFAULT_TOKENS=['JYP','OTS','Dios','SCG'];
const INV_OWNERSHIP_HEADERS=['Token','Active','UpdatedAt','UpdatedBy'];
function invOwnershipTokensFromRows_(rows) {
  if(!Array.isArray(rows))throw new Error('Invalid ownership exclusion rows.');
  const seen=new Set(), tokens=[];
  for(const r of rows) {
    const token=String(r.Token||'').trim().toUpperCase();
    if(!/^[A-Z0-9]{2,32}$/.test(token))throw new Error('Invalid ownership token.');
    if(seen.has(token))throw new Error('Duplicate ownership token: '+token);
    seen.add(token);
    if(r.Active===true||String(r.Active).toLowerCase()==='true')tokens.push(token);
  }
  return tokens;
}
function invOwnershipConfig_() {
  const sheet=SpreadsheetApp.openById(INV_DB_ID).getSheetByName('OwnershipExclusions');
  if(!sheet)return {configured:false,tokens:INV_OWNERSHIP_DEFAULT_TOKENS.slice()};
  const headers=sheet.getRange(1,1,1,4).getDisplayValues()[0];
  if(headers.join('|')!==INV_OWNERSHIP_HEADERS.join('|'))
    throw new Error('Unexpected OwnershipExclusions schema.');
  const count=sheet.getLastRow()-1;
  const rows=count>0?sheet.getRange(2,1,count,4).getValues().map(x=>({Token:x[0],Active:x[1]})):[];
  return {configured:true,tokens:invOwnershipTokensFromRows_(rows)};
}
/** Read-only preview; admin may review table before a separate controlled migration. */
function apiInventoryAdminOwnershipExclusions() {
  invRequireAdmin_();
  return invOwnershipConfig_();
}
