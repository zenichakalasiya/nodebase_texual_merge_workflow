# Handoff — 2026-10-22 11:30

## Read first

In `CLAUDE.md`, under "Linear view" → "Functional edits made inside V8", read these parts:

- **Sidebar popup rules:** how popups save on the canvas vs the sidebar, the open-cell rule, and the Expression card.
- **Get records.**
- **Field gallery** and **Field Lab mode.**

The work is all in `linear/index.html` and `linear/node-skin.css`. Skin sections 36–43 are new this session.

## What we worked on this session

Polished the Linear view's field and popup UI, and made the three claude.ai artifacts match the real builder:

- **Field Gallery**
- **Workflow Field Lab** (Linear vs node-based)
- **Workflow Operator Decisions**

## Completed

- **V2 popup (top bar "Popup" switch):** it now opens on the field, with its Specific | Dynamic tabs covering it. No Apply button: click or Enter saves and closes. In multi-select, Enter adds and the popup stays open.
- **Popup width:** matches the value field (at least 280px). Side-by-side rows stay side by side while a popup is open (skin 36).
- **Open value cell:**
  - It keeps its 32px height and only its outline turns blue. It no longer grows or jumps (skin 39).
  - The attribute cell stays joined to it (skin 41).
- **Canvas popups:**
  - Every value popup on the canvas has Apply at the bottom right. Multi-select is live only in the sidebar.
  - The Wait duration popup's "Set" button became Apply.
- **Expression card:**
  - It's on every first "Which field" popup: new IF/Else, Branching, and a new and/or row.
  - It's sticky at the bottom.
  - It's now a flat, subtle amber card.
- **Reference card:** flat and subtle (lavender).
- **"+N more" side list:** rows are tighter, with a 30px pitch (skin 42).
- **SMS empty-state art:** the chat badge is bigger and has typing dots.
- **Send email › Content:** the toolbar now sits inside the box (skin 43).
- **Get records › Multiple subtext:** always shows "Max 100 records per cycle · longer interval for more". The full sentence shows on hover.
- **Artifacts:**
  - **Field Gallery** (v16): https://claude.ai/artifact/BjmE5zqX4dAHFyzdpYCZ7Y
    - Sidebar and canvas views.
    - Record fields are shown as sidebar "Field 1" rows.
  - **Workflow Field Lab** (v8): https://claude.ai/artifact/6fHddUaeZ5D4ZYhpRtXZc7
    - Real Linear controls in the Linear column; the node-based column is unchanged.
    - Light only.
  - **Workflow Operator Decisions** (v2): https://claude.ai/artifact/T5otBJydazfSoYWkqH2Eev
    - Light only. Its saved decisions are kept.

## In progress

Nothing mid-flight.

## Next steps

1. **V1 / V2 popups:** the user picks one. Then remove the top-bar **Popup** switch and the gallery tabs.
2. **Text field:** the user picks A / B / C. Then remove the **Text field** switch.
3. **Get records caps:** get the real per-schedule caps (every N minutes, hourly, daily…) and fill them into `getCycle()`. The "100" and "every 2 minutes" are placeholders.
4. **Field Lab wording:** offer to rewrite its Linear "how" notes and "Differences" text. Some still describe old behaviour (e.g. Apply on email recipients).
5. **Open question:** should single-choice canvas menus get Apply too? So far they pick on click.

## Decisions made

- **Canvas popups:** value popups commit with Apply at the bottom right. Single-choice menus pick on click.
- **Sidebar popups:** save on Enter or click. Multi-select is live.
- **Artifact field cards:** use the OPTIONAL row style, with a fixed (not clickable) attribute cell. Labelled-only sidebar fields keep their label look.
- **Field Lab:** the Linear column uses the real components. The node-based column is kept as is. Light theme only.

## Gotchas & notes

- **Artifact build:** artifacts are built from scratch scripts in the session scratchpad, not the repo:
  - `build-gallery.js` precompiles the JSX and inlines everything.
  - `build-lab.js` combines the gallery build with the Lab page. It renames the Lab's CSS vars to `--lab-*` and scopes its rules to `#lab-page`.
  - The Field Lab's source page was the earlier artifact version, saved under the session's `tool-results/`.
- **Skin selectors:** many skin rules key on inline style strings (`1px solid var(--border2)` / `var(--accent2)` / `var(--accent)`). A new value control needs to match these, or have a `data-nf` hook added to skins 36 and 39–41.
- **`data-nf="side"`:** inside the gallery, `data-nf="side"` boxes are styled rows, not the sidebar. The Lab's "lift the sidebar" rule targets `aside[data-nf=side]` only.
- **Demo server:** never put the internal demo server address in this public repo.
