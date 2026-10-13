# 06 · 网站可用性监控（Website Uptime Monitor）

[English](README.md) · **简体中文**

> 每 5 分钟检查一组网站，发送一条告警，列出所有宕机的网站。

| 难度 | 时间 | 凭证 | 用到的节点 |
|---|---|---|---|
| ⭐⭐ 中级 | 10 分钟 | 无（可选：聊天 Webhook 地址） | Schedule Trigger、Code、HTTP Request、Edit Fields、IF、Aggregate、No Op |

```
Every 5 Minutes ─┐
                 ├─▶ Sites to Check ─▶ Check URL ─▶ Summarize Result ─▶ Is Down? ─┬─ true ─▶ Collect Down Sites ─▶ Build Alert ─▶ Send Alert（已禁用）
Manual Trigger ──┘    （4 个数据项）  （从不中断）  （isUp、problem）             └─ false ─▶ All Good
```

## 你将学到

- 在 Code 节点中生成一个 **数据项列表**，让后面的每个节点对每个网站各运行一次
- 让 HTTP Request **容忍失败**：
  - *Never Error*：4xx/5xx 响应作为数据返回，而不是抛出错误
  - *On Error: Continue*：DNS 错误和超时不会中断工作流
- 获取 **完整响应**（状态码 + 响应头），而不只是响应体
- 用 `$('Sites to Check').item` 从前面的节点读取 **同一个数据项** 的数据
- 用 **Aggregate** 只发 *一条* 告警，而不是每个故障网站各发一条

## 配置

1. 导入 [`workflow.json`](workflow.json)。
2. 编辑 **Sites to Check** 中的列表。每个网站一行，包含 `name` 和 `url`。其中两条演示数据是故意写坏的（`httpbin.org/status/503` 和一个 `.invalid` 域名）。看到告警生效后就可以删掉它们。
3. *（可选）* 把 Slack/Discord 的 incoming webhook 地址粘贴到 **Send Alert**，然后启用该节点（右键 → **Enable**，或按 `D`）。如何获取 Webhook 地址，以及飞书 / 钉钉 / 企业微信的设置方法，见 [菜谱 02](../02-daily-weather-report/README.zh-CN.md#配置)。

## 动手试试

点击 **Test workflow**。在 **Build Alert** 中你会看到：

```
🚨 2 site(s) down at 09:42:
• Demo: server error (https://httpbin.org/status/503) – HTTP 503
• Demo: bad domain (https://this-site-does-not-exist.invalid) – getaddrinfo ENOTFOUND …
```

（具体的网络错误文本取决于你的系统和网络环境：可能是 `ENOTFOUND`、TLS 错误或超时。）

发布工作流后，它会每 5 分钟检查一次。

## 工作原理

| 节点 | 作用 |
|---|---|
| **Sites to Check** | 返回 4 个数据项。之后的任何节点都会运行 4 次，每个数据项一次，不需要写循环。 |
| **Check URL** | `GET {{ $json.url }}`，开启了 *Response → Include Response Headers and Status* 和 *Never Error*，超时 10 秒。*Settings → On Error* 设为 **Continue**，所以网络故障会变成一个带 `error` 字段的数据项。 |
| **Summarize Result** | 整理出一个干净的数据项：`name`、`url`、`statusCode`、`isUp`（2xx/3xx 视为正常）、`problem`。 |
| **Is Down?** | 故障网站走 **true**，正常网站走 **false**。 |
| **Collect Down Sites** | 把所有故障数据项聚合成一个 `downSites` 数组。 |
| **Build Alert** / **Send Alert** | 生成一条消息并发送出去。 |

## 扩展思路

- **避免重复告警：** 用工作流静态数据记住哪些网站已经宕机（做法见 [菜谱 07](../07-github-release-watcher/README.zh-CN.md)）。只在 *状态变化* 时告警，恢复时再发一条“✅ 已恢复”。
- **检查内容而不只是状态码：** 加一个条件，要求响应体中包含预期的文字。
- **记录响应时间：** 开启 *Options → Response → Include Response Headers and Status*，再用 Code 节点在请求前后各记一次 `Date.now()`。
- 从 Google Sheets 读取网站列表，让不懂技术的同事也能编辑。

## 常见问题

| 现象 | 解决方法 |
|---|---|
| 一个坏网站导致整个运行停止 | **Check URL → Settings → On Error** 必须是 *Continue*。 |
| 所有网站都显示 `statusCode: 0` | 没有开启完整响应。检查 *Options → Response → Include Response Headers and Status*。 |
| 套了 Cloudflare 的网站返回 403 | 有些网站会拦截机器人。在 **Check URL** 中加一个类似浏览器的 `User-Agent` 请求头。 |
