# 03 · RSS News Digest by Email

**English** · [简体中文](README.zh-CN.md)

> Read an RSS feed every weekday morning, keep the fresh stories and email them as one tidy digest.

| Difficulty | Time | Credentials | Nodes used |
|---|---|---|---|
| ⭐⭐ Beginner+ | 15 min | SMTP | Schedule Trigger (cron), RSS Read, Filter, Limit, Aggregate, Edit Fields, Send Email |

```
Weekdays 08:00 ─┐
                ├─▶ Read RSS Feed ─▶ Only Last 24 Hours ─▶ Top 10 ─▶ Combine Into One ─▶ Build Email HTML ─▶ Send Digest Email
Manual Trigger ─┘    (30 items)          (Filter)          (Limit)      (Aggregate)         (Set)              (SMTP)
```

## What you'll learn

- **Cron expressions** in the Schedule Trigger (`0 8 * * 1-5` means 08:00 Monday to Friday)
- Filtering items by **date** with `$now.minus({ days: 1 })`
- The single most important n8n concept: **many items vs. one item**. Most nodes run once *per item*. **Aggregate** collapses them into one so you send one email, not ten.
- Building HTML with an inline JavaScript expression (`.map(...).join('')`)

## Setup

1. Import [`workflow.json`](workflow.json).
2. **Create an SMTP credential.** Open **Send Digest Email → Credential → Create new** and fill in your provider's SMTP settings:

   | Provider | Host | Port | SSL/TLS | Password |
   |---|---|---|---|---|
   | Gmail | `smtp.gmail.com` | 465 | on | an [App Password](https://support.google.com/accounts/answer/185833), not your normal password |
   | Outlook / Microsoft 365 | `smtp.office365.com` | 587 | off (STARTTLS) | your password or app password |
   | Any other | see your provider's docs | | | |

   Prefer OAuth over SMTP? Replace the node with the **Gmail** or **Microsoft Outlook** node. The rest of the workflow stays the same.
3. In **Send Digest Email**, set **From Email** and **To Email**.
4. *(Optional)* Change the feed URL in **Read RSS Feed**. Any RSS/Atom feed works, for example `https://hnrss.org/newest?q=n8n` or a blog's `/feed` URL.

## Try it

Click **Test workflow** and check your inbox. Watch the item counts on the connections: about 30 → about 15 → 10 → **1**.

Then **publish** the workflow so it runs on weekdays at 08:00.

## How it works

| Node | What it does |
|---|---|
| **Weekdays 08:00** | Schedule Trigger in *Custom (Cron)* mode. |
| **Read RSS Feed** | Fetches the feed. Each article becomes one item with `title`, `link`, `isoDate`, `content`… *Settings → Retry On Fail* (3 tries, 5 s apart) rides out short network hiccups. |
| **Only Last 24 Hours** | Filter node. It keeps items where `isoDate` is *after* now − 1 day. |
| **Top 10** | Limit node. It keeps the first 10 items. |
| **Combine Into One** | Aggregate node, *All Item Data* mode. 10 items become 1 item with an `articles` array. |
| **Build Email HTML** | Builds `subject` and `html` with expressions. `$json.articles.map(a => ...)` loops inside an expression. |
| **Send Digest Email** | Sends the HTML email over SMTP. |

> **No new articles?** If the Filter outputs nothing, every later node is skipped, so no empty email goes out. That is exactly what we want.

## Ideas to extend

- Combine several feeds: add more **RSS Read** nodes and join them with a **Merge** node (*Append* mode).
- Only keep stories that mention keywords: add a second Filter condition, *title → contains → `AI`*.
- Summarise each article with an LLM before sending (see [example 09](../09-ai-support-ticket-triage/) for how AI nodes plug in).
- Post the digest to Slack or Notion instead of email.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `Invalid login` / `535 Authentication failed` | Gmail needs an App Password, which requires 2-Step Verification. |
| Email arrives as raw HTML text | Make sure you set the **HTML** field, not **Text**. |
| Filter drops everything | Some feeds don't provide `isoDate`. Look at the **Read RSS Feed** output and switch the condition to `pubDate`. |
