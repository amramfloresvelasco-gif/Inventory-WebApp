# Inventory Web App — Progress Log

## 2026-11-15 — Project initialized

**Repository:** https://github.com/amramfloresvelasco-gif/Inventory-WebApp  
**Branch:** main  
**Stage:** Phase 1 requirements/layout design.

### Confirmed
- Separate Inventory Web App, referencing SPIRITS enriched Finished Goods, Raw Materials and **active** Warehouses.
- Inventory-owned location table and count/history records; WS quantities for later reconciliation.
- Phase 1 = Inventory Entry; Phase 2 = Reconciliation.
- Team selector: Blue or Green; scan or manually choose Warehouse→Bay→Location.
- Product scan or manual Packaging/Finished Goods selection with dependent dropdowns.
- Location Empty and Item Not Counted statuses; notes; Stay in Location and Change Location submission actions.
- Finished Goods case and loose bottle quantity in the same submission.
- Full-pallet multiplier defaults to **1**; partial pallet and loose bottles supported; 5×100 cases + 1×50 cases + 4 bottles = **7 records** for 550 cases + 4 bottles.
- Legacy screenshot and three scripts supplied for behavior review, not wholesale reuse.

### Work performed
- Verified the new repository exists and is writable.
- Prepared and published initial README, Project Handbook, Progress Log, and Next Lucy Handoff on `main`.

### Not yet performed
- App source code, database/schema verification, scripts deployment, UI implementation, performance tests.

### Next
- Resume Phase 1 layout walkthrough with user; resolve remaining UX details, particularly fast direct-case entry and multiple partial pallets.
- Only then plan and build backend. Keep this file and handoff current with verified commits and tests.

### 2026-11-15 — Location master clarification

User confirmed that **Packaging and Finished Goods already use the same databases as SPIRITS**. Do not duplicate them. **Inventory must create a new Locations table**. Active warehouses remain SPIRITS-managed. Proposed Location fields documented as a draft only; actual table not created. Next: confirm location hierarchy, barcode format and identifiers with user, then inspect SPIRITS schemas.

### 2026-11-15 — Existing labels and barcode formats

Confirmed physical locations already have naming and printed barcodes. Dry Goods/Packaging currently use 2D barcodes; Finished Goods use QR codes. Future migration to all QR is possible. Preserve existing identifiers and support both formats; clarify code samples and whether formats apply to products/locations. Documentation only; no database or scanner implementation yet.

### 2026-11-15 — Unique barcode confirmation

User confirmed everything already has a unique barcode. Location scans and product scans will use existing identifiers. Barcode payload examples and location import source remain to be verified. No implementation yet.

### 2026-11-15 — Visual progress map requirement

User supplied a PULASKI BAY 1 warehouse-layout screenshot and requested a progress map linked to the new Locations table. Status colors confirmed: neutral/uncolored = not started, yellow = one team started, red = both teams differ, green = 100% match. Preserve physical lane/rack arrangement. Suggested, not approved: Finish Location action to prevent false mismatch during partial counting; clickable location details and summary metrics. No map implemented. Next ask for editable/source layout and agree how a team signals location completion.

### 2026-11-15 — Completion workflow resolved

User rejected the proposed Finish Location action. Small teams report completion verbally; supervisor checks the live mismatch map afterward. Map colors update from submitted records alone, with red treated as provisional until counting is done. No completion control or mandatory close step. Documentation only.

### 2026-11-15 — Source spreadsheet inspected; Location Management requested

Read connected spreadsheet `13TdeoVaNFGD8E-eEREhuW1QBhzg1QtDFSWkeKQXs5rQ`. Verified tabs `Fixed Data`, `Lynnville Map`, `Pulaski map`. `Fixed Data!A:C` headers: Location, Warehouse, Bay; sample Pulaski Bay 1 locations. Map tabs include layout labels and status lists. User explicitly requested **Location Management** to create/edit/activate/deactivate locations. Preserve legacy workbook; import to a new Inventory-owned location master after validating identifiers/barcodes. Documentation only; no writes to source spreadsheet or new tables.

### 2026-11-15 — Legacy 20-column entry structure and location lock

