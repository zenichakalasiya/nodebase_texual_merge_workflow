# Condition rows: key · operator · value (Linear workflow)

Every **condition row** in the Linear builder reads as one sentence:

> **the {record}'s {key}** &nbsp; **{operator}** &nbsp; **{value}**
> e.g. *the Incident's **priority** **is** **High***

This file lists every **key** (field), the **operators** that key offers, and the **value** it takes, for each record type.
It was generated from the builder's own field catalogs (`linear/index.html`), so it is complete for the prototype.

## Which nodes have condition rows

| Node | Where the row appears | Whose fields (keys) it lists |
|---|---|---|
| **Check if** (inline condition) | after "Check if" | the record the condition is about (the trigger record, or a picked record when 2+ are in scope) |
| **Branching** | each "Check if" / "Or if" path | same as Check if |
| **IF / Else** | the IF path | same as Check if |
| **Get records** | "… **where** {key} {operator} {value}" | the record type being fetched |
| **Wait** (until an event) | "**until** {key} {operator} {value}" | the record picked in "from {source}" |
| **Loop** (repeat until, legacy) | "**repeat until** …" | same as Check if |
| **Add relation** | "… **where** {key} {operator} {value}" | the related record type |

Rows join with **AND / OR**: the chip between rows toggles it, and a different connector starts a new group.
The picker titles read **Which field** → **Comparison** → the value. "Use an expression" / "Write an expression" switch the row to a formula.

## Operators by key type

| Key type | Operators (default first) | Value | Node-based product (same type) |
|---|---|---|---|
| **List** (enum) | is · is not · is one of (+ **must contain** on multi-value keys) | Pick one or more. Picking 2+ turns "is" into **is one of** and "is not" into **is not one of** | In · Not In |
| **Single choice** (select) | is · is not | Pick exactly one | In · Not In |
| **Text** | contains · does not contain · must contain · is · is not · starts with · ends with | Typed text. The 3 *contain* operators take several values | Equals · Not Equals · Start With · End With · Contains · Is Blank · Is Not Blank |
| **Number** | is · is not · is greater than · is less than · is at least · is at most | A number | Equals · Not Equals · Greater than · Less than |
| **Date** | is on · is before · is after · is within the next · is within the last | A date, or a number + unit (hours / days / weeks / months / years) | Less than · Greater than · Before · Between · Exactly Next / Last · Within Next / Last · Between Next / Last |
| **Tags** (multi-value list) | is · is not · is one of · must contain *(must contain on Incident / SR only)* | Pick one or more | Match Any · Match All · Is Empty · Is Not Empty |

Every value can also be **Dynamic** (a field from an earlier step) or an **Expression**, from the value popup's tabs.

## Incident (default)

