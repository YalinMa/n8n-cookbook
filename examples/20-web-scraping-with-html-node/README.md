# 20 · Web Scraping with the HTML Node

> Scrape a product catalogue that has no API. Visit several pages politely, extract data with **CSS selectors**, clean it and export a CSV.

| Difficulty | Time | Credentials | Nodes used |
|---|---|---|---|
| ⭐⭐ Intermediate | 10 min | None | Code, HTTP Request (batching), HTML (extract), Filter, Sort, Convert to File |

```
Manual Trigger ─▶ Settings ─▶ Page URLs ─▶ Fetch Page ─▶ Extract Books ─▶ One Item per Book ─▶ Rated 4★+ and In Stock ─▶ Cheapest First ─▶ Export CSV
                  (pages: 3)  (3 items)    (1 req/sec)   (CSS selectors   (3 pages → 60 books)   (Filter → 24)
                                                          → 5 arrays/page)
```

## What you'll learn

- The **HTML** node's *Extract HTML Content* with **CSS selectors** (text and attributes, *Return Array*)
- **Politeness**: one request per second with *HTTP Request → Options → Batching* (no loop needed)
- "Zipping" parallel arrays into **one item per record** in a Code node
- Cleaning scraped text: `£51.77` → `51.77`, `star-rating Three` → `3`, relative links → absolute URLs
- The **ethics and rules** of scraping

## Setup

1. Import [`workflow.json`](workflow.json).
2. Change **Settings → pages** (1–50) and **minRating** if you like.

The target is [books.toscrape.com](https://books.toscrape.com), a public sandbox **built for practising web scraping**.

## Try it

Click **Test workflow** (it takes about 3 seconds because of the 1 s pause between pages). Item counts: **3 pages → 60 books → 24 rated 4★+ and in stock**. **Cheapest First**:

| title | priceGBP | rating | inStock | url |
|---|---|---|---|---|
| Untitled Collection: Sabbath Poems 2014 | 14.27 | 4 | true | https://books.toscrape.com/catalogue/… |
| Sophie's World | 15.94 | 5 | true | … |
| Thirst | 17.27 | 5 | true | … |

Download the CSV from **Export CSV** → *Binary* tab.

## How it works

| Node | What it does |
|---|---|
| **Page URLs** | Generates `…/catalogue/page-1.html` … `page-N.html`, one item each. |
| **Fetch Page** | *Response Format: Text* (the HTML lands in `$json.data`). *Batching: 1 item every 1000 ms*. |
| **Extract Books** | Five selectors, each with *Return Array* on, so every page gives 5 equally long lists. |
| **One Item per Book** | Loops over pages and books, cleans each value, and builds absolute URLs from the page URL. |
| **Rated 4★+ and In Stock** | Filter with 2 conditions; `minRating` comes from **Settings**. |
| **Cheapest First** / **Export CSV** | Sort ascending by price, then build a CSV file. |

### Finding CSS selectors

1. Open the page in Chrome/Firefox → right-click an element → **Inspect**.
2. Look for a class or tag that's unique to what you want (`article.product_pod`, `.price_color`).
3. Test it in the DevTools console: `document.querySelectorAll('article.product_pod .price_color').length` should be 20 here.
4. For attributes (links, image sources, data-*), set *Return Value: Attribute*.

## Scraping responsibly ⚖️

- Check the site's **terms of service** and **`robots.txt`** first.
- Prefer an **official API** or RSS feed ([recipe 03](../03-rss-news-digest-email/)) when one exists.
- **Go slowly** (≥ 1 s between requests), and identify yourself with a `User-Agent` header.
- Don't collect **personal data** without a legal basis (GDPR and similar laws apply).
- Sites change their HTML. Expect to update selectors now and then.

## Ideas to extend

- Follow each book's `url` to scrape details (description, UPC). That's another HTTP + HTML pair, with batching.
- Track **price changes** over time by saving to a Data Table ([recipe 19](../19-mini-crm-with-data-tables/)) and comparing (pattern from [recipe 07](../07-github-release-watcher/)).
- JavaScript-heavy sites (content loaded by JS) won't work with plain HTTP. Use a headless-browser service or community node, or look for the JSON API the page calls (DevTools → *Network*).

## Troubleshooting

| Symptom | Fix |
|---|---|
| Arrays are empty | The selector doesn't match. Test it in DevTools, and check the HTML in **Fetch Page** (it may differ from what your browser shows if the site uses JavaScript). |
| `403 Forbidden` / CAPTCHA page | The site blocks bots. Respect that, or look for an API. |
| `£` shows as `Â£` | Encoding issue. The price cleanup keeps only digits and dots, so numbers are still correct. |
| `URL is not defined` in a Code node | The Code sandbox has no `URL` class. Join strings instead, as this recipe does. |
