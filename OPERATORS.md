# Workflow operators: Linear (textual) vs Node-based

This file compares the operators the two builders use, so that workflow sentences read clearly.

- **Linear builder:** taken from `linear/index.html`; line numbers point into that file.
- **Node-based builder (the real ServiceOps product):** §G, still to be filled in from the demo portal.

---

## A. Triggers (Linear)

The picker offers three record events and two time-based options:

| Group | Label | Line |
|---|---|---|
| Record events | When a record is **created** / **updated** / **archived** | 659–661 |
| Time based | **Once** · **Every time period** ▸ Hourly / Daily / Weekly / Monthly | 663–675 |

Each trigger reads as a sentence. Words in `{}` are slots the user fills in.

| Trigger | Sentence | Line |
|---|---|---|
| Created | a {module} **is created** | 829 |
| Archived | a {module} **is archived** | 830 |
| Updated, dropdown field | a {module}'s {field} **is updated from** {from} **to** {to}. "from" can be "any"; "to" has no "any" | 834–838 |
| Updated, any other field | a {module}'s {field} **is updated** | 840 |
| Once | **Once on** {date} **at** {time} | 845 |
| Hourly | **Every hour** | 846 |
| Daily | **Every day at** {time} | 847 |
| Weekly | **Every week on** {weekday} **at** {time} | 848 |
| Monthly | **Every month on day** {1–28 / last day} **at** {time} | 849 |

- **Several triggers:** the first is badged "**When**" and each extra one "**Or**".

## B. Condition operators by field type (Linear)

Operators come from `TYPE_OPS` (lines 908–914):

| Field type | Operators | Default |
|---|---|---|
| List (enum) | is · is not · is one of | is |
| Single choice (select, e.g. service catalog) | is · is not | is |
| Text | contains · does not contain · must contain · is · is not · starts with · ends with | contains |
| Number | is · is not · is greater than · is less than · is at least · is at most | is |
| Date | is on · is before · is after · is within the next · is within the last | is on |

Rules that change these lists:

- **Multi-value fields** (tags, watchers) also get **must contain** (`opsFor`, line 918).
- **"is within the next / last"** takes a number plus a unit: hours · days · weeks · months · years.
- **Picking 2 or more values** rewords the operator by itself: "is" becomes **is one of**, and "is not" becomes **is not one of**. Going back to one value reverses it.
- **Contains-type text operators** take several typed values (any of).

Conditions join with **AND / OR**:

- **Joining clauses:** the chip between two clauses toggles between AND and OR. A clause with a different connector starts a new group.
- **"+ new condition":**
  - On Check if and branch gates it offers **And** (same group), **Or** (new group), **Or if** (a new path) and **Or else** (when nothing above matches).
  - On IF/Else, Get, Wait and Loop it offers **And** / **Or** only.

## C. Nodes and their sentence words (Linear)

These nodes share the operator list in §B: Check if, Branch gates, IF lanes, Get "where", Wait until, Loop until and Add relation "where".

| Node | Badge | Sentence | Uses §B operators |
|---|---|---|---|
| Action | **Then**, then **And** for each later action | see §E | – |
| Check if | **Check if** | {field} {op} {value} (+ "{the X}'s" when 2+ records are in scope) | yes |
| Branching | **Check if** / **Or if** / **Otherwise** | Otherwise lane: "nothing above matched" | yes |
| IF / Else | **If** / **Else** | Else lane: "when the IF condition isn't met" | IF lane only |
| Get | **Get** | {qty} {module} **sorted by** {field} {ascending (A → Z) / descending (Z → A)} **where** … | yes |
| Wait, duration | **Wait** | **for** {N} {minutes/hours/days} **as per** {calendar / business hours} | no |
| Wait, date | **Wait** | **till** {date} & {time} | no |
| Wait, event | **Wait** | **until** [from {source}] {field} {op} {value} | yes |
| Loop | **Loop** | **for each item in** {source} (legacy: "repeat until …", "repeat N times") | legacy only |
| Add relation | – | add a relation **from** {record} **to** {module} **where** … | yes |
| Merge | **Merge N** | **Wait until** {all branches finish / any branch finishes} (all = AND, any = OR). Outcomes: Success / Timeout | no |
| Split path | **Split path** | "will run in parallel with the other paths" | no |

## D. Expression operators and functions (Linear)

- **Operators:**
  - Comparison: `==` Equal To · `!=` Not Equal To · `>` · `<` · `>=` · `<=`
  - Logical: `&&` AND · `||` OR · `!` NOT
  - Arithmetic: `+ - * / %`
- **Functions:**
  - **String (19):** contains, startsWith, endsWith, equals, substring, replace, regexMatch, toLowerCase, trim, …
  - **Date (37):** addDays, diffInDays, now, today, weekday, …
  - **Math (9):** abs, ceil, floor, round, min, max, …
- **References:** written as `#{Record > field}`.
- **Output types:** Any · String · Number · Boolean · Date.

## E. Action sentence words (Linear)

