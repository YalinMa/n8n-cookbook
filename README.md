# 🍳 n8n Cookbook

**10 practical, ready-to-import [n8n](https://n8n.io) workflows for beginners.** Each recipe comes with a step-by-step guide, an explanation of every node, and ideas for taking it further.

[![Validate workflows](https://github.com/YalinMa/n8n-cookbook/actions/workflows/validate.yml/badge.svg)](https://github.com/YalinMa/n8n-cookbook/actions/workflows/validate.yml)
![n8n](https://img.shields.io/badge/n8n-2.x-EA4B71)
![License: MIT](https://img.shields.io/badge/license-MIT-blue)

> New to n8n? Start with **[Getting Started](docs/getting-started.md)** (n8n running in 2 minutes), then read **[Core Concepts](docs/core-concepts.md)** (the 8 ideas that make everything click).

## Recipes

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

<sub>* Or any chat model: Anthropic, Gemini, Ollama (free, local)… Optional chat notifications in 02, 06, 07 and 10 just need a Slack/Discord incoming-webhook URL.</sub>

**7 of the 10 recipes run without any account or API key.** Import them and click *Test workflow*.

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
01 Webhook ──▶ 02 Schedule + API ──▶ 03 Many items → one ──▶ 04 Forms + credentials
                                                                     │
   10 Errors ◀── 09 AI ◀── 08 Merge ◀── 07 Memory ◀── 06 Per-item ◀── 05 Pagination
```

Each recipe introduces only a few new ideas and builds on the ones before.

## What's in each recipe

```
examples/NN-recipe-name/
├── README.md        # what it does, setup, how to test, node-by-node explanation, extensions, troubleshooting
└── workflow.json    # import this into n8n (example 10 has two files)
```

Every workflow also has a **sticky note** inside the canvas that sums up the recipe, so it explains itself after import.

## Repository layout

```
n8n-cookbook/
├── README.md
├── docs/
│   ├── getting-started.md   # install n8n, import a workflow, add credentials
│   ├── core-concepts.md     # items, expressions, triggers, credentials, executions…
│   ├── cheatsheet.md        # expression & node quick reference
│   └── validation.md        # how the workflows are tested
├── examples/                # the 10 recipes
├── scripts/
│   ├── validate.mjs         # static checks (no dependencies)
│   ├── test-in-n8n.sh       # import + run every workflow in a real n8n instance
│   └── …                    # helpers: test variants, mock OpenAI server, execution inspectors
└── .github/workflows/validate.yml
```

## Validation

Every workflow is checked in two ways:

1. **Static checks** (`node scripts/validate.mjs`): valid JSON, unique node names and IDs, every connection points to a real node, a trigger is present, no orphan nodes, no credentials or secrets committed. These run on every push via GitHub Actions.
2. **Real n8n run** (`./scripts/test-in-n8n.sh`): all 11 files are imported into a real n8n 2.42 instance and **executed** against the live public APIs. Webhook, form and AI recipes are called over HTTP. The AI recipe uses a mock OpenAI server, so no key is needed. Data and routing are checked inside the stored executions.

**Latest result: 32 / 32 checks passed.** Running them for real caught one bug that static checks missed. See [docs/validation.md](docs/validation.md) for the full matrix and what isn't covered (real SMTP / Google / OpenAI accounts).

## Contributing

Ideas, fixes and new recipes are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE). Use these workflows however you like, including commercially.

*n8n is a trademark of n8n GmbH. This is an independent community project.*
