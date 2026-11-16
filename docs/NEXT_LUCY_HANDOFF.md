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

## Latest requirement: bring WS Finished Goods ID

User says Finished Goods **must carry WSFinishedGoodsID too**. In existing SPIRITS `Releases`, `WSMasterID` is candidate external FG identifier; verify it maps to WS Finished Goods ID, rather than creating a redundant field. Keep internal ProductID/ReleaseID and external WSMasterID, as with Dry Goods MaterialID/WSRawMaterialID. No implementation yet.

## Latest correction: do not conflate WSMasterID with WSFinishedGoodsID

User specifically says they do **not believe WSFinishedGoodsID exists** and want it brought into FG records. Existing SPIRITS `Releases.WSMasterID` is **only a candidate**, not verified equivalent. Inspect actual Whiskey Systems FG data/identifier; if equivalent reuse mapping, if not add distinct mapped WS Finished Goods ID. Do not claim this is already done. No data edits yet.

## Latest correction: ReleaseID is probably obsolete

User says `ReleaseID` was discussed early then discarded and likely has no active role. Do not propose it as FG inventory key. Use `Products.ProductID` internally and identify actual WS Finished Goods ID from source; `Releases.WSMasterID` not yet confirmed equivalent. Audit source code/formulas for ReleaseID dependencies before deleting or changing legacy schema. No implementation yet.

## Latest confirmed scan/search identity rules

User: Dry Goods `WSRawMaterialID` and material name are two ways to select **the same item**. Finished Goods `WSFinishedGoodsID` and FG name must likewise resolve to **the same SKU**. Employees **never use or see internal SPIRITS IDs** (`MaterialID`, `ProductID`). These are backend-only. Canonical identity is used for Team A/B reconciliation irrespective of input mode. WS FG ID must still be found/verified and mapped. No code yet.

## 41. Live SPIRITS cross-database duplicate audit (2026-11-15)

Read-only audit of spreadsheet `BMD V4 — Database` (`1fll-r__z9DWWehswc-eaOyYMuO2zdFoWzksNqAtIZj8`), comparing trimmed, case-insensitive names/IDs. `Material Reference` has **710** records (columns Category, Material ID, Material Name); `Releases` has **228** records (WSProductName, WSMasterID); `Products` has **231** records (ProductID, ProductName). `Materials` has only its header, no records. All 710 raw and 228 release rows have IDs/names. Findings:

- **Cross-category ID collision:** `112370`: `Material Reference` row **518**, `Flavor Mango Nat. WONF`; `Releases` row **54**, `Borchetta Bourbon #497 2023 750mL/6pk`. This means a bare scanned ID is **ambiguous** if the ID namespaces are not proven distinct. Must ask to choose Raw Materials vs Finished Goods or otherwise disambiguate; never auto-assign.
- **Raw name collision:** `ZII Box BoBo` appears twice: raw row **390** ID `116972`, row **391** ID `128834`. No duplicate raw IDs.
- **FG Releases:** no duplicate `WSMasterID` and no duplicate `WSProductName` among 228 rows. No cross-category exact-name collision against raw.
- **SPIRITS Products:** three duplicate ProductName pairs with distinct ProductIDs: `Big Machine Double Spiked Citrus Peach 4 x 200mL/8pk` rows **21/229**; `Big Machine Double Spiked Coconut Breeze 4 x 200mL/8pk` rows **22/230**; `Big Machine Double Spiked Lavender Lemonade 4 x 200mL/8pk` rows **23/231**. No duplicate ProductIDs.

**Caveat:** `Releases.WSMasterID` is still not independently verified to equal official WS Finished Goods ID. Audit compares these currently populated source columns, not an independent WS export. No data changed. Recommend canonical identity including material category and verified external ID, and prompt user for ambiguous name/ID; audit duplicate ProductIDs before any cleanup.

### 2026-11-15 — User resolved WS-side duplicates; SPIRITS duplicates remain

User reports removing WS item ID `112370` from Whiskey Systems and renaming one of the two `ZII Box BoBo` items. These are **user-reported source changes**, not yet verified in refreshed SPIRITS snapshots; old spreadsheet reference may still contain stale entries. Three duplicate names (Citrus Peach, Coconut Breeze, Lavender Lemonade 4 x 200mL/8pk) were found in SPIRITS `Products` tab, not asserted to be WS duplicates. Investigate SPIRITS ProductID references before any deletion/merge. No app/database changes made.

### 2026-11-15 — Retired older Citrus Peach duplicate in SPIRITS

User authorized removal from active list after dependency review. Inspected `BMD V4 — Database` `Products` row 21 older `Big Machine Double Spiked Citrus Peach 4 x 200mL/8pk` (`ProductID=2e50b420-0af4-4a2a-98c6-5abfb5048eeb`, 8 units/case); no direct ProductID references found in inspected Releases, priority, PAR, production, BOM, inventory sheets. Newer row 229 (`ProductID=225d8069-c53a-4a24-bd7f-20e2d50c587e`, 32 units/case, proof 25) is linked in Releases row 207 and matches subtype units/case. **Changed only `Products!G21` from Active to Inactive**, verified readback; row 229 remains Active. Historical record retained; no row deleted. Note that subtype in `BrandReleaseTypes` row 90 is itself Inactive and not changed. Other two duplicate pairs not changed. Need ensure Catalog/Inventory filters inactive Products when presenting employee options; no code changes made.

## 42. Whiskey Systems duplicate watchdog — approved requirement (2026-11-15)

User requests ongoing **watchdog** for duplicate WS IDs or names. Proposed behavior: after each successful WS snapshot/import, check raw materials and finished goods separately for duplicate WS IDs and normalized names; check cross-category ID and name collisions; log conflict type, involved source records and rows, first/last seen, resolved state; show unresolved conflicts in SPIRITS notification bell; deduplicate repeat alerts; auto-clear only when a later successfully refreshed snapshot confirms resolution; never auto-delete or merge. Inventory App must not auto-resolve an ambiguous scan/name: require category/record selection. Normalize case/whitespace but preserve original values for display. Compare only authoritative WS snapshot fields; avoid treating SPIRITS-only Products duplicate names as WS-origin conflicts. **Implementation pending:** determine actual source feeds and snapshot completion hook, verified WS FG ID field, existing notification mechanism and exact cross-category namespace policy. No watchdog code deployed yet.

### 2026-11-15 — SPIRITS duplicate watchdog reported implemented

User confirms **SPIRITS Lucy already set up the duplicate-item notification alarm** in SPIRITS. Therefore Inventory App must **not implement a second duplicate watchdog**; SPIRITS is responsible for ongoing WS duplicate detection and bell notifications. Inventory consumes the curated SPIRITS product data for monthly counts. Keep a lightweight ambiguity safeguard at the scan/name selection boundary: if multiple candidate records still match, prompt for explicit selection, never guess. This is user-reported implementation status; no independent deployment verification performed here.

### 2026-11-15 — Phase 2 reconciliation workflow (user confirmed)

Once independent Team A and Team B counts match and the Phase 1 comparison is **all green**, treat their agreed physical inventory as the **official physical numbers** for Phase 2 comparison against Whiskey Systems (WS). Phase 2 compares official verified physical quantity against WS quantity; show matching items and discrepancies, with variance = physical minus WS. Proposed implementation safeguard: capture an immutable verified snapshot for audit before reconciliation, preserving both teams' original submissions and the WS comparison snapshot separately. Exact WS comparison granularity, cut-off timing and approval/locking workflow are still to be decided with user. No Phase 2 code implemented yet.

### 2026-11-15 — Phase 2 global reconciliation and dated freeze (confirmed)

User confirms: when Phase 1 Team A/Team B is entirely green, **freeze the official physical inventory for that inventory day**. Preserve immutable date-specific totals and original location-level count details for audit. **WS has no location granularity**; Phase 2 must aggregate physical counts across all locations to **global totals per canonical WS product ID and compatible UOM**, then compare with WS **global** inventory. Variance = physical minus WS; surface zero and nonzero variances and missing items from either side. Do **not** use warehouse/location as a WS reconciliation dimension. Proposed safeguard (not yet explicitly approved): capture a matching-cutoff WS snapshot so subsequent WS changes cannot distort that day's reconciliation. Pending detail: how to establish common cutoff time and WS snapshot version; no implementation yet.

### 2026-11-15 — Official WS snapshot can be manually replaced for frozen inventory date (confirmed)

User confirms the **physical inventory remains frozen for its inventory day**, but the **WS comparison snapshot must be replaceable** for that same date if the original scheduled download was incomplete or incorrect. Example: 2026-11-15 WS snapshot initially taken at 4:00 AM, later manual upload replaces it as the **official WS snapshot for 2026-11-15**. Phase 2 recalculates using the replacement against the *unchanged* frozen physical counts. Proposed implementation: supervisor/admin manual upload, schema/duplicate/quantity validation, atomic promotion of successful replacement to Official, prior version retained as Superseded with uploader/timestamp, failure leaves previous official unchanged; display current official version and its timestamp. Distinguish inventory business date from WS file capture time and upload time. User has not yet specified which WS snapshot columns or file format to accept; confirm later. No code implemented yet.

### 2026-11-15 — Phase 2 finished goods case-equivalent reconciliation (confirmed)

User supplied spreadsheet screenshot and specified a compact FG reconciliation table: **WS Cases | Physical Cases | Difference** for each finished good, with product identifier/name. Both sources may include full cases and loose bottles; convert bottles into fractional cases using the canonical SPIRITS product's actual bottles/units per case. Formula `equivalentCases = fullCases + looseBottles / unitsPerCase`; e.g. 6 bottles of a 6-pack = 1 case, 5 bottles of a 6-pack = 0.833333 cases, 5 bottles of a 12-pack = 0.416667 cases. Thus 1 WS case equals 6 physically counted loose bottles for a 6-pack. Difference = physical case-equivalents minus WS case-equivalents. Display two decimal places but **compare exact quantities (prefer integer base-unit bottles)** to avoid false mismatches due to rounding. Physical totals are global across all locations and use the frozen daily inventory; WS uses the replaceable official snapshot for that date. Retain original counts by UOM and conversion audit details; no extra bottle columns in main Phase 2 comparison. Note that package naming like `4 x 200mL/8pk` may imply 32 individual bottles; use verified units-per-case configuration rather than parsing name. Pending: verify WS snapshot case/bottle source columns and treatment of special FG packaging/UOM. No code implemented yet.

### 2026-11-15 — Phase 2 reconciliation statuses (confirmed)

Finished Goods global reconciliation table now requires columns: product, WS case-equivalents, frozen physical case-equivalents, difference (physical minus WS), **Match Status** (automatic `Match` / `Mismatch` based on exact units), and **Reconciliation Status**. When matched, reconciliation status is automatically `Match`. When mismatched, authorized reviewer selects either **`Explained` or `Unexplained`**; do not change underlying quantities when selecting. Recompute match on official WS snapshot replacement and reset to `Match` if discrepancy resolves. Preserve selections with inventory date, WS snapshot version, and reviewer/audit metadata; decide later whether prior explanations should carry over after a snapshot replacement (default safer to require re-review). No code implemented yet.

### 2026-11-15 — Final WS adjustment verification: baseline + frozen physical + updated WS (confirmed)

User clarified end-of-inventory reconciliation requires **three independently preserved values** for each canonical FG item: (1) **Original Official WS Snapshot** (baseline from inventory date, potentially corrected/replaced if original download was invalid), (2) **Frozen Physical Count** (Team A/B matched, global case-equivalent quantities), and (3) **Updated WS Snapshot** manually downloaded/uploaded *after* making adjustments in Whiskey Systems. Example All Mighty Shine 140 proof 375mL/12pk: baseline WS 32 cases, frozen physical 31, after adjusting WS download shows 31 -> final Match. If updated WS still differs, clearly flag outstanding mismatch. Main final table should show original WS, frozen physical, updated WS, final difference (physical minus updated WS), and final Match/Mismatch, while retaining earlier Explained/Unexplained classification/audit record. Finalization requires every product to match exact base units (including loose bottle conversions and missing items). Allow successive updated WS snapshots without overwriting baseline or frozen physical, retaining history/version/timestamp/uploader; do not confuse a replacement of an invalid **baseline** snapshot with a post-adjustment **verification** snapshot. No code implemented yet.

### 2026-11-15 — End-of-Phase-2 inventory valuation (user confirmed)

After Phase 2 reconciliation and post-adjustment WS verification, add **cost for all inventory items**, both Finished Goods and Raw Materials. **SPIRITS is the sole authoritative source of costs; never use Whiskey Systems prices**. Calculate final inventory value = verified final quantity × SPIRITS cost in the matching UOM, converting FG cases/loose bottles correctly and raw-material UOM as needed. Suggested output columns: item, final quantity, SPIRITS unit cost, extended inventory value; subtotals and grand total. Proposed safeguard (not yet confirmed): freeze the selected SPIRITS cost/version as of the inventory date to preserve historical valuation after price edits. Pending: confirm which SPIRITS cost field/calculation to use for Finished Goods (COGS per case?) and Raw Materials (vendor official/default cost?), and handling of missing/zero costs; do not invent or pull WS cost. Design only, not implemented.

### 2026-11-15 — Correction: unit cost only, no inventory valuation multiplication

User clarified final Phase 2 table needs **only the Unit Cost field** from SPIRITS for every item. Do **not** calculate or display extended inventory value (quantity × cost), subtotals, or inventory valuation grand total. Finished Goods show SPIRITS cost per case; Raw Materials show SPIRITS cost per configured UOM. This supersedes the preceding 'Inventory Valuation' proposal. Cost source remains SPIRITS, never WS. Exact SPIRITS cost calculation/field to use remains to be confirmed.

### 2026-11-15 — Finished Goods Unit Cost source confirmed

User confirms **Finished Goods Unit Cost = Total COGS per Case already calculated in SPIRITS** (the full SPIRITS COGS calculation, not a newly derived inventory valuation). Display as a single `Unit Cost ($/Case)` field in final Phase 2 reconciliation; **do not multiply by quantities** and do not show extended inventory values. Raw Materials remain cost per configured UOM from SPIRITS. Follow the existing SPIRITS COGS calculation, including its component rules; do not independently reimplement or infer cost from WS. Confirm exact API/data retrieval during implementation.

### 2026-11-15 — FG unit cost correction: liquid + dry goods only (confirmed)

User explicitly corrected previous FG cost definition: **Finished Goods Unit Cost for Inventory = SPIRITS liquid cost + dry goods cost per case ONLY**. **Exclude labor, taxes (including FET), freight, and overhead**. Do not use SPIRITS all-in Total COGS if it contains those excluded components. Read existing SPIRITS component costs and sum only liquid and dry goods; show one `Unit Cost ($/Case)` field, no multiplication by quantities. This supersedes earlier notes saying full Total COGS per Case. Raw Materials continue to use SPIRITS cost per configured UOM. Confirm precise SPIRITS fields/API when implementing; no code change made yet.

### 2026-11-15 — Extended Report 2 additional WS categories (user confirmed)

Report 1 remains inventory reconciliation export. Report 2 is an **extended BMD-only report** containing inventory reconciliation PLUS **Blending Ingredients**, **Tanks/Bulk Spirit**, and **Barrels**. These added categories are report-only and are **not physically counted** by the Inventory App.
- Blending Ingredients: sourced from the same official WS Raw Materials snapshot but normally filtered out of physical counting; include item name, official WS quantity, and unit cost from SPIRITS COGS.
- Tanks: source `Tanks Inventory LIVE` spreadsheet `1j0V6hyNx9AtvWWK_vDdNGQbTcqh1N-lyVFXzYtJFb9o`, `PasteLiveData` gid `214586892`. Confirmed headers include `Tank Name`, `Internal Spirit Type`, `WG`, `PF`, `PG`, `Owner`; report bulk liquid name, WS PG quantity, SPIRITS COGS cost.
- Barrels: source `Barrels Inventory LIVE` spreadsheet `1MySC8PghgC1z94lqmz-yWF9m_wKFbxpMoEvttprk83A`, `PasteLiveData` gid `1682009944`. Confirmed headers include `BarrelId`, `InternalSpiritType`, `OriginalPG`, `OriginalWG`, `OwnerName`; report barrels grouped by IST with barrel count and PG plus SPIRITS COGS cost. **Must verify which field represents current barrel PG**; `OriginalPG` cannot automatically be treated as current.
- **Hard requirement: include only BMD-owned items; exclude all co-packers from every section**. Owner/OwnerName are blank in some sampled records, so do not rely on BMD name prefix alone or assume blanks are BMD. Confirm reliable ownership mapping/filter before implementation; exclude ambiguous ownership until resolved.
- All costs from SPIRITS COGS, not WS monetary `Value` fields. No extra physical counts or changes to Phase 1/2. Source inspection completed for header/schema only; implementation pending.

### 2026-11-15 — Barrel PG basis confirmed

