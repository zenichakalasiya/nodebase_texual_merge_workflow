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
Fonts come from Google Fonts. Icons are local SVGs plus an inline set in the
chrome module.

Playwright (installed globally) is used ad hoc for verification — throwaway
scripts are written, run, and deleted. None are checked in.

## Structure

| File | What it holds |
| --- | --- |
| `workflow-canvas.html` | The page. All layout/drawer CSS lives in its `<style>` block; the three config drawers (Trigger / IF-Else / Branch) are static markup here. |
| `workflow-app.js` | The application. Node model, canvas layout and rendering, edges, drag/pan/zoom, undo history, the three drawers' behaviour, and the node picker flow. |
| `workflow-popover.js` / `.css` | The anchored picker popover, ported from the textual builder: search, grouped rows, tabs, second-level drill-down, keyboard nav, and a caret help bubble that tracks the highlighted row. Also serves the plain `⋮` command menus. |
| `workflow-chrome.js` / `.css` | The product frame: two-row top bar, hover-out left navigation, the centred bottom toolbar, tooltips, and the guide/shortcuts cards. |
| `workflow-nodes.css` | Canvas node cards, connectors, edge hover controls, node states. |
| `server.js` | Static file server on **:8777**. `/` serves `workflow-canvas.html`. |
| `assets/` | SVG icons. |
| `BRANCHING-DEBATE.md` | Research + decision record for the open branching question. |
| `*-sidebar.html`, `workflow-canvas.backup.html` | Earlier standalone mockups, superseded. Kept for reference. |

## How to run

```bash
node server.js          # then open http://localhost:8777
```

No install step. If port 8777 is already taken, an old server is still running —
either reuse it (it serves from disk, so edits are picked up on reload) or kill it.

`window.__wf` is exposed for debugging: `__wf.nodes` is the live node map and
`__wf.state()` lists each node's computed state.

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
- **Error and warning states only appear once the user moves on** from a node —
  never while they are still typing. Error = dashed red (required fields blank);
  warning = solid amber (configured, but a path leads nowhere).
- **Deleting anything that would take other steps with it asks first** — a
  confirm dialog (`confirmDialog()` in `workflow-app.js`, styled `.wf-modal-*` in
  `workflow-nodes.css`), naming how many steps are affected, before Reset,
  header ⋮ → Delete workflow, or removing a branch. Cancel/Esc/outside-click all
  decline; Undo still restores after confirming.
- **Condition errors never paint fields red.** A branch/IF-Else condition group
  that's still incomplete reports ONE line under the groups (`condError()` /
  `.cg-err`), naming what's missing — never a per-field outline, and it updates
  live as you type instead of going stale.
- **The canvas only pans with the hand tool.** With the select tool, dragging
  empty space does nothing; only nodes move. **A dragged node keeps its
  connector** — every line is drawn to the child's live position (`entry()` in
  `relayout()`), curving instead of folding if dragged above its parent — and
  every line that lands on a node ends in an arrowhead.
- **Nodes are born named** after their type; `Add title…` appears only once the
  user clears the name themselves.
- The picker's **placement follows the connector** — below a vertical one, off the
  end of a horizontal one (all connectors run downward now, see below).
- **A branch switcher only appears with 2+ branches** — one branch, no `‹ 1 of 1 ›`.

**Only two node types are actually implemented** — IF/Else and Branch. Everything
else in the picker is catalogued and shows a toast. Both were substantially
redesigned this session — see "Branch and IF/Else, redesigned" below.

**The condition builder is real** for both Branch and IF/Else: grouped And/Or
conditions (field/operator/value, `fx` expression toggle) via the shared
`bindBuilder()` / `groupsHTML()` in `workflow-app.js`, matching the reference
screenshots. A branch/IF-Else card's description reads the condition back
(`condSummary()`), e.g. "If Priority is High". `BRANCHING-DEBATE.md` is now
historical — its open questions were superseded by explicit direction.

**Branch and IF/Else, redesigned to match the textual builder's reference UX.**
Both now render as Trigger-style cards (tag, icon+title, read-only description)
with **no** node-picker slots inside the card — only their own lines fan out:

- **Branch** = a `branch` node with `lanes: []` — each lane is its own `lane`
  node (`kind: 'if' | 'else'`) with its own `groups`, own drawer (`#laneCfg`),
  own Next-step. Branch 1 (first `if` lane) can never be deleted. Lines fan out
  **downward**, solid for a real lane, dotted for the "pending" slot at the end;
  its `+` opens **Add branch: Or if / Or else** (`openBranchType()`) — Or if adds
  another lane, Or else adds the single Default (greys out once used).
  Deleting a lane confirms first (see above).
- **IF/Else** has exactly two fixed outputs, Is True / Is False (no more Else-IF
  outputs) — same downward fan, same grouped condition builder, feeding the
  shared `bindBuilder()`.
- **Branch-path (lane) drawer**: name + grouped conditions + Next step, a back
  arrow to the parent Branch, and a compact **`‹ 1 of N ›` stepper** in the
  header (only shown when N > 1) to move between sibling branches without going
  back first.
- **Parallel nodes** (Trigger and branch-path `next` outputs only — not
  IF/Else): once a node has a first "next" step, a dashed **"Add parallel
  node"** slot appears (on canvas beside it, and as the last row in the
  drawer's Next-step block) for adding a sibling that runs alongside it. 2+
  parallel nodes fan out under a "Parallel" tag, same as a branch fan.
- The Branches list in the main Branch drawer, and the Next-step block in every
  drawer, share one tree-rail visual (`.br-rows`/`.nn-body` continuous left
  rail with rounded elbows into each row) — see `workflow-nodes.css`.

**Verification convention.** Changes are checked by driving the real page with
Playwright and asserting computed styles and geometry, not by eyeballing
screenshots alone. Write the script, run it, delete it.

**Reference builders.** Two live products are the behavioural reference:

- the textual builder (URL above) — popover component, slot-chaining, shortcuts,
  node colours. Its behaviour and tokens were read in full; it is a linear
  "sentence builder", not a canvas, so only the popover/interaction model carries
  over, not its layout.
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
"Trigger" — both text-only now, no icon (every node pill lost its icon this
session, kept text-only for a cleaner look).

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
