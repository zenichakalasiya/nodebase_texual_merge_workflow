# Handoff — 2026-09-23 12:18

## Read first

`CLAUDE.md`'s **"Key context"** section — almost all of it was rewritten this
session. In particular: the node-type list (IF/Else is gone, replaced by
Condition), the bottom-toolbar description (now two cards, not one merged
one), the popover's theme (light, not dark — a same-session round trip), and
the new "Sticky notes anchor to their nearest node" and "keyboard shortcuts are
real" bullets.

## What we worked on this session

A long run of UI-polish requests, mostly on the picker popover, the bottom
toolbar, and small UX problems the user asked to be *designed*, not just
built — direction icon legibility, then a full rethink of that same control,
then how sticky notes should behave when the layout direction flips.

## Completed

- **Inline Condition reverted to one node** (from an earlier two-node
  Condition+IF structure) — `cond` type, one drawer with Title/Source/
  Condition Groups/Next step. "Next step" now shows by default in every
  drawer that has one (Trigger, Branch path, Condition), not gated behind
  completion.
- **Popover dark reskin, then reverted back to light** — read the textual
  builder's dark theme in full, rebuilt `workflow-popover.css` to match it
  pixel-for-pixel, then on explicit direction reverted to this app's own
  light palette (pulled from git history, not reinvented) since every other
  panel here is light. Only the popover's *content/interaction* model
  (search, drill-down, checkmark row, help bubble) carries over from the
  reference now, never its colours.
- **Branch fan-out connector bug, found and fixed.** The dashed "pending"
  connector to the next branch slot looked like a plain straight line instead
  of a proper rounded elbow matching its solid siblings. Root cause: the lane
  row was centred on the Branch card's top-left corner instead of its true
  centre (`cross = myCross - w.total/2 + ...` should have been
  `(myCross + cHalf(key)) - w.total/2 + ...`). Fixed in both places this
  formula appears (`workflow-app.js`'s branch fan-out and the general
  parallel-node fan-out) — now symmetric, confirmed via exact path-geometry
  comparison, not just eyeballing.
- **Branch "‹ N of M ›" stepper is now also a quick-jump.** Clicking the
  readout opens a popover listing every sibling branch with its live
  condition summary and a checkmark on the current one — not just Prev/Next.
- **"What happens next" and the Trigger popup fully restructured** to match
  the textual builder's reference content: Quick chips (Notify/Create/
  Update), Required→Add action (a new generic Record-management/Communicate
  submenu, replacing the old per-module catalog), Flow control→Add condition
  (Inline/Branching) + Merge paths, Timing & data→Add wait + Loop. Trigger
  popup lost its Event/Periodic tabs in favour of one flat list, with "Time
  based" itself collapsed to Once + a "Every time period" drill-down to
  Hourly/Daily/Weekly/Monthly, plus a "Generate with AI" footer row.
- **Direction control redesigned twice, on explicit user critique each time.**
  Started as a single icon that rotated — user said it wasn't legible.
  Rebuilt as a dropdown (Zoom-presets-style menu) after a round of UX options
  presented via AskUserQuestion — user picked that, it got built and
  verified... then the user asked for a *different* pattern instead: a
  permanent two-button segmented switch using a specific fork/split icon they
  reference-imaged. Final state: `forkV`/`forkH` icons, always both visible,
  active one lit like the Note tool. The dropdown-era `layoutV.svg`/
  `layoutH.svg` assets were deleted once superseded — don't recreate them.
- **Minimap split into its own card**, pinned bottom-left, separate from the
  main toolbar. Two distinct gestures built and verified: click-to-ease-pan
  (animated) vs drag-the-rectangle-to-pan (live, clamped, no animation).
- **Sticky notes now anchor to their nearest node** (`nearestNode()` /
  `anchorSticky()` in `workflow-app.js`), fixing a real problem: notes used
  to be pure absolute `{x,y}`, completely independent of the node layout, so
  they'd separate from whatever they were annotating on *any* node move —
  not just a direction switch, a plain drag did it too. Presented 4 solution
  options via AskUserQuestion (anchor-to-node / warn-first / tidy-button /
  geometric-transpose); user picked anchor-to-node. Verified: offset survives
  a direction switch, survives a manual node drag, a genuinely far note
  (>400px) stays put, dragging a note re-anchors it, deleting an anchored
  node clears the anchor without crashing.
- **Hand/Select toolbar buttons removed.** Since the canvas previously *only*
  panned in Hand mode, removing the button without a replacement would have
  removed the ability to pan by drag at all — instead, panning was merged
  into the default behaviour (empty-canvas drag always pans, a node/note
  under the cursor always drags itself), the same convention Figma/FigJam use
  for their default tool. Wheel-scroll pan and the minimap are unaffected and
  remain as alternatives. Dead `.tool-pan` CSS and the unused `hand`/`cursor`
  icon defs were removed too.
- **Bottom toolbar restructured twice this session**: first merged from four
  separate floating pills into one card with dividers, then split again into
  two cards (a bottom-left "view" card for zoom/fit/minimap, and the
  original centred card for guide/shortcuts/note/direction/history) — the
  direction switch ended up in the centre card, moved out of the view card,
  per explicit request ("it's a workflow setting, not a view control"). The
  divider between Note and Guide/Shortcuts was removed so those three read
  as one group.
