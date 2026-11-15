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

## Confirmed strict edit scope

When editing a submission, **do not permit adding new child records or changing their type**. Example: five 100-case pallet records may have their five quantities corrected, but user cannot add bottles or a sixth pallet within Edit; additional counts use New Entry. Any versioned replacement must map one-to-one to corrected original child records. The earlier permissions question (own entries vs anyone on team) is still unresolved; user responded with edit scope instead. Valid flag + audit log was recommended but not yet explicitly approved.

## CRITICAL: blind inventory permissions confirmed

**Each employee sees only entries personally submitted by them and can edit/delete only those entries.** No visibility into other employees' counts, including same-team members, or Blue/Green team totals, matches, mismatches or supervisor map. Enforce server-side authenticated ownership on all reads/writes; client filtering alone is insufficient. Supervisor map/reconciliation is a separate authorized role. Preserve edit limit to existing child records only. User authentication and supervisor roles need design/verification. This is a firm user requirement, not a suggestion.

## Latest auth decision

Use **Google Workspace login**, including `@bsb.com`, `@bigmachinedistillery.com`, and other group domains. No custom username/password. Recommend configurable authorized domains and explicit authorized users/roles; do not grant blanket access based solely on domain without approval. **Test actual Apps Script deployment identity behavior** before coding blind inventory; `Session.getActiveUser().getEmail()` may be blank depending on deployment and cross-domain execution. Server-side per-user ownership remains mandatory. This is design documentation only.

## Latest confirmed team access rule

Admins **grant access to the app only**. Authorized employees choose **Team A or Team B** themselves; no permanent administrator team assignment. This supersedes prior admin-team assignment proposals and the earlier Blue/Green names (two independent counting teams). Keep team on each entry; employee can only see/edit/delete their own entries. Suggested team lock during a count session is pending user approval. No code written.

## Latest confirmed Phase 1 boundary and team lock

**Phase 1:** accurate blind inventory counting by Team A and Team B; supervisor comparisons/maps are internal count validation. **Phase 2:** reconciliation against Whiskey Systems (WS). Do not conflate team-to-team count comparison with WS reconciliation.

Authorized users may switch teams **within the same inventory event**, but the current Team A/B selection is locked until they press **Unlock Team**. They choose another team and lock it again. Team lock is separate from the location selection lock. Each entry records its actual team at save time; switching must not alter earlier records. Prompt for unsaved data on team switch is proposed safety behavior, not explicitly confirmed. No implementation yet.

## Latest requested feature: voice recognition

User wants **Voice Entry in Phase 1**, allowing spoken location/product/pallet quantity, e.g. `Location PRA-L1-C4 5 pallets Pickers 1lt with 100 cases each`. Intended five separate 100-case child rows under one submission. Proposed mic tap-to-speak, speech-to-text to structured form, master-data validation and explicit confirmation, same save/ownership logic as manual entry. Support location-only or count-only phrases; respect locked team/location. Test browser support, warehouse noise, ambiguous barcodes/products, microphone permissions. No code implemented. The example location is not verified as a valid existing code.

## Voice Entry refinement: separate context-specific controls

**Location mic**: accepts only location code; resolve against location master. **Product mic**: accepts product/quantity/pallet details for current location, including spoken `keep location`. User example `3 pallets Pickers Original 1lt 100 cases each 1 partial pallet 20 cases keep location` -> 3 child records of 100 cases and one child of 20, total 320 cases, same selected location. Explicit preview/confirmation, no silent guessing, no code yet. Preserve independent team/location locks. This supersedes a generic all-fields voice command as the primary UX.

## Latest voice command: change location after saving

Example `5 pallets Pickers Original 1lt 100 cases each 1 partial pallet 20 cases new location` => **6 child count rows**, five at 100 cases, one at 20 cases, total **520 cases** for current location. Both `new location` and `change location` signal next-entry behavior: **after confirmed successful save**, clear/unlock location so next count can select another. Do not alter current record's location; on failure preserve form and location. `keep location` retains location instead. Team unchanged. No code yet.

## Latest voice recognition challenge: alias and attribute matching

