# 14 · Clean & Deduplicate a Contact List

> Download a messy CSV, normalise every field, reject bad rows, remove duplicates and export a clean file.

| Difficulty | Time | Credentials | Nodes used |
|---|---|---|---|
| ⭐⭐ Intermediate | 10 min | None | HTTP Request (file), Extract from File (CSV), Edit Fields, IF (regex), Remove Duplicates, Sort, Convert to File |

```
Manual Trigger ─▶ Settings ─▶ Download CSV ─▶ Parse CSV ─▶ Normalize Fields ─▶ Valid Contact? ─┬─ true  ─▶ Remove Duplicate Emails ─▶ Sort by Name ─▶ Export Clean CSV
                  (csvUrl)     (binary file)   (13 items)                                       └─ false ─▶ Rejected Rows (with reason)
```

## What you'll learn

- Working with **files**: download as binary, then **Extract from File** turns CSV rows into items
- Text clean-up with expressions: `trim()`, `toLowerCase()`, title case, keeping only digits
- Parsing **two date formats** with Luxon (`DateTime.fromFormat` / `fromISO`)
- Validating with a **regex** condition and keeping rejected rows **with a reason**
- **Remove Duplicates** by a chosen field

## Setup

1. Import [`workflow.json`](workflow.json). It works immediately with [`sample-contacts.csv`](sample-contacts.csv) from this repo.
2. To clean your own file, change **Settings → csvUrl**, or replace *Settings + Download CSV* with:
   - **Google Drive → Download file**
   - an email attachment (**Gmail Trigger** / **IMAP**)
   - an upload field on an **n8n Form** ([recipe 04](../04-contact-form-to-google-sheets/))
3. If your column headers differ, update the field names in **Normalize Fields** (`$json['Full Name']`, `$json['E-mail']`…).

## Try it

Click **Test workflow**. The sample has 13 rows with typical problems:

| Problem in the source | Example | Result |
|---|---|---|
| Extra spaces, wrong case | `  ada lovelace `, `ADA@Example.com` | `Ada Lovelace`, `ada@example.com` |
| Phone formats | `(555) 010-2030`, `555.010.2030` | `5550102030` |
| Two date formats | `03/02/2026` and `2026-02-03` | ISO `2026-03-02` |
| Same person twice | Grace Hopper ×2, Ada Lovelace ×2 | kept once |
| Broken email | `margaret@@apollo.example`, `dmr@bell-labs` | rejected: *invalid email* |
| Missing data | no email / no name | rejected: *missing email* / *missing name* |

Item counts: **13 → 9 valid + 4 rejected → 7 unique contacts**. Download the result from **Export Clean CSV** → *Binary* tab.

## How it works

| Node | What it does |
|---|---|
| **Download CSV** | HTTP Request with *Response Format: File*. The CSV arrives as binary data. |
| **Parse CSV** | Extract from File → CSV. The header row becomes field names. *Include Empty Cells* keeps missing values as `""` instead of dropping the key. |
| **Normalize Fields** | One expression per field. Title case: `.toLowerCase().replace(/(^\|[\s-])\S/g, s => s.toUpperCase())` also handles `Berners-Lee`. |
| **Valid Contact?** | Name not empty **and** email matches `^[^@\s]+@[^@\s]+\.[a-z]{2,}$`. |
| **Remove Duplicate Emails** | *Compare: Selected Fields → email*. Keeps the first occurrence. |
| **Rejected Rows** | Adds a human-readable `reason` (*Include Other Fields* keeps the original data), ready to send back to whoever owns the list. |

## Ideas to extend

- Send **Rejected Rows** by email to the list owner (aggregate them first).
- Write clean contacts to your CRM, or to the Data Table from [recipe 19](../19-mini-crm-with-data-tables/).
- Remove duplicates **across runs** with *Remove Duplicates → Remove Items Processed in Previous Executions*.
- Validate phone numbers per country with a Code node and `libphonenumber`-style rules.

## Troubleshooting

| Symptom | Fix |
|---|---|
| All fields are `undefined` | Header names differ. Look at **Parse CSV** output and update the expressions. Watch out for a BOM: enable *Options → Exclude Byte Order Mark*. |
| `Cannot read properties of undefined (reading 'trim')` | A column is missing completely. Keep the `?? ''` fallbacks. |
| Semicolon-separated file (Excel in many EU locales) | Parse CSV → *Options → Delimiter* `;`. |
| Garbled accents | Parse CSV → *Options → Encoding* (try `latin1`). |