User confirms Extended Report 2 barrels must use **original proof gallons**, not current remaining gallons. Use the source `Barrels Inventory LIVE` `PasteLiveData` column **`OriginalPG`**, aggregate `SUM(OriginalPG)` by `InternalSpiritType` (IST) and show barrel count; filter strictly to BMD-owned barrels (no co-packers). Costs sourced from SPIRITS COGS, not WS. Preserve source snapshot date and do not substitute current-volume fields.

### 2026-11-15 — Initial locations and configurable BMD ownership exclusions

User supplied initial location master with Warehouse/Bay mapping. **Pulaski Bay 1 (100 locations):** PRA C1-C6 L1-L4 (24), PRB C1-C6 L1-L4 (24), PRC C1 L1-L3 (3), PRD C1-C2 L1-L2 (4), PRE C1 L1-L4 / C2 L1-L3 / C3 L1-L4 / C4 L1-L3 (14), PRF C1-C2 L1-L3 (6), `LANE PA` through `LANE PX` (24), `Temporary Location` (1). **Lynnville (38 locations):** Bay 1: LRA C1 L1-L2, C2 L1-L4, C3 L1-L4, C4 L1-L2 (12); Bay 2: LRB C1 L1-L4 (4), LRC C1 L1-L2 (2), `LANE LA` through `LANE LJ` (10); Bay 3: `LANE LK` through `LANE LT` (10). **Total 138 locations**. Preserve original human-readable location codes and Warehouse/Bay assignments. This is a starting list, not an exhaustive future limit. Map and selectors should use a location master table.

**BMD ownership exclusion rule:** exclude records whose names contain prefix/suffix `JYP`, `OTS`, `Dios`, or `SCG`, case-insensitive, for all categories including dry goods, finished goods, blending ingredients, IST, tanks, and barrels. Build an editable `OwnershipExclusions` table so future tokens can be added without code changes. Apply to eligible inventory selection and BMD-only extended report. Clarify matching boundaries to avoid false positives in unrelated names; do not treat these text rules as proof of ownership if other explicit owner fields conflict. Keep excluded records traceable for audit. No app code implemented yet.

### 2026-11-15 — Access, hosting, and test-data decisions

User confirms Inventory Web App will be hosted with **Google Apps Script + Google Sheets**, as an **independent** app from SPIRITS. Build an administrator/counter access table (`AppUsers` proposed) keyed by Google Workspace email, with role (Administrator or Counter), active status, and existing Team A/B selection/lock rules; do not pre-populate people without user authorization. Administrator manages access. Test strategy: use isolated **copies of existing SPIRITS/WS snapshots and location/product mappings**, plus synthetic counting sessions, never write to production SPIRITS or official WS source snapshots. Remove/segregate test counts before official inventory; test source data does not require new user-supplied files yet. No implementation performed.

### 2026-11-15 — Ownership exclusion matching clarified with examples

User provided positive BMD examples: `BMD Products Borchetta Bourbon #292 2022 750mL/6pk`, `Pickers Original Vodka 1L/12pk`, `BMD BBRC 2025 Cork 750ml`, `BMD BB SingleBarrel LabelNeck 750ml`, `BMD GEN RUM - RUM (BASE)`, `BMD BB WHISKEY - SMALL BATCH (BT) (80 PF)`. Non-BMD examples: `JYP OTS Explorer002 Box 750ml`, `JYP OTS Finish Seekers 750mL/6pk 110PF`, `JYP OTS Whiskey - Bourbon 2019 (80%Corn)`, `JYP OTS Whiskey - Bourbon 2005 (84% Corn) (100-160 pf)`, `Dios Azul Anejo 750mL/6pk 80PF`.

Implement case-insensitive **whole code/word token** exclusion for configurable `JYP`, `OTS`, `Dios`, `SCG` (e.g. `OTS` separated by spaces/punctuation), **not substring matches within unrelated words**. Presence of `BMD` is not mandatory: `Pickers Original Vodka` is BMD. Exclusion applies to all item categories, ISTs, tanks, barrels, physical count eligibility, and extended report. Exact owner fields, if reliable, should be checked to avoid accidental inclusion; review ambiguous records. This clarification supersedes ambiguous 'contains prefix/suffix' wording in prior notes.

### 2026-11-15 — CRITICAL SCOPE CORRECTION: Ownership exclusions ONLY Extended Report 2

User explicitly corrects prior documentation: configurable case-insensitive whole-token exclusions (`JYP`, `OTS`, `Dios`, `SCG`) apply **ONLY to the extra sections of Extended Report 2**: blending ingredients, tanks/bulk spirits/vessels, and barrels grouped by IST. **DO NOT apply these exclusions to physical inventory counting, product selection, Team A/B counts, location comparisons, WS reconciliation, or Report 1.** Prior notes asserting filtering for all inventory categories or physical count eligibility are superseded and must not be implemented. Preserve the same token-boundary matching behavior within the extended-only scope. Other report sections should retain their existing inventory/reconciliation scope unchanged.

### 2026-11-15 — Performance-first architecture and historical inventory lookup

User emphasizes **timing is crucial**; choose storage/indexing/caching architecture based on measured performance, not merely ease of Google Sheets setup. Hosting remains Google Apps Script, but benchmark read/write and historical queries before final storage decision. Avoid per-scan SPIRITS/WS network round trips; use locally cached/indexed reference data with controlled refresh, and keep write operations durable. Separate Inventory data from SPIRITS operational database.

**New Phase 2 reconciliation feature:** when viewing an item, retrieve prior inventory dates and show historical **original official WS quantity, frozen physical quantity, initial difference**, plus updated WS snapshot/final difference when available. User should be able to select previous inventory dates; current data must remain distinct.

**New Phase 1 physical counting feature:** show the selected item's **previous inventory locations and quantities** (historical location-level physical records) as read-only guidance. Do not copy historical counts into current counts; retain exact prior locations and UOM, and allow comparison. Efficient indexed product/date lookups; avoid loading all historical rows on each scan. Preserve historical sessions, snapshots, and location records permanently for these features. These are requirements, not implemented yet.

### 2026-11-15 — Google-native architecture and existing fast workbook confirmed

User says their existing primitive inventory workbook (built with Google Sheets, Apps Script, modals, and AppSheet) already performs virtually instantly. **Keep Inventory Web App hosted in Google Drive / Google Apps Script / Google Sheets**, do not introduce an external database as a presumed performance improvement. **Audit and reuse proven existing workbook patterns** where appropriate; prioritize scan/save responsiveness and measure end-to-end latency. Proposed performance goals (not guaranteed): barcode lookup ~<1s, save <2s, location switch near-instant, historical lookup <2s, map updates <2s. Avoid redundant RPCs, broad range reads, and per-scan SPIRITS calls. Existing workbook is evidence of feasibility, not a guarantee that a new implementation will automatically match performance. Ask user for exact workbook link only when necessary to inspect its actual code/workflow.

### 2026-11-15 — Existing Inventory Log Template inspected directly

User had already supplied working legacy workbook: `Inventory Log Template`, spreadsheet `13TdeoVaNFGD8E-eEREhuW1QBhzg1QtDFSWkeKQXs5rQ`, link `https://docs.google.com/spreadsheets/d/13TdeoVaNFGD8E-eEREhuW1QBhzg1QtDFSWkeKQXs5rQ/edit?gid=1789587392`. Read-only Google Drive inspection confirms tabs: `EnterData` (scan/count form), `Inventory Log` (Count, Location, Warehouse, Bay, Item Name, Item ID, Qty, UOM, Class of material, User, Timestamp, Uniquekey, Notes, App_Internal_ID, Extra_Bottle_Qty, Entry_Method), `1VS2` (count comparison), `CountsvsERP` (WS reconciliation), `1stCount`, `2ndCount`, `Fixed Data` (locations and raw/FG references), `Locations Match`, `Inventory User State` (User, Count, Warehouse, Bay, Location), `WSFRM`, `WSFFG`, `Lynnville Map`, `Pulaski map`, and archived log copies. Sample records show `Case`, `Bottle`, `Each` UOM, location-level first/second counts, and FG extra bottle quantity. Existing workbook has live 2026 records; **do not modify it** while auditing. Use its schema and map layouts as reference; still need to inspect underlying Apps Script and AppSheet implementation separately, which is NOT yet verified. User previously supplied this exact URL; do not ask again.

### 2026-11-15 — Legacy Inventory source code supplied (3 files)

User uploaded three complete legacy source files in this conversation: `Pasted text(9).txt` (~1162 lines; Apps Script backend), `Pasted text (2)(2).txt` (~1273 lines; HTML/JS modal entry), and `Pasted text (3)(1).txt` (~1791 lines; manual/automatic repair engine). These are source references for implementation, not yet copied into the repo. Backend exposes `onOpen`, `showModalForm`, `showEditorSidebar`, `getDriveImageAsDataUrl`, `buildItemMap`, `lookupItemNameAndClass`, `lookupItemIDFromManualName`, `getValidationLists`, `lookupLocationReferences`, `searchAllEntries`, `getUOMOptions`, `updateEntry`, `submitData`, `processInventoryChange`, `executeMultipliers`, and child-ID/finished helpers. Modal handles warehouse/bay/location cascading, scan/manual lookup, case+bottle entry, status flags, and submit modes. Repair engine handles `App_Internal_ID` parent/child families, missing rows, multipliers, and `Script Finished` flags, with `autoRepairIncompleteInventory`. Key reusable patterns: batch read/write, `LockService`, stable parent-child IDs, local location filtering, idempotent repair. **Audit all code before reuse**, especially potential costly whole-sheet reads, permission checks, duplicate handling, and consistency. Legacy `Inventory Log Template` is still live and must not be modified. User has now provided the scripts; do not ask for them again. Current task is source audit and development planning; no app code deployed yet.

### 2026-11-15 — Phase 1 legacy source audit completed

Inspected uploaded backend, modal and repair code, and repository root. Created `docs/LEGACY_CODE_AUDIT.md` on main (commit `fd1860dd203f62b402ef48dc52420595e07fd8e4`). Repo currently has README + docs, no app source. Reusable: startup validation-list preload, client-side location filtering, batched 20-column submit under ScriptLock, parent/child IDs, idempotent repair patterns. Issues to solve: per-lookup full `Fixed Data!P:S` scan, linear name lookup, per-submit full location scan, full-log reads for searches/repair, client-supplied row editing without verified server authorization, client-trusted product/team values, and missing session dimension in composite key. Proposed indexed/versioned compact reference caches, session-specific immutable history, original/updated WS snapshots, audited edits and idempotency keys. This is **documentation/audit only**; no app source, database, or deployment created yet. Next: implement isolated Google-native foundation, after verifying schema and testing access; never touch working legacy workbook or SPIRITS production data.

### 2026-11-15 — Explicit workbook separation (user correction)

**We are creating a BRAND-NEW Google Sheets workbook** as the Inventory Web App's operational database, with a new standalone Apps Script web app. The supplied `Inventory Log Template` workbook (`13TdeoVaNFGD8E-eEREhuW1QBhzg1QtDFSWkeKQXs5rQ`) and its uploaded Apps Script/HTML/repair code are **READ-ONLY REFERENCE MATERIAL ONLY**. Never write new app tables, test data, scripts, migrations, or deployments into the legacy workbook. New counting, locations, users, historical sessions, snapshots, and reconciliation live in the new workbook. SPIRITS V4 and WS sources remain read-only for this project. Work on GitHub `main`. Next task is to create the new workbook and foundational schema, not modify the old file.

### 2026-11-15 — NEW Google Sheets Inventory database CREATED (Phase 1)

**Created separate native Google Sheets workbook:** `BMD Inventory — Database`, ID `12teaGz7z2Ems-Elqz5vHv1Z8S5aV4kJMJrnBxlMYQ5Y`, URL https://docs.google.com/spreadsheets/d/12teaGz7z2Ems-Elqz5vHv1Z8S5aV4kJMJrnBxlMYQ5Y/edit . This is the new operational database; the legacy workbook is untouched. Verified 14 tabs: `InventorySessions`, `AppUsers`, `Locations`, `ProductIndex`, `CountEntries`, `CountEntryAudit`, `LocationStatus`, `WSSnapshots`, `WSRows`, `Reconciliation`, `HistoricalProductLocations`, `OwnershipExclusions`, `SyncStatus`, `AppConfig`. All have headers and frozen header row. Populated **138 Locations**: Pulaski 100, Lynnville 38; verified location header/sample rows. Seeded extended-report-only exclusion tokens JYP, OTS, Dios, SCG. `AppConfig` includes schema version 1 and read-only source IDs. No inventory count data, user accounts, WS snapshots, or SPIRITS source data imported yet; no Apps Script project/deployment yet. **Next:** implement GitHub Apps Script backend with read-only initialization, validated product/location lookup, secure user/team access, and batched idempotent count write; create new standalone Apps Script project/deployment separately. Never write to the legacy workbook or SPIRITS source.

### 2026-11-15 — Initial Inventory Apps Script code committed on main

Created `src/Code.gs` (commit `719e7d28140ad7b29f5d438f0c433056a4751a73`), `src/Index.html` (commit `ef7caec1fb865c0310a92f99d8f5e511258a2d39`), and `src/appsscript.json` (commit `2689dd261818d8b786554c713312c2a43a829aca`). Initial server: database ID points ONLY to new workbook; user allowlist in AppUsers; role/Team A/B lock validation; open session check; cached location/product references; count validation; ScriptLock; duplicate EntryID detection; batched single-row write; timing. UI: warehouse/bay/location cascade, barcode/name/ID search, UOM, quantity, notes, Save with retry-stable submission ID. **NOT DEPLOYED OR TESTED.** Critical prerequisites: ProductIndex empty, AppUsers empty, InventorySessions empty; no bootstrap admin yet. Manifest uses executeAs USER_ACCESSING / DOMAIN; requires access to new workbook for each signed-in user, which may be undesirable for row-level confidentiality. **Review deployment identity and least-privilege security before any release**; don't assume current manifest is production-safe. CountEntries duplicate scan currently reads all EntryIDs per save and needs benchmark/index optimization; cache invalidation after product updates still needed; app currently only handles single-unit entry and does not implement multipliers, previous-location history, voice, editing, map, reconciliation, or exports. Verify Apps Script manifest support and browser UUID behavior. Never deploy without permission testing and isolated sample data. Next: import validated ProductIndex from read-only SPIRITS/WS, add secure admin/session provisioning, tests, and connect standalone Apps Script project.

### 2026-11-15 — Initial administrator provisioned

In **NEW** workbook `12teaGz7z2Ems-Elqz5vHv1Z8S5aV4kJMJrnBxlMYQ5Y`, `AppUsers!A2:G2` now contains `abe.flores@bsbco.com | Administrator | Active | (no team) | FALSE | 2026-11-15 | Initial administrator provisioning`. Read-back verified. Administrator access is an allowlist database record only; standalone Apps Script web app remains undeployed, so login/permissions are not yet runtime-tested. Do not assume administrator can count until a team is assigned/locked or a deliberate admin override is designed.

### 2026-11-15 — Administrator UI and session provisioning implemented in GitHub

Updated `src/Code.gs` commit `6386e3626a89ebfbd1ff5f87200887ec9a8c6a62`: server-authorized `apiInventoryAdminOverview`, `apiInventoryAdminUpsertUser`, `apiInventoryAdminCreateSession`. Uses admin allowlist, lock, validates email/role/status/team, protects current admin from self-revocation, and prevents multiple open sessions. Updated `src/Index.html` commit `32a84ad9e7785776d98ef7ced5fc1b236bd256e4`: administrator controls for user provisioning, Team A/B lock, and new inventory session. Added `src/Tests.gs` commit `9730886f0aac5d553b42f1051db56adc7bba93bc` read-only schema/locations/admin smoke test. **No Apps Script project deployed and no runtime tests executed.** Database AppUsers administrator row remains provisioned, other data tables empty. Important security concern: manifest `executeAs: USER_ACCESSING` requires each employee to access underlying database; review execution identity and spreadsheet permissions before deployment. Also test UI duplicate-click handling, current admin role access, and inventory date parsing. Next: prepare standalone Apps Script deployment, validated product import, and run tests on isolated app. Existing legacy workbook and SPIRITS unchanged.

### 2026-11-15 — Read-only SPIRITS catalog integration committed

Verified live SPIRITS source tab headers via connected Google Sheets: `Material Reference` = `Category, Material ID, Material Name`; `Products` = `ProductID, BrandID, ProductName, SizeML, UnitsPerCase, TargetProof, Status, CreatedAt, UpdatedAt, WSFinishedGoodsID, WSFinishedGoodName, SubtypeID`. Created `src/Catalog.gs` commits `14f6020746109e72a559ce0490335188b0a95086`, `96c09828718eb0919d4cf030466215dea8a03e21`: read-only SPIRITS source fetch, active finished goods/units-per-case mapping, material reference mapping, duplicate-ID conflict/missing-ID validation, guarded admin-only first import (refuses any conflict or existing ProductIndex data), and cache invalidation after import. Known blending categories skipped for countable catalog; need confirm complete source category taxonomy. Updated admin UI `src/Index.html` commit `b9572d84f7712d3f2f93a599f36e1dc7f39475a7` with **Preview source catalog** button, no automatic import. **No catalog import performed, no runtime tests, no Apps Script deployment.** Source IDs were verified from header and sample rows; full dataset not yet audited for conflicts. Next: verify full category taxonomy, IDs, and units; secure deployment identity; create standalone Apps Script project and run smoke tests. Working legacy workbook and SPIRITS untouched.

