# Use-Case Guide: What Each Recipe Is For

**English** · [简体中文](use-cases.zh-CN.md)

This guide answers three questions for every recipe in the cookbook:

1. **What does it do?** In plain language, no jargon.
2. **When would I use it?** The kind of problem it solves.
3. **Where does it show up in real work?** Concrete scenarios from different jobs.

It does **not** explain setup or individual nodes. That's what each recipe's own README is for.

## How to use this cookbook

| Step | Read | You'll get |
|---|---|---|
| 1 | [Getting Started](getting-started.md) | n8n running on your computer |
| 2 | [Core Concepts](core-concepts.md) | The 8 ideas behind every workflow (items, expressions, triggers…) |
| 3 | **This guide** | Which recipe solves which kind of problem |
| 4 | A recipe's README | Step-by-step setup, testing, how each node works |
| 5 | The workflow in n8n | Click each node, look at its input and output, change things |

Skim this guide first and mark the 3–5 recipes that sound like *your* problems. Then do those READMEs hands-on.

---

## First: what is n8n actually for?

n8n connects apps and data **without you sitting in the middle**. Whenever you catch yourself doing one of these by hand, a workflow can probably do it for you:

- **Copying** information from one place to another (email → spreadsheet, form → CRM)
- **Checking** something regularly (is the website up? is there a new release? did prices change?)
- **Reacting** to an event (a form was submitted, a payment arrived, a ticket came in)
- **Transforming** data (cleaning a messy list, combining two exports, extracting fields from a PDF)
- **Notifying** people (daily summaries, alerts, approval requests)

Every workflow has the same shape:

```
   WHEN something happens   →   DO these steps   →   SEND the result somewhere
   (trigger)                    (nodes)               (email, chat, sheet, API reply…)
```

The 20 recipes are 20 variations of this shape. Each one teaches a pattern you'll reuse again and again.

---

## Find a recipe by problem

