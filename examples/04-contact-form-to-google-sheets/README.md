# 04 · Contact Form to Google Sheets

> Publish a hosted web form with n8n and save every submission as a row in Google Sheets.

| Difficulty | Time | Credentials | Nodes used |
|---|---|---|---|
| ⭐⭐ Beginner+ | 15 min | Google Sheets (OAuth2) | n8n Form Trigger, Edit Fields, Google Sheets, IF, No Op |

```
Contact Form ─▶ Clean Up Data ─▶ Append Row to Sheet ─▶ Is Urgent? ─┬─ true ─▶ Notify Team (placeholder)
 (hosted form)   (trim, lower-     (Google Sheets)                   └─ false ─▶ (end)
                  case, timestamp)
```

## What you'll learn

- Creating a **form without a website** using the n8n Form Trigger
- **Cleaning data** before storing it (trim spaces, normalise email, add a timestamp)
- Connecting a **Google credential** and **auto-mapping** columns to a sheet
- Branching with an **IF** node

## Setup

1. **Create the spreadsheet.** Make a new Google Sheet and put these exact headers in row 1:

   | Submitted At | Name | Email | Topic | Message | Urgent |
   |---|---|---|---|---|---|

2. Import [`workflow.json`](workflow.json).
3. **Connect Google.** Open **Append Row to Sheet → Credential → Create new → Google Sheets OAuth2 API**.
   - **n8n Cloud:** click **Sign in with Google**. Done.
   - **Self-hosted:** you need your own OAuth client from Google Cloud Console. Follow n8n's [Google OAuth guide](https://docs.n8n.io/integrations/builtin/credentials/google/oauth-single-service/). In short: create a project, enable the *Google Sheets API* and *Google Drive API*, create an *OAuth client ID (Web application)* with n8n's redirect URL, then paste the Client ID and Secret.
4. In **Append Row to Sheet**, choose your spreadsheet under **Document** and the tab under **Sheet**.

## Try it

1. Click **Test workflow**. Open the **Contact Form** node and copy the **Test URL**, or click *Open form* in the node.
2. Fill in the form and submit it.
3. A new row appears in your sheet. If you answered *Yes* to "Is this urgent?", the run continues down the **true** branch.

Publish the workflow and share the **Production URL** with real users. You can also embed it in a page with an `<iframe>`.

## How it works

| Node | What it does |
|---|---|
| **Contact Form** | Form Trigger. Each field's label becomes the key in `$json` (for example `$json.Email`, `$json['Is this urgent?']`). |
| **Clean Up Data** | Renames and normalises fields. Field names here match the sheet headers exactly. That is what makes auto-mapping work. |
| **Append Row to Sheet** | Google Sheets → *Append Row*, mapping mode *Map Automatically*: every field whose name matches a header goes into that column. |
| **Is Urgent?** | IF node. The **true** output goes on to notify someone; the **false** output ends. |
| **Notify Team (placeholder)** | A *No Op* node. Replace it with a Slack, Email or Telegram node. |

## Ideas to extend

- **Avoid duplicates:** use the Sheets operation *Append or Update Row* and match on `Email`.
- **Send an auto-reply** to the submitter with the **Send Email** or **Gmail** node.
- **Spam filter:** add a hidden "website" field and drop submissions where it is filled.
- Store the data in **Airtable**, **Notion**, **HubSpot** or a database instead of Sheets.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `Column names were updated after the node's setup` | Re-open the node and refresh the columns, or check the header row has no typos. |
| Data lands in the wrong columns / extra columns | Headers must match the field names in **Clean Up Data** exactly, including case and spaces. |
| Google says `redirect_uri_mismatch` (self-hosted) | Copy the *OAuth Redirect URL* shown in the n8n credential dialog into the Google Cloud OAuth client. |
| Form says "Problem loading form" | The Test URL only works while you are listening (*Test workflow*); the Production URL only works when the workflow is published. |
