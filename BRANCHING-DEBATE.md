# Branching: how to sync the textual and node-based models

Two agents were briefed to argue opposite sides of the multi-way branching
question, research how comparable products solve it, and concede honestly where
their own side fails. Their full reports are below, followed by the synthesis and
the open questions.

**Context:** Motadata ServiceOps. ITSM admins build 3–8 step workflows, a few
times a quarter. The textual builder creatBes a vertical **lane** per branch, each
holding its own condition *and* its own steps. The node builder creates one
**Branch node** whose drawer holds the whole decision table, wired to its paths
afterwards.

---

## Agent A — the case for lanes (condition beside its steps)

### 1. The core claim

**A branching rule is one thought — "if it's a hardware P1, send it to the
Hardware Team" — and the all-conditions-first model splits that thought in half
and asks the admin to hold N halves in working memory while they finish none of
them.** The condition is only meaningful because of what it causes. Separate them
by a drawer-close and a canvas re-orientation, and you have converted one easy
decision into a two-phase project with a hand-off in the middle.

### 2. What the products actually do

**Condition-with-its-steps (lane model) — the tools built for non-developers:**

- **Zapier Paths** is the closest living relative of our textual builder, and it
  is aggressively lane-shaped. Adding a Paths step *immediately creates two
  branches*, "Path A" and "Path B" — not one node with a table. Each path's rules
  live in that path's own sidebar ("Rules setup & testing"), and each path holds
  its own actions inline. Up to 10 branches per path group; a "Fallback" branch,
  auto-named and not renameable, catches the rest.
  <https://help.zapier.com/hc/en-us/articles/8496288555917-Add-branching-logic-to-Zaps-with-paths>
- **Jira automation** — the single most relevant comparator, because it is the
  same admin persona doing the same job — puts the if/else block inline in a
  top-to-bottom rule list: condition, then the actions it governs, then the next
  `else if`, then its actions. Atlassian says you can "add as many if/else
  conditions as you want" and supports two levels of nesting. There is no decision
  table anywhere.
  <https://support.atlassian.com/cloud-automation/docs/jira-automation-conditions/>
- **Make.com** went further and put the condition *on the connector*: you
  right-click the dots between the router and that route's first module and choose
  "set up a filter". The fallback route is configured per-route, not centrally.
  <https://help.make.com/router> · <https://help.make.com/step-4-add-a-filter>
- **Dify's If-Else** is literally our lane model as a card: an IF path, then ELIF
  paths added one at a time, then ELSE, each carrying its own condition and its own
  output handle. <https://docs.dify.ai/en/use-dify/nodes/ifelse>

**All-conditions-first (decision table) — and what it costs:**

- **n8n's Switch** is the purest version of the opposing model, and its defaults
  are a warning. "Add Routing Rule" per branch, all inside the node panel.
  Renaming an output is an *opt-in toggle*, so the common case is ports labelled
  `0, 1, 2`. "Fallback Output" defaults to **None** — items matching no rule are
  silently discarded. Practitioners describe exactly the failure this invites:
  unmatched items "disappear by default with no error, no warning, no trace".
  <https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.switch/> ·
  <https://madebyaime.com/blog/n8n-switch-node/> ·
  <https://github.com/n8n-io/n8n/pull/12020> ·
  <https://github.com/n8n-io/n8n/issues/22000>
- **Monday.com** does offer "Multi-branching conditions" — but note the
  constraint that makes it survivable: you pick *one status column*, then choose
  labels for option 1 and option 2, then "+ Add condition". Every row is one enum
  value of one field. Unmatched runs get an explicit choice: "Stop workflow" or
  "Do something else". Practitioner guidance is blunt about the ceiling: "maximum
  3 levels of If/Else — beyond that, maintenance becomes impossible".
  <https://support.monday.com/hc/en-us/articles/11065311570066-Get-started-with-the-workflow-builder> ·
  <https://till-freitag.com/en/blog/monday-workflows-deep-dive-en> ·
  <https://community.monday.com/t/feature-request-enhanced-multi-branch-conditions-for-workflow-automations-solving-the-if-chain-problem/117661>
