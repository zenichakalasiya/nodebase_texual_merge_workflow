# Handoff — 2026-11-20 17:47

## Read first

In `CLAUDE.md`, read under "Linear view":
- **"Periodic triggers read RUNS for…"**: the full periodic schedule now matches the claude.ai artifact.
- **"Detached steps"**: rewritten. It covers the two Detach versions, the rail-only icons and the new Merge rule.
- **"Design switches"**: the defaults.

All builder work is in:
- `linear/index.html`
- `linear/node-skin.css` (new section 76)
- `workflow-chrome.js` (the new Detach switch)

## What we worked on this session

- Brought the periodic trigger into the Linear builder, the same as the manager-approved artifact.
- Reworked detaching to follow the real product's "delete a connection" model.

## Completed

**Periodic trigger:**
- "RUNS for [records] …". Once → date and time. Every time period → Schedule list (Daily / Weekly / Monthly / Interval / Custom (cron)).
- Several weekdays, with the weekdays / weekends labels and "+N" with a hover list.
- Months picker, with "month (all)" when all 12 are picked.
- Day of the month: A date (even grid) or A weekday ("the last Friday").
- "starting from [date]" on every repeating schedule.
- The 29th–31st note, shown under the sentence and in the popup.
- Cron in a card under the sentence, with a plain reading and the crontab.guru link.
- Field labels with * in every popup.
- The trigger sentence never wraps.
- Popups follow their blank when the page scrolls.

**Triggers:**
- "When a record's field changed" (was "changes").
- Trigger 1 and Skeleton 2 stay the defaults.

**Detach:**
- New top bar switch.
  - **Detach 2 · Container only** is the default: no icons in the flow, plus 3 sample pieces "from Node view".
  - **Detach 1 · On rails** is kept for reference. Icons sit only on connectors: the gaps next to Add step, and each split path's horizontal connector.
- No per-step / IF / Branch / Else icons. A single branch can't be detached on its own.
- A split path always takes the Merge it feeds. The other paths that fed it stay, unjoined.
- Hovering a split path's icon highlights the path, its "Go to this merge" card and the Merge.

**Research:** in the real product's node builder, deleting a connector only removes the line. The node and everything after it stay in place, unconnected. The disconnected node's "Select Source Node" is cleared and turns red as required. Drag from an output to an input reconnects.

**Periodic artifact (claude.ai):** final "Runs for", the empty state, the trigger popup with hover previews, add / change / clear trigger, field labels, and "starting from".

## In progress

Nothing mid-flight.

## Next steps

- **Optional:** in Linear, flag a reattached piece's first record blank as "needs picking again", matching the real product clearing the source. Offered, not answered.
- **Node view:** connector delete still removes the steps instead of disconnecting them. The user said to ignore the Node view for now. Step 2 of the plan (disconnect, keep in place, send pieces to the Linear container) is deferred.
- **Reattaching a split piece that carries its own Merge:** not checked visually.
- **Node-fields fixes** from the earlier artifact, still waiting on the user:
  - Merge business hours;
  - Wait model and max wait;
  - required rows for Create Problem / Change / Release / Task;
  - Update action fields.
- **Still open:**
  - the loader choice;
  - Trigger 1 vs Trigger 2;
  - where Approval / Signature / escalation go (waiting on the manager).

## Decisions made

- **Detaching = removing a connection.** In Linear the piece goes to the container. In the Node view it would stay on the canvas.
- **Detach 2 (container only) is the default.** Linear has no detach icons because detaching belongs to the Node view.
- **One branch of a Branching can never be detached;** the Branching goes whole.
- **A split path takes its Merge** even when other paths feed it ("Path + Merge only").
- **The two views keep separate workflows.** The Node → Linear link was deferred.
- **The trigger row never wraps,** even past 900px (the user's choice over widening the canvas).

## Gotchas & notes

- **Trigger popup anchoring:** popups opened through `openTrigBlank` use `anchorKey` (`data-anchor` on the blank). If you open one with a raw element, it freezes on scroll, because the sentence re-renders.
- **New sentinels:** a new trigger blank sentinel must be handled in `openTrigBlank` only. Both `pickTriggerSlot` and `advanceTrigger` call it.
- **Shell quoting:** heredoc and `node -e` patches with backticks or `$` get mangled by bash. Write the patch to a file first.
- **Server:** it gets killed for low memory. Restart it with `! node server.js`.
