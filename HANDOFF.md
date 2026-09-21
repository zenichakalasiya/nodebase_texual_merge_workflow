# Handoff — 2026-09-21 11:00

## Read first

`CLAUDE.md` — the **"Key context"** section, especially *Behaviour that is
deliberate* and the new *Reference builders* / *Trigger drawer vs the design
screenshots* notes. Then `BRANCHING-DEBATE.md` for the still-open branching
question carried over from the previous session.

## What we worked on this session

Studied the textual builder in depth, then re-checked the requested
"popover + drawer" trigger flow against the real page. **No app code changed this
session** — the flow was already built; this session confirmed that and pinned down
the remaining differences from the design screenshots.

## Completed

- **Read the textual builder end to end** (source + a live walkthrough): design
  tokens, component inventory, per-node behaviour, chrome, popovers, shortcuts.
  Two agents did this; findings were merged into a component-based reference.
  (The working notes lived in the session scratchpad and are gone; the takeaways
  are in this file and `CLAUDE.md`.)
- **Verified the requested flow in a browser** — all working:
  1. trigger node is placed on load, drawer closed;
  2. clicking it opens the picker popover with **Event / Periodic** tabs;
  3. picking a type opens the trigger drawer;
  4. the **Next step** block appears only once the trigger is complete;
  5. that row (or a canvas `+`) closes the drawer and opens the "What happens
     next" popover under the `+`;
  6. picking a node reopens the drawer for that node;
  7. no Save button — "All changes are saved automatically".

## In progress

Nothing mid-flight; the build is unchanged and consistent.

**One question is waiting on the teammate:** should the trigger drawer be brought
in line with the design screenshots? Gaps found (all in `openTrigger()` /
`renderSched()` / the `#triggerCfg` markup in `workflow-canvas.html`, and
`TRIGGER_ITEMS` / `SCHED` in `workflow-app.js`):

- no "Workflow Module Configuration" title, no "Workflow starts here" pill, no
  Event/Periodic switch or info banner *inside* the drawer (the built one shows a
  "Trigger Type" card with a Change button);
- periodic fields: design = Schedule Type, Frequency, Day chips (Sun–Sat), Month,
  Start At; built = per-type fields for Once / Hourly / Daily / Weekly / Monthly;
- periodic popover rows: textual builder = "Once" + "Every time period"; built =
  Once / Hourly / Daily / Weekly / Monthly;
- "Trigger 1" attribute cards with Any/Any dropdowns and ON toggles are not built
  (plain attribute dropdowns instead).

## Next steps

1. **Answer the trigger-drawer question above**, then align the drawer and the
   periodic popover rows with the design screenshots if yes.
2. **Answer the three branching questions** in the previous handoff (still open,
   restated in `BRANCHING-DEBATE.md`): realistic branch count, build the real
   condition builder now, and whether the drawer may stay open for branch paths.
3. **Fix the verified reachability bug**: with 5 branches the drawer lists 6 paths
   but the canvas exposes only 4 `+` buttons — branches 4 and 5 hide behind the
   "+N more" collapse. See `portsOf()` vs `allPortsOf()` in `workflow-app.js`.
4. **Model the branch condition** as field / operator / value (today it is one
   free-text `cond` string); branching creates one branch + Default, not two;
   port labels should read the condition back.
5. Fill in the real second-level contents for the picker's module rows (still
   placeholders).

## Decisions made

- **No code change without confirmation on the trigger drawer.** The built drawer
  works and follows the "always closes when the picker opens" rule; reshaping it
  is a design call, so it was raised rather than done.
- **Take popover/interaction ideas from the textual builder, not its layout.** It
  is a linear sentence builder with no canvas, so it informs the picker, slots and
  shortcuts only.

## Gotchas & notes

- **The Monday.com reference needs a login.** Only a username was ever given; no
  password is stored or should be guessed. Ask the teammate for screenshots or
  access if a comparison is needed.
- **`.playwright-mcp/` is gitignored** and holds ~100+ screenshots/snapshots from
  exploring both builders. Safe to delete.
- **Playwright text selectors can match twice.** The picker's help bubble repeats
  the row title, so `text=Check a condition` hits both; scope to `.wfpop-label`.
- An old `node server.js` may already hold :8777; it serves from disk, so reloads
  pick up edits (use `/workflow-canvas.html` explicitly).
- `BRANCHING-DEBATE.md` shows a one-line uncommitted edit that was not made this
  session.