User provided current Inventory Log 20 columns, clarified `Uniquekey` is for cross-team matching while `App_Internal_ID` is per-entry unique ID. Confirmed temporary **location selection lock** so an employee can submit many products at one location without rescanning; unlock to change locations. Proposed stable-ID comparison keys, SubmissionID, InventorySessionID and verified-save semantics; not yet approved or implemented.

### 2026-11-15 — Submit UI and parent-child IDs confirmed

User approved **one Submit button + Lock/Unlock Location** replacing legacy two-button workflow. Confirmed system-generated parent-child `App_Internal_ID` pattern: parent ID `55dsgh`, child IDs `55dsgh-A`, `55dsgh-B`, etc. Recommended parent as submission metadata rather than an extra counted row; confirm whether first physical row should carry unsuffixed parent ID. Seven-pallet-example records stay seven, not eight. No implementation yet.

### 2026-11-15 — Entry edit/delete audit design discussed

User wants employee-accessible editing/deletion instead of manual fixes. Options: archive/move old rows, or retain old rows with `Valid` flag. Assistant recommended retain+invalidate+new replacement ID, plus append-only audit log, with individual-child vs whole-family edits. **Recommendation pending user approval; not implemented.**

### 2026-11-15 — Edit constraints confirmed

User confirmed edit operations may correct only the existing child records in a submission. Five pallets remain five pallets; no adding bottles or more pallets via Edit. Additional stock requires New Entry. Updated design notes; no implementation.

### 2026-11-15 — Blind inventory and own-entry permissions confirmed

User confirmed employees may view/edit/delete **only their own submitted entries**; inventory is blind. No other employees' quantities or Blue/Green comparison data in employee UX. Supervisor-only progress map and discrepancies; server-side ownership checks mandatory. Documentation updated; no code yet.

### 2026-11-15 — Workspace sign-in selected

User selected Google Workspace sign-in for `@bsb.com`, `@bigmachinedistillery.com`, and additional group domains. Proposed configurable domain/user/role allowlists. Must verify Apps Script server-side caller identity for actual deployment before implementing blind ownership. No code yet.

### 2026-11-15 — Team assignment clarified

User confirmed admins grant app access only, **not** team assignment. Any authorized employee may choose Team A or Team B. Team choice stored per entry; personal blind visibility unchanged. Session-level team lock is an assistant proposal, not yet approved. No implementation.

### 2026-11-15 — Phase 1 defined; team unlock approved

User confirmed Phase 1 = accurate independent counts for Team A and Team B; WS reconciliation deferred to Phase 2. Employees may switch teams within an inventory event, but must explicitly **Unlock Team** to change selected team and relock it. Team and location locks are independent. Documentation only; no app code yet.

### 2026-11-15 — Voice Entry feature requested

User wants speech recognition for location selection and complete entry: “Location PRA-L1-C4 5 pallets Pickers 1lt with 100 cases each.” Proposed Phase 1 tap-to-speak form autofill, exact master validation and confirmation before saving; generate five 100-case child rows. Test mobile browser/microphone compatibility and warehouse noise. No voice implementation yet.

### 2026-11-15 — Separate voice microphones agreed

User refined Phase 1 voice UX: location mic accepts only location identifier; product mic accepts product/pallet breakdown and may include `keep location`. Example 3 full pallets x 100 cases + 1 partial x 20 cases = 4 child records, 320 cases, location retained. No implementation.

### 2026-11-15 — Voice command for next location confirmed

User example: 5 full pallets x 100 cases plus 1 partial pallet x 20 cases of Pickers Original 1L = **six child records**, 520 cases. Spoken `new location` or `change location` means submit at current location, then unlock/clear location **only after verified save**. Opposite of `keep location`. No implementation.

### 2026-11-15 — Voice product alias challenge

User example: official `Borchetta Bourbon #473 2025 750mL/6pk` versus spoken `Borchetta Bourbon Racecar 2025 473 20 cases`. Need voice-to-catalog matching tolerant of nicknames/reordering/omitted pack, while extracting 20-case quantity and avoiding wrong-SKU saves. Proposed approved aliases and attribute matching with explicit confirmation. No code.

### 2026-11-15 — Mandatory voice review and Save/Cancel confirmed

User explicitly requires that employees see what they said on screen before submission and choose **Save** or **Cancel**. Never auto-save speech recognition. Display transcript and interpreted count for verification; Save writes validated records, Cancel writes nothing. No implementation yet.

