# Handoff — 2026-11-20 14:14

## Read first

In `CLAUDE.md`, read under "Linear view":
- **"Record-update triggers"**: activity now covers every module.
- **"Periodic triggers read RUNS for…"**: new this session.
- **"Help card"**: placement rules for the help card and popups.

All builder work is in `linear/index.html`.

## What we worked on this session

- Triggers for all modules, researched on the internal demo server (address in the user's memory, not in this repo).
- A set of claude.ai artifacts used as research and review pages for the manager.
- The finalised periodic sentence, built into the Linear view.

## Completed

- **Activity trigger for all modules:** "When a [record] gets [activity]", 43 activities, each listed only for the records that have it. "One of its tasks deleted" replaced "a task removed". Searching a word that only one module has fills that module in.
- **Six Linear-view fixes:**
  - "an Incident" instead of "a Incident".
  - The help card pushes the rows below it down instead of covering them.
  - Popups open below or beside their blank, never over the steps above or the top bar.
  - New Merge / Loop icons, and new trigger-menu icons for field changes, activity and archived.
  - Send email's empty To / Subject read "not set".
  - The detach icon has a gap from the marker.
- **Periodic trigger:** "RUNS for [records] once on… / every day at… / every week on… / every month on day…". The records are asked first. Hovering Once, Every time period or a cadence previews the sentence. Day of the month is an even 1–31 grid plus "last day".
- **Artifacts (claude.ai):**
  - Periodic trigger sentences (Nq5n3xFomZRB6wzAJnqhXT). "Runs for" is final; 10 formats are in the Rejected tab. It has:
    - the empty state, the trigger popup and hover previews;
    - add / change / clear trigger;
    - weekends / weekdays and "month (all)";
    - the 29th–31st notes;
    - field labels in every popup;
    - "starting from" before the start date.
  - Trigger attributes by module, activity variations, smart trigger search, and node fields vs. the Linear sentences.

## In progress

Nothing mid-flight. The question below is waiting on the user.

## Next steps

- **Waiting on the user:** should "When a record's field changes" become "changed" or "is changed"? Asked, not answered yet. If yes, change the menu row, the canvas template (`triggerView` "changed") and the artifact.
- **Bring the rest of the periodic schedule into the builder:**
  - months multi-select;
  - interval;
  - cron (in a card under the sentence);
  - start date ("starting from");
  - several weekdays, with the weekends / weekdays labels;
  - the 29th–31st note per month.
- **Decide** whether "for [records]" should drive the periodic Get step. Today it's display-only.
- **Node-fields fixes** suggested from the artifact, waiting on the user:
  - Merge business hours;
  - Wait model and max wait;
  - required rows for Create Problem / Change / Release / Task;
  - Update action fields.
- **Still open:**
  - the loader choice;
  - Trigger 1 vs Trigger 2;
  - where Approval / Signature / escalation go (waiting on the manager).

## Decisions made

- **Periodic format:** the manager chose "Runs for". "Schedule · For" was rejected.
- **Interval puts the time after the start date** ("starting from [date] at [time]"). The real product's Interval has one Start At date-time that sets the first run. Daily, Weekly and Monthly have a separate time of day.
- **`prec` is its own key** for the periodic records, so it doesn't change which records the steps can use (`recordsInScope`).

## Gotchas & notes

- The Popover's new `chips` + `grid` item type: any trigger slot whose `options` is a string sentinel (`__date`, `__time`, `__dom`) needs a branch in BOTH `pickTriggerSlot` and `advanceTrigger`. Missing it crashes with `next.options.map`.
- The local server gets killed for low memory. Restart it with `! node server.js`.
