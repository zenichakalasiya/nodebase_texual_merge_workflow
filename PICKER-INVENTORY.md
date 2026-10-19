# Multi-select value picker — where it is used (Linear view)

All of this is in the Linear view (`linear/index.html`). It covers every node and field that picks **one or many
values from a list**, which is the picker we redesigned as **Version 2 of the Category popup** (`VPicker`).

**Status key**
- ✅ **Uses the new picker now.** It changes when you switch Version 1 / Version 2 in the top bar.
- ⬜ **Multi-select but still on an old picker.** It is a candidate for converting.

---

## 1. The new picker (VPicker): what Version 2 has

| Part | Behaviour |
|---|---|
| Selected items | Shown **above** the search box, max 2 lines, then "+N more". Clear all needs a confirm. |
| Chips | No border, light fill (#ECF1F9), × always visible. A category chip shows a count badge for its picked subcategories. |
| Search | Matching text is highlighted. Paste a list (comma / semicolon / new line) to add many at once. |
| Add new value | Only on free-text fields: the icon turns into a **+** and there is an "Add 'x'" row. Enter adds it. |
| Tree (Category only) | "None" at top → category → subcategories (indented, no dots). Chevron to expand/collapse. A count shows when collapsed. Categories with a picked subcategory open expanded. |
| Row states | Hover = light grey + faint ✓ · Picked = dark ✓ · Hover on picked = × (Figma `1955:68849`). |
| "+N more" side panel | Joins the popup on its left. It is a grouped tree of the picked values, has search and Clear all, and a » icon collapses it. |
| Keyboard | ↑↓ move · ←/→ collapse/expand · Enter pick/add · Esc clear search · Backspace remove last. |
| Commit | **Done** saves; clicking outside discards. |

Version 1 is the same picker with the selected items **below** the list and outlined chips.

---

## 2. Nodes that use the new picker ✅

The condition value slot ("is / is not / is one of / must contain …") uses it in every node that has conditions:

| Node | Where the picker opens |
|---|---|
| **Condition (Check if)** | Value of each clause |
| **Branching** (each branch path) | Value of each path clause |
| **IF / Else** | Value of the IF clause (and "else if") |
| **Get records** | Each "where" clause (except the locked preset clause, see §4) |
| **Wait** (mode = until an event) | "until" clause value |
| **Loop** (mode = until) | "until" clause value |
| **Add relation** | "where" clauses on the related record |

**Which kind of value gets it**
- **List fields** (type `enum`) with is / is not / is one of / must contain. Picking 2+ values turns "is" into "is one of" automatically.
- **Text fields** (subject, description, requester's email, name, …) with **contains / does not contain / must contain**. The user types values and adds them, so "Add 'x'" is on.
- **Category** (any module) gets the **tree** (Category › Subcategory). Every other field gets a flat list.

Single-choice fields are not touched. They keep the plain one-pick list: **service catalog** (`select`), numbers, dates, relative dates.

---

## 3. Fields per record type that open the new picker ✅

These are the fields the condition picker offers. Which list applies depends on the record the condition is about.

### Incident / Request (default set, `FIELDS`)
| Field | Values |
|---|---|
| priority | Urgent, High, Medium, Low |
| impact / urgency | High, Medium, Low |
| status | New, Assigned, In Progress, On Hold, Pending, Resolved, Closed, Cancelled |
| **category** 🌳 | tree: Hardware, Software, Network, Access, Access Management, Email, Database, Security, Other (+ subcategories) |
| subcategory | Laptop, Desktop, Server, VPN, Wi-Fi, Login / Password, Password Reset, Mailbox, Application, Other |
| source channel | Email, Self-Service Portal, Phone, Chat, Walk-up, API, Monitoring alert |
| assignment group | Service Desk, Tier-2, Tier-3, Network Ops, Apps Team, Field Support, Security, Database |
| assignee | Unassigned, Current user, On-call agent, A specific agent… |
| the requester | a VIP, not a VIP |
| requester's department | IT, Finance, HR, Sales, Operations, Executive |
| SLA status | Within SLA, At risk, Breached, Paused |
| time window | business hours, after hours, weekend, holiday |
| change type | Standard, Normal, Emergency |
| change risk | High, Medium, Low |
| approval status | Pending, Approved, Rejected, Not required |
| known error | Yes, No |
| affected CI / service | Email Service, Payroll App, VPN Gateway, CRM, Database Cluster, Web Portal, Active Directory |
| CI environment | Production, Staging, Development, DR |
| service tier | Tier 1 (critical), Tier 2, Tier 3 |
| a tag | major, vip, recurring, needs-review, after-hours, security |
| **tags** (set, adds "must contain") | major, vip, recurring, needs-review, after-hours, security, escalated, monitoring, compliance |
| **watchers** (set, adds "must contain") | Service Desk, Network Ops, Security, Apps Team, On-call agent, Requester's manager |
| subject, description, requester's email | free text → type-and-add (contains…) |

*Service Request* = the same list plus **service catalog** (single pick, not converted). *Request (combined)* = Incident ∪ Service Request.

### Problem
status · priority · urgency · impact · **category 🌳** · nature of problem · known error · technician group · assignee · department · vendor · location · tags

### Change
status · priority · urgency · impact · **category 🌳** · change type · change risk · change reason · target environment · technician group · assignee · change manager · change implementer · department · vendor · location · tags

### Release
status · priority · urgency · impact · **category 🌳** · release type · release risk · release reason · business service · technician group · assignee · department · vendor · location · tags

### Asset (Hardware / Software / Non-IT)
asset type · status · impact · product · **category 🌳** · managed by group · managed by · used by · location · department · company · vendor · asset condition · business service · tags. Free text (type-and-add): name, asset tag, serial number, manufacturer.

### CMDB (CI)
CI type · status · impact · environment · managed by group · managed by · used by · location · department · business service · vendor · tags. Free text: name, IP address, host name.

### User
role · status · department · location · tags. Free text: name, email.

### Task
status · priority · assignee · technician group. Free text: subject.

### Announcement
status. Free text: subject.

### Deployment
status. Free text: name.

### Asset Movement
movement status · from location · to location

**Shared value lists:**
- Technician group = 17 groups (Service Desk … General Support Group).
- Department = IT, Finance, HR, Sales, Operations, Executive, Legal, Marketing.
- Location = HQ, Branch — North, Branch — South, Remote, Data Center, Warehouse.
- Vendor = Dell, HP, Lenovo, Cisco, Microsoft, Apple, Oracle, SAP, Other.
- Users = sample people list.

---

## 4. Other multi-select pickers NOT converted yet ⬜

| Node | Field | Values | Today's picker |
|---|---|---|---|
| **Get records** (Hardware Asset) | Asset type: the locked first "where" | Grouped: Computers / Servers / Peripherals (15 items) | Old multi list + Select all |
| **Merge** | "Which branches feed the merge" | The branches of the fork. A branch already in another merge is shown locked. | Old multi list |
| **Assign** / Assignee field | People / Round Robin / Smart Balance pool ("Distribute among") | Users, groups | Own picker |
| **Create deployment** | Notify to | People (sample users) | Old multi list, wide |
| **Create / Update record** | Field row with a multi value: **Business services** (Release), **Add Roles** (User, required) | Release services list / 6 roles | `MultiSelect` dropdown |
| **Create / Update record** | Cc emails, Tags (rows) | Free text | `TokensField` (email-style box) |
| **Create announcement** | Requester groups (support portal = Requester Group) | All Employees, Finance, HR, Sales, Executives, Contractors, Managers | `ModeRows` (Specific / Dynamic per row) |
| **Create announcement** | Technician groups (technician portal = Technician Group) | 17 technician groups | `ModeRows` |
| **Ask for approval** (each stage) | Requester group · Technician group · Set approvers to | Requester groups / technician groups / people | `ValueList` ("+ Add") |
| **Send email** / **Approval reminder** | Predefined Cc | Requester's manager, Department head, Technician group, Watchers, CAB members | `ModeRows` |
| **Send email** | To / Cc / Bcc (Specific / Dynamic, technician-group members) | Emails, groups | `RcptField` (Email v1.1 / 1.2 / 2), its own design |
| **Send SMS** | To + Technician group | Mobile numbers, groups | Own field |

---

## 5. Open questions (still unanswered)

1. When a category is picked **and** some of its subcategories are too, should the subcategory pills be hidden (the reference shows only the parent)?
2. Should the **Subcategory** field stay? The Category tree already covers it.
3. Can a category **and** its subcategories both be picked, or only one level?
4. The canvas sentence lists **every** picked value. Should it cut off with "+N"?
5. Commit model: the new picker uses **Done** (outside click discards), but Email uses **Apply**. Should they be the same, and should an outside click save instead?
6. Select all and the "N selected" counter were dropped from the new picker. Is that OK?
7. "None" is only on Category. Should other fields get it too?
8. Which ⬜ pickers in §4 should move to the new picker, and in what order?

## 6. Not tested yet
- Branch-path condition popup end to end.
- Keyboard-only use.
- The side panel flipping to the right near the left screen edge.
