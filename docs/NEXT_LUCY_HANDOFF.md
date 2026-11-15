# NEXT LUCY — Read First

**Last updated:** 2026-11-15  
**Repository:** https://github.com/amramfloresvelasco-gif/Inventory-WebApp  
**Branch:** main  
**Stop point:** Initial project documentation committed; Phase 1 UI requirements gathering continues. No app implementation or deployment yet.

## Project
Build an independent, fast, mobile-first Inventory Web App. Reuse enriched **Finished Goods**, **Raw Materials**, and **active Warehouses** master data from SPIRITS (formerly V4), **not** its heavyweight production engines. Inventory owns **Locations**, **Counts**, **History** and other app-specific tables. WS supplies official quantities later for reconciliation.

## Most recent confirmed rule
**Pallet multiplier defaults to 1.** An unchanged multiplier creates one case entry. Finished Goods may submit cases **and loose bottles simultaneously**. Example: 5 full pallets × 100 cases + one partial pallet of 50 cases + 4 loose bottles = **7 distinct records** (five 100-case, one 50-case, one 4-bottle) totaling 550 cases + 4 loose bottles. Each record needs a unique ID and common submission reference; bottles are not multiplied.

## Confirmed entry workflow
- Select **Blue Team** or **Green Team**.
- Scan a location barcode; alternatively select **active Warehouse → Bay → Location** using dependent dropdowns.
- Scan product barcode to find it in the shared master data; alternatively select **Packaging** or **Finished Goods**, followed by dependent product dropdowns.
- Mark **Location Empty** or **Item Not Counted**. The latter means items at the location are outside inventory scope; it is not an ordinary zero count.
- Enter quantities by case/pallet, partial pallet and loose bottle where applicable; add notes.
- Submit **& Stay in Location** or **& Change Location**. Confirm persistence before showing success.

## Resume action — do not restart discovery
1. Read [PROJECT_HANDBOOK](PROJECT_HANDBOOK.md) and [PROGRESS_LOG](PROGRESS_LOG.md).
2. Continue **Phase 1 user interface/layout discussion**, including fast direct-case input, handling several partial pallets and mobile display. Distinguish proposals from decisions. **Do not start implementing until user finishes specifying the screens.**
3. After layout approval inspect SPIRITS's actual master schemas and WS quantity source, then plan storage, concurrency and idempotency.
4. Record every approved requirement and verified milestone in the handbook, progress log and handoff, with commit hashes.

## Important context
User furnished an existing Inventory Data Entry screenshot and 3 legacy source files (Apps Script server, ModalEntry HTML/JS and manual/automatic repair engine) in the prior discussion. They are reference-only because the current system leaves incomplete entries requiring repair. Historical tab names include `Inventory Log` and `Fixed Data`. Do not assume those legacy tables are the new authoritative masters.

## Operating rules
Separate repo from SPIRITS. Prefer main branch. Avoid heavy or redundant RPCs and repeated spreadsheet scans. Protect concurrent writes and duplicates. Never claim app code, deployment, tests or benchmarks have been completed without verification.

## Latest clarification — Location database

User explicitly confirmed: **Packaging and Finished Goods are the existing SPIRITS databases**, not Inventory copies. **Locations is a new table to create**; it does not exist yet. Warehouses remain sourced from SPIRITS (active only). Draft Location schema: stable ID, warehouse reference, Bay, Location, barcode, status — **not yet approved**. Next Lucy should discuss location structure/labels and barcode uniqueness before creating the table; verify actual SPIRITS master schema first.

## Latest barcode clarification

Existing physical locations already have names and printed barcodes. **Dry Goods/Packaging: 2D barcodes; Finished Goods: QR codes**, with potential future migration to QR everywhere. Do not redesign labels or generate new identifiers. Build scanner/lookup to accept both and separate decoded identifier from symbology. Ask for representative code samples and clarify whether the formats apply to product labels, location labels, or both before implementation. No database created yet.

## Most recent user answer

**Everything has a unique barcode.** Both products and physical locations should be resolved using their existing codes; no barcode redesign. Maintain internal IDs separate from barcode values. Next clarify where the existing warehouse/bay/location mapping can be imported from, then continue Phase 1 layout. No location table or code has been created yet.

