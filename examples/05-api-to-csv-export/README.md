# 05 · API Data to CSV Export

> Fetch every page of a paginated REST API, filter and reshape the records, and download them as a CSV file.

| Difficulty | Time | Credentials | Nodes used |
|---|---|---|---|
| ⭐⭐ Intermediate | 10 min | None | HTTP Request (pagination), Split Out, Filter, Edit Fields, Sort, Convert to File |

```
Manual Trigger ─▶ Fetch All Products ─▶ One Item per Product ─▶ Rating ≥ 4.5 and In Stock ─▶ Pick Columns ─▶ Sort by Rating ─▶ Convert to CSV
                  (4 pages × 50)         (Split Out: ~194 items)    (Filter)                      (Set)         (Sort)            (.csv file)
```

## What you'll learn

- **Pagination** built into the HTTP Request node, using `$pageCount` and `$response`
- **Split Out**: turn one item that holds an array into many items
- Filtering on **several conditions** (AND)
- Choosing and renaming columns with **Edit Fields**
- Working with **binary data** (files) in n8n

## Setup

1. Import [`workflow.json`](workflow.json).
2. No credentials needed. The data comes from [DummyJSON](https://dummyjson.com/docs/products), a free fake-data API.

## Try it

1. Click **Test workflow**.
2. Open **Convert to CSV**, switch the output to the **Binary** tab and click **Download**.
3. Open the file in Excel, Numbers or Google Sheets:

   ```csv
   ID,Product,Brand,Category,Price (USD),Rating,Stock
   …,…,…,…,…,4.99,…
   ```

## How it works

| Node | What it does |
|---|---|
| **Fetch All Products** | `GET /products?limit=50`. Under *Options → Pagination* it sends `skip = $pageCount * 50` on each request. It stops when `skip + limit >= total`, with a safety cap of 20 requests. Each page becomes one item. |
| **One Item per Product** | Split Out on the `products` field. 4 page items become about 194 product items. |
| **Rating ≥ 4.5 and In Stock** | Filter with two conditions joined by **AND**. |
| **Pick Columns** | Edit Fields keeps only the listed fields, with human-friendly column names. |
| **Sort by Rating** | Rating descending, then price ascending as a tie-breaker. |
| **Convert to CSV** | Turns all items into one CSV file (binary property `data`). The file name includes today's date. |

### Pagination patterns you'll meet in the wild

| API style | How to configure *Pagination* |
|---|---|
| `?page=1,2,3…` | *Update a Parameter in Each Request* → `page` = `{{ $pageCount + 1 }}` |
| `?offset=` / `?skip=` | Same, with `{{ $pageCount * pageSize }}` (this example) |
| Cursor (`next_cursor` in body) | `cursor` = `{{ $response.body.next_cursor }}`, complete when `{{ !$response.body.next_cursor }}` |
| `Link` header / `next` URL | *Response Contains Next URL* → `{{ $response.body.next }}` |

## Ideas to extend

- **Save the file somewhere useful:** add a **Google Drive**, **Dropbox**, **S3** or **Send Email** node after *Convert to CSV*. Binary data passes through automatically.
- Write to **Google Sheets** instead of a CSV file (see [example 04](../04-contact-form-to-google-sheets/)).
- Run it on a schedule for a nightly export.
- Choose *XLSX* in **Convert to File** to get an Excel file.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Only 50 products | Pagination is off. Check *Options → Pagination* in **Fetch All Products**. |
| Infinite paging / `Max requests reached` | Your *complete* expression never becomes true. Check the field names in the response. |
| CSV columns in odd order | Column order follows the field order in **Pick Columns**. |
