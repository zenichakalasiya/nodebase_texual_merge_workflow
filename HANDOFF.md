# Handoff — 2026-09-29 14:35

## Read first
In `CLAUDE.md`: the fully-rewritten **IF / Else** bullet inside "Two node
types are actually implemented — Branch and IF / Else". It went through two
rebuilds in this session — read it in full before touching `cond` again, the
"Card shape"/"Connectors"/"Layout/collision"/"Drawer" sub-bullets each map to
a specific fix described below.

## What we worked on this session
Three rounds on the same feature, each triggered by the user looking at the
result and correcting course:
1. Gave the single Condition node two fixed outputs (Is True/Is False)
   instead of one — reusing the `cond` type, not a separate node type.
2. The user then showed Figma screenshots: what got built (a Branch-style
   fan below a plain card) didn't match their actual reference (two named
   rows *inside* the card, each with its own side-exit port). Pulled the
   real Figma node via the Figma desktop MCP connection and rebuilt the
   card + connector geometry to match.
3. The user then flagged the connector shape itself: the "Is True"/"Is
   False" tags sat on a diagonal bezier curve and didn't line up with each
   other. Fixed by switching to the same `elbow()` shape Branch's own lanes
   already use, and pinning both tags to the same fixed offset from the
   card regardless of fill state.

## Completed
- **Round 1** — `cond` node given two fixed ports via `portsOf()`
  (`{key:'true',...}`/`{key:'false',...}`), removed from the `canParallel`
  family, with a dedicated `layout()`/`ext()`/edge-drawing case modeled on
  Branch's lane fan-out. Verified working, but the VISUAL SHAPE was wrong
  per the user's actual design intent (see round 2).