Official example `Borchetta Bourbon #473 2025 750mL/6pk`; spoken example `Borchetta Bourbon Racecar 2025 473 20 cases`. Resolve spoken product to **existing SPIRITS SKU ID** using normalized official name, approved voice aliases, and product attributes (release #473, year 2025, volume/pack where available), with `20 cases` as quantity, not product name. User wants this kind of tolerant recognition. Do not invent alias or assume unique SKU; require confirmation/disambiguation if needed. Proposed admin-approved product-ID-linked voice alias metadata; no implementation.

## Mandatory voice review (confirmed)

After voice input, **display the recognized spoken text and interpreted entry on screen**. Employee must explicitly press **Save** or **Cancel** before any database write. No automatic submission or speech-only bypass. Save validates/commits, Cancel discards; if `new location` was spoken, clear/unlock only after verified successful Save. This is a hard requirement. No code yet.

## Latest hard performance target

User benchmark: existing AppSheet/legacy script inventory entry **<4 seconds**. New Inventory App Phase 1 must target **<4s** for comparable entry workflow, particularly voice. Do not claim met until real device/warehouse testing. Voice still requires transcript preview and employee Save/Cancel; track **human review time separately** from controllable app latency. Proposed subtargets: location/product lookup <0.5s each, speech-to-preview <2s, save-to-verified acknowledgment <2s. Optimize by preloading masters and batching all child pallet records in one idempotent save call. Log end-to-end timing and stages. Never bypass verification for speed.

## Latest discussion: Admin discrepancy dashboard

User supplied screenshot of existing count comparison sheet (Location, Item Name, UOM, Warehouse, Bay, Count 1, Count 2, Match, Helper Column). Wants an **admin module** to monitor Team A vs B discrepancies during Phase 1. Suggested live supervisor-only summary and filterable comparison table; aggregate valid child entries by InventoryEventID+LocationID+ProductID+UOM and team. Distinguish **Match**, **Mismatch**, **Pending other team**; missing count != 0. Respect blind employee access; WS comparison remains Phase 2. Screenshot's visible sample rows are mostly matches; example mismatches shown in discussion are illustrative only. No code yet.

## Important correction about existing reconciliation sheet

The user explicitly says the existing Team A/B reconciliation spreadsheet **is already live**, with `ARRAYFORMULA`, `VLOOKUP`, `QUERY`, `MAP`, etc. Do not call it manual or assume live status is new functionality. Before changing comparison logic, inspect actual formulas and dependency chain, preserve parity and measure performance. Admin module still at design stage.

## Latest user instruction: listen to discrepancy logic first

User is explaining how the existing **live formula-driven** Team A/B discrepancy process works. They want formulas revisited to identify possible improvements, **not** an immediate decision to keep Sheets or migrate logic. Let them explain, inspect actual formulas/dependencies when appropriate, then propose alternatives grounded in observed rules. No Admin module implementation yet.

## Latest admin map requirement

Click any colored warehouse map location to explain its status. **Red:** show Team A and Team B **aggregated counts side by side**, broken down by product/UOM; e.g. A=100, B=99 regardless of how many entries each employee/team made. Compare valid child-row totals, not entry counts. Identify discrepant products. Keep supervisor-only; employees cannot see other users' counts. Existing neutral/yellow/red/green semantics apply; exact treatment of a team omitting a product while counting the location needs further discussion. No code yet.

## Latest confirmed live map state machine (supersedes prior pending interpretation)

Neutral: no team counted. Yellow: only one team has counted location. **As soon as both teams have at least one valid count**, compare their full aggregated product/UOM count maps. Any discrepancy (including product counted by only one team) => **red immediately**, even while the second team is still counting. Exact match across all counted products => **green**. Recalculate continuously; green may become red after edits/new entries. No Finish Location button. Example: A counts five products => yellow; B starts with two => red; B eventually matches all five => green. This is explicitly confirmed by user; do not reintroduce waiting-for-completion status. No code yet.

## Latest Admin UI requirement: map plus separate table

Admin needs **two complementary modules/views**: interactive color-coded map with click-for-aggregated discrepancy detail, AND a spreadsheet-like reconciliation table based on screenshot with combined **location, item, match** filters. Include Team A/B aggregate totals per event+location+product+UOM and relevant warehouse/bay columns. Both must share comparison logic and be admin-only. Do not substitute map for table. No code yet.

## Latest question: FG identifiers

User asked what identifier to use for Finished Goods when Dry Goods use Item ID. Assistant recommended existing stable **SPIRITS Finished Goods Product ID**, not names, for inventory/reconciliation; verify actual master schema and stable uniqueness before coding. This is a recommendation, not yet confirmed by user.

## Latest verified source: Finished Goods IDs exist

Read connected live `BMD V4 — Database` Google Sheet `1fll-r__z9DWWehswc-eaOyYMuO2zdFoWzksNqAtIZj8`. `Products!A` = **ProductID** (UUID-like); `Products!C` = ProductName; `Products!D/E` = SizeML/UnitsPerCase. `Releases` has `ReleaseID` col A, `WSMasterID` col D, `ProductID` col K, `ReleaseName` col L. Sample Pickers Blood Orange 1L/12pk ProductID `182df808-f768-4041-a1b4-5408ff68f821`. Therefore FG IDs do exist. Proposed Inventory FG key is ProductID, but inspect full product/release mapping to ensure distinct releases aren't collapsed; may need ReleaseID as counted SKU identity. Do not conflate with WS ID. No sheet changes.
