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
export N8N_RUNNERS_BROKER_PORT="${N8N_RUNNERS_BROKER_PORT:-5689}"
export DB_SQLITE_POOL_SIZE=1
# `n8n execute` doesn't run the background service that registers published
# workflows, so let sub-workflow calls (recipe 12) read the published version directly.
export N8N_USE_WORKFLOW_PUBLICATION_SERVICE=false
FILES_PORT="${FILES_PORT:-5699}"
export FILES_PORT
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

# Test variants of workflows that cannot run as-is here (see make-test-variants.mjs):
# disabled credential nodes, mock OpenAI credential, linked sub-workflow (12),
# local sample files (14, 18), setup webhook (19), fail-on-purpose (10b), sample error (10a).
node "$ROOT/scripts/make-test-variants.mjs" "$ROOT" "$tmp"
for v in "$tmp"/variant-*.json; do $N8N import:workflow --input="$v" >/dev/null 2>&1; done
$N8N import:credentials --input="$tmp/mock-credential.json" >/dev/null 2>&1
$N8N publish:workflow --id=cookbookvariant12a >/dev/null 2>&1

# Serve examples/ locally for the sample files of recipes 14 and 18.
python3 -m http.server "$FILES_PORT" --bind 127.0.0.1 --directory "$ROOT/examples" >"$N8N_USER_FOLDER/files.log" 2>&1 &
files=$!
trap 'kill $files 2>/dev/null' EXIT
sleep 1

# Map workflow name -> id
list=$($N8N list:workflow 2>/dev/null)
id_of() { echo "$list" | grep -F "|$1" | head -1 | cut -d'|' -f1; }

# Executed with the CLI: "workflow name|node whose output to print|regex the summary must contain"
RUNNABLE=(
  "02 · Daily Weather Report|Format Message|Good morning! Weather for Berlin"
  "03 · RSS News Digest by Email [test: email disabled]|Build Email HTML|Combine Into One +items out: \\[1\\]"
  "05 · API Data to CSV Export|Convert to CSV|One Item per Product +items out: \\[194\\]"
  "06 · Website Uptime Monitor|Build Alert|2 site\\(s\\) down"
  "07 · GitHub Release Watcher|Build Message|New release of"
  "08 · Merge Data from Two APIs|Rank Users|\"Completed Todos\":1[0-9]"
  "10a · Error Alert (Error Workflow) [test: sample error]|Build Alert|Workflow \\*10b"
  "10b · Error Handling Demo|Use Fallback Data|\"source\":\"fallback\""
  "11 · Batch Geocoding with Rate Limits|Sort by Population|Loop Over Items +items out: \\[12, 0\\]"
  "12b · Order Events (Uses Sub-workflow) [test: linked]|Notify via Sub-workflow|Low stock: MUG-BLUE"
  "14 · Clean & Deduplicate a Contact List [test: local file]|Sort by Name|Remove Duplicate Emails +items out: \\[7\\]"
  "18 · PDF Invoice Parser [test: local file]|Check Totals|Book Invoice \\(placeholder\\) +items out: \\[1\\]"
  "20 · Web Scraping with the HTML Node|Cheapest First|One Item per Book +items out: \\[60\\]"
)

echo "== Executing workflows with the CLI"
for entry in "${RUNNABLE[@]}"; do
  IFS='|' read -r name shownodes expect <<<"$entry"
  id=$(id_of "$name")
  if [ -z "$id" ]; then bad "$name (not imported)"; continue; fi
  out=$($N8N execute --id="$id" --rawOutput 2>&1)
  summary=$(echo "$out" | node "$ROOT/scripts/summarize-execution.mjs" "$shownodes")
  status=$?
  if [ $status -eq 0 ] && echo "$summary" | grep -qE "$expect"; then ok "$name"; else bad "$name (expected /$expect/)"; fi
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
            "09 · AI Support Ticket Triage [test: mock OpenAI]" \
            "13 · Secure Webhook with HMAC Signature" \
            "15 · AI Agent with Tools & Memory [test: mock OpenAI]" \
            "16 · Human-in-the-Loop Expense Approval" \
            "17 · HTML Dashboard from a Webhook" \
            "19 · Mini CRM with Data Tables [test: setup webhook]" \
            "10a · Error Alert (Error Workflow) [test: live]" \
            "10b · Error Handling Demo [test: live failure]"; do
  wid=$(id_of "$name")
  $N8N publish:workflow --id="$wid" >/dev/null 2>&1
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

H="http://localhost:$PORT"
expect_in() { # expect_in <label> <regex> <text>
  if echo "$3" | grep -qE "$2"; then ok "$1 → $(echo "$3" | head -c 220)"; else bad "$1 (expected /$2/) → $(echo "$3" | head -c 400)"; fi
}

