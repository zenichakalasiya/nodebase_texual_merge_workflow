# Handoff — 2026-11-05 17:28

## Read first

In `CLAUDE.md`, read **"Detached steps"** and **"Loading skeletons"** (both new), and the updated top-bar design switches paragraph. Almost all of this session's work is in:

- `linear/index.html`: the detach tray, picker and drag.
- `linear/node-skin.css`: sections 47–54.
- `workflow-skeleton.css` / `.js`.
- `workflow-canvas.html`: skeleton markup.
- `workflow-chrome.js`: the Detach and Skeleton switches.

## What we worked on this session

Built and refined **detached steps** in the Linear view: cutting a part of the flow off, then reattaching it or deleting it. There are two designs, a panel and a popover.

Also redesigned the **loading skeletons**:
- Both are now grey only.
- There's a new step-by-step build.
- There's a trigger-only skeleton for a new workflow.
- There are compact workflow loaders.

## Completed

- **Demo workflow:** the Linear view opens with a full flow (`EMBED_DEMO_DOC`): IF/Else, a 3-lane split, a merge, a branch and a loop. There's a bigger gap between the trash and + on the line between steps (the hover zone is 72px).
- **Top bar defaults:**
  - The Popup switch is hidden (V1 always).
  - Text field always starts on B.
  - The new **Detach** switch picks 1 · Panel or 2 · Popover.
- **V1 Panel:**
  - Reattach and Delete sit under the title.
  - The summary is 2 lines, plain text, with Read more.
  - The steps are drawn like the canvas.
  - The panel grows wider with the piece, then scrolls.
- **V2 Popover:**
  - Card icons appear on hover.
  - The popover opens to the left, sized to the piece.
  - The stack stays spread while a popover is open, with that card highlighted.
- **Reattach list:**
  - It opens on the left and has search.
  - Places the piece can't go are greyed out, with the reason.
  - Hovering a row outlines that step on the canvas with a single dashed box and a "Goes here" label.
  - Clicking a row attaches the piece, with a landing glow.
- **Drag onto the canvas:** works for cards and the panel/popover title. A single "Put it here" line follows the pointer, and the canvas hover effects are paused while dragging.
- **Removed:**
  - The toolbar "Detached N" button and the fold button.
  - The detail's warning note.
  - The underline on summary phrases.
- **Steps diagram:**
  - Connectors run dot to dot, with no stubs.
  - Lanes are indented 80px.
  - Sibling paths are 28px apart.
  - Branch labels have a small circle.
- **Skeletons:**
  - 1 · Whole is grey only.
  - 2 · Step by step: Node runs at a constant line speed (about 1.5s); Linear runs about 0.16s per row.
  - 3 · New workflow shows the trigger only.
  - 4 · Loader is a compact icon animation (about 124×64 for Node, 104×84 for Linear).

## In progress

Nothing mid-flight.

## Next steps

- Get the user's pick:
  - Detach design: V1 or V2.
  - Which skeleton or loader shows when: suggested Loader on "Create workflow" and Skeleton 3 while a new workflow's data loads.
- Ask whether empty paths should be drag targets. Right now only Reattach can put a piece into an empty path.
- Optional cleanup: delete the dead code.
  - `dtFold`, `trayFolded` and `dtUnfold`.
  - `placing` and `dtDropBar`, and the drop-spot branches in InsertZone / renderFlow.
  - The `dt-banner` markup.
- Older open items:
  - The real Get records caps per schedule.
  - Field Lab refresh.
  - f(x) for the rich-text fields.

## Decisions made

- **Detached pieces are never stored or folded away.** They stay visible until they're reattached or deleted, at the user's request.
- **No "Put it here" spots everywhere.** Only one line appears, where the pointer is while dragging. The spots made the canvas jump and looked cluttered.
- **Skeletons are grey only, except the blue line.** The user asked to remove the green and yellow.
- **The step-by-step Node build is line-led.** Each node appears when its own line reaches it, which removed the "stop – go" feel.

## Gotchas & notes

- **Detach testing:** needs `?embed=1`. Dismiss the "Maybe later" onboarding first. Detach by hovering just above a `[data-nf="dt-trash"]`, then clicking it.
- **Linear skeleton timing:** the Linear builder (Babel) blocks the page for a few seconds on first load. The step-by-step engine chains its timers so it doesn't burst afterwards.
- **Shell:** heredoc patch scripts containing curly quotes broke the bash tool. Write the patch to a file, then run it with node.
- **Console:** Babel's "deoptimised the styling… 500KB" console message is expected and harmless.
- **Uncommitted work:** a lot of uncommitted work from earlier sessions also sits in the tree: `workflow-app.js`, `workflow-chrome.css`, `workflow-nodes.css` and the skeleton files. It goes out with this publish.
