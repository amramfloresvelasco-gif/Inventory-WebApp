/** Stage 70: staging-only, read-only Team A/B pallet-family isolation matrix.
 * Uses pure family classification and synthetic fixtures; no Sheets writes.
 */
function testStagingPalletTeamIsolation() {
  invAssertStagingOnly_();
  const user=invUser_();
  if(user.role!=='administrator')
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
    productId:base.WSItemID,team:'A',email:user.email,
    entryMethod:'Manual',notes:base.Notes};
  const b={...a,team:'B'};
  const rows=expected.children.map(child=>({...base,EntryID:child.entryId,
    UOM:child.uom,Quantity:child.quantity,Team:'A',EnteredBy:a.email}));
  const tests=[
    ['Count A complete for administrator',rows,a,'COMPLETE'],
    ['Count B cannot acknowledge A',rows,b,'BLOCKED'],
    ['Count B complete for same administrator',rows.map(x=>({...x,Team:'B',EnteredBy:b.email})),b,'COMPLETE'],
    ['Count A cannot acknowledge B',rows.map(x=>({...x,Team:'B',EnteredBy:b.email})),a,'BLOCKED'],
    ['One missing child',rows.slice(0,1),a,'PARTIAL'],
    ['No children',[],a,'EMPTY'],
    ['Wrong session',rows,{...a,sessionId:'OTHER'},'BLOCKED'],
    ['Wrong location',rows,{...a,locationId:'OTHER'},'BLOCKED'],
    ['Wrong product',rows,{...a,productId:'OTHER'},'BLOCKED'],
    ['Wrong entry author',rows,{...a,email:'other@example.invalid'},'BLOCKED']
  ];
  for(const [name,fixture,scope,want] of tests){
    const actual=invClassifyPalletFamily_(expected,fixture,scope).state;
    if(actual!==want)throw Error('FAIL '+name+': '+actual+' expected '+want);
    console.log('PASS '+name+' => '+actual);
  }
  console.log(JSON.stringify({phase:'PASS',stagingOnly:true,pureInMemory:true,
    testCases:tests.length,databaseWrites:0,teamAandBIsolation:true,
    sameAdministratorBothCounts:true}));
}

/** Stage 80: real staging database preflight, strictly read-only.
 * This does not submit pallets or create/modify any spreadsheet tabs.
 * Execute only in the existing authorized staging Apps Script project.
 */
