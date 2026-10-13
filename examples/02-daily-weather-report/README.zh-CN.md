# 02 · 每日天气播报（Daily Weather Report）

[English](README.md) · **简体中文**

> 每天早上从公开 API 获取天气预报，整理成一条友好的聊天消息。

| 难度 | 时间 | 凭证 | 用到的节点 |
|---|---|---|---|
| ⭐ 入门 | 10 分钟 | 无（可选：聊天 Webhook 地址） | Schedule Trigger、Manual Trigger、Edit Fields、HTTP Request、Code |

```
Every Day 07:30 ─┐
                 ├─▶ Settings ─▶ Get Forecast ─▶ Format Message ─▶ Send to Chat（已禁用）
Manual Trigger ──┘   （城市）    （Open-Meteo）   （JavaScript）     （Slack/Discord）
```

## 你将学到

- 让工作流 **定时** 运行
- 用 **HTTP Request** 节点和 **查询参数** 调用任意 REST API
- 在 **Code** 节点里写一点 JavaScript
- 用 `$('Settings').first().json` 读取 *前面* 节点的数据
- 为什么 **两个触发器** 很有用：一个用于生产，一个用于测试

## 配置

1. 导入 [`workflow.json`](workflow.json)。
2. 打开 **Settings**，修改 `city`、`latitude` 和 `longitude`。可以在 [open-meteo.com](https://open-meteo.com/en/docs) 搜索你的城市来查坐标（例如上海：31.23, 121.47）。
3. *（可选）* 让消息发到聊天工具：
   - **Slack：** 创建一个 [Incoming Webhook](https://api.slack.com/messaging/webhooks) 并复制地址。
   - **Discord：** *频道设置 → 整合 → Webhook → 新 Webhook → 复制 URL*。
   - **飞书 / 钉钉 / 企业微信：** 在群里添加“自定义机器人”并复制 Webhook 地址，然后按 [快速上手 · 发送到其他聊天工具](../../docs/getting-started.zh-CN.md#6-发送到其他聊天工具) 修改请求体格式。
   - 把地址粘贴到 **Send to Chat → URL**，然后启用该节点：右键 → **Enable**，或选中后按 `D`（它默认是禁用的，这样没有地址也能跑通示例）。

   请求体同时包含 `text`（Slack 用）和 `content`（Discord 用），所以同一个节点两者都能用。

## 动手试试

点击 **Test workflow**，Manual Trigger 会被触发。打开 **Format Message**，你会看到类似这样的内容：

```
Good morning! Weather for Berlin today (2026-10-13):
⛅ Partly cloudy
🌡️ 8.1°C – 15.4°C (now 9.3°C)
☔ Chance of rain: 35%
👉 No umbrella needed.
```

（消息文本在 **Format Message** 的代码里，你可以直接改成中文。）

要每天运行，请 **发布** 工作流。生产环境中只有 Schedule Trigger 会运行，Manual Trigger 会被忽略。

## 工作原理

| 节点 | 作用 |
|---|---|
| **Every Day 07:30** | 定时触发器。使用 *Workflow settings → Timezone* 中设置的时区，没有设置时使用实例默认时区。 |
| **Manual Trigger** | 让你一键测试。两个触发器都连到同一个后续节点。 |
| **Settings** | 把所有可能要改的值集中放在一个显眼的地方。每个工作流都值得养成这个习惯。 |
| **Get Forecast** | `GET https://api.open-meteo.com/v1/forecast`，查询参数由 `{{ $json.latitude }}` 这样的表达式生成。 |
| **Format Message** | 把 WMO 天气代码转成 emoji，并拼出多行文本。Code 节点返回的是一个 **数据项数组**：`[{ json: {...} }]`。 |
| **Send to Chat** | 把消息以 JSON 格式 POST 到 incoming webhook 地址。 |

## 扩展思路

- 只在可能下雨时发送：在 *Send to Chat* 前加一个 **IF** 节点（`rainChance >= 50`）。
- 播报多个城市：把 **Settings** 改成一个 Code 节点，每个城市返回一个数据项。后面的每个节点都会自动对每个数据项各运行一次。
- 用原生的 **Slack**、**Telegram** 或 **Send Email** 节点代替 HTTP Webhook。

## 常见问题

| 现象 | 解决方法 |
|---|---|
| 定时运行的时间不对 | 设置 *Workflow settings → Timezone*，或在自部署的 n8n 上设置 `GENERIC_TIMEZONE`（例如 `Asia/Shanghai`）。 |
| `Send to Chat` 报 404/403 | Webhook 地址错误或已被撤销，重新创建一个。 |
| `Cannot read properties of undefined (reading 'time')` | API 返回了错误。查看 **Get Forecast** 的输出，例如坐标是否无效。 |
