# 13 · 带 HMAC 签名的安全 Webhook（Secure Webhook with HMAC Signature）

[English](README.md) · **简体中文**

> 只接受用你们共享的密钥 **签名** 过的 Webhook 调用。GitHub、Stripe、Shopify、Slack 等服务都采用这种模式。

| 难度 | 时间 | 凭证 | 用到的节点 |
|---|---|---|---|
| ⭐⭐⭐ 中级+ | 10 分钟 | 无（使用你自己设定的共享密钥） | Webhook（原始请求体）、Crypto（HMAC）、IF、Respond to Webhook |

```
Signed Webhook ─▶ Compute Signature ─▶ Signature Valid? ─┬─ true  ─▶ Process Event ─▶ Respond 200 OK
（开启 Raw Body）  HMAC-SHA256(密钥,                       └─ false ─▶ Respond 401 Unauthorized
                   原始请求体)
```

## 为什么要给 Webhook 签名？

Webhook 地址说到底只是一个网址。如果有人知道了它，就能给你发伪造的“已收款”事件。有了签名：

1. 你和发送方共享一个 **密钥**（这个密钥从不在网络上传输）。
2. 发送方计算 `HMAC-SHA256(密钥, 请求体)`，并放在请求头里一起发送。
3. 你用同样的方法计算 HMAC。结果一致，就说明请求是真的，**而且** 请求体没有被篡改。

## 你将学到

- Webhook 节点的 **Raw Body**（原始请求体）：必须对收到的原始字节签名，而不是对重新序列化后的 JSON 签名
- **Crypto** 节点（对二进制数据做 *HMAC*）
- 用 *Respond to Webhook* 返回正确的 **HTTP 状态码**（200 / 401）

## 配置

1. 导入 [`workflow.json`](workflow.json)。
2. 打开 **Compute Signature**，把 `change-me-to-a-long-random-secret` 换成一个很长的随机字符串。可以用 `openssl rand -hex 32` 生成。
3. 在调用你的服务中设置 **同一个** 密钥。
4. 如有需要，在 **Signature Valid?** 中修改请求头名称（见下表）。

| 服务 | 请求头 | 值的格式 |
|---|---|---|
| 本菜谱 / GitHub | `X-Hub-Signature-256`（GitHub）或 `X-Signature-256` | `sha256=<hex>` |
| Shopify | `X-Shopify-Hmac-Sha256` | base64（把 Crypto 的 *Encoding* 设为 base64） |
| Stripe | `Stripe-Signature` | 对 `timestamp.body` 计算的 `t=…,v1=<hex>`（需要一个小的 Code 步骤） |

> 飞书、钉钉机器人的“加签”也是基于时间戳 + 密钥的 HMAC-SHA256，原理相同，只是签名内容和编码方式由各平台文档规定。

## 动手试试

点击 **Test workflow**，然后签名并发送一个请求（工作流发布后，把 `/webhook-test/` 换成 `/webhook/`）：

```bash
SECRET="change-me-to-a-long-random-secret"
BODY='{"event":"order.paid","data":{"orderId":"A-1001","amount":129.9}}'
SIG=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$SECRET" | sed 's/^.*= //')

curl -i -X POST http://localhost:5678/webhook-test/signed-webhook \
  -H "Content-Type: application/json" \
  -H "X-Signature-256: sha256=$SIG" \
  -d "$BODY"
```

| 请求 | 响应 |
|---|---|
| 签名正确 | `200 {"ok":true,"event":"order.paid"}` |
| 签名错误 | `401 {"ok":false,"error":"invalid signature"}` |
| 签名后请求体被修改 | `401` |
| 没有签名请求头 | `401` |

## 工作原理

| 节点 | 作用 |
|---|---|
| **Signed Webhook** | 开启了 *Options → Raw Body*。请求的原始字节保存为二进制 `data`，解析后的 JSON 仍然可以在 `$json.body` 中使用。 |
| **Compute Signature** | Crypto → **HMAC**，SHA256，对二进制 `data` 计算，hex 编码，结果保存到 `expectedSignature`。 |
| **Signature Valid?** | 比较请求头与 `sha256=` + `expectedSignature`。 |
| **Respond 200 / 401** | 返回正确的状态码，方便发送方重试或告警。 |

## 安全提示

- 不要把密钥留在你要分享的工作流导出文件里。这里为了学习方便直接写在节点中。在自部署的 n8n 上，可以从环境变量读取，或者放进凭证里。
- 加上 **防重放**：要求带时间戳请求头，拒绝超过约 5 分钟的请求（Stripe 就是这么做的）。
- 生产环境一定要使用 **HTTPS**。

## 常见问题

| 现象 | 解决方法 |
|---|---|
| 密钥明明正确却一直返回 401 | 你签名的字节和实际发送的不一样。必须对发送的请求体 *原样* 签名：不要格式化 JSON，键的顺序要一致，用 `printf '%s'` 而不是 `echo`（`echo` 会多加一个换行符）。 |
| `Compute Signature` 报错 "binary data not found" | Webhook 节点没有开启 *Raw Body*。 |
| 请求头是 `undefined` | n8n 会把请求头名称转成小写：请用 `$json.headers['x-signature-256']`。 |
