/** STAGING ONLY. Not for production deployment. Source snapshot for isolated testing. */
const INV_DB_ID = '1EaaGTFahbAdS3QqywFh4yeuXntCjL8ik1kZcQvqq2zo';
const INV_STAGING_SCRIPT_ID = '1M_H1tAwaHvUB-B7q4ahoQ702rF29m7uPx4XjwbHQWdzMCv4pXfdkc2NP';
function invAssertStagingOnly_() {
  if (INV_DB_ID !== '1EaaGTFahbAdS3QqywFh4yeuXntCjL8ik1kZcQvqq2zo' ||
      ScriptApp.getScriptId() !== INV_STAGING_SCRIPT_ID)
    throw new Error('BLOCKED: not the authorized isolated staging project');
}
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
  invAssertStagingOnly_();
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
function invTeam_(user) {
  if (!['A','B'].includes(user.team)) throw new Error('Team assignment is required.');
  if (!user.teamLocked) throw new Error('Lock your selected team before counting.');
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


// === SOURCE: src/PalletChildPlanner.gs ===
/** Pure finished-goods pallet expansion; never writes Sheets.
 * One child per full pallet, one optional partial case child, one loose-bottle child.
 * Parent is metadata only, not a counted row.
 */
function invPlanPalletChildren_(input) {
  if(!input||typeof input!=='object')throw new Error('Pallet details required.');
  const parent=String(input.parentSubmissionId||'').trim();
  if(!/^[A-Za-z0-9_-]{12,90}$/.test(parent))
    throw new Error('Invalid parent submission ID.');
  const numeric=(value,name)=>{
    if(typeof value!=='number'||!Number.isSafeInteger(value)||value<0)
      throw new Error(name+' must be a nonnegative whole number.');
    return value;
  };
  const pallets=numeric(input.pallets===undefined?1:input.pallets,'Pallet multiplier');
  const cases=numeric(input.casesPerPallet,'Cases per pallet');
  const partial=numeric(input.partialCases===undefined?0:input.partialCases,'Partial cases');
  const bottles=numeric(input.looseBottles===undefined?0:input.looseBottles,'Loose bottles');
  if(pallets>100||pallets+(partial>0?1:0)+(bottles>0?1:0)>102)
    throw new Error('Too many child records in one submission.');
  if(pallets>0&&cases===0)throw new Error('Cases per pallet required.');
  if(pallets===0&&cases!==0)throw new Error('Cases without a pallet multiplier.');
  if(pallets===0&&partial===0&&bottles===0)
    throw new Error('At least one counted quantity required.');
  if(!Number.isSafeInteger(pallets*cases+partial))
    throw new Error('Case total exceeds safe integer range.');
  const children=[];
  const suffix=index=>{
    let n=index+1,out='';
    do{n--;out=String.fromCharCode(65+n%26)+out;n=Math.floor(n/26);}while(n);
    return out;
  };
  function add(quantity,uom,kind){
    const index=children.length;
    children.push({entryId:parent+'-'+suffix(index),parentSubmissionId:parent,
      quantity,uom,kind,palletMultiplier:1});
  }
  for(let i=0;i<pallets;i++)add(cases,'Case','full-pallet');
  if(partial>0)add(partial,'Case','partial-pallet');
  if(bottles>0)add(bottles,'Bottle','loose-bottles');
  return {parentSubmissionId:parent,children,childCount:children.length,
    totalCases:pallets*cases+partial,totalLooseBottles:bottles,
    readOnly:true};
}


// === SOURCE: src/PalletFamilyRecovery.gs ===
/** Pure recovery classification for a multi-row pallet submission.
 * No Sheets writes. Caller must hold script lock while inspecting/recovering.
 */
function invClassifyPalletFamily_(expected,existing,scope) {
  if(!expected||!Array.isArray(expected.children)||!expected.children.length||
     !Array.isArray(existing))throw new Error('Expected family and existing rows required.');
  const parent=String(expected.parentSubmissionId||'');
  const ids=new Set(),issues=[],missing=[],matched=[];
  const equal=(row,child)=>
    String(row.EntryID)===child.entryId&&
    String(row.ParentEntryID)===parent&&
    String(row.UOM)===child.uom&&
    Number(row.Quantity)===child.quantity&&
    String(row.Status).toUpperCase()==='ACTIVE'&&
    Number(row.PalletMultiplier)===1&&
    (!scope||(String(row.SessionID)===scope.sessionId&&
      String(row.LocationID)===scope.locationId&&
      String(row.WSItemID)===scope.productId&&
      String(row.Team).toUpperCase()===scope.team&&
      String(row.EnteredBy).trim().toLowerCase()===scope.email&&
      String(row.EntryMethod)===scope.entryMethod&&
      String(row.Notes||'')===scope.notes));
  const family=existing.filter(r=>String(r.ParentEntryID)===parent||
    expected.children.some(c=>c.entryId===String(r.EntryID)));
  for(const row of family){
    const id=String(row.EntryID);
    if(ids.has(id))issues.push('Duplicate child ID '+id);
    ids.add(id);
    if(String(row.ParentEntryID)!==parent)issues.push('Parent mismatch '+id);
    if(!expected.children.some(c=>c.entryId===id))issues.push('Unexpected family child '+id);
  }
  for(const child of expected.children){
    const rows=family.filter(r=>String(r.EntryID)===child.entryId);
    if(!rows.length)missing.push(child);
    else if(rows.length!==1||!equal(rows[0],child))issues.push('Child mismatch '+child.entryId);
    else matched.push(child.entryId);
  }
  const state=issues.length?'BLOCKED':
    missing.length===expected.children.length?'EMPTY':
    missing.length?'PARTIAL':'COMPLETE';
  return {state,missing,matched,issues,canAppend:state==='EMPTY',
    note:state==='PARTIAL'?'Partial family requires verified recovery; do not append blindly.':
      state==='BLOCKED'?'Family mismatch requires administrator investigation.':
      state==='COMPLETE'?'All children present; idempotent retry.':'No existing family children.'};
}


// === SOURCE: src/PalletIntentContract.gs ===
/** Canonical pallet submission intent, independent of counted rows.
 * A future server-owned journal must persist this BEFORE any child writes.
 * This pure contract neither creates a journal nor authorizes live saving.
 */
function invPalletIntent_(request,identity) {
  if(!request||typeof request!=='object'||!identity||typeof identity!=='object')
    throw new Error('Submission and authenticated identity required.');
  const required=(v,label,max=120)=>{
    if(typeof v!=='string'||!v.trim()||v.length>max)throw new Error(label+' required.');
    return v.trim();
  };
  const sessionId=required(request.sessionId,'Session');
  const locationId=required(request.locationId,'Location');
  const productId=required(request.productId,'Product');
  const email=required(identity.email,'Authenticated email',254).toLowerCase();
  const team=required(identity.team,'Authenticated team').toUpperCase();
  if(!['A','B'].includes(team))throw new Error('Invalid authenticated team.');
  const entryMethod=request.entryMethod===undefined?'Manual':request.entryMethod;
  if(!['Manual','Barcode','QR'].includes(entryMethod))throw new Error('Invalid entry method.');
  const notes=request.notes===undefined?'':request.notes;
  if(typeof notes!=='string'||notes.length>500)throw new Error('Invalid notes.');
  const plan=invPlanPalletChildren_({
    parentSubmissionId:request.parentSubmissionId,pallets:request.pallets,
    casesPerPallet:request.casesPerPallet,partialCases:request.partialCases,
    looseBottles:request.looseBottles
  });
  return {
    version:1,parentSubmissionId:plan.parentSubmissionId,
    sessionId,locationId,productId,team,email,entryMethod,notes,
    childCount:plan.childCount,totalCases:plan.totalCases,
    totalLooseBottles:plan.totalLooseBottles,
    children:plan.children.map(c=>({
      entryId:c.entryId,uom:c.uom,quantity:c.quantity,kind:c.kind
    }))
  };
}
/** Exact equality of canonical server-derived intent (no client trust).
 * The digest is not a signature; only a server-owned immutable record can
 * provide authoritative original intent.
 */
function invPalletIntentEqual_(left,right) {
  if(!left||!right)return false;
  return JSON.stringify(left)===JSON.stringify(right);
}


// === SOURCE: src/PalletIntentJournalProtocol.gs ===
/** Pure write-ahead pallet intent journal state machine.
 * Journal storage is deliberately not provisioned or enabled here.
 * Storage must enforce unique ParentSubmissionID and immutable IntentJSON.
 */
function invPalletJournalDecision_(intent,records) {
  if(!intent||typeof intent!=='object'||!Array.isArray(records))
    throw new Error('Canonical intent and journal records required.');
  const parent=String(intent.parentSubmissionId||'');
  if(!parent)throw new Error('Missing parent submission ID.');
  const matches=records.filter(r=>String(r.ParentSubmissionID)===parent);
  if(matches.length>1)return {action:'BLOCK',reason:'DUPLICATE_JOURNAL'};
  if(!matches.length)return {action:'WRITE_INTENT',reason:'FIRST_SUBMISSION'};
  const record=matches[0];
  let stored;
  try { stored=JSON.parse(String(record.IntentJSON||'')); }
  catch(_) {return {action:'BLOCK',reason:'INVALID_STORED_INTENT'};}
  if(!invPalletIntentEqual_(stored,intent))
    return {action:'BLOCK',reason:'INTENT_CHANGED'};
  const status=String(record.Status||'').toUpperCase();
  if(status==='PREPARED')return {action:'INSPECT_CHILDREN',reason:'PREPARED_RETRY'};
  if(status==='COMMITTED')return {action:'INSPECT_CHILDREN',reason:'COMMITTED_RETRY'};
  return {action:'BLOCK',reason:'UNKNOWN_JOURNAL_STATUS'};
}
/** Decide from original journal intent and observed physical children.
 * A PARTIAL family is never silently completed by a retry.
 */
function invPalletJournalReconcile_(intent,existing,scope) {
  const expected={parentSubmissionId:intent.parentSubmissionId,
    children:intent.children.map(c=>({entryId:c.entryId,uom:c.uom,quantity:c.quantity}))};
  const result=invClassifyPalletFamily_(expected,existing,scope);
  if(result.state==='COMPLETE')return {action:'ACKNOWLEDGE',state:'COMPLETE'};
  if(result.state==='EMPTY')return {action:'WRITE_CHILDREN',state:'EMPTY'};
  return {action:'BLOCK',state:result.state,reason:'ADMIN_REVIEW_REQUIRED'};
}


// === SOURCE: src/PalletIntentJournalStorage.gs ===
/** Pallet submission journal schema and storage adapter.
 * This file does NOT create a database tab or enable pallet saving.
 * All calls must run under the caller's inventory script lock.
 * Journal rows are append-only: a PREPARED intent is never overwritten.
 */
const INV_PALLET_JOURNAL_HEADERS = [
  'ParentSubmissionID','SessionID','IntentJSON','Status','CreatedAt','CreatedBy'
];
function invPalletJournalRows_() {
  const sheet=invSheet_('PalletSubmissionJournal');
  const actual=sheet.getRange(1,1,1,INV_PALLET_JOURNAL_HEADERS.length)
    .getDisplayValues()[0];
  if(actual.join('|')!==INV_PALLET_JOURNAL_HEADERS.join('|'))
    throw new Error('Unexpected PalletSubmissionJournal schema.');
  const last=sheet.getLastRow();
  if(last<2)return [];
  return sheet.getRange(2,1,last-1,INV_PALLET_JOURNAL_HEADERS.length)
    .getValues().map((values,i)=>Object.fromEntries(
      INV_PALLET_JOURNAL_HEADERS.map((name,j)=>[name,values[j]])));
}
/** Append canonical intent only after caller has validated session, product,
 * location and identity, and while holding the script lock.
 */
function invPalletJournalPrepare_(intent) {
  const rows=invPalletJournalRows_();
  const decision=invPalletJournalDecision_(intent,rows);
  if(decision.action==='BLOCK')
    throw new Error('Pallet journal '+decision.reason+'; administrator review required.');
  if(decision.action==='INSPECT_CHILDREN')
    return {prepared:false,retry:true,decision};
  const sheet=invSheet_('PalletSubmissionJournal');
  const payload=[
    intent.parentSubmissionId,intent.sessionId,JSON.stringify(intent),
    'PREPARED',new Date(),intent.email
  ];
  sheet.getRange(sheet.getLastRow()+1,1,1,payload.length).setValues([payload]);
  // Verify durable intent before any child write.
  const verified=invPalletJournalDecision_(intent,invPalletJournalRows_());
  if(verified.action!=='INSPECT_CHILDREN'||verified.reason!=='PREPARED_RETRY')
    throw new Error('Pallet journal prepare not verified; no child writes allowed.');
  return {prepared:true,retry:false,decision:verified};
}
/** The journal intentionally stays PREPARED after child write.
 * COMPLETE is derived by comparing all children to immutable intent.
 * This avoids an in-place COMMITTED mutation that could be lost.
 */
function invPalletJournalStatus_(intent,entries,scope) {
  const decision=invPalletJournalDecision_(intent,invPalletJournalRows_());
  if(decision.action!=='INSPECT_CHILDREN')
    return {status:'BLOCKED',reason:decision.reason};
  const outcome=invPalletJournalReconcile_(intent,entries,scope);
  return {status:outcome.action==='ACKNOWLEDGE'?'COMPLETE':
    outcome.action==='WRITE_CHILDREN'?'PREPARED':'REVIEW_REQUIRED',
    reason:outcome.reason||outcome.state};
}


// === SOURCE: src/PalletFamilyPersistence.gs ===
/** Private pallet family persistence. Not exposed as an RPC until production approval.
 * Holds a script lock for validation, idempotency classification and a single
 * rectangular Sheets write. Partial families fail closed for manual recovery.
 */
function invSavePalletFamilyPrivate_(request) {
  if(!request||typeof request!=='object')throw new Error('Missing pallet submission.');
  const user=invUser_(),team=invTeam_(user);
  const sessionId=String(request.sessionId||'').trim();
  const locationId=String(request.locationId||'').trim();
  const productId=String(request.productId||'').trim();
  const entryMethod=String(request.entryMethod||'Manual');
  const notes=String(request.notes||'');
  if(!sessionId||!locationId||!productId)throw new Error('Session, location and product required.');
  if(!['Manual','Barcode','QR'].includes(entryMethod))throw new Error('Invalid entry method.');
  if(notes.length>500)throw new Error('Notes exceed 500 characters.');
  const family=invPlanPalletChildren_({
    parentSubmissionId:request.parentSubmissionId,
    pallets:request.pallets,casesPerPallet:request.casesPerPallet,
    partialCases:request.partialCases,looseBottles:request.looseBottles
  });
  const lock=LockService.getScriptLock();
  if(!lock.tryLock(15000))throw new Error('Inventory busy; retry with same parent ID.');
  try {
    invSession_(sessionId);
    const ref=invReference_();
    if(ref.locations.filter(x=>String(x.LocationID)===locationId).length!==1)
      throw new Error('Invalid or duplicated active location.');
    const products=ref.products.filter(x=>String(x.WSItemID)===productId);
    if(products.length!==1)throw new Error('Invalid or duplicated active product.');
    const product=products[0];
    if(String(product.ClassOfMaterial).trim().toLowerCase()!=='finished good')
      throw new Error('Pallet family is only available for finished goods.');
    const pack=Number(product.UnitsPerCase);
    if(product.UnitsPerCase===''||product.UnitsPerCase===null||
       !Number.isSafeInteger(pack)||pack<=0)
      throw new Error('Missing or invalid units per case.');
    const existing=invRows_('CountEntries');
    const scope={sessionId,locationId,productId,team,email:user.email,entryMethod,notes};
    // Journal intent must be durable before any physical child record is written.
    // An unjournaled existing family is an orphan and must never be acknowledged.
    const intent=invPalletIntent_(request,{email:user.email,team});
    const journalDecision=invPalletJournalDecision_(intent,invPalletJournalRows_());
    if(journalDecision.action==='BLOCK')
      throw new Error('Pallet journal '+journalDecision.reason+'; administrator review required.');
    const state=invClassifyPalletFamily_(family,existing,scope);
    if(journalDecision.action==='WRITE_INTENT'&&state.state!=='EMPTY')
      throw new Error('Orphan pallet children without original intent; administrator review required.');
    if(state.state==='COMPLETE')
      return {ok:true,duplicate:true,parentSubmissionId:family.parentSubmissionId,
        childCount:family.childCount,totalCases:family.totalCases,
        totalLooseBottles:family.totalLooseBottles};
    if(state.state!=='EMPTY')throw new Error('Pallet family '+state.state+
      '; do not resubmit with a different ID. Contact administrator.');
    if(existing.some(x=>String(x.EntryID)===family.parentSubmissionId))
      throw new Error('Parent ID already used as a physical count.');
    if(existing.some(x=>String(x.SessionID)===sessionId&&
      String(x.LocationID)===locationId&&String(x.Team).toUpperCase()===team&&
      String(x.Status).toUpperCase()==='ACTIVE'&&
      String(x.EntryMethod).toUpperCase()==='EMPTY'))
      throw new Error('Remove your team EMPTY entry before counting items.');
    invPalletJournalPrepare_(intent);
    const prepared=invPalletJournalStatus_(intent,existing,scope);
    if(prepared.status!=='PREPARED')
      throw new Error('Pallet journal is not ready for child writes: '+prepared.status);
    const sheet=invSheet_('CountEntries'),start=sheet.getLastRow()+1;
    const timestamp=new Date();
    const rows=family.children.map(child=>[
      child.entryId,sessionId,team,locationId,productId,child.uom,
      child.quantity,family.parentSubmissionId,1,user.email,timestamp,
      entryMethod,notes,'ACTIVE'
    ]);
    sheet.getRange(start,1,rows.length,14).setValues(rows);
    // A Sheets write acknowledgement is not proof that every child persisted.
    // Verify the complete family while still holding the same script lock.
    const verified=invClassifyPalletFamily_(family,invRows_('CountEntries'),scope);
    if(verified.state!=='COMPLETE')
      throw new Error('Pallet family write could not be verified ('+verified.state+
        '). Do not retry with a different parent ID; contact administrator.');
    const finalJournal=invPalletJournalStatus_(intent,invRows_('CountEntries'),scope);
    if(finalJournal.status!=='COMPLETE')
      throw new Error('Pallet journal final verification failed: '+finalJournal.status);
    return {ok:true,duplicate:false,parentSubmissionId:family.parentSubmissionId,
      childCount:family.childCount,totalCases:family.totalCases,
      totalLooseBottles:family.totalLooseBottles};
  }finally{lock.releaseLock();}
}


/** Read-only check; do not run the private writer until separately approved. */
function testStagingWriterCodeLoaded() {
  invAssertStagingOnly_();
  const user=invUser_();
  const team=invTeam_(user);
  const session=invSession_('STAGING-SESSION-001');
  const ref=invReference_();
  const journal=invPalletJournalRows_();
  const entries=invRows_('CountEntries');
  const plan=invPlanPalletChildren_({parentSubmissionId:'STAGING-READONLY-0001',pallets:2,casesPerPallet:10,partialCases:3,looseBottles:2});
  const report={stagingOnly:true,team,sessionOpen:String(session.Status).toUpperCase()==='OPEN',locations:ref.locations.length,products:ref.products.length,journalRows:journal.length,countRows:entries.length,plannedChildren:plan.childCount};
  console.log(JSON.stringify(report));
  if(team!=='A'||!report.sessionOpen||!ref.locations.some(x=>String(x.LocationID)==='STAGING-LOC-001')||!ref.products.some(x=>String(x.WSItemID)==='STAGING-FG-001')||journal.length||entries.length||plan.childCount!==4)throw new Error('BLOCKED: staging writer code preflight failed');
}
