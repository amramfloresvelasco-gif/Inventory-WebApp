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
