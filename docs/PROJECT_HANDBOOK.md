# Inventory Web App — Project Handbook

**Updated:** 2026-11-15  
**Repository:** https://github.com/amramfloresvelasco-gif/Inventory-WebApp  
**Branch:** main  
**Status:** Phase 1 requirements gathering; no implemented or deployed app yet.  
**Scope:** Separate, mobile-first Inventory Web App (Google Apps Script proposed, subject to performance and write-safety validation); do not change SPIRITS/V4 without explicit request.

## 1. Mission and operating principles

Build a fast, reliable inventory count tool for simultaneous employees, supporting phone-camera barcode scans and desktop Bluetooth scanners. Existing AppSheet/Apps Script inventory tools and repair scripts are references for expected functionality, **not** source to transplant. Their incomplete-entry and repair issues require a redesigned storage/write path.

Priorities: responsive scan-to-input flow; minimal typing; verified saves; concurrency safety; idempotent retries; stable IDs and permanent audit trail; minimal server round trips; no expensive SPIRITS production engines on inventory requests.

**Performance goals (aspirational, not measured):** initial interface ~2 sec, product lookup ~1 sec, save ~2 sec, history ~3 sec. Test on real phones/network before accepting.

## 2. Delivery phases

**Phase 1 — Inventory Entry (current):** finalize employee entry screens, design/manage the location master, implement fast reference lookups, design safe transaction persistence, and test across devices.

**Phase 2 — Reconciliation (deferred):** compare Blue and Green counts, resolve discrepancies (third team), compare approved totals with WS official quantities, considering WS snapshot timestamps. The specific Phase 2 screen has **not** yet been approved.

## 3. Data boundaries

| Source | Dataset | Intended use |
|---|---|---|
| SPIRITS/V4 | Finished Goods | Product IDs/names and enriched brand/subtype/other relationships |
| SPIRITS/V4 | Raw Materials | Products and V4 enrichment such as subtype and packaging classification |
| SPIRITS/V4 | Warehouses | **Only active warehouses**, since WS does not supply active/inactive state |
| New Inventory App | Locations | Warehouse→Bay→Location hierarchy and barcode mapping |
| New Inventory App | Counts and History | Teams, users, timestamps, product/location, quantities, UOM, notes, statuses, parent submission and record IDs |
| WS | Finished Goods / Raw Materials official quantity snapshots | Reference for reconciliation; never automatically overwrite physical counts |

SPIRITS supplies the shared reference/master data, not the whole V4 backend. Inventory owns its operational tables. Actual field names, IDs, links, sync approach, storage design and precise WS snapshot source **remain unverified**.

## 4. Confirmed Phase 1 employee workflow

1. Select **Blue Team** or **Green Team** (replaces UI labels 1st/2nd Count).
2. **Scan location barcode**; if unavailable, manually select **active Warehouse → Bay → Location** via dependent dropdowns. Locations belong to the new app.
3. **Scan item barcode** and look up identity/name/class in enriched master data; or select **manual** → **Packaging** or **Finished Goods** → relevant dependent dropdowns.
4. May mark **Location Empty** or **Item Not Counted**. Item Not Counted indicates present items *outside the inventory scope*, and is distinct from empty/zero counted quantities.
5. For Finished Goods, enter **case and bottle quantities together** in one submission, including full pallets, partial pallets and loose bottles.
6. **Multiplier defaults to 1**. Case qty C × full pallet count N generates **N distinct case records**, each with qty C; not one aggregate record. Partial pallet is its own case record. Loose bottle quantity creates one separate bottle record (no multiplier). Example: 5 × 100 cases + 1 × 50 cases + 4 loose bottles → **7 records**, **550 cases + 4 bottles**. Child record IDs unique; all related by common submission ID.
7. Optional **Notes**.
8. Two actions: **Submit & Stay in Location** and **Submit & Change Location**. Do not reset fields or show success before a verified save.

Legacy screenshot: desktop modal with left-hand form and image panel on right, team selection, location dropdowns, scan/manual, item name/class, qty/UOM, notes, two submission buttons. This serves as a functional reference; mobile/desktop visuals still require user approval. Product imagery was present in old UI but **not reconfirmed** for new app.

## 5. Quantity/transaction semantics and examples

- Default pallet multiplier **1**.
- 1 × 100 case count → one record of 100 cases.
- 5 × 100 → five distinct records, each 100 cases.
- 1 partial pallet × 50 cases → one more 50-case record.
- 4 loose bottles → one 4-bottle record.
- Combined example gives seven entries total, with unique IDs and one submission/family ID.
- Cases and bottles stay separate UOMs. Converting cases to equivalent bottles later requires the accurate pack size per Finished Good.
- Several partial pallets with different quantities were **suggested, not approved**.
- Direct case entry without pallets was **suggested, not answered**.
- **Proposed engineering safeguard, not yet approved:** server-side validation, idempotency tokens, serialized/atomic batch writes where feasible, verified acknowledgment and audit-only corrections.

## 6. Legacy code reference (not to copy blindly)

User shared three pasted source files plus screenshot in the previous conversation:

- `Pasted text(8).txt`: Apps Script backend with `submitData`, `buildItemMap`, `getValidationLists`, `LockService`, `Inventory Log` writes and Case/Bottle family IDs.
- `Pasted text (2)(1).txt`: `ModalEntry` HTML/CSS/client logic, dropdowns, scan/manual modes, team colors, image display and submit buttons.
- `Pasted text (3).txt`: manual/automatic repair engine `repairSpecificEntryByID` / `autoRepairIncompleteInventory`, used to reconstruct missing child rows and verify a family.
- `image(20261115-202948).png`: prior Inventory Data Entry modal screenshot.

