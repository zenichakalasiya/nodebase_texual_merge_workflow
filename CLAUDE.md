**On session start:** If `HANDOFF.md` exists in this directory, read it before
anything else for the latest state of the work.

# Motadata Workflow Builder — node canvas prototype

## What this is

A working UI prototype of the **workflow builder** for Motadata ServiceOps (an
ITSM product). Admins use it to automate ticket handling: *"when an incident's
priority is updated → check a condition → route it to the right team."*

The prototype **merges two earlier builders into one**:

- a **textual/linear builder** (lives at
  <https://pranjalgupta-motadata.github.io/linear-workflow-builder/>) where the
  workflow reads as sentences and every blank is filled from an anchored popover;
- a **node-based canvas builder** where steps are cards on an infinite canvas,
  each configured in a right-hand drawer.

The merge is the whole point: the canvas keeps the node model, and the popover
picker + inline editing come from the textual builder. It is a **design
prototype** — realistic and clickable, but there is no backend and nothing
persists across a reload.

## Tech stack

Deliberately dependency-free: **plain HTML, CSS and vanilla JS**, served by a
20-line Node static server. No build step, no framework, no `package.json`.
Fonts come from Google Fonts. Icons are local SVGs (`assets/`) plus an inline
stroke-icon set in the chrome module (`workflow-chrome.js`'s own `P` object).

Playwright (installed globally) is used ad hoc for verification — throwaway
scripts are written, run, and deleted. None are checked in.

## Structure

| File | What it holds |
| --- | --- |
| `workflow-canvas.html` | The page. All layout/drawer CSS lives in its `<style>` block; the four config drawers (Trigger / Branch / Branch path (lane) / IF-Else) plus the read-only history panels (Run History / Version History), Flow Details (workflow name/description), and Guide/Shortcuts are all static `<aside>` markup here — one shared right-hand sidebar system, nine panels deep. |
| `workflow-app.js` | The application. Node model, canvas layout and rendering, edges, drag/pan/zoom, undo history, the drawers' behaviour, sticky notes, the node picker flow, and the shared Run History/Version History read-only panel mechanism (`openHistoryPanel()`/`closeHistoryPanel()`). |
| `workflow-popover.js` / `.css` | The anchored picker popover, ported from the textual builder: search, grouped rows, second-level drill-down, keyboard nav, a checkmark on the already-picked row, and a caret help bubble that tracks the highlighted row. Light theme, matching the rest of the app. Also serves the plain `⋮` command menus. |
| `workflow-chrome.js` / `.css` | The product frame: two-row top bar (including the Run history / Publish / Version history / More actions on the right), hover-out left navigation, the single floating bottom toolbar, tooltips (with key-badge shortcuts). Also builds the Run History/Version History/Guide/Shortcuts row markup and mock run/version data. |
| `workflow-nodes.css` | Canvas node cards, connectors, edge hover controls, node states, sticky notes. |
| `linear/index.html` | The **Linear view** — Pranjal's textual builder (V8: React + Tailwind + Babel in one ~12k-line file), embedded in an iframe. Carries our own functional edits (see "Linear view" below). |
| `linear/node-skin.css` | Every visual change to the Linear view, scoped `html.embed …`, so it looks like the Node view. Loaded from `linear/index.html`'s `<head>`. |
| `linear/vendor/` | Local copies of React, ReactDOM, Babel and Tailwind for the Linear view (no CDN). |
| `server.js` | Static file server on **:8777**. `/` serves `workflow-canvas.html`. |
| `assets/` | SVG icons (mask-tinted in the popover; some also used as plain `<img>` on canvas). |
| `BRANCHING-DEBATE.md` | Historical research + decision record for the branching question — superseded by explicit direction. |
| `*-sidebar.html`, `workflow-canvas.backup.html` | Earlier standalone mockups, superseded. Kept for reference. |

## How to run

```bash
node server.js          # then open http://localhost:8777
# PowerShell, another port:  $env:PORT='8780'; node server.js
```

`server.js` reads `process.env.PORT` (default 8777).

No install step. If port 8777 is already taken, an old server is still running —
either reuse it (it serves from disk, so edits are picked up on reload) or kill it.
Watch for this specifically: a *stale* server from an unrelated earlier project
can also be squatting on :8777 and will silently serve the wrong page — if the
page title isn't "Workflow — Node Canvas + Picker Popover", kill it and restart.

`window.__wf` is exposed for debugging: `__wf.nodes` is the live node map and
`__wf.state()` lists each node's computed state. `window.WFApp` is the fuller
bridge chrome.js drives the canvas through (zoom, axis, undo/redo, tool mode,
`deleteSelected()`, minimap data, etc.).

## Key context

**Who it's for.** ITSM admins, not developers. They build 3–8 step workflows a
few times a quarter. Every design call has been made for that reader: low
cognitive load, readable six months later, no jargon.

**Behaviour that is deliberate — don't "fix" these:**

- **The drawer always closes when a picker popover opens**, and comes back if the
  picker is dismissed. Requested explicitly.
- **No Save button anywhere on the canvas/drawers — including workflow name
  and description**, which now live in the Flow Details sidebar panel (see
  below) and write straight to the top bar on every keystroke, same as any
  node's own fields. This used to be the one exception (a small floating
  card with its own Save button) — that popup is gone entirely, replaced
  once name/description moved into the same right-hand sidebar system.
- **"Next step" shows by default in every drawer that has one** (Trigger,
  Branch path, Condition) — it is never gated behind the node being fully
  filled in, matching how the canvas's own "+" is always clickable regardless
  of completion.
- **Error and warning states only appear once the user moves on** from a node —
  never while they are still typing. Error = dashed red (required fields blank);
  warning = solid amber (configured, but a path leads nowhere).
- **Deleting anything that would take other steps with it asks first** — a
  confirm dialog (`confirmDialog()` in `workflow-app.js`, styled `.wf-modal-*` in
  `workflow-nodes.css`), naming how many steps are affected, before Reset,
  header ⋮ → Delete workflow, or removing a branch. Cancel/Esc/outside-click all
  decline; Undo still restores after confirming. The `Delete`/`Backspace`
  keyboard shortcut for the selected node reuses this exact same path.
- **Condition errors never paint fields red.** A Branch-path/Condition group
  that's still incomplete reports ONE line under the groups (`showCondError()` /
  `.cg-err`), naming what's missing — never a per-field outline, and it updates
  live as you type instead of going stale.
