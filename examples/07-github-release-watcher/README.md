# 07 · GitHub Release Watcher

> Watch GitHub repositories and get notified **once** when a new release ships. No duplicates, no database.

| Difficulty | Time | Credentials | Nodes used |
|---|---|---|---|
| ⭐⭐ Intermediate | 10 min | None (optional chat webhook URL) | Schedule Trigger, Code, HTTP Request, Edit Fields |

```
Every Hour ─────┐
                ├─▶ Repos to Watch ─▶ Get Latest Release ─▶ Keep Only New Releases ─▶ Build Message ─▶ Send to Chat (disabled)
Manual Trigger ─┘     (3 items)        (GitHub REST API)     (static-data memory)
```

## What you'll learn

- Calling a public API with **dynamic URLs** (`/repos/{{ $json.repo }}/releases/latest`) and custom **headers**
- **Deduplication**: remembering what you've already processed between runs with `$getWorkflowStaticData('global')`
- Stopping a workflow early by returning **zero items**
- The difference between **manual** and **production** executions

## Setup

1. Import [`workflow.json`](workflow.json).
2. Edit the list in **Repos to Watch** (`owner/name`, for example `facebook/react`).
3. *(Optional)* Paste a Slack/Discord webhook URL into **Send to Chat** and enable it.
4. **Activate** the workflow.

> **GitHub rate limit.** Unauthenticated requests are limited to 60/hour per IP. With 3 repos checked hourly that's fine. If you watch many repos, create a GitHub credential (*Header Auth*: `Authorization: Bearer <token>`) on **Get Latest Release** for 5 000/hour.

## Try it

Click **Test workflow**. Because manual runs don't keep memory, **every** release is "new" and you'll see 3 messages in **Build Message**:

```
🚀 New release of *n8n-io/n8n*: n8n@2.x.y
https://github.com/n8n-io/n8n/releases/tag/n8n@2.x.y
```

In production (workflow active), the first run stores the current tags. After that you only hear about releases published since the last check.

## How it works

| Node | What it does |
|---|---|
| **Repos to Watch** | Returns one item per repo. |
| **Get Latest Release** | `GET https://api.github.com/repos/<repo>/releases/latest`. GitHub requires a `User-Agent` header. |
| **Keep Only New Releases** | Loads `memory = $getWorkflowStaticData('global')` and compares each `tag_name` with `memory.lastTags[repo]`. It saves the new tag and returns only items that changed. n8n saves `memory` automatically after a successful **production** run. |
| **Build Message** / **Send to Chat** | Formats and posts the notification. |

### When to use static data vs. a real database

| Static data | Database / Google Sheets / Redis |
|---|---|
| Small (a few KB), simple key–value | Large or growing data |
| Only this workflow needs it | Other workflows or people need it |
| Losing it is harmless (worst case: one duplicate alert) | Must never be lost |

n8n also has a built-in **Remove Duplicates** node with *Remove Items Processed in Previous Executions*. It's a no-code alternative to this Code node and worth trying next.

## Ideas to extend

- Include the release notes: `release.body` contains the Markdown changelog. Summarise it with an LLM.
- Watch **tags** (`/tags`) for repos that don't publish releases.
- Create a Jira/Linear ticket "Upgrade to vX.Y" automatically.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `404 Not Found` for a repo | The repo has no *releases*, only tags, or the name is misspelled. |
| `403 rate limit exceeded` | Add a GitHub token (see Setup) or check less often. |
| Duplicates keep coming in production | The workflow must finish **successfully** for static data to be saved. Check the executions list for errors. |
