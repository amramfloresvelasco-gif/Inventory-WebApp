# Stage 51 — Isolated Pallet Writer Staging Plan

**Status:** Planning only. No staging spreadsheet has been created, no production writes are authorized, and employee multi-pallet Save stays disabled.

## Goal

Execute the actual Apps Script private writer and journal adapter against a separate staging spreadsheet, not the production BMD Inventory database. Validate durable PREPARED intent, physical child writes, read-back, retry and partial-failure handling.

## Required authorization and isolation

1. Obtain the user's explicit approval to create a separate Google Sheets staging database and write disposable test rows to it.
2. Keep production `INV_DB_ID` unchanged. Do **not** temporarily change the production constant or deploy a production endpoint pointing at staging.
3. Create a separate Apps Script test project or isolated test deployment that references a staging-only spreadsheet ID. Ensure its functions cannot open or write the production spreadsheet.
4. Provision staging tabs with the exact current schema needed by `invSavePalletFamilyPrivate_`: `AppUsers`, `InventorySessions`, `Locations`, `ProductIndex`, `CountEntries`, `PalletSubmissionJournal`, plus any dependencies required by `invReference_` or `invSession_`. Confirm exact headers from source before creating tabs.
5. Use synthetic identity, one OPEN session, one active location, and one synthetic finished-good product with valid UnitsPerCase. Never copy real inventory counts, employee identities or credentials.

## Staging test matrix

| Scenario | Expected journal | Expected count children |
|---|---|---|
| First submission | Exactly one PREPARED intent | All planned children, once |
| Identical retry | Same immutable intent, no append | No duplicate children |
| Modified retry | INTENT_CHANGED block | No writes |
| Failure before child write | PREPARED remains | Zero children |
| Retry after failed child write | Original PREPARED reused | All children once |
| Partial child write | PREPARED remains; ADMIN_REVIEW_REQUIRED | Incomplete children, no blind append |
| Duplicate journal parent | DUPLICATE_JOURNAL block | No writes |
| Unauthorized or unlocked team | Rejected before writes | No writes |

## Evidence and exit criteria

Capture staging spreadsheet ID, isolated Apps Script project ID, test timestamp, result/error logs, journal row count, CountEntries row count, child IDs and statuses. Compare expected child IDs and quantities. Check that the production journal retains only the approved Stage 41 audit row and production CountEntries row count is unchanged (read-only verification). Document results in all three handbooks. Do not activate employee multi-pallet Save without a separate authorization after tests pass.

## Known constraints

The current connected tools do not expose an Apps Script execute action. A human-run isolated Apps Script test may be needed. A mock test, production deployment success or direct Google Sheets connector write is not a substitute for the real isolated writer execution.
