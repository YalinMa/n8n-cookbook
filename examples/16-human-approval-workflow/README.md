# 16 · Human-in-the-Loop Expense Approval

> Pause a workflow until a person clicks **Approve** or **Reject**, then continue the same execution down the right path.

| Difficulty | Time | Credentials | Nodes used |
|---|---|---|---|
| ⭐⭐⭐ Intermediate+ | 15 min | None (optional chat webhook URL) | Webhook, IF, Edit Fields, Respond to Webhook, Wait (resume on webhook call) |

```
Expense Request ─▶ Read Request ─▶ Over 100? ─┬─ false ─▶ Auto-approve ─▶ Reply: Approved
                                              │
                                              └─ true ─▶ Build Approval Links ─▶ Notify Manager ─▶ Reply: Pending ─▶ Wait for Decision ⏸
                                                         ($execution.resumeUrl)    (disabled)        (202 + links)         │ manager clicks a link
                                                                                                                          ▼
                                                                         Confirm Approval ◀─ Mark Approved ◀─ true ─ Approved? ─ false ─▶ Mark Rejected ─▶ Confirm Rejection
```

## What you'll learn

- The **Wait** node in *On Webhook Call* mode: the execution is **saved and paused**, costing nothing while it waits
- `$execution.resumeUrl`: a unique, signed URL that resumes *this* execution
- Passing the person's decision as a **query parameter** and branching on it
- Answering the **original caller first** (202 Accepted), then waiting
- Sending a nice **HTML confirmation page** to the approver

## Setup

1. Import [`workflow.json`](workflow.json).
2. *(Optional)* Put a Slack/Discord webhook URL in **Notify Manager** and enable it, or swap it for *Send Email*. The message contains both links.
3. **Publish** the workflow. Resume URLs only work for production executions.

> **Tip:** n8n also has built-in *Send and Wait for Response* operations on the Slack, Gmail, Telegram, Teams and Discord nodes. They render the Approve/Reject buttons for you. This recipe builds the same pattern by hand, so you can see how it works and use any channel.

## Try it

```bash
# 1. Small expense → approved immediately
curl -X POST http://localhost:5678/webhook/expense -H "Content-Type: application/json" \
  -d '{"employee":"Ada","amount":42.5,"description":"Taxi"}'
# {"status":"auto_approved","message":"Expenses up to 100 € are approved automatically."}

# 2. Large expense → paused, returns approval links
curl -X POST http://localhost:5678/webhook/expense -H "Content-Type: application/json" \
  -d '{"employee":"Grace","amount":850,"description":"Conference ticket"}'
# 202 {"status":"pending_approval", "approveUrl":"http://localhost:5678/webhook-waiting/33?signature=…&decision=approve", "rejectUrl": "…"}
```

3. Open **Executions**: the run shows as **Waiting**.
4. Open `approveUrl` in a browser. You'll see **✅ Expense approved · Grace · 850.00 €**, and the execution finishes through *Mark Approved*.

## How it works

| Node | What it does |
|---|---|
| **Over 100?** | Small amounts skip the human step. |
| **Build Approval Links** | `{{ $execution.resumeUrl }}&decision=approve` (and `reject`). n8n adds a `?signature=…` token to the resume URL, so your own parameters must be appended with **`&`**. |
| **Reply: Pending** | Responds **202** to the original request now. The workflow keeps running afterwards. |
| **Wait for Decision** | *Resume: On Webhook Call*, GET, *Respond: Using 'Respond to Webhook' Node*. The execution is stored in the database until the link is opened. |
| **Approved?** | Reads `$json.query.decision` from the resume request. |
| **Mark Approved / Rejected** | Pull the original request data from an earlier node with `$('Read Request').item`. That data was saved with the paused execution. |
| **Confirm Approval / Rejection** | HTML page shown to the manager. |

## Ideas to extend

- **Time out:** Wait → *Limit Wait Time* (e.g. 3 days), then escalate to the manager's manager.
- **Collect a comment:** use *Resume: On Form Submitted* instead, so the approver fills in a short form ("reason for rejection").
- **Record decisions** in a Data Table ([recipe 19](../19-mini-crm-with-data-tables/)) or Google Sheet.
- Multi-step approval: chain two Wait nodes (team lead, then finance).

## Troubleshooting

| Symptom | Fix |
|---|---|
| Clicking the link returns `{"error":"Invalid token"}` | The link was modified, for example with `?decision=` instead of `&decision=`. Use the URL exactly as generated. |
| Link returns 404 / "execution not found" | The execution already resumed (links work once), or it was a manual test run that was stopped. Publish the workflow and use a production execution. |
| Links point to `localhost` | Set `WEBHOOK_URL` on self-hosted n8n to your public URL. |