## New requirement — Warehouse Inventory Progress Map

User shared a screenshot of **PULASKI BAY 1** showing the physical lanes and rack positions. In addition to creating the new Locations table, build a **visual map** following that physical arrangement. **Confirmed status colors:** neutral/uncolored = not started, yellow = one team started, red = Blue/Green counts mismatch, green = Blue/Green counts match 100%. Each location cell should link to a unique location ID/barcode. Do not infer that the screenshot alone supplies complete importable coordinates.

**Immediate open design issue:** define when a team is considered finished at a location; recommend a Finish Location action to avoid premature mismatch when a team has submitted only some items. Compare aggregated product quantities, not number of pallet rows. Ask user whether they can share the editable spreadsheet/layout source. No code or map created yet.

## Confirmed correction — NO Finish Location

The user **does not want a Finish Location action**. The group is small; employees tell the supervisor verbally when finished, and the supervisor examines map mismatches then. Map statuses update automatically from submissions: neutral none, yellow one team, red both teams' current totals differ, green both teams' current totals match 100%. Red can be provisional while counting continues. Do not add completion workflow without a new request. This supersedes the earlier proposed Finish Location action.

## Latest confirmed requirements and verified data source

User supplied the actual legacy Google Sheet: https://docs.google.com/spreadsheets/d/13TdeoVaNFGD8E-eEREhuW1QBhzg1QtDFSWkeKQXs5rQ/edit . Connector verified `Fixed Data!A:C` headers **Location, Warehouse, Bay** and tabs **Lynnville Map** and **Pulaski map**, with existing location labels/layout and status listings. Source workbook must remain unchanged during migration.

**New required module: Location Management** — create, edit, mark locations active/inactive. Inventory must own a new Locations master seeded from `Fixed Data!A:C`; active warehouses still come from SPIRITS. Historical counts retain inactive location references. Confirm where exact location barcode payloads are stored, validate uniqueness and plan map layout import before implementation. No new database/module created yet.

## Latest user requirements — record identifiers and location lock

Legacy Inventory Log has 20 columns: Count, Location, Warehouse, Bay, Item Name, Item ID, Qty, UOM, Class of material, User, Timestamp, Uniquekey, Notes, App_Internal_ID, Extra_Bottle_Qty, Entry_Method, Change_Location_Next, No Count, Multiplier, Script Finished. User clarified **Uniquekey = location/item/UOM comparison grouping key** and **App_Internal_ID = unique ID of an individual entry**. Preserve distinct purposes. Proposal (not yet approved): stable-ID comparison key, per-row UUID, SubmissionID for one submit, InventorySessionID for an inventory event.

User confirmed **temporary UI location lock**: while counting 10 items in location X, keep location selected across submissions; release the lock to select another location. This is not a server/database lock. Confirm interaction with existing Submit & Stay/Change Location buttons before implementing. No code written yet.

## Latest decision — Submit and parent-child IDs

User approved **single Submit button plus Lock/Unlock Location**; no separate Submit & Stay/Change buttons. User wants the existing system-generated parent-child `App_Internal_ID` convention retained: parent `55dsgh`, children `55dsgh-A`, `55dsgh-B`, etc. One submission can create many physical count records; parent-child relationship is for auditing/recovery and **must not add to inventory quantity**. Proposed representation: one parent submission metadata record, seven child count rows for 5×100 cases + 1×50 cases + 4 bottles. Clarify if the first physical count row must use the unsuffixed parent ID as in legacy implementation. `Uniquekey` remains independent for comparison. No app code yet.

## Latest discussion — entry edits/deletions

User proposed either moving edited/deleted entries to an archive tab, or adding `Valid` flag to preserve originals and creating replacement rows for edits. Assistant recommends **`Valid` flag + append-only audit log**, invalidating old entries, creating corrected new IDs, linking replacements, and excluding invalid rows from totals/maps. For pallet submissions, allow editing one child or entire family. **Not yet explicitly approved**; ask user before finalizing. No code written.
