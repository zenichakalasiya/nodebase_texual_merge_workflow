# Handoff — 2026-11-12 12:31

## Read first

In `CLAUDE.md`, read **"Detached steps"**. It was rewritten this session and now covers the in-flow preview, the tree-style Reattach list, and drag = pick up. Everything this session is in `linear/index.html` and `linear/node-skin.css` (sections 55–59).

## What we worked on this session

Made reattaching detached steps much clearer:
- You can see the piece **inside the workflow** before attaching it.
- The Reattach list became a clean tree, like the canvas.
- Drag became pick up + a "Put it here" gap.

## Completed

- **CTAs:**
  - The time is gone from the cards.
  - V1: a primary **Reattach** text button and the delete icon sit at the top right of the detail.
  - V2: the same Reattach button and delete icon appear on the card on hover.
- **Preview in the flow:** hovering a place in the Reattach list renders the piece faded inside the real flow, in a dashed "Attaches here" box. Its own connectors are blue and dashed, and they're cleared once the preview ends or the piece is attached.
- **Reattach list:**
  - Shows only valid places.
  - Drawn as a tree: Start of the workflow; steps with their icon and "After this step"; paths with their canvas badges hanging off elbows.
  - Ineligible parents stay visible, muted, for context.
  - Search gives flat results, with the location underneath.
- **Drag = pick up:**
  - Letting go keeps the piece picked.
  - A real gap opens with **Put it here** / **See preview**. See preview fills it with the whole flow, then shows **Put it here** / **Back**.
  - Esc or clicking away cancels.
- **Detail diagram:** more vertical room, 28px between paths.
- **Removed:** the detail warning note.

## In progress

Nothing mid-flight.

## Next steps

- **Untested:**
  - The drag preview's top-left button change (no "Attaches here" chip).
  - Dragging deep into branches.
  - Edge auto-scroll while carrying.
- **Ask the user:**
  - Should empty paths accept a drag? Only the list can target them today.
  - Is the "stays put while over the gap or preview" behaviour fine for big pieces?
  - Which Detach design (V1 or V2) is final, and when should each skeleton or loader show?
- **Optional cleanup:** remove the dead code — `dtFold`, `trayFolded`, `placing`, `dtDropBar`, `dt-banner`, and the unused "Goes here" line path.
- **Older items:**
  - The real Get records caps.
  - Field Lab refresh.
  - f(x) for the rich-text fields.

## Decisions made

- **The preview is rendered, not committed.** While previewing, `flow` itself includes the piece, so every canvas helper agrees on paths. The attach logic uses `dtFlowRef` (the real flow). A first attempt that only changed the render call crashed (`recordsInScope`).
- **Drag doesn't attach on release.** You always click **Put it here**, so **See preview** can be clicked first. This was the user's choice.
- **The Reattach list hides ineligible places.** It only keeps their parents, muted, so a deep place never loses its context.

## Gotchas & notes

- **Class names:** V8 uses `.slot` for its dashed blank words. An overlay with class `slot` inherits a dashed underline, so ours is `dtslot`.
- **Line detection:** `dtMarkLines` treats a div as an elbow only if it has BOTH border-left and border-bottom. Blanks' dashed underlines have only border-bottom.
- **Reused DOM:** React reuses the preview's DOM for the attached steps, so imperative marks must be cleared (`dtUnmarkLines`).
- **Hit testing while carrying:** `body *` gets `pointer-events:none`. `elementsFromPoint` then won't find the canvas, so debug by position instead.
- **Local server:** it was killed once for low memory and restarted on :8777.
