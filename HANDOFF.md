# Handoff — 2026-11-18 15:43

## Read first

In `CLAUDE.md`, read:
- **"Detached steps"**: rewritten. It covers the two kinds of detach icon and the split-path rules (a split always sits right after the trigger).
- **"Record-update triggers"**: covers the new Trigger 1 / Trigger 2 switch.
- **"Loading skeletons"**: covers the loader switch, options 4–7.

The work is in these files:
- `linear/index.html`
- `linear/node-skin.css` (sections 73–75)
- `workflow-chrome.js` (the Trigger and Skeleton switches)
- `workflow-canvas.html` + `workflow-skeleton.css` / `.js` (the loaders)

## What we worked on this session

- **Split-path and detach rules** in the Linear view, following the user's model.
- **Trigger sentences** for record activity: researched in a claude.ai artifact, then built as two switchable designs.
- **New loader options** for both views.

## Completed

- **Split paths:**
  - A split is always the first node after the trigger.
  - Once a flow has a split, the main path has no gaps; only "Add split path" remains.
  - The demo's IF/Else flow is now Split path 1.
  - Detaching or deleting a path's only step removes the path, and the others renumber.
- **Reattach:**
  - A split piece goes back only after the trigger, as new split path(s).
  - Any piece reattached at the top of a split flow becomes a new split path ("As a new split path").
  - A path that was detached from a Merge rejoins it.
- **Detach icons:**
  - Per-node and per-pill icons are back alongside the gap icons.
  - The SPLIT PATH N pill detaches that path; the BRANCH N pill detaches that branch; the IF row detaches the whole IF/Else; the ELSE pill detaches its steps.
  - The icon sits at least 8px from every marker.
- **Detail panel:** the resizer outline is light blue, and the horizontal scrollbar hides while you hover or drag the resizer.
- **Triggers:**
  - **Trigger 1:** "When a [Request] gets [activity]". The popup rows are the exact words after "gets", including "a task removed". The record popup opens first.
  - **Trigger 2:** one row, "When a record gets an update", covering both fields and activity.
- **Loaders:** 4 · Run, 5 · Packet, 6 · Build and 7 · Ring, selectable from the Skeleton switch in both views.
- **Testing:** all of the above was tested in the browser with Playwright, with 0 console errors.

## In progress

Nothing mid-flight. Awaiting the user's choices (below).

## Next steps

- **Ask the user:**
  - Which loader to keep, or what to improve in it. They want to improve the loader.
  - Whether Trigger 1 or Trigger 2 becomes final; then remove the switch.
- **Waiting on the manager:** where Approval Status, Signature Status and Escalation level go (fields or activity).
- **Not tested:**
  - Drag and drop of split pieces.
  - Undo after a split reattach.
  - Hover highlight on the pill icons.
  - Trigger 1 search after the rewrite.
  - Trigger 2 hover preview.
- **Older open items:**
  - Merge Timeout steps are dropped when a split unwraps.
  - Dead-code cleanup.
  - The real Get records caps.

## Decisions made

- **A split is always right after the trigger;** new steps go into a new split path (user's model).
- **Merge membership:**
  - Split path 1 (the old pre-split steps) does not join Merge 1 (user: "fine as it is").
  - A reattached path rejoins its Merge (user: yes).
- **Two detach icons:**
  - A gap icon detaches everything below it.
  - A node or pill icon detaches only that thing.
  - The BRANCH N pill takes the whole branch; the ELSE pill takes its steps only (user's answers).
- **Activity sentence rules:** the record comes first, there's no colon, and no technical words. The user picked "gets …" and "a task removed".

## Gotchas & notes

- **SVG motion paths:** Chrome ignored an `animateMotion` path that used only a `V` command; use `L`.
- **Trigger 2 testing:** it can only be switched through the real top bar, because the Linear page listens to messages only when embedded. Test it via `/` → Linear, not `linear/index.html` directly.
- **Field names are lowercase** in trigger sentences (`triggerFieldsFor` labels).
- **Local server:** it gets killed when memory is low; restart it with `node server.js`.
