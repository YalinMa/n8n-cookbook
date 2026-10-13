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

Spins up a throw-away n8n instance in `.n8n-test/` (git-ignored), imports everything with the n8n CLI and **actually runs it** against the live public APIs.

```bash
# Node.js 24+ required (n8n 2.x)
./scripts/test-in-n8n.sh
# or with a local install:
N8N=/path/to/node_modules/.bin/n8n ./scripts/test-in-n8n.sh
```

| Recipe | How it's tested | What is asserted |
|---|---|---|
| All 11 files | `n8n import:workflow` | Imports cleanly into n8n 2.42 |
| 02 Weather | `n8n execute` | Open-Meteo call + formatted message |
| 03 RSS digest | `n8n execute`, email node disabled | Feed read → filter → top 10 → 1 aggregated item → HTML |
| 04 Form → Sheets | Live server, Sheets node disabled, real form `GET` + `POST` | Form renders; submission is trimmed, lower-cased, timestamped; *urgent* goes down the *true* branch |
| 05 CSV export | `n8n execute` | 4 paginated requests → 194 products → filtered → CSV file produced |
| 06 Uptime | `n8n execute` | 2 healthy sites, 2 down (HTTP 503 + DNS failure) → one alert listing both |
| 07 Releases | `n8n execute` | 3 repos → 3 "new release" messages on first run |
| 08 Merge | `n8n execute` | 10 users joined with completed-todo counts (non-zero) |
| 09 AI triage | Live server + **mock OpenAI server** (`scripts/mock-openai.mjs`) | 4 tickets → structured extraction → each routed to the correct Switch output |
| 10a Error alert | `n8n execute`, Error Trigger swapped for a sample error payload | Alert text built from the error data |
| 10b Error demo | `n8n execute` twice | 3 retries → error branch → fallback; with `failOnPurpose=true` it fails at *Stop and Error* with the custom message |
| 01 Webhook | Live server, `curl` | `POST /webhook/hello` returns the greeting JSON |

Helper scripts: `make-test-variants.mjs` (test-only copies of 03/04/09/10a/10b), `summarize-execution.mjs` and `inspect-executions.mjs` (per-node item counts and outputs), `mock-openai.mjs`.

### Latest result

n8n **2.42.7**, Node.js 24.21, 2026-10-13:

```
== Importing workflows                     11 / 11 ✓
== Executing credential-free workflows      8 /  8 ✓
== Failing on purpose (10b)                 1 /  1 ✓
== Live server tests (webhook, form, AI)    7 /  7 ✓
== Stored executions (04 data, 09 routing)  5 /  5 ✓
== Result: 32 passed, 0 failed
```

### Bug found by the real run

The first real run of **08** showed every user with *0* completed todos, even though the static checks passed. The *Summarize* node outputs the group-by key as a string (`"1"`), while the users API has a number (`1`), so the Merge never matched. The fix (*Fuzzy Compare*) and an explanation are now part of the recipe. This is why the workflows are run, not just linted.

### What is *not* covered automatically

These parts need your own accounts, so they were not run against the real services:

- sending a real email over SMTP (03)
- appending a row to a real Google Sheet (04)
- calling the real OpenAI API (09). The node wiring, prompt and parsing are tested with the mock; output quality depends on the model you choose.
- posting to a real Slack/Discord webhook (02, 06, 07, 10a; those nodes ship disabled)
- an Error Workflow being triggered by a real production failure (10). The CLI cannot start from an Error Trigger, so 10a is tested with a sample payload.

If something breaks for you on a newer n8n version, please [open an issue](https://github.com/YalinMa/n8n-cookbook/issues).
