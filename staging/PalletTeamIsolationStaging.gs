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
  // Inspect the real journal/child relationship without touching Sheets.
  // A PREPARED journal with missing children requires manual review before
  // enabling a write endpoint. Never log raw intent or employee identities.
  const journalHealth={complete:0,empty:0,partial:0,blocked:0,invalid:0,orphan:0};
  if(journalReady) {
    const entries=invRows_('CountEntries');
    const journalRows=journal.getLastRow()>1?
      journal.getRange(2,1,journal.getLastRow()-1,expected.length).getValues():[];
    const seenParents=new Set();
    journalRows.forEach(values=>{
      const parent=String(values[0]||'');
      if(!parent||seenParents.has(parent)) {
        journalHealth.invalid++;return;
      }
      seenParents.add(parent);
      try {
        const intent=JSON.parse(String(values[2]||''));
        if(intent.parentSubmissionId!==parent||
           String(values[1])!==intent.sessionId||
           !['PREPARED','COMMITTED'].includes(String(values[3]).toUpperCase())||
           !Array.isArray(intent.children)||!intent.children.length||
           String(values[5]).trim().toLowerCase()!==intent.email)
          throw Error('Invalid journal intent');
        // Validate every stored child against the canonical planner rather
        // than trusting an arbitrary JSON payload to define its own success.
        const full=intent.children.filter(x=>x.kind==='full-pallet');
        const partial=intent.children.filter(x=>x.kind==='partial-pallet');
        const loose=intent.children.filter(x=>x.kind==='loose-bottles');
        if(partial.length>1||loose.length>1||
           full.some(x=>x.quantity!==full[0].quantity))
          throw Error('Noncanonical pallet children');
        const canonical=invPalletIntent_({
          parentSubmissionId:parent,sessionId:intent.sessionId,
          locationId:intent.locationId,productId:intent.productId,
          entryMethod:intent.entryMethod,notes:intent.notes,
          pallets:full.length,casesPerPallet:full.length?full[0].quantity:0,
          partialCases:partial.length?partial[0].quantity:0,
          looseBottles:loose.length?loose[0].quantity:0
        },{email:intent.email,team:intent.team});
        if(!invPalletIntentEqual_(canonical,intent))
          throw Error('Noncanonical journal intent');
        const scope={sessionId:intent.sessionId,locationId:intent.locationId,
          productId:intent.productId,team:intent.team,email:intent.email,
          entryMethod:intent.entryMethod,notes:intent.notes};
        const state=invClassifyPalletFamily_(intent,entries,scope).state;
        journalHealth[state.toLowerCase()]++;
      }catch(error){journalHealth.invalid++;}
    });
    // CountEntries can contain family children without a durable journal
    // (e.g. interrupted legacy writes). Detect these independently of the
    // journal contents, without exposing parent IDs in the output.
    const orphanParents=new Set();
    entries.forEach(row=>{
      const parent=String(row.ParentEntryID||'').trim();
      const child=String(row.EntryID||'').trim();
      if(parent&&child.startsWith(parent+'-')&&
         /^[A-Z]{1,3}$/.test(child.slice(parent.length+1))&&
         !seenParents.has(parent))orphanParents.add(parent);
    });
    journalHealth.orphan=orphanParents.size;
  }
  const blockers=[];
  if(!journalReady)blockers.push('PALLET_JOURNAL_SCHEMA_MISSING_OR_INVALID');
  if(journalHealth.invalid||journalHealth.partial||journalHealth.blocked||journalHealth.orphan)
    blockers.push('PALLET_JOURNAL_REQUIRES_ADMIN_REVIEW');
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
    distinctTeamAccounts,journalHealth,blockers,
    readyForTwoAccountTest:blockers.length===0};
  console.log(JSON.stringify(result));
  if(!result.readyForTwoAccountTest)
    console.log('NOT_READY: staging prerequisites missing; no changes made');
  return result;
}
