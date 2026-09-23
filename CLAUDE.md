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
| `workflow-canvas.html` | The page. All layout/drawer CSS lives in its `<style>` block; the four config drawers (Trigger / Branch / Branch path (lane) / Condition) are static markup here. |
| `workflow-app.js` | The application. Node model, canvas layout and rendering, edges, drag/pan/zoom, undo history, the four drawers' behaviour, sticky notes, and the node picker flow. |
| `workflow-popover.js` / `.css` | The anchored picker popover, ported from the textual builder: search, grouped rows, second-level drill-down, keyboard nav, a checkmark on the already-picked row, and a caret help bubble that tracks the highlighted row. Light theme, matching the rest of the app. Also serves the plain `⋮` command menus. |
| `workflow-chrome.js` / `.css` | The product frame: two-row top bar, hover-out left navigation, the two floating bottom toolbars, tooltips (with key-badge shortcuts), and the Guide ("Node reference") / Keyboard-shortcuts cards. |
| `workflow-nodes.css` | Canvas node cards, connectors, edge hover controls, node states, sticky notes. |
| `server.js` | Static file server on **:8777**. `/` serves `workflow-canvas.html`. |
| `assets/` | SVG icons (mask-tinted in the popover; some also used as plain `<img>` on canvas). |
| `BRANCHING-DEBATE.md` | Historical research + decision record for the branching question — superseded by explicit direction. |
| `*-sidebar.html`, `workflow-canvas.backup.html` | Earlier standalone mockups, superseded. Kept for reference. |

## How to run

```bash
node server.js          # then open http://localhost:8777
```

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
- **No Save button anywhere on the canvas/drawers.** Every keystroke writes
  straight to the model. The one exception is the workflow name/description
  popup (click the name top-left) — it holds edits locally and only writes them
  to the top bar on **Save**, which appears once something differs from the
  saved value. Closing any other way (Esc, outside click, re-click) discards.
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
  at place-time or last manual drag) and travel with it — whether that node
  moves from a plain drag or a layout-direction switch. A note with nothing
  nearby just stays put. See `nearestNode()`/`anchorSticky()` in
  `workflow-app.js`.
- **Nodes are born named** after their type; `Add title…` appears only once the
  user clears the name themselves.
- The picker's **placement follows the connector** — below a vertical one, off the
  end of a horizontal one (all connectors run downward in vertical layout).
- **A branch switcher only appears with 2+ branches** — one branch, no `‹ 1 of 1 ›`.
  Clicking the `‹ N of M ›` readout itself opens a quick-jump popover listing
  every sibling branch (with its condition summary and a checkmark on the
  current one) instead of only stepping one at a time.

**Two node types are actually implemented — Branch and Condition.** Everything
else in the picker is catalogued and shows a toast (`IMPLEMENTED` map in
`workflow-app.js` gates this).

- **Condition** (`cond` type) — a single standalone card: Title, Select Source
  Node, the grouped And/Or condition builder, and Next step, all in one drawer
  (`#conditionCfg`). Created via the picker's **Add condition → Inline
  condition**. Joins the "plain chain" layout family (`canParallel`, same as
  Trigger/Branch-path) — it can host parallel siblings and chains straight into
  whatever comes next.
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
  condition** (drills to Inline condition / Branching) and Merge paths (soon).
  Then **Timing & data → Add wait** and Loop over records (soon).
- Popover is **light-themed**, matching the rest of the app — an earlier pass
  this project went through copied the reference site's dark palette exactly,
  then reverted it back to light on explicit direction; only the popover's
  *content/interaction* model (search, drill-down, checkmark, help bubble)
  carries over from the reference, never its dark colours.

**Bottom toolbar — two separate floating cards**, each a single card with its
groups told apart by a divider only (never separate floating pills):

