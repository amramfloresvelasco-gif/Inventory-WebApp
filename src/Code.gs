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
  WSRows: ['SnapshotID','WSItemID','Warehouse','UOM','Quantity','ItemName','ClassOfMaterial'],
  LocationStatus: ['SessionID','LocationID','TeamAStarted','TeamBStarted','Status','MismatchCount','LastUpdatedAt'],
  CountEntryAudit: ['AuditID','EntryID','SessionID','Action','OldValue','NewValue','Reason','ChangedBy','ChangedAt']
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
/** Authorized counters select and lock their own team; no administrator assignment needed.
 * Existing team entries remain attributed to the team saved on each row.
 */
function apiInventorySelectTeam(input) {
  const user=invUser_();
  const requested=String(input&&input.team||'').trim().toUpperCase();
  const unlock=input&&input.unlock===true;
  if((unlock&&requested)||(!unlock&&!requested))throw new Error('Choose a team to lock or request unlock.');
  if(requested&&!['A','B'].includes(requested))throw new Error('Invalid team.');
  const lock=LockService.getScriptLock();
  if(!lock.tryLock(15000))throw new Error('Inventory busy; retry.');
  try {
    const sheet=invSheet_('AppUsers'),rows=invRows_('AppUsers');
    const hits=rows.map((r,i)=>({r,i})).filter(x=>
      String(x.r.Email).trim().toLowerCase()===user.email);
    if(hits.length!==1||String(hits[0].r.Status).trim().toLowerCase()!=='active')
      throw new Error('Active user record required.');
    const current=hits[0].r;
    const isLocked=current.TeamLocked===true||
      String(current.TeamLocked).toLowerCase()==='true';
    if(unlock){
      if(!isLocked)throw new Error('Team already unlocked.');
      sheet.getRange(hits[0].i+2,5).setValue(false);
      return {ok:true,team:String(current.AssignedTeam||'').toUpperCase(),teamLocked:false};
    }
    if(isLocked)throw new Error('Unlock your current team before selecting another.');
    sheet.getRange(hits[0].i+2,4,1,2).setValues([[requested,true]]);
    return {ok:true,team:requested,teamLocked:true};
  }finally{lock.releaseLock();}
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
  const rawQuantity=request.quantity;
  // Reject coercions such as whitespace, booleans, arrays and exponential strings.
  if(typeof rawQuantity!=='number' &&
     (typeof rawQuantity!=='string'||!/^[0-9]+$/.test(rawQuantity.trim())))
    throw new Error('Quantity must be a nonnegative integer.');
  if(typeof rawQuantity==='string' && !rawQuantity.trim())
    throw new Error('Quantity is required.');
  const quantity=Number(rawQuantity);
  const entryMethod=String(request.entryMethod||'Manual').trim();
  if(!['Manual','Barcode','QR'].includes(entryMethod))
    throw new Error('Invalid count entry method. Use the EMPTY action to declare an empty location.');
  if(request.quantity===''||request.quantity===null||request.quantity===undefined)
    throw new Error('Quantity is required.');
  if(!/^[a-zA-Z0-9_-]{12,100}$/.test(entryId)) throw new Error('Invalid submission ID.');
  if(!Number.isSafeInteger(quantity) || quantity<0) throw new Error('Quantity must be a nonnegative integer.');
  if(!uom || uom.length>40) throw new Error('Invalid unit.');
  if(!sessionId || !locationId || !productId) throw new Error('Missing required field.');
  const lock=LockService.getScriptLock();
  if(!lock.tryLock(15000)) throw new Error('Inventory busy; retry the same submission.');
  try {
    invSession_(sessionId);
    const ref=invReference_();
    const locations=ref.locations.filter(x=>String(x.LocationID)===locationId);
    const products=ref.products.filter(x=>String(x.WSItemID)===productId);
    if(locations.length!==1 || products.length!==1)
      throw new Error('Location or product missing or duplicated in active reference data.');
    const product=products[0];
    const cls=String(product.ClassOfMaterial).toLowerCase();
    if(cls==='finished good') {
      if(!['Case','Bottle'].includes(uom)) throw new Error('Finished goods use Case or Bottle.');
      const perCase=Number(product.UnitsPerCase);
      if(product.UnitsPerCase===''||product.UnitsPerCase===null||
         !Number.isSafeInteger(perCase)||perCase<=0)
        throw new Error('Missing or invalid units-per-case conversion.');
    } else {
      const configured=String(product.DefaultUOM||'').trim();
      if(!configured) throw new Error('Material UOM has not been verified.');
      if(!['Each','Pounds','Gallons'].includes(configured)) throw new Error('Unsupported raw-material UOM.');
      if(uom!==configured) throw new Error('Material must be counted in its configured UOM: '+configured);
    }
    const sheet=invSheet_('CountEntries'), last=sheet.getLastRow();
    const existingEntries=invRows_('CountEntries');
    const existingId=existingEntries.find(x=>String(x.EntryID)===entryId);
    if(existingId){
      if(String(existingId.SessionID)!==sessionId||String(existingId.LocationID)!==locationId||
         String(existingId.Team).toUpperCase()!==team||
         String(existingId.WSItemID)!==productId||String(existingId.UOM)!==uom||
         Number(existingId.Quantity)!==quantity||
         String(existingId.EnteredBy).trim().toLowerCase()!==user.email||
         String(existingId.EntryMethod)!==entryMethod)
        throw new Error('Submission ID already used for another count.');
      if(String(existingId.Status).toUpperCase()!=='ACTIVE')
        throw new Error('Submission was removed; use a new submission ID for a new count.');
      return {ok:true,entryId,duplicate:true};
    }
    if(existingEntries.some(x=>String(x.SessionID)===sessionId&&
      String(x.LocationID)===locationId&&String(x.Team).toUpperCase()===team&&
      String(x.Status).toUpperCase()==='ACTIVE'&&
      String(x.EntryMethod).toUpperCase()==='EMPTY'))
      throw new Error('Location marked EMPTY by your team; remove EMPTY before counting items.');
    const row=[entryId,sessionId,team,locationId,productId,uom,quantity,'',1,
      user.email,new Date(),entryMethod,
      String(request.notes||'').slice(0,500),'ACTIVE'];
    sheet.getRange(last+1,1,1,row.length).setValues([row]);
    return {ok:true,entryId,duplicate:false,elapsedMs:Date.now()-started};
  } finally { lock.releaseLock(); }
}
/** A team may mark a location EMPTY only when it has no active item entries there. */
function apiInventoryMarkEmpty(request) {
  const started=Date.now(),user=invUser_(),team=invTeam_(user);
  const sessionId=String(request&&request.sessionId||'').trim();
  const locationId=String(request&&request.locationId||'').trim();
  const entryId=String(request&&request.entryId||'').trim();
  if(!/^[a-zA-Z0-9_-]{12,100}$/.test(entryId))throw new Error('Invalid submission ID.');
  const lock=LockService.getScriptLock();
  if(!lock.tryLock(15000))throw new Error('Inventory busy; retry.');
  try {
    invSession_(sessionId);
    if(invReference_().locations.filter(x=>String(x.LocationID)===locationId).length!==1)
      throw new Error('Location missing or duplicated in active reference data.');
    const entries=invRows_('CountEntries');
    const existing=entries.find(x=>String(x.EntryID)===entryId);
    if(existing) {
      if(String(existing.SessionID)!==sessionId||String(existing.LocationID)!==locationId||
         String(existing.Team)!==team||String(existing.EntryMethod).toUpperCase()!=='EMPTY'||
         String(existing.EnteredBy).toLowerCase()!==user.email)
        throw new Error('Submission ID already used for another entry.');
      if(String(existing.Status).toUpperCase()!=='ACTIVE')
        throw new Error('EMPTY submission was removed; use a new submission ID.');
      return {ok:true,entryId,duplicate:true};
    }
    const own=entries.filter(x=>String(x.SessionID)===sessionId&&
      String(x.LocationID)===locationId&&String(x.Team).toUpperCase()===team&&
      String(x.Status).toUpperCase()==='ACTIVE');
    if(entries.some(x=>String(x.SessionID)===sessionId&&
      String(x.LocationID)===locationId&&String(x.Team).toUpperCase()===team&&
      String(x.Status).toUpperCase()==='ACTIVE'&&
      String(x.EntryMethod).toUpperCase()!=='EMPTY'))
      throw new Error('This team has item counts here; remove those before marking EMPTY.');
    if(own.some(x=>String(x.EntryMethod).toUpperCase()==='EMPTY'))
      return {ok:true,entryId:String(own[0].EntryID),alreadyEmpty:true};
    const sheet=invSheet_('CountEntries');
    sheet.getRange(sheet.getLastRow()+1,1,1,14).setValues([[
      entryId,sessionId,team,locationId,'','',0,'',1,user.email,new Date(),
      'EMPTY','','ACTIVE'
    ]]);
    return {ok:true,entryId,elapsedMs:Date.now()-started};
  }finally{lock.releaseLock();}
}
/** Read own entries only; administrators may review every entry. */
function apiInventoryMyEntries(request) {
  const user=invUser_(),sessionId=String(request&&request.sessionId||'').trim();
  const locationId=String(request&&request.locationId||'').trim();
  if(!sessionId||!locationId)throw new Error('Session and location required.');
  invSession_(sessionId);
  const rows=invRows_('CountEntries').filter(r=>
    String(r.SessionID)===sessionId&&String(r.LocationID)===locationId&&
    String(r.Status).toUpperCase()==='ACTIVE'&&
    (user.role==='administrator'||String(r.EnteredBy).trim().toLowerCase()===user.email));
  return rows.map(r=>({entryId:String(r.EntryID),team:String(r.Team),
    itemId:String(r.WSItemID),uom:String(r.UOM),quantity:Number(r.Quantity),
    method:String(r.EntryMethod),enteredBy:String(r.EnteredBy)}));
}
/** Soft delete an entry with audit, never another counter's entry. */
function apiInventoryDeleteEntry(request) {
  const user=invUser_(),sessionId=String(request&&request.sessionId||'').trim();
  const entryId=String(request&&request.entryId||'').trim();
  const reason=String(request&&request.reason||'Correction').trim().slice(0,200);
  if(!sessionId||!entryId)throw new Error('Session and entry required.');
  const lock=LockService.getScriptLock();
  if(!lock.tryLock(15000))throw new Error('Inventory busy; retry.');
  try {
    invSession_(sessionId);
    const rows=invRows_('CountEntries');
    const hits=rows.map((r,i)=>({r,i})).filter(x=>String(x.r.EntryID)===entryId);
    if(hits.length!==1||String(hits[0].r.SessionID)!==sessionId)
      throw new Error('Entry not found.');
    const hit=hits[0],r=hit.r;
    if(user.role!=='administrator'&&String(r.EnteredBy).trim().toLowerCase()!==user.email)
      throw new Error('You can only remove your own entries.');
    if(String(r.Status).toUpperCase()==='DELETED')return {ok:true,alreadyDeleted:true};
    if(String(r.Status).toUpperCase()!=='ACTIVE')throw new Error('Entry is not active.');
    const audit=invSheet_('CountEntryAudit');
    audit.getRange(audit.getLastRow()+1,1,9).setValues([[
      'AUD-'+Utilities.getUuid(),entryId,sessionId,'DELETE',
      JSON.stringify({status:'ACTIVE',itemId:String(r.WSItemID),quantity:r.Quantity,
        locationId:String(r.LocationID),team:String(r.Team),method:String(r.EntryMethod)}),
      JSON.stringify({status:'DELETED'}),reason,user.email,new Date()
    ]]);
    invSheet_('CountEntries').getRange(hit.i+2,14).setValue('DELETED');
    return {ok:true,entryId};
  }finally{lock.releaseLock();}
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
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Invalid email.');
  if(!['administrator','counter'].includes(role)) throw new Error('Invalid role.');
  if(!['active','inactive'].includes(status)) throw new Error('Invalid status.');
  if(email===admin.email && (role!=='administrator'||status!=='active'))
    throw new Error('Cannot revoke your own administrator access.');
  const lock=LockService.getScriptLock();
  if(!lock.tryLock(15000)) throw new Error('Busy; retry.');
  try {
    const s=invSheet_('AppUsers'), rows=invRows_('AppUsers');
    const matches=rows.map((r,i)=>({r,i})).filter(x=>String(x.r.Email).trim().toLowerCase()===email);
    if(matches.length>1) throw new Error('Duplicate user records need review.');
    const target=matches.length?matches[0].i+2:s.getLastRow()+1;
    const existing=matches.length?matches[0].r:null;
    const preservedTeam=existing?String(existing.AssignedTeam||''):'';
    const preservedLock=existing?(existing.TeamLocked===true||
      String(existing.TeamLocked).toLowerCase()==='true'):false;
    s.getRange(target,1,1,7).setValues([[email,role==='administrator'?'Administrator':'Counter',
      status==='active'?'Active':'Inactive',preservedTeam,preservedLock,new Date(),admin.email]]);
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