### 2026-11-15 — Direct source catalog audit and deployment security correction

Read SPIRITS `Material Reference!A1:C1200` (710 populated rows): **421 packaging**, **99 ingredients**, **190 bulk**; no missing IDs/names or conflicting duplicate ID/name pairs in inspected data. Read `Products!A1:L1200` (231 rows, **230 active**): active FG all had WSFinishedGoodsID, WSFinishedGoodName and positive UnitsPerCase; no conflicting IDs; no overlap between active FG IDs and packaging IDs. **This is source inspection, NOT an Apps Script runtime test.** `src/Catalog.gs` commit `531c3581dcf0eacfc96f66dac91f67baa3b57e50` now recognizes exact categories and imports only packaging + active FG as a conservative provisional subset (expected 651 unique records). **Outstanding business-rule decision:** ingredients/raw materials physical-count eligibility vs extended-only blending ingredients; do not silently exclude all ingredients permanently. Bulk excluded pending review. `src/appsscript.json` commit `0f61befc3ac04a4a70d9bbc6966ccf5e6c225602` changed webapp execution identity to `USER_DEPLOYING` so counter users need not have direct Sheet access; must runtime-test Session.getActiveUser().getEmail() with same-domain users and enforce authorized users. No source workbook writes, no catalog import, no app deployment yet. Next: confirm exact countable material taxonomy, test execution identity, create standalone Apps Script project and deploy privately.

### 2026-11-15 — User clarified count eligibility and warehouse flag

**User rule:** Physical inventory includes ALL raw materials (packaging, ingredients, bulk) and finished goods **for warehouses with `Counts=TRUE` in SPIRITS**. Inspected SPIRITS `RawMaterialWarehouses!A1:F100`: Counts=TRUE, Active=TRUE IDs `1610` Berlin, `344` Default, `1546` Default Tax Paid, `1592` Lynnville, `1593` Pulaski Tax Paid, `1574` Pulaski; Counts=FALSE IDs `1595` Lipman and `1642` Lynnvillle TR/GS. Corrected `src/Catalog.gs` commit `36b00950ff0c4756d1e77c1813f5d37ce31a170f`: includes all Material Reference categories as countable; exposes counting warehouses in preview; adds helper `invCountingWarehouseIds_()` for future WS filtering. Also removed accidental literal backslash-n sequences in source comments. **Important pending:** This warehouse filter is NOT YET wired into WS snapshot import/reconciliation; `ProductIndex` has no per-warehouse field, so apply Counts flag when processing warehouse-level WS records, not as a blanket product exclusion. Material UOM is currently provisionally 'Each'; must join SPIRITS `Materials.UOM` by WSRawMaterialID before import, preserve correct case/gallon/each conversions. No catalog import or deployment yet.

### 2026-11-15 — Material UOM integrity check and possible source identified

SPIRITS `Materials!A1:J1200` contains only headers (0 material records), so its `UOM` column cannot supply verified units for the 710 `Material Reference` records. Corrected `src/Catalog.gs` commit `953b2980e41b3cb1d23d138affd525ed2efdcfd0` to reject import until material UOM verified rather than defaulting all to Each; repaired literal `\\n` artifacts. Corrected `src/Code.gs` commit `068383e27c9386b76dff2de3facd0d588a316278` to enforce configured material UOM on save and `src/Index.html` commit `b78137bd9c17ef4eeca9b2b0cb65813cd69732e3` to show configured UOM. **Additional discovery:** read-only legacy workbook `Inventory Log Template` tab `WSFRM` includes `RawMaterialId`, `UnitOfMeasure`, `UnitOfMeasure_Name`, `WarehouseId`, `WarehouseName` and could be used to validate UOM by ID. However this legacy tab may be stale; DO NOT treat as current official WS without timestamp check. Next: identify fresh authoritative WS raw material source and reconcile UOM conflicts; do not write legacy workbook. No import or deployment yet.

### 2026-11-15 — UOM coverage audit and diagnostics

Read-only compared SPIRITS `Material Reference` (710 material IDs) against legacy `Inventory Log Template` `WSFRM` (1067 rows, 560 unique WS RawMaterialIds). **508/710** material IDs have legacy UOM candidate; **202/710** absent: 190 `bulk`, 12 `packaging`. No conflicting UOM values for a single ID in WSFRM. Observed WSFRM UOMs: Each, Pounds, Gallons, Kilograms, FluidOunces, Grams. Legacy source freshness not verified; **do not use its UOMs as authoritative** or import them automatically. Commit `fd2a65726fb986bcf40be98826c69bb32fad98d9` updates `src/Catalog.gs` with admin-preview-only diagnostic matching; preserves import block for missing verified official UOM. New source read from legacy workbook is read-only. Need locate current official WS raw-material data feed including UOM and reconcile all bulk IDs before catalog import; consider separate bulk catalog if those IDs are not WS raw material IDs. No deployment or database import yet.

### 2026-11-15 — User confirmed supported UOMs and legacy-zero rule

Raw materials support ONLY `Each`, `Pounds`, `Gallons`; finished goods `Case`, `Bottle` with verified UnitsPerCase. User instructs legacy raw UOMs (Kilograms, FluidOunces, Grams, etc.) have **effective quantity 0**, not converted or counted in reconciliation. Source UOM remains for traceability. Commit `e0407c0febd99c911033a2e85bdb5258cd81fe7d` adds `invNormalizeRawQuantity_(uom,quantity)` returning zero for unsupported UOM and repairs literal backslash-n source formatting; commit `7d87d5a180f5ff635ab87257bb9a0067eb82f9f1` enforces allowed raw count UOMs server-side. **Normalization helper is NOT yet connected to a WS snapshot import/reconciliation pipeline (not built).** No legacy rows overwritten or quantities set to zero in source sheets. Catalog import still blocked pending authoritative UOM mapping. No deployment.

### 2026-11-15 — Fermentation Support exclusion

User explicitly excluded all `Fermentation_Support` material records from physical inventory and WS reconciliation (not merely effective zero). In read-only legacy `WSFRM`, IDs `71525`, `74134`, `154140`, `74135` are Fermentation_Support with positive Kilograms quantities. Checked SPIRITS `Material Reference!A1:C1200`: **none of these four IDs are present**, so the SPIRITS reference-based initial catalog already excludes them. Commits `536d06b219a7e817ca86a4ae1500f2e8afa99821` and `f5f96f89c29b67e4d8edc1f7ca5f94658137467d` add defensive category exclusion for legacy catalog matches and `invIsExcludedMaterialClass_` / `invEligibleWSRawRow_` helpers for future WS row filtering. **WS snapshot import is not built; helper is not yet wired into reconciliation.** Ensure future importer filters by warehouse `Counts=TRUE` AND excludes Fermentation_Support before UOM normalization. No database write, import or deployment.

### 2026-11-15 — Initial WS snapshot backend

Created `src/WSSnapshots.gs` commit `958d278b9d6dbdf3aa921a96608a44cff9088f6b`, updated `caebc36b47ebd94d762e803285003ba004f55b48`: `invWsSnapshotPreview_`, `apiInventoryAdminPreviewWSSnapshot`, `apiInventoryAdminSaveOriginalWSSnapshot`. Server checks administrator, open session, required source timestamp, Counts=TRUE active warehouse IDs from SPIRITS, excludes Fermentation_Support, zeros unsupported raw UOM quantities, accepts finished goods Case/Bottle, rejects invalid quantities, persists WSRows and WSSnapshots and sets session OriginalWSSnapshotID. Blocks duplicate original snapshot even if session pointer missing. **Caveats:** No import UI, no live WS connector, no runtime test, no reconciliation engine yet. Google Sheets multi-sheet writes are not transactional: interrupted import could leave orphan WSRows; need staged validation/recovery and audit. `WSRows` stores effective quantity, not raw source quantity/UOM provenance beyond UOM; design additional audit preservation before production. WS item identity/class mapping requires source-specific validation. No data imported and no deployment.

### 2026-11-15 — WS source preservation and reconciliation preview

`src/Code.gs` commit `8d0f515d239b1343266bf239571a4bfecebba4af` registers WSSnapshots/WSRows schemas (fixes `invRows_` failure). `src/WSSnapshots.gs` commit `234b34a714d2dae1d0bc00b9bc15373f093ee0e6` repairs literal newline artifacts and **stores original WS source quantity** in WSRows instead of destructive effective-zero normalization; unsupported raw UOM normalized to zero at reconciliation time only. `src/Reconciliation.gs` commit `c280f65a449a3421af1c14b271e49640af2050b6` adds admin-only read-only `apiInventoryAdminReconciliationPreview`: original snapshot, team A/B aggregate, FG bottle-to-case conversion, raw UOM validation, per-item difference, invalid rows and team match flag. **Critical limitations:** aggregate team equality does not prove per-location equality; missing location counts can appear as zeros, so preview explicitly NOT a freeze gate. Need location completion map, ownership-safe edits, official source connector, per-item UOM provenance audit, and live tests. No data imported, no deployment, no production changes.

### 2026-11-15 — Session-driven WS snapshot cadence (user decision)

User confirmed: **NO daily inventory WS snapshot, NO daily trigger, NO background polling outside an explicitly created inventory session**. Example: without a November 2026 inventory session, script must be silent. On administrator-created OPEN inventory session, take original WS snapshot only when deliberately initiated for that session; preserve original immutable snapshot. Any later updated WS snapshot is also session-specific and explicitly initiated, not daily. `src/WSSnapshots.gs` commit `5c1496f46f6dae442fa4afaf545423ed804b7169` clarifies explicit session-only call. Current code has no time-based trigger. Do not introduce scheduled inventory jobs. No deployment or runtime test.

### 2026-11-15 — Parse repair and event-driven import hardening

Fixed literal `\\n` source artifacts in `src/Code.gs` (`45efeb939df0cafcbfda33b93d0dd9750badeafb`) and `src/Catalog.gs` (`6b73e60211e4032b2f48ae344ae2ecb1f208e797`), which could break Apps Script parsing. `src/WSSnapshots.gs` (`1280ec0896d35e04a2dcfaa926fff1ca6f1a861b`, `e78998af2f4c147d91823522e78e4c3b0588c577`) rejects blank quantities and writes explicit-session snapshots in 500-row chunks. No scheduled triggers added. **Not runtime tested or deployed.** Outstanding: robust idempotent partial-import recovery, correct WS source field/class mapping, original WS feed integration, location-level A/B completion, catalog official UOM resolution.

### 2026-11-15 — Location-level read-only mismatch preview

Created `src/LocationComparison.gs` commit `398dc9b48629488133a9d2eee0a15831b7ab0d78`, registered `LocationStatus` schema in `src/Code.gs` commit `f6f51f8b3320bb7e9df815ad734bfc5528a5e6a3`. Admin-only preview groups active count entries by session/location/team/product and normalized unit (FG bottles->cases) and identifies mismatches. Neutral for no activity, yellow for started without mismatch, red for mismatch. **Intentionally never green or freezeAllowed:** explicit two-team location completion and EMPTY confirmation have not been implemented, and no implicit completion is allowed. No old inventory script copied; new standalone backend only. No data writes, no deployment, no runtime test. Next: design explicit completion events/permissions and green eligibility, then test with synthetic data.

### 2026-11-15 — Corrected location status rule (user correction)

**No Finish Location button or explicit team completion step.** Map status updates automatically from Team A/B submitted counts: neutral neither, yellow only one team, red both with mismatched product/unit totals, green both with matching totals. Empty locations require explicit EMPTY/NO COUNT submissions (not a Finish button), not yet implemented. Updated `src/LocationComparison.gs` commit `573f2d4481f6794af1ede806c99fb5f43bc89422`. `freezeAllowed` intentionally remains false until EMPTY handling and validation are built. **Caution:** current implementation treats both teams having any count as green if their submitted items match; it cannot detect omitted products without additional completeness validation. No runtime test/deployment.

### 2026-11-15 — EMPTY versus items mismatch

User confirmed: if Team A submits EMPTY and Team B submits any items for the same location (or reverse), location must be RED. EMPTY+EMPTY GREEN; one EMPTY with no submission by other team YELLOW. Updated `src/LocationComparison.gs` commit `9a9f0b49836c5c661f14f3cad2efbe062d6afd48` to recognize active `CountEntries` with `EntryMethod='EMPTY'`, count them as team activity and flag cross-team and same-team EMPTY-versus-items conflicts. **EMPTY submission endpoint/UI not yet implemented**; current count save requires product. Freeze remains disabled. No runtime tests or data writes.

### 2026-11-15 — EMPTY location submission endpoint and UI

`src/Code.gs` commit `4e38424521fab0119f684f7fa3f99b2d88b1a0cc` adds `apiInventoryMarkEmpty` with authenticated locked-team validation, OPEN session/location checks, script lock, idempotent submission ID, and prevents same-team active items coexisting with EMPTY; `apiInventorySaveCount` also rejects new item counts if same team has active EMPTY. `src/Index.html` commit `d58071b17e32225fbe4bd8d0c78d6e8f631bc836` adds mobile Mark location EMPTY action with confirmation and retry ID. `src/LocationComparison.gs` commit `480067445799c75f22698d381404e0d44b69a053` prevents invalid count rows from reporting allGreen. Team A EMPTY vs Team B items is RED; EMPTY vs EMPTY GREEN; single EMPTY YELLOW. No Finish Location. **Outstanding:** owner-scoped edit/delete/undo EMPTY, invalid entry handling per location, location map UI, unit/integration tests, final freeze gating. No deployment/runtime test, no data imported, no legacy source edits.

### 2026-11-15 — Owner-scoped correction and audited deletion

`src/Code.gs` commit `8157ca7e93cd7fa0e87753d8f3de782c3eab9120`: registered CountEntryAudit schema; added `apiInventoryMyEntries` (only own active records for counters, all for admins) and `apiInventoryDeleteEntry` (OPEN session, server ownership check, lock, append audit then soft-delete status). `src/Index.html` commit `e1bea7b7ac46311e9f9035b901542fd7513bff28`: Review my entries and Remove UI; EMPTY can be removed and then item counting resumed. No legacy source changes. **Remaining:** editing existing entries (currently remove and re-enter), runtime tests, audit write partial-failure recovery, session freeze validation, location map UI. No deployment or database writes.

### 2026-11-15 — Supervisor location status grid

Added administrator-only read-only location status grid to `src/Index.html`, commit `b6a1e1271491162a0b2410eb4f8ce5e17fe2b24b`, newline rendering fix `d9d9e563fe36dc3efaff96e51ce425e400925a50`. Manual Refresh location map calls `apiInventoryAdminLocationComparison`, shows neutral/yellow/red/green totals and location tiles; tapping a tile shows Team A/B entry counts, EMPTY markers, mismatch keys. No background polling or daily trigger; no Finish Location. **Important outstanding correctness:** map currently can show green when both teams have matching *submitted* entries but omitted items cannot be inferred; invalid records are reported globally and freeze remains blocked. Need synthetic tests and runtime deployment. No database changes.

### 2026-11-15 — Pure location comparison regression suite

Refactored `src/LocationComparison.gs` to expose pure `invLocationColor_` and `invLocationDifferences_` functions (`ee0d7910134232fc0108315bab6989798ef07c0e`, `0163f321caf045f034c1defa042a6563c2ab1bce`). Added `src/LocationComparisonTests.gs` (`fe3234021efb8b9db9bd8a2a52b8ca0a7f9a9746`) with 15 assertions for neutral/yellow/red/green, matching and mismatching product totals, EMPTY/EMPTY, EMPTY versus items, and same-team conflict. Run manually with `testInventoryLocationComparisonRules()` after Apps Script deployment. **Tests committed but NOT executed; no runtime access or DB changes.** Next: exercise Apps Script runtime and add integration tests, then harden freeze gate and reconciliation.


### 2026-11-15 — Extended location comparison regression coverage

Extended `src/LocationComparisonTests.gs` on `main` (commits `e25a27e61e2f6a81f94507a182d5bb4091818eb9`, `9860a53b24802d2b30742badb035b8412288f507`) with 11 additional pure assertions (26 total). New cases cover yellow→red→green transitions as Team B catches up, green→red after correction, removal returning to yellow/neutral, same-team EMPTY conflicts, mixed UOM and fractional equivalents. No Finish Location, background trigger or freeze enablement. **Tests have NOT been executed in Apps Script; no deployment or inventory data import.** Next: execute `testInventoryLocationComparisonRules()` in Apps Script, then add integration tests for entry corrections, location identity validation, and freeze safeguards. Current comparison can still report green for matching partial submissions; `freezeAllowed` remains false.


### 2026-11-15 — Active-entry map status and submission ID hardening

