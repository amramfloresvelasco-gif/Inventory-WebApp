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
