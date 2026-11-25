/** Isolated staging web map. Read-only; never deploy to production. */
function doGet(e) {
  invAssertStagingOnly_();
  invRequireAdmin_();
  const preview=Boolean(e&&e.parameter&&e.parameter.view==='entry');
  return HtmlService.createHtmlOutputFromFile(preview?'StagingEntryPreview':'StagingMap')
    .setTitle(preview?'BMD Inventory — STAGING Entry Preview':'BMD Inventory — STAGING Map');
}
/** Stage 143: pure, fail-closed integrity gate for map locations. */
function invStagingMapIntegrity143_(locations,entries,sessionId) {
  const ids=new Set(),duplicateLocationIds=[],invalidEntries=[];
  for(const l of locations) {
    const id=String(l.LocationID).trim();
    if(!id||ids.has(id))duplicateLocationIds.push(id||'(blank)');
    ids.add(id);
  }
  for(const e of entries) {
    if(String(e.SessionID)!==sessionId||String(e.Status).toUpperCase()!=='ACTIVE')continue;
    const id=String(e.LocationID).trim();
    if(!ids.has(id))invalidEntries.push({entryId:String(e.EntryID),locationId:id,reason:'Unknown or inactive location'});
  }
  return {ok:duplicateLocationIds.length===0&&invalidEntries.length===0,
    duplicateLocationIds,invalidEntries};
}
/** Stage 144: reject duplicate active entry IDs, invalid teams and unknown products.
 * Only the requested session's active entries participate.
 */
function invStagingMapEntryIntegrity144_(entries,products,sessionId) {
  const active=entries.filter(e=>String(e.SessionID)===sessionId&&String(e.Status).toUpperCase()==='ACTIVE');
  const ids=new Set(),productCounts=new Map(),invalidEntries=[];
  for(const p of products) {
    if(String(p.Active).toLowerCase()!=='true')continue;
    const id=String(p.WSItemID).trim();
    productCounts.set(id,(productCounts.get(id)||0)+1);
  }
  for(const e of active) {
    const id=String(e.EntryID).trim(),team=String(e.Team).toUpperCase();
    const empty=String(e.EntryMethod).toUpperCase()==='EMPTY';
    const product=String(e.WSItemID).trim();
    let reason='';
    if(!id||ids.has(id))reason='Blank or duplicate active EntryID';
    else if(!['A','B'].includes(team))reason='Invalid team';
    else if(!empty&&productCounts.get(product)!==1)reason='Missing or duplicate active product';
    else if(empty&&product)reason='EMPTY declaration references product';
    if(reason)invalidEntries.push({entryId:id,locationId:String(e.LocationID),reason});
    ids.add(id);
  }
  return {ok:invalidEntries.length===0,invalidEntries};
}
/** Stage 144: pure fail-closed map entry integrity cases. */
function testStagingMapEntryIntegrity144() {
  invAssertStagingOnly_();invRequireAdmin_();
  const product={WSItemID:'FG',Active:true};
  const row=(id,team='A',item='FG')=>({EntryID:id,Team:team,WSItemID:item,
    EntryMethod:'Manual',SessionID:'S',Status:'ACTIVE',LocationID:'L'});
  const scenarios=[
    ['valid',[row('E')],[product],true],
    ['duplicate entry',[row('E'),row('E')],[product],false],
    ['blank entry',[row('')],[product],false],
    ['invalid team',[row('E','C')],[product],false],
    ['unknown product',[row('E','A','OTHER')],[product],false],
    ['duplicate product',[row('E')],[product,product],false],
    ['deleted duplicate ignored',[row('E'),{...row('E'),Status:'DELETED'}],[product],true],
    ['other session ignored',[row('E'),{...row('E'),SessionID:'OTHER'}],[product],true],
    ['empty declaration', [{...row('E','B',''),EntryMethod:'EMPTY'}],[product],true],
    ['empty with product', [{...row('E'),EntryMethod:'EMPTY'}],[product],false]
  ];
  for(const [name,rows,products,expected] of scenarios) {
    const result=invStagingMapEntryIntegrity144_(rows,products,'S');
    if(result.ok!==expected)throw Error('FAIL '+name+': '+JSON.stringify(result));
  }
  const result={phase:'STAGING_MAP_ENTRY_INTEGRITY_144',stagingOnly:true,
    readOnly:true,databaseWrites:0,pureScenariosPassed:scenarios.length};
  console.log(JSON.stringify(result));return result;
}

