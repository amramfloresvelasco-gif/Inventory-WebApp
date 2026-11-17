/** Stage 70: staging-only, read-only Team A/B pallet-family isolation matrix.
 * Uses pure family classification and synthetic fixtures; no Sheets writes.
 */
function testStagingPalletTeamIsolation() {
  invAssertStagingOnly_();
  const user=invUser_();
  if(user.email!=='abe.flores@bsbco.com'||user.team!=='A'||!user.teamLocked)
    throw Error('BLOCKED: unauthorized staging test identity');
  const parent='STAGING-TEAM-ISOLATION-FIXTURE';
  const expected={parentSubmissionId:parent,children:[
    {entryId:parent+'-001',uom:'Case',quantity:12},
    {entryId:parent+'-002',uom:'Bottle',quantity:3}
  ]};
  const base={SessionID:'STAGING-SESSION-001',LocationID:'STAGING-LOC-001',
    WSItemID:'STAGING-FG-001',EntryMethod:'Manual',Notes:'team isolation fixture',
    Status:'ACTIVE',PalletMultiplier:1,ParentEntryID:parent};
  const a={sessionId:base.SessionID,locationId:base.LocationID,
    productId:base.WSItemID,team:'A',email:'counter-a@example.invalid',
    entryMethod:'Manual',notes:base.Notes};
  const b={...a,team:'B',email:'counter-b@example.invalid'};
  const rows=expected.children.map(child=>({...base,EntryID:child.entryId,
    UOM:child.uom,Quantity:child.quantity,Team:'A',EnteredBy:a.email}));
  const tests=[
    ['Team A complete',rows,a,'COMPLETE'],
    ['Team B cannot acknowledge A',rows,b,'BLOCKED'],
    ['Team B own complete',rows.map(x=>({...x,Team:'B',EnteredBy:b.email})),b,'COMPLETE'],
    ['Team A cannot acknowledge B',rows.map(x=>({...x,Team:'B',EnteredBy:b.email})),a,'BLOCKED'],
    ['One missing child',rows.slice(0,1),a,'PARTIAL'],
    ['No children',[],a,'EMPTY'],
    ['Wrong session',rows,{...a,sessionId:'OTHER'},'BLOCKED'],
    ['Wrong location',rows,{...a,locationId:'OTHER'},'BLOCKED'],
    ['Wrong product',rows,{...a,productId:'OTHER'},'BLOCKED'],
    ['Wrong counter identity',rows,{...a,email:'other@example.invalid'},'BLOCKED']
  ];
  for(const [name,fixture,scope,want] of tests){
    const actual=invClassifyPalletFamily_(expected,fixture,scope).state;
    if(actual!==want)throw Error('FAIL '+name+': '+actual+' expected '+want);
    console.log('PASS '+name+' => '+actual);
  }
  console.log(JSON.stringify({phase:'PASS',stagingOnly:true,pureInMemory:true,
    testCases:tests.length,databaseWrites:0,teamAandBIsolation:true}));
}

/** Stage 80: real staging database preflight, strictly read-only.
 * This does not submit pallets or create/modify any spreadsheet tabs.
 * Execute only in the existing authorized staging Apps Script project.
 */
function testStagingPalletIntegrationPreflight() {
  invAssertStagingOnly_();
  const user=invUser_();
  if(user.email!=='abe.flores@bsbco.com'||user.role!=='administrator')
    throw Error('BLOCKED: authorized staging administrator required');
  const sheets=['AppUsers','InventorySessions','Locations','ProductIndex','CountEntries'];
  const counts={};
  sheets.forEach(name=>{
    // invRows_ enforces the existing table schema without mutating data.
    counts[name]=invRows_(name).length;
  });
  const journal=SpreadsheetApp.openById(INV_DB_ID).getSheetByName('PalletSubmissionJournal');
  const expected=['ParentSubmissionID','SessionID','IntentJSON','Status','CreatedAt','CreatedBy'];
  const actual=journal?journal.getRange(1,1,1,expected.length).getDisplayValues()[0]:[];
  const journalReady=actual.join('|')===expected.join('|');
  const sessions=invRows_('InventorySessions').filter(x=>String(x.Status).toUpperCase()==='OPEN');
  const locations=invRows_('Locations').filter(x=>String(x.Active).toLowerCase()==='true');
  const finishedGoods=invRows_('ProductIndex').filter(x=>
    String(x.Active).toLowerCase()==='true'&&
    String(x.ClassOfMaterial).trim().toLowerCase()==='finished good'&&
    Number.isSafeInteger(Number(x.UnitsPerCase))&&Number(x.UnitsPerCase)>0);
  const users=invRows_('AppUsers').filter(x=>String(x.Status).toLowerCase()==='active');
  const teams={A:0,B:0};
  const teamEmails={A:new Set(),B:new Set()};
  users.forEach(x=>{
    const team=String(x.AssignedTeam).toUpperCase();
    const email=String(x.Email||'').trim().toLowerCase();
    if((team==='A'||team==='B')&&email&&
       String(x.TeamLocked).toLowerCase()==='true') {
      teams[team]++;
      teamEmails[team].add(email);
    }
  });
  // Two team labels alone are insufficient: the test requires two
  // distinct authenticated Workspace identities.
  const distinctTeamAccounts=[...teamEmails.A].some(email=>!teamEmails.B.has(email))&&
    [...teamEmails.B].some(email=>!teamEmails.A.has(email));
  const blockers=[];
  if(!journalReady)blockers.push('PALLET_JOURNAL_SCHEMA_MISSING_OR_INVALID');
  if(!sessions.length)blockers.push('NO_OPEN_STAGING_SESSION');
  if(!locations.length)blockers.push('NO_ACTIVE_STAGING_LOCATION');
  if(!finishedGoods.length)blockers.push('NO_ELIGIBLE_STAGING_FINISHED_GOOD');
  if(!teams.A)blockers.push('NO_LOCKED_ACTIVE_TEAM_A_ACCOUNT');
  if(!teams.B)blockers.push('NO_LOCKED_ACTIVE_TEAM_B_ACCOUNT');
  if(!distinctTeamAccounts)blockers.push('TEAM_ACCOUNTS_NOT_DISTINCT');
  const result={phase:'INTEGRATION_PREFLIGHT',stagingOnly:true,readOnly:true,
    databaseWrites:0,tableRowCounts:counts,journalReady,
    openSessions:sessions.length,activeLocations:locations.length,
    eligibleFinishedGoods:finishedGoods.length,lockedActiveCounters:teams,
    distinctTeamAccounts,blockers,
    readyForTwoAccountTest:blockers.length===0};
  console.log(JSON.stringify(result));
  if(!result.readyForTwoAccountTest)
    console.log('NOT_READY: staging prerequisites missing; no changes made');
  return result;
}
