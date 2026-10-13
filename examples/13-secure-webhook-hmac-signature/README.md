# 13 · Secure Webhook with HMAC Signature

> Only accept webhook calls that are **signed** with your shared secret. This is the pattern used by GitHub, Stripe, Shopify, Slack and others.

| Difficulty | Time | Credentials | Nodes used |
|---|---|---|---|
| ⭐⭐⭐ Intermediate+ | 10 min | None (a shared secret you choose) | Webhook (raw body), Crypto (HMAC), IF, Respond to Webhook |

```
Signed Webhook ─▶ Compute Signature ─▶ Signature Valid? ─┬─ true  ─▶ Process Event ─▶ Respond 200 OK
 (raw body on)     HMAC-SHA256(secret,                   └─ false ─▶ Respond 401 Unauthorized
                   raw body)
```

## Why sign webhooks?

A webhook URL is just a URL. If someone finds it, they can send you fake "payment received" events. With signing:

1. You and the sender share a **secret** (never sent over the wire).
2. The sender computes `HMAC-SHA256(secret, request body)` and sends it in a header.
3. You compute the same HMAC. If it matches, the request is genuine **and** the body wasn't changed.

## What you'll learn

- **Raw Body** on the Webhook node: you must sign the exact bytes received, not re-serialised JSON
- The **Crypto** node (*HMAC*, on binary data)
- Returning proper **HTTP status codes** (200 / 401) with *Respond to Webhook*

## Setup

1. Import [`workflow.json`](workflow.json).
2. Open **Compute Signature** and replace `change-me-to-a-long-random-secret` with a long random string. Generate one with `openssl rand -hex 32`.
3. Set the **same** secret in the service that calls you.
4. Adjust the header name if needed (see the table below) in **Signature Valid?**.

| Service | Header | Value format |
|---|---|---|
| This recipe / GitHub | `X-Hub-Signature-256` (GitHub) or `X-Signature-256` | `sha256=<hex>` |
| Shopify | `X-Shopify-Hmac-Sha256` | base64 (set Crypto *Encoding* to base64) |
| Stripe | `Stripe-Signature` | `t=…,v1=<hex>` of `timestamp.body` (needs a small Code step) |

## Try it

Click **Test workflow**, then sign and send a request (use `/webhook/` instead of `/webhook-test/` once the workflow is published):

```bash
SECRET="change-me-to-a-long-random-secret"
BODY='{"event":"order.paid","data":{"orderId":"A-1001","amount":129.9}}'
SIG=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$SECRET" | sed 's/^.*= //')

curl -i -X POST http://localhost:5678/webhook-test/signed-webhook \
  -H "Content-Type: application/json" \
  -H "X-Signature-256: sha256=$SIG" \
  -d "$BODY"
```

| Request | Response |
|---|---|
| Correct signature | `200 {"ok":true,"event":"order.paid"}` |
| Wrong signature | `401 {"ok":false,"error":"invalid signature"}` |
| Body changed after signing | `401` |
| No signature header | `401` |

## How it works

| Node | What it does |
|---|---|
| **Signed Webhook** | *Options → Raw Body* is on. The exact request bytes are kept as binary `data`, and the parsed JSON is still available in `$json.body`. |
| **Compute Signature** | Crypto → **HMAC**, SHA256, on the binary `data`, hex encoding. Saves the result to `expectedSignature`. |
| **Signature Valid?** | Compares the header with `sha256=` + `expectedSignature`. |
| **Respond 200 / 401** | Proper status codes, so senders can retry or alert. |

## Security notes

- Keep the secret out of exported workflow files you share. Here it's inline for learning purposes. On self-hosted n8n you can read it from an environment variable, or put it in a credential.
- Add **replay protection**: require a timestamp header and reject requests older than about 5 minutes (Stripe does this).
- Always use **HTTPS** in production.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Always 401 even with the right secret | You signed different bytes. Sign the body *exactly* as sent: no pretty-printing, same key order, `printf '%s'` rather than `echo` (which adds a newline). |
| `Compute Signature` errors with "binary data not found" | *Raw Body* is off on the Webhook node. |
| Header is `undefined` | n8n lower-cases header names: use `$json.headers['x-signature-256']`. |
