# Stage 53 — Isolated Apps Script staging setup

Staging spreadsheet: https://docs.google.com/spreadsheets/d/1EaaGTFahbAdS3QqywFh4yeuXntCjL8ik1kZcQvqq2zo/edit

Production spreadsheet (never use for tests): `12teaGz7z2Ems-Elqz5vHv1Z8S5aV4kJMJrnBxlMYQ5Y`.

**Status:** Staging spreadsheet created with six synthetic tabs; standalone staging Apps Script project NOT yet created. No live writer run performed.

## Important separation

The repository's deployed `src/Code.gs` currently has `const INV_DB_ID = '12teaGz7z2Ems-Elqz5vHv1Z8S5aV4kJMJrnBxlMYQ5Y';`. Never change that value in GitHub main or in the production Apps Script project. Create a separate Apps Script project, with a separate project/script ID, containing a copy of the production modules. Only in that separate project set `INV_DB_ID` to `1EaaGTFahbAdS3QqywFh4yeuXntCjL8ik1kZcQvqq2zo`. Do not publish a web app or add employee Save endpoints.

The staging AppUsers placeholder `staging-counter@example.invalid` is not a real account. The actual Apps Script execution identity must be an authorized signed-in Workspace user; replace only the staging AppUsers row with that user's real Workspace email before the first writer test. Do not bypass `invUser_`, override `Session.getActiveUser`, or weaken auth in production or staging.

## Human setup in Google Apps Script

1. Open script.google.com and create a **New project**, named `BMD Inventory — Staging Script`. Do **not** open or edit the existing production project.
2. Copy the required `.gs` source modules from the repository into this new project. Preserve function names and do not add a public RPC.
3. Set the new project's `INV_DB_ID` constant to the staging ID above. Confirm the production ID does not appear anywhere in this new project's source or properties.
4. Verify the signed-in user's email is present as a single active counter in **staging** AppUsers, team A, TeamLocked TRUE. Update only the staging row.
5. Run a read-only staging-only preflight first. Confirm `CountEntries` and `PalletSubmissionJournal` contain only headers. Verify both `invSheet_('CountEntries')` and `invSheet_('PalletSubmissionJournal')` resolve to the staging spreadsheet. Never run the private writer until these checks pass.
6. Only after preflight, run the approved synthetic private-writer test in this staging project. Use unique `STAGING-` parent IDs and the synthetic session/location/product from Stage 52. Verify row counts and idempotency before introducing fault injection.

## Read-only staging preflight function (paste ONLY into staging project)

```javascript
function testStagingIsolationPreflight() {
  const stagingId = '1EaaGTFahbAdS3QqywFh4yeuXntCjL8ik1kZcQvqq2zo';
  if (INV_DB_ID !== stagingId) throw new Error('BLOCKED: not staging database');
  const counts = invSheet_('CountEntries');
  const journal = invSheet_('PalletSubmissionJournal');
  if (counts.getParent().getId() !== stagingId || journal.getParent().getId() !== stagingId)
    throw new Error('BLOCKED: sheet parent is not staging');
  const email = invEmail_();
  const users = invRows_('AppUsers');
  const matching = users.filter(x => String(x.Email).trim().toLowerCase() === email);
  const session = invSession_('STAGING-SESSION-001');
  const ref = invReference_();
  const report = {
    stagingOnly: true, signedInEmail: email,
    activeCounterReady: matching.length === 1 &&
      String(matching[0].Status).toLowerCase() === 'active' &&
      String(matching[0].Role).toLowerCase() === 'counter' &&
      String(matching[0].AssignedTeam).toUpperCase() === 'A' &&
      String(matching[0].TeamLocked).toLowerCase() === 'true',
    sessionOpen: String(session.Status).toUpperCase() === 'OPEN',
    stagingLocationPresent: ref.locations.some(x => x.LocationID === 'STAGING-LOC-001'),
    stagingProductPresent: ref.products.some(x => x.WSItemID === 'STAGING-FG-001'),
    countRows: counts.getLastRow() - 1,
    journalRows: journal.getLastRow() - 1
  };
  console.log(JSON.stringify(report));
  if (!report.activeCounterReady || !report.sessionOpen ||
      !report.stagingLocationPresent || !report.stagingProductPresent ||
      report.countRows !== 0 || report.journalRows !== 0)
    throw new Error('BLOCKED: staging prerequisites not ready');
}
```

