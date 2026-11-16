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
  CountEntries: ['EntryID','SessionID','Team','LocationID','WSItemID','UOM','Quantity','ParentEntryID','PalletMultiplier','EnteredBy','EnteredAt','EntryMethod','Notes','Status'],
  WSSnapshots: ['SnapshotID','SessionID','SnapshotType','UploadedAt','UploadedBy','SourceTimestamp','Version','Status','Notes'],
  WSRows: ['SnapshotID','WSItemID','Warehouse','UOM','Quantity','ItemName','ClassOfMaterial']
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
  if(!uom || uom.length>40) throw new Error('Invalid unit.');
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
    if(cls==='finished good') {
      if(!['Case','Bottle'].includes(uom)) throw new Error('Finished goods use Case or Bottle.');
      if(uom==='Bottle' && !(Number(product.UnitsPerCase)>0))
        throw new Error('Missing units-per-case conversion.');
    } else {
      const configured=String(product.DefaultUOM||'').trim();
      if(!configured) throw new Error('Material UOM has not been verified.');
      if(!['Each','Pounds','Gallons'].includes(configured)) throw new Error('Unsupported raw-material UOM.');\n      if(uom!==configured) throw new Error('Material must be counted in its configured UOM: '+configured);
    }
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
/** Administrator operations: all permissions checked server-side. */
function apiInventoryAdminOverview() {
  invRequireAdmin_();
  return {
    users:invRows_('AppUsers').map(r=>({
      email:String(r.Email),role:String(r.Role),status:String(r.Status),
      team:String(r.AssignedTeam||''),teamLocked:String(r.TeamLocked).toLowerCase()==='true'
    })),
    sessions:invRows_('InventorySessions').map(r=>({
      id:String(r.SessionID),date:r.InventoryDate instanceof Date ?
        Utilities.formatDate(r.InventoryDate,Session.getScriptTimeZone(),'yyyy-MM-dd') : String(r.InventoryDate),
      status:String(r.Status)
    }))
  };
}
function apiInventoryAdminUpsertUser(input) {
  const admin=invRequireAdmin_();
  const email=String(input&&input.email||'').trim().toLowerCase();
  const role=String(input&&input.role||'').trim().toLowerCase();
  const status=String(input&&input.status||'').trim().toLowerCase();
  const team=String(input&&input.team||'').trim().toUpperCase();
  const locked=Boolean(input&&input.teamLocked);
  if(!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) throw new Error('Invalid email.');
  if(!['administrator','counter'].includes(role)) throw new Error('Invalid role.');
  if(!['active','inactive'].includes(status)) throw new Error('Invalid status.');
  if(team && !['A','B'].includes(team)) throw new Error('Invalid team.');
  if(locked && !team) throw new Error('Assign a team before locking it.');
  if(email===admin.email && (role!=='administrator'||status!=='active'))
    throw new Error('Cannot revoke your own administrator access.');
  const lock=LockService.getScriptLock();
  if(!lock.tryLock(15000)) throw new Error('Busy; retry.');
  try {
    const s=invSheet_('AppUsers'), rows=invRows_('AppUsers');
    const matches=rows.map((r,i)=>({r,i})).filter(x=>String(x.r.Email).trim().toLowerCase()===email);
    if(matches.length>1) throw new Error('Duplicate user records need review.');
    const target=matches.length?matches[0].i+2:s.getLastRow()+1;
    s.getRange(target,1,1,7).setValues([[email,role==='administrator'?'Administrator':'Counter',
      status==='active'?'Active':'Inactive',team,locked,new Date(),admin.email]]);
    return {ok:true,email};
  } finally {lock.releaseLock();}
}
function apiInventoryAdminCreateSession(input) {
  const admin=invRequireAdmin_();
  const date=String(input&&input.date||'');
  if(!/^\\d{4}-\\d{2}-\\d{2}$/.test(date) ||
     isNaN(new Date(date+'T12:00:00Z').getTime()) ||
     new Date(date+'T12:00:00Z').toISOString().slice(0,10)!==date)
    throw new Error('Invalid inventory date.');
  const lock=LockService.getScriptLock();
  if(!lock.tryLock(15000)) throw new Error('Busy; retry.');
  try {
    if(invRows_('InventorySessions').some(r=>String(r.Status).toUpperCase()==='OPEN'))
      throw new Error('Close or freeze the existing open session before starting another.');
    const id='INV-'+date+'-'+Utilities.getUuid().slice(0,8).toUpperCase();
    const s=invSheet_('InventorySessions');
    s.getRange(s.getLastRow()+1,1,1,10).setValues([[id,date,'OPEN',new Date(),admin.email,
      '','','','','']]);
    return {ok:true,id};
  } finally {lock.releaseLock();}
}
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('BMD Inventory');
}
