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
- **No Save button anywhere.** Every keystroke writes straight to the model.
- **Error and warning states only appear once the user moves on** from a node —
  never while they are still typing. Error = dashed red (required fields blank);
  warning = solid amber (configured, but a path leads nowhere).
- **The canvas only pans with the hand tool.** With the select tool, dragging
  empty space does nothing; only nodes move.
- **Nodes are born named** after their type; `Add title…` appears only once the
  user clears the name themselves.
- The picker's **placement follows the connector** — below a vertical one, off the
  end of a horizontal one.

**Only two node types are actually implemented** — IF/Else and Branch. Everything
else in the picker is catalogued and shows a toast.

**The condition builder is still static markup.** A branch's condition is a single
free-text string (`cond`); no field/operator/value is modelled. This blocks
several planned features — see `BRANCHING-DEBATE.md`.

**Verification convention.** Changes are checked by driving the real page with
Playwright and asserting computed styles and geometry, not by eyeballing
screenshots alone. Write the script, run it, delete it.

## Handoff

Latest session state is in [HANDOFF.md](HANDOFF.md) — read it first.
