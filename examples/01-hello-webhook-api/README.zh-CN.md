# 01 · Hello Webhook API

[English](README.md) · **简体中文**

> 把 n8n 变成一个迷你 HTTP API：接收请求、转换数据、返回 JSON 响应。

| 难度 | 时间 | 凭证 | 用到的节点 |
|---|---|---|---|
| ⭐ 入门 | 5 分钟 | 无 | Webhook、Edit Fields (Set)、Respond to Webhook |

```
POST /webhook/hello  ──▶  Webhook  ──▶  Build Greeting  ──▶  Respond to Webhook  ──▶  JSON 响应
   {"name":"Ada"}                         （新字段）
```

## 你将学到

- **触发器（trigger）** 如何启动工作流（这里是一个传入的 HTTP 请求）
- 数据如何以 **数据项（item）**（`$json`）的形式在节点间流动
- 如何编写 `{{ $json.body.name }}` 这样的 **表达式**
- **Test URL**（测试地址）和 **Production URL**（生产地址）的区别

## 配置

1. 在 n8n 中进入 **Workflows → Add workflow → ⋯ → Import from File**，选择 [`workflow.json`](workflow.json)。
2. 就这样，不需要任何凭证。

## 动手试试

1. 点击 **Test workflow**。此时 Webhook 节点开始等待一次请求。
2. 在终端里向 **Test URL** 发送请求：

   ```bash
   curl -X POST http://localhost:5678/webhook-test/hello \
     -H "Content-Type: application/json" \
     -d '{"name": "Ada"}'
   ```

3. 你会收到：

   ```json
   {
     "name": "Ada",
     "greeting": "Hello, Ada! 👋",
     "nameLength": 3,
     "receivedAt": "2026-10-13T09:30:00.000+00:00"
   }
   ```

4. 在编辑器里点开每个节点，查看它的输入和输出。

要让这个接口长期可用，请 **发布** 工作流（顶部的 *Publish* 按钮）。之后就可以随时调用 `/webhook/hello`（没有 `-test`）。

## 工作原理

| 节点 | 作用 |
|---|---|
| **Webhook** | 监听 `POST /hello`。*Respond* 设置为 **Using 'Respond to Webhook' node**，所以响应在流程后面再生成。请求内容位于 `$json.body`、`$json.headers` 和 `$json.query`。 |
| **Build Greeting** | 一个 *Edit Fields (Set)* 节点，每个字段都是一个表达式。没有传 name 时，`$json.body.name \|\| 'stranger'` 会使用默认值。`$now` 是当前时间（一个 [Luxon](https://moment.github.io/luxon/) DateTime 对象）。 |
| **Respond to Webhook** | 以 JSON 格式返回当前数据项，状态码 `200`。 |

## 扩展思路

- 加一个 **IF** 节点，`name` 缺失时返回 `400`。
- 在 Webhook 节点上开启 **Header Auth**（*Authentication* → *Header Auth*），只有带着密钥请求头的调用方才能使用。
- 把每次请求保存到 Google Sheets（见 [菜谱 04](../04-contact-form-to-google-sheets/README.zh-CN.md)）。

## 常见问题

| 现象 | 解决方法 |
|---|---|
| `404 The requested webhook "hello" is not registered` | 对于 `/webhook-test/…`，先点 **Test workflow**；测试地址只能调用一次。对于 `/webhook/…`，工作流必须先 **发布**。 |
| 响应是 `{"message":"Workflow was started"}` | Webhook 节点的 *Respond* 选项被改了。改回 **Using 'Respond to Webhook' node**。 |
| `name` 总是 `stranger` | 发送请求时带上 `Content-Type: application/json`，n8n 才会解析请求体。 |
