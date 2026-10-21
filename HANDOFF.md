# Handoff — 2026-10-22 00:05

## Read first

In `CLAUDE.md`, under "Linear view" → "Functional edits made inside V8", read
these bullets:

- **Sidebar popup rules:** saving, width = value field, V1 / V2.
- **Field gallery:** what it is and how it is built.
- **`RcptField`** and **VPicker:** both are now live (no Apply).
- **Get records.**

All the work this session is in the Linear view (`linear/index.html`, `linear/node-skin.css`). The only Node-side file touched is the top bar (`workflow-chrome.js`).

## What we worked on this session

A long polish session on the Linear view's popups:

- **Text fields:** a trial of three options (A / B / C).
- **Saving:** sidebar popups save with Enter; canvas popups save with Apply.
- **Live multi-select:** no more Apply.
- **Email / SMS / Cc popups:** reworked.
- **Get records:** Single / Multiple.
- **Field Gallery artifact:** now includes every canvas-blank popup.
- **Sidebar popups:** a V1 / V2 placement trial, and width matched to the value field.

## Completed

- **Text fields:**
  - The top-bar **Text field** switch offers A / B / C (default B).
  - Option B = the editor in a popup.
  - The URL field and Header values get a `{ }` placeholder popup (`TxtPhPop`).
- **Saving rule:**
  - Sidebar popups show a "Press Enter ↵" hint below the field, outside its box, and have no button.
  - Canvas popups have an Apply button.
- **Multi-select (VPicker, `RcptField`):**
  - Changes apply live; the only Apply left is Merge's "which branches".
  - The field shows the newest value + "+N", with every value in a tooltip.
  - Checkboxes sit on the right.
  - Picker Version 2 is final and its switch was removed. It has a title, pills above the search, and a search icon that turns into a blue +.
- **Email & SMS:**
  - Send email: Cc/Bcc removed, plus a separate Technician group field. Group rows show the name only.
  - Create User › Email takes one value (`maxOne`).
  - Cc emails uses the same To-style popup.
  - SMS To takes typed numbers only.
  - Empty-state art: envelope or phone, with a compact "Add another …" version once values exist.
- **Reference card:** restyled flat and subtle, with no gradient and no shadow.
- **Get records:**
  - Single / Multiple, and an "up to [N]" fetch limit.
  - Conditions always sit on lines below.
  - On a periodic workflow, Multiple's subtext shows the per-cycle cap, with the full sentence on hover.
- **Others:**
  - Packages: an Add Packages side panel.
  - Yes/No fields: a plain dropdown.
  - The IF/Else Expression card is amber.
  - Tooltips are portalled so containers never clip them.
- **Field Gallery:**
  - Artifact: https://claude.ai/artifact/BjmE5zqX4dAHFyzdpYCZ7Y (Version 9).
  - **Sidebar fields** view: about 33 cards, with V1 / V2 tabs.
  - **Canvas blanks** view: one real canvas row per step kind. All 72 blanks open their real popups.
- **Sidebar popup V1 / V2** (top bar **Popup**):
  - V1 opens below the field.
  - V2 opens on the field, with its Specific | Dynamic tabs covering it.
  - Both save the same way: click or Enter fills the field and closes. In multi-select, Enter adds and the popup stays open.
- **Popup width:** the value field's width, minimum 280px, in both versions.
- **Bugs fixed:**
  - Side-by-side rows no longer collapse while a popup is open (skin section 36).
  - The Tags search now gets focus.

## In progress

Nothing mid-flight. V1 / V2 is waiting for the user to pick one.

## Next steps

1. **V1 / V2:** the user picks one. Then remove the top-bar **Popup** switch and the gallery tabs. To keep only V1, delete the `popV2()` branches. Each one is marked "V2" in Popover's `placePos`, the smart header, `RcptField`'s `place` and `Picker`.
2. **Text field:** the user picks A / B / C. Then remove the **Text field** switch.
3. **Get records cap:** get the real per-schedule caps (every N minutes, hourly, daily…) and the fetch-limit default (10 vs 1). Fill them into `getCycle()`.
4. **Open questions:**
   - Should Description allow placeholders?
   - Should the Node view Guide still say email isn't built?

## Decisions made

- **V2 position:** the popup covers the field and its tabs land on it. The title row is hidden. There is no Apply. The user chose this from three sketched options after the first V2 (above the field, with Apply) was rejected.
- **Saving, both versions:**
  - Single-choice lists save on click.
  - Text saves with Enter, which also closes the popup.
  - In multi-select, Enter adds and the popup stays open.
- **Popup width:** match the value field, minimum 280px. When the field is narrower than 280px, the popup grows leftward.
- **Gallery canvas view:** reuses real canvas rows rather than copies, so the popups stay identical.

## Gotchas & notes

- **Patching `linear/index.html`:** use an exact-string replace script with a count check. `sed` mangles `&` and backslashes.
- **Side-by-side CSS:** the rules key on inline style strings (`1px solid var(--border2)`). A new value control needs a `data-nf` hook added to skin section 36, or its row will stack.
- **Gallery anchors:** in gallery mode, `document.querySelector` is patched so `[data-anchor=…]` lookups prefer the gallery's copy of a row.
- **Gallery build:** the build script lives in the session scratchpad, not in the repo. It precompiles the JSX with Babel and inlines the skin and vendor files. A Read-permission rule blocked publishing supporting files.
- **Demo server:** never put the internal demo server address in this public repo.