| Key | Type | Operators | Value |
|---|---|---|---|
| priority | List | is · is not · is one of | Pick one or more: Urgent, High, Medium, Low |
| impact | List | is · is not · is one of | Pick one or more: High, Medium, Low |
| urgency | List | is · is not · is one of | Pick one or more: High, Medium, Low |
| status | List | is · is not · is one of | Pick one or more: New, Assigned, In Progress, On Hold, Pending, Resolved, Closed, Cancelled |
| category | List | is · is not · is one of | Pick one or more: Hardware, Software, Network, Access, Access Management, Email, Database, Security, Other |
| subcategory | List | is · is not · is one of | Pick one or more: Laptop, Desktop, Server, VPN, Wi-Fi, Login / Password, Password Reset, Mailbox, Application, Other |
| source channel | List | is · is not · is one of | Pick one or more: Email, Self-Service Portal, Phone, Chat, Walk-up, API, Monitoring alert |
| subject | Text | contains · does not contain · must contain · is · is not · starts with · ends with | Typed text. With *contains / does not contain / must contain* you can add several values |
| description | Text | contains · does not contain · must contain · is · is not · starts with · ends with | Typed text. With *contains / does not contain / must contain* you can add several values |
| assignment group | List | is · is not · is one of | Pick one or more: Service Desk, Tier-2, Tier-3, Network Ops, Apps Team, Field Support, Security, Database |
| assignee | List | is · is not · is one of | Pick one or more: Unassigned, Current user, On-call agent, A specific agent… |
| the requester | List | is · is not · is one of | Pick one or more: a VIP, not a VIP |
| requester's department | List | is · is not · is one of | Pick one or more: IT, Finance, HR, Sales, Operations, Executive |
| requester's email | Text | contains · does not contain · must contain · is · is not · starts with · ends with | Typed text. With *contains / does not contain / must contain* you can add several values |
| SLA status | List | is · is not · is one of | Pick one or more: Within SLA, At risk, Breached, Paused |
| time window | List | is · is not · is one of | Pick one or more: business hours, after hours, weekend, holiday |
| reopen count | Number | is · is not · is greater than · is less than · is at least · is at most | A number |
| hours open | Number | is · is not · is greater than · is less than · is at least · is at most | A number |
| due date | Date | is on · is before · is after · is within the next · is within the last | A date. With *is within the next / last*: a number + a unit (hours, days, weeks, months, years) |
| change type | List | is · is not · is one of | Pick one or more: Standard, Normal, Emergency |
| change risk | List | is · is not · is one of | Pick one or more: High, Medium, Low |
| approval status | List | is · is not · is one of | Pick one or more: Pending, Approved, Rejected, Not required |
| known error | List | is · is not · is one of | Pick one or more: Yes, No |
| affected CI / service | List | is · is not · is one of | Pick one or more: Email Service, Payroll App, VPN Gateway, CRM, Database Cluster, Web Portal, Active Directory |
| CI environment | List | is · is not · is one of | Pick one or more: Production, Staging, Development, DR |
| service tier | List | is · is not · is one of | Pick one or more: Tier 1 (critical), Tier 2, Tier 3 |
| a tag | List | is · is not · is one of | Pick one or more: major, vip, recurring, needs-review, after-hours, security |
| tags | List (multi-value) | is · is not · is one of · must contain | Pick one or more: major, vip, recurring, needs-review, after-hours, security, escalated, monitoring, compliance |
| watchers | List (multi-value) | is · is not · is one of · must contain | Pick one or more: Service Desk, Network Ops, Security, Apps Team, On-call agent, Requester's manager |

## Service Request

Same keys as **Incident**, **plus**:

| Key | Type | Operators | Value |
|---|---|---|---|
| service catalog | Single choice | is · is not | Pick one: Employee Onboarding, Leave / Time Off Request, Travel Order, New Laptop Request, Software Installation, MS Office License Request, Additional RAM Request, Purchase Request, Reimbursement |

## Request (Incident + Service Request together)

The Incident keys plus **service catalog**. Where a key exists on both, its value lists are merged.

## Problem

| Key | Type | Operators | Value |
|---|---|---|---|
| status | List | is · is not · is one of | Pick one or more: New, Assigned, In Progress, On Hold, Resolved, Closed |
| priority | List | is · is not · is one of | Pick one or more: Urgent, High, Medium, Low |
| urgency | List | is · is not · is one of | Pick one or more: High, Medium, Low |
| impact | List | is · is not · is one of | Pick one or more: High, Medium, Low |
| category | List | is · is not · is one of | Pick one or more: Hardware, Software, Network, Access, Access Management, Email, Database, Security, Other |
| nature of problem | List | is · is not · is one of | Pick one or more: Reactive, Proactive |
| known error | List | is · is not · is one of | Pick one or more: Yes, No |
| due by | Date | is on · is before · is after · is within the next · is within the last | A date. With *is within the next / last*: a number + a unit (hours, days, weeks, months, years) |
| technician group | List | is · is not · is one of | Pick one or more: Service Desk, Hardware Team, Software Team, Network Ops, Field Support, Security, Database, Apps Team, Tier-2, Tier-3, Default Support Group, Finance IT Support Group, HR IT Support Group, Operations IT Support Group, Sales IT Support Group, Internal IT Support Group, General Support Group |
| assignee | List | is · is not · is one of | Pick one or more: Priya Nair, Arjun Mehta, Sara Khan, David Chen, Emily Rodriguez, Rohit Sharma, Anna Kowalski, James Okafor, Mei Lin, Tom Becker |
| department | List | is · is not · is one of | Pick one or more: IT, Finance, HR, Sales, Operations, Executive, Legal, Marketing |
| vendor | List | is · is not · is one of | Pick one or more: Dell, HP, Lenovo, Cisco, Microsoft, Apple, Oracle, SAP, Other |
| location | List | is · is not · is one of | Pick one or more: HQ, Branch — North, Branch — South, Remote, Data Center, Warehouse |
| tags | List | is · is not · is one of | Pick one or more: major, vip, recurring, needs-review, after-hours, security, escalated, compliance |

