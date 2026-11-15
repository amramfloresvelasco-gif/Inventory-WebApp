# Legacy Inventory Code Audit — 2026-11-15

## Scope and safety
Read-only inspection of supplied Apps Script backend, HTML modal, repair script, and legacy Inventory Log Template. The `main` repository currently contains `README.md` and `docs/` only; no app source or deployment yet. Do not modify the working workbook. This audit distinguishes observed behavior from proposed improvements.

## Confirmed working patterns to preserve
- Modal fetches validation lists once at startup (`getValidationLists`) and filters warehouse → bay → location client-side.
- Product lookup uses an in-memory ID-to-item object built from `Fixed Data!P:S`; manual name search supported.
- `submitData` protects writes with `LockService.getScriptLock()`, assembles 20-column rows and writes them with one `setValues` call.
- Finished goods case + bottle entry generates parent and child IDs; uppercase location/name/UOM composite key.
- Entries retain count type, warehouse, bay, UOM, user, timestamp, entry method, notes, and completion state.
- Repair engine identifies incomplete parent/child families by `App_Internal_ID`, verifies family completeness, and avoids blindly duplicating existing children. Auto repair has a 3-minute age threshold and a maximum of 20 families per run.
- Historical data already exists in workbook log and archived log copies, but no cross-inventory history import or session-date schema has yet been verified.

## Performance and correctness issues to address before porting
1. `buildItemMap()` reads `Fixed Data!P4:S(lastRow)` **on each** lookup. `Fixed Data` has ~50,500 grid rows, so this can become a costly repeated scan. New app should fetch compact product index once per session and cache versioned data; verify actual lastRow/data density.
2. `lookupItemIDFromManualName()` linearly scans every map entry; build a normalized name index once.
3. `lookupLocationReferences()` scans `Fixed Data!A:C` on each submission; use the preloaded 138-location dictionary, with server-side validation.
4. `searchAllEntries()` reads the entire `Inventory Log` each time; build session/location/product indexes and query only needed rows or compact snapshot data.
5. `markScriptFinishedByIDs()` reads the entire ID column; the repair engine also performs full-log reads. Preserve crash recovery but replace repeated full scans with bounded recovery queue and immutable entry IDs where practical.
6. `updateEntry(data)` trusts a client-supplied spreadsheet row and performs direct changes; new app must enforce server-side identity, ownership/admin rights, session state, immutable frozen counts, and audit trail.
7. Existing `submitData` accepts client-provided item name/class/count type; new app must resolve authoritative IDs and team assignment server-side, and prevent double submissions with idempotency keys.
8. Legacy `Uniquekey` omits session and team; the new schema needs `SessionID + Team + Location + ProductID + UOM` to prevent collisions across inventories and support history.
9. Distinguish UI responsiveness from actual server latency. Benchmark scan lookup, save, history lookup, map refresh and concurrent Team A/B counting with instrumentation.

## Initial implementation design
- Google Sheets database, Apps Script web app, GitHub `main`; no external database.
- Proposed tables: `InventorySessions`, `AppUsers`, `Locations`, `ProductIndex`, `CountEntries`, `CountEntryAudit`, `LocationStatus`, `WSSnapshots`, `WSRows`, `Reconciliation`, `HistoricalProductLocations`, `OwnershipExclusions`, `SyncStatus`.
- Store session-specific immutable snapshot IDs, location-level historical counts, and original versus updated WS snapshots separately.
- Keep product reference cache compact and versioned; avoid a round trip per scan. Batch writes; ensure idempotency and lock protection.
- User's BMD ownership exclusions apply **only** to Report 2 additional sections (blending ingredients, tanks/vessels, barrels), never physical counting or Report 1.
- Phase 1: implement read-only source audit and reference schema, then isolated test spreadsheet and first scan/save flow. Do not change SPIRITS or legacy workbook.

## Not yet verified
- Full AppSheet configuration and triggers, editor HTML file, actual runtime benchmarks, barcode mappings, exact inventory session boundary semantics, permissions, and existing historical inventory availability.
