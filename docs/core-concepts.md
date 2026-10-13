# Core Concepts

Eight ideas explain about 90% of how n8n works. Each one links to the recipe where you'll see it in action.

## 1. Workflows are made of nodes

A **workflow** is a graph of **nodes** joined by **connections**. Data flows left to right. There are three kinds of nodes:

| Kind | Examples | Role |
|---|---|---|
| **Trigger** | Webhook, Schedule, Form, Gmail Trigger, Error Trigger | Starts the workflow. Every workflow needs at least one. |
| **Action** | HTTP Request, Google Sheets, Slack, Send Email | Talks to the outside world. |
| **Core / logic** | Edit Fields, IF, Switch, Filter, Merge, Code, Aggregate | Reshapes data and decides where it goes. |

A workflow can have **several triggers**. Most recipes here have a *Schedule Trigger* for production and a *Manual Trigger* for testing → [02](../examples/02-daily-weather-report/).

## 2. Data is a list of items

Everything that passes between nodes is a **list of items**. Each item is a JSON object:

```json
[
  { "json": { "name": "n8n.io",  "url": "https://n8n.io" } },
  { "json": { "name": "GitHub",  "url": "https://github.com" } }
]
```

**Most nodes run once per item, automatically.** If 4 items go into an HTTP Request node, it makes 4 requests. You rarely need loops → [06](../examples/06-website-uptime-monitor/).

Key nodes for changing the *number* of items:

| From → To | Node | Recipe |
|---|---|---|
| 1 item with an array → many items | **Split Out** | [05](../examples/05-api-to-csv-export/) |
| many items → 1 item with an array | **Aggregate** | [03](../examples/03-rss-news-digest-email/), [06](../examples/06-website-uptime-monitor/) |
| many items → fewer items | **Filter**, **Limit**, **Remove Duplicates** | [03](../examples/03-rss-news-digest-email/), [05](../examples/05-api-to-csv-export/) |
| many items → grouped totals | **Summarize** | [08](../examples/08-merge-data-from-two-apis/) |
| two lists → one list | **Merge** | [08](../examples/08-merge-data-from-two-apis/) |

> **Tip:** the small number on each connection after a run is the item count. Watching it is the fastest way to understand a workflow.

## 3. Expressions: `{{ … }}`

Any parameter can be a fixed value or an **expression**. An expression is JavaScript between `{{ }}` that runs **for each item**.

```text
Hello {{ $json.body.name }}!                        → read from the current item
{{ $json.price * 1.2 }}                             → maths
{{ $json.email.trim().toLowerCase() }}              → string methods
{{ $now.toFormat('yyyy-MM-dd') }}                   → dates (Luxon)
{{ $('Settings').first().json.city }}               → read from an earlier node
{{ $json.items.map(i => i.title).join(', ') }}      → arrays
```

In JSON files, expressions start with `=`, for example `"value": "={{ $json.name }}"`. You'll see this in every `workflow.json` here. See the **[cheat sheet](cheatsheet.md)** for more.

## 4. Credentials are separate from workflows

API keys, passwords and OAuth tokens live in n8n's encrypted **credential store**. A workflow only *references* a credential by ID. That means:

- Workflow JSON files are safe to share (none of the files here contain secrets).
- After importing, you attach your **own** credentials → [03](../examples/03-rss-news-digest-email/), [04](../examples/04-contact-form-to-google-sheets/), [09](../examples/09-ai-support-ticket-triage/).
- One credential can be reused by many workflows.

## 5. Test runs vs. production runs

| | Test (*Test workflow* button) | Production (workflow **published**) |
|---|---|---|
| Purpose | Building and debugging | Running unattended |
| Webhooks | `/webhook-test/…`, listens for one call | `/webhook/…`, always listening |
| Results | Shown live in the editor | Saved under **Executions** |

Things that only happen in production: **static data** is saved → [07](../examples/07-github-release-watcher/), and **Error Workflows** fire → [10](../examples/10-error-handling-and-alerts/).

**Pin data** (the 📌 icon on a node's output) freezes a node's output while you build. It saves API calls and lets you test later nodes with fixed data.

## 6. Branching and routing

| Node | Does |
|---|---|
| **IF** | Splits items into *true* / *false* outputs → [04](../examples/04-contact-form-to-google-sheets/), [06](../examples/06-website-uptime-monitor/) |
| **Switch** | Routes to one of many outputs, with a *fallback* → [09](../examples/09-ai-support-ticket-triage/) |
| **Filter** | Like IF, but simply drops non-matching items → [03](../examples/03-rss-news-digest-email/) |

If a node outputs **zero items**, nothing after it runs. That's an easy way to "stop if there's nothing to do" → [07](../examples/07-github-release-watcher/).

## 7. The Code node: your escape hatch

When no built-in node fits, write JavaScript (or Python). A Code node must **return an array of items**:

```js
// Mode: Run Once for All Items
const out = [];
for (const item of $input.all()) {
  out.push({ json: { ...item.json, doubled: item.json.value * 2 } });
}
return out;
```

Prefer built-in nodes when one exists, because they are easier for others to read. Use Code for real logic → [02](../examples/02-daily-weather-report/), [07](../examples/07-github-release-watcher/).

## 8. Errors are normal: plan for them

- **Retry On Fail** for flaky APIs
- **On Error → Continue (using error output)** for a Plan B branch
- **Stop and Error** to fail clearly on bad data
- An **Error Workflow** so you hear about failures

All four are in → [10](../examples/10-error-handling-and-alerts/).

## Bonus: AI nodes

AI nodes (*AI Agent*, *Basic LLM Chain*, *Information Extractor*, *Text Classifier*…) are **root nodes** with **sub-nodes** plugged in underneath: a chat model (required), plus optional memory, tools and output parsers. To swap OpenAI for Anthropic, Gemini or a local Ollama model, you replace only the sub-node → [09](../examples/09-ai-support-ticket-triage/).
