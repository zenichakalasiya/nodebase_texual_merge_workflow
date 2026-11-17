# Handoff — 2026-11-17

## Read first

In `CLAUDE.md`, read:
- **"Detached steps"**: its first paragraph is rewritten. Detach is back on the gaps, and the split-path rules are new.
- **"Triggers: field changes vs activity"**: a new bullet in the Linear functional edits.

The work is all in `linear/index.html` and `linear/node-skin.css` (sections 70–74).

## What we worked on this session

- **Detach is back on the gaps.** The icon on the connector detaches the next step and everything after it on that path. The whole run is highlighted from the icon's own point down. The per-node icons are off (`DT_ON_NODE = false`).
- **Fly animation:** it moves only the visible part, scaled evenly into the card. This fixes the merge path flying in from the top.
- **Split paths, following the v5.17 rules:**
  - Adding a split as the 2nd step wraps the first flow into Split path 1.
  - Deleting a path renumbers the others.
  - With 2 paths, deleting one unwraps the split.
- **Detaching a split path** takes the whole path, plus a Merge fed only by it and that Merge's branches. Shared Merges stay.
- **Detail panel polish:**
  - The resizer shows only when the flow is wider than the card. On hover, it outlines the card's left edge in blue.
  - The shadow band under the cards is gone.
  - Cards no longer shift when the ⋮ / › icons appear.
- **Triggers (Request family):**
  - "When record is updated" is split into "When a field changes" and "When there's activity on a record" (11 activities).
  - Smart search highlights the matched words and previews the hovered sentence in the flow.

## Completed and tested (Playwright, 0 console errors)

- **Gap detach:** works, with the full highlight, and the hover colour starts at the icon.
- **Fly:** tested on a Merge timeout path, a long main path and a split path.
- **Resizer:** hidden on small flows; on wide flows it shows the blue outline.
- **Shadow and card size:** the shadow band is gone, and cards stay 90px tall on hover.
- **`splitTakePath`:** unit-tested on 4 cases.
- **Split paths in the UI:** detaching path 3 renumbers the others. Going from 2 paths to 1 unwraps the split and inlines Merge 1's success steps.
- **Trigger search:** tested with reply, spam, priority, note, merge, status, task, incident, request, "reply incident", "priority problem" and "spam request".
- **Hover preview and blanks:** the hovered sentence previews, picking opens the module blank, and switching the activity asks for the variant again.

## Not tested

- The hover preview when changing an existing trigger.
- Detaching a split path that has its own Merge, in the browser (unit test only).
- Reattaching a split + merge piece.
- Dragging a piece into an empty branch.

## Next steps / open questions

- **Waiting on the manager:** do Approval Status, Signature Status and Response / Resolution Escalation Level count as fields or as activity?
- **Ask the user:**
  - Where should a removed Merge's Timeout steps go on unwrap? Today they are dropped.
  - Should the step above a hovered gap keep its light-blue tint?
  - Should the stack's spread-on-hover movement be removed?
  - Should there be a way to detach just the IF branch's steps?
  - Should the pulse always run?
  - Should the cards' mini diagram use double lines?
- **Cleanup:** remove dead code (`dtFold`, `placing`, `dtDropBar`, the Detach Popover code, skeletons 1/3/4, and the now-unused per-node detach).
- **Older items:** the real Get records caps, a Field Lab refresh, and f(x) for the rich-text fields.

## Decisions made

- **Detach lives on the gaps again** (the user asked to restore the old concept). It covers the whole flow after the gap, to the end of that path.
- **Merge rules:**
  - Deleting a path drops it from the Merge's list.
  - Detaching a split path takes its own Merge and that Merge's branches.
  - Going from 2 paths to 1 removes the Merge and keeps its success steps in the remaining path.
- **Spam counts as a feature (activity).** The trigger work is for Request only for now.

## Gotchas & notes

- **Hover state must stay stable:** keep the same object for the same target (`setDtOne(c => same ? c : new)`).
- **Test page:** without `?embed=1` the Linear page starts empty and dark. That page is useful for testing the empty trigger picker.
- **Local server:** port 8777 gets killed when memory is low; restart it with `node server.js`.