`src/LocationComparison.gs` commit `99ef8907d2ba6eba8181933e3de3400559d07803`: map Team A/B started flags now derive exclusively from active count/EMPTY submissions, not potentially stale LocationStatus flags; active entries referencing unknown/inactive locations are reported invalid. `src/Code.gs` commit `f34a98f08881505b6bfd64a8147206c244f507a4`: repeat count submission IDs are accepted as idempotent only when session, location, team, product, UOM, quantity and owner match; conflicting reuse throws. No runtime tests or deployment. Freeze remains disabled. **Next:** run Apps Script tests, add integration tests for deletion/EMPTY/status transitions and verify duplicate behavior. Product catalog not imported; no inventory data writes.


### 2026-11-15 — Deleted submission retry and comparison data validation

`src/Code.gs` commit `40b81a379019bda9869e690520d6b91059e3b112` rejects idempotent retries for previously DELETED count and EMPTY records, preventing false success after a user removes an entry. `src/LocationComparison.gs` commit `105e674595d97784c93121541b053eeda4674808` marks active non-integer/unsafe quantities and finished goods with missing/nonpositive/noninteger UnitsPerCase invalid, so these cannot silently contribute to green eligibility. **No Apps Script runtime execution or deployment; no live data changed.** Freeze remains disabled. Next: test correction/delete/EMPTY transitions with synthetic integration fixtures and run the existing 26 pure assertions. Catalog import and WS reconciliation remain pending.


### 2026-11-15 — Pure fixture regression suite for location comparison

Commits: `f2daae394c848ed32ff6fe7e20dce84c0755d7d6` corrected both-EMPTY conflict expectation (3 differences); `9b6a6b98b2e268dfa21f11741da71cddea7dc58d` rejects blank count and conversion fields; `a83a740f2e0bd17bb8bbfaed15d4a0fe46b7f850` extracted pure `invBuildLocationComparison_(sessionId,locationRows,productRows,entryRows)` while retaining session validation in live wrapper; `f50401350012a61f16cd64ae76a3e7d77f8deeef` added `src/LocationComparisonFixtureTests.gs` with 14 synthetic scenario checks. Run `testInventoryLocationComparisonRules` and `testInventoryLocationComparisonFixtures` in Apps Script. **Not yet executed or deployed**; no database modified; freeze remains disabled. Next: run both suites, verify errors, test ownership/idempotency workflows, then review completion/freeze criteria.


### 2026-11-15 — Fixture correction before runtime

Commit `e22392e88246ef8b08688b7f61bf1877a6312c0e` removes a contradictory fixture that expected a valid single-team finished-good count to be neutral; correct behavior is yellow. The fixture suite now contains 13 scenario checks, still **not executed in Apps Script**. Existing pure rule suite has 26 assertions. Run both functions before deployment. No database writes or freeze enablement.


### 2026-11-15 — Count endpoint rejects forged EMPTY and blank quantity

Commit `c96820782759558758fecc38c1465115686040aa` hardens `apiInventorySaveCount`: requires quantity to be present (blank/null/undefined no longer coerced to zero), accepts only Manual/Barcode/QR entry methods, and includes entry method in duplicate ID payload matching. EMPTY must be created through `apiInventoryMarkEmpty`. **No Apps Script runtime test or deployment; no live data changed.** Freeze remains disabled. Next: run pure rule and fixture suites, then test server-side count/EMPTY/delete/idempotency behavior with mock Sheets or Apps Script test database.


### 2026-11-15 — Local regression execution and FG conversion alignment

Executed current GitHub source of `src/LocationComparison.gs`, `src/LocationComparisonTests.gs`, and `src/LocationComparisonFixtureTests.gs` in an isolated JavaScript runtime with a stubbed Logger and INV_RAW_UOMS; results **PASS 26/26 rule assertions, PASS 13/13 fixture assertions** (39 total). This is **local pure-JS execution only**, not Apps Script deployment/runtime, not live Sheets. Commit `d719ab144ac53225c6644a4664e7cee8e9f3395b` aligns `apiInventorySaveCount` with comparison validation by requiring valid positive safe-integer UnitsPerCase for **both** Case and Bottle finished-goods submissions. No live data changed; freeze disabled. Next: Apps Script integration tests for save/EMPTY/delete and admin authorization, verify import and snapshot prerequisites, then deployment only after approval.


### 2026-11-15 — In-memory count/EMPTY/delete integration simulation

Executed current `src/Code.gs` with in-memory stubs for `invSheet_`, `invRows_`, `invUser_`, `invReference_`, `invSession_`, LockService and Utilities. **PASS 13/13** scenarios: save, idempotent retry, changed-payload rejection, forged EMPTY rejection, blank quantity rejection, EMPTY blocked by own counts, cross-user deletion denied, owner deletion, deleted-count retry denied, EMPTY after deletion, count blocked by EMPTY, EMPTY deletion, deleted-EMPTY retry denied. Simulated state: two count rows, two audit rows. Combined with previously executed pure suites: **52/52 local checks passed**. This is NOT Apps Script runtime testing or real Google Sheets integration; no live data written, no deployment, freeze disabled. Next: preserve reproducible integration tests in repo, exercise Apps Script runtime with test data, then proceed to inventory location/catalog import and freeze prerequisites.


### 2026-11-15 — Reproducible Node count workflow test committed

Commit `1f9ce5603e89ab9a24bba33ff03a7259d5fb8efd` adds `tests/count-workflow.test.js`, a Node built-in VM/strict-assert mock integration harness loading the real `src/Code.gs` source and running 13 save/retry/EMPTY/delete/ownership checks against in-memory Sheets stubs. Run from repository root: `node tests/count-workflow.test.js`. Earlier equivalent 13 checks passed in an isolated JavaScript execution, but **the new committed Node file has not yet been run in Node**. No Apps Script runtime tests or deployment; no live data changed; freeze disabled. Next: execute committed Node test file and both comparison suites, fix any regressions, then Apps Script integration tests on safe test data.


### 2026-11-15 — Automated Node regression workflow

Commit `9a715ff1a07dcff5dea80c3c33ab635b2b361fb3` adds `tests/location-comparison.test.js`, loading actual Apps Script comparison sources in Node VM and asserting 26 rule + 13 fixture checks. Commit `7c8a60c73878f238d3b4645c377766c14deb3340` adds `.github/workflows/inventory-tests.yml` to run both Node test files (52 total checks) on relevant main pushes, PRs, and manual dispatch. Workflow uses read-only GitHub permissions, no Apps Script credentials, no database access, no deployment. **CI run result not yet verified**. Next: inspect GitHub Actions first run and resolve failures, then actual Apps Script test-database integration. Freeze disabled.


### 2026-11-15 — CI verification limitation and expanded mocked integration tests

GitHub connector checks for workflow commit `7c8a60c73878f238d3b4645c377766c14deb3340` returned empty combined statuses and no PR-triggered workflow runs; **this does not prove a push workflow passed or failed**. Commit `e0de4762da4be9a90dcfe9aa7d057119a34c6e4a` expands `tests/count-workflow.test.js` from 13 to 22 checks: new count after EMPTY removal, duplicate method mismatch, negative/fractional quantities, invalid product/location, admin deletion, audit actor, and hidden deleted entries. Combined planned CI suite: **61 checks (22 mocked workflow + 39 pure map)**. Expanded committed file not yet executed in Node or GitHub Actions. No Apps Script execution, deployment, or live data change. Freeze remains disabled. Next: verify CI via GitHub Actions UI/logs; fix test failures; run Apps Script integration with isolated test database.


### 2026-11-15 — Invalid active entries no longer yield green map locations

Commit `ddca00bba26811da1bee19f2122247ab6174082d`: location comparison now includes locationId in invalid entry diagnostics, returns invalidCount per location, and paints locations with invalid active entries red instead of misleading green/neutral. Commit `3ce15cc5771050ed7381c57fb7b3a17b917ca263`: update existing invalid-entry expectations and add fixture asserting matching valid A/B totals plus invalid entry => red. Commit `cd0d4ddab3a0b013d5db0d03bf84db79c837f884`: Node test runner expects 14 fixtures. Re-executed current comparison sources in isolated JavaScript: **26/26 rules and 14/14 fixtures PASS** (40). Counting mock suite has 22 scenarios in repo but current committed Node file and GitHub Actions result still unverified. Planned suite now **62 checks**. No Apps Script runtime, no deployment, no live database writes. Freeze disabled. Next: verify GitHub CI and run isolated Apps Script integration tests.


### 2026-11-15 — Linear invalid-entry aggregation and multi-location isolation test

Commit `d36f82bf06b4a2fae10cc16070c3f107da840b69` replaces per-location full invalid-entry scans with a one-pass `invalidCounts` map in `invBuildLocationComparison_`, preserving red status for invalid active entries. Commit `d7f7c005f45c46d55ca382967b50efcc08963d9d` adds a two-location fixture: valid matching L1 stays green while invalid L2 turns red, with scoped invalidCount. Commit `9ed14b4cbe9e775cd305cef475d09cd31d0f3fce` updates Node expected fixtures to 15. Executed current comparison sources in isolated JavaScript: **26/26 rules + 15/15 fixtures passed** (41). Counting mock suite has 22 scenarios committed but full Node/GitHub CI result remains unverified. Planned total **63 checks**. No Apps Script runtime test or deployment, no live Sheets writes; freeze disabled. Next: verify GitHub CI in Actions and test against isolated Apps Script database.


### 2026-11-15 — Reconciliation respects active catalog products

Commit `c8956a07abd2913783f7cd4ba3811b05350d9291` filters ProductIndex by Active=true inside `invBuildLocationComparison_`, matching counting endpoint's active-only reference behavior. Inactive product count rows now appear in invalid diagnostics and their locations red, rather than being treated as valid reconciled inventory. Commit `dc6fc4bb9a082106b034d9ccf30b672da892da15` updates fixture products with Active=true and adds inactive-product rejection case. Commit `a879ae349e4ea64bdb15cd2c8b08fe88e9c9a43f` updates Node runner to 16 fixtures. Re-executed current comparison sources in isolated JavaScript: **26/26 rules + 16/16 fixtures PASS**. Planned automated total **64 checks** (42 map + 22 mocked count). Node CI run remains unverified; Apps Script runtime not tested; no deployment/live data changes; freeze disabled. Next: run/inspect GitHub Actions, then isolated Apps Script integration tests and product import readiness.


### 2026-11-15 — Strict count quantity input validation

Commit `3cc26c475669207e7eb0802911a1bf988cc31e67` rejects quantity coercions (whitespace-only strings, booleans, arrays, exponential-form strings) in `apiInventorySaveCount`, retaining nonnegative safe-integer validation and digit-only numeric strings. Commit `3d8a71861eb0ff4219b6e3b86aef8eb39299a503` adds 5 mocked integration checks, bringing count workflow to **27 scenarios**, plus 42 map assertions = **69 planned checks**. Newly expanded Node suite and GitHub Actions results not yet verified. No Apps Script runtime test, no deployment, no live Sheets writes; freeze disabled. Next: verify CI and Apps Script test database integration; ProductIndex import remains pending.


### 2026-11-15 — Fail closed on duplicate active reference IDs

Commit `60cf9ac9d915c2e0626a213b2a5c47bd27e4d71c` changes count and EMPTY endpoints to require exactly one active location match, and counts to require exactly one active product match; duplicate identifiers now block writes rather than selecting first row. Commit `919f55af325dbebd61cd799468eb387289977918` adds three mocked integration checks for duplicate location count, duplicate location EMPTY, and duplicate product count. Planned suite: **30 mocked workflow checks + 42 comparison assertions = 72**. CI and full Node execution still unverified; Apps Script runtime not tested; no live database changes/deployment. Freeze remains disabled. Next: execute tests, verify CI and perform isolated Apps Script integration, then validate ProductIndex/Locations imports before production use.


### 2026-11-15 — Test harness isolation correction

Commit `f5089331ee6d086b5b982aadafea07944200b644` saves the counting test's mock invUser_/invTeam_/invSession_/invReference_/invRows_/invSheet_ functions and restores them to the Node VM context after loading production `Code.gs`, whose real helper declarations would otherwise override them. This is a test-only change; no app deployment or database writes. Attempted direct GitHub clone for local Node execution, but container DNS could not resolve github.com; a simplified JS simulation was not equivalent to Node VM and did not establish a test result. **Do not claim full 72-check suite passed.** Next: verify GitHub Actions logs or execute Node tests in an environment with repo access; fix any actual failures. Inventory freeze disabled.


### 2026-11-15 — Counting mock test ordering fixed; 30 simulated checks pass

Commit `16ede5fca8677441f4f12117bccc9aa1963c0448` moves the accepted numeric-string count scenario after EMPTY lifecycle and admin-delete assertions. Previously it inserted an active count too early, incorrectly causing the EMPTY-after-deletion test to fail. Re-executed the current test logic against production `Code.gs` in an isolated JavaScript simulation with mocked Apps Script helpers: **30/30 count checks PASS**. This is **not** a native Node VM run or GitHub Actions result; GitHub Actions and Apps Script integration remain unverified. The pure comparison suites last passed 26+16=42 checks, yielding 72 defined checks. No deployment or live data changes. Freeze remains disabled. Next: confirm native Node/GitHub Actions run, then test with isolated Apps Script database.


### 2026-11-15 — Supervisor map detects duplicate active reference IDs

Commit `3af5979f45646b514cb1e99563c08d609f52d3fe` adds duplicate active product and location ID detection in `invBuildLocationComparison_`, matching existing fail-closed counting endpoints. Active entries referencing duplicate product IDs are flagged invalid; duplicate active locations render red and include `duplicateLocation=true`. Commit `26fcda4b9456c5e1e6eb6a37220bc414e4a6171c` adds two fixtures; commit `396411d6302ef85984c52256920e4961202229d8` updates Node runner expected fixture count to 18. Executed latest pure comparison sources in isolated JavaScript: **26/26 rules + 18/18 fixtures PASS**. Total defined suite now **74 checks** (44 map + 30 mocked count). Full native Node/GitHub Actions execution still not verified; no Apps Script runtime/deployment/live database writes. Freeze remains disabled. Next: verify native CI, then test against isolated Apps Script database and import reference data.


### 2026-11-15 — Reject malformed EMPTY rows in supervisor map

Commits `e1e7c5111b8d4251fc9f324b22a4aa7968110125`, `f4cc88f13c16caec0406a638f5a8251ff0b1600b`, `4ecdfe65b59b0a7d61769a6397d2570867dd74fa` require active EMPTY rows to have valid team, blank product ID, blank UOM, and numeric zero quantity; malformed rows are flagged invalid and turn the corresponding location red. Added 4 fixture assertions. Latest pure comparison sources executed in isolated JS: **26 rules + 22 fixtures = 48/48 PASS**. Together with 30 mocked workflow checks, **78 checks defined**. Attempted GitHub workflow lookup on previous main commit; connector returned no runs because it only exposes PR-triggered runs, so GitHub Actions push status remains unverified. No Apps Script deployment or live data changes; freeze disabled. Next: verify native Node/GitHub Actions run and isolated Apps Script integration, then import reference tables.


### 2026-11-15 — Pre-count duplicate reference validation

Commit `cf80abf798e8955ae89ae2954d05a5607fe006ae` reports `duplicateProductIds` and `duplicateLocationIds` in the supervisor comparison, blocks `allGreen` for any duplicate active reference ID even if no count references it, and marks duplicate locations red before counting. Commits `348f93412b2986e4f754e4bb52134d56c68135c9` and `8eb9d4e666567be356f83f892fd6b47690013cf4` add two pure fixtures and adjust Node expected count. Executed current comparison code in isolated JavaScript: **26 rules + 24 fixtures = 50/50 PASS**. Combined with 30 mocked workflow checks, **80 checks defined**. Native Node/GitHub Actions push status and Apps Script runtime remain unverified. No deployment/live sheet writes. Freeze remains disabled. Next priority: run actual Node CI, test against isolated database, and populate Locations/ProductIndex from authoritative sources.


### 2026-11-15 — Blank active reference ID detection

Commits `96ef35d1970b1bb7f8e5ff71f9fb8058d1244d84`, `4d0ea207569226037aca7600b072ed6bb4c684d9`, `a88913fd8489ff2894a98614982063de7fa96c8d` add pre-count blank active ID detection to supervisor comparison (`blankProductIds`, `blankLocationIds`), force blank-ID locations red, and prevent `allGreen` when active catalog identifiers are missing. Two pure fixtures added. Current comparison sources executed in isolated JavaScript: **26 rules + 26 fixtures = 52/52 PASS**; with 30 mocked workflow checks, **82 defined checks**. Full native Node/GitHub Actions run and Apps Script runtime remain unverified. No deployment or live Sheets writes; freeze disabled. Next: verify CI and import actual authoritative reference data into Locations/ProductIndex.


### 2026-11-15 — LIVE Google Sheet reference-table inspection (read-only)

