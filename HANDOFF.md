# Handoff — 2026-11-15 18:05

## Read first

In `CLAUDE.md`, read:
- **"Detached steps"**: its first paragraph is new, covering detaching from a node's own marker.
- **"Rails"**: the pulse now splits into every path.

The work is all in `linear/index.html` and `linear/node-skin.css` (sections 66–69). **Version 2** was released on 2026-11-12 (git tag `v2`). This publish adds the changes made after it.

## What we worked on this session

Changes after Version 2:
- Detaching moved from the gaps onto each node's own marker, so a single node or a single branch's steps can be detached.
- The rail pulse splits at every branch.
- The detach hover tint is darker.
- The "Drop here" gap is slim (32px) everywhere.
- Cards show a grab hand on hover.

## Completed

- **Unlink icon on each node:** it sits right beside every node's marker (⠿ grip · unlink · marker, 8px apart).
  - **Actions and other steps:** detaches only that node.
  - **IF row:** the whole IF / Else.
  - **BRANCH 1 row:** the whole Branching.
  - **Loop:** the loop and its steps; the icon sits by its join on the main line.
  - **Branch headers** (ELSE, BRANCH 2+, SPLIT PATH N, Otherwise, Merge success/timeout): that branch's steps; the branch stays.
  - **Not shown:** on empty branches. The gap icon is gone.
- **Hover:** tints just that node or branch, in a darker grey (line `#9aa9ba`, tint `#e7ecf2`).
- **Rail pulse:** the main rail keeps glowing and, at each split, the glow turns along the elbow into every path, recursively.
- **"Drop here" box:** 32px everywhere. This fixed the 53px box inside split paths above a Merge (the Station's padding wasn't capped).
- **Cards:** a grab-hand cursor on hover; the grip icon was tried and removed.

## In progress

Nothing mid-flight.

## Next steps

- **Ask the user:**
  - Should there be a way to detach just the IF branch's steps? (The IF row = the whole IF / Else.)
  - Is losing "detach everything below here" OK?
  - Should the pulse run all the time?
- **Optional cleanup of dead code:**
  - The gap trash code in InsertZone (`false &&`).
  - `cutHover` for the gaps.
  - `dtFold`, `placing`, `dtDropBar`.
  - The Detach Popover code and skeletons 1/3/4.
- **Older items:** the real Get records caps; Field Lab refresh; f(x) for the rich-text fields.

## Decisions made

- **Detach lives on the node marker, not the gaps** (user: "currently you place detach icon only beside add icon, which is not right").
- **Branch header detach = that branch's steps only;** the branch stays (user's earlier choice).
- **The rail pulse splits and the main line continues** (user's correction after the "innermost only" version).
- **Version 2 finals:** Skeleton 2, Detach 1 · Panel and Text field B. Their switches were removed.

## Gotchas & notes

- **Hover state must stay stable:** keep the same object for the same target (`setDtOne(c => same ? c : new)`). Rows remount on every App render, so a new object each hover loops forever.
- **Slot sizing:** caps must include padding (`box-sizing:border-box; height:24px; padding:0`).
- **Lane header paths:** the lane path variables differ per header: `lanePath` (merge outcomes, branch and split lanes), `elPath` (Else) and `owPath` (Otherwise).
- **Local server:** port 8777 may need restarting (`node server.js`).
