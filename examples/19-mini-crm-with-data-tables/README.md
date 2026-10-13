# 19 · Mini CRM with Data Tables

**English** · [简体中文](README.zh-CN.md)

> Store data **inside n8n** with Data Tables, and expose it as a tiny REST API: add/update contacts and list them.

| Difficulty | Time | Credentials | Nodes used |
|---|---|---|---|
| ⭐⭐ Intermediate | 10 min | None | Data Table (create table, upsert, get), Webhook ×2, Edit Fields, IF, Code, Respond to Webhook |

```
Run Once: Create Table ─▶ Create Contacts Table              (one-time setup, safe to re-run)

POST /crm/contacts ─▶ Clean Input ─▶ Valid Email? ─┬─ true  ─▶ Find Existing Contact ─▶ Merge With Existing ─▶ Upsert Contact ─▶ Reply: Saved   (200)
                                                   └─ false ─▶ Reply: Bad Request                                                             (400)

GET  /crm/contacts ─▶ Get All Rows ─▶ Filter & Shape ─▶ Reply: Contacts                               (?stage=lead)
```

## What you'll learn

- **Data Tables**: n8n's built-in database. No external account, and visible under *Overview → Data tables*
- Creating a table from a workflow with **create if not exists**
- **Upsert**: update when the email already exists, insert otherwise, so there are no duplicates
- **Partial updates**: look up the stored row first, so fields the caller leaves out aren't wiped
- Two webhooks on the **same path** with different **HTTP methods** (POST vs GET), like a REST API
- *Always Output Data*: so an empty table still produces a response

## Setup

1. Import [`workflow.json`](workflow.json).
2. Click ▶ (*Execute step*) on **Run Once: Create Table**. This creates `cookbook_contacts` with the columns `email, name, company, stage, notes` (plus automatic `id`, `createdAt`, `updatedAt`).
3. **Publish** the workflow.

> Data Tables are built into current n8n versions (including all of 2.x), on Cloud and self-hosted. The nodes find the table **by name**, so the workflow keeps working after import without re-selecting anything.

## Try it

```bash
# Add contacts
curl -X POST http://localhost:5678/webhook/crm/contacts -H "Content-Type: application/json" \
  -d '{"email":"Ada@Example.com","name":"Ada Lovelace","company":"Analytical Engines","stage":"lead"}'
# {"ok":true,"contact":{"id":1,"email":"ada@example.com",...,"stage":"lead"}}

curl -X POST http://localhost:5678/webhook/crm/contacts -H "Content-Type: application/json" \
  -d '{"email":"grace@navy.example","name":"Grace Hopper","company":"US Navy","stage":"customer"}'

# Same email again, only some fields → updates row 1 (no duplicate), company is kept
curl -X POST http://localhost:5678/webhook/crm/contacts -H "Content-Type: application/json" \
  -d '{"email":"ada@example.com","stage":"qualified","notes":"Demo booked"}'
# {"ok":true,"contact":{"id":1,"name":"Ada Lovelace","company":"Analytical Engines","stage":"qualified",...}}

# Invalid input
curl -X POST http://localhost:5678/webhook/crm/contacts -H "Content-Type: application/json" -d '{"email":"nope"}'
# 400 {"ok":false,"error":"A valid email is required."}

# List all, or filter by stage
curl http://localhost:5678/webhook/crm/contacts
curl "http://localhost:5678/webhook/crm/contacts?stage=qualified"
# {"count":1,"stage":"qualified","contacts":[{"id":1,"email":"ada@example.com",...}]}
```

Then open **Overview → Data tables → cookbook_contacts** to see and edit the rows in n8n's UI.

## How it works

| Node | What it does |
|---|---|
| **Create Contacts Table** | Data Table → *Table → Create*, *Create If Not Exists* on. |
| **Clean Input** | Normalises the email (trim + lower-case). |
| **Find Existing Contact** | Data Table → *Row → Get* where `email` equals the input, limit 1. *Always Output Data* is on, so a new contact gives an empty item instead of stopping the flow. |
| **Merge With Existing** | For each field: the value sent in the request, else the stored value, else a default. `stage` must be one of `lead, qualified, customer, lost`. |
| **Upsert Contact** | Data Table → *Row → Upsert*, matching on `email`. Returns the stored row including `id` and `updatedAt`. |
| **Get All Rows** | Data Table → *Row → Get*, *Return All*. *Settings → Always Output Data* is on, so an empty table still produces one (empty) item. |
| **Filter & Shape** | Applies the optional `?stage=` filter and returns `{count, stage, contacts}`. |

> ⚠️ **Upsert pitfall:** an upsert writes *every* mapped column. Without the *Find + Merge* step, a request that only sends `{"email": …, "stage": "qualified"}` would overwrite `name` and `company` with empty values. The automated test for this recipe caught exactly that.

## Data Tables vs. other storage

| | Data Tables | Google Sheets | Postgres / MySQL |
|---|---|---|---|
| Setup | None | Google account + OAuth | A database server |
| Speed | Fast (local) | Slow, rate limited | Fast |
| Size | Small to medium (instance storage limit) | ~10M cells | Large |
| Shared with non-n8n users | No | Yes (great for teams) | Via other tools |
| Best for | Workflow state, lookups, small apps | Human-edited lists | Production data |

## Ideas to extend

- Add `DELETE /crm/contacts?email=…` with a *Row → Delete* operation.
- Give the AI agent from [recipe 15](../15-ai-agent-with-tools-and-memory/) a Data Table tool: "Which customers did we add this week?"
- Feed the table from the contact form ([recipe 04](../04-contact-form-to-google-sheets/)) or the cleaned CSV ([recipe 14](../14-clean-and-dedupe-contact-list/)).
- Protect the API with *Header Auth* on both webhooks.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `Data table with name "cookbook_contacts" not found` | Run **Run Once: Create Table** first. |
| `Attempted to use Data table node but the module is disabled` | Data Tables aren't enabled on this instance (very old version, or disabled by the admin). Update n8n. |
| GET request hangs or returns an error on an empty table | Make sure *Always Output Data* is on for **Get All Rows**. |
