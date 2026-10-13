# 10 · Error Handling & Alerts

> Make workflows resilient: retry flaky calls, fall back gracefully, and get alerted when something really breaks.

| Difficulty | Time | Credentials | Nodes used |
|---|---|---|---|
| ⭐⭐⭐ Intermediate+ | 15 min | None (optional chat webhook URL) | Error Trigger, HTTP Request (retry + error output), IF, Stop and Error, Edit Fields |

This example has **two** workflow files that work together:

| File | Role |
|---|---|
| [`error-alert-workflow.json`](error-alert-workflow.json) | **10a · Error Alert**: a reusable *Error Workflow* that sends a message whenever any workflow you attach it to fails. |
| [`flaky-workflow-demo.json`](flaky-workflow-demo.json) | **10b · Error Handling Demo**: shows retries, an error branch with fallback data, and failing on purpose. |

```
10b · Error Handling Demo
                                                    success ─▶ Use API Data ──────┐
Manual Trigger ─▶ Settings ─▶ Call Unreliable API ─┤                              ├─▶ Fail on Purpose? ─┬─ true ─▶ Stop and Error ══╗
                              (retry 3× · 2 s)      error   ─▶ Use Fallback Data ─┘                     └─ false ─▶ Continue      ║
                                                                                                                                  ║ triggers
10a · Error Alert                                                                                                                 ║
Error Trigger ─▶ Build Alert ─▶ Send Alert (disabled)  ◀══════════════════════════════════════════════════════════════════════════╝
```

## What you'll learn

The four layers of error handling in n8n, from the smallest to the largest scope:

| Layer | Where | Use it when |
|---|---|---|
| 1. **Retry On Fail** | Node → *Settings* | A call fails *sometimes* (timeouts, rate limits, 502s). |
| 2. **On Error → Continue (using error output)** | Node → *Settings* | You have a sensible *Plan B* (cached data, default value, skip this item). |
| 3. **Stop and Error** | A node in the flow | Data is invalid and you want to fail *on purpose* with a clear message. |
| 4. **Error Workflow** | Workflow → *Settings* | Something failed that you didn't handle. A human should know. |

## Setup

1. Import **both** files: [`error-alert-workflow.json`](error-alert-workflow.json) and [`flaky-workflow-demo.json`](flaky-workflow-demo.json).
2. *(Optional)* In **10a · Error Alert**, paste a Slack/Discord webhook URL into **Send Alert** and enable the node. You can also replace it with *Send Email*, *Telegram*, *Microsoft Teams*… You don't need to activate 10a. Error workflows run on their own.
3. **Connect them:** open **10b · Error Handling Demo** → **⋯ → Settings → Error Workflow** → choose **10a · Error Alert** → Save.
4. Do the same for every important workflow you build from now on. One error workflow can serve all of them.

## Try it

**A · Retry + fallback (default)**

Click **Test workflow** in 10b. **Call Unreliable API** calls `httpbin.org/status/500`, which always fails. n8n tries 3 times, 2 seconds apart (so it takes about 4 s). Then the item goes out of the node's **error output** to **Use Fallback Data**:

```json
{ "source": "fallback", "data": { "note": "cached default values" }, "apiError": "500 - …" }
```

The run finishes **successfully**. The failure was handled.

**B · Fail on purpose → alert**

1. In **Settings**, set `failOnPurpose` to `true`.
2. Error workflows only fire for **production** runs (trigger/schedule/webhook), not when you click *Test workflow*. To see the alert in action:
   - Replace the Manual Trigger with a **Schedule Trigger** (every minute) and activate the workflow for one minute, **or**
   - Open **10a**, click **Test workflow** and look at the sample data the Error Trigger shows, to preview the message format.
3. The alert looks like:

   ```
   ❌ Workflow *10b · Error Handling Demo* failed
   • Node: Stop and Error
   • Error: Stopped on purpose (data source: fallback). This failure triggers the Error Workflow.
   • Mode: trigger
   • Details: https://your-n8n/workflow/…/executions/…
   ```

## How it works

| Node | What it does |
|---|---|
| **Call Unreliable API** | *Settings*: **Retry On Fail** on, **Max Tries** 3, **Wait Between Tries** 2000 ms, **On Error** = *Continue (using error output)*. The node now has two outputs: success (top) and error (bottom). |
| **Use API Data** / **Use Fallback Data** | Normal path vs. Plan B. Both produce the same shape (`source`, `data`), so later nodes don't care which path ran. |
| **Fail on Purpose?** | Reads the switch in **Settings** with `$('Settings').first().json`. |
| **Stop and Error** | Fails the execution with your own message. |
| **Error Trigger** (10a) | Receives `workflow.name`, `execution.id`, `execution.url`, `execution.error.message`, `execution.lastNodeExecuted`… |

## Best practices

- **Every production workflow should have an Error Workflow.** Silent failures are the #1 automation pain.
- Retry only **idempotent** operations (safe to repeat). Don't blindly retry "charge credit card".
- Make fallback output **look like** normal output so downstream nodes stay simple.
- Put **context** in error messages: which customer, which order, which step.
- Set `N8N_EDITOR_BASE_URL` (self-hosted) so `execution.url` in alerts is a clickable link.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Error workflow never runs | It doesn't run for manual test executions. Also check the failing workflow's *Settings → Error Workflow*. |
| `execution.url` is empty | Set `N8N_EDITOR_BASE_URL` on self-hosted instances. |
| Node has no error output | Set *Settings → On Error* to **Continue (using error output)**. *Continue* (regular output) mixes errors into the normal output instead. |