Connected Google Sheets metadata confirms `BMD Inventory — Database` (`12teaGz7z2Ems-Elqz5vHv1Z8S5aV4kJMJrnBxlMYQ5Y`) has the 14 expected tabs. Bounded read `Locations!A1:F1000` found **138 populated location rows**, warehouses **Pulaski** and **Lynnville**, **zero duplicate LocationID values and zero blank IDs**. First ID `PRA-C1-L1`; last `LANE LT`. `ProductIndex!A1:J8` contains **header only**, no products yet. `AppUsers!A1:J8` contains one active administrator provisioned, with no team locked. This supersedes earlier notes implying Locations had not been populated. No writes were made. **Next: identify authoritative SPIRITS packaging and finished-goods sources, map columns, and prepare reviewed ProductIndex import**; do not guess spreadsheet IDs or modify SPIRITS. Native CI and Apps Script runtime unverified; freeze disabled.


### 2026-11-15 — SPIRITS source discovery checkpoint (read-only)

Google Drive keyword searches for `SPIRITS`, `Packaging`, and `Finished Goods` returned many accessible candidate file IDs without reliable titles in connector output; no single authoritative import source can yet be verified from those results. Inspected V4 GitHub handoff `docs/V4_OPTIMIZATION_HANDOFF.md`: it documents separate finished-goods external `FG_SOURCE_` LiveData and raw-material `RM_SOURCE_` LiveData readers, plus internal Brands/Products/Releases/BrandReleaseTypes, but **this is not proof that those tables are the exact SPIRITS product/barcode master**. Do not import from guessed sources or invent barcode/UnitsPerCase values. Next: trace actual V4 source definitions of `FG_SOURCE_`/`RM_SOURCE_` and SPIRITS catalog, inspect verified headers and IDs, produce mapping and preview, and only then write ProductIndex after validation. Locations already populated (138). No live writes/deployments; freeze disabled.


### 2026-11-15 — VERIFIED authoritative WS snapshot sources (read-only)

Traced actual V4 `RawMaterialsSource.gs` and `FinishedGoodsSource.gs` on main. `RM_SOURCE_` points to Google Sheet `1ULhJ2aUGQ9IPO3rkEHzixyNdBvJzU0t2poxLMKSFD8Q`, **Raw Materials Inventory LIVE**, tab `LiveData`; `FG_SOURCE_` points to `15tQfyGJtfAU02JNlf2cV0MY_Pai6F9sVLSl1EMReJMw`, **Finished Good Inventory LIVE**, tab `LiveData`. Google Sheets metadata and bounded `A1:AZ3` reads independently verified both. Raw material columns include `RawMaterialId` (candidate WSItemID), `MaterialName`, `ClassOfMaterial`, `UnitOfMeasure`, `ExternalSKU`, `WarehouseId`, `Units`; V4 filters normalized classes `PACKAGING` and `BLENDINGINGREDIENT`. Finished goods columns include `Master Id` (candidate WSItemID), `Master Name`, `CS`, `BTL`, `Warehouse/Location`, `Timestamp`. **Neither inspected LiveData header has an explicit barcode field; FG has no explicit UnitsPerCase.** Do not mistake raw-material `ExternalSKU` for a verified scan barcode, nor parse FG pack sizes from names without validation. Need verified barcode master, FG case-pack master, active/status rules, and dedup by item ID across warehouse/lot rows before ProductIndex write. Existing ProductIndex remains header-only. No writes/deployment; freeze disabled. Next: locate barcode/pack master source, construct preview with distinct IDs and invalid-row report, then approve and execute import.


### 2026-11-15 — Barcode and pack semantics CONFIRMED BY USER

User explicitly confirmed: **raw-material printed barcode payload equals `RawMaterialId`**; **finished-good printed QR payload equals finished-good name** (WS `Master Name` candidate; exact canonical naming must be validated); bottles-per-case is maintained in **SPIRITS subtype–finished-good relationship**. ProductIndex mapping: raw `WSItemID=RawMaterialId`, `ItemName=MaterialName`, `Barcode=RawMaterialId`; FG `WSItemID=Master Id`, `ItemName=Master Name`, `Barcode=finished-good name`, `UnitsPerCase` from verified subtype/FG relationship. Do not derive from FG name or assume `ExternalSKU` is barcode. V4 `SubtypeSpecifications.gs` verifies `BrandReleaseTypes.UnitsPerCase` and `BrandReleaseTypeID` for subtype specs, but **not yet proven to be the precise subtype–finished-good relation**; inspect SPIRITS/Products/Releases joins and case-pack values before import. ProductIndex remains header-only; no writes/deployment. Next: verify exact joins and uniqueness of finished-good QR name and case-pack, build dry-run mapping report, then import.


### 2026-11-15 — User clarification: SPIRITS planner status is NOT inventory status

User explicitly confirmed SPIRITS subtype `Active/Inactive` status exists **only for visibility in the bottling production planner**. Do NOT filter finished goods or subtypes out of inventory based on that flag. All SPIRITS subtypes, including planner-inactive, are inventory eligible; inventory's own ProductIndex.Active is independent. Bottles-per-case comes from SPIRITS subtype–finished-good relationship, regardless of planner status. Some currently lack this value; user will populate all subtype case packs. Until populated, report missing/invalid UnitsPerCase as a validation issue; do not guess, default to 1, silently drop product, or perform case↔bottle conversion for affected FG. Keep such products discoverable in catalog, with conversion-dependent counts blocked until valid case pack exists. Next: implement/import validation reflecting independent status semantics and test inactive planner subtype and missing pack cases. No live writes/deployments.


### 2026-11-15 — Read-only ProductIndex preview implementation

Added `src/ProductIndexPreview.gs` (`f1600cb2ad84a271db0a6d3c770e77b40acf0264`), a **pure, read-only** mapper accepting raw-material rows, FG rows, and verified case-pack rows. Raw barcode=RawMaterialId, FG QR payload=Master Name, case pack keyed by WSItemID; it does NOT filter by SPIRITS bottling planner status. It deduplicates identical warehouse/lot product rows, reports conflicting IDs, shared barcode payloads and missing/invalid/conflicting case packs, and sets `ready=false` on issues without silently removing FG. Added Node regression file `tests/product-index-preview.test.js` (`fe1a6c3f483df30d376c0b65835745a4789c84fb`), and CI workflow path trigger/test step (`4660388889239ac791905a43f31b4efbddb2a090`). Executed isolated sample mapping successfully; **native Node/GitHub Actions result not verified**. Mapper is not yet connected to a live source-fetch endpoint or any write operation. Next: inspect actual SPIRITS relationship for WS Master Id to UnitsPerCase, validate raw UOM mapping, run preview on real source snapshots, resolve issues, then import with explicit controlled action. No live data writes or deployment; freeze disabled.


### 2026-11-15 — Live V4 subtype/case-pack join verified (read-only)

V4 configured working database ID confirmed from `BMD-V4-Backend/Code.gs`: `1fll-r__z9DWWehswc-eaOyYMuO2zdFoWzksNqAtIZj8` (`BMD V4 — Database`). Live metadata and bounded reads `Products!A1:O500`, `BrandReleaseTypes!A1:O500` verified `Products.SubtypeID -> BrandReleaseTypes.BrandReleaseTypeID`. Products contains `WSFinishedGoodsID`, `WSFinishedGoodName`, `UnitsPerCase`, `Status`; subtype contains `UnitsPerCase`, `Status`. Read-only audit: **231 products, 104 subtypes, 228 matched subtype IDs, 3 unmatched products, 9 product-vs-subtype case-pack differences, 155 linked products with planner-inactive subtype**. These are counts of this snapshot, not yet complete ProductIndex import coverage against FG LiveData. Example conflicts: BYO Clayton James Single Barrel #624/#654/#862 product pack 1 vs blank subtype pack; JYP OTS Barrel Seekers #3729/#3731 product pack 12 vs subtype pack 6. DO NOT use planner status to filter. DO NOT silently choose Product or subtype pack when values disagree; flag conflicts and missing join for review. Next: reconcile all 9 differences, inspect 3 unmatched products and join with FG LiveData Master Id; wire mapper to reviewed case-pack mapping. No live writes/deployments.


### 2026-11-15 — SPIRITS relationship resolver implemented

Added pure read-only `invResolveSpiritsCasePacks_(products,releases,subtypes)` in `src/ProductIndexPreview.gs`, commit `b9ab21ae981df3e159eb516930c94a3516ce17f4`. Resolves direct `Products.SubtypeID` first, then for legacy blank/missing subtype IDs uses `Releases.ProductID -> ReleaseType` matched to `BrandReleaseTypes.BrandID + ReleaseTypeName`; verifies brand ownership; never filters planner-inactive status. Emits verified WS finished-good ID/UnitsPerCase rows or explicit missing, ambiguous, invalid, and conflicting pack issues. Tested isolated inactive BYO release fallback (1 bottle per case) and conflict detection; both behaved as expected. NOT wired to live API, not deployed, no live data writes. Latest bounded connector read still reported nine case-pack discrepancies and three blank Product.SubtypeID values, whereas an earlier read had shown the three populated; treat this as a snapshot inconsistency and verify fresh before any import. SPIRITS `Dashboard.html` option 1 committed separately as `2429749fb134dea1cf1462e582dca22a77cbd2d3`, not deployed. Next: add regression test for resolver to CI and run actual live-source preview after source reads are consistent.

## 2026-11-15 — SPIRITS data integrity gate (latest)

Live SPIRITS audit after repairs: 228 Products; zero duplicate nonblank WSFinishedGoodsID, zero missing SubtypeID, zero product/subtype case-pack differences, zero release/subtype-name mismatches. Three formerly orphaned Big Machine Double Spiked records were removed; BYO 750ml case pack is now 1. This is a point-in-time check, not proof of all cross-table references.

Inventory import preview now rejects duplicate WS finished-good IDs, duplicate ProductIDs, conflicting repeated item case-pack values, stale Products.SubtypeID versus Releases.ReleaseType, and unresolvable named release subtypes. When SubtypeID is blank, legacy fallback via a uniquely matching release remains available, but must not silently override a contradictory nonblank ID. Changes on main: `9b246ffd` guard implementation; `1d68998b` regression cases. **Tests were added but not executed in this connector-only session; do not claim CI pass.** No Apps Script deployment or live Inventory import performed.

Next: run GitHub Actions/Node test suite and verify live preview against full source snapshots before enabling writes; investigate whether empty WS ID products should be blocked or handled as explicitly out-of-scope. Preserve user-approved blind-count permissions and map semantics.

## 2026-11-15 — Follow-up integrity implementation

Fixed preview identity collision: WS IDs are scoped by source (`raw` vs `FG`) so a raw material and finished good may share a numeric ID without being deduplicated. Scan barcode collisions still block preview. Corrected subtype-name normalization to use real whitespace regex (`/\s+/g`). Added regression cases for source ID collision, ambiguous scan payload, and trimmed subtype names. Commits: `102afe98`, `7fd1251a`, `f809f508`.

Executed seven targeted checks directly against the GitHub-fetched latest source in a JavaScript runtime: valid mapping, stale subtype, duplicate WS, unresolved release, blank-ID fallback, cross-source numeric ID, and ambiguous barcode: **7/7 passed**. Full Node suite/GitHub Actions not verified; container could not reach GitHub raw URL. No live import or deployment. Next: full suite in CI and full source-snapshot read-only preview, then fix reported data issues before writing ProductIndex.

## 2026-11-15 — Full live read-only import preview verified

Read actual connected sheets (not sample rows): WS Raw Materials `LiveData!A1:L6000` **1,077** populated snapshot rows; WS Finished Goods `LiveData!A1:L4000` **859** rows; SPIRITS `Products` **228**, `Releases` **228**, `BrandReleaseTypes` **105**. Executed latest GitHub `src/ProductIndexPreview.gs` functions against full source rows in JS: SPIRITS case-pack resolver **228 rows, 0 issues**; ProductIndex preview **749 distinct products** (**521 raw materials**, **228 finished goods**), **0 issues**, `ready=true`. Snapshot tables contain repeated inventory-location rows; deduplication is intentional. Initial raw read of 899 rows was incomplete and is superseded by this full-range verification. This is a **read-only preview**, not ProductIndex import, deployment, or CI proof. Next step: verify expected source-to-product coverage and identity semantics, then implement guarded import with atomic/idempotent behavior after user approval.

## 2026-11-15 — BLOCKER: cross-source identity collision

Full WS snapshots reveal **one actual numeric ID overlap** between 521 eligible raw materials and 228 FG SKUs: `112370` occurs in both categories. Previous preview `ready=true` was unsafe: while mapper scopes deduplication by source, `INV_HEADERS.ProductIndex` and `CountEntries` in `src/Code.gs` only store `WSItemID`, and `apiInventorySaveCount` matches by unqualified `WSItemID`. This can route a count to the wrong SKU. **DO NOT IMPORT YET.** Commit `c2f48a4` adds an explicit blocking issue for cross-source WS ID collisions; `957bf208` updates regression. Executed direct JS check: collision yields two preview products and `ready=false`, distinct IDs yield `ready=true`. No deployment or writes.

Required next implementation: introduce stable source-qualified canonical product key (e.g. `RAW:112370` vs `FG:112370`) across ProductIndex, CountEntries, client request and count aggregation; keep external WS IDs and scan payload separate. Update live sheet schema only through a reviewed migration with dependent-table compatibility, existing count history protection, and regression tests. This is distinct from SPIRITS snapshot duplicate-ID watchdog; each source ID is valid within its own namespace. Do not silently drop either product or force an invented replacement WS ID.

## 2026-11-15 — Safe sync planning while waiting for refreshed snapshot

User reports WS ID `112370` overlap already corrected upstream; tomorrow's WS snapshot should remove one of the conflicting source records. Do not alter WS/SPIRITS IDs or launch source-qualified key migration solely for this transient overlap. Keep cross-source collision watchdog blocking unsafe import until a fresh snapshot passes.

Implemented pure read-only `invPlanProductIndexSync_(preview, existingRows)` in `src/ProductIndexPreview.gs` (`2e0223c9`): compares validated preview to existing Inventory ProductIndex, classifies additions, field-level updates, unchanged records and missing-source records; refuses source changes, duplicate IDs, and unready previews. Missing-source rows are reported for review, **never automatically deleted/deactivated**. Regression tests added (`ecab6e3b`); six targeted JavaScript execution checks passed, but full Node/CI suite still unverified. No deployment, import, or sheet writes. Next: after refreshed WS snapshot, rerun full read-only preview, check raw UOM compatibility, run diff against actual ProductIndex and only then design reviewed admin-controlled write operation.

## 2026-11-15 — Live raw-material UOM validation

Read full WS raw `LiveData!A1:L6000`: eligible rows include Each 845, Pounds 73, Gallons 72, **FluidOunces 15 rows across five unique raw IDs** (`103182`, `103180`, `101393`, `112370`, `112373`). `apiInventorySaveCount` currently only supports Each/Pounds/Gallons for raw items. ProductIndex is still header-only (no data rows). Added pre-import UOM rejection to `invPreviewProductIndex_` (`f06d7a3`), plus regression test (`e58481e`). Direct JS checks verified unsupported FluidOunces blocks preview and sync planner; supported Gallons passes. This is a second source compatibility issue in addition to transient `112370` ID collision. Do not silently convert FluidOunces to Gallons/Pounds or discard five products. Next: design explicit FluidOunces count support (or reviewed UOM mapping), test and then rerun snapshot validation. No deployment/import/writes; full CI not verified.

## 2026-11-15 — CORRECTION: honor previously documented inventory scope

User pointed out prior Lucy had already documented exclusion rules. Re-read `docs/PROJECT_HANDBOOK.md`: blending ingredients are report-only (extended BMD report), `Fermentation_Support` is explicitly excluded from physical inventory and WS reconciliation, and unsupported raw UOMs are not counted. Previous latest handoff entry proposing FluidOunces count support is **superseded**. Actual five FluidOunces raw rows have WS class `Blending_Ingredient`, not literal `Fermentation_Support`, and thus are excluded from countable ProductIndex by the report-only rule. Updated `invPreviewProductIndex_` to include only `PACKAGING` raw class for physical-count catalog, alongside FG (`8a4f26d`); updated regression (`ec097de`). Read full raw snapshot: Packaging 837 rows/422 IDs; Blending_Ingredient 168/99; Fermentable 28/17; Barrel 18/16; Fermentation_Support 26/15. Targeted JS test with raw `112370` as blending and FG `112370` now yields 2 products (one unrelated packaging, one FG), `ready=true`, no collision. The existing collision watchdog remains for genuine eligible cross-source overlaps. Do not add FluidOunces count support. No live import/deployment; full Node/CI unverified. Next: rerun full source preview using revised scope and check packaging UOM, barcode and snapshot completeness before controlled import.

## 2026-11-15 — User correction: preserve legacy-UOM blending items for tracking

