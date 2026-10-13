# 核心概念

[English](core-concepts.md) · **简体中文**

理解下面 8 个概念，就理解了 n8n 约 90% 的工作方式。每个概念都附有对应的实战菜谱链接。

## 1. 工作流由节点组成

**工作流（workflow）** 是由 **节点（node）** 和 **连线（connection）** 组成的图，数据从左往右流动。节点分三类：

| 类型 | 例子 | 作用 |
|---|---|---|
| **触发器（Trigger）** | Webhook、Schedule、Form、Gmail Trigger、Error Trigger | 启动工作流。每个工作流至少需要一个。 |
| **动作（Action）** | HTTP Request、Google Sheets、Slack、Send Email | 与外部世界交互。 |
| **核心 / 逻辑** | Edit Fields、IF、Switch、Filter、Merge、Code、Aggregate | 加工数据并决定数据流向。 |

一个工作流可以有 **多个触发器**。本仓库的大多数菜谱都同时有一个用于生产的 *Schedule Trigger* 和一个用于测试的 *Manual Trigger* → [02](../examples/02-daily-weather-report/README.zh-CN.md)。

## 2. 数据是一组数据项（item）

节点之间传递的一切都是 **一组数据项（a list of items）**，每个数据项是一个 JSON 对象：

```json
[
  { "json": { "name": "n8n.io",  "url": "https://n8n.io" } },
  { "json": { "name": "GitHub",  "url": "https://github.com" } }
]
```

**大多数节点会自动对每个数据项各运行一次。** 如果 4 个数据项进入 HTTP Request 节点，它就会发 4 个请求。你很少需要自己写循环 → [06](../examples/06-website-uptime-monitor/README.zh-CN.md)。

改变数据项 *数量* 的关键节点：

| 从 → 到 | 节点 | 菜谱 |
|---|---|---|
| 1 个含数组的数据项 → 多个数据项 | **Split Out** | [05](../examples/05-api-to-csv-export/README.zh-CN.md) |
| 多个数据项 → 1 个含数组的数据项 | **Aggregate** | [03](../examples/03-rss-news-digest-email/README.zh-CN.md)、[06](../examples/06-website-uptime-monitor/README.zh-CN.md) |
| 多个数据项 → 更少的数据项 | **Filter**、**Limit**、**Remove Duplicates** | [03](../examples/03-rss-news-digest-email/README.zh-CN.md)、[05](../examples/05-api-to-csv-export/README.zh-CN.md) |
| 多个数据项 → 分组汇总 | **Summarize** | [08](../examples/08-merge-data-from-two-apis/README.zh-CN.md) |
| 两组列表 → 一组 | **Merge** | [08](../examples/08-merge-data-from-two-apis/README.zh-CN.md) |

> **小技巧：** 运行后每条连线上的小数字就是数据项数量。盯着这个数字看，是理解一个工作流最快的方法。

## 3. 表达式：`{{ … }}`

任何参数都可以是固定值，也可以是 **表达式（expression）**。表达式是写在 `{{ }}` 里的 JavaScript，**对每个数据项分别计算**。

```text
Hello {{ $json.body.name }}!                        → 读取当前数据项
{{ $json.price * 1.2 }}                             → 计算
{{ $json.email.trim().toLowerCase() }}              → 字符串方法
{{ $now.toFormat('yyyy-MM-dd') }}                   → 日期（Luxon）
{{ $('Settings').first().json.city }}               → 读取前面某个节点的数据
{{ $json.items.map(i => i.title).join(', ') }}      → 数组
```

在 JSON 文件中，表达式以 `=` 开头，例如 `"value": "={{ $json.name }}"`。本仓库每个 `workflow.json` 里都能看到。更多写法见 **[速查表](cheatsheet.zh-CN.md)**。

## 4. 凭证与工作流是分开的

API Key、密码和 OAuth 令牌保存在 n8n 加密的 **凭证库（credential store）** 中。工作流只通过 ID *引用* 凭证。这意味着：

- 工作流 JSON 文件可以放心分享（本仓库的文件都不含密钥）。
- 导入后，你要挂上 **自己的** 凭证 → [03](../examples/03-rss-news-digest-email/README.zh-CN.md)、[04](../examples/04-contact-form-to-google-sheets/README.zh-CN.md)、[09](../examples/09-ai-support-ticket-triage/README.zh-CN.md)。
- 同一个凭证可以被多个工作流复用。

## 5. 测试运行与生产运行

| | 测试（*Test workflow* 按钮） | 生产（工作流已 **发布**） |
|---|---|---|
| 用途 | 搭建和调试 | 无人值守地运行 |
| Webhook | `/webhook-test/…`，只监听一次调用 | `/webhook/…`，一直在线 |
| 结果 | 在编辑器中实时显示 | 保存在 **Executions** 中 |

只在生产运行中才会发生的事：**静态数据** 会被保存 → [07](../examples/07-github-release-watcher/README.zh-CN.md)；**错误工作流** 会被触发 → [10](../examples/10-error-handling-and-alerts/README.zh-CN.md)。

**Pin data**（节点输出上的 📌 图标）可以在搭建时“冻结”某个节点的输出。这样能节省 API 调用，并用固定数据测试后面的节点。

## 6. 分支与路由

| 节点 | 作用 |
|---|---|
| **IF** | 把数据项分到 *true* / *false* 两个输出 → [04](../examples/04-contact-form-to-google-sheets/README.zh-CN.md)、[06](../examples/06-website-uptime-monitor/README.zh-CN.md) |
| **Switch** | 路由到多个输出之一，并可设置 *fallback*（兜底）输出 → [09](../examples/09-ai-support-ticket-triage/README.zh-CN.md) |
| **Filter** | 类似 IF，但直接丢弃不匹配的数据项 → [03](../examples/03-rss-news-digest-email/README.zh-CN.md) |

如果某个节点输出 **0 个数据项**，它后面的节点都不会运行。这是实现“没事可做就停下”的简单方法 → [07](../examples/07-github-release-watcher/README.zh-CN.md)。

## 7. Code 节点：万能出口

没有合适的内置节点时，可以写 JavaScript（或 Python）。Code 节点必须 **返回一个数据项数组**：

```js
// 模式：Run Once for All Items
const out = [];
for (const item of $input.all()) {
  out.push({ json: { ...item.json, doubled: item.json.value * 2 } });
}
return out;
```

有内置节点时优先用内置节点，因为别人更容易看懂。真正的逻辑再用 Code → [02](../examples/02-daily-weather-report/README.zh-CN.md)、[07](../examples/07-github-release-watcher/README.zh-CN.md)。

## 8. 出错很正常：提前做好准备

- **Retry On Fail**：应对不稳定的 API
- **On Error → Continue (using error output)**：走备用方案分支
- **Stop and Error**：遇到错误数据时明确地失败
- **错误工作流（Error Workflow）**：出问题时你能收到通知

以上四种都在 → [10](../examples/10-error-handling-and-alerts/README.zh-CN.md)。

## 附加：AI 节点

AI 节点（*AI Agent*、*Basic LLM Chain*、*Information Extractor*、*Text Classifier*……）是 **根节点**，下面插着 **子节点**：一个聊天模型（必需），以及可选的记忆、工具和输出解析器。要把 OpenAI 换成 Anthropic、Gemini、DeepSeek 或本地的 Ollama 模型，只需替换子节点 → [09](../examples/09-ai-support-ticket-triage/README.zh-CN.md)、[15](../examples/15-ai-agent-with-tools-and-memory/README.zh-CN.md)。
