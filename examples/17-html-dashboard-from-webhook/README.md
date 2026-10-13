# 17 · HTML Dashboard from a Webhook

> Serve a **live web page** straight from n8n: an exchange-rate dashboard with 30-day trend charts, and no hosting needed.

| Difficulty | Time | Credentials | Nodes used |
|---|---|---|---|
| ⭐⭐ Intermediate | 10 min | None | Webhook (GET), Edit Fields, HTTP Request (error output), Code, Respond to Webhook (HTML) |

```
Open Dashboard ─▶ Settings ─▶ Get 30-Day Rates ─┬─ success ─▶ Build HTML Page ─▶ Serve Page        (200, text/html)
 GET ?base=USD    (validate                       └─ error   ─▶ Serve Error Page                     (502, text/html)
                   query)
```

## What you'll learn

- Using a **GET** webhook and **query parameters** (`$json.query.base`)
- **Validating input** before using it (`/^[A-Za-z]{3}$/`)
- Generating **HTML** (with inline SVG charts) in a Code node
- Returning **custom headers** (`Content-Type: text/html`, `Cache-Control`)
- A friendly **error page** using the HTTP node's error output

## Setup

1. Import [`workflow.json`](workflow.json).
2. **Publish** it, then open the production URL in your browser:
   `http://localhost:5678/webhook/fx-dashboard`
   (While building, click *Test workflow* and use `/webhook-test/fx-dashboard` instead.)

No credentials needed. Data: [Frankfurter](https://frankfurter.dev) (European Central Bank reference rates).

## Try it

Open the page, then click the currency links at the top (`?base=USD`, `?base=JPY`…). Each currency row shows the current rate, the 30-day change (green/red) and a sparkline:

```
1 USD =
ECB reference rates · 2026-09-14 → 2026-10-12
Currency   Rate       30 days   Trend
CHF        0.8328     +2.15%    ╱╲╱‾
CNY        6.6928     −0.23%    ‾╲_╱
EUR        0.8944     +3.68%    _╱‾‾
…
```

Bad input like `?base=<script>` is ignored and falls back to EUR.

## How it works

| Node | What it does |
|---|---|
| **Open Dashboard** | Webhook, method **GET**, path `fx-dashboard`, answered by a Respond node. |
| **Settings** | Validates `base` (exactly 3 letters, otherwise `EUR`) and computes the start date with Luxon. |
| **Get 30-Day Rates** | `GET /v1/<from>..?base=…&symbols=…`. *On Error → Continue (using error output)*, so an API problem shows a page instead of a blank error. |
| **Build HTML Page** | Plain JavaScript template string: a table plus an SVG `<polyline>` per currency. No external libraries. |
| **Serve Page** | *Respond With: Text* + header `Content-Type: text/html; charset=utf-8`, so the browser renders it. |

## Ideas to extend

- Put **any** data on a page: your Google Sheet, Data Table ([recipe 19](../19-mini-crm-with-data-tables/)), or uptime results ([recipe 06](../06-website-uptime-monitor/)).
- Add **Basic Auth** to the Webhook node to keep the page private.
- Add Chart.js from a CDN for interactive charts.
- Serve a small **form page** that POSTs back to another webhook: a mini web app made only of n8n workflows.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Browser shows the HTML source as text | The `Content-Type` header is missing or wrong in **Serve Page**. |
| Browser shows `{"message":"Workflow was started"}` | The Webhook's *Respond* option must be **Using 'Respond to Webhook' Node**. |
| Page is slow | It calls the API on every view. Lower the date range, or cache: store the HTML in workflow static data on a schedule and serve it from there. |
