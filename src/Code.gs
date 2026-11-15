/** BMD Inventory — isolated Google Apps Script backend, phase 1.
 * Deploy as a standalone Apps Script web app with an authenticated Workspace
 * identity; never deploy with anonymous access.
 */
const INV_DB_ID = '12teaGz7z2Ems-Elqz5vHv1Z8S5aV4kJMJrnBxlMYQ5Y';
const INV_HEADERS = {
  AppUsers: ['Email','Role','Status','AssignedTeam','TeamLocked','UpdatedAt','UpdatedBy'],
  InventorySessions: ['SessionID','InventoryDate','Status','CreatedAt','CreatedBy','FrozenAt','FrozenBy','OriginalWSSnapshotID','UpdatedWSSnapshotID','Notes'],
  Locations: ['LocationID','Warehouse','Bay','LocationType','Active','SortOrder'],
  ProductIndex: ['WSItemID','ItemName','ClassOfMaterial','Barcode','UnitsPerCase','DefaultUOM','Source','SourceUpdatedAt','Active'],
  CountEntries: ['EntryID','SessionID','Team','LocationID','WSItemID','UOM','Quantity','ParentEntryID','PalletMultiplier','EnteredBy','EnteredAt','EntryMethod','Notes','Status']
};
function invSheet_(name) {
  const s = SpreadsheetApp.openById(INV_DB_ID).getSheetByName(name);
  if (!s) throw new Error('Missing database tab: ' + name);
  return s;
}
function invRows_(name) {
  const sheet = invSheet_(name), last = sheet.getLastRow();
  if (last < 2) return [];
  const headers = INV_HEADERS[name];
  const actual = sheet.getRange(1,1,1,headers.length).getDisplayValues()[0];
  if (actual.join('|') !== headers.join('|')) throw new Error('Unexpected schema: ' + name);
  return sheet.getRange(2,1,last-1,headers.length).getValues().map(row =>
    Object.fromEntries(headers.map((key,i) => [key,row[i]])));
}
function invEmail_() {
  const email = String(Session.getActiveUser().getEmail() || '').trim().toLowerCase();
  if (!email) throw new Error('Workspace identity unavailable. Sign in with an authorized account.');
  return email;
}
function invUser_() {
  const email = invEmail_();
  const users = invRows_('AppUsers').filter(r => String(r.Email).trim().toLowerCase() === email);
  if (users.length !== 1 || String(users[0].Status).trim().toLowerCase() !== 'active')
    throw new Error('Your Inventory account is not active or is not configured.');
  const role = String(users[0].Role).trim().toLowerCase();
  if (!['administrator','counter'].includes(role)) throw new Error('Invalid Inventory role.');
  return {email, role, team:String(users[0].AssignedTeam).trim().toUpperCase(),
    teamLocked:String(users[0].TeamLocked).toLowerCase() === 'true'};
}
function invRequireAdmin_() {
  const u=invUser_();
  if (u.role !== 'administrator') throw new Error('Administrator permission required.');
  return u;
}
function invTeam_(user) {
  if (!['A','B'].includes(user.team)) throw new Error('Team assignment is required.');
  if (!user.teamLocked) throw new Error('Team must be locked by an administrator before counting.');
  return user.team;
}
function invSession_(sessionId) {
  const matches=invRows_('InventorySessions').filter(r=>String(r.SessionID)===String(sessionId));
  if (matches.length!==1) throw new Error('Inventory session not found.');
  if (String(matches[0].Status).toUpperCase()!=='OPEN') throw new Error('Inventory session is not open.');
  return matches[0];
}
function invReference_() {
  const cache=CacheService.getScriptCache(), key='inv_reference_v1';
  const hit=cache.get(key);
  if(hit) return JSON.parse(hit);
  const locations=invRows_('Locations').filter(r=>String(r.Active).toLowerCase()==='true');
  const products=invRows_('ProductIndex').filter(r=>String(r.Active).toLowerCase()==='true');
  const value={locations,products};
  const json=JSON.stringify(value);
  if(json.length<90000) cache.put(key,json,300);
  return value;
}
function apiInventoryBootstrap() {
  const u=invUser_();
  const ref=invReference_();
  const sessions=invRows_('InventorySessions')
    .filter(r=>String(r.Status).toUpperCase()==='OPEN')
    .map(r=>({id:String(r.SessionID),date:String(r.InventoryDate)}));
  return {user:{role:u.role,team:u.team,teamLocked:u.teamLocked},locations:ref.locations,
    products:ref.products.map(p=>({id:String(p.WSItemID),name:String(p.ItemName),
      barcode:String(p.Barcode||''),uom:String(p.DefaultUOM||''),
      unitsPerCase:Number(p.UnitsPerCase)||0,className:String(p.ClassOfMaterial||'')})),
    sessions};
}
function apiInventorySaveCount(request) {
  const started=Date.now(), user=invUser_(), team=invTeam_(user);
  if(!request || typeof request!=='object') throw new Error('Missing count.');
  const sessionId=String(request.sessionId||'').trim();
  const locationId=String(request.locationId||'').trim();
  const productId=String(request.productId||'').trim();
  const uom=String(request.uom||'').trim();
  const entryId=String(request.entryId||'').trim();
  const quantity=Number(request.quantity);
  if(!/^[a-zA-Z0-9_-]{12,100}$/.test(entryId)) throw new Error('Invalid submission ID.');
  if(!Number.isSafeInteger(quantity) || quantity<0) throw new Error('Quantity must be a nonnegative integer.');
  if(!['Case','Bottle','Each'].includes(uom)) throw new Error('Unsupported unit.');
  if(!sessionId || !locationId || !productId) throw new Error('Missing required field.');
  const lock=LockService.getScriptLock();
  if(!lock.tryLock(15000)) throw new Error('Inventory busy; retry the same submission.');
  try {
    invSession_(sessionId);
    const ref=invReference_();
    const loc=ref.locations.find(x=>String(x.LocationID)===locationId);
    const product=ref.products.find(x=>String(x.WSItemID)===productId);
    if(!loc || !product) throw new Error('Invalid location or product.');
    const cls=String(product.ClassOfMaterial).toLowerCase();
    if(uom==='Bottle' && cls!=='finished good') throw new Error('Bottle unit only allowed for finished goods.');
    if(uom==='Case' && cls==='packaging') throw new Error('Packaging must use Each.');
    if(uom==='Each' && cls==='finished good') throw new Error('Finished goods use Case or Bottle.');
    const sheet=invSheet_('CountEntries'), last=sheet.getLastRow();
    // Phase 1 correctness-first duplicate check; replace with indexed ID store after benchmark.
    if(last>1) {
      const ids=sheet.getRange(2,1,last-1,1).getDisplayValues();
      if(ids.some(row=>row[0]===entryId)) return {ok:true,entryId,duplicate:true};
    }
    const row=[entryId,sessionId,team,locationId,productId,uom,quantity,'',1,
      user.email,new Date(),String(request.entryMethod||'Manual').slice(0,32),
      String(request.notes||'').slice(0,500),'ACTIVE'];
    sheet.getRange(last+1,1,1,row.length).setValues([row]);
    return {ok:true,entryId,duplicate:false,elapsedMs:Date.now()-started};
  } finally { lock.releaseLock(); }
}
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('BMD Inventory');
}
