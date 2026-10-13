# 01 · Hello Webhook API

> Turn n8n into a tiny HTTP API: receive a request, transform the data, send a JSON response.

| Difficulty | Time | Credentials | Nodes used |
|---|---|---|---|
| ⭐ Beginner | 5 min | None | Webhook, Edit Fields (Set), Respond to Webhook |

```
POST /webhook/hello  ──▶  Webhook  ──▶  Build Greeting  ──▶  Respond to Webhook  ──▶  JSON reply
   {"name":"Ada"}                         (new fields)
```

## What you'll learn

- How a **trigger** starts a workflow (here: an incoming HTTP request)
- How data flows between nodes as **items** (`$json`)
- How to write **expressions** like `{{ $json.body.name }}`
- The difference between the **Test URL** and the **Production URL**

## Setup

1. In n8n, go to **Workflows → Add workflow → ⋯ → Import from File** and pick [`workflow.json`](workflow.json).
2. That's it. No credentials needed.

## Try it

1. Click **Test workflow**. The Webhook node now waits for one request.
2. In a terminal, send a request to the **Test URL**:

   ```bash
   curl -X POST http://localhost:5678/webhook-test/hello \
     -H "Content-Type: application/json" \
     -d '{"name": "Ada"}'
   ```

3. You get back:

   ```json
   {
     "name": "Ada",
     "greeting": "Hello, Ada! 👋",
     "nameLength": 3,
     "receivedAt": "2026-10-13T09:30:00.000+00:00"
   }
   ```

4. Click each node in the editor to see its input and output.

To make the endpoint permanent, **activate** the workflow (toggle at the top). Then call `/webhook/hello` (no `-test`) as often as you like.

## How it works

| Node | What it does |
|---|---|
| **Webhook** | Listens for `POST /hello`. *Respond* is set to **Using 'Respond to Webhook' node**, so the reply is built later in the flow. The request lands in `$json.body`, `$json.headers` and `$json.query`. |
| **Build Greeting** | An *Edit Fields (Set)* node. Each field is an expression. `$json.body.name \|\| 'stranger'` falls back to a default when no name is sent. `$now` is the current time (a [Luxon](https://moment.github.io/luxon/) DateTime). |
| **Respond to Webhook** | Sends the current item back as JSON with status `200`. |

## Ideas to extend

- Add an **IF** node and return `400` when `name` is missing.
- Add **Header Auth** on the Webhook node (*Authentication* → *Header Auth*) so only callers with a secret header can use it.
- Save each request to Google Sheets (see [example 04](../04-contact-form-to-google-sheets/)).

## Troubleshooting

| Symptom | Fix |
|---|---|
| `404 The requested webhook "hello" is not registered` | For `/webhook-test/…`, click **Test workflow** first; the test URL works for one call only. For `/webhook/…`, the workflow must be **active**. |
| Response is `{"message":"Workflow was started"}` | The Webhook node's *Respond* option was changed. Set it back to **Using 'Respond to Webhook' node**. |
| `name` is always `stranger` | Send `Content-Type: application/json` so n8n parses the body. |
