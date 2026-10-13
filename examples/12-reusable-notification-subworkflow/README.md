# 12 · Reusable Notification Sub-workflow

> Build logic **once** and call it from any workflow, like a function. Here: one standard way to send notifications.

| Difficulty | Time | Credentials | Nodes used |
|---|---|---|---|
| ⭐⭐ Intermediate | 15 min | None (optional chat webhook URL) | Execute Workflow Trigger, Execute Workflow, Edit Fields, Code |

This example has **two** workflow files:

| File | Role |
|---|---|
| [`notification-subworkflow.json`](notification-subworkflow.json) | **12a · Send Notification**: the reusable sub-workflow. It takes `level`, `title`, `message` and `link`, formats one consistent message and delivers it. |
| [`order-events-workflow.json`](order-events-workflow.json) | **12b · Order Events**: a "main" workflow that calls 12a once per event. |

```
12b · Order Events
Manual Trigger ─▶ Sample Events ─▶ Describe Event ─▶ Notify via Sub-workflow ─ ─ ─ ┐  calls (once per item)
                  (3 items)       (level, title,                                   │
                                   message, link)                                  ▼
12a · Send Notification
When Called by Another Workflow ─▶ Format Message ─▶ Deliver (disabled) ─▶ Return Result ──▶ back to 12b
```

## What you'll learn

- Splitting big automations into **small, reusable workflows** (like functions in code)
- Declaring **typed inputs** on the *Execute Workflow Trigger*, so callers see a form with exactly those fields
- Passing data in with **Execute Workflow** (*Run once for each item*) and getting the sub-workflow's last output back
- Why sub-workflows must be **published** in n8n 2.x

## Setup

1. Import **12a** ([`notification-subworkflow.json`](notification-subworkflow.json)) first, then **12b** ([`order-events-workflow.json`](order-events-workflow.json)).
2. In **12b**, open **Notify via Sub-workflow** → **Workflow** → choose **12a · Send Notification (Sub-workflow)**. The four input fields appear, already mapped.
3. **Publish 12a** (the *Publish* button in its editor). In n8n 2.x, production runs of other workflows can only call **published** sub-workflows. Manual test runs also work with the draft.
4. *(Optional)* In 12a, paste a Slack/Discord webhook URL into **Deliver** and enable it. Every workflow that calls 12a now sends to that channel.

## Try it

Run **12b** with **Test workflow**. **Notify via Sub-workflow** returns one result per event:

```
ℹ️ *New order A-1001*
Ada · $129.90
👉 https://shop.example.com/admin/orders/A-1001

⚠️ *Low stock: MUG-BLUE*
Only 3 left in stock.

🚨 *Payment failed for A-1002*
Grace · $54.00
👉 https://shop.example.com/admin/orders/A-1002
```

Open **12a → Executions** to see the three sub-executions it ran.

## How it works

| Node | What it does |
|---|---|
| **When Called by Another Workflow** (12a) | *Execute Workflow Trigger* with 4 declared inputs. These become the fields of the item the sub-workflow receives. |
| **Format Message** (12a) | Picks an emoji per level (`{ info: 'ℹ️', … }[$json.level]`) and adds the link only when there is one. |
| **Deliver** (12a) | Posts to your chat webhook (disabled until you add a URL). |
| **Return Result** (12a) | The **last node's output is returned** to the caller. |
| **Describe Event** (12b) | Turns different event shapes into the 4 standard inputs. |
| **Notify via Sub-workflow** (12b) | *Execute Workflow*, mode **Run once for each item** → 3 sub-executions. |

## When to make a sub-workflow

- The same steps appear in **2+ workflows** (notifications, logging, "get customer by email"…)
- A workflow is getting **too big** to read
- You want to give an **AI agent** a custom tool (*Call n8n Workflow Tool*). The sub-workflow pattern is the same.

## Ideas to extend

- Add a `channel` input and a Switch in 12a to route to Slack, email or SMS.
- Use 12a as the delivery step of your **Error Workflow** ([recipe 10](../10-error-handling-and-alerts/)).
- Add *Options → Wait For Sub-Workflow Completion: off* in 12b to fire and forget.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `Workflow is not active and cannot be executed` | Publish 12a. Production callers need a published sub-workflow. |
| `Workflow does not exist` | The *Workflow* dropdown in 12b still points to the original author's ID. Re-select 12a. |
| Sub-workflow receives empty fields | Check the field mapping under **Workflow Inputs** in 12b. Click *Refresh* if you renamed inputs in 12a. |
| `… is not allowed to call this workflow` | 12a → *Settings → This workflow can be called by*: allow the caller. |