- **Dify's Question Classifier** is a genuine all-rows-first UI — and it works,
  because each row is a *title plus a description*, i.e. a label, not a compound
  predicate. <https://docs.dify.ai/en/use-dify/nodes/question-classifier>
- **Attio** offers Filter / If-Else / Switch; Switch "creates multiple logic
  branches", but the public docs never show a decision table.
  <https://attio.com/help/reference/automations/workflows/getting-started-with-workflows>

**The pattern:** decision tables are viable when each row is a *label* (Dify
classifier) or a *single enum value of a single field* (monday). The moment a row
is a full condition builder — field, operator, value, AND/OR — every tool aimed at
non-developers puts that condition next to the steps it governs.

### 3. Why lanes win for an ITSM admin

- **Cognitive load.** One open question at a time: "what happens next in *this*
  lane?" If a P1 interrupts you mid-build, branch 1 is complete and testable. With
  a table you have four unfinished conditions and zero working paths.
- **Completion.** Lane-at-a-time reaches a valid, saveable workflow after the
  first branch. The table model has a long trough where the workflow does nothing —
  and that trough is where people abandon and make a second rule instead, which is
  the rule-sprawl failure the merged builder exists to fix.
- **Error recovery.** Our drawer auto-saves and flags errors once the user moves
  on. Lanes produce *one* error badge on *one* lane. Abandoning a half-filled
  4-row table produces four badges at once on one card, which reads as "this node
  is broken" — and people delete and start over.
- **Discoverability.** "Add step" and "Add if/else branch" appear where the user
  is already looking. Branch-count discovery in the table model is inside a drawer
  they have to know to reopen.
- **Read-back six months later.** `OR IF priority is one of High, Medium → update
  the Problem → Technician group = Hardware Team` is readable with zero
  orientation. A Switch node with ports `Branch 1 / Branch 2 / Default` requires
  opening the drawer, reading row 2, closing it, and tracing port 2 across the
  canvas. Names are the only thing carrying meaning in the table model, and names
  are exactly what users skip.

### 4. Where all-conditions-first breaks

- **Commit-before-you-know.** You don't know the true branch set until you build
  the first path. Admin defines Hardware / Software / Network / Default, starts
  wiring Hardware, and discovers hardware P1s need an approval step *and* a
  separate lane for out-of-warranty assets. Now they reopen the drawer, insert a
  row mid-table, and every downstream port shifts.
- **The nameless-port problem.** Between "close drawer" and "wire port 3" there is
  a memory hand-off with no visual aid. n8n's `Output 0/1/2` and Zapier's `Path
  A/B` show what users actually leave behind.
- **Silent non-routing.** n8n drops unmatched items with no trace. In ITSM that is
  a ticket that never reaches a queue. Filling every row you created makes "did I
  cover everything?" *feel* answered when it isn't.
- **Drawer-as-whole-workflow.** Five branches × a condition builder each is a long
  scrolling form, and "Next step" ends up below the fold — the one control that
  reconnects the table to the canvas is the one nobody sees.
- **Auto-save amplifies it.** A half-thought 5-row table is persisted as a
  half-valid decision and flips to error the moment the user pans away.

### 5. Where the lane model is genuinely worse

- **Overlap is invisible.** Branch 1 `priority is High` and branch 3 `urgency is
  Urgent` overlap for a large set of tickets, and under first-match-wins the admin
  will never see it. *This is the opposing side's best argument and it is a real
  one.*
- **Coverage gaps are invisible.** "Which priorities does this not handle?" is
  answerable at a glance in monday's single-column table, and not at all by
  scanning lanes.
- **Reordering is expensive.** Order is semantics under first-match-wins, and
  dragging a lane means dragging its whole subtree. Make needed a dedicated "order
  routes" dialog precisely because this is awkward on a canvas.
