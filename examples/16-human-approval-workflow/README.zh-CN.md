# 16 · 人工审批流程（Human-in-the-Loop Expense Approval）

[English](README.md) · **简体中文**

> 让工作流暂停，直到有人点击 **同意** 或 **拒绝**，然后在同一次执行中沿着对应的路径继续运行。

| 难度 | 时间 | 凭证 | 用到的节点 |
|---|---|---|---|
| ⭐⭐⭐ 中级+ | 15 分钟 | 无（可选：聊天 Webhook 地址） | Webhook、IF、Edit Fields、Respond to Webhook、Wait（收到 Webhook 调用后恢复） |

```
Expense Request ─▶ Read Request ─▶ Over 100? ─┬─ false ─▶ Auto-approve ─▶ Reply: Approved
                                              │
                                              └─ true ─▶ Build Approval Links ─▶ Notify Manager ─▶ Reply: Pending ─▶ Wait for Decision ⏸
                                                        （$execution.resumeUrl）    （已禁用）      （202 + 链接）           │ 经理点击链接
                                                                                                                          ▼
                                                                         Confirm Approval ◀─ Mark Approved ◀─ true ─ Approved? ─ false ─▶ Mark Rejected ─▶ Confirm Rejection
```

## 你将学到

- *On Webhook Call* 模式下的 **Wait** 节点：执行被 **保存并暂停**，等待期间不消耗任何资源
- `$execution.resumeUrl`：一个唯一的、带签名的网址，用来恢复 *这一次* 执行
- 把审批人的决定作为 **查询参数** 传回，并据此分支
- **先回复最初的调用方**（202 Accepted），再进入等待
- 给审批人显示一个友好的 **HTML 确认页面**

## 配置

1. 导入 [`workflow.json`](workflow.json)。
2. *（可选）* 在 **Notify Manager** 中填入 Slack/Discord 的 Webhook 地址并启用，或换成 *Send Email*。消息中包含两个链接。飞书 / 钉钉 / 企业微信的设置见 [快速上手 · 发送到其他聊天工具](../../docs/getting-started.zh-CN.md#6-发送到其他聊天工具)。
3. **发布** 工作流。恢复链接只对生产执行有效。

> **小提示：** n8n 的 Slack、Gmail、Telegram、Teams、Discord 节点也内置了 *Send and Wait for Response* 操作，会自动帮你生成同意 / 拒绝按钮。本菜谱手动搭建同样的模式，让你看清楚原理，并且可以用于任何渠道（包括飞书、钉钉）。

## 动手试试

```bash
# 1. 小额报销 → 立即通过
curl -X POST http://localhost:5678/webhook/expense -H "Content-Type: application/json" \
  -d '{"employee":"Ada","amount":42.5,"description":"Taxi"}'
# {"status":"auto_approved","message":"Expenses up to 100 € are approved automatically."}

# 2. 大额报销 → 暂停，返回审批链接
curl -X POST http://localhost:5678/webhook/expense -H "Content-Type: application/json" \
  -d '{"employee":"Grace","amount":850,"description":"Conference ticket"}'
# 202 {"status":"pending_approval", "approveUrl":"http://localhost:5678/webhook-waiting/33?signature=…&decision=approve", "rejectUrl": "…"}
```

3. 打开 **Executions**：这次运行显示为 **Waiting**（等待中）。
4. 在浏览器中打开 `approveUrl`。你会看到 **✅ Expense approved · Grace · 850.00 €**，执行经 *Mark Approved* 结束。

（门槛 100 和货币符号 € 都可以改，例如在 **Over 100?** 中改成 1000，在确认页面里改成 ¥。）

## 工作原理

| 节点 | 作用 |
|---|---|
| **Over 100?** | 小额报销跳过人工审批步骤。 |
| **Build Approval Links** | `{{ $execution.resumeUrl }}&decision=approve`（以及 `reject`）。n8n 会给恢复链接加上 `?signature=…` 令牌，所以你自己的参数必须用 **`&`** 拼接。 |
| **Reply: Pending** | 立即向最初的请求返回 **202**。之后工作流继续运行。 |
| **Wait for Decision** | *Resume: On Webhook Call*，GET 请求，*Respond: Using 'Respond to Webhook' Node*。在链接被打开之前，这次执行一直保存在数据库中。 |
| **Approved?** | 从恢复请求中读取 `$json.query.decision`。 |
| **Mark Approved / Rejected** | 用 `$('Read Request').item` 从前面的节点取回原始请求数据，这些数据随暂停的执行一起被保存了。 |
| **Confirm Approval / Rejection** | 显示给经理看的 HTML 页面。 |

## 扩展思路

- **超时处理：** Wait → *Limit Wait Time*（例如 3 天），超时后升级给经理的上级。
- **收集审批意见：** 改用 *Resume: On Form Submitted*，让审批人填写一个简短表单（“拒绝原因”）。
- 把审批结果 **记录** 到 Data Table（[菜谱 19](../19-mini-crm-with-data-tables/README.zh-CN.md)）或 Google Sheet 中。
- 多级审批：串联两个 Wait 节点（先组长，再财务）。

## 常见问题

| 现象 | 解决方法 |
|---|---|
| 点击链接返回 `{"error":"Invalid token"}` | 链接被改过，例如用了 `?decision=` 而不是 `&decision=`。请原样使用生成的链接。 |
| 链接返回 404 / "execution not found" | 这次执行已经恢复过了（链接只能用一次），或者它是一次已被停止的手动测试运行。请发布工作流，使用生产执行。 |
| 链接指向 `localhost` | 在自部署的 n8n 上把 `WEBHOOK_URL` 设置为你的公网地址。 |
