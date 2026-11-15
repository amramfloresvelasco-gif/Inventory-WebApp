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
