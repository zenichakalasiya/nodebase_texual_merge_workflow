# Handoff — 2026-09-29 16:59

## Read first
In `CLAUDE.md`: the rewritten **Top bar** section (breadcrumb gone, Run
History hidden, the new "Flow Details" paragraph) and **Bottom toolbar**
section (zoom now leads, Note hidden). Both changed this session; the
`[hidden]` CSS gotcha documented there is worth knowing before touching any
other `hidden`-toggled element in this codebase.

## What we worked on this session
One message, six independent UI changes, all landed and verified together:
1. Hide the Run History button from the top bar.
2. Move workflow name + description into the right-hand sidebar (same
   system every node drawer uses) as mandatory fields, gating Publish.
3. Reorder the bottom toolbar: zoom moves to the front, left of Guide/
   Shortcuts, same overall size.
4. "IF/Else" instead of "if" on the Inline condition picker row's tag.
5. Hide the Note tool.
6. Remove the "‹ Workflows /" breadcrumb, keep just the workflow name.

## Completed
- **Run History hidden** — `hidden` attribute added to `#runHistBtn` in
  `workflow-chrome.js`; the button, its click handler, and
  `app.openRunHistory()` are all untouched, just not visible.
- **Flow Details sidebar panel** (`#flowDetailsCfg` in
  `workflow-canvas.html`, `flowDetails` key in the `panels` map in
  `workflow-app.js`, `openFlowDetailsPanel()`/`WFApp.openFlowDetails()`/
  `closeFlowDetails()`) replaces the old `.flowinfo` floating card entirely
  — that popup's markup-building code and all its CSS (`.floatcard.flowinfo`,
  `.fi-label`, `.fi-input`, `.fi-foot`, `.fc-area`) were deleted, not just
  superseded. Workflow name/description are now live-write like every other
  drawer field (no Save button — this closes the one exception CLAUDE.md
  used to call out). Clicking the workflow name still opens it; clicking
  **Publish** (main button or "Save & publish") now calls
  `requireFlowDetails()` first — empty field(s) open this same panel,
  red-outline via `.input-box.invalid`, show a `.cfg-alert` banner, and
  block the publish; "Save only" is NOT gated. NOT a read-only panel like
  Run/Version History — the canvas stays fully editable behind it.
- **Toolbar reordered**: `workflow-chrome.js`'s bottombar markup now emits
  `view-bbar` (zoom/fit/minimap) first, then Guide+Shortcuts+Note, then
  Undo/Redo/Reset — same three groups, same dividers, just the first group
  moved from last to first. Nothing added or removed, so the card's overall
  footprint is unchanged (confirmed visually).
- **"IF/Else" tag** — `workflow-app.js`'s `SUBMENUS.ifelse[0]` (the "Inline
  condition" item) had `tag:'if'`; changed to `tag:'IF/Else'`. Rendered
  as-is by `workflow-popover.js`'s `.wfpop-tag` (`flex-shrink:0`, no fixed
  width, so the longer text just fits naturally — no CSS change needed).
- **Note hidden** — `hidden` attribute added to `#toolNote`; `setTool()`,
  the sticky-note placement/anchor/render system in `workflow-app.js`, and
  existing notes (if any) are all untouched — only the entry point is gone.
- **Breadcrumb removed** — `#goBack` and `#crumbRoot` (plus the `/` sep)
  deleted from the pagebar-left markup, their click handlers removed (not
  just left dangling — they'd have thrown on a null `$()` result), and the
  now-fully-dead `.crumb-link`/`.crumb-sep`/`.cbtn.sm` CSS removed too
  (confirmed nothing else referenced `.cbtn.sm` before deleting it).
- **Found and fixed a real latent bug while building #1 and #5**: `[hidden]`
  had NO CSS rule anywhere in this codebase — every existing use of the
  attribute (minimap, `#runBadge`, trigger schedule fields, etc.) was
  relying entirely on the browser's low-priority default UA rule, which
  loses to any author class that sets `display` unconditionally. This is
  exactly what silently broke `#runHistBtn`'s `hidden` attribute
  (`.btn-outline{display:inline-flex}` was winning). Fixed once, globally,
  with `[hidden]{display:none!important}` in `workflow-chrome.css` — this
  is the actual fix that makes #1 and #5 work, and it fixes the same gap
  for every other `hidden` toggle in the app going forward.
- Verified all six changes together with Playwright (written, run,
  deleted): button/element hidden states, toolbar group order + contents,
  tag text, Flow Details gate (blocks Publish with only description empty,
  correct alert copy, clears on fill, publish succeeds once both are
  filled), breadcrumb markup, zoom/minimap/Guide still functioning after
  the reorder, undo/redo regression — zero console errors throughout.

## In progress
Nothing mid-flight. All six changes are implemented, verified, and were
explicitly requested to be published this session — done (see Deployment
section timestamp / live URL, unchanged).

## Next steps
No open threads from this specific request. One item intentionally NOT
touched, flagged to the user separately:
- **A pre-existing undo/redo bug**: calling `WFApp.redo()` immediately after
  `WFApp.undo()` (right after creating a single node) does not restore the
  node — reproduces identically on the last commit from BEFORE this
  session's changes too (confirmed via `git stash`), so it predates
  everything done today and is unrelated to any of the six changes above.
  Not investigated further or fixed — out of scope for this session's
  request. Worth a dedicated look if the user brings it up: likely in
  `pushHistory()`/`undo()`/`redo()` in `workflow-app.js`, possibly a timing/
  debounce issue given it didn't reproduce in every test this session (some
  earlier undo/redo checks in this same session passed fine with a similar
  shape of test).

## Decisions made
- Interpreted "hide" literally (attribute-hidden, code/handlers intact) for
  both Run History and Note, rather than the "remove entirely" treatment
  Test Run got in an earlier session — the user's own wording differed
  ("hide" vs. that earlier session's explicit "remove"), so the two are
  deliberately handled differently. If either should come back, it's a
  one-line `hidden` removal, not a rebuild.
- Removed the breadcrumb's DOM/handlers/CSS outright rather than hiding it —
  unlike Run History/Note, "keep only workflow name" reads as a permanent
  layout decision, not a toggle-off, and there's nothing to preserve access
  to (no code path re-shows it).
- Made Flow Details live-write (no Save button) rather than preserving the
  old popup's local-edit-then-Save behavior — moving the fields into the
  shared sidebar system means adopting that system's own convention
  (autosave, `.cfg-alert` validation), not just relocating the old widget
  into a new container.
- Only "Save & publish" and the main Publish button are gated on Flow
  Details being complete; "Save only" is not — the user said "on click of
  publish CTA" specifically, and Save-only is a lesser, non-public-facing
  action where forcing metadata first would be unnecessarily strict.

## Gotchas & notes
- `git stash` / `git stash pop` is a fast, safe way to test "does this bug
  exist on the last commit too" without losing in-progress work — used this
  session to confirm the undo/redo issue predates today's changes before
  deciding not to chase it further.
- When adding a `hidden` attribute to hide something in THIS codebase,
  don't assume it works — check whether the element's class sets `display`
  unconditionally first (most `.cbtn`/`.btn-*` classes here do). The global
  `[hidden]{display:none!important}` rule added this session should make
  this a non-issue going forward, but it's new as of today.