- **A 7-way branch is miserable** — a very tall canvas with no vantage point.
- **Repetition.** When all branches key off the same field (the common ITSM case),
  the lane model makes you re-select that field N times.
- **Comparison is serial.** "Which lane sets Technician Group?" is an N-lane scan.

### 6. How the lane model becomes a canvas model

The textual lane is *vertical*; on a canvas it becomes **horizontal**, and lanes
stack. That one rotation preserves the reading model.

1. **Pick** — `+` → popover → "Check a condition" → "Branching condition". Same
   component we already have.
2. **One lane, not N.** The card is created with exactly **one** branch row plus a
   `Default · everything else` row. No Branch 2/3 placeholders. *A lane is only
   ever created by an explicit act, never pre-allocated.* (Zapier pre-creates two;
   two is already a guess.)
3. **The row becomes a sentence.** As the condition fills, the row label
   live-updates from `Branch 1` to `priority is High or Medium`. Names stop being
   the only carrier of meaning, so the n8n "Output 0" failure can't happen.
4. **Steps attach in-lane.** Picking from "Next step", or the `+` on that port,
   drops the node to the right of that row's port on its own horizontal swimlane.
   Lane 1 reads left-to-right as a sentence.
5. **`＋ OR IF` at the end of the lane.** Once lane 1 has a configured step, the
   affordance appears at the end of lane 1 and on the card's last row. Clicking it
   adds row 2, pushes Default down, and pans to the new empty lane.
6. **Default is never silent.** Always present, with its own port and `+`. Leaving
   it unattached fires the amber warning — strictly better than n8n's
   `Fallback: None`.
7. **The table exists as a review view, not an authoring view.** A `⊞ Review
   branches` toggle flips the drawer to a compact grid: order handle, condition
   summary, lane step count, drag-to-reorder, plus overlap and coverage hints.
   *This buys back every concession in §5 at the moment it matters — review —
   instead of at the moment it hurts, which is authoring.*
8. **Height control.** Lanes collapse to a `3 steps ▸` chip; the card keeps its
   "+N more" past 3 rows. A 7-way branch is 7 one-line lanes, expanded one at a
   time.

**Net:** author in lanes, review in a table, and never ask an ITSM admin to name a
path before they know what's down it.

---

## Agent B — the case for one Branch node (whole decision first)

### 1. The core claim

**A routing rule is not N independent decisions, it is one decision.**
"Networking → Network team, Hardware → Hardware team, else → Helpdesk" is a
decision table. Its correctness properties — is it exhaustive? do two rows
overlap? is row 3 unreachable because row 1 already caught it? is the fallback
right? — are properties *of the whole table*, not of any row. A UI that only ever
shows one row at a time cannot support the one review question that matters.

### 2. What the field actually does

The products that take multi-way routing seriously converge on our shape: **all
rules in one panel, outputs wired afterwards.**

- **n8n Switch** — "build a matching rule for each output" inside the node panel,
  *Add Routing Rule* to stack more, each with a *Rename Output* toggle; the node
  grows one port per rule and you wire out after. Fallback is an explicit setting;
  matching is first-match unless you opt into "send to all matching outputs".
  <https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.switch/>
- **Attio Switch** — "routes the workflow into multiple paths based on conditions.
  These paths are called cases," plus a Default. Evaluation is explicit and
  ordered: "If multiple paths are true, paths are evaluated in order: Case 1, Case
  2, Case 3, then Default. The first path that returns true is the only path that
  runs." Attachment is a *separate, later* act: you "select the next block for each
  case path" — almost literally our drawer's "Next step" rows.
  <https://attio.com/help/reference/automations/workflows/workflows-block-library>
- **Dify IF/ELSE** — one node holds IF plus stacked ELIF plus ELSE; the whole
  ladder is authored in one panel and the canvas shows the resulting ports. Its
  Question Classifier follows the same pattern.
  <https://docs.dify.ai/en/use-dify/nodes/ifelse> ·
  <https://legacy-docs.dify.ai/guides/workflow/node/question-classifier>
