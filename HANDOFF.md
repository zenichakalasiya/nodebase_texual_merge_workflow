# Handoff — 2026-09-29 17:58

## Read first
In `CLAUDE.md`: the rewritten **"Guide ... and Keyboard shortcuts — sidebar
panels, not popups"** section and the minimap paragraph inside **Bottom
toolbar**. Both changed this session.

## What we worked on this session
Three requests in one message:
1. Move Guide and Shortcuts from an instant floatcard popup into the same
   right-hand sidebar every drawer uses.
2. Make the minimap's width match the zoom/fit toolbar group exactly, and
   left-align it to that group instead of centring it.
3. Change the minimap's zoom-based show threshold from 40%/150% to
   50%/150%.

## Completed
- **Guide/Shortcuts → sidebar panels.** New `#guideCfg`/`#shortcutsCfg`
  `<aside>` panels in `workflow-canvas.html` (same shell every other drawer
  uses — `.cfg-head`/close button/`.cfg-scroll`). `guide`/`shortcuts` added
  to the `panels` map in `workflow-app.js`; `openGuidePanel()`/
  `openShortcutsPanel()` (plain drawers, NOT read-only, same pattern as
  Flow Details) exposed via `WFApp.openGuide()`/`openShortcuts()`. In
  `workflow-chrome.js`: `floatCard()`/`closeCard()` and the module-level
  `card` variable are deleted outright (confirmed via grep nothing else
  referenced them); `GUIDE`/`SHORTCUTS` content strings kept their inner
  markup (`.fc-noderef`/`.fc-keys`/etc.) but dropped the `fcHead()` title+×
  wrapper, since the sidebar shell already provides that. The dead
  `.floatcard`/`.fc-head`/`.fc-title`/`.fc-close` CSS (plus the
  already-unused `.fc-list`) was removed from `workflow-chrome.css`; the
  content-level classes stayed since they're still in use inside the
  sidebar body.
  - Both toolbar buttons AND the `?` key now guard with
    `if(app.isReadOnly()) return;` — added proactively, not asked for
    directly: without it, opening Guide while Run History is open would
    swap the drawer's content away, and Guide's own close button would just
    hide the dock without ever calling the read-only-clearing
    `closeHistoryPanel()`, leaving the canvas permanently stuck locked.
    Verified this exact scenario in Playwright (open Run History via
    `WFApp.openRunHistory()`, click Guide — no-ops, Run History stays
    visible, `readOnly` stays true; close Run History normally, Guide works
    again).
  - The Shortcuts row list dropped nothing in content, but its `Esc` row
    copy changed from "Close a menu/popover/confirm/floatcard" to "Close a
    menu, popover, or confirm dialog" — floatcards don't exist anymore, and
    Esc does NOT close the new Guide/Shortcuts sidebar panels themselves
    (matches every other drawer's existing convention — only Trigger/
    Branch/Flow Details-style panels close via their own Close button or by
    selecting something else, never Esc).
- **Minimap width/alignment.** `.minimap` in `workflow-chrome.css` changed
  from a fixed `120px`, centred (`left:50%;transform:translateX(-50%)`) to
  `width:100%;left:0` — since `.minimap` is `position:absolute` inside
  `.view-bbar`'s `position:relative` box, and `.view-bbar`'s own width is
  driven entirely by its OTHER children (zoom out/in/percent/fit — the
  minimap itself is out of flow, so it doesn't affect that width), this
  makes the minimap track the zoom/fit group's real rendered width exactly.
  Confirmed pixel-identical in testing (both measured the same X and width
  at a zoomed-out state). Height stayed fixed at 78px — only width was
  asked for.
- **Zoom threshold.** `workflow-chrome.js`'s `onViewChange` show condition
  changed from `view.zoom <= .4 || view.zoom >= 1.5` to
  `view.zoom < .5 || view.zoom > 1.5` (strict, matching "below 50%"/"above
  150%" literally). The existing content-overflow trigger (`cw > cs.w*1.15
  || ch > cs.h*1.15`) was deliberately LEFT IN PLACE — the user only
  described the two zoom-percentage conditions, didn't mention removing the
  overflow one, and dropping it would have been a real functionality loss
  (a wide/tall flow at 100% zoom would never show the minimap even with
  content off-screen). Flagged as an assumption in the reply rather than
  silently deciding either way.
- Verified everything with Playwright (written, run, deleted): Guide/
  Shortcuts panel structure and content, `?` key, close buttons, clicking a
  node while either is open correctly swaps the drawer over (tested against
  a CONFIGURED trigger — an unconfigured one opens a picker popover instead
  of its drawer, a pre-existing quirk noted earlier this session, not a bug
  here), the read-only-block scenario and recovery, minimap geometry
  matching the zoom group exactly, the 50% boundary (exactly 50% stays
  hidden, 25%/200% show it), Branch and the Flow Details Publish-gate both
  still working — zero console errors throughout.

## In progress
Nothing mid-flight. Not published yet as of the last message before this
`/tatago` run — that's what this run is for.

## Next steps
No open threads from this specific request.

## Decisions made
- Guide/Shortcuts becoming sidebar panels meant adopting the same
  conventions every other drawer already has: no Esc-to-close, swap-on-
  node-click via the shared `panels`/`showPanel()` mechanism, light theme.
  The reference screenshot the user attached showed a dark card — read as
  "here's what the CURRENT popup looks like" (location/behavior being the
  actual ask), not a request to keep dark styling, since every other panel
  in this app is deliberately light (an explicit standing decision recorded
  earlier in `CLAUDE.md`). Worth confirming with the user if this reading
  turns out wrong.
- Kept the content-overflow minimap trigger alongside the new stricter zoom
  thresholds rather than replacing it — see "Completed" above for the
  reasoning. This is the one place this session where the literal ask
  ("show minimap when I zoom out below 50%...") could have been read as
  either "add this condition" or "these are the only two conditions," and
  the conservative reading (add/adjust, don't remove working behavior
  nobody complained about) was chosen.

## Gotchas & notes
- When testing "does clicking a node swap the active sidebar panel," always
  configure the node first (e.g. pick a trigger type) before clicking it —
  an unconfigured/empty node opens the node-picker POPOVER instead of its
  drawer, which doesn't go through the shared panel-swap mechanism at all
  and will leave a stray `.wfpop-layer` open, blocking every subsequent
  click in the same test run with a `TimeoutError` that looks like an app
  bug but isn't. Hit this twice this session already — worth remembering
  for any future test involving node clicks in a fresh session.
