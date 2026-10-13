# n8n Cheat Sheet

## Expressions

| What | Expression |
|---|---|
| Field of current item | `{{ $json.email }}` |
| Nested / odd field names | `{{ $json.address.city }}`, `{{ $json['Is this urgent?'] }}` |
| Default value | `{{ $json.name \|\| 'stranger' }}`, `{{ $json.brand ?? '' }}` |
| Same item from an earlier node | `{{ $('Webhook').item.json.body.id }}` |
| First item of an earlier node | `{{ $('Settings').first().json.city }}` |
| All items of an earlier node | `{{ $('Get Users').all().length }}` |
| Webhook body / query / headers | `{{ $json.body.x }}`, `{{ $json.query.x }}`, `{{ $json.headers['user-agent'] }}` |
| Item index | `{{ $itemIndex }}` |
| Workflow / execution info | `{{ $workflow.name }}`, `{{ $execution.id }}` |
| Environment variable (self-hosted) | `{{ $env.MY_VAR }}` |
| Ternary | `{{ $json.score > 80 ? 'hot' : 'cold' }}` |
| Array → text | `{{ $json.tags.join(', ') }}` |
| Object → JSON string | `{{ JSON.stringify($json) }}` |

## Dates (Luxon)

| What | Expression |
|---|---|
| Now / today | `{{ $now }}`, `{{ $today }}` |
| Format | `{{ $now.toFormat('yyyy-MM-dd HH:mm') }}` |
| ISO string | `{{ $now.toISO() }}` |
| Maths | `{{ $now.minus({ days: 7 }) }}`, `{{ $now.plus({ hours: 2 }) }}` |
| Parse a string | `{{ DateTime.fromISO($json.created_at) }}` |
| Weekday name | `{{ $now.toFormat('cccc') }}` |
| Unix ms | `{{ $now.toMillis() }}` |

## Cron (Schedule Trigger → Custom)

| Schedule | Cron |
|---|---|
| Every 15 minutes | `*/15 * * * *` |
| Every day at 08:00 | `0 8 * * *` |
| Weekdays at 08:00 | `0 8 * * 1-5` |
| Mondays at 09:30 | `30 9 * * 1` |
| First of the month at midnight | `0 0 1 * *` |

## Which node do I need?

| I want to… | Node |
|---|---|
| Call any API | HTTP Request |
| Add / rename / remove fields | Edit Fields (Set) |
| Keep some items | Filter |
| Go one way or another | IF / Switch |
| Turn an array into items | Split Out |
| Turn items into one array | Aggregate |
| Count / sum / group | Summarize |
| Join two data sources | Merge |
| Sort / take first N | Sort / Limit |
| Skip items seen before | Remove Duplicates |
| Process in batches, with pauses | Loop Over Items + Wait |
| Make or read CSV/XLSX/JSON files | Convert to File / Extract from File |
| Run custom logic | Code |
| Reuse a workflow | Execute Workflow (sub-workflow) |
| Reply to a webhook | Respond to Webhook |
| Fail on purpose | Stop and Error |
| Get alerted on failures | Error Trigger (in an Error Workflow) |

## Keyboard shortcuts (editor)

| Key | Action |
|---|---|
| `Tab` | Open the node panel |
| `Ctrl/Cmd + Enter` | Test workflow |
| `D` | Disable / enable selected node |
| `P` | Pin / unpin selected node's data |
| `Shift + S` | Add sticky note |
| `Ctrl/Cmd + C / V` | Copy / paste nodes (as JSON!) |
| `F2` | Rename node |
| `1` / `0` | Zoom to fit / reset zoom |
