# Handoff — 2026-09-22 11:50

## Read first

`CLAUDE.md` — the **"Key context"** section, all of it; a large chunk was
rewritten this session (Branch/IF-Else redesign, parallel nodes, connector
dragging, confirm dialogs, condition-error display, top bar). `BRANCHING-DEBATE.md`
is now historical — its open questions were answered by explicit direction
rather than by the two-agent research it recorded; skim it for context only.

## What we worked on this session

Reshaped Branch and IF/Else to match the textual builder's reference screens
(lanes/paths fan out from a Trigger-style card, no node-picker inside the card
itself), added parallel nodes, a real grouped condition builder, then a long run
of bug fixes and polish: connectors following dragged nodes, arrowheads, confirm
dialogs before destructive deletes, a quiet one-line condition error instead of
red field outlines, a cleaned-up top bar, and a workflow name/description popup
with explicit Save.

## Completed

- **Branch redesign** — `branch` node now holds `lanes: []`; each lane is its
  own `lane` node (`kind:'if'|'else'`) with its own `groups`/drawer/Next-step.
  Branch card is Trigger-style (tag/icon/title/description), no branches drawn
  inside it. Lines fan **downward**: solid to each real lane, dotted "pending"
  slot at the end whose `+` opens **Add branch: Or if / Or else**
  (`openBranchType()`). Branch 1 (first `if` lane) can't be deleted.
- **IF/Else redesign** — same Trigger-style card; exactly two fixed outputs
  (Is True / Is False, no more Else-IF), same downward fan, condition read back
  into the card's description.
- **Grouped condition builder** — `groupsHTML()` / `bindBuilder()`, shared by
  the branch-path drawer (`#lnCond`) and IF/Else (`#ifCond`): Condition Group
  N cards, collapsible conditions, And/Or join chips (`cjoin`/`gjoin`), `fx`
  expression toggle, Add Condition / Add Condition Group / Remove All
  Condition. Matches the reference screenshots.
- **Branch-path drawer** — name, conditions, Next step, back arrow to the
  parent Branch, and a `‹ 1 of N ›` stepper in the header (hidden when N < 2,
  per explicit request) to move between sibling branches.
- **Parallel nodes** — Trigger and branch-path `next` outputs only. A dashed
  "Add parallel node" slot (canvas + drawer Next-step block) adds a sibling
  that runs alongside the first; 2+ fan out under a "Parallel" tag, same visual
  language as a branch fan.
- **Periodic trigger** — card shows a computed **Next execution time**
  (`nextRun()`), pill reads "Periodic workflow". All node pills (Trigger,
  Periodic workflow, IF/Else, Branch) lost their icon — text only, per request.
- **Connector-follow-drag bug, fixed** — every line is now drawn to the child's
  live position (`entry()`), not its original layout slot, so dragging a node
  keeps its connector (and everything under it) attached. A node dragged above
  its parent gets a smooth S-curve instead of a folded elbow.
- **Arrowheads** — every connector that lands on a node ends in one
  (`marker-end="url(#wf-arrow)"`, defined once in the SVG `<defs>`); lines that
  end in a "+" don't get one.
- **Tree-rail visuals** — the Branches list in the main Branch drawer and every
  drawer's Next-step block now share one continuous-rail tree look
  (`.br-rows`/`.nn-body`), replacing the earlier boxed rows.
- **Confirm dialogs before destructive deletes** — `confirmDialog()` +
  `.wf-modal-*`: deleting a branch (names the step count it would take with
  it), Reset (bottom bar), and header ⋮ → Delete workflow all ask first.
  Cancel/Esc/outside-click decline; undo still restores after confirming.
- **Condition-error display fixed** — no more stale/incorrect red field
  outlines. One line under the condition groups (`condError()`/`.cg-err`)
  names the first incomplete condition and what it's missing; it updates live
  as you type and clears the moment the condition is complete.
- **Top bar cleanup** — removed the description icon and the Working/Published
  version dropdown; Simple/Node view is now centred on the bar independent of
  the breadcrumb.
- **Workflow name/description popup** — clicking the workflow name opens a
  card with Name + Description fields. Opens plain; a **Save** button appears
  only once something has been edited (compared against the values when it
  opened), and nothing reaches the top bar or tab title until Save is pressed.
  Any other close (Esc/outside-click/re-click) discards the edit.

## In progress

Nothing mid-flight; the build is consistent (checked in-browser after every
change this session, no console errors in any of the runs).

**Open question the teammate hasn't answered yet:** deleting a *non-branch*
node (an IF/Else, or via the connector's insert/delete hover control) still
removes everything after it with **no** confirmation — only branch deletes and
the two resets got the dialog. Worth asking whether that should get the same
treatment.

## Next steps

1. Decide whether non-branch node deletion (IF/Else delete icon, connector
   hover-delete) should get the same confirm dialog as branches/reset.
2. Trigger drawer still doesn't match the design screenshots' shape (see
   `CLAUDE.md` → "Trigger drawer vs the design screenshots") — only the
   periodic card's Next-execution-time and pill wording were pulled from those
   screenshots so far, not the drawer layout itself.
3. Field/operator/value lists in the condition builder (`FIELDS`, `OPS` in
   `workflow-app.js`) are still placeholders — swap for the real per-module
   lists when available.
4. Consider whether a half-filled *second* condition/group (beyond Condition 1
   of Group 1) should also surface in the one-line error, or stay silent as now.
5. Fill in real second-level picker content for the still-placeholder module
   rows (carried over from before this session).

## Decisions made

- **Branch/IF-Else UX comes from the reference screens, not from first
  principles.** Every shape decision (downward fan, dotted pending slot, Or
  if/Or else popup, lane stepper position, parallel-node placeholder) was
  confirmed against a screenshot or an explicit multiple-choice answer before
  building — see the `AskUserQuestion` rounds in this session's transcript if a
  "why this and not that" ever needs re-deriving.
- **Confirm dialogs only where deletion is irreversible-feeling** (takes other
  work with it, or wipes the whole flow) — not on every delete icon. Deliberately
  narrower than "confirm everything".
- **No per-field red outlines, ever, for conditions.** One quiet summary line
  instead — explicit correction after the red-border-goes-stale bug.
- **The workflow name/description popup is the one exception to "no Save
  button anywhere"** — explicit request, kept narrowly scoped to that one popup.

## Gotchas & notes

- **Shell quoting broke a couple of inline JS-in-bash edits mid-session**
  (nested backticks/template literals inside a `bash -c` heredoc). The fix each
  time was to write the replacement as its own `.js` script file in the
  scratchpad and run it with `node`, rather than trying to inline it — do that
  from the start for any edit with template literals or nested quotes.
- **`showPar`/`chainFans` (parallel-node layout) key off `selId`** — the dashed
  "add parallel" slot only renders for the currently-selected node, so a
  layout check right after a programmatic `selectNode()` needs a tick/`render()`
  to settle before asserting on it.
- **`.nns-branch` rows needed `position:relative` for the new tree rail**, which
  fought a leftover `left:56px` from the old lane-tree layout — both are now
  overridden with `!important` in `workflow-nodes.css`; if that rail ever looks
  offset again, check for a third layer setting `left`/`top` on `.nns-branch`.
- **Playwright text-selectors matching twice** is a recurring trap in this repo
  (a popover's help bubble repeats the row title) — scope to `.wfpop-label`
  rather than a bare `text=`.
- **`.playwright-mcp/` keeps accumulating screenshots** from ad hoc verification
  runs; it's gitignored, safe to delete anytime, not part of the app.
