# 03 · RSS 新闻摘要邮件（RSS News Digest by Email）

[English](README.md) · **简体中文**

> 每个工作日早上读取一个 RSS 订阅源，保留最新的新闻，汇总成一封整洁的摘要邮件。

| 难度 | 时间 | 凭证 | 用到的节点 |
|---|---|---|---|
| ⭐⭐ 入门+ | 15 分钟 | SMTP | Schedule Trigger（cron）、RSS Read、Filter、Limit、Aggregate、Edit Fields、Send Email |

```
Weekdays 08:00 ─┐
                ├─▶ Read RSS Feed ─▶ Only Last 24 Hours ─▶ Top 10 ─▶ Combine Into One ─▶ Build Email HTML ─▶ Send Digest Email
Manual Trigger ─┘   （约 30 条）          （Filter）        （Limit）     （Aggregate）        （Set）            （SMTP）
```

## 你将学到

- Schedule Trigger 中的 **Cron 表达式**（`0 8 * * 1-5` 表示周一至周五 08:00）
- 用 `$now.minus({ days: 1 })` 按 **日期** 筛选数据项
- n8n 最重要的一个概念：**多个数据项 vs. 一个数据项**。大多数节点会 *对每个数据项* 各运行一次。**Aggregate** 把它们合并成一个，这样你只发一封邮件，而不是十封。
- 用内联 JavaScript 表达式（`.map(...).join('')`）拼出 HTML

## 配置

1. 导入 [`workflow.json`](workflow.json)。
2. **创建 SMTP 凭证。** 打开 **Send Digest Email → Credential → Create new**，填写你的邮箱服务商的 SMTP 设置：

   | 服务商 | 服务器 | 端口 | SSL/TLS | 密码 |
   |---|---|---|---|---|
   | QQ 邮箱 | `smtp.qq.com` | 465 | 开启 | 在邮箱设置中开启 SMTP 后生成的 **授权码**，不是 QQ 密码 |
   | 163 邮箱 | `smtp.163.com` | 465 | 开启 | 开启 SMTP 服务后生成的 **授权码** |
   | Gmail | `smtp.gmail.com` | 465 | 开启 | [应用专用密码（App Password）](https://support.google.com/accounts/answer/185833)，不是普通密码 |
   | Outlook / Microsoft 365 | `smtp.office365.com` | 587 | 关闭（STARTTLS） | 你的密码或应用密码 |
   | 其他 | 查看服务商的文档 | | | |

   想用 OAuth 而不是 SMTP？把这个节点换成 **Gmail** 或 **Microsoft Outlook** 节点即可，工作流其他部分不用动。
3. 在 **Send Digest Email** 中填写 **From Email**（发件人）和 **To Email**（收件人）。
4. *（可选）* 修改 **Read RSS Feed** 中的订阅源地址。任何 RSS/Atom 源都可以，例如 `https://hnrss.org/newest?q=n8n`，或某个博客的 `/feed` 地址。

## 动手试试

点击 **Test workflow**，然后查看收件箱。注意观察连线上的数据项数量：约 30 → 约 15 → 10 → **1**。

然后 **发布** 工作流，它就会在每个工作日 08:00 运行。

## 工作原理

| 节点 | 作用 |
|---|---|
| **Weekdays 08:00** | *Custom (Cron)* 模式的定时触发器。 |
| **Read RSS Feed** | 读取订阅源。每篇文章成为一个数据项，包含 `title`、`link`、`isoDate`、`content`……开启了 *Settings → Retry On Fail*（重试 3 次，间隔 5 秒），可以扛过短暂的网络抖动。 |
| **Only Last 24 Hours** | Filter 节点，只保留 `isoDate` 晚于“现在减 1 天”的数据项。 |
| **Top 10** | Limit 节点，只保留前 10 个数据项。 |
| **Combine Into One** | Aggregate 节点，*All Item Data* 模式。10 个数据项变成 1 个带 `articles` 数组的数据项。 |
| **Build Email HTML** | 用表达式生成 `subject` 和 `html`。`$json.articles.map(a => ...)` 在表达式里完成循环。 |
| **Send Digest Email** | 通过 SMTP 发送 HTML 邮件。 |

> **没有新文章？** 如果 Filter 没有输出任何数据项，后面的节点都会被跳过，所以不会发出空邮件。这正是我们想要的。

## 扩展思路

- 合并多个订阅源：添加更多 **RSS Read** 节点，用 **Merge** 节点（*Append* 模式）把它们合在一起。
- 只保留包含关键词的新闻：给 Filter 再加一个条件：*title → contains → `AI`*。
- 发送前用大模型给每篇文章写摘要（AI 节点如何接入，见 [菜谱 09](../09-ai-support-ticket-triage/README.zh-CN.md)）。
- 把摘要发到 Slack、飞书或 Notion，而不是邮件。

## 常见问题

| 现象 | 解决方法 |
|---|---|
| `Invalid login` / `535 Authentication failed` | QQ / 163 邮箱需要使用授权码；Gmail 需要应用专用密码（前提是开启两步验证）。 |
| 收到的邮件显示的是 HTML 源码 | 确认填写的是 **HTML** 字段，而不是 **Text**。 |
| Filter 把所有数据都过滤掉了 | 有些订阅源不提供 `isoDate`。查看 **Read RSS Feed** 的输出，把条件改成 `pubDate`。 |
