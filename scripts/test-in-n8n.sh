#!/usr/bin/env bash
# Import every workflow into a throw-away n8n instance (in .n8n-test/) and run it:
#  - credential-free recipes are executed end to end against the live public APIs
#  - recipes that need credentials run as test variants (email/Sheets disabled,
#    OpenAI replaced by scripts/mock-openai.mjs)
#  - webhook, form and AI recipes are called over HTTP on a running n8n server
#
# Needs Node.js 24+ (n8n 2.x) and internet access. Usage:
#   ./scripts/test-in-n8n.sh                                   # uses `npx n8n`
#   N8N="/path/to/node_modules/.bin/n8n" ./scripts/test-in-n8n.sh
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
N8N="${N8N:-npx --yes n8n}"
PORT="${N8N_PORT:-5679}"

export N8N_USER_FOLDER="$ROOT/.n8n-test"
export N8N_PORT="$PORT"
export N8N_DIAGNOSTICS_ENABLED=false
export N8N_RUNNERS_ENABLED=true
export N8N_SECURE_COOKIE=false
export DB_SQLITE_POOL_SIZE=1
rm -rf "$N8N_USER_FOLDER"
mkdir -p "$N8N_USER_FOLDER"

pass=0; fail=0
ok()  { echo "  ✓ $*"; pass=$((pass+1)); }
bad() { echo "  ✗ $*"; fail=$((fail+1)); }

echo "== n8n version: $($N8N --version 2>/dev/null | tail -1)"