| Action | Sentence |
|---|---|
| Create | **create a new** {record type} |
| Update / Close / Archive | **update** / **close** / **archive** {record} |
| Assign | **assign** {record} **to** {user / group} |
| Auto assignment | **set auto assignment on** {record} **using** {Round Robin / Smart Balance} **among** {…} |
| Priority matrix | **set priority of** {record} **as per** Priority Matrix |
| Send | **send** {Email / SMS / …} **about** {record} (**to** {recipient} for other channels) |
| Add task, approval, plugin | **add a task to** · **ask for Approval on** · **request Signature on** · **run a Plugin on** {record} |
| HTTP | **make an HTTP request / webhook for** {record} |
| Integration | **for** {record}, **in** {app} **execute** {integration} |
| Field rows | card shows **{Field} → {value}**. No "set X to Y" wording on the canvas; the drawer summary reads "set {Field} to {value}" |
| Value types | **Specific \| Dynamic** tabs, plus **Expression** (not available on fixed-choice fields) |

## F. Gaps and oddities found (Linear)

1. **"is not one of" can't be picked directly.** It only appears through the automatic rewording.
2. **"must contain" duplicates "contains" on text fields.** Both open the same input.
3. **Tags only get "must contain" on Incident / Service Request.** Problem, Change and Asset tags don't have it.
4. **The Hardware Asset Get preset reads "is"** even though it is a multi-select. It should read "is one of".
5. **Common operators are missing:**
   - is empty / is not empty
   - has changed
   - between
   - is today / in the past
6. **Unit lists don't match:** relative dates use hours–years, but Wait uses minutes–days.
7. **Wording drift:**
   - Wait uses both "till" and "until".
   - The menu says "Or else" but the badge says "Otherwise".
   - "And" means three different things: the action badge, the clause connector and the Merge glyph.
   - Conditions use words ("is at least") while expressions use symbols (`>=`).
8. **Trigger "from … to":** only dropdown fields get it, and "to" has no "any".
9. **Defined but never used:** an attached-condition widget, an "any/all" match model, and Wait's "up to N" limit. The summary can still print "(up to N)".

---

## G. Node-based builder: the real ServiceOps product

These come from the internal demo portal, in an unsaved draft workflow (Request module), on 2026-10-19.

- **Seen in the UI:** operator lists I opened in the builder by hand.
- **Taken from the app's code:** operator sets from its operator-definition file, which the UI lists are drawn from.

### G1. Triggers

**Event** (pick a module, then one or more **Select Attribute** rows; any of them firing starts the workflow):

- **Field changes:** "{Field} is changed **From** {Any / value} **To** {Any / value}". Examples: Category, Subject, Priority, Status, Assignee, Technician Group, Spam, custom fields.
- **Record events:**
  - Request / Incident / Service Request **is created**, **is archived**
  - Converted To Incident / Service Request
  - Changed To Another Service
  - Marked as Primary / Secondary Merged Request
- **Activity:**
  - Tags **updated**
  - Solution / Diagnosis / Note / Collaboration / Task **is added**
  - Task is deleted
  - Summary is Generated
- **Replies:** When reply is sent by **Technician** / **Requester** / **CC User**.

**Periodic** has these settings:

- **Schedule Type:** One-time or Recurring.
- **Frequency:** Daily / Weekly / Monthly / Interval. Interval is a number in minutes or hours.
- **Start At:** a time.

### G2. Condition operators by field type

Every node with conditions uses **Condition | Expression** tabs, then Condition Group 1 → Condition 1, "+ Add Condition", and "+ Add Condition Group". Groups join with an **And ⇄ Or** toggle.