- **Round 2** — Pulled the real design via `mcp__figma-desktop__get_*` tools
  (file `ZzUz2GRbzdOZjnxOc55VDq`, node `1056:48936`/`1056:49119`) after the
  user shared a Figma link in an AskUserQuestion answer. Confirmed via
  `get_variable_defs` that the design's color tokens already match this
  project's CSS variables exactly (`--gray-label`, `--border`, `--major`,
  `--critical`, etc. — no new tokens needed). Rebuilt:
  - `condNodeHTML()` — dropped the outer pill tag (uses `badgeHTML(st,
    true)`, the floating variant `laneHTML()` already established); two
    internal rows (`.chip-row[data-port="true"|"false"]`) using `.chip`/
    `.bar`/`.port.if`/`.port.else` — CSS that existed, unused, from the
    pre-redesign IF/Else (`abfa752`-era) and turned out to be an exact
    match, dots and all.
  - `layout()`'s cond case rewritten around `portDy()` (reads each row's
    real on-card height from the DOM) instead of a shared bottom fan point;
    children stack via `crossCursor` bookkeeping so paths can't collide.
  - `ext()` gained `condExt()`, mirroring that stacking without side
    effects, so ancestors (e.g. a Branch lane) reserve the right amount of
    room — verified with a `cond` nested inside a Branch lane beside a
    sibling lane, no overlap.
  - Node/drawer renamed **"IF / Else"** everywhere (`TYPE_LABEL.cond`,
    `newCondition()`'s default title, drawer header/description, "Go to X
    Node" pill) — per the user's AskUserQuestion answer, since the Figma
    shows this as the title.
  - `portsOf(cond)`'s port objects gained `rowLabel`/`emptyText` (drawer
    shows "IF"/"Else" + "Add step when condition is met"/"...is not met",
    distinct from the canvas tag's "Is True"/"Is False") — `nextRowsHTML()`
    updated to prefer these when present; needed no other drawer changes.
- **Round 3** — Replaced the round-2 edge-drawing (a raw cubic bezier from
  each row's dot straight to the target, labelled at the curve's midpoint)
  with `elbow()` — the same function Branch's lanes and Trigger's parallel
  fan already use: straight off the port, one rounded bend only if the
  target had to shift, straight into the target. Both rows' tags now sit at
  a fixed `ex + 12` offset from the card (not the curve's midpoint), so Is
  True and Is False always land in the same column, always on a flat run,
  whether their row is filled, empty, or bent around a collision. Dropped
  hover insert/delete controls on these connectors, matching Branch's own
  lane connectors (which never had them).
- Verified all three rounds with Playwright (written, run, deleted): port
  structure, dot colors/positions, label alignment (same X whether a row is
  filled or empty), no card overlap (including a `cond` nested inside a
  `cond`, and nested inside a Branch lane), drawer row labels/placeholders
  in both empty and filled states, delete cascades both paths, undo/redo,
  Branch itself unaffected, zero console errors throughout.

## In progress
Nothing mid-flight. This round's fix (round 3, connector alignment) is
implemented and verified but **not yet published** — the user asked "why
are changes not published" between rounds and was told publishing only
happens on request; this `/tatago` run is that request.

## Next steps
No open threads from this specific feature. Two small things noted along
the way, not asked for, not done:
- The Guide card ("Node reference") in `workflow-chrome.js` still lists this
  node type as "Condition", not "IF / Else" — cosmetic drift now that the
  node itself was renamed; only touch it if asked.
- `bez()` in `workflow-app.js` is now only referenced by the long-dead
  "legacy port" fallback in `layout()`/`relayout()` (the one the comment
  calls "no current node type reaches this... left vertical-only") — still
  fine to leave; flagging in case a future cleanup pass wants to remove that
  whole dead block along with the `port`/`plus` edge-drawing code it feeds
  (unlike IF/Else's own `rowport`/`rowplus`, which came from reusing the
  same *idea* — per-row exit points — but were rewritten, not copied).

## Decisions made
- Rebuilt using the team's actual Figma file via the Figma desktop MCP
  connection rather than continuing to guess from cropped screenshots, once
  the user shared a node link — this is now the established path for "does
  this look right" disagreements in this project: ask for the Figma link,
  pull `get_design_context`/`get_screenshot`/`get_variable_defs` on the
  specific node, don't keep iterating blind on screenshots alone.
- Reused pre-existing-but-unreachable code twice this session
  (`.chip`/`.bar`/`.port` CSS from the pre-redesign IF/Else; the `portDy()`
  mechanism) rather than inventing parallel systems — both turned out to be
  exact or near-exact matches for what the new design needed, suggesting
  this codebase still carries useful scaffolding from earlier iterations
  worth checking before writing something new from scratch.
- Chose `elbow()` over a raw bezier for the final connector shape
  specifically because it's the SAME function already proven correct for
  Branch/Trigger's fan-outs — consistency with an established, working
  pattern over a bespoke one, per the user's explicit ask to match Branch's
  own clean look.

## Gotchas & notes
- `mcp__figma-desktop__get_design_context` dropped mid-call twice this
  session (backgrounded, then failed with "transport dropped mid-call") —
  `get_screenshot` and `get_variable_defs` on the same node both worked
  reliably. If `get_design_context` is unreliable again, `get_screenshot` +
  `get_metadata` (for the layer tree/dimensions) + `get_variable_defs` (for
  exact color tokens) is enough to rebuild a component faithfully by hand.
- The Figma design-to-code skill requires loading
  (`skill://figma/figma-design-to-code/SKILL.md`, or `Skill` tool with name
  `figma-design-to-code`) before the first `get_design_context` call in a
  session — it's a hard requirement stated on the tool itself, not optional
  guidance.
- Test carefully when a flow involves adding AND deleting nodes in the same
  Playwright script before checking node counts — the app auto-selects the
  newly-created node after the picker closes, so a `#cdDelete` click right
  after creating a child deletes the CHILD, not whatever you created earlier
  expecting it to still be selected. Re-click the target node's card
  explicitly before deleting if the flow created something else since.
