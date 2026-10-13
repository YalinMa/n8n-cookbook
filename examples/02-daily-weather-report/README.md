# 02 · Daily Weather Report

> Every morning, fetch the forecast from a public API and turn it into a friendly chat message.

| Difficulty | Time | Credentials | Nodes used |
|---|---|---|---|
| ⭐ Beginner | 10 min | None (optional chat webhook URL) | Schedule Trigger, Manual Trigger, Edit Fields, HTTP Request, Code |

```
Every Day 07:30 ─┐
                 ├─▶ Settings ─▶ Get Forecast ─▶ Format Message ─▶ Send to Chat (disabled)
Manual Trigger ──┘    (city)     (Open-Meteo)     (JavaScript)       (Slack/Discord)
```

## What you'll learn

- Running workflows on a **schedule**
- Calling any REST API with the **HTTP Request** node and **query parameters**
- Writing a little JavaScript in the **Code** node
- Reading data from an *earlier* node with `$('Settings').first().json`
- Why it helps to have **two triggers**: one for production, one for testing

## Setup

1. Import [`workflow.json`](workflow.json).
2. Open **Settings** and change `city`, `latitude` and `longitude`. Find coordinates by searching your city on [open-meteo.com](https://open-meteo.com/en/docs).
3. *(Optional)* To get the message in chat:
   - **Slack:** create an [Incoming Webhook](https://api.slack.com/messaging/webhooks) and copy its URL.
   - **Discord:** *Channel settings → Integrations → Webhooks → New Webhook → Copy URL*.
   - Paste the URL into **Send to Chat → URL**. Then enable the node: right-click → **Enable**, or select it and press `D` (it ships disabled so the example runs without a URL).

   The body sends both `text` (Slack) and `content` (Discord), so the same node works for either.

## Try it

Click **Test workflow**. The Manual Trigger fires. Open **Format Message** and you'll see something like:

```
Good morning! Weather for Berlin today (2026-10-13):
⛅ Partly cloudy
🌡️ 8.1°C – 15.4°C (now 9.3°C)
☔ Chance of rain: 35%
👉 No umbrella needed.
```

To run it every day, **publish** the workflow. Only the Schedule Trigger runs in production; the Manual Trigger is ignored.

## How it works

| Node | What it does |
|---|---|
| **Every Day 07:30** | Schedule Trigger. It uses the timezone set in *Workflow settings → Timezone*, or the instance default. |
| **Manual Trigger** | Lets you test with one click. Both triggers feed the same next node. |
| **Settings** | Keeps all the values you might change in one obvious place. This is a good habit for every workflow. |
| **Get Forecast** | `GET https://api.open-meteo.com/v1/forecast` with query parameters built from expressions like `{{ $json.latitude }}`. |
| **Format Message** | Converts WMO weather codes to emoji and builds a multi-line string. A Code node returns an **array of items**: `[{ json: {...} }]`. |
| **Send to Chat** | Posts the message as JSON to an incoming-webhook URL. |

## Ideas to extend

- Send only when rain is likely: add an **IF** node (`rainChance >= 50`) before *Send to Chat*.
- Report several cities: make **Settings** a Code node that returns one item per city. Every later node then runs once per item automatically.
- Use the native **Slack**, **Telegram** or **Send Email** node instead of the HTTP webhook.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Schedule runs at the wrong hour | Set *Workflow settings → Timezone*, or `GENERIC_TIMEZONE` on self-hosted n8n. |
| `Send to Chat` fails with 404/403 | The webhook URL is wrong or was revoked. Create a new one. |
| `Cannot read properties of undefined (reading 'time')` | The API returned an error. Check **Get Forecast** output, for example for invalid coordinates. |
