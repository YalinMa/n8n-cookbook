# 08 · Merge Data from Two APIs

**English** · [简体中文](README.zh-CN.md)

> Join data from two sources on a shared key (like a SQL `JOIN`) to build a combined report.

| Difficulty | Time | Credentials | Nodes used |
|---|---|---|---|
| ⭐⭐ Intermediate | 10 min | None | HTTP Request ×2, Filter, Summarize, Merge, Edit Fields, Sort |

```
                ┌─▶ Get Users ─────────────────────────────────────────────┐ input 1
Manual Trigger ─┤                                                          ├─▶ Merge by User ID ─▶ Build Report Row ─▶ Rank Users
                └─▶ Get Todos ─▶ Only Completed ─▶ Count per User ─────────┘ input 2
                    (200 items)    (Filter)         (Summarize)
```

## What you'll learn

- Running **parallel branches** from one trigger
- **Summarize**: group by a field and count (like `GROUP BY userId`)
- **Merge → Combine → Matching Fields**: join two lists where `users.id = todos.userId`
- The different **join modes** (inner, left, outer)
- How the HTTP Request node splits a JSON **array** response into separate items

## Setup

1. Import [`workflow.json`](workflow.json).
2. No credentials needed. The data comes from [JSONPlaceholder](https://jsonplaceholder.typicode.com/), a free fake REST API with 10 users and 200 todos.

## Try it

Click **Test workflow** and open **Rank Users**:

| Name | Email | Company | City | Completed Todos | Completion Rate |
|---|---|---|---|---|---|
| Chelsey Dietrich | Lucio_Hettinger@annie.ca | Keebler LLC | Roscoeview | 12 | 60% |
| Clementina DuBuque | Rey.Padberg@karina.biz | Hoeger LLC | Lebsackbury | 12 | 60% |
| Leanne Graham | Sincere@april.biz | Romaguera-Crona | Gwenborough | 11 | 55% |
| … | | | | | |

(Each user has 20 todos.)

## How it works

| Node | What it does |
|---|---|
| **Get Users** / **Get Todos** | Two plain `GET` requests. The API returns a JSON array, so n8n makes **one item per element** automatically. |
| **Only Completed** | Keeps todos where `completed` is true. |
| **Count per User** | Summarize: *Count* of `id`, split by `userId`. Output: one item per user with `userId` and `count_id`. |
| **Merge by User ID** | *Combine → Matching Fields*, `id` (input 1) = `userId` (input 2). Output type **Enrich Input 1** keeps *all* users, even those with 0 completed todos (a left join). *Options → Fuzzy Compare* is **on**. See the warning below. |
| **Build Report Row** | Picks and renames the columns we want. `$json.company.name` reaches into nested objects. |
| **Rank Users** | Sorts by completed todos, highest first. |

> ⚠️ **The #1 Merge gotcha: types.** *Summarize* outputs the group-by key as **text** (`"userId": "1"`), but the users API has a **number** (`"id": 1`). With a strict compare, `1 ≠ "1"`, so nothing matches and every user shows 0. *Fuzzy Compare* treats `1` and `"1"` as equal. Turn it off and run again to see the problem for yourself.

### Merge output types cheat sheet

| Output type | SQL equivalent | Keeps |
|---|---|---|
| Keep Matches | `INNER JOIN` | Only rows found in both inputs |
| Keep Non-Matches | anti-join | Rows found in only one input |
| Keep Everything | `FULL OUTER JOIN` | All rows from both |
| Enrich Input 1 | `LEFT JOIN` | All of input 1 + matching data from input 2 |
| Enrich Input 2 | `RIGHT JOIN` | All of input 2 + matching data from input 1 |

The Merge node can also *Append* (stack both lists) or combine *By Position* (row 1 with row 1…).

## Ideas to extend

- Real-world pairs: CRM contacts + invoices (who hasn't paid?), employees + tickets (who's overloaded?), Shopify orders + shipping status.
- Export the result with **Convert to File** (see [example 05](../05-api-to-csv-export/)).
- Use **Merge → SQL Query** mode for complex joins in real SQL.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Merge outputs nothing / no matches | The match fields have different **types** (string `"1"` vs number `1`). Enable *Options → Fuzzy Compare* or convert one side. |
| Every user shows 0 completed | The field names in **Merge** don't match. Check what **Count per User** really outputs (`userId`, `count_id`). |
| Only one branch ran | Both branches must be connected to the same trigger output. |