- **Guide card replaced wholesale** with a "Node reference" list (icon-tile
  rows grouped Start/Steps/Flow, matching a reference image) — old numbered
  how-to text is gone.
- **Shortcuts card rebuilt with real shortcuts**, not a copy-paste of a
  reference list that assumed a different interaction model. Two *new*
  shortcuts were actually implemented to back the list, not just described:
  `Shift+R` (reset, via the existing confirm dialog) and `Delete`/`Backspace`
  (remove the selected node, via `WFApp.deleteSelected()` → `removeNode()`,
  inheriting its confirm-before-deleting-a-branch-with-steps guard). Verified
  the Delete/Backspace guard doesn't fire while a picker is open (Backspace
  already means "go back a level" there) or while any text field has focus.
- **Tooltips upgraded to show shortcuts as key badges** (`tipKeys()` helper,
  `<kbd>` markup, new `.wf-tip kbd` CSS) instead of plain "Label  Ctrl+Z"
  text — matches a reference screenshot of the desired look. Applied only to
  buttons with a real shortcut (Undo/Redo/Reset/Shortcuts); buttons with no
  real shortcut keep a plain-text tooltip.

## In progress

Nothing mid-flight — every item above was implemented and verified live via
Playwright (computed styles/geometry, console-error-free) before moving to
the next.

## Next steps

- No specific next task was requested. If picking this up cold: skim the
  "Key context" bullets in CLAUDE.md above the Deployment section, they're
  current as of this handoff.
- The Trigger drawer vs. design-screenshot gap (Event/Periodic switch living
  *inside* the drawer, Schedule Type/Frequency/Day-chips/Month/Start-At) is
  still open — noted in CLAUDE.md, untouched this session.
- If more of the reference site's content gets handed over for other node
  types (Action, Wait, Loop), the same pattern used for Condition/Branch this
  session — read the reference, adapt to what's real, verify with
  Playwright — is the one to keep following.

## Decisions made

- **Inline Condition is one node, not two** — reverted an earlier two-node
  design on direct user correction.
- **Popover content from the reference, but this app's own light theme** —
  not the reference's dark palette. A full dark pass was built, screenshotted,
  and then explicitly reverted; don't redo it without being asked again.
- **Direction control is a permanent two-button segmented switch**, not a
  dropdown and not a single swapping icon — both earlier designs were
  rejected in turn, this is the third and (so far) final one.
- **Sticky notes anchor to their nearest node** rather than staying at an
  absolute position, warning before a move, or being geometrically
  transposed — chosen from 4 presented options.
- **Panning has no separate mode any more** — merged into the default drag
  behaviour once the Hand/Select toggle was asked to be removed, rather than
  leaving panning-by-drag with no way to reach it.
- **New keyboard shortcuts were implemented, not just documented** — when
  asked to "show" a shortcuts list, rows that could be truthfully backed by
  real behaviour got built (Shift+R, Delete); rows that only made sense in a
  different (linear, textual-builder) interaction model were left out rather
  than displayed as if they worked.

## Gotchas & notes

- **A stale server on :8777 can silently serve an unrelated old project.**
  Happened once this session — `curl`'d :8777, got HTTP 200, but the page
  title was wrong ("Node Selection Sidebar" instead of "Workflow — Node
  Canvas + Picker Popover"). Always check the title/content after confirming
  the port responds, not just the status code; `taskkill` the stale PID and
  restart `node server.js` if so.
- **WFPop's icon system needs real files in `assets/`**, not inline SVG path
  strings — `workflow-chrome.js` has its own separate inline stroke-icon set
  (the `P` object + `svg()` helper) used for toolbar buttons directly, but any
  icon referenced from a WFPop `items` array (`icon:'foo'`) resolves to
  `assets/foo.svg` and 404s if that file doesn't exist. Hit this once when
  the direction-dropdown's menu rows referenced chrome.js-only icon keys;
  fixed by writing real `assets/*.svg` files. (Those specific files were
  later deleted again once the dropdown itself was replaced by the segmented
  switch — the lesson, not the files, is what's worth keeping.)
- **Backspace is already claimed by WFPop** (navigates up a drill-down level
  when search is empty) — any new global Backspace binding must check
  `WFPop.isOpen()` first or it double-fires (WFPop's `preventDefault()`
  doesn't stop other listeners, only `stopPropagation()` would).
- **`ext()`/`laneWidths()`'s row-centring formula is easy to get subtly
  wrong**: `myCross` passed into `layout()` is a node's top-left anchor, not
  its centre — any new fan-out code that centres a row of siblings under a
  parent card needs `myCross + cHalf(key)`, not bare `myCross`. The
  already-correct reference for this is the "one kid + parallel slot" case
  in `layout()`, which had it right all along; the branch-fan and general
  parallel-fan blocks didn't, until this session.
- Nothing was committed or pushed before this handoff — `/tatago` is about to
  do that next.
