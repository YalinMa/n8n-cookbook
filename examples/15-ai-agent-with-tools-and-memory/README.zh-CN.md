# 15 · 带工具和记忆的 AI 智能体（AI Agent with Tools & Memory）

[English](README.md) · **简体中文**

> 一个聊天助手，会 **自己决定** 什么时候调用工具（实时汇率 API 和计算器），并且 **记得** 之前的对话。

| 难度 | 时间 | 凭证 | 用到的节点 |
|---|---|---|---|
| ⭐⭐⭐ 中级+ | 15 分钟 | OpenAI API Key（或任意支持工具调用的聊天模型） | Chat Trigger、AI Agent、OpenAI Chat Model、Simple Memory、HTTP Request Tool、Calculator |

```
Chat Trigger ─▶ AI Agent ─▶（回复显示在聊天窗口）
（托管聊天页）   ▲   ▲   ▲   ▲
                 │   │   │   └─ ai_tool ──────── Calculator
                 │   │   └───── ai_tool ──────── Currency Rates （把 HTTP Request 当作工具）
                 │   └───────── ai_memory ────── Memory         （每个会话保留最近 10 条消息）
                 └───────────── ai_languageModel OpenAI Chat Model
```

## 你将学到

- **链（chain）**（[菜谱 09](../09-ai-support-ticket-triage/README.zh-CN.md)：步骤固定）与 **智能体（agent）**（由模型决定调用哪些工具、按什么顺序、调用几次）的区别
- 用 *HTTP Request Tool* 和 `$fromAI()` 把 **任何 HTTP API 变成工具**
- 为什么智能体需要 **计算器**（大模型做算术并不可靠）
- **记忆**：“那换成美元呢？”这类追问是怎么实现的
- 编写带有清晰工具使用规则的 **系统消息（system message）**

## 配置

1. 导入 [`workflow.json`](workflow.json)。
2. **OpenAI Chat Model → Credential → Create new → OpenAI**，粘贴你的 API Key。要换成其他提供商，只需把这个节点换成 *Anthropic*、*Google Gemini*、*Mistral*、*Ollama* 或其他支持 **工具调用（tool calling）** 的聊天模型。
   - **国内模型：** DeepSeek、通义千问等兼容 OpenAI 接口的模型，可以在 OpenAI 凭证中修改 **Base URL** 后直接使用，具体做法见 [菜谱 09 · 配置](../09-ai-support-ticket-triage/README.zh-CN.md#配置)。请确认所选模型支持工具调用。
3. 点击画布底部的 **Open chat**，在编辑器里直接测试。
4. 要分享聊天页面：**发布** 工作流，然后打开 **Chat Trigger** 节点复制 *Chat URL*。

## 动手试试

| 你输入 | 发生了什么 |
|---|---|
| *How many Japanese yen is 250 euros?*（或 *250 欧元能换多少日元？*） | 智能体 → **Currency Rates**（`base=EUR`、`symbols=JPY`）→ **Calculator**（`250 * 177.33`）→ *“250 欧元约合 44,332.50 日元（2026-10-12 欧洲央行汇率）。”* |
| *And in US dollars?*（*那换成美元呢？*） | 问题里没有金额，也没有原币种。**记忆** 从上一轮对话中补上“250 欧元” → Currency Rates（`USD`）→ Calculator。 |
| *Tell me a joke*（*讲个笑话*） | 没有合适的工具 → 智能体礼貌地说明自己能做什么（这是系统消息规定的）。 |

> 系统消息是英文写的，但大模型一般会用你提问的语言回答。想固定用中文回答，可以在 **AI Agent → Options → System Message** 末尾加一句 “Always answer in Simplified Chinese.”。

运行后打开 **AI Agent** 节点，查看 *Logs* 面板：每一次工具调用及其输入输出都在里面。这是理解和调试智能体的最好方法。

## 工作原理

| 节点 | 作用 |
|---|---|
| **Chat Trigger** | 公开的托管聊天页面。每个浏览器会话有一个 `sessionId`。 |
| **AI Agent** | 工具型智能体（Tools agent）。它把用户消息、系统消息、记忆和 **工具描述** 发给模型。模型要求调用某个工具时，智能体就执行它，并循环往复，直到模型给出最终答案。 |
| **OpenAI Chat Model** | `gpt-4o-mini`，temperature 0，让工具调用更稳定。 |
| **Memory** | 以 `sessionId` 为键的 *Simple Memory*，保留最近 10 条消息。它保存在 n8n 的进程内存中；想在重启后仍然保留，请使用 *Postgres* 或 *Redis Chat Memory*。 |
| **Currency Rates** | 把普通的 **HTTP Request** 节点当作工具使用。`{{ $fromAI('base', '…', 'string') }}` 告诉模型这个值必须由它提供。模型正是读了 **工具描述** 才决定何时使用这个工具。 |
| **Calculator** | 精确计算。 |

## 写好工具的要点

- **名称和描述最重要。** 写清楚 *什么时候* 用这个工具，以及每个参数的含义，并附上例子（`e.g. EUR`）。
- 工具输出要 **精简**。过大的 JSON 既耗 token，又会让模型困惑。
- 在系统消息中给智能体定 **规则**（“绝不要猜测汇率”）。
- 从 **2–5 个工具** 开始。相似的工具太多，模型容易选错。

## 扩展思路

- 加一个 **Call n8n Workflow Tool**，调用 [菜谱 12](../12-reusable-notification-subworkflow/README.zh-CN.md) 的子工作流（“把这个发给我的团队”）。
- 加一个 **Data Table** 工具查询客户信息（[菜谱 19](../19-mini-crm-with-data-tables/README.zh-CN.md)）。
- 把聊天窗口嵌入你的网站：Chat Trigger → *Mode: Embedded Chat*，再配合 `@n8n/chat` 组件。

## 常见问题

| 现象 | 解决方法 |
|---|---|
| 智能体编造汇率 | 把工具描述和系统消息写得更明确，使用 temperature 0，或换一个更强的模型。 |
| `… has a "supplyData" method but no "execute" method` | 你在新版 AI Agent 上使用了旧版的 *HTTP Request Tool (LangChain)* 节点。请像本菜谱一样，把标准 **HTTP Request** 节点当作工具使用。 |
| 追问时丢失了上下文 | 记忆没有连上，或者每条消息的 `sessionId` 都不一样。 |
| `Tool calling is not supported` | 选择支持工具调用的聊天模型（目前大多数 OpenAI、Anthropic、Gemini、Mistral、DeepSeek 模型都支持）。 |
