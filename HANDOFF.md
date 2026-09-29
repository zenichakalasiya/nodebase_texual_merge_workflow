# Handoff — 2026-09-29 10:47

## Read first
In `CLAUDE.md`: the rewritten **Condition** bullet inside "Two node types are
actually implemented — Branch and Condition" — it now has two fixed outputs
(Is True / Is False), not one. That's the whole story of this session.

## What we worked on this session
The user pointed out that an earlier version of this project (from before the
"Redesign Branch/IF-Else" session, commit `abfa752` in git history) had a
single condition node with two outputs — Is True / Is False — and asked for
that behavior back on today's Condition node, instead of its current single
"Next step" output.

## Completed
- **Condition now has two fixed outputs, Is True / Is False**, on the SAME
  `cond` node type (no new node type added, no rename — still called
  "Condition" in the UI, just with two ways out instead of one).
- Found the old two-output implementation in git history (`git show
  abfa752:workflow-app.js`) and used it as a reference for behavior/shape,
  but did not copy its code directly — that version predates the current
  axis-abstracted layout engine (`P()`/`mOf()`/`cOf()`/`horiz` in
  `workflow-app.js`), so the fan-out was reimplemented against today's
  engine, modeled on Branch's already-working lane fan-out.
- Changes, all in `workflow-app.js` unless noted:
  - `canParallel()` no longer includes `cond` (its two outputs aren't a
    single-slot-plus-parallel-siblings chain — they're two independent
    fixed paths).
  - `portsOf(cond)` returns `[{key:'true',label:'Is True',cls:'t'},
    {key:'false',label:'Is False',cls:'f'}]` instead of a single `next`
    port.
  - `laneItems()` gained a `cond` case (mirrors the existing `canParallel`
    and `branch.lanes` cases).
  - `layout()` gained a dedicated `cond` fan-out case (copied the shape of
    the `branch` case just above it: `laneWidths()`, centred row, elbow to
    each item or a dashed stub + "+" when empty).
  - A new edge-drawing block (mirrors the existing `branch` block) draws
    Condition's two lines, always both labelled (`.elabel.t`/`.elabel.f` —
    these CSS classes already existed, unused, left over from the pre-abfa752
    IF/Else implementation).
  - Removed `cond` from the old single-`next`-chain layout/edge cases (it no
    longer uses `slots.next` at all — it uses `slots.true`/`slots.false`).
  - Picker copy updated (`workflow-app.js`'s `ifelse`/`cond-inline` items)
    and the Condition drawer's static description (`workflow-canvas.html`)
    — both used to say "continues only when it passes", now describe the
    two-path shape.
- **Needed zero changes**: the drawer's "Next step" block (`nextRowsHTML()`/
  `bindNext()`), the picker's node-attach logic (`openNodePicker()`), and
  delete/replace (`removeNode()`/`replaceNode()`/`dropSubtree()`) were
  already written generically against `portsOf()`/`allPortsOf()` and
  `Object.keys(n.slots)` — they picked up the second output automatically
  with no cond-specific code.
- Verified via Playwright (written, run, deleted): both ports render with
  correct labels/colors and independent "+" buttons; each path can hold its
  own nested chain (tested nesting a Condition inside each of Is True and Is
  False) with no card overlap; the drawer shows two correctly-labelled
  Next-step rows; deleting the node cascades both subtrees; Branch (a
  different node type, untouched) and Undo/Redo still work correctly
  afterward; zero console errors.

## In progress
Nothing mid-flight.

## Next steps
- No open threads from this session. The Trigger-drawer-vs-design-screenshots
  gap noted elsewhere in `CLAUDE.md` remains open, untouched.
- One open question handed back to the user (not yet answered): the Condition
  card itself still reads "Condition" on canvas/in the drawer, not "IF /
  Else" — kept as-is since the rest of the current UI (drawer title, pill,
  `TYPE_LABEL`) is already built around "Condition", and the two outputs
  (Is True/Is False) already carry the if/else meaning. Flagged to the user;
  revisit if they'd rather the card say "IF / Else".

## Decisions made
- Kept the type key as `cond` and the label "Condition" rather than reviving
  the old `ifelse` type name — the user's request was about output COUNT/
  behavior ("If and Else both from single condition node"), not about
  reverting the naming, and keeping one type avoids duplicating
  `IMPLEMENTED`/`TYPE_LABEL`/drawer wiring for what would otherwise be two
  near-identical node types.
- Reimplemented the fan-out against the current axis-abstracted layout engine
  rather than porting the old pre-abfa752 code verbatim — that old code
  predates `P()`/`mOf()`/`cOf()`/`horiz` and was already flagged in its own
  comments as vertical-only; copying it as-is would have silently broken in
  this horizontal-only build.
- Condition's two outputs are NOT parallel-capable themselves (removed `cond`
  from `canParallel`) — the "add a parallel sibling" affordance only makes
  sense for a single-output chain (Trigger/Branch-path), and Condition's
  fan-out space is already spoken for by the two fixed paths. Whatever node
  sits on the True or False path is free to be a `canParallel` type itself,
  further down its own chain.

## Gotchas & notes
- `git show <commit>:workflow-app.js` is a fast way to pull an old version of
  a single file for reference without touching the working tree — used here
  to read the pre-redesign IF/Else implementation. Good pattern to reuse if
  the user asks for other previously-removed behavior back.
- When testing keyboard shortcuts (Ctrl+Z etc.) with Playwright right after
  typing in a popover's search field, the shortcut may appear to no-op — the
  app's global keydown handler deliberately ignores shortcuts while
  `input,textarea,select` has focus, and the search field can still hold
  focus after a click. Click `#doUndo`/`#doRedo` directly, or click away to
  drop focus first, rather than assuming a keyboard-shortcut no-op is a bug.
