# Handoff — 2026-09-20 22:02

## Read first

See `CLAUDE.md` for full project context — it was created this session. The
**"Key context"** section matters most: it lists the behaviours that were asked
for explicitly and should not be "corrected" by a later session.

Then read `BRANCHING-DEBATE.md`, which holds the open design question the session
ended on.

## What we worked on this session

Merged the textual and node-based workflow builders into one prototype: the
anchored picker popover from the textual builder now drives node creation on the
canvas, with a floating config drawer, a full product chrome, and a free-panning
canvas. The session ended on an unresolved branching-model question.

## Completed

- **Picker popover** (`workflow-popover.js/.css`) — ported from the textual
  builder. Search, grouped rows with icon tiles, one-line descriptions, role tags,
  segmented tabs (Event / Periodic for triggers), quick-shortcut chips, keyboard
  nav, plain `⋮` command-menu mode, and a caret help bubble that tracks the
  highlighted row through scrolling.
- **Second-level drill-down** — rows with a chevron open a sub-menu with a back
  button ("Check a condition" → "Inline condition" / "Branching condition"), and
  only the leaf builds the node. Searching flattens the levels so a leaf is
  reachable without drilling.
- **Config drawer** — floating rounded panel. Inline description under the
  one-liner (hover tint, caret-only on focus), click-to-rename title synced with
  the canvas, book icon for docs, `⋮` overflow menu, and a collapsible "Next step"
  section. No Save button.
- **Collapsing drawer header** — on scroll the `‹ Go to …` pill folds to its
  arrow and the node icon + title rise into the top bar; reverses on scroll up.
  The two are sequenced so they never overlap mid-transition.
- **Canvas** — white node cards with an editable description field, error/warning
  states, hover controls on connectors (insert / delete, oriented to the line),
  free panning, zoom with a menu, hand vs select tools, undo/redo, node dragging.
- **Product chrome** (`workflow-chrome.js/.css`) — two-row top bar with
  breadcrumb, state pill, version selector, Simple/Node view switch, Enabled
  toggle, split Publish button with a Save-options menu, `⋮` workflow menu;
  hover-out left navigation; centred bottom toolbar; a single body-level tooltip.
- **`BRANCHING-DEBATE.md`** — two agents researched n8n, Zapier, Make, Monday,
  Dify, Attio and Jira and argued opposite sides of the branching question. Full
  reports, synthesis, and the open questions are in the file.

## In progress

**Nothing is mid-flight in code** — the build is consistent and the last full
regression passed (21 checks, no console errors).

**One design decision is open and blocks the next piece of work.** The synthesis
in `BRANCHING-DEBATE.md` recommends *author in lanes, review as a table*, but
three questions were put to the teammate and are unanswered:

1. **Realistic branch count** — mostly 2–3, or routinely 5–8? Biggest single input.
2. **Build the real condition builder now?** It gates the read-back port labels
   and the review view.
3. **Does the drawer get an exception** to stay open while filling paths from the
   "Next step" rows? This would reverse an established rule for one node type.

## Next steps

1. **Get answers to the three questions above** before writing branching code.
2. **Fix the verified reachability bug.** With 5 branches the drawer lists 6 paths
   but the canvas exposes only 4 `+` buttons — branches 4 and 5 sit behind the
   card's "+N more" collapse with no reachable `+`. See `portsOf()` vs
   `allPortsOf()` in `workflow-app.js`. A port must never be unreachable because
   the card collapsed.
3. **Model the condition properly** — replace the free-text `cond` on each branch
   with field / operator / value. Everything else in the branching plan depends on
   it.
4. **Branching creates one branch + Default**, not two (`newBranch()` in
   `workflow-app.js`).
5. **Port labels read back the condition** ("Priority is High or Medium") instead
   of "Branch 3".
6. Fill in the real second-level contents for the picker's module rows — the
   current ones are placeholders and were never confirmed against the reference
   screenshots, which did not come through.

## Decisions made

- **Merge strategy:** the canvas keeps the node model; the popover picker and
  inline editing come from the textual builder. The drawer closes whenever the
  picker opens so the canvas gets full width.
- **No Save button.** Auto-save on every keystroke, with an "All changes are saved
  automatically" line where the footer used to be.
- **Error timing.** Error and warning states appear only once the user moves on,
  never while typing — so a half-filled node is never scolded mid-edit.
- **Canvas is a free surface, not a scroller.** Panning moves the world by a
  transform so it works whether or not the flow overflows; the wheel pans and
  ctrl+wheel zooms, since there are no scrollbars.
- **Only the hand tool pans.** The select tool moves nodes only, so the flow is
  never shifted by accident.
- **Nodes are born named** after their type; the "Add title…" prompt appears only
  once the user clears the name. This forced dropping the auto-selected Source
  Node, which had made new nodes count as complete and made the error state
  unreachable.
- **Branching (recommended, not yet built):** author lane-at-a-time, review as a
  table. Reasoning and evidence in `BRANCHING-DEBATE.md`.

## Gotchas & notes

- **An old `node server.js` may already be running on :8777.** It serves from
  disk, so edits are picked up on reload — but its `/` route predates the change
  that made `/` serve the canvas. Use `/workflow-canvas.html` explicitly, or
  restart it.
- **Header collapse needs enough scroll to survive itself.** Collapsing hands
  ~120px back to the scroll area; if the panel only overflows by less than that,
  the overflow disappears, the browser forces `scrollTop` to 0, and the header
  expands again — an oscillation. `bindCollapse()` guards against this and a panel
  that barely overflows deliberately stays expanded.
- **Tooltips must not be pseudo-elements.** The drawer and the dock both need
  `overflow:hidden`, which clipped them regardless of z-index. There is now one
  `.wf-tip` element on `<body>`, positioned on hover.
- **Typing in a node card's description must not re-render.** A repaint rebuilds
  the card and drops focus mid-word; the model updates live and the repaint waits
  for blur. The field is also excluded from the node-drag handler.
- **Menus that open other menus need care.** Picking an item closes its menu, and
  that close lands on whatever the action just opened. The `⋮` menus defer their
  action by a tick; the picker's drill-down sets a `navigating` flag so the close
  isn't read as a cancel.
- **Images referenced in the conversation didn't always arrive.** Several rounds
  cited screenshots that never reached the session (the reference builder's menus,
  and the branching sub-menu data). Where that happened, the structure was taken
  from the reference site's own source and the specific content is a guess — the
  picker's module sub-menus are the main place this still needs checking.
- **`.playwright-mcp/` holds screenshots from an earlier session** exploring the
  textual builder. Useful reference, not part of the app.