# 13 · signed webhook
SECRET="change-me-to-a-long-random-secret"
BODY='{"event":"order.paid","data":{"orderId":"A-1001","amount":129.9}}'
SIG=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$SECRET" | sed 's/^.*= //')
signed() { curl -s -w ' [%{http_code}]' -X POST "$H/webhook/signed-webhook" -H 'Content-Type: application/json' "$@"; }
expect_in "13 valid signature"   '"ok":true.*\[200\]' "$(signed -H "X-Signature-256: sha256=$SIG" -d "$BODY")"
expect_in "13 tampered body"     '\[401\]'            "$(signed -H "X-Signature-256: sha256=$SIG" -d "${BODY/129.9/1.0}")"
expect_in "13 missing signature" '\[401\]'            "$(signed -d "$BODY")"

# 15 · AI agent: tool use + memory
chat() { curl -s -X POST "$H/webhook/15000000-0000-4000-8000-0000000000aa/chat" -H 'Content-Type: application/json' \
  -d "{\"action\":\"sendMessage\",\"sessionId\":\"test-session\",\"chatInput\":\"$1\"}"; }
expect_in "15 currency question" '250 EUR is about [0-9.]+ JPY \(ECB rate' "$(chat 'How many Japanese yen is 250 euros?')"
expect_in "15 follow-up (memory)" '250 EUR is about [0-9.]+ USD'          "$(chat 'And in US dollars?')"

# 16 · human approval
expense() { curl -s -X POST "$H/webhook/expense" -H 'Content-Type: application/json' -d "$1"; }
expect_in "16 small expense" '"auto_approved"' "$(expense '{"employee":"Ada","amount":42.5,"description":"Taxi"}')"
for decision in approve reject; do
  resp=$(expense '{"employee":"Grace","amount":850,"description":"Conference ticket"}')
  url=$(echo "$resp" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{try{console.log(JSON.parse(s)['${decision}Url'])}catch{console.log('')}})")
  sleep 2
  word=$([ "$decision" = approve ] && echo approved || echo rejected)
  expect_in "16 manager clicks $decision" "Expense $word.*850.00" "$(curl -s "$url" | tr -d '\n')"
done

# 17 · HTML dashboard
expect_in "17 dashboard (USD)"      '<h1>1 USD =</h1>.*\[200 text/html'  "$(curl -s -w ' [%{http_code} %{content_type}]' "$H/webhook/fx-dashboard?base=USD" | tr -d '\n')"
expect_in "17 bad input → EUR"      '<h1>1 EUR =</h1>'                     "$(curl -s "$H/webhook/fx-dashboard?base=%3Cscript%3E" | tr -d '\n')"

# 19 · Data Tables CRM
curl -s "$H/webhook/crm/setup" >/dev/null; sleep 1
crm() { curl -s -w ' [%{http_code}]' -X POST "$H/webhook/crm/contacts" -H 'Content-Type: application/json' -d "$1"; }
expect_in "19 add Ada"            '"id":1.*"stage":"lead"'      "$(crm '{"email":"Ada@Example.com","name":"Ada Lovelace","company":"Analytical Engines","stage":"lead"}')"
expect_in "19 add Grace"          '"id":2'                      "$(crm '{"email":"grace@navy.example","name":"Grace Hopper","company":"US Navy","stage":"customer"}')"
expect_in "19 partial update Ada" '"id":1.*"company":"Analytical Engines".*"stage":"qualified"' "$(crm '{"email":"ada@example.com","name":"Ada Lovelace","stage":"qualified","notes":"Demo booked"}')"
expect_in "19 invalid email"      '\[400\]'                     "$(crm '{"email":"nope"}')"
expect_in "19 list all"           '"count":2'                   "$(curl -s "$H/webhook/crm/contacts")"
expect_in "19 filter by stage"    '"count":1,"stage":"qualified"' "$(curl -s "$H/webhook/crm/contacts?stage=qualified")"

# 10 · a real production failure triggers the published error workflow
curl -s "$H/webhook/fail-demo" >/dev/null
if [ -n "${N8N_MODULES:-}" ] || [ -x "${N8N%% *}" ]; then
  mods="${N8N_MODULES:-$(cd "$(dirname "${N8N%% *}")/.." && pwd)}"
  for _ in $(seq 1 20); do
    alert=$(N8N_MODULES="$mods" node "$ROOT/scripts/inspect-executions.mjs" "$N8N_USER_FOLDER/.n8n/database.sqlite" "[test: live]" "Build Alert" 2>/dev/null)
    echo "$alert" | grep -q "Stop and Error" && break
    sleep 1
  done
  expect_in "10 failure in 10b started error workflow 10a" 'Workflow \*10b · Error Handling Demo \[test: live failure\]\* failed.*Node: Stop and Error' "$(echo "$alert" | tr -d '\n')"
fi

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
