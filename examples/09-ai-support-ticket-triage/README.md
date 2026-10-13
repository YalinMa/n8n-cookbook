# 09 · AI Support Ticket Triage

**English** · [简体中文](README.zh-CN.md)

> Let an LLM read incoming support tickets, extract structured information, and route each ticket to the right team.

| Difficulty | Time | Credentials | Nodes used |
|---|---|---|---|
| ⭐⭐⭐ Intermediate+ | 15 min | OpenAI API key (or any other chat model) | Webhook, Information Extractor, OpenAI Chat Model, Edit Fields, Respond to Webhook, Switch |

```
New Ticket ─▶ Extract Ticket Info ─▶ Build Ticket ─▶ Reply to Sender ─▶ Route by Category ─┬─ Billing   ─▶ Billing Team
 (webhook)         ▲                                   (JSON response)                       ├─ Technical ─▶ Tech Support
                   │ ai_languageModel                                                        ├─ Sales     ─▶ Sales Team
           OpenAI Chat Model                                                                 └─ Other     ─▶ General Inbox
```

## What you'll learn

- How n8n's **AI nodes** work: a *root node* (Information Extractor) plus a *sub-node* (the chat model) connected with a special `ai_languageModel` connection
- Getting **structured JSON** out of an LLM instead of free text
- Using **temperature 0** for consistent classification
- Multi-way routing with the **Switch** node and a *fallback* output
- Replying to the caller *before* the slower follow-up work finishes

## Setup

1. Import [`workflow.json`](workflow.json).
2. **Add your model credential.** Open **OpenAI Chat Model → Credential → Create new → OpenAI** and paste an API key from [platform.openai.com/api-keys](https://platform.openai.com/api-keys).
   - Each ticket costs a fraction of a cent with `gpt-4o-mini`.
   - **Prefer another provider?** Delete *OpenAI Chat Model*, click the **+** under *Extract Ticket Info → Model*, and pick **Anthropic Chat Model**, **Google Gemini Chat Model**, **Ollama Chat Model** (free, local) or another provider. Nothing else changes.
3. *(Optional)* Replace the four **No Op** team nodes with Slack, Email, Jira, Zendesk… nodes.

## Try it

1. Click **Test workflow**.
2. Send a ticket to the Test URL:

   ```bash
   curl -X POST http://localhost:5678/webhook-test/support-ticket \
     -H "Content-Type: application/json" \
     -d '{
       "email": "jane@example.com",
       "subject": "Charged twice this month!!",
       "message": "I just looked at my card statement and you billed me twice for the Pro plan. Please refund one of them ASAP."
     }'
   ```

3. Response:

   ```json
   {
     "ok": true,
     "ticketId": "T-1760348400000",
     "category": "billing",
     "priority": "high",
     "summary": "Customer was charged twice for the Pro plan and wants a refund."
   }
   ```

4. In the editor, the run continued down the **Billing** output of *Route by Category*.

More test tickets:

| Subject | Message | Expected category |
|---|---|---|
| App won't load | Since this morning the dashboard shows a blank page in Chrome and Safari. | technical |
| Team plan pricing | We're 40 people. Do you offer volume discounts on annual plans? | sales |
| Love the product | Just wanted to say the new editor is fantastic, thanks! | other |

## How it works

| Node | What it does |
|---|---|
| **New Ticket** | Webhook `POST /support-ticket`, answered later by *Reply to Sender*. |
| **Extract Ticket Info** | *Information Extractor* (LangChain). You describe the attributes you want (name, description, required). n8n builds the prompt and a JSON schema and validates the model's answer. The result is in `$json.output`. |
| **OpenAI Chat Model** | The LLM used by the extractor. Temperature 0 = deterministic, which suits classification. |
| **Build Ticket** | Combines the original request (`$('New Ticket').item.json.body…`) with the AI output and creates a ticket ID. |
| **Reply to Sender** | Returns the result right away. The workflow **keeps running** after the response is sent. |
| **Route by Category** | Switch node with 3 rules and a *Fallback Output* named "Other" for anything unexpected. |

### Prompt-writing tips for classification

- **List the allowed values** in each attribute description ("Exactly one of: …"). Free-form answers break routing.
- Add **decision rules** for edge cases ("Use high for outages, data loss…").
- Always keep a **fallback route**. LLMs are probabilistic.
- Log the AI output (for example to Google Sheets) for a week and review misclassifications to improve the prompt.

## Ideas to extend

- **Auto-draft a reply:** add a *Basic LLM Chain* node that writes a polite first response, and have a human approve it in Slack before sending.
- **Escalate:** when `priority = high` and `sentiment = negative`, page the on-call person.
- **Use your own knowledge base:** switch to an *AI Agent* node with a vector-store tool so it can answer FAQs automatically.
- Receive tickets from **email** (Gmail/IMAP trigger) instead of a webhook.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `Node does not have any credentials set` | Add your API key to **OpenAI Chat Model**. |
| `429 You exceeded your current quota` | Your OpenAI account needs billing credits. |
| Everything goes to *Other* | Check `category` in **Build Ticket**. If the model returns `Billing.` or similar, tighten the attribute description. The workflow already lower-cases values. |
| `Failed to parse` errors | Smaller local models sometimes produce bad JSON. Try a stronger model or enable *Retry On Fail* on the extractor. |