- **View card**, pinned to the **bottom-left** corner: zoom −/100%/+, a
  divider, Fit to screen. The minimap floats above this card only when the
  flow's own scale or reach makes part of it genuinely out of sight — not a
  permanent fixture. It supports two distinct gestures: click the background
  to ease-scroll the main view there (`requestAnimationFrame` tween), or drag
  the viewport rectangle itself for live 1:1 panning, clamped so it can't
  leave the minimap. This card doesn't re-centre when the config drawer opens
  (a right-hand drawer never encroaches on the left edge).
- **Centre card**: Guide + Shortcuts + Note read as one group (no divider
  between them — they're all "how do I use this" affordances), then a
  divider, then the **layout-direction switch** (see below), then a divider,
  then Undo/Redo/Reset. This card re-centres over the remaining canvas width
  when the drawer opens.

**Layout direction switch** — two always-visible fork/branch-glyph buttons
(down-fork = Vertical, right-fork = Horizontal; `forkV`/`forkH` icons in
`workflow-chrome.js`), the active one lit the same way the Note tool lights
when active. This went through two earlier, rejected designs this session — a
single icon that swapped meaning on click (unreadable at rest, since a lone
button can only ever show one state) and a dropdown menu (correct but buried
the choice behind an extra click) — before landing on the segmented switch,
per explicit user reference images of a fork/split icon.

**Guide card ("Node reference")** — replaced the old numbered how-to list.
Icon-tile rows (matching the popover's own tinted-tile visual language),
grouped **Start** (Trigger) / **Steps** (Action, Get, Wait) / **Flow**
(Condition, Split path, Loop), each with a bold title + one-line description,
ending in a "Walkthrough" pill (toast, not built). Lists every node concept
the same honest way the picker catalogues them — Trigger/Condition/Split path
are real; Action/Get/Wait/Loop are described but not yet implemented, same as
the picker's own `soon` items.

**Keyboard shortcuts — real, not aspirational.** The Shortcuts card
(`SHORTCUTS` in `workflow-chrome.js`) lists exactly what works, each row with
its own `<kbd>` badge(s): `⌘/Ctrl+Z` undo, `⌘/Ctrl+⇧+Z` redo, `⇧+R` reset (goes
through the same confirm dialog as the Reset button), `Delete`/`Backspace`
removes the selected node (`WFApp.deleteSelected()`, reuses `removeNode()` and
its confirm-before-deleting-a-branch-with-steps-after-it guard), `↑`/`↓` and
`Enter` move through and choose a picker row, `Esc` closes a menu/popover/
confirm/floatcard, `?` reopens this panel. Toolbar buttons that carry a real
shortcut show it in their hover tooltip the same way, as separate `<kbd>`
badges next to the label (`tipKeys()` helper) — not plain text, and not shown
at all on buttons with no real shortcut. A reference-site shortcuts list this
session was handed (line/scope navigation via J/K, letter shortcuts for
add-action/add-condition, a theme toggle) was **not** copied verbatim: those
assume the *textual* builder's linear, keyboard-navigable list, which doesn't
exist in this node canvas, so only the subset that maps to something real was
built and documented.

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

**Top bar.** The description icon and the Working/Published version dropdown
were removed from the page bar; Simple/Node view is now centred on the bar
(`.viewswitch` absolutely positioned) independent of the breadcrumb. Clicking
the workflow **name** (top-left) opens a small popup (`.flowinfo` card in
`workflow-chrome.js`) with Workflow name + Description fields — see the Save
behaviour above.

## Deployment

Repo: https://github.com/zenichakalasiya/nodebase_texual_merge_workflow
Live URL: https://zenichakalasiya.github.io/nodebase_texual_merge_workflow/

Published from `main` by the GitHub Actions workflow in
`.github/workflows/deploy.yml` — every push redeploys. The root `index.html`
exists only to forward to `workflow-canvas.html`, since Pages serves
`index.html` by default.

## Handoff

Latest session state is in [HANDOFF.md](HANDOFF.md) — read it first.