User explicitly clarified blending ingredients with unsupported legacy UOMs (FluidOunces, Kilograms, Grams) MUST remain visible in Inventory. They have effective WS quantity **0** under existing normalization, but a future mistaken update to a legacy item must be discoverable/auditable, not silently excluded. Therefore the immediately preceding 'packaging only' ProductIndex rule is **superseded**. Restored Packaging + Blending_Ingredient eligibility in `invPreviewProductIndex_` and removed the unsupported-UOM preview rejection (`568de601`); regression updated (`a2e61cb`). `Fermentation_Support` remains excluded. Preserve source UOM and raw source quantity in anomaly reporting; do not convert unsupported units or permit ordinary unsupported-UOM physical count entry without an explicit approved workflow. **Important outstanding gap:** current `invNormalizeRawQuantity_` zeroes unsupported UOM for WS reconciliation, but `WSRows` only stores effective quantity, so positive source quantities could become invisible. Build an admin anomaly report/log retaining raw quantity, UOM, item ID, warehouse, and snapshot timestamp before production import. The cross-source `112370` collision remains a blocker until refreshed snapshot or approved identity resolution. No live import/deployment. 

## 2026-11-15 — Extended report legacy blending watchlist

User confirmed five FluidOunces blending ingredients must stay on the Inventory list **for Extended Report 2**. Do not hide them merely because they have unsupported UOM; preserve their official source balances and flag unexpected nonzero balances. `src/WSSnapshots.gs` already writes `x.originalQuantity` to `WSRows.Quantity` (not the effective zero) and documents normalizing only at reconciliation. This corrects the prior handoff's inaccurate assertion that source quantity was lost. Added pure read-only `invExtendedLegacyUomWatchlist_(rows)` (`6ca44baa`), grouping unsupported-UOM Blending_Ingredient by WS ID, UOM and warehouse; returns SourceQuantity, EffectiveQuantity=0, and nonzero watchlist. Four targeted JS checks passed on representative records; full suite/CI not verified. No UI hookup, import, deployment or live writes. Next: wire this into Extended Report 2 and apply its existing extended-only ownership exclusions there; preserve separate physical-count eligibility decisions and do not allow unsupported UOM physical entry.

## 2026-11-15 — Read-only Extended Report 2 data endpoint

Added `apiInventoryAdminExtendedLegacyUomWatchlist({snapshotId})` to `src/WSSnapshots.gs` (`c349f728`): administrator-only, validates snapshot identity, reads stored `WSRows` (original source quantities), returns timestamp, grouped legacy blending ingredient items and nonzero watchlist. Targeted direct JS invocation with stubbed sheet reads passed; no live Apps Script test. This is a report **data endpoint**, not a finished Extended Report 2 UI/export. **Outstanding:** implement Extended Report 2 renderer/export, apply ownership exclusions to extra sections only, and validate that report uses snapshot source balances rather than effective zero for anomaly detection. No live writes or deployment.

## 2026-11-15 — Extended-only ownership exclusion wired

Updated `src/WSSnapshots.gs` (`bb315773`) to apply whole-token, case-insensitive `JYP`, `OTS`, `Dios`, `SCG` exclusions **only** inside the admin Extended Report 2 legacy blending watchlist endpoint. Physical counting, ProductIndex, WS reconciliation and Report 1 are unchanged. Direct JS checks: `JYP OTS Explorer`, `Dios Azul`, `SCG` excluded; `Pickers Original` and `LOTS of flavor` retained. These are currently default tokens in endpoint; **editable OwnershipExclusions table remains unimplemented**. Full Extended Report 2 UI/export and runtime/CI tests remain outstanding. No live writes or deployment.

## 2026-11-15 — Critical JS syntax repair in Extended Report 2

On continuing, inspected latest `src/WSSnapshots.gs` and found malformed JavaScript introduced by prior ownership-token edit: stray `function invExtendedLegacyUomWatchlist_(rows) {');` and leftover regex lines made entire Apps Script source invalid. Replaced matcher with safe split-on-nonalphanumeric whole-token Set lookup and removed invalid fragment (`da5f519`, `2bbdc11`). Executed full source via `new Function` successfully and verified targeted watchlist behavior: `JYP OTS` excluded, Pickers retained with original quantity 3 and effective 0, `LOTS` does not match `OTS`. **Next:** add persistent regression tests for syntax and ownership filters; implement editable ownership exclusions and Extended Report 2 UI/export. No deployment or live writes; full CI not verified.

## 2026-11-15 — Permanent Extended Report 2 regression coverage

Created `tests/ws-extended-report.test.js` (`5f844b0`) covering full `WSSnapshots.gs` JavaScript parse, whole-token ownership filtering, blending-only scope, original source quantity aggregation, effective zero, zero-balance behavior, and invalid source quantity. Updated `.github/workflows/inventory-tests.yml` (`beda5369`) to run it and trigger on `src/WSSnapshots.gs` changes. **CI run status not yet verified**, and no Apps Script deployment/live writes. Next: implement editable `OwnershipExclusions` table with safe schema migration, then Extended Report 2 UI/export.

## 2026-11-15 — OwnershipExclusions configuration read path

Added `src/OwnershipExclusions.gs` (`a3b98bc`) with a strict proposed sheet schema `Token,Active,UpdatedAt,UpdatedBy`, duplicate/token validation, safe fallback to JYP/OTS/Dios/SCG when the sheet is absent, and admin-only read endpoint. Extended legacy watchlist now reads these configured tokens (`02696ed`). Added `tests/ownership-exclusions.test.js` (`4463466`) and CI invocation (`6ec4a59`). **No table has been created or populated in the live Inventory DB, and no admin edit UI/write endpoint exists yet**. The fallback means no migration is required to keep current report behavior. Next: validate tests/CI, design controlled table creation and admin edit with audit, then Extended Report 2 UI/export. No deployment/live writes.

## 2026-11-15 — Explicit admin ownership setup/edit backend

Added admin-only `apiInventoryAdminInitializeOwnershipExclusions({confirm:'CREATE_OWNERSHIP_EXCLUSIONS'})` and `apiInventoryAdminSaveOwnershipExclusions({rows,expectedActiveTokens})` in `src/OwnershipExclusions.gs` (`739af294`). Initialization requires explicit confirmation, creates table only when absent, seeds four defaults; save validates tokens, checks existing schema, uses script lock and rejects stale **active-token** list. No automatic migration or live writes have occurred. **Caution:** stale-write detection only compares active tokens, not inactive rows, and Sheets operations are not transactional; strengthen full-row revision/audit before production use. Admin UI, comprehensive tests, Extended Report 2 UI/export and CI verification remain outstanding. No deployment.

## 2026-11-15 — Full-row ownership revision protection

Updated `src/OwnershipExclusions.gs` (`4d5d6e1`) so admin config read returns rows and deterministic `revision` including token, active flag, UpdatedAt, UpdatedBy; save now requires `expectedRevision` and rejects changes to inactive tokens or audit columns, rather than comparing active tokens only. Added regression assertions (`eff32caa`), targeted JS source execution confirmed inactive/audit changes produce different revisions. **API contract change:** admin clients must send `expectedRevision` instead of `expectedActiveTokens`; no UI client exists yet. Sheet writes are not transactional; full CI and live Apps Script testing not verified. No live DB writes/deployment. Next: add admin interface and test save workflow with mocked Sheets; Extended Report 2 UI/export remains pending.

## 2026-11-15 — Admin ownership configuration UI

Added admin-panel controls to `src/Index.html` (`7eab515`): load exclusions, preview defaults if table absent, explicitly confirm table initialization, add/edit active tokens, save with `expectedRevision`, reload after save, and display server errors. This UI is inside the existing administrator-only panel; backend authorization still required. **No browser/Apps Script integration test or deployment**. Important next work: mock-test full initialization/save paths and verify input handling; ensure complete audit and safe write semantics before production; implement Extended Report 2 renderer/export. No live DB changes.

## 2026-11-15 — Mock workflow tests and row deletion fix

Added mock-Sheets tests for admin initialization, confirmation rejection, duplicate setup rejection, stale revision rejection, save, and row removal (`febeb4c`, `de2ddd1`). Discovered that clearing removed token cells leaves blank rows inside `getLastRow()` and causes strict token validation to fail; changed save to `sheet.deleteRows` (`ad4f6e3`). **Tests committed but execution/CI not verified** (attempted ad hoc JS harness was incompatible with Node assert). Need run actual Node suite, test save workflow end-to-end, and consider partial-write recovery. No live DB writes/deployment. Extended Report 2 UI/export still pending.

## 2026-11-15 — Ownership web serialization and executable mock verification

Fixed Apps Script web-client compatibility by serializing `OwnershipExclusions.UpdatedAt` Date values to ISO strings in read responses (`2c634f5`), retaining full revision calculation from original sheet values. Added date regression (`9f6b533`, corrected VM realm setup `a7211fb`). Executed current ownership test source in an ad hoc JS harness with mocked fs/vm/assert: **PASS**, covering setup/save/stale edit/row deletion/date serialization. This is **not** actual Node CI or Apps Script browser verification. No live database writes or deployment. Next: run real Node CI; finish Extended Report 2 UI/export and production write-failure safeguards.

## 2026-11-15 — Extended Report 2 legacy UOM UI and CSV

Added admin-only saved WS snapshot selector (`src/WSSnapshots.gs`, `a5daf11`) and an Extended Report 2 **legacy-UOM subsection** to admin UI (`src/Index.html`, `e2d9715`, fixed CSV escaping `7f7a42a`). It lists grouped blending-ingredient unsupported UOM quantities, effective zero, warehouse and row count; includes nonzero anomaly count and client-side CSV export. Verified full inline HTML JavaScript parses with `new Function` after fixing malformed replacement. **This is not the complete Extended Report 2**: tanks, barrels, normal blending ingredients, full report/export and source integration still outstanding. No browser/Apps Script live test, CI verification, deployment or live DB writes. Next: add automated UI syntax tests and full report data sections; check CSV injection and permissions.

## 2026-11-15 — Extended legacy CSV safety and CI coverage

Corrected Extended Report 2 legacy-UOM CSV formatter to prefix formula-like cells with a real tab and separate rows with real CRLF (`04f33b2`); an earlier no-op commit `336da05` did not alter content. Added `tests/index-ui-syntax.test.js` (`b931084`) checking full inline script syntax, required controls, formula escaping, quote escaping and CRLF; CI now runs it on Index.html changes (`aa5a79c`). Direct JavaScript validation of formatter and syntax passed. **Node CI run itself still unverified**; no live DB changes/deployment. Full Extended Report 2 (standard blending, tanks, barrels) remains outstanding; avoid presenting legacy-only export as complete report.

## 2026-11-16 — Standard blending section added

Added read-only standard blending ingredient grouping (`Each`, `Pounds`, `Gallons`) by WS item/UOM/warehouse with source quantities preserved, ownership exclusions report-only, and explicit invalid quantity rejection (`src/WSSnapshots.gs`, `06256a9`). Added regression fixtures (`abb0dc4`) and changed admin Extended Report 2 UI/CSV to show both standard and legacy blending sections (`0a64ecd`). Inline JS parses. **No actual Node CI/browser verification, no deployment/live DB writes.** Remaining full Extended Report 2: tanks/bulk and barrels sources and integration; validate snapshot schemas and existing records before adding them. Test end-to-end and CI. Note: the previous legacy-only report endpoint remains for compatibility.

## 2026-11-16 — Barrel source section and snapshot export invalidation

Added read-only BARREL class grouping from existing stored WSRows (`a0a2ad0`) by WS item/warehouse/UOM, retaining original source quantity and setting EffectiveQuantity=0 (no invented conversion). Report-only ownership exclusions apply. Added barrel section to admin report table/CSV (`20e6d40`) and barrel fixtures (`a94ae10`). Fixed stale CSV export by clearing cached report whenever snapshot selection or snapshot list changes (`2900997`), added UI regression assertion (`f66ba0c`). Inline UI JavaScript parsed. **Important:** Barrel source shape/actual live data not revalidated this turn; stored snapshot must contain BARREL rows. Tanks/bulk data source still unverified; do not invent mapping. Node CI/browser/live Apps Script testing outstanding. No live DB writes or deployment.

## 2026-11-16 — Fresh ProductIndex source audit (read-only)

Re-read current `LiveData` in WS Raw Materials (1,075 populated rows) and Finished Goods (859 populated rows), plus SPIRITS `Products` (228), `Releases` (228), and `BrandReleaseTypes` (105). Eligible raw Packaging/Blending Ingredient IDs = **520**; unique FG IDs = **228**. Cross-source collision of eligible raw IDs vs FG IDs = **0**, including formerly problematic `112370` and `142325`. All 228 FG IDs appear in SPIRITS Products and all 228 product-to-subtype joins have matching brand and valid, matching `UnitsPerCase`; no missing FG IDs in SPIRITS. This is a source-level read-only audit, **not a successful run of the complete `invPreviewProductIndex_` engine or barcode collision checks**. Four distinct FluidOunces raw IDs remain (`103182`, `103180`, `101393`, `112373`); earlier five included `112370`, which is no longer raw. Next: run full preview engine with actual source data, test duplicate barcode/name/UOM conflicts and review diff against existing ProductIndex; no writes/import/deployment until preview ready.

## 2026-11-16 — Full live ProductIndex preview PASS (read-only)

Executed the actual `src/ProductIndexPreview.gs` functions `invResolveSpiritsCasePacks_`, `invPreviewProductIndex_`, and `invPlanProductIndexSync_` in JavaScript against fresh connected Sheets reads: WS raw LiveData 1,075 populated rows, WS FG LiveData 859, SPIRITS Products 228 / Releases 228 / BrandReleaseTypes 105, Inventory DB ProductIndex 0 rows (header only). Resolver **228 verified case-pack rows, 0 issues, ready=true**. Full preview **748 products = 520 eligible raw + 228 FG, 0 issues, ready=true**, including barcode and cross-source ID checks. Sync diff against current empty ProductIndex **748 adds, 0 updates, 0 unchanged, 0 missing, 0 issues, ready=true**. This is a real-source pure-engine execution, NOT a deployed Apps Script endpoint or completed import. No live writes/deployment. Next: review controlled ProductIndex import API design and authorization, consider source freshness and partial-write rollback before seeking approval for first import. Preserve legacy UOM products and verified subtype case packs.


## 2026-11-16 — Initial ProductIndex import guard (preparation only)

Added `src/ProductIndexImportGuard.gs` (`e37b3d9`) and `tests/product-index-import-guard.test.js` (`7854e85`). Pure initial-import gate requires a ready fresh preview, an empty target, exact explicit confirmation token, no updates/removals/reused rows, valid FG case packs, and preserves legacy raw UOMs. Full-field readback verification is provided. **No live import endpoint, authorization wrapper, source re-read adapter, transactional rollback, or deployment has been implemented. No ProductIndex rows written.** Next: connect a server-only admin-authorized fresh-source adapter; lock and stage full dataset; ensure failed writes cannot leave a partially visible ProductIndex (Sheets is nontransactional); run Node tests/CI and mocked failure-injection; only then request approval for live import. Never expose a client-controlled preview as trusted input.


## 2026-11-16 — Live ProductIndex preview UI (post first Apps Script deployment)

User verified clasp authentication, first Apps Script deployment version 1, Workspace administrator UI and database location reads. Legacy **Preview source catalog** displayed 937 unique items, 710 missing UOMs, and old collision 112370: that button called old `apiInventoryAdminCatalogPreview`, not the newer ProductIndex engine. Added `src/ProductIndexLivePreview.gs` (`576eae5`) with admin-only fresh reads from verified WS Raw Materials/FG LiveData and SPIRITS Products/Releases/BrandReleaseTypes, case-pack resolver, ProductIndex preview and existing-row diff; **no writes**. Updated `src/Index.html` (`28ac49d`) to expose **Validate ProductIndex sources** separately and relabel old check **Legacy catalog diagnostic**. Inline UI JS syntax parsed successfully; **live endpoint has not been deployed or tested**. Next: user `git pull`, `clasp push`, deploy a new version/update deployment, run new validation and compare to expected 748 (520 raw, 228 FG, 228 verified packs, zero issues). If source data changed, investigate; do not force expected counts. Import remains unapproved and unimplemented. Beware `clasp pull` creates duplicate .js files alongside tracked .gs files; do not use it in source repo. `.clasp.json` is local and untracked.


## 2026-11-16 — Deployed commit badge and Stats for Nerds

User requested SPIRITS/V4-style Git commit version at top right and bottom-left Stats for Nerds performance monitor before next deployment. Updated `src/Index.html` (`9bcc29e`) with version badge, bounded 500-line in-memory RPC/action log, RPC timing/status, Copy Results/Clear/Close, and browser click events. Added `.gitignore` (`5c1b2d4`) for local `.clasp.json`, generated `src/BuildInfo.gs`, and duplicate `src/*.js` created by clasp pull. Added `scripts/stamp-build.cmd` (`93a018a`) to generate the server endpoint `apiInventoryBuildInfo()` from the local Git HEAD before clasp push; generated file is not committed, but clasp includes it because `rootDir=src`. Run in CMD: `git pull origin main`, `scripts\stamp-build.cmd`, `clasp status`, `clasp push`, then update the existing Web App deployment to a new version. **Do not run clasp pull** in the source checkout. No live deployment/test yet; no database writes. Check browser Stats for Nerds, version stamp, RPC success/errors, and new ProductIndex preview after deployment. Current monitor measures browser-observed RPC latency (network + Apps Script) and click events, not granular server phases.