## Change

| Key | Type | Operators | Value |
|---|---|---|---|
| status | List | is · is not · is one of | Pick one or more: Open, Planning, Awaiting Approval, Approved, In Progress, Completed, Closed, Cancelled, Rejected |
| priority | List | is · is not · is one of | Pick one or more: Urgent, High, Medium, Low |
| urgency | List | is · is not · is one of | Pick one or more: High, Medium, Low |
| impact | List | is · is not · is one of | Pick one or more: High, Medium, Low |
| category | List | is · is not · is one of | Pick one or more: Hardware, Software, Network, Access, Access Management, Email, Database, Security, Other |
| change type | List | is · is not · is one of | Pick one or more: Standard, Normal, Emergency |
| change risk | List | is · is not · is one of | Pick one or more: High, Medium, Low |
| change reason | List | is · is not · is one of | Pick one or more: Business need, Maintenance, Incident fix, Upgrade, Security |
| target environment | List | is · is not · is one of | Pick one or more: Production, Staging, Development, DR |
| start date | Date | is on · is before · is after · is within the next · is within the last | A date. With *is within the next / last*: a number + a unit (hours, days, weeks, months, years) |
| end date | Date | is on · is before · is after · is within the next · is within the last | A date. With *is within the next / last*: a number + a unit (hours, days, weeks, months, years) |
| technician group | List | is · is not · is one of | Pick one or more: Service Desk, Hardware Team, Software Team, Network Ops, Field Support, Security, Database, Apps Team, Tier-2, Tier-3, Default Support Group, Finance IT Support Group, HR IT Support Group, Operations IT Support Group, Sales IT Support Group, Internal IT Support Group, General Support Group |
| assignee | List | is · is not · is one of | Pick one or more: Priya Nair, Arjun Mehta, Sara Khan, David Chen, Emily Rodriguez, Rohit Sharma, Anna Kowalski, James Okafor, Mei Lin, Tom Becker |
| change manager | List | is · is not · is one of | Pick one or more: Priya Nair, Arjun Mehta, Sara Khan, David Chen, Emily Rodriguez, Rohit Sharma, Anna Kowalski, James Okafor, Mei Lin, Tom Becker |
| change implementer | List | is · is not · is one of | Pick one or more: Priya Nair, Arjun Mehta, Sara Khan, David Chen, Emily Rodriguez, Rohit Sharma, Anna Kowalski, James Okafor, Mei Lin, Tom Becker |
| department | List | is · is not · is one of | Pick one or more: IT, Finance, HR, Sales, Operations, Executive, Legal, Marketing |
| vendor | List | is · is not · is one of | Pick one or more: Dell, HP, Lenovo, Cisco, Microsoft, Apple, Oracle, SAP, Other |
| location | List | is · is not · is one of | Pick one or more: HQ, Branch — North, Branch — South, Remote, Data Center, Warehouse |
| tags | List | is · is not · is one of | Pick one or more: major, vip, recurring, needs-review, after-hours, security, escalated, compliance |

## Release