### 2026-11-15 — Under-4-second performance requirement

User reports old AppSheet/script inventory entries take <4s and requires new Phase 1 app to be **<4s**, including voice-assisted entry. This is an acceptance target, not yet measured. Record voice transcription, matching, human review, save and verified completion separately; one batched save for multiple pallet children, local preloaded master lookup where possible. No implementation.

### 2026-11-15 — Supervisor discrepancy monitoring discussed

User shared screenshot of current spreadsheet columns Location, Item Name, UOM, Warehouse, Bay, Count 1, Count 2, Match, Helper Column and wants an admin module to monitor Team A/B discrepancies. Proposed supervisor-only live comparison, match/mismatch/pending states, event+location+product+UOM key and valid-child aggregation. Missing team count is not zero. No code.

### 2026-11-15 — Existing comparison is live, not manual

User clarified current reconciliation tab already updates live via ARRAYFORMULA, VLOOKUP, QUERY, MAP, etc. Corrected prior assumption. Future Admin design should first inspect formulas/dependencies and preserve working comparison logic; no implementation.

### 2026-11-15 — Admin discrepancy requirements gathering, not implementation

User clarified they are walking through **how discrepancies are handled**, and want existing live formulas revisited to see whether there is a better way. Do not choose an engine or implement before studying the rules and formulas. Await further workflow details.

### 2026-11-15 — Clickable discrepancy map behavior confirmed

User requires clicking a colored warehouse location to explain its color. For red, admin sees **Team A vs Team B aggregated product/UOM totals side by side**, e.g. 100 vs 99, **regardless of entry count**. Sum valid child records; do not show individual entry detail by default. Blind employee counts remain private. No implementation.

### 2026-11-15 — Dynamic red/yellow/green map semantics confirmed

User: Team A counting five products alone => yellow. As soon as Team B starts in same location, mismatch => **red immediately**, even before B finishes. As B catches up, if all aggregate product/UOM totals match => **green**, otherwise red. All discrepancies red; no finish-location button. Recompute on every valid count change. No implementation.

### 2026-11-15 — Separate admin reconciliation table required

User confirms admin needs **both** interactive warehouse map **and** spreadsheet-like comparison module with filters by **location, item, and match status**. Table shows aggregate Team A/B quantities, not individual submissions. Keep map/table driven by same live comparison engine. No implementation.

### 2026-11-15 — Finished Goods comparison identifier discussed

Dry Goods use Item ID. Recommended using existing stable SPIRITS Finished Goods Product ID for FG comparison; exact field and uniqueness must be verified before treating as confirmed. No implementation.

### 2026-11-15 — Confirmed Finished Goods ProductID exists

Read live SPIRITS `BMD V4 — Database`: `Products` column A = `ProductID` (UUIDs), with ProductName, SizeML, UnitsPerCase; `Releases` includes ReleaseID, WSMasterID, ProductID. Existing identifiers are available; need to determine product vs release granularity before final Inventory key selection. Read-only inspection, no implementation.

### 2026-11-15 — Require WS Finished Goods identifier

User confirms FG records must include WS Finished Goods ID in addition to SPIRITS internal ID. Candidate existing source is `Releases.WSMasterID`; verify equivalence/mapping before implementation. No new field or code yet.

### 2026-11-15 — Correction: WSFinishedGoodsID not verified

User says WSFinishedGoodsID is missing; assistant had incorrectly implied `Releases.WSMasterID` definitely satisfied the requirement. No such column was observed in inspected SPIRITS Products/Releases. Verify against official WS finished goods source before reuse or adding field. No implementation.

### 2026-11-15 — ReleaseID flagged as abandoned legacy design

User says `ReleaseID` was originally discussed but later discarded and likely unused. Do not use it in Inventory App model absent proof of active use; audit dependencies before removing from SPIRITS. Keep ProductID plus verified WS FG ID as intended identifiers. No code changes.

### 2026-11-15 — Confirmed WS-ID/name interchangeable lookup, internal IDs hidden

Dry Goods: scan WSRawMaterialID or find material by name -> same item. Finished Goods: scan WSFinishedGoodsID or find by name -> same SKU. Internal SPIRITS MaterialID/ProductID never visible to employees. Resolve both input modes to one canonical identity; disambiguate similar names. WS FG ID mapping still to verify. No implementation.

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