function apiStagingMapReadOnly142() {
  invAssertStagingOnly_();
  invRequireAdmin_();
  const sessionId='STAGING-SESSION-001';
  invSession_(sessionId);
  const locations=invRows_('Locations').filter(x=>String(x.Active).toLowerCase()==='true');
  const entries=invRows_('CountEntries');
  const integrity=invStagingMapIntegrity143_(locations,entries,sessionId);
  const entryIntegrity=invStagingMapEntryIntegrity144_(entries,invRows_('ProductIndex'),sessionId);
  integrity.invalidEntries.push(...entryIntegrity.invalidEntries);
  integrity.ok=integrity.ok&&entryIntegrity.ok;
  // Never publish a reassuring green card when the location index is corrupt.
  if(!integrity.ok)return {stagingOnly:true,readOnly:true,databaseWrites:0,
    sessionId,cards:[],integrity};
  const cards=locations.map(l=>{
    const locationId=String(l.LocationID);
    const status=invStagingLocationMapStatus140_(sessionId,locationId);
    const active=entries.filter(x=>String(x.SessionID)===sessionId&&String(x.LocationID)===locationId&&String(x.Status).toUpperCase()==='ACTIVE');
    const a=active.filter(x=>String(x.Team).toUpperCase()==='A').length;
    const b=active.filter(x=>String(x.Team).toUpperCase()==='B').length;
    const color=status.status==='MATCHED'?'green':status.status==='MISMATCH'?'red':status.status==='IN_PROGRESS'?'yellow':'neutral';
    return {locationId,warehouse:String(l.Warehouse),bay:String(l.Bay),color,status:status.status,entryCountA:a,entryCountB:b,mismatchCount:status.mismatchCount};
  });
  return {stagingOnly:true,readOnly:true,databaseWrites:0,sessionId,cards,integrity};
}
/** Stage 143 pure tests; no spreadsheet mutation. */
function testStagingMapIntegrity143() {
  invAssertStagingOnly_();
  invRequireAdmin_();
  const loc=id=>({LocationID:id});
  const row=(id,location)=>({EntryID:id,SessionID:'S',Status:'ACTIVE',LocationID:location});
  const scenarios=[
    {name:'valid',l:[loc('L')],e:[row('E','L')],ok:true},
    {name:'unknown active location',l:[loc('L')],e:[row('E','OTHER')],ok:false},
    {name:'duplicate location',l:[loc('L'),loc('L')],e:[],ok:false},
    {name:'blank location',l:[loc('')],e:[],ok:false},
    {name:'deleted orphan ignored',l:[loc('L')],e:[{...row('E','OTHER'),Status:'DELETED'}],ok:true},
    {name:'other session ignored',l:[loc('L')],e:[{...row('E','OTHER'),SessionID:'OTHER'}],ok:true}
  ];
  for(const s of scenarios) {
    const r=invStagingMapIntegrity143_(s.l,s.e,'S');
    if(r.ok!==s.ok)throw Error('FAIL '+s.name+': '+JSON.stringify(r));
  }
  const result={phase:'STAGING_MAP_INTEGRITY_143',stagingOnly:true,
    readOnly:true,databaseWrites:0,pureScenariosPassed:scenarios.length};
  console.log(JSON.stringify(result));return result;
}

/** Stage 150: admin-only staging location reference; no counts or writes. */
function apiStagingEntryLocations150(){
 invAssertStagingOnly_();invRequireAdmin_();
 const rows=invRows_('Locations').filter(x=>String(x.Active).toLowerCase()==='true');
 const ids=new Set();
 const locations=rows.map(x=>{
  const locationId=String(x.LocationID||'').trim(),warehouse=String(x.Warehouse||'').trim(),bay=String(x.Bay||'').trim();
  if(!locationId||!warehouse||!bay||ids.has(locationId))throw Error('Invalid active staging location index');
  ids.add(locationId);return {locationId,warehouse,bay};
 });
 return {stagingOnly:true,readOnly:true,databaseWrites:0,locations};
}
