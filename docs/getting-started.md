# Getting Started

This page gets you from zero to a running workflow in about 5 minutes.

## 1. Get n8n running

Pick **one** option.

### Option A: npx (quickest, needs Node.js 24+)

```bash
npx n8n
```

Open <http://localhost:5678>. Your data is stored in `~/.n8n`. Press `Ctrl+C` to stop.

> Check your version with `node -v`. n8n 2.x refuses to start on Node 22 or older. Upgrade Node (for example with [nvm](https://github.com/nvm-sh/nvm): `nvm install 24`) or use Docker.

### Option B: Docker (recommended for keeping n8n running)

```bash
docker volume create n8n_data
docker run -it --rm --name n8n -p 5678:5678 \
  -e GENERIC_TIMEZONE="Europe/Berlin" -e TZ="Europe/Berlin" \
  -v n8n_data:/home/node/.n8n \
  docker.n8n.io/n8nio/n8n
```

Change the timezone to yours. Schedule triggers (recipes 02, 03, 06, 07) use it.

### Option C: n8n Cloud (no install)

Sign up at [n8n.io](https://n8n.io). There is a free trial. Google sign-in for recipe 04 is a one-click setup on Cloud.

> **First launch:** n8n asks you to create an *owner account*. It is a local account for your own instance; the details stay on your machine (or your Cloud workspace).

## 2. Import a recipe

**From a file**

1. Download a `workflow.json` from this repo (or clone the repo).
2. In n8n: **Overview → Create Workflow**. In the editor, open the **⋯** menu (top right) → **Import from File…**
3. Pick the file. The nodes appear on the canvas.

**From a URL**

In the same **⋯** menu choose **Import from URL…** and paste the *raw* GitHub URL:

```
https://raw.githubusercontent.com/YalinMa/n8n-cookbook/main/examples/01-hello-webhook-api/workflow.json
```

**Copy & paste**

Open the JSON file on GitHub, copy all of it and paste it straight onto the n8n canvas (`Ctrl/Cmd + V`).

## 3. Run it

- Click **Test workflow** (the button at the bottom of the canvas).
- Green checkmarks show which nodes ran. The number on each connection is how many **items** passed through.
- Click any node to see its **Input** and **Output**. Switch between *Table*, *JSON* and *Schema* views.

## 4. Add credentials (only recipes 03, 04, 09 and 15)

Credentials are stored **encrypted inside n8n**, never in the workflow JSON. That's why the recipe files are safe to share.

1. Open the node that shows a ⚠️ warning.
2. **Credential to connect with → Create new credential**.
3. Fill in the fields. Each recipe's README says exactly what to enter.
4. Click **Save**. n8n tests the connection.

You can manage all credentials later under **Overview → Credentials**.

## 5. Go live: publish

*Test workflow* runs once, right now. To make a workflow run **by itself** (on a schedule, or whenever a webhook or form is called), click **Publish** at the top of the editor. (In n8n 1.x this was the **Inactive → Active** toggle.) After you edit a published workflow, publish again to put the new version live.

| | Test run (manual) | Production run (published) |
|---|---|---|
| Started by | You clicking *Test workflow* | Schedule, webhook, form, app event |
| Webhook URL | `/webhook-test/...` (one call) | `/webhook/...` (always on) |
| Shows in editor | Yes, live | Under **Executions** |
| Saves static data (recipe 07) | No | Yes |
| Triggers Error Workflow (recipe 10) | No | Yes |

## Next

Read **[Core Concepts](core-concepts.md)** and the **[Use-Case Guide](use-cases.md)**, then open [recipe 01](../examples/01-hello-webhook-api/).