function testStagingPalletIntegrationPreflight() {
  invAssertStagingOnly_();
  const user=invUser_();
  if(user.role!=='administrator')
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
  const activeAdministrators=users.filter(x=>
    String(x.Role||'').trim().toLowerCase()==='administrator'&&
    String(x.Email||'').trim()).length;
  // Count A/B are entry selections, not permanent user assignments.
  // One active administrator can exercise both sides during staging.
  const activeTestUsers=users.filter(x=>
    ['administrator','counter'].includes(String(x.Role||'').trim().toLowerCase())&&
    String(x.Email||'').trim()).length;
  // Inspect the real journal/child relationship without touching Sheets.
  // A PREPARED journal with missing children requires manual review before
  // enabling a write endpoint. Never log raw intent or employee identities.
  const journalHealth={complete:0,empty:0,partial:0,blocked:0,invalid:0,orphan:0};
  const reviewRows=[];
  if(journalReady) {
    const entries=invRows_('CountEntries');
    const journalRows=journal.getLastRow()>1?
      journal.getRange(2,1,journal.getLastRow()-1,expected.length).getValues():[];
    const seenParents=new Set();
    journalRows.forEach((values,index)=>{
      const journalRow=index+2;
      const parent=String(values[0]||'');
      if(!parent||seenParents.has(parent)) {
        journalHealth.invalid++;
        reviewRows.push({journalRow,reason:'DUPLICATE_OR_MISSING_PARENT'});
        return;
      }
      seenParents.add(parent);
      try {
        const intent=JSON.parse(String(values[2]||''));
        if(intent.parentSubmissionId!==parent||
           String(values[1])!==intent.sessionId||
           !['PREPARED','COMMITTED','ABANDONED'].includes(String(values[3]).toUpperCase())||
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
        const classification=invClassifyPalletFamily_(intent,entries,scope);
        const status=String(values[3]).toUpperCase();
        const state=classification.state;
        if(status==='ABANDONED') {
          // Terminal abandoned families are historical, not active counts.
          // Require all matching children to be deactivated and no conflicts.
          if(!invStagingAbandonedFamilyValid_(intent,entries,parent))
            throw Error('Abandoned family has active, duplicate or unexpected children');
          journalHealth.abandoned=(journalHealth.abandoned||0)+1;
          return;
        }
        journalHealth[state.toLowerCase()]++;
        if(state!=='COMPLETE')reviewRows.push({journalRow,reason:state,
          expectedChildren:intent.children.length,
          matchedChildren:classification.matched.length,
          missingChildren:classification.missing.length,
          issueCount:classification.issues.length});
      }catch(error){
        journalHealth.invalid++;
        reviewRows.push({journalRow,reason:'INVALID_JOURNAL_INTENT'});
      }
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
  // A durable PREPARED intent with no physical children may be a
  // recoverable interrupted submission. Do not approve new staging writes
  // until its owner has reconciled or reviewed it.
  if(journalHealth.empty)
    blockers.push('PALLET_PREPARED_INTENT_WITHOUT_CHILDREN');
  if(!sessions.length)blockers.push('NO_OPEN_STAGING_SESSION');
  if(!locations.length)blockers.push('NO_ACTIVE_STAGING_LOCATION');
  if(!finishedGoods.length)blockers.push('NO_ELIGIBLE_STAGING_FINISHED_GOOD');
  if(!activeAdministrators)blockers.push('NO_ACTIVE_STAGING_ADMINISTRATOR');
  if(!activeTestUsers)blockers.push('NO_ACTIVE_STAGING_TEST_USER');
  const result={phase:'INTEGRATION_PREFLIGHT',stagingOnly:true,readOnly:true,
    databaseWrites:0,tableRowCounts:counts,journalReady,
    openSessions:sessions.length,activeLocations:locations.length,
    eligibleFinishedGoods:finishedGoods.length,activeAdministrators,
    activeTestUsers,journalHealth,reviewRows,blockers,
    readyForCountABTest:blockers.length===0};
  console.log(JSON.stringify(result));
  if(!result.readyForCountABTest)
    console.log('NOT_READY: staging prerequisites missing; no changes made');
  return result;
}


/** Pure terminal-family validator: an abandoned journal never makes a count active. */
function invStagingAbandonedFamilyValid_(intent,entries,parent) {
  if(!intent||!Array.isArray(intent.children)||!intent.children.length||
     intent.parentSubmissionId!==parent)return false;
  const expectedIds=new Set(intent.children.map(x=>String(x.entryId)));
  if(expectedIds.size!==intent.children.length)return false;
  const family=entries.filter(r=>String(r.ParentEntryID||'')===parent||
    expectedIds.has(String(r.EntryID)));
  return family.length<intent.children.length&&
    new Set(family.map(r=>String(r.EntryID))).size===family.length&&
    family.every(r=>String(r.Status).toUpperCase()==='DELETED'&&
      String(r.ParentEntryID)===parent&&expectedIds.has(String(r.EntryID)));
}

/** Staging-only pure terminal-state matrix; does not access or change Sheets. */
function testStagingAbandonedFamilyValidation() {
  invAssertStagingOnly_();
  const parent='STAGING-ABANDONED-FIXTURE';
  const intent={parentSubmissionId:parent,children:[
    {entryId:parent+'-001'},{entryId:parent+'-002'}]};
  const one={EntryID:parent+'-001',ParentEntryID:parent,Status:'DELETED'};
  const scenarios=[
    ['valid abandoned one-child history',[one],true],
    ['valid empty history',[],true],
    ['active child',[{...one,Status:'ACTIVE'}],false],
    ['duplicate child',[one,{...one}],false],
    ['unknown child',[one,{...one,EntryID:'OTHER'}],false],
    ['wrong parent',[{...one,ParentEntryID:'OTHER'}],false],
    ['complete family',[one,{...one,EntryID:parent+'-002'}],false]
  ];
  scenarios.forEach(([label,rows,expected])=>{
    if(invStagingAbandonedFamilyValid_(intent,rows,parent)!==expected)
      throw Error('FAIL: '+label);
  });
  console.log(JSON.stringify({phase:'ABANDONED_VALIDATION_PASS',
    stagingOnly:true,pureInMemory:true,testCases:scenarios.length,databaseWrites:0}));
}


/** Stage 136: pure, side-independent location comparison for staging tests.
 * All finished-good counts are normalized to bottles before comparison.
 * A single team's counts must never be treated as a matched inventory.
 */
function invStagingCompareCountAB_(rows,unitsPerCase) {
  if(!Number.isSafeInteger(unitsPerCase)||unitsPerCase<=0)
    throw Error('Invalid units per case');
  const teams={A:new Map(),B:new Map()};
  const started={A:false,B:false};
  for(const r of rows) {
    if(String(r.Status).toUpperCase()!=='ACTIVE')continue;
    const team=String(r.Team).toUpperCase();
    if(!teams[team])throw Error('Invalid team');
    const method=String(r.EntryMethod).toUpperCase();
    const item=String(r.WSItemID||'');
    if(method==='EMPTY') {
      if([...teams[team].keys()].some(k=>k!=='__EMPTY__'))
        throw Error('EMPTY conflicts with active counts');
      teams[team].set('__EMPTY__',0);
      started[team]=true;
      continue;
    }
    if(!item||!['CASE','BOTTLE'].includes(String(r.UOM).toUpperCase())||
      !Number.isSafeInteger(Number(r.Quantity))||Number(r.Quantity)<0)
      throw Error('Invalid finished-good count');
    if(teams[team].has('__EMPTY__'))throw Error('Count conflicts with EMPTY');
    const bottles=Number(r.Quantity)*(String(r.UOM).toUpperCase()==='CASE'?unitsPerCase:1);
    if(!Number.isSafeInteger(bottles))throw Error('Count overflow');
    const next=(teams[team].get(item)||0)+bottles;
    if(!Number.isSafeInteger(next))throw Error('Count overflow');
    teams[team].set(item,next);
    started[team]=true;
  }
  const keys=new Set([...teams.A.keys(),...teams.B.keys()]);
  keys.delete('__EMPTY__');
  const mismatches=[...keys].filter(k=>(teams.A.get(k)||0)!==(teams.B.get(k)||0)).length;
  const oneStarted=started.A||started.B;
  const status=!oneStarted?'NOT_STARTED':!started.A||!started.B?'IN_PROGRESS':
    mismatches?'MISMATCH':'MATCHED';
  return {status,teamAStarted:started.A,teamBStarted:started.B,
    mismatchCount:started.A&&started.B?mismatches:0};
}

/** Stage 136: read-only live baseline plus in-memory A/B scenarios. */
function testStagingCountABIntegrationBaseline() {
  invAssertStagingOnly_();
  invRequireAdmin_();
  const session='STAGING-SESSION-001',location='STAGING-LOC-001',
    item='STAGING-FG-001';
  const product=invRows_('ProductIndex').filter(x=>String(x.WSItemID)===item);
  if(product.length!==1)throw Error('BLOCKED: staging product not unique');
  const units=Number(product[0].UnitsPerCase);
  const rows=invRows_('CountEntries').filter(x=>
    String(x.SessionID)===session&&String(x.LocationID)===location);
  const base=invStagingCompareCountAB_(rows,units);
  const active=rows.filter(x=>String(x.Status).toUpperCase()==='ACTIVE');
  const A=active.filter(x=>String(x.Team).toUpperCase()==='A');
  const B=active.filter(x=>String(x.Team).toUpperCase()==='B');
  const cases=(team,n)=>({Team:team,WSItemID:item,UOM:'Case',
    Quantity:n,Status:'ACTIVE',EntryMethod:'Manual'});
  const bottles=(team,n)=>({...cases(team,n),UOM:'Bottle'});
  const empty=team=>({Team:team,Status:'ACTIVE',EntryMethod:'EMPTY'});
  const scenarios=[
    ['unstarted',[],'NOT_STARTED',0],
    ['A only',[cases('A',2)],'IN_PROGRESS',0],
    ['B only',[cases('B',2)],'IN_PROGRESS',0],
    ['matching cases',[cases('A',2),cases('B',2)],'MATCHED',0],
    ['case bottle equivalent',[cases('A',1),bottles('B',units)],'MATCHED',0],
    ['different totals',[cases('A',2),cases('B',3)],'MISMATCH',1],
    ['one missing product',[cases('A',1),bottles('B',0)],'MISMATCH',1],
    ['both empty',[empty('A'),empty('B')],'MATCHED',0],
    ['one empty',[empty('A'),cases('B',1)],'MISMATCH',1],
    ['deleted ignored',[cases('A',1),cases('B',1),
      {...cases('B',5),Status:'DELETED'}],'MATCHED',0]
  ];
  for(const [label,fixture,want,count] of scenarios){
    const actual=invStagingCompareCountAB_(fixture,units);
    if(actual.status!==want||actual.mismatchCount!==count)
      throw Error('FAIL '+label+': '+JSON.stringify(actual));
  }
  const result={phase:'COUNT_AB_BASELINE',stagingOnly:true,readOnly:true,
    databaseWrites:0,pureScenariosPassed:scenarios.length,
    activeTeamAEntries:A.length,activeTeamBEntries:B.length,
    currentLocationState:base.status,teamAStarted:base.teamAStarted,
    teamBStarted:base.teamBStarted,mismatchCount:base.mismatchCount,
    readyForLiveBCount:base.status==='IN_PROGRESS'&&
      base.teamAStarted&&!base.teamBStarted};
  console.log(JSON.stringify(result));
  return result;
}


/** Stage 137: read-only rehearsal of live Team B mismatch/match transitions.
 * Uses the actual active staging Team A totals, but never writes Team B rows.
 * Real Team B writes require a separately approved, guarded staging action.
 */
function testStagingCountABTransitionPreview() {
  invAssertStagingOnly_();
  invRequireAdmin_();
  const session='STAGING-SESSION-001',location='STAGING-LOC-001',
    item='STAGING-FG-001';
  const products=invRows_('ProductIndex').filter(x=>String(x.WSItemID)===item);
  if(products.length!==1)throw Error('BLOCKED: staging product not unique');
  const units=Number(products[0].UnitsPerCase);
  if(!Number.isSafeInteger(units)||units<=0)
    throw Error('BLOCKED: invalid staging pack size');
  const rows=invRows_('CountEntries').filter(x=>
    String(x.SessionID)===session&&String(x.LocationID)===location);
  const active=rows.filter(x=>String(x.Status).toUpperCase()==='ACTIVE');
  const A=active.filter(x=>String(x.Team).toUpperCase()==='A');
  const B=active.filter(x=>String(x.Team).toUpperCase()==='B');
  if(!A.length||B.length)
    throw Error('BLOCKED: expected Team A only; live state changed');
  if(A.some(x=>String(x.WSItemID)!==item||
    !['CASE','BOTTLE'].includes(String(x.UOM).toUpperCase())||
    !Number.isSafeInteger(Number(x.Quantity))||Number(x.Quantity)<0))
    throw Error('BLOCKED: unexpected Team A fixture');
  const baseline=invStagingCompareCountAB_(rows,units);
  if(baseline.status!=='IN_PROGRESS'||!baseline.teamAStarted||baseline.teamBStarted)
    throw Error('BLOCKED: baseline is no longer A-only');
  let totalBottles=0;
  A.forEach(x=>{
    const n=Number(x.Quantity)*(String(x.UOM).toUpperCase()==='CASE'?units:1);
    if(!Number.isSafeInteger(n)||!Number.isSafeInteger(totalBottles+n))
      throw Error('BLOCKED: count overflow');
    totalBottles+=n;
  });
  if(totalBottles<1)throw Error('BLOCKED: cannot simulate a lower Team B total');
  const synthetic=(qty)=>({SessionID:session,LocationID:location,
    Team:'B',WSItemID:item,UOM:'Bottle',Quantity:qty,
    Status:'ACTIVE',EntryMethod:'Manual'});
  const checks=[
    ['A_ONLY',rows,'IN_PROGRESS',0],
    ['B_LESS',rows.concat(synthetic(totalBottles-1)),'MISMATCH',1],
    ['B_EQUAL',rows.concat(synthetic(totalBottles)),'MATCHED',0],
    ['B_MORE',rows.concat(synthetic(totalBottles+1)),'MISMATCH',1]
  ];
  checks.forEach(([label,fixture,want,count])=>{
    const result=invStagingCompareCountAB_(fixture,units);
    if(result.status!==want||result.mismatchCount!==count)
      throw Error('FAIL '+label+': '+JSON.stringify(result));
  });
  const result={phase:'COUNT_AB_TRANSITION_PREVIEW',stagingOnly:true,
    readOnly:true,databaseWrites:0,scenariosPassed:checks.length,
    activeTeamAEntries:A.length,activeTeamBEntries:B.length,
    teamATotalBottles:totalBottles,readyForGuardedLiveB:true,
    realTeamBWriteExecuted:false};
  console.log(JSON.stringify(result));
  return result;
}


/** Stage 138: pure approval gate for a future one-time Team B staging write.
 * This function returns a proposed test plan, never a permission to write.
 */
function invStagingPlanLiveCountB_(input) {
  if(!input||input.stagingOnly!==true||input.role!=='administrator')
    throw Error('BLOCKED: staging administrator required');
  if(input.approved!==true)
    throw Error('BLOCKED: explicit approval required before staging writes');
  if(input.sessionId!=='STAGING-SESSION-001'||
     input.locationId!=='STAGING-LOC-001'||
     input.productId!=='STAGING-FG-001')
    throw Error('BLOCKED: unexpected staging scope');
  if(!Array.isArray(input.entries)||!input.entries.length)
    throw Error('BLOCKED: missing baseline');
  if(input.entries.some(x=>String(x.Status).toUpperCase()==='ACTIVE'&&
    String(x.Team).toUpperCase()==='B'))
    throw Error('BLOCKED: Team B already has active entries');
  if(input.entries.some(x=>String(x.Status).toUpperCase()==='ACTIVE'&&
    String(x.Team).toUpperCase()==='A'&&
    (String(x.WSItemID)!==input.productId||
     !['CASE','BOTTLE'].includes(String(x.UOM).toUpperCase()))))
    throw Error('BLOCKED: unexpected Team A baseline');
  const units=Number(input.unitsPerCase);
  if(!Number.isSafeInteger(units)||units<=0)
    throw Error('BLOCKED: invalid units per case');
  const activeA=input.entries.filter(x=>String(x.Status).toUpperCase()==='ACTIVE'&&
    String(x.Team).toUpperCase()==='A');
  if(!activeA.length)throw Error('BLOCKED: Team A baseline missing');
  let bottles=0;
  activeA.forEach(x=>{
    const quantity=Number(x.Quantity);
    if(!Number.isSafeInteger(quantity)||quantity<0)
      throw Error('BLOCKED: invalid Team A quantity');
    const amount=quantity*(String(x.UOM).toUpperCase()==='CASE'?units:1);
    if(!Number.isSafeInteger(amount)||!Number.isSafeInteger(bottles+amount))
      throw Error('BLOCKED: Team A total overflow');
    bottles+=amount;
  });
  if(bottles<1||bottles>=Number.MAX_SAFE_INTEGER)
    throw Error('BLOCKED: unsafe Team B mismatch fixture');
  const state=invStagingCompareCountAB_(input.entries,units);
  if(state.status!=='IN_PROGRESS'||!state.teamAStarted||state.teamBStarted)
    throw Error('BLOCKED: expected A-only baseline');
  return {stagingOnly:true,writeEnabled:false,approvalRequiredAtExecution:true,
    expectedTeamAEntries:activeA.length,expectedTeamABottles:bottles,
    proposedTeamBMismatchBottles:bottles-1,
    proposedTeamBMatchBottles:bottles,
    expectedSequence:['IN_PROGRESS','MISMATCH','MATCHED'],
    productionWritesAllowed:false};
}

/** Stage 138: pure planner regression plus live read-only gate preview. */
function testStagingLiveCountBWritePlan() {
  invAssertStagingOnly_();
  const admin=invRequireAdmin_();
  const sessionId='STAGING-SESSION-001',locationId='STAGING-LOC-001',
    productId='STAGING-FG-001';
  const products=invRows_('ProductIndex').filter(x=>String(x.WSItemID)===productId);
  if(products.length!==1)throw Error('BLOCKED: product not unique');
  const entries=invRows_('CountEntries').filter(x=>
    String(x.SessionID)===sessionId&&String(x.LocationID)===locationId);
  const base={stagingOnly:true,role:admin.role,approved:true,
    sessionId,locationId,productId,unitsPerCase:Number(products[0].UnitsPerCase),
    entries};
  const plan=invStagingPlanLiveCountB_(base);
  const blocked=[
    {...base,approved:false},
    {...base,stagingOnly:false},
    {...base,role:'counter'},
    {...base,locationId:'OTHER'},
    {...base,unitsPerCase:0},
    {...base,entries:[]},
    {...base,entries:entries.concat({Team:'B',Status:'ACTIVE'})},
    {...base,entries:entries.concat({Team:'A',Status:'ACTIVE',
      WSItemID:'OTHER',UOM:'Case',Quantity:1})}
  ];
  blocked.forEach((fixture,index)=>{
    let rejected=false;
    try {invStagingPlanLiveCountB_(fixture);}
    catch(e){rejected=String(e.message).startsWith('BLOCKED:');}
    if(!rejected)throw Error('FAIL: unsafe plan '+(index+1)+' accepted');
  });
  const result={phase:'COUNT_B_WRITE_PLAN',stagingOnly:true,readOnly:true,
    databaseWrites:0,negativeCasesPassed:blocked.length,
    activeTeamAEntries:plan.expectedTeamAEntries,
    proposedMismatchBottles:plan.proposedTeamBMismatchBottles,
    proposedMatchBottles:plan.proposedTeamBMatchBottles,
    writeEnabled:false,realTeamBWriteExecuted:false};
  console.log(JSON.stringify(result));
  return result;
}