This preflight performs **no writes**. If any prerequisite fails, stop and report the result. Never use the same test function in the production project.

## Follow-up

Once the separate staging project is created, record its script ID and the read-only preflight result in the handbooks. Then prepare and execute the controlled staging-only writer invocation; production remains untouched and employee Save disabled.


## Stage 56 — Phone-friendly standalone read-only preflight

The user has confirmed the separate staging Apps Script project and successful read-only connection. Correct staging Script ID: `1M_H1tAwaHvUB-B7q4ahoQ702rF29m7uPx4XjwbHQWdzMCv4pXfdkc2NP` (prior ID invalid). The following function works without copying production modules, and does not modify rows:

```javascript
function testStagingSafetyPreflight() {
  const id = '1EaaGTFahbAdS3QqywFh4yeuXntCjL8ik1kZcQvqq2zo';
  const ss = SpreadsheetApp.openById(id);
  if (ss.getId() !== id) throw new Error('BLOCKED: incorrect database');
  const headers = {
    AppUsers: ['Email','Role','Status','AssignedTeam','TeamLocked','UpdatedAt','UpdatedBy'],
    InventorySessions: ['SessionID','InventoryDate','Status','CreatedAt','CreatedBy','FrozenAt','FrozenBy','OriginalWSSnapshotID','UpdatedWSSnapshotID','Notes'],
    Locations: ['LocationID','Warehouse','Bay','LocationType','Active','SortOrder'],
    ProductIndex: ['WSItemID','ItemName','ClassOfMaterial','Barcode','UnitsPerCase','DefaultUOM','Source','SourceUpdatedAt','Active'],
    CountEntries: ['EntryID','SessionID','Team','LocationID','WSItemID','UOM','Quantity','ParentEntryID','PalletMultiplier','EnteredBy','EnteredAt','EntryMethod','Notes','Status'],
    PalletSubmissionJournal: ['ParentEntryID','SessionID','Team','PayloadHash','State','UpdatedAt']
  };
  const rows = {};
  for (const [name, expected] of Object.entries(headers)) {
    const sheet = ss.getSheetByName(name);
    if (!sheet) throw new Error('BLOCKED: missing tab ' + name);
    const actual = sheet.getRange(1, 1, 1, expected.length).getDisplayValues()[0];
    if (actual.join('|') !== expected.join('|')) throw new Error('BLOCKED: header mismatch in ' + name);
    rows[name] = sheet.getLastRow() - 1;
  }
  const read = name => {
    const sheet = ss.getSheetByName(name);
    const n = sheet.getLastRow() - 1;
    if (!n) return [];
    return sheet.getRange(2, 1, n, headers[name].length).getDisplayValues()
      .map(values => Object.fromEntries(headers[name].map((key, i) => [key, values[i]])));
  };
  const email = String(Session.getActiveUser().getEmail() || '').trim().toLowerCase();
  const users = read('AppUsers').filter(x => x.Email.trim().toLowerCase() === email);
  const ready = users.length === 1 && users[0].Role.toLowerCase() === 'counter' &&
    users[0].Status.toLowerCase() === 'active' && users[0].AssignedTeam.toUpperCase() === 'A' &&
    users[0].TeamLocked.toLowerCase() === 'true';
  const session = read('InventorySessions').filter(x => x.SessionID === 'STAGING-SESSION-001' && x.Status.toUpperCase() === 'OPEN');
  const location = read('Locations').filter(x => x.LocationID === 'STAGING-LOC-001' && x.Active.toLowerCase() === 'true');
  const product = read('ProductIndex').filter(x => x.WSItemID === 'STAGING-FG-001' && x.Active.toLowerCase() === 'true');
  const report = { database: ss.getName(), signedInEmail: email || '(unavailable)',
    activeCounterReady: ready, sessionOpen: session.length === 1,
    locationReady: location.length === 1, productReady: product.length === 1,
    countRows: rows.CountEntries, journalRows: rows.PalletSubmissionJournal };
  console.log(JSON.stringify(report));
  if (!report.sessionOpen || !report.locationReady || !report.productReady ||
      report.countRows !== 0 || report.journalRows !== 0)
    throw new Error('BLOCKED: staging preflight failed');
  if (!ready) console.log('AUTH SETUP PENDING: staging AppUsers must match signed-in email');
}
```

Run only inside corrected staging Script ID. This is a preliminary safety preflight; it does not establish source-code isolation or authorize writer testing.
