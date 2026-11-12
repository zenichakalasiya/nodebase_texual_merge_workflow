# Handoff — 2026-11-12 17:05 (updated: Version 2 released)

## Version 2 (released 2026-11-12, git tag `v2`)
Finalised and published by the user: **Skeleton 2 · Step by step**, **Detach 1 · Panel**, **Text field B**. All three
design switches were removed from the top bar (the Skeleton preview button stays). Skeleton 2 runs from first paint.
The other options' code (skeletons 1/3/4, Detach Popover) is still in the files but unreachable — candidates for cleanup.

## Read first

In `CLAUDE.md`, read **"Detached steps"** (rewritten again) and the new **"Rails (Linear view)"** paragraph.

Everything this session is in:
- `linear/index.html`
- `linear/node-skin.css`, sections 60–65
- `workflow-chrome.js` / `.css`, for the placing lock and click-away cancel

## What we worked on this session

1. Reworked detached steps end to end:
   - ⋮ menus.
   - A new drag-and-drop cycle: Drop here → preview → Confirm place.
   - A placing lock.
   - A wider V1 panel with a resizer.
   - An unlink icon instead of the trash.
   - Detaching a single branch's steps.
2. Brought back v5.17's double-line rails.
3. Added a blue pulse that travels down the real Linear canvas.

## Completed

- **⋮ menus:** each card has Reattach / Delete under a ⋮ on hover. The V1 detail keeps Reattach + delete at its top right.
- **Drag & drop:**
  - Dragging shows a small one-line "Drop here" gap.
  - Letting go shows the full preview with ⠿ · Confirm place · ×.
  - ⠿ picks it up again.
  - Cancel with ×, Esc, a click outside the workflow, or a click outside the frame.
  - Empty workflows and empty branches can be drop targets.
- **Placing lock:** while placing, the stack and drawer are hidden and the top bar is disabled. Only Undo / Redo / Guide / Shortcuts work, and Undo / Redo cancel the placement first.
- **Fading:** steps the piece can't follow fade. Containers stay bright when places inside them are valid (this fixed a split that looked disabled).
- **V1 panel:**
  - 374px wide; the detail keeps the card's width.
  - A resizer on the left edge (double-click to fit the whole flow).
  - Small flows keep a small card; long ones fill to the bottom, then scroll.
  - A › on card hover, aligned with the ⋮.
- **Stack:** the stack spacing bug is fixed (cards must stay `position:absolute`). The stack stays spread while a ⋮ menu is open.
- **Detach control:**
  - An unlink icon floating left of the +, with an instant tooltip and a grey highlight.
  - In the gap under a branch header, "Detach this branch's steps"; the branch stays, empty.
- **Rails:** v5.17's double-line helpers are restored exactly.
- **Rail pulse:** one soft blue wave. At each height it glows only on the innermost path, so it moves into branches and back.

## In progress

Nothing mid-flight.

## Next steps

- **Not yet tested:**
  - Fading for a piece that only fits at path ends.
  - Dragging into an empty branch.
  - Clicking empty canvas while carrying after ⠿.
  - Guide / Shortcuts while locked.
- **Ask the user:**
  - Should the rail pulse run all the time or only at certain moments?
  - Should the pulse also travel along the elbows?
  - Should the mini steps diagram in the cards use double lines too?
  - Which Detach design (V1 / V2) and which skeleton/loader to keep?
- **Optional cleanup:** remove the dead code — `dtFold`, `trayFolded`, `placing`, `dtDropBar`, `dt-banner`, the old "Goes here" line, and `.dt-hsee` CSS.
- **Older items:** the real Get records caps; Field Lab refresh; f(x) for the rich-text fields.

## Decisions made

- **Detaching a single branch** detaches its **steps only**; the branch and its condition stay (user's choice).
- **Detach icon** = unlink (broken chain), grey. Detaching must not look like deleting.
- **Drag doesn't attach on release.** Release shows the preview, and Confirm place attaches.
- **The lock starts at drag start,** not only after the drop. Guide / Shortcuts may open their panels while locked; the product header stays active.
- **Rail pulse** moves at a steady ~300px/s rather than a fixed 2.6s, so long flows don't race.

## Gotchas & notes

- **Stack cards must stay `position:absolute`.** The JS lays the stack out with transforms, and making cards relative caused the big gaps.
- **Drag targets** are measured once, on the bare flow. Re-measuring with a preview open shifts everything below it.
- **Comments in patches:** a patch once put a `//` comment on a line that had a second statement after it, which turned that statement into part of the comment. Keep inserted comments on their own lines.
- **Large patches:** use script files (`scratchpad/dt/patchN.js`) with exact-string replace and count checks. Some anchors appear twice in the file (e.g. `const [menu, setMenu]`, the Shortcuts tool), so use longer anchors.
- **Local server:** port 8777 was killed once for low memory and restarted.
