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
function invOwnershipRevision_(rows) {
  return JSON.stringify(rows.map(r=>[
    String(r.Token||'').trim().toUpperCase(),
    r.Active===true||String(r.Active).toLowerCase()==='true',
    String(r.UpdatedAt instanceof Date?r.UpdatedAt.toISOString():r.UpdatedAt||''),
    String(r.UpdatedBy||'').trim().toLowerCase()
  ]));
}
function invOwnershipWireRows_(rows) {
  return rows.map(r=>({Token:String(r.Token||''),Active:r.Active===true||String(r.Active).toLowerCase()==='true',UpdatedAt:r.UpdatedAt instanceof Date?r.UpdatedAt.toISOString():String(r.UpdatedAt||''),UpdatedBy:String(r.UpdatedBy||'')}));
}
function invOwnershipConfig_() {
  const sheet=SpreadsheetApp.openById(INV_DB_ID).getSheetByName('OwnershipExclusions');
  if(!sheet)return {configured:false,tokens:INV_OWNERSHIP_DEFAULT_TOKENS.slice(),rows:[],revision:null};
  const headers=sheet.getRange(1,1,1,4).getDisplayValues()[0];
  if(headers.join('|')!==INV_OWNERSHIP_HEADERS.join('|'))
    throw new Error('Unexpected OwnershipExclusions schema.');
  const count=sheet.getLastRow()-1;
  const rows=count>0?sheet.getRange(2,1,count,4).getValues().map(x=>({Token:x[0],Active:x[1],UpdatedAt:x[2],UpdatedBy:x[3]})):[];
  return {configured:true,tokens:invOwnershipTokensFromRows_(rows),rows:invOwnershipWireRows_(rows),revision:invOwnershipRevision_(rows)};
}
/** Read-only preview; admin may review table before a separate controlled migration. */
function apiInventoryAdminOwnershipExclusions() {
  invRequireAdmin_();
  return invOwnershipConfig_();
}

/** Explicit admin setup only; never creates a table during ordinary report reads. */
function apiInventoryAdminInitializeOwnershipExclusions(input) {
  const admin=invRequireAdmin_();
  if(!input||input.confirm!=='CREATE_OWNERSHIP_EXCLUSIONS')
    throw new Error('Explicit setup confirmation required.');
  const lock=LockService.getScriptLock();
  if(!lock.tryLock(15000))throw new Error('Inventory busy; retry.');
  try {
    const db=SpreadsheetApp.openById(INV_DB_ID);
    if(db.getSheetByName('OwnershipExclusions'))
      throw new Error('OwnershipExclusions already exists; setup will not overwrite it.');
    const sheet=db.insertSheet('OwnershipExclusions');
    sheet.getRange(1,1,1,4).setValues([INV_OWNERSHIP_HEADERS]);
    sheet.getRange(2,1,INV_OWNERSHIP_DEFAULT_TOKENS.length,4).setValues(
      INV_OWNERSHIP_DEFAULT_TOKENS.map(token=>[token,true,new Date(),admin.email]));
    return {ok:true,created:true,rows:INV_OWNERSHIP_DEFAULT_TOKENS.length};
  } finally {lock.releaseLock();}
}
/** Guarded configuration replacement; Sheets writes are not transactional. */
function apiInventoryAdminSaveOwnershipExclusions(input) {
  const admin=invRequireAdmin_();
  if(!input||!Array.isArray(input.rows)||input.rows.length>100)
    throw new Error('Provide up to 100 ownership exclusion rows.');
  const rows=input.rows.map(r=>({
    Token:String(r.Token||'').trim().toUpperCase(),
    Active:r.Active===true||String(r.Active).toLowerCase()==='true'
  }));
  invOwnershipTokensFromRows_(rows);
  if(typeof input.expectedRevision!=='string')throw new Error('Expected configuration revision required.');
  const lock=LockService.getScriptLock();
  if(!lock.tryLock(15000))throw new Error('Inventory busy; retry.');
  try {
    const db=SpreadsheetApp.openById(INV_DB_ID);
    const sheet=db.getSheetByName('OwnershipExclusions');
    if(!sheet)throw new Error('Initialize OwnershipExclusions first.');
    const headers=sheet.getRange(1,1,1,4).getDisplayValues()[0];
    if(headers.join('|')!==INV_OWNERSHIP_HEADERS.join('|'))
      throw new Error('Unexpected OwnershipExclusions schema.');
    const existing=sheet.getLastRow()-1;
    // Compare all rows, including inactive tokens and audit columns.
    const current=invOwnershipConfig_().revision;
    if(input.expectedRevision!==current)
      throw new Error('Ownership exclusions changed; refresh before saving.');
    if(rows.length)sheet.getRange(2,1,rows.length,4).setValues(
      rows.map(r=>[r.Token,r.Active,new Date(),admin.email]));
    if(existing>rows.length)sheet.deleteRows(rows.length+2,existing-rows.length);
    return {ok:true,configured:true,tokens:invOwnershipTokensFromRows_(rows)};
  } finally {lock.releaseLock();}
}
