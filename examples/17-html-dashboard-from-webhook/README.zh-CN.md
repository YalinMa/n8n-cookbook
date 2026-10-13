# 17 · 用 Webhook 提供 HTML 看板（HTML Dashboard from a Webhook）

[English](README.md) · **简体中文**

> 直接由 n8n 提供一个 **实时网页**：带 30 天趋势图的汇率看板，不需要任何网站托管。

| 难度 | 时间 | 凭证 | 用到的节点 |
|---|---|---|---|
| ⭐⭐ 中级 | 10 分钟 | 无 | Webhook（GET）、Edit Fields、HTTP Request（错误输出）、Code、Respond to Webhook（HTML） |

```
Open Dashboard ─▶ Settings ─▶ Get 30-Day Rates ─┬─ 成功 ─▶ Build HTML Page ─▶ Serve Page          （200，text/html）
 GET ?base=USD   （校验查询参数）                 └─ 出错 ─▶ Serve Error Page                        （502，text/html）
```

## 你将学到

- 使用 **GET** 方式的 Webhook 和 **查询参数**（`$json.query.base`）
- 使用输入前先 **校验**（`/^[A-Za-z]{3}$/`）
- 在 Code 节点中生成 **HTML**（包含内嵌 SVG 图表）
- 返回 **自定义响应头**（`Content-Type: text/html`、`Cache-Control`）
- 利用 HTTP 节点的错误输出显示一个友好的 **错误页面**

## 配置

1. 导入 [`workflow.json`](workflow.json)。
2. **发布** 工作流，然后在浏览器中打开生产地址：
   `http://localhost:5678/webhook/fx-dashboard`
   （搭建过程中，点击 *Test workflow* 并改用 `/webhook-test/fx-dashboard`。）

不需要凭证。数据来自 [Frankfurter](https://frankfurter.dev)（欧洲央行参考汇率）。

## 动手试试

打开页面，然后点击顶部的货币链接（`?base=USD`、`?base=CNY`……）。每一行显示一种货币的当前汇率、30 天涨跌幅（绿色 / 红色）和一条迷你趋势线：

```
1 USD =
ECB reference rates · 2026-09-14 → 2026-10-12
Currency   Rate       30 days   Trend
CHF        0.8328     +2.15%    ╱╲╱‾
CNY        6.6928     −0.23%    ‾╲_╱
EUR        0.8944     +3.68%    _╱‾‾
…
```

像 `?base=<script>` 这样的非法输入会被忽略，自动回退到 EUR。

（页面文字在 **Build HTML Page** 的代码中，可以直接改成中文。）

## 工作原理

| 节点 | 作用 |
|---|---|
| **Open Dashboard** | Webhook，方法为 **GET**，路径 `fx-dashboard`，由 Respond 节点返回响应。 |
| **Settings** | 校验 `base`（必须正好是 3 个字母，否则用 `EUR`），并用 Luxon 计算起始日期。 |
| **Get 30-Day Rates** | `GET /v1/<from>..?base=…&symbols=…`。设置了 *On Error → Continue (using error output)*，API 出问题时会显示一个页面，而不是空白的报错。 |
| **Build HTML Page** | 纯 JavaScript 模板字符串：一张表格，每种货币一条 SVG `<polyline>`。不依赖任何外部库。 |
| **Serve Page** | *Respond With: Text* + 响应头 `Content-Type: text/html; charset=utf-8`，浏览器才会把它渲染成网页。 |

## 扩展思路

- 把 **任何** 数据放到网页上：你的 Google Sheet、Data Table（[菜谱 19](../19-mini-crm-with-data-tables/README.zh-CN.md)），或可用性监控结果（[菜谱 06](../06-website-uptime-monitor/README.zh-CN.md)）。
- 给 Webhook 节点加上 **Basic Auth**，让页面只对授权的人可见。
- 从 CDN 引入 Chart.js 或 ECharts，做交互式图表。
- 提供一个小 **表单页面**，提交到另一个 Webhook：一个完全由 n8n 工作流组成的迷你网页应用。

## 常见问题

| 现象 | 解决方法 |
|---|---|
| 浏览器把 HTML 源码当文本显示 | **Serve Page** 中的 `Content-Type` 响应头缺失或写错了。 |
| 浏览器显示 `{"message":"Workflow was started"}` | Webhook 的 *Respond* 选项必须是 **Using 'Respond to Webhook' Node**。 |
| 页面打开很慢 | 每次访问都会调用 API。缩短日期范围，或者做缓存：定时把 HTML 存进工作流静态数据，访问时直接从那里返回。 |
