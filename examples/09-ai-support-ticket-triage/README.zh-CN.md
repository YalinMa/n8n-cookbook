# 09 · AI 客服工单分拣（AI Support Ticket Triage）

[English](README.md) · **简体中文**

> 让大模型阅读收到的客服工单，提取结构化信息，并把每张工单分派给对应的团队。

| 难度 | 时间 | 凭证 | 用到的节点 |
|---|---|---|---|
| ⭐⭐⭐ 中级+ | 15 分钟 | OpenAI API Key（或任意其他聊天模型） | Webhook、Information Extractor、OpenAI Chat Model、Edit Fields、Respond to Webhook、Switch |

```
New Ticket ─▶ Extract Ticket Info ─▶ Build Ticket ─▶ Reply to Sender ─▶ Route by Category ─┬─ Billing   ─▶ Billing Team
（Webhook）        ▲                                   （JSON 响应）                         ├─ Technical ─▶ Tech Support
                   │ ai_languageModel                                                        ├─ Sales     ─▶ Sales Team
           OpenAI Chat Model                                                                 └─ Other     ─▶ General Inbox
```

## 你将学到

- n8n 的 **AI 节点** 如何工作：一个 *根节点*（Information Extractor）加一个 *子节点*（聊天模型），二者通过特殊的 `ai_languageModel` 连接相连
- 让大模型输出 **结构化 JSON**，而不是自由文本
- 用 **temperature 0** 让分类结果更稳定
- 用 **Switch** 节点做多路分支，并设置 *fallback*（兜底）输出
- 在耗时较长的后续步骤完成 *之前* 先回复调用方

## 配置

1. 导入 [`workflow.json`](workflow.json)。
2. **添加模型凭证。** 打开 **OpenAI Chat Model → Credential → Create new → OpenAI**，粘贴在 [platform.openai.com/api-keys](https://platform.openai.com/api-keys) 获取的 API Key。
   - 使用 `gpt-4o-mini` 时，每张工单的成本不到 1 美分。
   - **想用其他模型？** 删掉 *OpenAI Chat Model*，点击 *Extract Ticket Info → Model* 下方的 **+**，选择 **Anthropic Chat Model**、**Google Gemini Chat Model**、**Ollama Chat Model**（免费、本地运行）或其他提供商。其他部分都不用改。
   - **国内模型（DeepSeek、通义千问等）：** 它们兼容 OpenAI 接口，可以直接复用 OpenAI 节点。在 OpenAI 凭证中把 **Base URL** 改成服务商的地址，例如 DeepSeek 的 `https://api.deepseek.com`，或阿里云百炼的 `https://dashscope.aliyuncs.com/compatible-mode/v1`，再填入该平台的 API Key。然后在 **OpenAI Chat Model** 的 *Model* 中切换到 *ID* 模式，填写模型名（如 `deepseek-chat`、`qwen-plus`）。请选择支持工具调用 / JSON 输出的模型。
3. *（可选）* 把四个 **No Op** 团队节点换成 Slack、邮件、飞书、钉钉、Jira、Zendesk 等节点。

## 动手试试

1. 点击 **Test workflow**。
2. 向 Test URL 发送一张工单：

   ```bash
   curl -X POST http://localhost:5678/webhook-test/support-ticket \
     -H "Content-Type: application/json" \
     -d '{
       "email": "jane@example.com",
       "subject": "Charged twice this month!!",
       "message": "I just looked at my card statement and you billed me twice for the Pro plan. Please refund one of them ASAP."
     }'
   ```

3. 响应：

   ```json
   {
     "ok": true,
     "ticketId": "T-1760348400000",
     "category": "billing",
     "priority": "high",
     "summary": "Customer was charged twice for the Pro plan and wants a refund."
   }
   ```

4. 在编辑器中可以看到，这次运行走的是 *Route by Category* 的 **Billing** 输出。

更多测试工单（中文工单同样可以，大模型能直接理解）：

| 标题 | 内容 | 预期分类 |
|---|---|---|
| App won't load | Since this morning the dashboard shows a blank page in Chrome and Safari. | technical |
| 团队版价格 | 我们公司有 40 人，年付有批量折扣吗？ | sales |
| Love the product | Just wanted to say the new editor is fantastic, thanks! | other |

## 工作原理

| 节点 | 作用 |
|---|---|
| **New Ticket** | Webhook `POST /support-ticket`，稍后由 *Reply to Sender* 返回响应。 |
| **Extract Ticket Info** | *Information Extractor*（LangChain）。你描述想要的属性（名称、说明、是否必填），n8n 会自动生成提示词和 JSON schema，并校验模型的回答。结果位于 `$json.output`。 |
| **OpenAI Chat Model** | 提取器使用的大模型。temperature 为 0 时输出确定，适合分类任务。 |
| **Build Ticket** | 把原始请求（`$('New Ticket').item.json.body…`）和 AI 的输出合并，并生成工单 ID。 |
| **Reply to Sender** | 立即返回结果。响应发出后，工作流 **继续运行**。 |
| **Route by Category** | 有 3 条规则的 Switch 节点，另有一个名为 "Other" 的 *Fallback Output*，接住所有意料之外的结果。 |

### 分类任务的提示词技巧

- 在每个属性的说明中 **列出允许的取值**（“Exactly one of: …”）。自由发挥的回答会打乱路由。
- 为边界情况加上 **判断规则**（“系统宕机、数据丢失时设为 high……”）。
- 一定要保留 **兜底路由**，因为大模型的输出有概率性。
- 把 AI 的输出记录下来（例如写入 Google Sheets）一周，检查分错的工单，再据此改进提示词。

## 扩展思路

- **自动起草回复：** 加一个 *Basic LLM Chain* 节点写一封礼貌的初步回复，由人在 Slack / 飞书中确认后再发送。
- **升级处理：** 当 `priority = high` 且 `sentiment = negative` 时，呼叫值班人员。
- **接入自己的知识库：** 改用带向量库工具的 *AI Agent* 节点，让它自动回答常见问题。
- 改为从 **邮箱**（Gmail / IMAP 触发器）接收工单，而不是 Webhook。

## 常见问题

| 现象 | 解决方法 |
|---|---|
| `Node does not have any credentials set` | 在 **OpenAI Chat Model** 中添加 API Key。 |
| `429 You exceeded your current quota` | 你的 OpenAI 账号需要充值。 |
| 所有工单都进了 *Other* | 查看 **Build Ticket** 中的 `category`。如果模型返回的是 `Billing.` 之类，就把属性说明写得更严格。工作流已经会把值转成小写。 |
| 报错 `Failed to parse` | 较小的本地模型有时会输出不合法的 JSON。换一个更强的模型，或给提取器开启 *Retry On Fail*。 |