These are conversation uploads, **not** part of this repository. Original `Fixed Data` mapped warehouse/bay/location and item ID/name/class/images. The replacement should consume the enriched SPIRITS master data plus a new location master, not assume legacy `Fixed Data` is authoritative.

Legacy risks to investigate rather than assert as fully diagnosed: repeated spreadsheet reads, partially completed multi-record operations, row-number-dependent edits, lost retry context and inefficient lookup. `LockService` alone does not guarantee complete transactional behavior.

## 7. Open decisions — do not invent

- Final mobile/desktop layout and whether to display item images.
- Location/product barcode formats, camera/scanner behavior.
- Location master fields, stable location identifiers, global uniqueness.
- Raw materials/packaging categories and supported UOMs.
- Direct standalone case entry versus pallet entry; multiple partial pallets.
- EMPTY and NO COUNT interactions with already-counted products at a location.
- Authentication, team switching, corrections and permissions.
- Network retry/offline requirements, storage and concurrency model.
- Data refresh/cache invalidation and WS source mapping.
- Exact Phase 2 reconciliation interface and matching rules.

## 8. Project controls / continuation contract

- `docs/PROJECT_HANDBOOK.md`: requirements, architecture, decisions and open questions.
- `docs/PROGRESS_LOG.md`: every major session — changes, verified tests, commits, deployments, next actions.
- `docs/NEXT_LUCY_HANDOFF.md`: precise stopping point; update before ending each session.
- Use `main` unless user requests otherwise; keep inventory separate from SPIRITS.
- Record only verified GitHub commit SHAs, deployment IDs and actual benchmark results.
- Do **not** start implementation until user finishes explaining and approves the screen layout.

## 9. Confirmed data-source clarification (2026-11-15)

The **Packaging** and **Finished Goods** product databases are the same existing databases used in SPIRITS. Do not build duplicate product master tables for Inventory. Use SPIRITS's existing Raw Materials/Packaging definitions and Finished Goods definitions; verify the exact physical schema and relationships before implementation. **Locations is a new Inventory-owned table and does not yet exist.** The active warehouse master also comes from SPIRITS.

### Location table — draft, not approved schema

Proposed fields: stable Location ID, SPIRITS Warehouse ID, Bay, Location label, scan barcode, Active/Inactive status. Warehouse → Bay → Location dependent selectors, or direct location scan. Confirm barcode uniqueness, location naming conventions, whether bay is its own table, and warehouse key fields before creating anything. Example values are illustrative only.

## 10. Existing barcode infrastructure (confirmed 2026-11-15)

Physical locations already have an established naming convention and printed barcodes. Preserve existing labels and identifiers; do not generate replacement location codes by default. Current scanning conventions: **Dry Goods/Packaging use 2D barcodes; Finished Goods use QR codes**. The user may migrate all scanning to QR in the future. The Inventory scanning and lookup design must accept both formats, store decoded identifier values independently of symbology, and allow a future QR transition without rekeying products or locations. Clarify whether the stated formats refer to product labels, location labels, or both, and inspect sample codes before finalizing scanner and schema. No table has been created yet.

## 11. Barcode uniqueness confirmed (2026-11-15)

User confirms **everything has a unique barcode**. This includes inventory products and physical warehouse locations in the intended workflow. Preserve and look up existing unique barcode values; do not create new barcode conventions. Scanning a location should resolve its warehouse, bay and location; scanning an item should resolve its existing SPIRITS product. Maintain stable internal record IDs independently of printed barcode values to protect history if labels change. Support both currently used 2D and QR symbologies and potential migration to QR. Exact barcode payload examples and location import source still need verification.

## 12. Warehouse Inventory Progress Map (2026-11-15)

**New confirmed feature:** In addition to the new Locations master table, build a **visual warehouse inventory progress map** resembling the user's existing physical layout image of **PULASKI BAY 1** (lanes and individually named rack positions). Use existing physical position labels and location barcodes; do not reduce this to a generic table. Each mapped cell links to a location record. The map is operational, showing count progress.

**User-defined map status legend:**
- **Uncolored / neutral:** neither team has started inventory at the location.
- **Yellow:** one team has started counting at the location.
- **Red:** Team Blue vs Team Green counts for the location do not match.
- **Green:** both teams' counts match **100%**.

**Recommended, not yet approved:** show map-wide progress totals; click/tap a location to see item-level details and discrepancies; add a **Finish Location** confirmation so that comparisons occur only after each team has completed the location. Otherwise one team's partial submission could misleadingly appear mismatched. Compare quantities grouped by product and normalized unit (cases/bottles), not count of child pallet rows. Consider explicit treatment for Location Empty / Item Not Counted. The exact completion workflow, reconciliation algorithm, map storage format and rendering approach are pending design approval.

**Image reference:** user provided a screenshot of a PULASKI BAY 1 plan with lane labels (e.g. PE–PX) and detailed rack locations (e.g. PRB-C6-L1). Image is a reference for physical arrangement, not a machine-readable map dataset. Need the underlying spreadsheet/drawing or location coordinates to reproduce it accurately.

## 13. No Finish Location action — confirmed (2026-11-15)

**User explicitly rejected a Finish Location button or formal completion status.** This is a small team; employees verbally report when they finish, and the supervisor then reviews the map for mismatches. Counts are submitted normally; map status derives automatically from currently recorded team counts. Neutral/uncolored: neither team has submitted; yellow: exactly one team has submitted; red: both have submitted and item/quantity totals differ; green: both have submitted and item/quantity totals match 100%. Red while work is ongoing is a **provisional live mismatch**, not necessarily a final discrepancy. Later submissions can change the map color. Do not implement or recommend a required Finish Location action unless user revisits the decision. No formal completion flag is required for Phase 1.
