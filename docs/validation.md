# Validation

Every workflow in this cookbook is checked in two layers.

## 1. Static checks: `scripts/validate.mjs`

No dependencies; runs in under a second and on every push via [GitHub Actions](../.github/workflows/validate.yml).

```bash
node scripts/validate.mjs
```

It checks every `examples/*/*.json`:

- valid JSON with `name`, `nodes` and `connections`
- every node has `id`, `name`, `type`, `typeVersion`, `position`, `parameters`
- node names and IDs are unique
- every connection points to an existing node and uses a known connection type
- at least one enabled trigger node
- no orphan nodes (everything except triggers, sticky notes and AI sub-nodes has an incoming connection)
- **no credentials or secrets** are committed (no `credentials` blocks; common API-key patterns rejected)
- every example folder has a `README.md`

## 2. Real n8n run: `scripts/test-in-n8n.sh`

Spins up a throw-away n8n instance in `.n8n-test/` (git-ignored), imports everything with the n8n CLI and **actually runs it** against the live public APIs. Each check looks for **specific expected output** (item counts, values, routing), not just "no error".

```bash
# Node.js 24+ required (n8n 2.x)
./scripts/test-in-n8n.sh
# or with a local install:
N8N=/path/to/node_modules/.bin/n8n ./scripts/test-in-n8n.sh
```

### Executed with the CLI (`n8n execute`)

| Recipe | Variant | Asserted |
|---|---|---|
| 02 Weather | as published | Forecast fetched, message formatted |
| 03 RSS digest | email node disabled | Feed → filter → top 10 → **1** aggregated item → HTML |
| 05 CSV export | as published | 4 paginated requests → **194** products → CSV |
| 06 Uptime | as published | 2 sites down (HTTP 503 + DNS) → one alert |
| 07 Releases | as published | "New release of …" messages |
| 08 Merge | as published | Users joined with **non-zero** completed-todo counts |
| 10a Error alert | Error Trigger → sample error | Alert text built |
| 10b Error demo | as published, and with `failOnPurpose=true` | 3 retries → fallback branch; fails at *Stop and Error* with the custom message |
| 11 Geocoding | as published | **12** cities in 4 batches with pauses, sorted |
| 12 Sub-workflow | 12b linked to a published 12a | 3 events → 3 sub-executions → formatted messages |
| 14 CSV cleaning | sample file served locally | 13 rows → 9 valid + 4 rejected → **7** unique |
| 18 PDF invoice | sample file served locally | All fields parsed, totals check passes → *Book Invoice* |
| 20 Scraping | as published | 3 pages → **60** books → filtered → CSV |

### Called over HTTP on a running n8n server

| Recipe | Asserted |
|---|---|
| 01 Webhook | `POST /webhook/hello` returns the greeting JSON |
| 04 Form → Sheets (Sheets disabled) | Form page renders; submission is trimmed, lower-cased and routed to *urgent* (checked in the stored execution) |
| 09 AI triage (mock OpenAI) | 4 tickets → structured extraction → each reaches the correct Switch output |
| 10 Error workflow | A **production** failure in 10b automatically starts the published error workflow 10a |
| 13 HMAC webhook | Valid signature → 200; tampered body → 401; missing signature → 401 |
| 15 AI agent (mock OpenAI) | Agent calls the live currency tool, then the calculator; the follow-up question uses **memory** |
| 16 Human approval | ≤ 100 → auto-approved; > 100 → paused; opening the approve/reject link resumes the **same** execution and shows the confirmation page |
| 17 HTML dashboard | `?base=USD` → 200 `text/html` page; malicious `base` falls back to EUR |
| 19 Data Tables CRM | Table created (twice, safely); insert, **partial** update keeps stored fields, 400 on bad email, list + `?stage=` filter |

Helper scripts: `make-test-variants.mjs` (test-only copies), `summarize-execution.mjs` and `inspect-executions.mjs` (per-node item counts and outputs), and `mock-openai.mjs`. The mock is a deterministic fake OpenAI endpoint: it classifies tickets by keyword for 09, and makes tool calls for the agent in 15.

### Latest result

n8n **2.42.7**, Node.js 24.21, 2026-10-13:

```
== Importing workflows                          22 / 22 ✓
== Executing workflows with the CLI             13 / 13 ✓
== Failing on purpose (10b)                      1 /  1 ✓
== Live server tests                            24 / 24 ✓
== Stored executions (04 data, 09 routing)       5 /  5 ✓
== Result: 65 passed, 0 failed
```

## Bugs found by running the workflows for real

Static checks passed on all of these. Only real execution revealed them, and each fix plus an explanation is now part of the recipe:

| Recipe | What went wrong | Fix |
|---|---|---|
| 08 | Every user showed 0 completed todos. *Summarize* outputs the group key as text (`"1"`), the users API as a number (`1`), so *Merge* never matched. | *Fuzzy Compare* on, plus a "types" warning in the README |
| 12 | `Workflow is not active and cannot be executed` | In n8n 2.x, sub-workflows must be **published** before production callers can use them. Documented in the setup steps. |
| 15 | `… has a "supplyData" method but no "execute" method` | The legacy *HTTP Request Tool (LangChain)* node doesn't work with the current AI Agent; switched to the standard HTTP Request node as a tool with `$fromAI()` |
| 16 | Approval links returned `Invalid token` | n8n 2.x adds `?signature=…` to `$execution.resumeUrl`, so extra parameters must be appended with `&`, not `?` |
| 19 | A partial update (`{"email", "stage"}`) wiped the stored company name | Upsert writes every mapped column; added *Find Existing → Merge With Existing* before the upsert |
| 20 | `URL is not defined` | The Code-node sandbox has no `URL` class; links are joined as strings |
| 10 (docs) | The README said error workflows don't need publishing | In 2.x they **must** be published; corrected, and now covered by the live test |
| 03 | A single network hiccup on the RSS feed failed the run | *Retry On Fail* on the feed node |

## What is *not* covered automatically

These parts need your own accounts, so they were not run against the real services:

- sending a real email over SMTP (03)
- appending a row to a real Google Sheet (04)
- calling the real OpenAI API (09, 15). The node wiring, prompts, tool calls, memory and parsing are tested with the mock; answer quality depends on the model you choose.
- posting to a real Slack/Discord webhook (02, 06, 07, 10a, 12a, 16; those nodes ship disabled)

If something breaks for you on a newer n8n version, please [open an issue](https://github.com/YalinMa/n8n-cookbook/issues).