- **The canvas always pans on an empty-space drag; a node or sticky note under
  the cursor always drags itself instead** — there is no separate Hand/Select
  tool to switch between any more (removed; see Handoff). Only the Note tool is
  still a real mode (one-shot: placing a note hands control back to the default
  on its own). **A dragged node keeps its connector** — every line is drawn to
  the child's live position (`entry()` in `relayout()`), curving instead of
  folding if dragged above its parent — and every line that lands on a node
  ends in an arrowhead.
- **Sticky notes anchor to their nearest node** (within 400 world-px, captured
  at place-time or last manual drag) and travel with it whenever that node is
  dragged. A note with nothing nearby just stays put. See
  `nearestNode()`/`anchorSticky()` in `workflow-app.js`.
- **Nodes are born named** after their type; `Add title…` appears only once the
  user clears the name themselves.
- The picker's **placement follows the connector** — below a vertical one, off the
  end of a horizontal one (all connectors run downward in vertical layout).
- **A branch switcher only appears with 2+ branches** — one branch, no `‹ 1 of 1 ›`.
  Clicking the `‹ N of M ›` readout itself opens a quick-jump popover listing
  every sibling branch (with its condition summary and a checkmark on the
  current one) instead of only stepping one at a time.

**Two node types are actually implemented — Branch and IF / Else.** Everything
else in the picker is catalogued and shows a toast (`IMPLEMENTED` map in
`workflow-app.js` gates this — the map key is still `cond`, only the visible
label changed).