| Field type (example) | Operators shown in the UI |
|---|---|
| Dropdown / lookup (Priority, Technician Group) | **In · Not In** |
| People (Assignee) | **In · Not In** |
| Text (Subject) | **Equals · Not Equals · Start With · End With · Contains · Is Not Blank · Is Blank** |
| Rich text (Description) | **Contains · Is Blank · Is Not Blank** |
| Number (Reopen Count) | **Equals · Not Equals · Greater than · Less than** |
| Date / time (Created Time) | **Less than · Greater than · Before · Between · Exactly Next · Exactly Last · Within Next · Within Last · Between Next · Between Last** |
| Tags | **Match Any · Match All · Is Empty · Is Not Empty** |
| Attachment | **Is Empty** (default; the full list didn't open) |

Operator sets defined in the app's code (`authStore`). Some of these are used outside workflows too:

| Set | Operators |
|---|---|
| list | in, not_in (also listWithEqual = + equal) |
| text | equal (case-insensitive), not equal, start_with, end_with, contains, is_blank, is_not_blank |
| contains | contains, is_blank, is_not_blank |
| number | equal, not_equal, greater_than, less_than, between |
| date | equal, greater_than, less_than, between, before, after, exactly_next, exactly_last, within_next, within_last, between_next, between_last, is_blank, is_not_blank |
| tag | any_member_or_all_members_exist (Match Any), all_members_exist (Match All), no_members_exist, not_any_members_exist |
| boolean | equal, not_equal |
| others | is_empty / is_not_empty, is_null / is_not_null, same_as / not_same_as, stringMatch (contains / start / end) |

> The workflow UI shows a subset. For example, Number hides "between", and Date hides "equal", "after" and blank checks.

### G3. Nodes and their words

| Node | What it offers |
|---|---|
| **If Else** | "If" condition, then the **Is True** / **Is False** outputs. Settings: Select Source Node (which earlier record) and Condition \| Expression |
| **Branch** | "Route to one of many paths based on a field value". Named paths **Branch 1, 2…** each with conditions, **+ Add Branch**, and **Default Branch** ("Executed when no branch conditions are met") |
| **Merge** | "Waits for **every** incoming node to finish, then continues as a single path". There's **no "any branch" option** |
| **Loop** | "Repeat actions for each item in a list or result set". It iterates over records returned by a Get step |
| **Wait For** | Wait Type: **Calendar Hours · Business Hours** + Duration in **Minutes · Hours · Days** |
| **Wait Until** | Wait Type: **Wait for Time** (date/time) · **Wait for Condition** (condition groups + **Max Wait Time** {n} Hours → output **Success**) |
| **Get Requests** (and other Get nodes) | **Sort By** Id / Name / Subject / Created Time / Last Updated Date · **Order** Ascending / Descending · **Fetch Limit** (number) · condition groups |
| **Request actions** | Create Incident · Create Service Request · Update / Archive Request · Get Request(s) · Get Service Request(s) · Add Tasks · Set Priority as per Priority Matrix · Set Auto Assignment · Set Suggested Field by Smart Suggestion · Add Relation · Execute App Integration · Request Signature · Send an Email / SMS to {Technician, Technician group, Requester, Technician's Manager, Requester's Manager, Department Head} |

---

## H. Side-by-side: Linear vs Node-based

| Topic | Linear (prototype) | Node-based (product) | Suggestion for Linear |
|---|---|---|---|
| Field-change trigger | "is updated from {from} to {to}". "to" has no "any" | "is changed From Any To Any". Both sides have "Any" | Add "any" to **to**. Consider the product's word "changed" |
| Other trigger events | created / updated / archived | Plus converted, merged, reply sent, note / solution / task added | Add the activity events if they are in scope |
| Periodic | Once · hourly / daily / weekly / monthly | One-time · Daily / Weekly / Monthly / **Interval (n minutes / hours)** | Add **Interval**. Linear has an hourly option the product lacks |
| Dropdown fields | is · is not · is one of (auto "is not one of") | In · Not In | Keep Linear's wording; it reads better in a sentence (is one of = In) |
| Text | contains · does not contain · must contain · is · is not · starts with · ends with | Equals · Not Equals · Start With · End With · Contains · **Is Blank · Is Not Blank** | Add **is empty / is not empty**. "does not contain" and "must contain" have no product equivalent |
| Rich text | same as text | Contains · Is Blank · Is Not Blank only | Restrict rich text (description) to contains + empty checks |
| Number | is · is not · greater than · less than · **at least · at most** | Equals · Not Equals · Greater than · Less than | Linear has 2 extra; check the backend supports them |
| Date | is on · before · after · within next / last (+ unit) | Less / Greater than · Before · **Between** · **Exactly Next / Last** · Within Next / Last · **Between Next / Last** | Add **is between**, **exactly next / last** and **between next / last** |
| Tags / multi-value | is one of · must contain (Incident / SR only) | **Match Any · Match All · Is Empty · Is Not Empty** | Use "has any of / has all of / is empty / is not empty" for tags on every module |
| People | is · is not · is one of | In · Not In | Same as dropdown; fine |
| Empty checks | none | Is Blank / Is Not Blank, Is Empty / Is Not Empty | **Biggest gap.** Add "is empty / is not empty" |
| Condition grouping | and / or chip per clause + groups | Condition groups with an And ⇄ Or toggle | Equivalent |
| Expression | Expression builder | Expression tab on every condition | Equivalent |
| If / Else outputs | If / Else | Is True / Is False | Labels differ; pick one |
| Branch fallback | **Otherwise**, "nothing above matched" (menu says "Or else") | **Default Branch**, "Executed when no branch conditions are met" | Align: "Otherwise" reads better in a sentence. Fix the menu's "Or else" |
| Merge | all branches finish / **any branch finishes** + Success / Timeout | **every** incoming node finishes (no any, no timeout seen) | Linear goes beyond the product; confirm the "any" and "timeout" options are wanted |
| Wait, duration | for N minutes / hours / days as per calendar / business hours | Calendar Hours · Business Hours + Minutes / Hours / Days | Same |
| Wait, condition | until {condition} | Wait for Condition + **Max Wait Time** → Success | Show the existing (unused) "**up to** N hours" in Linear |
| Get | qty · sorted by · asc / desc · where | Sort By (Id, Name, Subject, Created Time, Last Updated Date) · Order · Fetch Limit · conditions | Same fields. The product calls it "Fetch Limit" |
| Loop | for each item in {source} | for each item in a list / result set | Same |

**Not checked in the product:**

- Boolean, Cc Emails, Requester and "Since …" duration fields. Their operator lists didn't open reliably, and the code sets above are the likely answer.
- The Expression tab's operator list.
- Modules other than Request.