| Key | Type | Operators | Value |
|---|---|---|---|
| status | List | is · is not · is one of | Pick one or more: Open, Planning, Awaiting Approval, Approved, In Progress, Completed, Closed, Cancelled |
| priority | List | is · is not · is one of | Pick one or more: Urgent, High, Medium, Low |
| urgency | List | is · is not · is one of | Pick one or more: High, Medium, Low |
| impact | List | is · is not · is one of | Pick one or more: High, Medium, Low |
| category | List | is · is not · is one of | Pick one or more: Hardware, Software, Network, Access, Access Management, Email, Database, Security, Other |
| release type | List | is · is not · is one of | Pick one or more: Major, Minor, Patch, Emergency |
| release risk | List | is · is not · is one of | Pick one or more: High, Medium, Low |
| release reason | List | is · is not · is one of | Pick one or more: Feature, Bug fix, Upgrade, Compliance |
| business service | List | is · is not · is one of | Pick one or more: Email Service, Payroll App, VPN Gateway, CRM, Database Cluster, Web Portal, Active Directory |
| start date | Date | is on · is before · is after · is within the next · is within the last | A date. With *is within the next / last*: a number + a unit (hours, days, weeks, months, years) |
| end date | Date | is on · is before · is after · is within the next · is within the last | A date. With *is within the next / last*: a number + a unit (hours, days, weeks, months, years) |
| technician group | List | is · is not · is one of | Pick one or more: Service Desk, Hardware Team, Software Team, Network Ops, Field Support, Security, Database, Apps Team, Tier-2, Tier-3, Default Support Group, Finance IT Support Group, HR IT Support Group, Operations IT Support Group, Sales IT Support Group, Internal IT Support Group, General Support Group |
| assignee | List | is · is not · is one of | Pick one or more: Priya Nair, Arjun Mehta, Sara Khan, David Chen, Emily Rodriguez, Rohit Sharma, Anna Kowalski, James Okafor, Mei Lin, Tom Becker |
| department | List | is · is not · is one of | Pick one or more: IT, Finance, HR, Sales, Operations, Executive, Legal, Marketing |
| vendor | List | is · is not · is one of | Pick one or more: Dell, HP, Lenovo, Cisco, Microsoft, Apple, Oracle, SAP, Other |
| location | List | is · is not · is one of | Pick one or more: HQ, Branch — North, Branch — South, Remote, Data Center, Warehouse |
| tags | List | is · is not · is one of | Pick one or more: major, vip, recurring, needs-review, after-hours, security, escalated, compliance |

## Hardware / Software / Non-IT Asset

| Key | Type | Operators | Value |
|---|---|---|---|
| name | Text | contains · does not contain · must contain · is · is not · starts with · ends with | Typed text. With *contains / does not contain / must contain* you can add several values |
| asset tag | Text | contains · does not contain · must contain · is · is not · starts with · ends with | Typed text. With *contains / does not contain / must contain* you can add several values |
| asset type | List | is · is not · is one of | Pick one or more: Laptop, Desktop, Server, Monitor, Printer, Router, Switch, Mobile, Other |
| status | List | is · is not · is one of | Pick one or more: Available, In Use, In Stock, In Repair, Retired, Disposed, Reserved, Expired, Missing |
| impact | List | is · is not · is one of | Pick one or more: High, Medium, Low |
| product | List | is · is not · is one of | Pick one or more: Laptop, Desktop, Server, Monitor, Printer, Router, Switch, License, Software |
| category | List | is · is not · is one of | Pick one or more: Hardware, Software, Network, Access, Access Management, Email, Database, Security, Other |
| managed by group | List | is · is not · is one of | Pick one or more: Service Desk, Hardware Team, Software Team, Network Ops, Field Support, Security, Database, Apps Team, Tier-2, Tier-3, Default Support Group, Finance IT Support Group, HR IT Support Group, Operations IT Support Group, Sales IT Support Group, Internal IT Support Group, General Support Group |
| managed by | List | is · is not · is one of | Pick one or more: Priya Nair, Arjun Mehta, Sara Khan, David Chen, Emily Rodriguez, Rohit Sharma, Anna Kowalski, James Okafor, Mei Lin, Tom Becker |
| used by | List | is · is not · is one of | Pick one or more: Priya Nair, Arjun Mehta, Sara Khan, David Chen, Emily Rodriguez, Rohit Sharma, Anna Kowalski, James Okafor, Mei Lin, Tom Becker |
| location | List | is · is not · is one of | Pick one or more: HQ, Branch — North, Branch — South, Remote, Data Center, Warehouse |
| department | List | is · is not · is one of | Pick one or more: IT, Finance, HR, Sales, Operations, Executive, Legal, Marketing |
| company | List | is · is not · is one of | Pick one or more: Acme Corp, Acme Subsidiary, Managed Client A, Managed Client B |
| vendor | List | is · is not · is one of | Pick one or more: Dell, HP, Lenovo, Cisco, Microsoft, Apple, Oracle, SAP, Other |
| asset condition | List | is · is not · is one of | Pick one or more: New, Good, Fair, Poor, Damaged |
| business service | List | is · is not · is one of | Pick one or more: Email Service, Payroll App, VPN Gateway, CRM, Database Cluster, Web Portal, Active Directory |
| cost | Number | is · is not · is greater than · is less than · is at least · is at most | A number |
| serial number | Text | contains · does not contain · must contain · is · is not · starts with · ends with | Typed text. With *contains / does not contain / must contain* you can add several values |
| manufacturer | Text | contains · does not contain · must contain · is · is not · starts with · ends with | Typed text. With *contains / does not contain / must contain* you can add several values |
| acquisition date | Date | is on · is before · is after · is within the next · is within the last | A date. With *is within the next / last*: a number + a unit (hours, days, weeks, months, years) |
| warranty expiry date | Date | is on · is before · is after · is within the next · is within the last | A date. With *is within the next / last*: a number + a unit (hours, days, weeks, months, years) |
| expiry date | Date | is on · is before · is after · is within the next · is within the last | A date. With *is within the next / last*: a number + a unit (hours, days, weeks, months, years) |
| tags | List | is · is not · is one of | Pick one or more: major, vip, recurring, needs-review, after-hours, security, escalated, compliance |