## 2026-11-16 — Version display verified; ProductIndex CI strengthened

User confirmed the deployed Inventory Web App now displays the Git commit after successful local stamp `2bc629ef`, 15-file clasp status and deployment. Fixed Windows stamp script in commits `ae7d14f` and `2bc629e`. Added `tests/product-index-import-guard.test.js` to GitHub Actions test execution and added `src/ProductIndexLivePreview.gs` / `src/ProductIndexImportGuard.gs` to workflow change triggers (`0071d0e`). **Next user action:** in the deployed administrator panel click **Validate ProductIndex sources** and share its results and Stats for Nerds RPC timing. Expected prior source baseline: 748 total (520 raw + 228 FG), 228 verified case packs, zero issues, 748 adds if ProductIndex still empty. Fresh sources may differ; investigate rather than force baseline. No live ProductIndex import approved or performed. GitHub CI result not yet verified; latest workflow changes not deployed and do not require an Apps Script deployment.


## 2026-11-16 — First deployed INV_PERF ProductIndex timing

User supplied deployed browser logs: apiInventoryBuildInfo 763ms OK; apiInventoryBootstrap 2586ms OK; apiInventoryAdminOverview 1873ms OK; apiInventoryAdminProductIndexPreview **11951ms OK**. The preview RPC succeeded but **its validation counts/ready/issues have not yet been supplied**; never infer a successful 748-item validation from RPC status alone. Next request user to share the visible ProductIndex preview summary (counts, ready, issues, adds). Performance follow-up: instrument server read/resolve/preview/diff phases without changing source eligibility or data; benchmark multiple runs before optimization. No live import/write authorized.


## 2026-11-16 — LIVE ProductIndex preview READY FOR REVIEW

User ran deployed administrator `Validate ProductIndex sources`: **READY FOR REVIEW**, 748 products (520 raw, 228 finished goods), 228 verified case packs, 748 adds, 0 updates, 0 unchanged, 0 missing, **0 issues**, server elapsed **9502ms**. Browser INV_PERF RPC duration **11951ms** (includes transport/queue). **No import performed.** Legacy SPIRITS-only catalog diagnostic is not authoritative for ProductIndex and its missing-UOM warnings must not block this validated preview. Next: develop/test guarded initial import with fresh revalidation, locking, staging/rollback, readback, and failure injection; require explicit user approval before live ProductIndex writes. Optimize source reads separately after phase timings; don't weaken validation.


## 2026-11-16 — Developer diagnostics phase 1 implemented (not yet deployed)

Implemented two approved improvements on main: `src/ProductIndexLivePreview.gs` (`3e74923`) now returns server-side `phases` timings for WS raw/FG reads, SPIRITS Products/Releases/Subtypes reads, case-pack resolver, ProductIndex validation, target read and diff; `src/Index.html` (`1fdb5fc`, `49f41c7`) logs SERVER phase entries in Stats for Nerds, shows phases in validation results, and adds **Copy Diagnostic Report** combining deployed version, browser RPC/action log, latest ProductIndex ready/counts/issues, server total and phase timings. Both files passed JavaScript parse check via `new Function`; **browser integration and GitHub Actions remain unverified**. No database writes, no ProductIndex import, no deployment performed. Next user deploy: `git pull origin main`, `scripts\stamp-build.cmd`, `clasp push`, update existing Web App deployment to New version; rerun ProductIndex preview and send Copy Diagnostic Report. Beware each documentation commit changes Git HEAD, so always stamp after the final pull.


## 2026-11-16 — Inventory GitHub Actions deployment workflow staged

User confirmed the production workbook is now named **SPIRITS** (formerly V4). Reviewed SPIRITS repo `BMD-V4-Backend/.github/workflows/deploy-v4.yml` as reference. Created Inventory `.github/workflows/deploy-inventory.yml` commit `68c2ff83` with manual `workflow_dispatch` only until credentials are configured and first deployment verified. Workflow runs seven regression suites, builds `deploy/` from `src/*.gs`, `src/*.html`, `src/appsscript.json`, stamps `BuildInfo.gs` from GitHub SHA, authenticates clasp, pushes and redeploys existing Web App version. Required repository Actions secrets: `CLASP_CREDENTIALS` (valid JSON token for Apps Script account; may reuse SPIRITS credential value securely), `INVENTORY_APPS_SCRIPT_ID` (Inventory script ID, not SPIRITS), `INVENTORY_WEBAPP_DEPLOYMENT_ID` (Inventory existing deployment ID). Connector cannot read or set GitHub secrets; user must configure these once in Inventory repo Settings > Secrets and variables > Actions. **Not deployed yet; no evidence secrets exist or workflow succeeded.** After first manual workflow success and user confirms version in Web App, enable auto-deploy on main (prefer code-path triggers, not documentation) to avoid failed Actions while unconfigured. Do not copy SPIRITS script/deployment IDs or expose credentials in GitHub. ProductIndex import remains unauthorized.


## 2026-11-16 — First GitHub deployment attempt and source-count fix

User configured all three Inventory GitHub Actions secrets and manually triggered Deploy Inventory Web App #1 (run `43918767883`). All seven regression test commands passed. Job failed at `Prepare versioned Apps Script source` **before clasp push/redeploy** because workflow expected >=14 `.gs`/`.html` files, but repository `src/` contains exactly 13. Corrected threshold to >=13 in commit `3d8fbe5a` on `main`. **No successful deployment yet**. Next: user must start a NEW `workflow_dispatch` run on `main` (rerunning old failed job uses old SHA and will repeat failure); inspect run, fix subsequent errors, then verify Web App commit badge and enable automatic main deployments after successful first run. Secrets were populated in job environment but values not inspected. ProductIndex import remains unauthorized.


## 2026-11-16 — Automated Inventory deployment working

GitHub Actions deployment #2, run `43919121922`, succeeded on commit `45e9d304`: all seven regression suites passed; `clasp push --force` pushed 15 files (including generated BuildInfo.gs and appsscript.json), `clasp version` created version 3, and `clasp redeploy` updated the existing Inventory Web App deployment to version 3. User provided green run screenshot; GitHub job logs independently confirm. Enabled automatic push-to-main deployment for `src/**`, `tests/**`, and deployment workflow changes in commit `9feebf4c`. Workflow retains manual dispatch, serial concurrency, regression tests, and secure GitHub secrets. The auto-enable commit itself triggers a follow-up deployment; inspect its result. Docs-only changes do not trigger deployment. No ProductIndex import performed. User should refresh Web App and verify version badge matches most recently successful deployment SHA; if it doesn't, inspect workflow and caching.


## 2026-11-16 — ProductIndex protected import preparation, staging only

User provided live diagnostic on deployed `9feebf4c`: preview READY, 748 products (520 raw, 228 FG), 228 verified packs, 0 issues, server 3217ms, browser RPC 5978ms; WS FG read 1128ms, WS raw 716ms, SPIRITS products 621ms. Agreed to keep reads fresh and prioritize protected initial import. Added pure read-only `invStageInitialProductIndex_` and `invVerifyStagedProductIndex_` in `src/ProductIndexImportGuard.gs` (commit `8dd5b907`), with negative tests in `tests/product-index-import-guard.test.js` (commit `d5831c12`). Staging checks existing initial-import guard, preserves all nine fields, and rejects row-count, header, and cell readback mismatches. **No server-side writer or public import endpoint, no ProductIndex import, no live data mutation.** Automatic deployment/tests triggered; inspect run results before claiming success. Next implement lock-protected fresh source revalidation and durable backup/staging/audit/rollback with failure injection tests; keep actual import disabled until user separately explicitly authorizes it. Do not infer that a pure staging plan is a transaction or rollback implementation.


## 2026-11-16 — Locked read-only initial import preflight

Confirmed previous staging commit `d5831c12` deployed successfully. Refactored fresh WS/SPIRITS/ProductIndex read and diff into `invProductIndexFreshPlan_` in `src/ProductIndexLivePreview.gs` (commit `4ac02ac3`) while preserving the existing admin preview response shape and phase timings. Added `src/ProductIndexImportPreflight.gs` (commit `0af3cf17`): admin-only `apiInventoryAdminProductIndexImportPreflight` acquires `LockService.getScriptLock()` with 15-second tryLock, re-reads all three source spreadsheets and ProductIndex under lock, runs existing initial-import staging guard, returns only dry-run counts/issues/timings, and releases lock in `finally`. There is **no writer**, no import approval endpoint, and no persistent mutation. Added mocked lock/preflight tests in commit `ee9c63a4`. Auto CI/deploy queued; verify outcomes. Next: plan durable backup/audit/recovery strategy, avoid adding any production writer until explicitly authorized by user. Note: the preflight internally supplies the guard's test token solely to evaluate readiness; it is not a user authorization and cannot write. No ProductIndex import performed.


## 2026-11-16 — ProductIndex recovery assessment, no writes

Confirmed previous locked preflight `ee9c63a4` deployed and tested successfully. Added `src/ProductIndexRecovery.gs` commit `cf0c5bcf`: pure `invAssessInitialProductIndexRecovery_` distinguishes EMPTY, MATCHES_STAGE, REQUIRES_RECOVERY, BLOCKED, detects missing, foreign, altered and duplicate records, and refuses automatic retry on nonempty targets. A supplied journal reference alone never authorizes rollback; durable backup and operator review are still required. Added pure validated audit event factory for PREPARED, BACKUP_VERIFIED, WRITE_STARTED, WRITE_VERIFIED, FAILED, RECOVERY_REQUIRED and RECOVERED; it does not persist audit records. Expanded tests in `tests/product-index-import-guard.test.js` commit `aadaec23`. CI/deploy triggered; check final status. **No backup creation, persistent audit journal, rollback executor, import writer or public import action exists. No ProductIndex data imported.** Next implement durable backup/audit and failure injection in a nonproduction mocked adapter; do not activate production write without separate explicit user approval.


## 2026-11-16 — Stage 4 mock transaction and failure injection

Confirmed `aadaec23` automated deployment and tests successful. Added `src/ProductIndexTransactionSimulator.gs` in `db6471e1`: dependency-injected, non-RPC mock transaction harness with backup-before-write, durable-backup acknowledgment requirement, PREPARED/BACKUP_VERIFIED/WRITE_STARTED/WRITE_VERIFIED audit phases, full staged readback verification and conservative FAILED/RECOVERY_REQUIRED result on write errors. It **never automatically clears partially written rows**. Added tests in `tests/product-index-import-guard.test.js` commit `34a0e2fe` for success, partial write, backup failure, audit failure, and nonempty target. This is a **simulation only**: no production SpreadsheetApp writer, no actual persistent backup or journal, no rollback executor, no import endpoint and no ProductIndex import. CI/deploy pending; check results. Next: ensure production durable backup/audit architecture and explicit approval design before introducing any real write path. Do not mistake simulated backup for real durable backup.


## 2026-11-16 — Stage 5 durable evidence contract (pure, not persisted)

Confirmed Stage 4 `34a0e2fe` CI and automatic deployment success. Added `src/ProductIndexDurableEvidence.gs` commit `ebc4ff17`: fail-closed pure validation of a separately persisted immutable initial-target backup, actor/import ID binding, durable ordered PREPARED/BACKUP_VERIFIED journal, matching backup references, and exact independent readback. Tests for valid evidence and altered/missing/undurable evidence added in `tests/product-index-import-guard.test.js` commit `7328b080`. No actual backup persistence or audit storage adapter exists yet, no live ProductIndex writer, no import RPC, no database mutation. CI/deploy pending; check status. Next choose isolated durable storage strategy (separate restricted Drive backup and append-only journal with readback) and implement its adapter behind a disabled gate, with failure tests and explicit operator approval before any import.


## 2026-11-16 — Stage 6 unexposed Drive evidence adapter

Confirmed `7328b080` tests/deployment successful. Added `src/ProductIndexEvidenceDrive.gs` commit `1a89f401`: internal-only Drive JSON evidence persistence helpers for a future import. They require script property `INV_PRODUCT_INDEX_EVIDENCE_FOLDER_ID`, validate import IDs, refuse duplicate file names, write separate empty-target backup and PREPARED/BACKUP_VERIFIED journal files, independently read them back by file ID, and validate against the pure durable evidence contract. Added mock Drive tests commit `75773b6e` for successful readback, duplicate IDs, and nonempty target. CI/deployment pending verification. **IMPORTANT:** Drive files are not inherently immutable or transactional; `immutable:true` is a logical contract flag, not WORM enforcement. Folder permissions and tamper resistance must be reviewed before live activation. Backup/journal writes are non-atomic, and failure of second file intentionally retains first for manual review. No production RPC invokes this adapter; no evidence files were created in actual Drive, no ProductIndex writer/import, and no database changes. Next harden evidence integrity and independent journal append design, then separately request user approval before enabling any real ProductIndex import.


## 2026-11-16 — Stage 7 audit chain validation

Confirmed Stage 6 commit `75773b6e` CI and deployment success. Added `src/ProductIndexAuditChain.gs` commit `662716da`: pure sequence/identity/predecessor validation and explicit audit state transitions PREPARED -> BACKUP_VERIFIED -> WRITE_STARTED -> WRITE_VERIFIED or FAILED -> RECOVERY_REQUIRED -> RECOVERED. Audit events require unique IDs and predecessor links. Tests added in commit `289a2484` for correct chain, reordering, broken predecessor, duplicate event and invalid transitions. This is **not** cryptographic tamper proofing or a durable append-only file adapter: Drive folder access control and readback remain necessary. No live audit event files, ProductIndex import writer, or import authorization action has been activated. Check CI/deploy for `289a2484`. Next build a write-once per-event Drive persistence adapter, ensure independent readback and concurrency controls, and require explicit approval before actual ProductIndex import.


## 2026-11-16 — Stage 8 private per-event Drive audit adapter

Confirmed `289a2484` CI/deploy successful. Added `src/ProductIndexAuditDrive.gs` commit `ff90bf6e`: private, unexposed per-event Drive JSON persistence, strict contiguous sequence file names, full audit-chain validation on each read, and independent readback after each append. Requires caller-held script lock; Drive is not immutable/WORM and does not prevent edits by privileged users. Tests commit `6947d267` mock append, ordered readback, invalid transition, duplicate event ID and sequence gap. Check CI/deploy. This adapter is NOT wired into an import action or existing legacy journal file; production migration and durable audit integration remain future work. No live Drive files or ProductIndex writes. Next: verify test status; assess race/permissions and cryptographic content integrity; request explicit approval before enabling any actual ProductIndex import.


## 2026-11-16 — Stage 9 SHA-256 evidence integrity

Confirmed Stage 8 `6947d267` tests and deployment succeeded. Added `src/ProductIndexEvidenceIntegrity.gs` commit `7acbad72` with SHA-256 evidence envelopes using Apps Script Utilities digest. Updated `src/ProductIndexEvidenceDrive.gs` commit `e3dbb9e9` to envelope JSON files and verify hashes on every readback. Expanded mocked tests commit `d4c1cd3d` with digest verification and tampered Drive file rejection. Check CI and deploy. Integrity hash detects content changes **only if attacker cannot replace both content and hash**; Drive permissions, independent trusted digest anchoring, concurrency and actual durable journaling integration still need review. No live Drive files, no import RPC, no ProductIndex writer, and no database changes.


## 2026-11-16 — Stage 10 access policy and Drive collision checks

Confirmed Stage 9 `d4c1cd3d` CI and deployment success. Updated `src/ProductIndexEvidenceDrive.gs` commit `dbaf667b` to detect post-creation duplicate filename races; it throws and retains evidence for investigation instead of deleting anything. Added pure fail-closed `src/ProductIndexEvidenceAccessPolicy.gs` commit `3de8caff` to reject broad public/domain/group permissions, missing owner or incomplete permission inspection. Tests commit `8ee87243` cover broad permissions and concurrent duplicate filename creation. **Access policy is not wired to a real Drive permission inspector; it does not claim actual folder permissions have been inspected.** No production import path or live Drive files. CI/deploy check pending. Next: implement read-only permission inspection (requires Drive API permission visibility) and explicitly review folder ownership before any import authorization.


## 2026-11-16 — Stage 11 read-only folder permission inspection

Confirmed Stage 10 `8ee87243` tests/deployment successful. Added private `src/ProductIndexEvidencePermissionInspection.gs` commit `90bd33f7` for Advanced Drive Permissions.list read-only pagination, feeding the existing fail-closed access policy. It **always returns ready:false**, even for owner-only ACLs, until an administrator reviews inherited/shared-drive permissions; missing Drive advanced service, incomplete listings and API errors also fail closed. Added mocked tests commit `a26e1980` for missing API, owner-only, public permission, and API failure. Check CI/deploy. No real folder ID configured or permission inspection executed, no Drive files created, no ProductIndex writer/import. Next: design explicit approval gate and resolve inherited permission/Drive service setup, without activating writes.


