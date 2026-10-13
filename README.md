# 🍳 n8n Cookbook

**20 practical, ready-to-import [n8n](https://n8n.io) workflows, from your first webhook to AI agents.** Each recipe comes with a step-by-step guide, an explanation of every node, and ideas for taking it further.

[![Validate workflows](https://github.com/YalinMa/n8n-cookbook/actions/workflows/validate.yml/badge.svg)](https://github.com/YalinMa/n8n-cookbook/actions/workflows/validate.yml)
![n8n](https://img.shields.io/badge/n8n-2.x-EA4B71)
![License: MIT](https://img.shields.io/badge/license-MIT-blue)

> New to n8n? Start with **[Getting Started](docs/getting-started.md)** (n8n running in 2 minutes), read **[Core Concepts](docs/core-concepts.md)** (the 8 ideas that make everything click), then use the **[Use-Case Guide](docs/use-cases.md)** to see what each recipe is for in real work and which ones to try first.

## Recipes

### Part 1 · Foundations

| # | Recipe | You'll learn | Credentials | Level |
|---|---|---|---|---|
| 01 | [**Hello Webhook API**](examples/01-hello-webhook-api/) | Webhook trigger, expressions, responding to HTTP calls | — | ⭐ |
| 02 | [**Daily Weather Report**](examples/02-daily-weather-report/) | Schedule trigger, HTTP Request, Code node | — | ⭐ |
| 03 | [**RSS News Digest by Email**](examples/03-rss-news-digest-email/) | Cron, Filter, Limit, Aggregate (many → one), email | SMTP | ⭐⭐ |
| 04 | [**Contact Form → Google Sheets**](examples/04-contact-form-to-google-sheets/) | Hosted forms, data cleaning, Google OAuth, IF | Google | ⭐⭐ |
| 05 | [**API Data → CSV Export**](examples/05-api-to-csv-export/) | Pagination, Split Out, Filter, Sort, files | — | ⭐⭐ |
| 06 | [**Website Uptime Monitor**](examples/06-website-uptime-monitor/) | Per-item processing, tolerant HTTP calls, alerting | — | ⭐⭐ |
| 07 | [**GitHub Release Watcher**](examples/07-github-release-watcher/) | Deduplication with static data, dynamic URLs | — | ⭐⭐ |
| 08 | [**Merge Data from Two APIs**](examples/08-merge-data-from-two-apis/) | Parallel branches, Summarize, Merge (JOIN) | — | ⭐⭐ |
| 09 | [**AI Support Ticket Triage**](examples/09-ai-support-ticket-triage/) | LLM structured extraction, AI sub-nodes, Switch | OpenAI* | ⭐⭐⭐ |
| 10 | [**Error Handling & Alerts**](examples/10-error-handling-and-alerts/) | Retries, error outputs, Stop and Error, Error Workflows | — | ⭐⭐⭐ |

### Part 2 · Going further

| # | Recipe | You'll learn | Credentials | Level |
|---|---|---|---|---|
| 11 | [**Batch Geocoding with Rate Limits**](examples/11-batch-geocoding-with-rate-limits/) | Loop Over Items, Wait, retries, "not found" handling | — | ⭐⭐ |
| 12 | [**Reusable Notification Sub-workflow**](examples/12-reusable-notification-subworkflow/) | Execute Workflow, typed inputs, publishing sub-workflows | — | ⭐⭐ |
| 13 | [**Secure Webhook with HMAC Signature**](examples/13-secure-webhook-hmac-signature/) | Raw body, Crypto node, 401 responses | — | ⭐⭐⭐ |
| 14 | [**Clean & Deduplicate a Contact List**](examples/14-clean-and-dedupe-contact-list/) | Extract from File (CSV), regex validation, Remove Duplicates | — | ⭐⭐ |
| 15 | [**AI Agent with Tools & Memory**](examples/15-ai-agent-with-tools-and-memory/) | Chat Trigger, AI Agent, HTTP Request as a tool, `$fromAI()`, memory | OpenAI* | ⭐⭐⭐ |
| 16 | [**Human-in-the-Loop Approval**](examples/16-human-approval-workflow/) | Wait node, `$execution.resumeUrl`, pause & resume | — | ⭐⭐⭐ |
| 17 | [**HTML Dashboard from a Webhook**](examples/17-html-dashboard-from-webhook/) | GET + query params, serving HTML, inline SVG charts | — | ⭐⭐ |
| 18 | [**PDF Invoice Parser**](examples/18-pdf-invoice-parser/) | Extract from PDF, regex parsing, sanity checks | — | ⭐⭐ |
| 19 | [**Mini CRM with Data Tables**](examples/19-mini-crm-with-data-tables/) | n8n's built-in database, upsert, partial updates, REST API | — | ⭐⭐ |
| 20 | [**Web Scraping with the HTML Node**](examples/20-web-scraping-with-html-node/) | CSS selectors, polite batching, cleaning scraped data | — | ⭐⭐ |

<sub>* Or any chat model: Anthropic, Gemini, Ollama (free, local)… Optional chat notifications in 02, 06, 07, 10, 12 and 16 just need a Slack/Discord incoming-webhook URL.</sub>

**16 of the 20 recipes run without any account or API key.** Import them and click *Test workflow*.

## Quick start

```bash
# 1. Run n8n locally (needs Node.js 24+), or use Docker / n8n Cloud, see docs/getting-started.md
npx n8n

# 2. Open http://localhost:5678 and create the owner account
# 3. Workflows → Create → ⋯ → Import from File → pick any examples/*/workflow.json
# 4. Click "Test workflow"
```

You can also import without downloading anything. Copy the **raw** URL of a workflow file, for example

```
https://raw.githubusercontent.com/YalinMa/n8n-cookbook/main/examples/02-daily-weather-report/workflow.json
```

and use **⋯ → Import from URL** in the n8n editor.

## Suggested learning path

```
Part 1   01 Webhook ──▶ 02 Schedule + API ──▶ 03 Many items → one ──▶ 04 Forms + credentials
                                                                              │
            10 Errors ◀── 09 AI ◀── 08 Merge ◀── 07 Memory ◀── 06 Per-item ◀── 05 Pagination
               │
Part 2   11 Loops & rate limits ──▶ 12 Sub-workflows ──▶ 13 Webhook security ──▶ 14 Files & data cleaning
                                                                                          │
            20 Scraping ◀── 19 Data Tables ◀── 18 PDFs ◀── 17 Web pages ◀── 16 Human approval ◀── 15 AI agents
```

Each recipe introduces only a few new ideas and builds on the ones before. Pick by topic:

| I want to… | Recipes |
|---|---|
| Build an API or receive webhooks | 01, 13, 16, 17, 19 |
| Run things on a schedule | 02, 03, 06, 07 |
| Move and transform data | 05, 08, 11, 14, 18, 20 |
| Use AI | 09, 15 |
| Make workflows robust | 10, 11, 12, 13 |
| Store data without external tools | 07 (static data), 19 (Data Tables) |

## What's in each recipe

```
examples/NN-recipe-name/
├── README.md        # what it does, setup, how to test, node-by-node explanation, extensions, troubleshooting
└── workflow.json    # import this into n8n (recipes 10 and 12 have two files; 14 and 18 include sample data)
```

Every workflow also has a **sticky note** inside the canvas that sums up the recipe, so it explains itself after import.

## Repository layout

```
n8n-cookbook/
├── README.md
├── docs/
│   ├── getting-started.md   # install n8n, import a workflow, add credentials
│   ├── core-concepts.md     # items, expressions, triggers, credentials, executions…
│   ├── use-cases.md         # what each recipe is for: real-world scenarios, learning paths
│   ├── cheatsheet.md        # expression & node quick reference
│   └── validation.md        # how the workflows are tested
├── examples/                # the 20 recipes
├── scripts/
│   ├── validate.mjs         # static checks (no dependencies)
│   ├── test-in-n8n.sh       # import + run every workflow in a real n8n instance
│   └── …                    # helpers: test variants, mock OpenAI server, execution inspectors
└── .github/workflows/validate.yml
```

## Validation

Every workflow is checked in two ways:

1. **Static checks** (`node scripts/validate.mjs`): valid JSON, unique node names and IDs, every connection points to a real node, a trigger is present, no orphan nodes, no credentials or secrets committed. These run on every push via GitHub Actions.
2. **Real n8n run** (`./scripts/test-in-n8n.sh`): all 22 files are imported into a real n8n 2.42 instance and **executed** against the live public APIs. Webhook, form, chat, approval and dashboard recipes are called over HTTP on a running server. The AI recipes use a mock OpenAI server, so no key is needed. Each run is checked for the expected data, not just "no error".

**Latest result: 64 / 64 checks passed.** Running the workflows for real caught several bugs that static checks missed. See [docs/validation.md](docs/validation.md) for the full matrix, the bugs found, and what isn't covered (real SMTP / Google / OpenAI accounts).

## Contributing

Ideas, fixes and new recipes are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE). Use these workflows however you like, including commercially.

*n8n is a trademark of n8n GmbH. This is an independent community project.*