## CMDB (CI)

| Key | Type | Operators | Value |
|---|---|---|---|
| name | Text | contains · does not contain · must contain · is · is not · starts with · ends with | Typed text. With *contains / does not contain / must contain* you can add several values |
| CI type | List | is · is not · is one of | Pick one or more: Server, Application, Database, Network Device, Service, Cluster |
| status | List | is · is not · is one of | Pick one or more: Operational, Non-Operational, In Maintenance, Retired |
| impact | List | is · is not · is one of | Pick one or more: Low, On Users, On Department, On Business |
| environment | List | is · is not · is one of | Pick one or more: Production, Staging, Development, DR |
| managed by group | List | is · is not · is one of | Pick one or more: Service Desk, Hardware Team, Software Team, Network Ops, Field Support, Security, Database, Apps Team, Tier-2, Tier-3, Default Support Group, Finance IT Support Group, HR IT Support Group, Operations IT Support Group, Sales IT Support Group, Internal IT Support Group, General Support Group |
| managed by | List | is · is not · is one of | Pick one or more: Priya Nair, Arjun Mehta, Sara Khan, David Chen, Emily Rodriguez, Rohit Sharma, Anna Kowalski, James Okafor, Mei Lin, Tom Becker |
| used by | List | is · is not · is one of | Pick one or more: Priya Nair, Arjun Mehta, Sara Khan, David Chen, Emily Rodriguez, Rohit Sharma, Anna Kowalski, James Okafor, Mei Lin, Tom Becker |
| location | List | is · is not · is one of | Pick one or more: HQ, Branch — North, Branch — South, Remote, Data Center, Warehouse |
| department | List | is · is not · is one of | Pick one or more: IT, Finance, HR, Sales, Operations, Executive, Legal, Marketing |
| business service | List | is · is not · is one of | Pick one or more: Email Service, Payroll App, VPN Gateway, CRM, Database Cluster, Web Portal, Active Directory |
| vendor | List | is · is not · is one of | Pick one or more: Dell, HP, Lenovo, Cisco, Microsoft, Apple, Oracle, SAP, Other |
| IP address | Text | contains · does not contain · must contain · is · is not · starts with · ends with | Typed text. With *contains / does not contain / must contain* you can add several values |
| host name | Text | contains · does not contain · must contain · is · is not · starts with · ends with | Typed text. With *contains / does not contain / must contain* you can add several values |
| warranty expiry date | Date | is on · is before · is after · is within the next · is within the last | A date. With *is within the next / last*: a number + a unit (hours, days, weeks, months, years) |
| tags | List | is · is not · is one of | Pick one or more: major, vip, recurring, needs-review, after-hours, security, escalated, compliance |

## User