## 2026-11-16 — Stage 12 pure import authorization review checklist

Confirmed Stage 11 `a26e1980` CI and deployment success. Added `src/ProductIndexImportAuthorizationReview.gs` commit `63cea4fb`: pure fail-closed checklist requiring admin identity, fresh successful empty-target preflight, staged rows, verified source fingerprint, backup/audit verification, folder permission and inherited-access review, exclusive lock, operator risk acknowledgment, and separately recorded explicit approval. It **always** returns `importEnabled:false`, including if every flag is true: it cannot approve or execute an import. Tests commit `04c6c669` cover passing checklist with disabled import, nonempty target, missing inherited review, missing approval and null input. This is a specification, not a wired endpoint or real approval workflow; inputs are not trusted attestations. No ProductIndex import or Drive evidence writes. Next: inspect test/deploy and plan independently verifiable approval and fresh source fingerprints without exposing a writer until user explicitly authorizes import.


## 2026-11-16 — Stage 13 deterministic staged ProductIndex fingerprint

Confirmed Stage 12 `04c6c669` CI/deployment successful. Added pure `src/ProductIndexStageFingerprint.gs` commit `d866fd4d`: SHA-256 over canonical JSON of staged headers, ordered rows and count; verification fails closed on changed/missing/invalid fingerprint. Tests commit `9316eb07` cover unchanged, changed, reordered, missing fingerprint and invalid count. **Important distinction:** this verifies staged output equality, not every byte of raw WS/SPIRITS source snapshots; source-specific fingerprints and fresh lock-held rereads remain required before any eventual import. No import writer, live Drive writes or ProductIndex mutation. Check CI/deploy. Next integrate fingerprint into read-only preflight result and test it, keeping import disabled.


## 2026-11-16 — Stage 14 five-source fingerprints in read-only preflight

Confirmed Stage 13 `9316eb07` CI/deploy success. Added `src/ProductIndexSourceFingerprint.gs` commit `48fe82aa` with SHA-256 fingerprints of all five normalized source row datasets (WS raw, WS finished goods, SPIRITS Products, Releases, BrandReleaseTypes). Integrated source fingerprints into fresh source plan commit `aed0b292`; read-only admin preflight now returns both source fingerprints and stage fingerprint when ready (commit `5c18b612`). Mock tests commit `cd9c638e` detect changed/missing source rows. **Scope:** these hashes cover normalized, nonblank source records after display-value conversion; they do not cover unused columns, source formatting, blank rows, or original raw sheet bytes. Preflight is still read-only and no import authorization or writer is enabled. Check CI/deploy. Next: compare fresh source fingerprints under lock against a trusted prior snapshot and address the remaining permission/approval workflow.


## Stage 14 CI correction

Initial Stage 14 `cd9c638e` CI and deploy failed because the locked preflight mock did not provide the newly required stage fingerprint helper. Fixed mock dependencies and assertions in `a3fdf584`; CI tests passed. Await latest deployment completion. This was a test-harness failure, not a ProductIndex write. No import or live data changes.


## 2026-11-16 — Stage 15 trusted preflight comparison (pure)

Added `src/ProductIndexTrustedPreflightCompare.gs` commit `1ad5fea6` to compare a freshly validated source plan and stage against independently retained source/stage fingerprints, returning `importEnabled:false` unconditionally. Fresh source snapshots now remain in the private in-memory plan (`c59a5737`), not exposed in the preflight RPC response. Mock tests `8915f27d` cover unchanged, changed source, changed stage and missing trusted fingerprints. **Not wired to an import writer or a public RPC; no trusted fingerprint storage exists yet.** A script lock and trusted external snapshot must be supplied by a future caller. No live ProductIndex or Drive writes. Check latest CI/deploy before declaring complete. Next design a read-only comparison endpoint with explicit caller-supplied trusted fingerprints, bounded validation and lock-held fresh reads, or independently anchored evidence storage; do not implement import without explicit approval.


## 2026-11-16 — Stage 16 admin read-only fingerprint re-verification

Confirmed Stage 15 `8915f27d` CI and deployment success. Added `src/ProductIndexVerifyPreflight.gs` commit `44290f72`: administrator-only read-only endpoint `apiInventoryAdminProductIndexVerifyPreflight(trusted)` reacquires script lock, rereads all five WS/SPIRITS source datasets and ProductIndex, rebuilds staging, compares source and stage fingerprints against caller-retained values, releases lock in finally and always returns `importEnabled:false`. Missing fingerprints return a nonmatching result. Caller-provided fingerprints are **not independently trusted or persisted**, and this endpoint is NOT import authorization. Tests commit `9f054ca7` cover unchanged/changed/missing fingerprints and lock lifecycle. No import writer, ProductIndex mutation or Drive writes. Check CI/deploy. Next improve fingerprint schema validation and test lock contention/exceptions; independent trust/approval and evidence permissions remain unresolved.


## 2026-11-16 — Stage 17 fingerprint schema and fail-closed validation

Confirmed Stage 16 `9f054ca7` CI/deploy success. Hardened `src/ProductIndexSourceFingerprint.gs` (`17f92b3c`) to validate all five expected source table hashes and nonnegative safe counts, compare fields independent of object key order. Hardened `src/ProductIndexTrustedPreflightCompare.gs` (`32101846`) to reject unresolved fresh/staged issues and reuse schema-aware source verifier. Tests `e3b05c93` cover malformed hash/count, reordered table keys and unresolved issues. Check CI/deploy before claiming success. The endpoint remains read-only and caller-provided fingerprints are not trusted authorization; no live import or evidence writes. Next test lock contention, exceptions and malformed inputs at the admin endpoint; consider bounded request size and verified independent fingerprint anchor.


## 2026-11-16 — Stage 18 verification endpoint failure-path hardening

Confirmed Stage 17 `e3b05c93` backend CI and deploy successful. Updated `src/ProductIndexVerifyPreflight.gs` commit `dedef184` to validate five-table source fingerprint schema and staged fingerprint format, count, SHA-256 before acquiring lock; malformed input fails closed without fresh reads. Added mock tests commit `efb61288` for invalid source/stage hashes, script lock contention (no unlock if not acquired), and source read exception (lock always released). Check CI/deploy. This remains an admin-only read-only comparison of caller-supplied hashes, NOT trusted approval. No ProductIndex import or live evidence writes. Next: verify run results; consider independent fingerprint anchoring and explicit approval design before any writer.


## 2026-11-16 — Stage 19 pure preflight anchor record contract

Confirmed Stage 18 `efb61288` CI and deployment successful. Added `src/ProductIndexAnchorRecordContract.gs` commit `e5de00ac` defining an expiring, identity-bound, five-source and staged fingerprint anchor record with empty-target and independent-review fields. This is **structural validation only**: a caller could forge the boolean `independentVerification`; there is no cryptographic signature, independent storage, approval authority, or writer. It always returns `importEnabled:false`. Tests commit `d391c5af` cover valid synthetic record, expiration, not-yet-valid, missing fingerprints, missing review and null record. Check CI/deploy. No ProductIndex or Drive writes. Next plan a genuine independent server-side anchor with access controls and verification rather than trusting client flags; require explicit authorization before enabling evidence persistence or import.


## 2026-11-16 — Stage 20 functional counting workflow: self-service team selection

Moved from ProductIndex security-only stages to Phase 1 functional development. Added `apiInventorySelectTeam` in `src/Code.gs` (`602e23a1`, corrected request validation `f8b2671a`): an authenticated active user can lock Team A/B, must unlock before switching, and team is stored in existing AppUsers columns under script lock. Existing count rows retain their saved team. Added Team A/B selector and Lock/Unlock button in `src/Index.html` (`c96ab978`); counting buttons require locked team. Added mocked team transition tests (`3eaad068`). CI/deploy must be checked. No live user settings or inventory records changed by development; real user team changes occur only when an authorized user explicitly presses the new control. **Outstanding:** admin user-management UI still shows legacy Assigned Team controls; remove or reconcile them to enforce self-service-only policy. UI has not been warehouse-tested. ProductIndex import remains disabled; no live import or Drive evidence writes. Next prioritize actual count UX (location lock, pallet children, corrections), blind ownership and map testing; avoid endless preflight-only stages.


## 2026-11-16 — Stage 21 Phase 1 team permissions and location UX

Confirmed Stage 20 `3eaad068` CI and deployment succeeded. Removed obsolete administrator Assigned Team/Team Locked controls from `src/Index.html` (`c06a2ee4`); admin user upsert in `src/Code.gs` (`cdec4f9e`) now preserves existing team/lock state instead of overriding self-selected teams, including when a legacy request includes team fields. Added temporary client-side location Lock/Unlock (`bb54a2d5`): disables Warehouse/Bay/Location selectors while locked, allows consecutive submissions, no server-side location lock and no Finish Location action. Added mocked admin preservation test (`e18dae56`), verify CI/deploy. No live database changes. Remaining: pallet child submissions, editing constraints, warehouse device testing, UI performance, and ProductIndex import authorization. Note: location lock is deliberately UI-only; other browser tabs can select different locations. Check user-facing team unlock and unsaved form handling before release.


## Stage 21 follow-up CI fixes

Added regression test for admin user updates preserving counter-owned team and lock state (`e18dae56`). CI revealed pre-existing invalid email regex in `apiInventoryAdminUpsertUser`, fixed in `7001526a`. Subsequent CI revealed test mock incorrectly modeled AppUsers seven-column writes, fixed in `2509273b`. Await final CI/deployment result. Do not claim warehouse validation. No live data mutation performed.


## 2026-11-16 — Stage 22 count UI validation and retry guardrails

Confirmed Stage 21 final `2509273b` CI and deployment succeeded. Updated `src/Index.html` (`bd59794d`) to reject blank, fractional, non-integer, or unsafe quantity input before an RPC; require locked team/session/location/product for Save and locked team for EMPTY; and restore Save/EMPTY button disabled state from team permissions after success or failure instead of blindly enabling them. Added static UI regression checks in `tests/index-ui-syntax.test.js` (`4c9baebf`) for these guards, team controls, and removal of admin team overrides. Updated server error message in `src/Code.gs` (`1287bb0e`) to reflect self-service team locking. CI/deployment pending verification. No live writes. **Next:** implement pallet entry multiplier and child-count semantics only after checking handbook requirements; ensure per-pallet records remain independently auditable, and add realistic end-to-end mocked tests. Also verify phone barcode scanning, location map and warehouse flows before production.


## 2026-11-16 — Stage 23 pallet family planning, read-only preview

Confirmed Stage 22 `1287bb0e` CI and deployment passed. Added pure `src/PalletChildPlanner.gs` (`56b3d190`) to expand default-one full pallet, optional partial cases and loose bottles into deterministic parent-suffixed child records, with A..Z, AA.. rollover, validation and safe bounds. Parent is metadata only; bottles are not multiplied. Added mocked planner tests (`84e23859`) and CI job wiring (`abc03519`); planner tests passed in CI at `abc03519`. Added explicitly **preview-only** finished-goods pallet controls (`0628461d`) and UI assertions (`321e052c`). **Do not confuse preview with saving:** existing Save still persists one ordinary count; multi-pallet batch persistence is NOT wired and should not be enabled until atomic/idempotent family retry and recovery are tested. No live inventory data writes. Next implement robust private batched family persistence and mock recovery under script lock, then wire UI only after testing and ownership checks. Verify latest CI and deployment.


## 2026-11-16 — Stage 24 pallet family recovery safety

Confirmed Stage 23 `321e052c` tests and deployment passed. Added pure `src/PalletFamilyRecovery.gs` (`a5f71343`) to classify parent-child pallet families as EMPTY, COMPLETE, PARTIAL or BLOCKED, rejecting duplicates, unexpected children, changed quantity/UOM, deleted child or parent mismatch. PARTIAL deliberately disallows blind append because Google Sheets batch writes are not transactional; safe recovery must be designed before enabling live multi-pallet persistence. Added recovery fixture tests (`618e3402`) and CI workflow coverage (`70634134`), with CI passing for `70634134`. Found and fixed a dangerous UX ambiguity: the Stage 23 preview could show multiple pallets while Save wrote only one row. `src/Index.html` now blocks Save when full-pallet multiplier differs from 1 or partial cases/loose bottles are specified (`03698967`); static regression assertion (`2759f819`). Existing single-row Save remains available for a simple one-pallet case count. Latest CI/deploy pending. No live inventory writes or ProductIndex import. Next implement idempotent family persistence with server-side identity/product/location/session validation, immutable request fingerprint, recovery protocol, one locked batch write, tests for interrupted writes and collisions, and only then enable UI.


## 2026-11-16 — Stage 25 private pallet family batch persistence

Confirmed Stage 24 `2759f819` CI/deployment successful. Strengthened `src/PalletFamilyRecovery.gs` (`ba69e9d3`) to check immutable session, location, product, team, creator, method and notes on idempotent retries, not just child quantity/UOM/parent. Added **private only** `invSavePalletFamilyPrivate_` in `src/PalletFamilyPersistence.gs` (`e781d697`): server-derived user/team, open session and active location/product validation, FG case pack check, script lock, complete-family duplicate detection, conflict/partial fail-closed, EMPTY conflict check, one rectangular batch write for all children, shared parent metadata in ParentEntryID. Does not expose an RPC or wire UI; **live multi-pallet save remains disabled**. Added mock tests (`f49c088d`, expectation fix `e451ca0f`) for seven children, one write, duplicate retry, changed payload, partial family, write exception, lock contention, and lock release; CI wiring `ef1db145`. Mock test passed in CI on `e451ca0f`; check final CI/deploy for `ef1db145`. Caveat: Google Sheets writes are not transactional; partial family is blocked for administrator recovery, not automatically repaired. Additional safety before enabling live: independent family request digest/intent ledger for altered payloads, concurrency/performance testing, review whether default-one preview should be replaced by batch UI, and verify permission isolation. No live ProductIndex or inventory data writes during development.


## 2026-11-16 — Stage 26 post-write family verification

Confirmed Stage 25 `ef1db145` backend tests passed and preceding deployment `e451ca0f` passed. Updated private `src/PalletFamilyPersistence.gs` (`674ff674`) to reread `CountEntries` while still holding script lock and verify the complete family after the single rectangular write, before returning success. Acknowledged-but-partial writes now raise a fail-closed error and a retry with the same parent is classified PARTIAL, not appended. Extended mocked tests (`7bd75d83`) to simulate a Sheets write that returns successfully after writing only two children. Initial CI failure was only an overescaped test regex; corrected in `c4730b55`. Verify CI/deployment before claiming final success. Private writer is NOT a public RPC and multi-pallet Save remains disabled; no live inventory writes. Next: add admin-only read-only family diagnostics, immutable intent evidence to distinguish modified payloads from incomplete writes, and real Apps Script latency/permission tests before UI activation.


## 2026-11-16 — Stage 27 administrator pallet family diagnostics

Confirmed Stage 26 `c4730b55` CI and deployment succeeded. Added `src/PalletFamilyDiagnostics.gs` (`3a45956d`) with administrator-only, read-only `apiInventoryAdminPalletFamilyInspect({parentSubmissionId,sessionId})`. It locks during inspection, scopes by parent/session, caps rows at 200, checks duplicate IDs/suffixes, parent linkage, session/team/location/product/creator consistency, quantity/UOM/multiplier and active status, and returns aggregate cases/bottles and issue codes. No repair, delete, or write. **Important limitation:** a structurally valid observed family cannot prove that no children are missing without a trusted original intent record; endpoint explicitly returns `intentVerified:false`. Added isolated tests (`625c30ad`) for permissions, missing family, aggregates, duplicate IDs, cross-team conflict, inactive child and lock contention. CI workflow updated (`96b8663a`). Check final CI/deploy. Private pallet batch writer remains unexposed; employee Save still blocks multi-child preview. No live inventory records modified during development. Next design immutable server-side intent journal and safe reconciliation, then enable verified UI only after role and warehouse tests.


## 2026-11-16 — Stage 28 canonical pallet intent contract (pure)

Confirmed Stage 27 `96b8663a` CI passed; Stage 27 preceding deployment `625c30ad` passed. Added `src/PalletIntentContract.gs` (`12243b63`) defining a deterministic server-derived submission intent including authenticated creator/team, session, location, product, method, notes, parent ID, ordered child IDs/types/quantities and totals. It uses the existing child planner and exact canonical comparison; tests (`ae385f56`) detect changed quantities, location/product, notes, method, creator and team, and reject invalid inputs. CI wired (`78fcbc96`); tests passed on `ae385f56`, check latest CI. **Critical distinction:** this is a pure intent contract only, not immutable storage, not a cryptographic signature, not an RPC and not proof of original submitted intent. Before live pallet saves, implement a server-owned append-only intent journal with write-before-children protocol, retry/partial recovery, reconciliation, ownership and permission tests. No live inventory data writes or ProductIndex import. Employee multi-pallet Save remains disabled.
