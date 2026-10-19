# Handoff — 2026-10-19 16:19

## Read first

In `CLAUDE.md`, read the **"Functional edits made inside V8"** list under
"Linear view". It now describes the finalised pieces:

- **`RcptField`:** the recipient popup.
- **`VPicker` everywhere:** the multi-select popup.
- **Tags:** its own Specific | Dynamic flow.
- **The `{ }` and toggle rules.**

Also read the three reference docs in the repo root: `PICKER-INVENTORY.md`,
`OPERATORS.md` and `CONDITION-FIELDS.md`.

## What we worked on this session

Long design-polish session on the **Linear view's value pickers**:

- **Email field:** finalised design version 1.2.
- **Same popup elsewhere:** Send SMS and Ask for approval now use that popup too.
- **Tags:** rebuilt with Specific | Dynamic tabs.
- **Every other multi-select:** moved onto the IF node's Category popup (VPicker).
- **Small fixes:** placeholder `{ }` button, toggles, search highlight, dynamic-value look.
- **Research:** compared operators against the real ServiceOps product.

## Completed

- **Category popup (VPicker):**
  - Category › Subcategory tree, with no dots.
  - Figma row states.
  - Selected Items plus a joined left side panel.
  - Version 1 / 2, chosen from the top bar's **Picker** switch.
- **Email (`RcptField`, finalised on 1.2):**
  - Search-or-add box with the icon on the right; it turns into a blue + for a new value.
  - Smart placeholder, and no helper line under the search box.
  - "Specific" and "Reference" headings.
  - Uppercase section titles with a 14px gap (no hairline).
  - Red "Clear all".
  - All-added panel on the left, tinted `#F6F9FC`, with the Apply bar spanning full width and no gap under the panel.
  - Purple `{x}` Reference card. A picked reference joins Added and returns to Specific.
  - No f(x) button on the field and no Cancel; Apply commits and an outside click discards.
  - Technician-group chips show a people icon and member count.
  - To and Cc are always shown, with "Bcc" at the Cc label's right.
  - Removed Insert from Template / Insert Knowledge.
- **Send SMS To** (`kind:"phone"`) and **Ask for approval** stage lists (`kind:"pick"`) use the same `RcptField`.
- **Tags:**
  - `vpCtrl` with VPicker plus Specific | Dynamic tabs: several specific tags OR one dynamic value.
  - Empty-state illustration until the user searches.
- **Moved to VPicker:**
  - Create/Update multi rows (Business services, Add Roles)
  - Create deployment "Notify to"
  - Create announcement groups
  - Get Hardware Asset asset-type filter
  - Merge "which branches"
- **`{ }` placeholder button:**
  - Grey square, 6px inset on every field.
  - Always opens the simple "Insert placeholder" list, including text and description rows.
  - Email Content: aligned with the "Write the email…" line.
- **Smaller pieces:**
  - Yes/No fields are a switch chip; untouched counts as "No".
  - Dynamic values show as a purple value with no `{ }`.
  - Yellow search highlight in every list popup.
  - Approval stage headings tinted.
- **Top bar:** the Email and Tags switches were removed. The view switch now repositions when entering Linear, and its gap maths was fixed.
- **Docs:** `PICKER-INVENTORY.md`, `OPERATORS.md` (with real-product operators collected from the demo portal) and `CONDITION-FIELDS.md`.

## In progress

- The user's last message ended mid-sentence ("…and"). Ask what the remaining request was.
- **Switched to VPicker but not browser-tested yet:**
  - Merge feeder picker
  - Get Hardware Asset preset
  - Create announcement groups
  - Create deployment Notify to
- **Tested:** Tags, Add Roles, Email, SMS and Approval.

## Next steps

- Test the untested VPicker callers above. Merge chips should show branch names, not ids.
- **Open questions for the user:**
  - Should stage forms allow placeholders? Approval description's `{ }` is disabled.
  - Should Service Request and the other record types get tag suggestions?
  - Should canvas-sentence dynamic badges also drop the `{ }`?
  - Should search highlight every match in a row, or only the first?
- **Operator gaps vs the product** (`OPERATORS.md` §H):
  - is empty / is not empty
  - date between / exactly next / last
  - Match All for tags
  - "any" on the trigger's "to" side
  - periodic Interval
  - Wait "up to" (Max Wait Time)
- **Older open threads** (from the previous handoff):
  - WhatsApp and Add Relation parity with the real product
  - sidebar card vs flush
  - button colours
  - Inter vs Poppins

## Decisions made

- **Only Email, SMS and Approval mix specific + dynamic values** in one list (`RcptField`). Every other multi-select uses VPicker, following the Picker switch.
- **Tags take several specific values OR one dynamic value**, never mixed.
- **`{ }` has one meaning:** the simple placeholder list. Specific | Dynamic belongs to value fields.
- **Reference card is purple tinted:** the user picked it from 4 options.
- **Technician-group chips use icon + count**, not a new colour.
- **An outside click discards** unapplied Email changes. The user was asked; no change requested.

## Gotchas & notes

- **Patching `linear/index.html`:** shell `node -e` / sed strip backslashes in regexes. Write patch scripts to a scratch file and use exact-string replace with a count check.
- **Line endings:** `workflow-chrome.js` is CRLF, so use the Edit tool on it.
- **Playwright on the If Else drawer:** Esc closes the whole drawer. In the real product's builder, clicks right after closing a menu get swallowed.
- **Demo portal (real product):** the address is in local memory, not the repo. The user signs in themselves; never type the password. A test draft was left unsaved there.
- **Dev server:** this session used port 8780 (`$env:PORT='8780'; node server.js`).
- **Pre-existing, not fixed:** in the Node view, redo after undo doesn't restore a new node.
