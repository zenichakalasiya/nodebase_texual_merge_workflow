# Handoff — 2026-09-28 16:07

## Read first
In `CLAUDE.md`: the new **"Run History and Version History are two different
concepts — never merge them"** section (right before the node-picker section)
and the rewritten **"Bottom toolbar"**/horizontal-only note. Both are the
result of this session and explain the current toolbar/header shape and the
history-panel mechanism from scratch.

## What we worked on this session
Removed the Test Run button; consolidated the bottom toolbar (dropped the
layout-direction switch, merged zoom/fit into the main card); built **Run
History** as a read-only sidebar-replacing panel (not a modal); then, per an
explicit follow-up instruction, converted **Version History** to the exact
same sidebar pattern (it previously used a centered modal, `bigPanel()`).

## Completed
- Test Run button fully removed (markup, handler, CSS, icon) — not just
  hidden.
- Bottom toolbar reduced to one floating card with three groups (Guide/
  Shortcuts/Note | Undo/Redo/Reset | Zoom/Fit+minimap); the old two-way
  Vertical/Horizontal layout-direction switch is gone from the UI (the
  underlying vertical-axis code in `workflow-app.js` is untouched and
  reachable again later if needed — `axis` just defaults to `'h'` now with
  nothing in the UI able to change it).
- **Run History**: `#runHistBtn` in the page bar (Test Run's old spot) opens
  `#runHistoryCfg`, replacing the drawer and setting the canvas read-only
  (`readOnly` in `workflow-app.js`) — blocks node drag, +/parallel-add, and
  Undo/Redo/Reset; leaves pan/zoom live; clicking a node just peek-highlights
  it (`.rh-peek`) instead of opening config. Mock runs seeded on Publish.
- **Version History**: converted from `bigPanel()` (centered modal, paginated)
  to the identical sidebar-replacement pattern as Run History, per explicit
  instruction ("version history will also opened in sidebar"). New
  `#versionHistoryCfg` panel in `workflow-canvas.html`; `workflow-app.js`'s
  `openRunHistory`/`closeRunHistory` were generalized into a shared
  `openHistoryPanel(panelKey, listSel, bodyHtml)`/`closeHistoryPanel()` used
  by both panels (`WFApp.openVersionHistory`/`closeVersionHistory` added
  alongside the existing Run History bridge methods); `workflow-chrome.js`
  now just builds `versionHistoryRowsHtml()` and calls the bridge. Restore
  still runs through `app.confirm()` as a normal explicit action — read-only
  mode only blocks direct canvas manipulation, not a panel's own buttons.
  `bigPanel()` and its now-dead CSS (`.wf-modal.big`/`.wfm-head`/`.wfm-body`/
  `.wfm-foot`/`.wfm-pg*`) were removed; `.wfm-empty` was kept since both
  panels' empty states still use it.
- Verified end-to-end with Playwright (written, run, deleted — nothing
  checked in): drawer swap, read-only lock on drag/+/Undo-Redo-Reset/click,
  Restore's confirm dialog opening and Esc dismissing only the confirm (not
  the whole panel), a second Esc closing the panel, Close-button close, full
  editing restored afterward, Run History unaffected by the refactor, zero
  console errors.

## In progress
Nothing mid-flight.

## Next steps
- The Trigger-drawer-vs-design-screenshots gap noted in `CLAUDE.md` ("Workflow
  Module Configuration" drawer shape) is still open — untouched this session.
- No other known open threads from this session.

## Decisions made
- Run History and Version History both replace the drawer (sidebar panel),
  never a modal or separate page — deliberate choice after competitor
  research (Jira/Zapier's separate-page pattern vs. Dify/n8n's canvas-aware
  read-only mode); the canvas-aware pattern was picked as the better fit.
  Reason: keeps "inspect what happened" spatially tied to the workflow it
  happened to, instead of navigating away from the canvas.
- Read-only mode blocks editing (drag, +, Undo/Redo/Reset) but explicitly
  leaves pan/zoom live, and a node click peek-highlights rather than opening
  config — confirmed via AskUserQuestion earlier in the session, then reused
  as-is for Version History without re-asking, since the pattern is directly
  analogous and the user's instruction was short and confident.
- Generalized the two panels' open/close logic into one shared
  `openHistoryPanel`/`closeHistoryPanel` rather than duplicating it a second
  time, since a second caller appearing was the exact trigger condition for
  that refactor.

## Gotchas & notes
- The `.hidden` class on an individual panel (`#versionHistoryCfg`,
  `#runHistoryCfg`, etc.) does **not** reflect whether it's actually visible
  on screen — `showPanel()` only toggles which panel is the "current" one
  inside the dock; the dock's own `.closed` class (toggled by
  `openDrawer()`/`closeDrawer()`) is what actually shows/hides the sidebar.
  Don't use a panel's own `.hidden` state as a visibility check when
  debugging — check `#dock`'s `.closed` class and/or `WFApp.isReadOnly()`
  instead. This tripped up a first pass of Playwright verification this
  session (false negative, not a real bug).
- The Trigger node starts in an "empty" state and clicking it opens the
  node-picker popover, not a config drawer — pre-existing, unrelated
  behavior; don't mistake it for a regression when testing click-to-open-
  drawer flows.