echo "== Importing workflows"
# The CLI importer (unlike the editor's "Import from File") needs a workflow id,
# so we import temporary copies with a generated id.
tmp="$N8N_USER_FOLDER/import"
mkdir -p "$tmp"
n=0
for f in "$ROOT"/examples/*/*.json; do
  rel="${f#$ROOT/}"
  n=$((n+1))
  copy="$tmp/$n.json"
  node -e '
    const fs = require("fs");
    const wf = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
    wf.id = "cookbook" + String(process.argv[3]).padStart(8, "0");
    fs.writeFileSync(process.argv[2], JSON.stringify(wf));
  ' "$f" "$copy" "$n"
  if out=$($N8N import:workflow --input="$copy" 2>&1) && ! echo "$out" | grep -q "error occurred"; then
    ok "$rel"
  else
    bad "$rel"; echo "$out" | tail -5
  fi
done

# Test variants of workflows that cannot run as-is from the CLI:
#  - 03 without its email node (no SMTP credential here)
#  - 10b with failOnPurpose = true (must fail at "Stop and Error")
#  - 10a started by a Manual Trigger + sample error payload (the CLI cannot
#    start from an Error Trigger)
node "$ROOT/scripts/make-test-variants.mjs" "$ROOT" "$tmp"
for v in "$tmp"/variant-*.json; do $N8N import:workflow --input="$v" >/dev/null 2>&1; done
$N8N import:credentials --input="$tmp/mock-credential.json" >/dev/null 2>&1

# Map workflow name -> id
list=$($N8N list:workflow 2>/dev/null)
id_of() { echo "$list" | grep -F "|$1" | head -1 | cut -d'|' -f1; }

# Recipes that run without credentials: "workflow name|nodes whose output to print"
RUNNABLE=(
  "02 · Daily Weather Report|Format Message"
  "05 · API Data to CSV Export|Convert to CSV"
  "06 · Website Uptime Monitor|Build Alert"
  "07 · GitHub Release Watcher|Build Message"
  "08 · Merge Data from Two APIs|Rank Users"
  "10b · Error Handling Demo|Use Fallback Data"
  "03 · RSS News Digest by Email [test: email disabled]|Build Email HTML"
  "10a · Error Alert (Error Workflow) [test: sample error]|Build Alert"
)

echo "== Executing credential-free workflows"
for entry in "${RUNNABLE[@]}"; do
  name="${entry%%|*}"; shownodes="${entry#*|}"
  id=$(id_of "$name")
  if [ -z "$id" ]; then bad "$name (not imported)"; continue; fi
  out=$($N8N execute --id="$id" --rawOutput 2>&1)
  summary=$(echo "$out" | node "$ROOT/scripts/summarize-execution.mjs" "$shownodes")
  if [ $? -eq 0 ]; then ok "$name"; else bad "$name"; fi
  echo "$summary"
done

echo "== Failing on purpose (10b with failOnPurpose = true)"
id=$(id_of "10b · Error Handling Demo [test: fail on purpose]")
out=$($N8N execute --id="$id" --rawOutput 2>&1)
if echo "$out" | grep -q "Stopped on purpose (data source: fallback)"; then
  ok "10b fails at Stop and Error with the custom message"
else
  bad "10b did not fail as expected"; echo "$out" | tail -10
fi

echo "== Live server tests (webhooks, forms, AI with a mock model)"
MOCK_PORT="${MOCK_OPENAI_PORT:-5690}"
for name in "01 · Hello Webhook API" \
            "04 · Contact Form to Google Sheets [test: sheets disabled]" \
            "09 · AI Support Ticket Triage [test: mock OpenAI]"; do
  wid=$(id_of "$name")
  $N8N update:workflow --id="$wid" --active=true >/dev/null 2>&1 || $N8N publish:workflow --id="$wid" >/dev/null 2>&1
done
node "$ROOT/scripts/mock-openai.mjs" "$MOCK_PORT" >"$N8N_USER_FOLDER/mock-openai.log" 2>&1 &
mock=$!
$N8N start >"$N8N_USER_FOLDER/server.log" 2>&1 &
server=$!
for _ in $(seq 1 90); do
  curl -sf "http://localhost:$PORT/healthz" >/dev/null && break
  sleep 1
done
sleep 3

# 01 · webhook
resp=$(curl -s -X POST "http://localhost:$PORT/webhook/hello" -H 'Content-Type: application/json' -d '{"name":"Ada"}')
if echo "$resp" | grep -q '"greeting":"Hello, Ada! 👋"'; then ok "01 POST /webhook/hello → $resp"; else bad "01 POST /webhook/hello → $resp"; fi

# 04 · form (GET renders the page, POST submits it)
form_id="04000000-0000-4000-8000-0000000000aa"
page=$(curl -s "http://localhost:$PORT/form/$form_id")
if echo "$page" | grep -q "Contact us"; then ok "04 GET /form renders the form"; else bad "04 GET /form → $(echo "$page" | head -c 300)"; fi
resp=$(curl -s -X POST "http://localhost:$PORT/form/$form_id" \
  -F "field-0= Ada Lovelace " -F "field-1=ADA@Example.com" -F "field-2=Support" \
  -F "field-3=The export button does nothing." -F "field-4=Yes")
if echo "$resp" | grep -q '"status":200'; then ok "04 POST /form → accepted"; else bad "04 POST /form → $(echo "$resp" | head -c 300)"; fi

# 09 · AI triage, one ticket per category
ticket() { curl -s -X POST "http://localhost:$PORT/webhook/support-ticket" -H 'Content-Type: application/json' -d "$1"; }
check09() {
  local expected="$1" json="$2" resp
  resp=$(ticket "$json")
  if echo "$resp" | grep -q "\"category\":\"$expected\""; then ok "09 → $expected: $resp"; else bad "09 expected $expected → $resp"; fi
}
check09 billing   '{"email":"jane@example.com","subject":"Charged twice this month!!","message":"You billed me twice for the Pro plan. Please refund one."}'
check09 technical '{"email":"sam@example.com","subject":"App won'"'"'t load","message":"Since this morning the dashboard shows a blank page."}'
check09 sales     '{"email":"lee@example.com","subject":"Team plan pricing","message":"We are 40 people. Do you offer volume discounts?"}'
check09 other     '{"email":"kim@example.com","subject":"Love the product","message":"Just wanted to say thanks!"}'

kill "$server" "$mock" 2>/dev/null; wait "$server" "$mock" 2>/dev/null

# Look inside the stored executions to check the data and the routing.
# This needs the `flatted` package from an n8n install (N8N_MODULES = its node_modules).
if [ -z "${N8N_MODULES:-}" ] && [ -x "${N8N%% *}" ]; then
  N8N_MODULES="$(cd "$(dirname "${N8N%% *}")/.." && pwd)"
fi
export N8N_MODULES="${N8N_MODULES:-}"
db="$N8N_USER_FOLDER/.n8n/database.sqlite"
inspect() { node "$ROOT/scripts/inspect-executions.mjs" "$db" "$@"; }

if [ -z "$N8N_MODULES" ] || [ ! -d "$N8N_MODULES/flatted" ]; then
  echo "== Skipping stored-execution checks (set N8N_MODULES to an n8n node_modules folder to enable)"
else
  echo "== Stored executions: 04 (form data cleaned, urgent → true branch)"
  out=$(inspect "04 ·" "Clean Up Data")
  echo "$out"
  if echo "$out" | grep -q '"Email":"ada@example.com"' && echo "$out" | grep -q '"Name":"Ada Lovelace"' && echo "$out" | grep -q 'Notify Team (placeholder)'; then
    ok "04 cleans the data and routes urgent requests"
  else
    bad "04 stored execution looks wrong"
  fi

  echo "== Stored executions: 09 (each ticket reached the right team)"
  out=$(inspect "09 ·")
  echo "$out"
  for team in "Billing Team" "Tech Support" "Sales Team" "General Inbox"; do
    if echo "$out" | grep -q "· $team "; then ok "09 routed a ticket to $team"; else bad "09 never reached $team"; fi
  done
fi
echo
echo "== Result: $pass passed, $fail failed"
[ "$fail" -eq 0 ]
