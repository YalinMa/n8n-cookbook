# 06 · Website Uptime Monitor

> Check a list of websites every 5 minutes and send one alert that lists every site that is down.

| Difficulty | Time | Credentials | Nodes used |
|---|---|---|---|
| ⭐⭐ Intermediate | 10 min | None (optional chat webhook URL) | Schedule Trigger, Code, HTTP Request, Edit Fields, IF, Aggregate, No Op |

```
Every 5 Minutes ─┐
                 ├─▶ Sites to Check ─▶ Check URL ─▶ Summarize Result ─▶ Is Down? ─┬─ true ─▶ Collect Down Sites ─▶ Build Alert ─▶ Send Alert (disabled)
Manual Trigger ──┘     (4 items)       (never        (isUp, problem)              └─ false ─▶ All Good
                                        stops)
```

## What you'll learn

- Generating a **list of items** in a Code node, so every later node runs once per site
- Making the HTTP Request **tolerant of failures**:
  - *Never Error*: 4xx/5xx responses are returned as data, not thrown
  - *On Error: Continue*: DNS errors and timeouts don't stop the workflow
- Getting the **full response** (status code + headers), not only the body
- Looking up data from an earlier node **for the same item** with `$('Sites to Check').item`
- Using **Aggregate** to send *one* alert instead of one per failing site

## Setup

1. Import [`workflow.json`](workflow.json).
2. Edit the list in **Sites to Check**. Each site is one line with a `name` and a `url`. Two demo entries are broken on purpose (`httpbin.org/status/503` and a `.invalid` domain). Delete them once you've seen the alert work.
3. *(Optional)* Paste a Slack/Discord incoming-webhook URL into **Send Alert**, then enable the node (right-click → **Enable**, or press `D`). See [example 02](../02-daily-weather-report/README.md#setup) for how to get a webhook URL.

## Try it

Click **Test workflow**. In **Build Alert** you'll see:

```
🚨 2 site(s) down at 09:42:
• Demo: server error (https://httpbin.org/status/503) – HTTP 503
• Demo: bad domain (https://this-site-does-not-exist.invalid) – getaddrinfo ENOTFOUND …
```

(The exact network error text depends on your system and network: `ENOTFOUND`, a TLS error, or a timeout.)

Publish the workflow to check every 5 minutes.

## How it works

| Node | What it does |
|---|---|
| **Sites to Check** | Returns 4 items. Any node after this runs 4 times, once per item. You don't need a loop. |
| **Check URL** | `GET {{ $json.url }}` with *Response → Include Response Headers and Status* and *Never Error* turned on, plus a 10 s timeout. *Settings → On Error* is **Continue**, so network failures become an item with an `error` field. |
| **Summarize Result** | Builds a clean item: `name`, `url`, `statusCode`, `isUp` (2xx/3xx), `problem`. |
| **Is Down?** | Routes failing sites to **true**, healthy ones to **false**. |
| **Collect Down Sites** | Aggregates all failing items into one `downSites` array. |
| **Build Alert** / **Send Alert** | Formats a single message and posts it. |

## Ideas to extend

- **Avoid repeated alerts:** remember which sites were already down using workflow static data (pattern in [example 07](../07-github-release-watcher/)). Alert only on *changes*, and send a "✅ recovered" message too.
- **Check content, not just status:** add a condition that the body contains an expected word.
- **Track response time:** turn on *Options → Response → Include Response Headers and Status* plus a Code node with `Date.now()` before and after.
- Read the site list from Google Sheets so non-technical teammates can edit it.

## Troubleshooting

| Symptom | Fix |
|---|---|
| One bad site stops the whole run | **Check URL → Settings → On Error** must be *Continue*. |
| Every site shows `statusCode: 0` | The full response option is off. Check *Options → Response → Include Response Headers and Status*. |
| Sites behind Cloudflare return 403 | Some sites block bots. Add a browser-like `User-Agent` header in **Check URL**. |