- **Make Router** — routes are ordered and that order is a first-class editable
  operation, with a designated fallback marked on the router module. The *router*,
  not the route, owns priority. <https://help.make.com/router>
- **Jira automation** — conditions are authored in the configuration sidebar, then
  the **"add else" button** adds the alternate branch.
  <https://confluence.atlassian.com/automation074/else-if-has-shipped-1141481188.html>
- **monday.com** markets "multi-branching conditions… run options for multiple
  potential outcomes at once" as a capability above simple if/else.
  <https://support.monday.com/hc/en-us/articles/20598895919122-The-workflow-builder-features-and-capabilities>

**Zapier Paths is the other side's exemplar — and it undercuts them.** Paths does
create side-by-side branches, but you cannot see the rules side by side: you select
a branch and open its **"Rules setup & testing" tab** to author the condition, one
branch at a time. The lane model still routes condition-editing through a panel —
it just scatters the panels. It also has to bolt the missing table-level concepts
back on: one designated fallback per group, and strict left-to-right evaluation.
<https://help.zapier.com/hc/en-us/articles/8496288555917-Add-branching-logic-to-Zap-workflows-with-Paths>

### 3. Why this fits ITSM admins

Routing rules in ServiceOps are **taxonomy-shaped**: a category list, a priority
ladder, a site list. The admin already has the table in their head or a
spreadsheet. One pass, one place lets them transcribe it in one sitting, with the
tab key, and then *read it back* before wiring anything.

- **Overlap and gaps are visible.** Branch 1 "Category in Networking, Hardware" and
  Branch 2 "Category in Hardware" six rows apart in one scroll is a bug you spot.
  In lanes they're two screen-widths apart with twelve action cards between them.
- **Priority is authored, not implied.** First-match ordering is the single most
  misunderstood thing about routing. In a stack, order is vertical and draggable.
  In lanes, priority is a horizontal accident of creation order.
- **Six months later.** The maintenance task is almost never "change one path's
  steps"; it's "add Security to the routing table" or "why did INC-4471 go to
  Helpdesk?" Both are table questions.

And it keeps the canvas compact: one card with N ports instead of N inflated lanes.

### 4. Where the lane model breaks

- **The abandoned-lane trap.** You complete Lane 1 fully, momentum carries you into
  Lane 2, you never write Lane 3 — and "OR IF a field" reads as an *invitation*,
  not an *error*. Zapier has to enforce "you must add at least one action to each
  path branch" precisely because this happens.
- **Whack-a-mole edits.** "Networking and Security both go to the Network team" is
  one row edited in a table; in lanes it's find, edit, find, delete, and check
  nothing downstream depended on it.
- **Priority drift.** Insert a lane and you've silently re-ordered evaluation for
  every record, with nothing showing that you did.
- **Deep-lane blindness.** A lane with eight steps pushes its own condition
  off-screen.
- **Asymmetry is invisible.** "Always run" vs a condition vs a fallback is one
  aligned field in a stack; in lanes it's buried in each lane's header.

### 5. Where this model is genuinely worse

1. **The five-empty-ports cliff.** You finish a satisfying table, close the drawer,
   and face five dangling `+` buttons and zero actual work done. A real motivation
   collapse; the lane model always gives you one finished path.
2. **Port identity loss.** "Branch 3" is meaningless later if defaults were left.
3. **Drawer↔canvas ping-pong.** Every path costs a context switch.
4. **The two-path case feels heavy.** "If P1, page on-call, else nothing" does not
   want a decision table and a Default row.
5. **Premature commitment.** Lanes let you discover branch 3 while building branch
   1; this asks you to know the taxonomy first.
6. **Our own error model punishes us.** Auto-save means a half-typed five-branch
   table can light up five error badges at once.