| Key | Type | Operators | Value |
|---|---|---|---|
| name | Text | contains · does not contain · must contain · is · is not · starts with · ends with | Typed text. With *contains / does not contain / must contain* you can add several values |
| email | Text | contains · does not contain · must contain · is · is not · starts with · ends with | Typed text. With *contains / does not contain / must contain* you can add several values |
| role | List | is · is not · is one of | Pick one or more: Requester, Technician, Administrator |
| status | List | is · is not · is one of | Pick one or more: Active, Blocked |
| department | List | is · is not · is one of | Pick one or more: IT, Finance, HR, Sales, Operations, Executive, Legal, Marketing |
| location | List | is · is not · is one of | Pick one or more: HQ, Branch — North, Branch — South, Remote, Data Center, Warehouse |
| tags | List | is · is not · is one of | Pick one or more: major, vip, recurring, needs-review, after-hours, security, escalated, compliance |

## Task

| Key | Type | Operators | Value |
|---|---|---|---|
| subject | Text | contains · does not contain · must contain · is · is not · starts with · ends with | Typed text. With *contains / does not contain / must contain* you can add several values |
| status | List | is · is not · is one of | Pick one or more: Open, In Progress, Completed, Cancelled |
| priority | List | is · is not · is one of | Pick one or more: Urgent, High, Medium, Low |
| assignee | List | is · is not · is one of | Pick one or more: Priya Nair, Arjun Mehta, Sara Khan, David Chen, Emily Rodriguez, Rohit Sharma, Anna Kowalski, James Okafor, Mei Lin, Tom Becker |
| technician group | List | is · is not · is one of | Pick one or more: Service Desk, Hardware Team, Software Team, Network Ops, Field Support, Security, Database, Apps Team, Tier-2, Tier-3, Default Support Group, Finance IT Support Group, HR IT Support Group, Operations IT Support Group, Sales IT Support Group, Internal IT Support Group, General Support Group |
| due by | Date | is on · is before · is after · is within the next · is within the last | A date. With *is within the next / last*: a number + a unit (hours, days, weeks, months, years) |

## Announcement

| Key | Type | Operators | Value |
|---|---|---|---|
| subject | Text | contains · does not contain · must contain · is · is not · starts with · ends with | Typed text. With *contains / does not contain / must contain* you can add several values |
| status | List | is · is not · is one of | Pick one or more: Scheduled, Active, Expired |
| start date | Date | is on · is before · is after · is within the next · is within the last | A date. With *is within the next / last*: a number + a unit (hours, days, weeks, months, years) |
| end date | Date | is on · is before · is after · is within the next · is within the last | A date. With *is within the next / last*: a number + a unit (hours, days, weeks, months, years) |

## Deployment

| Key | Type | Operators | Value |
|---|---|---|---|
| name | Text | contains · does not contain · must contain · is · is not · starts with · ends with | Typed text. With *contains / does not contain / must contain* you can add several values |
| status | List | is · is not · is one of | Pick one or more: Pending, In Progress, Succeeded, Failed |

## Asset Movement

| Key | Type | Operators | Value |
|---|---|---|---|
| movement status | List | is · is not · is one of | Pick one or more: Requested, In Transit, Received, Cancelled |
| from location | List | is · is not · is one of | Pick one or more: HQ, Branch — North, Branch — South, Remote, Data Center, Warehouse |
| to location | List | is · is not · is one of | Pick one or more: HQ, Branch — North, Branch — South, Remote, Data Center, Warehouse |
| movement date | Date | is on · is before · is after · is within the next · is within the last | A date. With *is within the next / last*: a number + a unit (hours, days, weeks, months, years) |

## Notes

- **Shared value lists:**
  - **people** (assignee, managed by, …) = the sample people list
  - **technician group** = 17 sample groups
  - **department / location / vendor / company** = the shared lists shown above
- **Category** opens the **Category › Subcategory tree** picker (see PICKER-INVENTORY.md). Every other List key opens a flat multi-select.
- **Gaps against the product:**
  - there's no *is empty / is not empty*, *is between*, *exactly next / last* or *Match All*
  - the "must contain" tags operator exists only on Incident / Service Request
  - details in OPERATORS.md §H