- **IF / Else** (`cond` type, node title/pill/drawer all read "IF / Else" —
  `TYPE_LABEL.cond`, `newCondition()`'s default title) — **exactly two fixed
  outputs, Is True and Is False** (`portsOf()` for `cond`, each carrying
  `label` for the canvas tag plus `rowLabel`/`emptyText` for the drawer's
  differently-worded row). Created via the picker's **Add condition → Inline
  condition**. This revives the shape the product called "IF/Else" earlier in
  this project's history (see git history around the `abfa752` commit, and
  `condExt()`'s comments) — brought back onto today's `cond` node rather than
  as a separate type, on explicit instruction ("we wanted to give If and Else
  both from single condition node"), then rebuilt a second time against the
  team's actual Figma reference (`condNodeHTML()` was originally a
  Branch-style bottom fan — wrong; see Handoff) once screenshots showed it
  didn't match.
  - **Card shape**: no outer pill tag — `badgeHTML(st, true)` (the floating
    variant `laneHTML()` already used) floats the state badge instead, since
    the title itself ("IF / Else") already reads as the type. Two rows live
    *inside* the card: `.chip-row[data-port="true"]` has an "IF" `.chip` plus
    a `.bar` box showing the condition summary with the leading "If " stripped
    (the chip already says it); `.chip-row[data-port="false"]` is a bare
    "Else" `.chip`, no box. `.chip`/`.bar`/`.chip-row`/`.port.if`/`.port.else`
    are pre-existing CSS from the pre-redesign IF/Else, left unused in the
    stylesheet until this rebuild reused them verbatim (green/red port dots
    included, for free).
  - **Connectors**: NOT a Branch-style fan below the card. Each row exits
    from its OWN dot at its own on-card height, read live from the DOM via
    `portDy()` (`[data-port]` + `.port` inside it) — a mechanism that existed
    in the file but was unreachable by any node type before this. The line
    uses the same `elbow()` shape Branch's lanes already draw: straight off
    the port, a rounded bend only if the target had to move (never a
    diagonal bezier), straight into the target. Both rows' tags
    (`.elabel.t`/`.elabel.f`) sit at the identical fixed offset from the card
    (`ex + 12`) regardless of fill state, so Is True and Is False always land
    in a clean vertical column on a flat run — this was a follow-up fix after
    the first pass centred the tag on a raw bezier's midpoint, which looked
    diagonal/misaligned whenever one path's subtree had to shift for room.
    No hover insert/delete controls on these connectors, matching Branch's
    own lane connectors (which don't have them either).
  - **Layout/collision**: `cond` is NOT in the `canParallel` family — its two
    outputs are fixed, not a single-slot-plus-parallel-siblings chain. Each
    path's subtree is placed further along the main axis, stacked across the
    cross axis (`crossCursor` bookkeeping in `layout()`'s cond case) so a
    tall Is True subtree can't run into the Is False row. `condExt()` (used
    by `ext()`) mirrors that stacking logic without side effects, so a
    sideways-fanning ancestor (e.g. a Branch lane containing a `cond`) knows
    how much room the whole two-path subtree needs — verified with a
    Condition nested inside a Branch lane, beside a sibling lane, no overlap.
  - **Drawer**: needed almost no cond-specific code — `nextRowsHTML()`/
    `bindNext()`, the picker's attach logic, and delete/replace/undo were all
    already written generically against `portsOf()`/`allPortsOf()`, so both
    rows (labelled "IF"/"Else", not "Is True"/"Is False", per the Figma) just
    appeared once the ports/row-label fields were added.
- **Branch** (`branch` type, fans into `lane` children) — a Trigger-style card
  (tag/icon/title/description) with **no** node-picker slots inside the card;
  only its lanes' own lines fan out **downward**, solid for each real lane,
  dotted for the "pending" slot at the end. Created via **Add condition →
  Branching**. Each lane is its own `lane` node (`kind:'if'|'else'`) with its
  own `groups`/drawer/Next-step. Branch 1 (first `if` lane) can never be
  deleted. The lane fan-out is centred on the Branch card's actual visual
  centre (`cHalf(key)` added to the anchor before centring) — a past bug
  centred it on the card's top-left corner instead, which starved the dashed
  "pending" connector of room to bend and made it look like a plain vertical
  line instead of a proper elbow matching its solid siblings.

**The condition builder is real**, shared by both types: grouped And/Or
conditions (field/operator/value, `fx` expression toggle) via `bindBuilder()` /
`groupsHTML()` in `workflow-app.js`. A card's description reads the condition
back (`condSummary()`), e.g. "If Priority is High".

**"Cc Emails" is a special multi-value field in that builder** (last entry in
`FIELDS`). Picking it swaps the operator list to `EMAIL_OPS` (Match Any /
Match All / Match None, via `opsFor(c)`) and — unless `fx` is on — the
plain value input for a chip input (`emailValueHTML()`). Adding works like
any standard recipients field (`addEmails()` in `bindBuilder`): **Enter,
comma or semicolon** commits; a pasted list ("a@x.com, b@y.com") becomes
chips in one go; **Backspace** in an empty box removes the last chip;
clicking away keeps any valid address typed but not yet entered; invalid
text stays in the box with "Enter a valid email" and duplicates say
"Already added" (`.email-err`). Clicking anywhere in the cell focuses the
input; a chip's × keeps focus in the field. Addresses live in `c.emails[]`
(every condition carries an empty `emails` array from `newCond()`, unused
for other fields); `condDone()`, `condError()` and `condValueText()` all
read `emails` instead of `value` for this field. **Two states**: while the
input has focus the cell is `.editing` — it grows and wraps so every
address added so far stays visible; once focus leaves it collapses to one
line and `layoutEmailRow()` keeps as many chips as genuinely fit (all of
them if they fit), folding the rest into a **"+N"** badge right after the
last visible chip. (The first version collapsed while you were still
typing and reserved room up front, so from the second email on everything
vanished into "+N" — that's why editing never collapses now.) Clicking
"+N" opens `openEmailPopup()` — the manager for long (100+) lists: a
header with the live count ("120 emails" / "40 of 120" while searching)
and a bulk "Remove all" / "Remove 40" that acts on exactly the filtered
rows, confirmed inline in the header first; one bordered, inset
(not edge-to-edge, per reference) "Search or add email" box
(a new valid address shows an "Add" row, Enter adds it; pasting a list
adds every valid one, invalid ones stay in the box with a note);
highlighted matches; a × revealed on hover per row. It's sized to the
email cell, flips above it when there's no room below, and has **no close
button** (dismissed by clicking outside or Esc, on explicit direction).
Switching the field
into or out of Cc Emails resets `op`/`value`/`emails` (the valid option set
changes completely) — switching between the other seven fields still
doesn't, same as before. The builder is shared, so this works identically
in the Branch-path and IF/Else drawers. Gotchas from building it: the value
cell's class is `.cell-val` (in `workflow-nodes.css`) — the similarly named
`.cell-value` in `workflow-canvas.html` is unrelated dead CSS, don't
"fix" one into the other; and hide the "+N" badge with the `hidden`
*attribute*, never the `.hidden` class (`display:none!important`, which
JS toggling `.hidden` the property can't undo).

**Run History and Version History are two different concepts — never merge
them:**

- **Run History** = *runtime* log. One entry per time the published workflow
  actually **triggered and executed** after being published (e.g. the trigger
  fired because a ticket's priority changed, and the workflow ran to
  completion). Mock data only — `runs[]`/`runSeq` in `workflow-chrome.js`,
  seeded on Publish (4 rows the first time, 1 more on every publish after
  that, each with a randomized trigger/timestamp/duration/status).
- **Version History** = *build-time* log. One entry per time the admin
  **edited and published** the workflow itself (e.g. added a second parallel
  action to an already-published flow, then hit Publish again). Mock data
  only — `versions[]`/`versionSeq`, one new entry per Publish, most recent
  marked `published: true`.
- **Both open by replacing the drawer, never as a modal or a separate page** —
  this was an explicit, deliberate choice (competitor research covered
  Jira/Zapier's separate-page pattern and Dify/n8n's canvas-aware read-only
  mode; the canvas-aware pattern fit this product better). Clicking either the
  **Run history** button or the **Version history** icon (both in the page bar
  top-right) swaps the drawer to a static `<aside>` panel
  (`#runHistoryCfg`/`#versionHistoryCfg` in `workflow-canvas.html`) and puts
  the whole canvas into **read-only mode** for as long as it's open.
- **Read-only mode** (`readOnly` in `workflow-app.js`) blocks node drag, the
  canvas's node-picker "+"/parallel-add affordances, and Undo/Redo/Reset (both
  their toolbar buttons and keyboard shortcuts) — but deliberately leaves pan
  and zoom live, and clicking a node just gives it a blue "peek" highlight
  (`.rh-peek`) instead of opening its config drawer. A panel's own buttons
  (Run History's "View details", Version History's View/Restore) are NOT
  blocked by read-only — the lock is only about direct canvas manipulation;
  Restore still runs through the normal `app.confirm()` dialog as a
  deliberate, explicit action.
- **One shared mechanism, two callers**: `openHistoryPanel(panelKey, listSel,
  bodyHtml)` / `closeHistoryPanel()` in `workflow-app.js` own the
  drawer-swap + read-only toggle; `workflow-chrome.js` only builds each
  panel's row HTML (`runHistoryRowsHtml()` / `versionHistoryRowsHtml()`) and
  calls `WFApp.openRunHistory()` / `WFApp.openVersionHistory()`. Closing
  either (its own close button, or Esc) always goes through the same
  `closeHistoryPanel()`, so there's no per-panel close logic to drift out of
  sync.
- No pagination in either panel — both are plain scroll lists inside a
  402px-wide sidebar, matching every other drawer panel; the reference
  design's paginated modal (`bigPanel()`) was removed once both panels moved
  to this pattern.

**The node picker ("What happens next" / Trigger popup), fully restructured
this session to match the textual builder's reference exactly:**

- **Trigger popup** — no tabs. One flat list: "Record events" (created /
  updated / archived) then "Time based", which itself shows only **Once** and
  **Every time period** (a drill-down to Hourly/Daily/Weekly/Monthly — the
  underlying `TRIGGER_ITEMS`/`SCHED` data and drawer are unchanged, only the
  picker's presentation collapsed). A "Generate with AI" row is pinned as the
  popover's footer (toast, not built).
- **"What happens next"** — Quick chips: Notify / Create / Update. Then
  **Required → Add action** (drills into a generic, module-agnostic Record
  management / Communicate submenu — Create/Update/Assign/Close/Archive
  record, Link & add, Send notification; all toast, not built — this replaced
  the older per-module catalog of Service Request/Problem/Change/etc., which
  was redundant with this generic version). Then **Flow control → Add
  condition** (drills to Inline condition / Branching, Inline condition's
  small tag chip reads "IF/Else" not "if") and Merge paths (soon).
  Then **Timing & data → Add wait** and Loop over records (soon).
- Popover is **light-themed**, matching the rest of the app — an earlier pass
  this project went through copied the reference site's dark palette exactly,
  then reverted it back to light on explicit direction; only the popover's
  *content/interaction* model (search, drill-down, checkmark, help bubble)
  carries over from the reference, never its dark colours.

**Bottom toolbar — one floating card**, centred under the canvas, its three
groups told apart by a divider only (never separate floating pills), in this
order:

- **Zoom −/100%/+, a divider, Fit to screen** — leads the bar now (moved from
  the end, on explicit direction — "bring zoom in out functionality on left
  of guide and shortcut icons"). Same group as before, just relocated as one
  unit; nothing added or removed, so the card's footprint didn't change. The
  minimap floats above this group **below 50% zoom or above 150% zoom**
  (`view.zoom < .5 || view.zoom > 1.5` in `workflow-chrome.js`'s
  `onViewChange`, was 40%/150%), or whenever the flow's own reach beyond the
  visible canvas means part of it is out of sight at a normal zoom — not a
  permanent fixture. Its width and left edge now match the zoom/fit group
  exactly (`.minimap{width:100%;left:0}` inside `.view-bbar`'s own
  `position:relative` box — used to be a fixed 120px, centred). It supports
  two distinct gestures: click the background to ease-scroll the main view
  there (`requestAnimationFrame` tween), or drag the viewport rectangle
  itself for live 1:1 panning, clamped so it can't leave the minimap.
- **Guide + Shortcuts** read as one group (no divider between them — both are
  "how do I use this" affordances). Note used to share this group too but is
  **hidden** for now (`hidden` on `#toolNote` — the sticky-note system itself
  in `workflow-app.js` is untouched, just not reachable from the toolbar).
  Guide and Shortcuts both open in the right-hand sidebar now, not an
  instant popup — see below.
- **Undo / Redo / Reset.**

The whole card re-centres over the remaining canvas width when a config
drawer opens.

**The canvas is horizontal-only now — there is no layout-direction switch.**
An earlier version of this prototype had a two-way Vertical/Horizontal toggle
here (`forkV`/`forkH` icons); it was removed on explicit direction (the
vertical layout code path, `axis`/`setAxis`/`getAxis` in `workflow-app.js`,
was left intact under the hood in case it's ever needed again — `axis`
defaults to `'h'` and nothing in the UI can currently change it).

**Guide ("Node reference") and Keyboard shortcuts — sidebar panels, not
popups.** Both used to be an instant `floatCard()` popup anchored to their
toolbar button; on explicit direction ("show guide data and keyboard
shortcuts in right sidebar, instead of instant popup") they now open in the
same right-hand sidebar every drawer uses (`#guideCfg`/`#shortcutsCfg` in
`workflow-canvas.html`, `guide`/`shortcuts` keys in the `panels` map,
`openGuidePanel()`/`openShortcutsPanel()` in `workflow-app.js`,
`WFApp.openGuide()`/`openShortcuts()` bridge). `floatCard()`/`closeCard()`
and their CSS (`.floatcard`, `.fc-head`, `.fc-title`, `.fc-close`) are gone
entirely — nothing else used them. The content itself is unchanged:
- **Guide** — icon-tile rows (matching the popover's own tinted-tile visual
  language), grouped **Start** (Trigger) / **Steps** (Action, Get, Wait) /
  **Flow** (Condition, Split path, Loop), each with a bold title + one-line
  description, ending in a "Walkthrough" pill (toast, not built). Lists
  every node concept the same honest way the picker catalogues them —
  Trigger/Condition/Split path are real; Action/Get/Wait/Loop are described
  but not yet implemented, same as the picker's own `soon` items.
- **Shortcuts** (`SHORTCUTS` in `workflow-chrome.js`) lists exactly what
  works, each row with its own `<kbd>` badge(s): `⌘/Ctrl+Z` undo,
  `⌘/Ctrl+⇧+Z` redo, `⇧+R` reset (goes through the same confirm dialog as
  the Reset button), `Delete`/`Backspace` removes the selected node
  (`WFApp.deleteSelected()`, reuses `removeNode()` and its
  confirm-before-deleting-a-branch-with-steps-after-it guard), `↑`/`↓` and
  `Enter` move through and choose a picker row, `Esc` closes a menu,
  popover, or confirm dialog (no longer "or floatcard" — there isn't one
  anymore; Esc does NOT close the Guide/Shortcuts sidebar panels themselves,
  same as every other drawer), `?` opens this panel. Toolbar buttons that
  carry a real shortcut show it in their hover tooltip the same way, as
  separate `<kbd>` badges next to the label (`tipKeys()` helper) — not plain
  text, and not shown at all on buttons with no real shortcut.
- Both are **blocked while read-only** (Run History/Version History open) —
  `if(app.isReadOnly()) return;` on the toolbar click and the `?` key.
  Without that guard, opening Guide/Shortcuts over Run History would swap
  the drawer's visible content away, and its OWN close button would then
  just hide the dock without ever calling the read-only-clearing
  `closeHistoryPanel()` — leaving the canvas stuck locked with nothing on
  screen able to un-stick it.
- A reference-site shortcuts list an earlier session was handed (line/scope
  navigation via J/K, letter shortcuts for add-action/add-condition, a theme
  toggle) was **not** copied verbatim: those assume the *textual* builder's
  linear, keyboard-navigable list, which doesn't exist in this node canvas,
  so only the subset that maps to something real was built and documented.

**Verification convention.** Changes are checked by driving the real page with
Playwright and asserting computed styles, geometry, and console output (zero
errors required) — not by eyeballing screenshots alone. Write the script, run
it, delete it.

**Reference builders.** Two live products are the behavioural reference:

- the textual builder (URL above) — popover component, slot-chaining,
  shortcuts, node colours, the trigger/condition/action menu shapes. Its
  behaviour and content were read in full and largely adopted; only its dark
  theme was deliberately left behind (see above) since every other panel in
  this app is light.
- a Monday.com custom-objects workflow (`blue-falcon-band.monday.com`) that
  combines a node canvas with a popover picker plus side drawer — the target
  feel. It needs a login, which is not stored anywhere in this repo.

**Trigger drawer vs the design screenshots.** The design shows a "Workflow Module
Configuration" drawer (Event/Periodic switch inside the drawer, Schedule Type /
Frequency / Day chips / Month / Start At for periodic, "Trigger n" attribute
cards). The built drawer is shaped differently (a "Trigger Type" card + Change
button, per-type schedule fields) — that gap is still open. What IS built: a
periodic trigger's card shows a computed **"Next execution time"** (`nextRun()`
in `workflow-app.js`) and its pill reads "Periodic workflow" instead of
"Trigger" — both text-only now, no icon (every node pill lost its icon in an
earlier session, kept text-only for a cleaner look).

**Top bar.** The description icon, the Working/Published version dropdown,
and the **breadcrumb** ("‹ Workflows /") are all gone from the page bar —
the left zone is just the workflow name + its Draft/Published pill now,
nothing else (`#goBack`/`#crumbRoot` and their CSS were removed outright,
not hidden, since nothing links back to them). The view switch (`.viewswitch`
absolutely positioned, centred independent of that left zone) reads
**Linear | Node** now, not "Simple view"/"Node view" — same `data-view`
values (`simple`/`node`). Linear is a real view now (see "Linear view"
below), not a toast. Its
horizontal position is recomputed (`positionViewSwitch()`) whenever the
left or right zone's width can plausibly have changed, so it slides toward
whichever side has room rather than ever being covered. The right zone
reads Enabled toggle → **Run history** button (**hidden** — `hidden`
attribute on `#runHistBtn`; the panel/mechanism itself is untouched, just
not reachable from here) → Publish split-button (its menu reads **Save &
Publish** / **Save as draft** — was "Save & publish"/"Save only") →
**Version history** icon → More (⋮).

**Flow Details — workflow name + description, gating Publish.** Clicking the
workflow name (top-left) no longer opens a one-off floating card; it opens
the **same right-hand sidebar** every node's config uses (`#flowDetailsCfg`
in `workflow-canvas.html`, added to the `panels` map like any other drawer).
Both fields are **mandatory**: clicking **Publish** (the main button, or
"Save & publish" from the split-caret menu) calls `requireFlowDetails()`
first — if either field is empty, it opens this same panel, red-outlines
whichever field(s) are missing (`.input-box.invalid`, the same convention
every node drawer already uses), shows a `.cfg-alert` banner naming what's
missing, and the publish is blocked entirely; "Save only" is NOT gated, only
an actual publish is. Unlike Run History/Version History, this is an
ordinary drawer — NOT read-only, the canvas stays fully live behind it, and
clicking a node just swaps the drawer over to that node's own config like
any other drawer-to-drawer switch. Verification-only side note: while
building this, `[hidden]` turned out to not actually work anywhere in this
codebase before now — no `[hidden]` CSS rule existed at all, so any element
whose own class set `display` unconditionally (`.btn-outline`, the button
Run History uses) silently ignored the attribute. Fixed with one global
`[hidden]{display:none!important}` rule in `workflow-chrome.css`, which is
what actually makes the Run History/Note hides above work, and fixes the
same latent gap for every other `hidden` toggle already in the app
(minimap, `#runBadge`, trigger schedule fields, etc.).

**Every node drawer's header lost its Documentation (book) icon and, on
Branch/IF-Else, its Replace icon — replaced by an inline "Doc ↗" link at the
end of the description**, per explicit reference screenshot. `.cfg-doc`
(the link's styling) and `assets/open-link.svg` were both already sitting in
the codebase, built but unused, before this — same pattern as several other
pieces this project has reused rather than built fresh (`.chip`/`.bar`/
`.port` for IF/Else, `.input-box.textarea`). Trigger/Branch/IF-Else bake the
link straight into their static `<p class="cfg-desc">` markup in
`workflow-canvas.html`; a Branch-path (lane)'s description is rebuilt on
every open/switch (`isElse` changes the copy), so it goes through the
reusable `DOC_LINK` HTML constant and `.innerHTML` in `workflow-app.js`
instead. The link itself does nothing real yet (`[data-doc]`, delegated
click handler, toasts "Documentation is not part of this prototype" — same
convention as every other not-yet-built affordance). **Replace was NOT
removed as a feature** — it's still reachable from the ⋮ **More** menu on
Branch and IF-Else (`openNodeMenu()`'s `replace` item still calls
`replaceNode()`); only the dedicated header icon is gone. Trigger and
Branch-path never had a Replace icon to begin with (replacing the root
trigger, or a single lane, doesn't make sense the same way).

**Linear view = Pranjal's V8 textual builder, embedded and re-skinned.**
Clicking **Linear** in the top bar hides the node canvas and shows
`linear/index.html` in an iframe (`#linearView`, `setLinear()` in
`workflow-chrome.js`). The frame talks to the top bar over `postMessage`
(`wf:'ready'|'state'|'details'|'open'`); the top bar's Publish / Save menu
call `linearSend({wf:'open',panel:'publish'|'save'})`. Inside V8 an `EMBED`
constant hides its own header and left rail and pins the light theme.
Decisions that are deliberate:

- **The two views hold independent workflows.** Nothing is converted or
  synced between Linear and Node — building in one does not change the other.
- **V8 is embedded as-is, not rewritten.** Its sentence model, popovers and
  right sidebar concept stay. We only (a) restyle it and (b) make targeted
  functional edits in `linear/index.html`.
- **All restyling lives in `linear/node-skin.css`**, never in V8's Tailwind
  classes. V8 markup carries `data-nf="…"` hooks for the skin to target
  (`side`, `bar`, `seg`, `switch`, `tabs`, `frow`/`fhead`/`fcell`/`vcell`/`rm`,
  `addbtn`/`addlbl`/`addchev`, `map-row`, `compose`/`crow`/`clabel`,
  `stage*`, `moderow*`, `rcp*`, `tfield*`, `resizer`, …). Add a hook, then
  style it in the skin. Later sections of the skin override earlier ones —
  it was built in numbered passes, so search the whole file before adding a
  rule.
- **Look**: accent is the Node blue `#3d8bd0`; canvas `#f7f9fb` with a dot
  grid; the sidebar is a floating white card (radius 14, 10px inset); labels
  12px `#7b8fa5`; green switch `#37c15f`. **Font is Inter in Linear, Poppins
  in Node** (only Linear's bottom toolbar uses Poppins).
- **Sidebars are resizable in both views**: open at 400px, drag the left edge
  between 400 and 650px (numbers measured from the real product). Node view:
  `--side-w` CSS variable, `#dockResizer`, `SIDE_MIN`/`SIDE_MAX` in
  `workflow-app.js`. Linear: `sideW`/`startSideDrag` in V8. Widths are not
  shared between views. In Linear, a field row's attribute and value sit side
  by side once the panel is wider than ~500px, stacked below that.
- **Linear's bottom toolbar is a copy of the Node one** (zoom −/%/+, fit,
  Guide, Shortcuts, Undo, Redo, Reset). Save/Publish are not on it — the top
  bar owns them.
- **Field rows** (Create / Update / Add task): mandatory rows have a locked
  attribute cell (`#ECF1F9` fill, `#CBD5DF` border, no delete); optional rows
  get a red trash box. Borders never brighten on hover.
- **"Add Field" / "Add Stage" buttons**: 1px `#1d2a3e` outline, radius 6,
  30px tall, plus icon + medium 12px label; Add Field has a chevron, Add
  Stage does not.

Functional edits made inside V8 (all in `linear/index.html`):

- **Recipient / multi-value popup = `RcptField`, finalised on design "1.2".**
  Used by Send email (To · Cc · Bcc), Send SMS (To, `kind:"phone"`) and Ask
  for approval's stage lists (Requester group · Technician group · Set
  approvers to, `kind:"pick"` = choose from the list only). These are the
  ONLY fields that mix specific AND dynamic values in one list. Popup:
  - **Added strip:** red "Clear all"; "+N more" opens the **All added**
    panel on the LEFT, tinted `#F6F9FC`. The Apply bar then spans both
    columns.
  - **Specific / Reference views**, each with its own heading. Search-or-add
    box with the icon on the right: a magnifier, which turns into a blue +
    button for a new value.
  - **Sections:** uppercase grey section titles, separated by a 14px gap
    (no hairline).
  - **Reference card:** a purple card with a `{x}` tile. Picking a
    reference adds it to Added and returns to Specific.
  - **Commit:** Apply commits. An outside click / Esc discards. There is
    no f(x) button on the field and no Cancel.
- **Technician groups** read as grey chips with a people icon + member count
  (`VlChip group`), hover lists the members.
- **Dynamic (reference) values** show the value only, light purple
  (`--ref-bg #f0e8fc` / `--ref-fg #8a24d6`), never a `{ }` icon.
- **VPicker** (the IF node's Category value popup) is the ONE multi-select popup
  everywhere else, and follows the top bar's **Picker** Version 1 / 2 switch.
  - **Where:** condition values, Create/Update multi rows (Business
    services, Add Roles), Create deployment "Notify to", Create
    announcement groups, the Get Hardware Asset asset-type filter, and
    Merge "which branches".
  - **Opening it:** the helpers `vpCfgFor` / `openVpValue` / `vpCtrl`.
    `openFieldValue` routes those fields to it.
- **Tags** (Create/Update rows) = VPicker with **Specific | Dynamic** tabs:
  several specific tags OR one dynamic value, never mixed. The Specific tab
  shows an empty-state illustration until you search; suggestions
  (`tagSuggestionsFor`) exist only for Incident / Request in the sample data.
- **`{ }` placeholder button** (`ph-btn`): same grey square as f(x), 6px from
  the field's top / right / bottom. It always opens the simple grouped
  "Insert placeholder" list (`openPhPicker`) — never the Specific | Dynamic
  tabs.
- **Yes / No fields** (Spam, Known error, Associate parent entity) are one
  switch chip (`tgl-chip`). Untouched counts as "No" (`toggleVal`).
- **Send email:** To and Cc always shown; "Bcc" sits at the Cc label's right.
  Insert from Template / Insert Knowledge were removed from the reply toolbar.
- **Search highlight** in every list popup is yellow (`SEARCH_MARK`, `#FDE68A`).
- **Ask for approval** stage headings are tinted `#F6F9FC`.
- **Request Signature** is a new step under Approval (template list is
  sample data).
- **Archive**'s source record is always a clickable slot.
- Sample data only: `SIGNATURE_TEMPLATES`, `groupMembers()`, `TAG_SUGGESTIONS`,
  `CATEGORY_TREE`.

Reference docs in the repo root (generated this project):
- `PICKER-INVENTORY.md`: where multi-select pickers are used.
- `OPERATORS.md`: Linear vs the real product's operators, side by side.
- `CONDITION-FIELDS.md`: every condition key · operator · value, by record type.

The top bar's only design switch left is **Picker** (Version 1 / 2). The Email
and Tags switches were removed once both were finalised.

Gotchas: `workflow-canvas.html` and `workflow-nodes.css` use CRLF line
endings, `linear/index.html` uses LF. When patching V8 with a script, use
exact-string replace with a count check — the file is too big to eyeball.
The real product used as reference (an internal ServiceOps demo server — ask
the user for the address) needs a login
the user types in themselves; never enter it for them.

## Deployment

Repo: https://github.com/zenichakalasiya/nodebase_texual_merge_workflow
Live URL: https://zenichakalasiya.github.io/nodebase_texual_merge_workflow/

Published from `main` by the GitHub Actions workflow in
`.github/workflows/deploy.yml` — every push redeploys. The root `index.html`
exists only to forward to `workflow-canvas.html`, since Pages serves
`index.html` by default.

## Handoff

Latest session state is in [HANDOFF.md](HANDOFF.md) — read it first.
