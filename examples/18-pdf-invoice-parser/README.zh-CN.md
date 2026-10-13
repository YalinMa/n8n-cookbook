# 18 · PDF 发票解析（PDF Invoice Parser）

[English](README.md) · **简体中文**

> 从 PDF 中提取发票号、日期、金额和明细行，然后核对金额是否正确。不用 AI，也不需要 API Key。

| 难度 | 时间 | 凭证 | 用到的节点 |
|---|---|---|---|
| ⭐⭐ 中级 | 10 分钟 | 无 | HTTP Request（文件）、Extract from File（PDF）、Code（正则）、Edit Fields、IF |

```
Manual Trigger ─▶ Download Invoice ─▶ Extract PDF Text ─▶ Parse Invoice ─▶ Check Totals ─▶ Looks Valid? ─┬─ true  ─▶ Book Invoice（占位节点）
                 （二进制 PDF）       （纯文本）           （正则 → JSON） （求和、距到期天数）         └─ false ─▶ Needs Review（占位节点）
```

## 你将学到

- 用 *Extract from File → Extract From PDF* 读取 **PDF 文本**
- 用正则表达式（`match`、`matchAll`）把文本变成 **结构化 JSON**
- 用 **数据校验** 发现提取错误（明细合计 = 小计，小计 + 增值税 = 总计）
- 用 Luxon 做日期计算（`daysUntilDue`）
- 文档提取时，什么时候用 **正则**，什么时候用 **AI**

## 配置

1. 导入 [`workflow.json`](workflow.json)。它会从本仓库下载 [`sample-invoice.pdf`](sample-invoice.pdf)，这是一张由 [`make-sample-invoice.py`](make-sample-invoice.py) 生成的虚构发票（英文版式）。
2. 要处理你自己的发票，把 **Download Invoice** 换成你的 PDF 来源：
   - 开启 *Download Attachments* 的 **Gmail Trigger** / **Email Trigger (IMAP)**（QQ、163、企业邮箱都支持 IMAP）
   - 监听“发票”文件夹的 **Google Drive Trigger**
   - 带文件上传字段的 n8n **Form**
3. 按你的供应商的发票版式，修改 **Parse Invoice** 中的正则表达式。

> **中国电子发票（数电票）：** 数电票 PDF 通常包含可提取的文本，可以参考这样的正则：
> `find(/发票号码[:：]\s*(\d+)/)`、`find(/开票日期[:：]\s*(\d{4}年\d{2}月\d{2}日)/)`、`money(/[（(]小写[）)]\s*[¥￥]?\s*([\d.,]+)/)`（价税合计）。
> 不同开票平台导出的 PDF 版式可能有差别，先在 **Extract PDF Text** 的输出中看清 `$json.text` 的实际内容，再调整正则。

## 动手试试

点击 **Test workflow**。**Check Totals** 输出：

```json
{
  "supplier": "ACME Coffee Supplies GmbH",
  "invoiceNumber": "INV-2026-0042",
  "invoiceDate": "2026-10-01",
  "dueDate": "2026-10-31",
  "billTo": "Cookbook Cafe Ltd, 12 Example Street, Berlin",
  "currency": "EUR",
  "subtotal": 339.9,
  "vat": 64.58,
  "total": 404.48,
  "lineItems": [
    { "description": "Espresso beans 1kg", "quantity": 10, "unitPrice": 24.5, "amount": 245 },
    { "description": "Paper cups (pack of 100)", "quantity": 5, "unitPrice": 8.9, "amount": 44.5 },
    { "description": "Oat milk 1L", "quantity": 24, "unitPrice": 2.1, "amount": 50.4 }
  ],
  "lineItemsMatchSubtotal": true,
  "totalIsCorrect": true,
  "daysUntilDue": 18
}
```

两项校验都通过，所以这条数据流向 **Book Invoice**。（`daysUntilDue` 取决于你运行的日期。）

## 工作原理

| 节点 | 作用 |
|---|---|
| **Download Invoice** | HTTP Request，*Response Format: File* → 二进制 `data`。 |
| **Extract PDF Text** | 把 PDF 中的文字放进 `$json.text`。只适用于包含真实文字的 PDF，不适用于扫描图片（见常见问题）。 |
| **Parse Invoice** | 单个字段用 `find(/Invoice Number:\s*(\S+)/)`；每条明细行用 `text.matchAll(/^(.+?)\s*\|\s*(\d+)…$/gm)`。 |
| **Check Totals** | 两个布尔校验，外加 `daysUntilDue`。*Include Other Fields* 会保留之前解析出的所有字段。 |
| **Looks Valid?** | 只有“干净”的发票才会自动入账，有任何异常都交给人处理。 |

## 用正则还是用 AI？

| | 正则（本菜谱） | AI *Information Extractor*（[菜谱 09](../09-ai-support-ticket-triage/README.zh-CN.md)） |
|---|---|---|
| 适用于 | 一种或少数几种 **已知** 版式 | **任意** 版式 |
| 成本 | 免费、瞬间完成 | 按调用计费，速度较慢 |
| 准确率 | 已知版式上 100%，版式一变就是 0% | 很好，偶尔出错 |
| 最佳实践 | 两种方式都要保留 **校验步骤**，它能同时发现正则和 AI 的错误。 | |

## 扩展思路

- 每张发票追加到 Google Sheets 或 Data Table，明细行放到另一张表。
- 设置提醒：如果 `daysUntilDue < 7`，就发到 Slack、飞书或钉钉。
- 用 AI 兜底：在 *false* 分支上，先把文本交给 Information Extractor，再找人复核。

## 常见问题

| 现象 | 解决方法 |
|---|---|
| `text` 为空 | 这个 PDF 是 **扫描图片**。请使用 OCR 服务（例如百度、腾讯云、阿里云的发票识别 OCR，或 Mistral OCR、Google Document AI、AWS Textract），或支持图片理解的大模型。 |
| 字段是 `null` | 标签文字不一样（`Invoice No.` 与 `Invoice Number:`）。查看 **Extract PDF Text** 中的 `$json.text` 并调整正则。 |
| PDF 有密码保护 | Extract PDF Text → *Options → Password*。 |
| 数字格式是 `1.234,56`（欧洲格式） | 先转换再用 `Number()`：`.replace('.', '').replace(',', '.')`。 |