| "I want to…" | Recipe |
|---|---|
| …let another app or website send data to n8n | [01](#01--hello-webhook-api) · [13](#13--secure-webhook-with-hmac-signature) |
| …run something automatically every morning or every hour | [02](#02--daily-weather-report) · [03](#03--rss-news-digest-by-email) · [06](#06--website-uptime-monitor) · [07](#07--github-release-watcher) |
| …get a daily or weekly summary by email or chat | [02](#02--daily-weather-report) · [03](#03--rss-news-digest-by-email) |
| …collect information from people with a form | [04](#04--contact-form-to-google-sheets) |
| …export data from an online service into a spreadsheet | [05](#05--api-data-to-csv-export) · [20](#20--web-scraping-with-the-html-node) |
| …be warned when something breaks or changes | [06](#06--website-uptime-monitor) · [07](#07--github-release-watcher) · [10](#10--error-handling--alerts) |
| …combine data from two systems | [08](#08--merge-data-from-two-apis) |
| …use AI to read, sort or answer messages | [09](#09--ai-support-ticket-triage) · [15](#15--ai-agent-with-tools--memory) |
| …process a long list without hitting limits | [11](#11--batch-geocoding-with-rate-limits) |
| …stop repeating the same steps in many workflows | [12](#12--reusable-notification-sub-workflow) |
| …clean up a messy spreadsheet | [14](#14--clean--deduplicate-a-contact-list) |
| …have a person approve something before it continues | [16](#16--human-in-the-loop-expense-approval) |
| …show data on a simple web page | [17](#17--html-dashboard-from-a-webhook) |
| …read information out of PDFs | [18](#18--pdf-invoice-parser) |
| …store data without setting up a database | [07](#07--github-release-watcher) · [19](#19--mini-crm-with-data-tables) |

---

## Part 1 · Foundations

### 01 · Hello Webhook API

**What it does:** Gives n8n its own web address. When something sends data to that address, n8n processes it and sends an answer back.

**Think of it as:** a mailbox with a reply service. A letter comes in, n8n reads it, and an answer goes back right away.

**Use it when** another tool needs to *push* information to you the moment something happens, instead of you checking for it.

**Real-world scenarios**
- **Online shop:** Shopify or WooCommerce calls your webhook on every new order. n8n then updates stock, notifies the warehouse and thanks the customer.
- **Marketing:** a landing-page builder (Webflow, Typeform, Carrd) sends each sign-up to n8n, which adds it to your newsletter tool.
- **Developers:** a tiny internal API ("give me today's on-call person") without writing or hosting a server.
- **Payments:** Stripe tells you "payment succeeded" and n8n unlocks the customer's account.

**For real use you'd change:** what happens between receiving and replying. The webhook-in, reply-out frame stays the same.

**Builds the foundation for:** 09, 13, 16, 17 and 19, which all start with a webhook.

---

### 02 · Daily Weather Report

**What it does:** Every morning, it fetches data from a public service and turns it into a short, friendly message.

**Think of it as:** an assistant who checks something for you at the same time every day and gives you the summary.

**Use it when** you check the same information on a fixed schedule and want it delivered instead.

**Real-world scenarios**
- **Sales:** every Monday at 9:00, post last week's numbers from your CRM to the team channel.
- **Ops / field teams:** a weather warning for outdoor jobs (construction, delivery, events) when rain is likely.
- **Finance:** a daily exchange-rate or stock-price note.
- **Personal:** your calendar, to-dos and weather in one morning message.

**For real use you'd change:** the API you call (any service with a REST API works) and where the message goes (Slack, Teams, Telegram, email).

**Key pattern:** *Schedule → fetch → format → send.* This is probably the most common workflow shape in the world.

---

### 03 · RSS News Digest by Email

**What it does:** Reads a news feed every weekday, keeps only today's stories, and emails them as **one** tidy digest.

**Think of it as:** a personal editor who reads the news for you and sends a one-page summary.

**Use it when** information arrives as many small pieces, but you want **one** summary instead of a flood of notifications.

**Real-world scenarios**
- **Marketing / PR:** a daily digest of mentions of your brand or competitors (Google Alerts and many news sites offer RSS feeds).
- **Product teams:** a weekly email with new posts from the industry blogs you follow.
- **Researchers:** new papers in your field from arXiv or journal RSS feeds.
- **Support:** a nightly list of new forum questions that nobody has answered yet.

**For real use you'd change:** the feed URL(s), the filter (keywords, dates) and the recipients.

**Key pattern:** *many items → filter → combine into one → send once.* Anything that sounds like a "digest" or "summary" uses this.

---

### 04 · Contact Form to Google Sheets

**What it does:** Publishes a web form (n8n hosts it, no website needed), cleans up each submission and adds it as a row in Google Sheets. Urgent requests take a separate path.

**Think of it as:** a receptionist who takes the message, writes it neatly in the log book and runs to you if it's urgent.

**Use it when** people need to send you structured information and you want it to land somewhere organised automatically.

**Real-world scenarios**
- **Small business:** contact or quote-request form → sheet → alert for urgent ones.
- **HR:** job applications, holiday requests or equipment requests.
- **Events:** registrations with dietary needs, straight into the attendee list.
- **IT:** an internal "report a problem" form that routes urgent issues to on-call.

**For real use you'd change:** the form fields, the destination (Airtable, Notion, HubSpot, a Data Table from recipe 19) and what "urgent" triggers (Slack ping, SMS).

**Key pattern:** *collect → clean → store → route.*

---

### 05 · API Data to CSV Export

**What it does:** Downloads **all** records from an online service, even when the service hands them out page by page. Then it keeps the ones you care about and saves them as a spreadsheet file.

**Think of it as:** someone who flips through every page of a catalogue, ticks the items that match your criteria and types them into Excel.

**Use it when** you need data *out* of a tool that has no good export button, or when the export needs filtering every time.

**Real-world scenarios**
- **E-commerce:** a nightly export of products that are low in stock or have bad ratings.
- **Finance:** a monthly export of all invoices from your billing tool for the accountant.
- **Marketing:** all newsletter subscribers who joined this quarter.
- **Analytics:** pull data from a SaaS API into a CSV for Excel, Power BI or Looker Studio.

**For real use you'd change:** the API URL, the pagination settings (the README has a cheat sheet for the common styles) and where the file goes (Google Drive, email, S3).

**Key pattern:** *fetch all pages → split into records → filter → reshape → export.*

---

### 06 · Website Uptime Monitor

**What it does:** Every 5 minutes it visits a list of websites. If any are down, it sends **one** alert listing all of them.

**Think of it as:** a night watchman who walks past every door, and only wakes you if something is wrong.

**Use it when** you need to know quickly that something stopped working, before your customers tell you.

**Real-world scenarios**
- **Freelancers / agencies:** monitor all your clients' websites from one workflow.
- **Developers:** check that your app's health endpoints and APIs respond.
- **E-commerce:** make sure the checkout page loads (and contains the word "Checkout").
- **IT:** watch internal tools (intranet, VPN portal) for outages.

**For real use you'd change:** the URL list (or read it from a sheet), the check interval and the alert channel. Recipe 07's memory trick avoids repeated alerts for the same outage.

**Key pattern:** *list of things → check each → collect the failures → alert once.* The same pattern works for SSL expiry, domain renewal and disk space checks.

---

### 07 · GitHub Release Watcher

**What it does:** Every hour, it checks whether a few software projects published a new version. It only notifies you when something is **actually new**, so you never get the same alert twice.

**Think of it as:** a friend who watches the shop window and only calls when the display changes.

**Use it when** you're watching something for changes, and repeated "nothing new" or duplicate alerts would be annoying.

**Real-world scenarios**
- **Developers / IT:** know when the tools you depend on release updates or security fixes.
- **Shopping / procurement:** a product page's price or availability changed (combine with recipe 20).
- **Recruiting:** new job posts on a careers page you're tracking.
- **Compliance:** a regulation or policy page was updated.

**For real use you'd change:** what you watch and how you identify "the same thing" (a version number, an ID, a URL).

**Key pattern:** *check → compare with memory → act only on new things → remember.* This is the core of every "notify me when…" automation.

---

### 08 · Merge Data from Two APIs

**What it does:** Takes a list of people from one source and their activity from another, matches them up by ID, and produces one combined report.

**Think of it as:** laying two printed lists side by side and copying the matching numbers across, but instantly and without mistakes.

**Use it when** the full picture is split across two systems that don't talk to each other.

**Real-world scenarios**
- **Sales:** CRM contacts + billing system → which customers have unpaid invoices?
- **HR:** employee list + ticket system → who is overloaded with open tickets?
- **E-commerce:** orders + shipping status → which orders are late?
- **Marketing:** newsletter subscribers + purchases → which subscribers never bought anything?

**For real use you'd change:** the two sources, the matching fields (email is a common one), and whether you keep all rows or only matches.

**Key pattern:** *two sources → (optionally summarise one) → merge on a shared key → report.* Watch out for the text-vs-number gotcha explained in the README.

---

### 09 · AI Support Ticket Triage

**What it does:** When a support message arrives, an AI reads it and fills in a small form: category, priority, mood and a one-line summary. The ticket then goes to the right team automatically.

**Think of it as:** a very fast assistant who reads every incoming letter, writes a sticky note on it and puts it in the right in-tray.

**Use it when** you receive free-text messages that someone currently has to read just to decide where they go.

**Real-world scenarios**
- **Customer support:** route tickets to billing, tech or sales; escalate angry or urgent ones.
- **Sales:** read incoming enquiries and pull out company name, budget and timeline into your CRM.
- **HR:** sort job applications by role and extract years of experience.
- **Operations:** turn messy order emails into structured orders.

**For real use you'd change:** the categories and rules in the prompt, the model, and where each route goes (Zendesk, Jira, Slack…). Log the AI's decisions for a while to check its accuracy.

**Key pattern:** *unstructured text → AI extracts structured fields → normal routing.* The AI does the "reading" step; everything after is ordinary n8n.

---

### 10 · Error Handling & Alerts

**What it does:** Shows the safety nets of automation: try again when a service hiccups, use a backup plan when it really fails, and alert a human when something unexpected breaks.

**Think of it as:** the smoke detector and fire extinguisher for all your other workflows.

**Use it when** a workflow matters, which means **every workflow you rely on**. An automation that fails silently is worse than none.

**Real-world scenarios**
- **Any team:** one shared "Error Alert" workflow that posts to a #automation-alerts channel whenever any workflow fails.
- **Integrations:** retry calls to a flaky partner API three times before giving up.
- **Reporting:** if the live data source is down, send yesterday's cached numbers marked "(cached)" instead of nothing.
- **Data quality:** stop on purpose with a clear message when an order total is negative.

**For real use you'd change:** the alert channel, and attaching the error workflow to every production workflow (*Settings → Error Workflow*).

**Key pattern:** *retry → fallback → fail clearly → alert.* Add this to everything before you depend on it.

---

## Part 2 · Going further

### 11 · Batch Geocoding with Rate Limits

**What it does:** Looks up details (coordinates, country, population) for a list of cities, **3 at a time with a pause in between**, then gathers all the results into one file.

**Think of it as:** carrying boxes up the stairs a few at a time instead of all at once, then stacking them neatly at the top.

**Use it when** you need to send many requests to a service that limits how fast you can call it (most do).

**Real-world scenarios**
- **Sales / marketing:** enrich 2,000 leads with company info from Clearbit, Apollo or similar.
- **Logistics:** geocode a list of delivery addresses.
- **AI:** summarise 500 documents with an LLM without hitting its per-minute limit.
- **Data migration:** copy thousands of records into a new tool that only accepts 10 per second.

**For real use you'd change:** the list source, the batch size and pause (from the API's documented limits) and the API itself.

**Key pattern:** *list → batch → call → pause → loop → collect.*

---

### 12 · Reusable Notification Sub-workflow

**What it does:** Puts "send a nicely formatted notification" into its **own small workflow** that any other workflow can call, like a shared tool in a toolbox.

**Think of it as:** a company mailroom. Every department hands over the message, and the mailroom takes care of formatting and delivery the same way every time.

**Use it when** you notice you're building the same steps in several workflows.

**Real-world scenarios**
- **Any team:** one "notify" workflow. Switch from Slack to Teams once, and all 30 workflows follow.
- **Sales:** a shared "find or create customer in CRM" step used by forms, emails and imports.
- **Data:** a shared "log this event to the audit table" step.
- **AI:** sub-workflows become **tools** an AI agent can call (see recipe 15).

**For real use you'd change:** what the sub-workflow does and its inputs. The calling pattern stays the same.

**Key pattern:** *small reusable building blocks.* This is how n8n setups stay manageable as they grow.

---

### 13 · Secure Webhook with HMAC Signature

**What it does:** Accepts incoming webhook data **only** if it carries a valid signature proving it came from the expected sender and wasn't changed on the way. Everything else gets "401 Unauthorized".

**Think of it as:** a sealed envelope with a stamp only you and the sender know how to make. A broken seal or a fake stamp means the envelope gets rejected.

**Use it when** a webhook triggers anything that matters: payments, account changes, orders.

**Real-world scenarios**
- **Payments:** verify that "payment succeeded" really came from Stripe or Paddle.
- **E-commerce:** verify Shopify order webhooks before shipping anything.
- **Developers:** verify GitHub webhooks before deploying code.
- **Internal systems:** let your own apps call n8n securely with a shared secret.

**For real use you'd change:** the secret, and the header name and format of your provider (the README has a table).

**Key pattern:** *verify first, then trust.* Combine with recipe 01's pattern for any public-facing webhook.

---

### 14 · Clean & Deduplicate a Contact List

**What it does:** Takes a messy spreadsheet and:
- fixes names, emails, phone numbers and dates
- rejects broken rows, with a reason for each
- removes duplicates
- produces a clean file

**Think of it as:** a meticulous intern who tidies a spreadsheet in seconds, and tells you exactly which rows they threw out and why.

**Use it when** data arrives from people or exports, and you need it to be consistent before it goes anywhere important.

**Real-world scenarios**
- **Marketing:** clean event sign-up lists before importing them into your email tool.
- **Sales:** merge lead lists from trade shows without duplicates.
- **HR:** standardise employee data before migrating to a new HR system.
- **Finance:** normalise date and number formats from bank exports.

**For real use you'd change:** the input (Google Drive, email attachment, upload form), the column names and the validation rules.

**Key pattern:** *read file → normalise → validate (with reasons) → deduplicate → export.*

---

### 15 · AI Agent with Tools & Memory

**What it does:** A chat assistant that **decides by itself** when to look things up. Here it checks live exchange rates and uses a calculator, and it remembers what you said earlier in the conversation.

**Think of it as:** an assistant you can talk to, who has a phone (to look things up), a calculator and a notepad.

**Use it when** questions vary a lot, and answering them means looking something up or taking an action, not just knowing a fact.

**Real-world scenarios**
- **Customer service:** a website chatbot that looks up order status, shipping times and FAQ answers.
- **Internal help desk:** "How many vacation days do I have left?" (the agent queries the HR system).
- **Sales:** "What did we quote ACME last month?" (the agent searches the CRM).
- **Operations:** "Create a ticket for the broken printer on floor 3" (the agent calls the ticketing tool).

**For real use you'd change:** the tools (any API, sub-workflow or database can become one), the system message (rules and tone) and the memory storage (a database, so conversations survive restarts).

**Key pattern:** *AI + tools + memory = agent.* Start with 2–3 well-described tools. Recipe 09 is better when every request goes through the same fixed steps.

---

### 16 · Human-in-the-Loop Expense Approval

**What it does:** Small expenses are approved automatically. Larger ones send the manager *Approve* / *Reject* links, and the workflow **pauses** until one is clicked. It then continues from exactly where it stopped.

**Think of it as:** putting a document in someone's in-tray and continuing the paperwork once they've signed it, without anyone having to remember.

**Use it when** automation should do the work, but a person must make (or confirm) a decision.

**Real-world scenarios**
- **Finance:** expense, purchase-order or refund approvals above a limit.
- **Marketing:** an AI-drafted social post waits for approval before publishing.
- **HR:** a manager approves a holiday request, then the calendar and HR system are updated.
- **IT:** a manager approves an access request, then the account is created.

**For real use you'd change:** the threshold, how the approver is notified (email, Slack, Teams), and what happens after approval. n8n's Slack, Gmail and Teams nodes also have a ready-made *Send and Wait for Response* option.

**Key pattern:** *automate → pause for a human → resume.* This is how you safely automate decisions you're not ready to fully hand over.

---

### 17 · HTML Dashboard from a Webhook

**What it does:** Opening a link shows a live web page (here, exchange rates with small trend charts) that n8n builds on the spot. No website or hosting needed.

**Think of it as:** a notice board that redraws itself with fresh numbers every time someone looks at it.

**Use it when** people need to *see* some data, and a spreadsheet or chat message isn't the right format.

**Real-world scenarios**
- **Management:** a simple KPI page (today's sales, open tickets, sign-ups).
- **Ops:** a status page that shows the uptime results from recipe 06.
- **Clients:** a private project-status page per client (protected with a password).
- **Events:** a live registration counter.

**For real use you'd change:** the data source and the page layout. Add *Basic Auth* on the webhook to keep it private.

**Key pattern:** *request → fetch data → build HTML → serve.* With a form posting back to another webhook, this becomes a mini web app.

---

### 18 · PDF Invoice Parser

**What it does:** Reads a PDF invoice and pulls out the invoice number, dates, line items and totals as structured data. It then double-checks that the numbers add up.

**Think of it as:** a bookkeeper who reads each invoice, types it into the system and flags any where the maths doesn't work.

**Use it when** information arrives as PDFs, but you need it as data you can store, sum or act on.

**Real-world scenarios**
- **Finance:** supplier invoices from an email inbox → bookkeeping sheet or Xero/QuickBooks.
- **Logistics:** extract shipment numbers from delivery notes.
- **Legal / HR:** pull dates and names from standard contracts or forms.
- **Sales:** read purchase orders from customers and create orders.

**For real use you'd change:** where PDFs come from (email trigger, Google Drive folder, upload form) and the extraction rules. Use AI (recipe 09's pattern) when layouts vary a lot.

**Key pattern:** *file → text → structured fields → validate → book or review.* Note the "review" branch: a human still checks anything that looks off.

---

### 19 · Mini CRM with Data Tables

**What it does:** Stores contacts in n8n's **built-in** database and offers a small web API to add, update and list them. Updating someone only changes the fields you send.

**Think of it as:** a filing cabinet that lives inside n8n, with a front desk that files, updates and fetches cards on request.

**Use it when** your workflows need to remember structured information, and setting up Google Sheets, Airtable or a real database would be overkill.

**Real-world scenarios**
- **Small business:** a lightweight lead list fed by your contact form (recipe 04).
- **Automation state:** remember which customers already got the welcome email.
- **Lookups:** a table of "product code → responsible team" that workflows check before routing.
- **AI agents:** a memory or lookup table the agent can query (recipe 15).

**For real use you'd change:** the table and its columns, and the validation rules. Add authentication to the webhooks. When many people need to edit the data by hand, a shared spreadsheet or real CRM is the better choice (see the comparison table in the README).

**Key pattern:** *store → upsert → query.* It's your first database, inside n8n.

---

### 20 · Web Scraping with the HTML Node

**What it does:** Visits several pages of a product catalogue (slowly and politely), picks out titles, prices and ratings, and saves the best-rated, in-stock items as a spreadsheet.

**Think of it as:** someone browsing a website for you and copying the interesting bits into a table.

**Use it when** the information you need is on a website that has **no API or export**, and you're allowed to collect it.

**Real-world scenarios**
- **E-commerce:** track competitors' prices on public product pages (combine with recipe 07 to alert on changes).
- **Real estate / jobs:** collect new listings matching your criteria.
- **Research:** gather public data tables from government or statistics sites.
- **Marketing:** check your own site's pages for missing titles or broken prices.

**For real use you'd change:** the URLs and the CSS selectors (the README shows how to find them). Always check the site's terms and `robots.txt` first, and prefer an official API or RSS feed when one exists.

**Key pattern:** *list of pages → fetch slowly → extract → clean → export.*

---

## Putting recipes together

Real automations usually combine several patterns. Here are four realistic systems built entirely from cookbook recipes:

### A small-business lead pipeline
```
Contact form (04) → clean the data (14) → AI reads the message and scores the lead (09)
→ save to the contact table (19) → urgent leads ask the owner for a quick decision (16)
→ everything protected by an error workflow (10)
```

### An IT / operations monitor
```
Check websites every 5 min (06) → remember what was already down so nobody is spammed (07)
→ send through the shared notification sub-workflow (12) → show status on a page (17)
```

### An accounts-payable assistant
```
Supplier emails a PDF → extract invoice fields (18) → amounts over 1,000 need approval (16)
→ book approved invoices in a table (19) → weekly summary email of what's due (03 pattern)
```

### A customer-support helper
```
Signed webhook from the help-desk tool (13) → AI triage (09)
→ simple questions answered by an agent that looks up orders (15)
→ anything else routed to the right team (09) → failures alerted (10)
```

---

## Which recipes should I start with?

| If you are… | Start with | Then |
|---|---|---|
| **Completely new to automation** | 01 → 02 → 04 | 03, 06 |
| **Working with spreadsheets and data** | 05 → 14 → 08 | 11, 18, 20 |
| **Interested in AI** | 01 → 09 → 15 | 16 (AI + human approval) |
| **Running a website or app** | 06 → 13 → 10 | 07, 17 |
| **Building internal tools** | 04 → 19 → 17 | 12, 16 |

Whatever your path, finish with **10 (Error Handling)** before you rely on any workflow every day.

---

## Glossary

| Term | Plain meaning |
|---|---|
| **Workflow** | One automation: a trigger plus the steps that follow. |
| **Node** | One step in a workflow (a box on the canvas). |
| **Trigger** | The event that starts a workflow: a schedule, a webhook, a form, a new email… |
| **Item** | One record flowing through the workflow (one order, one row, one email). Most nodes run once per item. |
| **Expression** | A small formula in `{{ }}` that reads or computes data, e.g. `{{ $json.email }}`. |
| **Webhook** | A web address that starts a workflow when something sends data to it. |
| **API** | A way for programs to talk to each other. "Calling an API" means asking a service for data, or telling it to do something. |
| **Credential** | A saved login or API key that n8n uses to access a service on your behalf. |
| **Publish** | Turning a workflow on so it runs by itself (called *activate* in older versions). |
| **Execution** | One run of a workflow. You can inspect past runs under *Executions*. |
| **Sub-workflow** | A workflow that is called by another workflow, like a reusable function. |
| **Agent** | An AI that can decide to use tools (APIs, calculators, databases) to complete a task. |
