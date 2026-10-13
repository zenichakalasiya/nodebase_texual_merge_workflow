# Handoff — 2026-10-13 18:40

## Read first
In `CLAUDE.md`, the new **"Linear view = Pranjal's V8 textual builder,
embedded and re-skinned"** section (just above "Deployment"), plus the three
`linear/…` rows in the Structure table. Everything this session touched is
described there.

## What we worked on this session
Made the **Linear** tab real: it now shows Pranjal's V8 textual builder inside
the app, restyled to look like the Node view. Then worked through the "Node
Panel Differences" list (https://claude.ai/artifact/FD7oGhj6KuAgJ8VwXRQTvs),
fixing sidebars step by step against Figma and the real product.

## Completed
- Linear view embedded (`linear/index.html` + `linear/vendor/`), switched from
  the top bar, with Publish / Save wired through to it.
- `linear/node-skin.css`: Node colours, canvas, floating sidebar card,
  segmented controls, switches, tabs, joined field cells, tooltips, picker
  popup, email/SMS composer as a labelled form, integration mapping rows as
  key | value pairs.
- Sidebars resizable in both views (400–650px, opens at 400).
- Linear's bottom toolbar replaced by a copy of the Node one.
- Send SMS: To line, toolbar, Technician group picker.
- Emails field ported from the survey app (To/Cc/Bcc, Cc emails, Tags).
- Request Signature step added.
- Archive: source record always clickable.
- Ask for approval: decision dropdown, "Direct | Select" rows, stage card back
  to V8's outlined style.
- Field rows: mandatory cell colours, trash icon for delete, no hover
  brightening.
- "Add Field" and "Add Stage" buttons in the new outlined style (Add Stage
  has no chevron); both hold a 30px height.
- Node view: condition-group blocks restyled to the Figma stage block.

## In progress
- **WhatsApp step** — must match the real product (App Type locked to
  "WhatsApp", App Action Type dropdown, then dependent fields) and lose V8's
  extra config. Not started; needs a look at the real product first.
- **Add Relation** — list what is missing versus the real product. So far:
  no sidebar, only 4 modules, no condition groups. Not confirmed on the real
  product yet.

## Next steps
- Inspect WhatsApp, Add Relation and the Request Signature template list on
  the real product (internal demo server; user signs in), then build.
- Get answers to the open questions below.
- Test the Linear screens not yet checked: WhatsApp / Teams / Google Chat
  forms, Assign / Close / Link, run approval workflow, conditions / wait /
  get / loop / merge, Expression Builder, Shortcuts panel, walkthrough. Re-test
  the SMS sidebar (not re-checked after the Emails port).

## Decisions made
- Embed V8 as-is rather than rebuild it; the two views keep independent
  workflows.
- Linear keeps V8's own sidebar concept; only the width behaviour is shared.
- Accent is Node blue everywhere. Font stays Inter in Linear, Poppins in Node
  (my reading of "keep inter in both" — not confirmed).
- All Linear styling goes in `linear/node-skin.css` via `data-nf` hooks.
- Get step: no sidebar built, because V8's sentence already covers sorting.

## Open questions for the user
- Sidebar as floating card (now) or flush panel (Figma)?
- Buttons blue (Figma) or black (real product)?
- Use the `#CBD5DF` border on optional rows too?
- Asterisk on "Field 1"? (real product has none)
- Yes/No selected colour — keep V8's green?
- Bring the "Import values" CSV panel into the email field?
- Build a real Ask-for-approval node in the Node view?
- Is a Get sidebar still wanted?
- Other add buttons (Add mapping, Add placeholder configuration) in the new
  button style?
- Welcome popup in Linear view; Undo/Redo not fading when empty.
- Integration key | value layout and the email composer restyle were my
  interpretation — both can be undone.

## Gotchas & notes
- `linear/node-skin.css` was built in numbered passes; later rules override
  earlier ones. Search the whole file before adding a rule.
- `workflow-canvas.html` and `workflow-nodes.css` are CRLF; `linear/index.html`
  is LF. Shell heredocs mangle backslashes — write patch scripts to a file.
- Sample data only: `SIGNATURE_TEMPLATES`, `groupMembers()`.
- Never type the real product's password for the user.
- Pre-existing, not fixed: redo right after undo doesn't restore a newly
  created node in the Node view.
- Optional, from last session: cap the Cc Emails editing cell at ~3 rows.
