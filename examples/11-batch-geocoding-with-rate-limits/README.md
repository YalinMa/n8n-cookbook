# 11 · Batch Geocoding with Rate Limits

**English** · [简体中文](README.zh-CN.md)

> Process a long list through an API **in batches with pauses**, so you stay under rate limits, then collect all the results at the end.

| Difficulty | Time | Credentials | Nodes used |
|---|---|---|---|
| ⭐⭐ Intermediate | 10 min | None | Code, Loop Over Items, HTTP Request (retry), Edit Fields, Wait, Sort, Convert to File |

```
Manual Trigger ─▶ City List ─▶ Loop Over Items ──done──▶ Sort by Population ─▶ Convert to CSV
                  (12 items)    (batch size 3)
                                     │ loop                                   ▲
                                     ▼                                        │ back to the loop
                                Geocode City ─▶ Keep Useful Fields ─▶ Pause 1 Second
```

## What you'll learn

- **Loop Over Items** (formerly *Split in Batches*): its two outputs, *loop* and *done*, and how the loop-back connection works
- Respecting **rate limits** with a **Wait** node between batches
- **Retry On Fail** for the odd failed request
- Handling **"not found"** results gracefully with optional chaining (`$json.results?.[0]?.country ?? ''`)
- Referencing the current loop item with `$('Loop Over Items').item`

## When do I need a loop?

Most of the time, **you don't**. Nodes already run once per item (see [Core Concepts](../../docs/core-concepts.md#2-data-is-a-list-of-items)). Use *Loop Over Items* when you need to:

- **pause** between groups of requests (rate limits, polite scraping)
- keep memory low with **thousands** of items
- run a **multi-step sequence per batch**, finishing one batch before starting the next

For a simple "one request per second" with no extra steps, the HTTP Request node's own *Options → Batching* is enough (used in [recipe 20](../20-web-scraping-with-html-node/)).

## Setup

1. Import [`workflow.json`](workflow.json).
2. Edit the list in **City List**, or replace that node with Google Sheets, a CSV file ([recipe 14](../14-clean-and-dedupe-contact-list/)) or a database.

No credentials needed. Data comes from the free [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api).

## Try it

Click **Test workflow**. Watch **Loop Over Items** go round 4 times (12 cities ÷ 3). It takes about 4 seconds because of the pauses. Then open **Sort by Population**:

| city | found | country | latitude | longitude | population | timezone |
|---|---|---|---|---|---|---|
| Mumbai | true | India | 19.07 | 72.88 | 12 691 836 | Asia/Kolkata |
| São Paulo | true | Brazil | −23.55 | −46.64 | 12 400 232 | America/Sao_Paulo |
| … | | | | | | |
| Atlantis | **false** | | | | 0 | |

Download the CSV from **Convert to CSV** → *Binary* tab.

## How it works

| Node | What it does |
|---|---|
| **City List** | Creates 12 items, one per city. |
| **Loop Over Items** | Batch size 3. Sends 3 items out of **loop**, waits until they come back, sends the next 3… After the last batch it sends **all** results out of **done**. |
| **Geocode City** | `GET /v1/search?name=<city>&count=1`. *Retry On Fail*: 3 tries, 3 s apart. |
| **Keep Useful Fields** | Flattens the response. `?.` and `??` keep it from crashing when a city isn't found. |
| **Pause 1 Second** | Wait node. Its output connects **back into Loop Over Items**. That arrow is what makes it a loop. |
| **Sort by Population** / **Convert to CSV** | Run once, on the combined results from *done*. |

## Ideas to extend

- Combine with [recipe 02](../02-daily-weather-report/): geocode, then fetch the weather for each city.
- Write results back to the Google Sheet the list came from (*Update Row*).
- For very large lists, raise the batch size and lower the pause until you hit the API's documented limit.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Loop runs forever | Something inside the loop changed the item count, or the loop-back goes to the wrong input. The last node in the loop must connect to *Loop Over Items*' input. |
| Only the first batch is in the result | You connected the end of the chain to the **loop** output instead of reading from **done**. |
| `429 Too Many Requests` | Increase the Wait time or decrease the batch size. |