### 6. Fixing the gap between "decision defined" and "paths filled"

1. **Don't route two-way cases here at all** — the picker's second level already
   splits Inline vs Branching. Objection 4 dissolves by routing, not redesign.
2. **Names are ports, so make names real.** Auto-suggest the name from the
   condition ("Category in Networking" → "Networking"), prefilled but editable.
3. **Auto-expand "Next step"** the moment the last branch's condition is complete,
   and scroll it into view — the eye lands on a checklist, not an empty canvas.
4. **Fill from the drawer, not the canvas.** "+ Select next block" opens the same
   picker anchored to that row, wires it to that port, and **keeps the drawer
   open**. Two clicks per path, no panning. (This is the Attio pattern.)
5. **Lane-style momentum without lanes** — a `Next empty path →` button that jumps
   to the next unfilled row and reopens the picker there.
6. **Make the remaining work countable** — "3 of 5 paths empty", hovering a row
   highlights that connector, clicking a port scrolls the drawer to that branch.

---

## Synthesis

### They agree on the facts and split on the reading

Both landed on the same Zapier behaviour: Paths creates two branches immediately,
*and* edits each rule in its own panel. A read it as "even the table tool
pre-creates lanes"; B read it as "even the lane tool edits rules in a panel."
**Zapier is a hybrid** — which is the actual finding, and it's the shape of the
answer.

### A found the sharper pattern

Decision tables work where a row is a **label** or **one enum value of one field**.
The moment a row is a full condition builder, every tool aimed at non-developers
puts the condition next to its steps. **Our branch rows are full condition
builders**, so the pattern implicates us. The n8n evidence seals it: silent
fallback and opt-in output renaming are the batched model's two failure modes
shipping as defaults in its most-cited example.

### B is right about what a table is *for*

Overlap, coverage and first-match ordering are properties of the whole table and
are invisible in lanes. Make needed a dedicated "order routes" dialog because
ordering on a canvas is awkward. Those concerns are real — they just aren't
*authoring* concerns.

### Conclusion: author in lanes, review as a table

1. **Branching creates one branch + Default** — not two, not N. A second branch is
   an explicit act. Kills the five-empty-ports cliff at no cost.
2. **The port label is the condition read back** — "Priority is High or Medium",
   not "Branch 3". Highest-value single change; it's exactly what n8n users
   demonstrably fail to do by hand.
3. **A "Review branches" view in the drawer** — compact list, drag to reorder,
   overlap and coverage hints. Always available, never the authoring surface.
4. **Two-way stays Inline** — the picker's drill-down already routes this.
5. **Fix the reachability bug** (below).

### The blocker neither agent costed

**Every one of the best ideas, from both sides, needs a structured condition model,
and we don't have one.** `cond` is a single free-text string and the Check IF
builder is static markup. You cannot read back a condition as a port label, detect
overlap, or check coverage against free text. **Modelling the condition as
field/operator/value is the first implementation step**, ahead of any layout work.

### Verified bug in the current build

With 5 branches the drawer lists 6 paths but the canvas exposes only 4 `+` buttons
— branches 4 and 5 are folded behind "+N more" with no reachable `+`. The drawer
says "Select next block · Branch 5"; the canvas offers nowhere to put it. This is
the batched model's weakness in its purest form, live in our code.

### Proposals held back pending a decision

- **"Keep the drawer open while filling paths from Next-step rows"** reverses the
  established rule that the drawer always closes when the picker opens, for one
  node type only.
- **"3 of 5 paths empty" in the card's description slot** — that slot is now the
  user's editable description field.
- **Tinted swimlane backgrounds** — our layout already places each branch's
  children right of its own port, so the canvas is lane-shaped already. Polish, not
  a prerequisite.

### Open questions

1. **Branch count** — mostly 2–3, or routinely 5–8? Biggest single input.
2. **Build the real condition builder now?** It gates items 2 and 3.
3. **The drawer exception** — yes or no?
