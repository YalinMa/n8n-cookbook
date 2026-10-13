# 10 · 错误处理与告警（Error Handling & Alerts）

[English](README.md) · **简体中文**

> 让工作流更有韧性：不稳定的调用自动重试，失败时优雅地走备用方案，真正出问题时收到告警。

| 难度 | 时间 | 凭证 | 用到的节点 |
|---|---|---|---|
| ⭐⭐⭐ 中级+ | 15 分钟 | 无（可选：聊天 Webhook 地址） | Error Trigger、HTTP Request（重试 + 错误输出）、IF、Stop and Error、Edit Fields |

这个示例有 **两个** 相互配合的工作流文件：

| 文件 | 作用 |
|---|---|
| [`error-alert-workflow.json`](error-alert-workflow.json) | **10a · Error Alert**：可复用的 *错误工作流（Error Workflow）*，只要挂上它的工作流失败，就会发送一条消息。 |
| [`flaky-workflow-demo.json`](flaky-workflow-demo.json) | **10b · Error Handling Demo**：演示重试、带备用数据的错误分支，以及主动失败。 |

```
10b · Error Handling Demo
                                                    成功 ─▶ Use API Data ──────────┐
Manual Trigger ─▶ Settings ─▶ Call Unreliable API ─┤                               ├─▶ Fail on Purpose? ─┬─ true ─▶ Stop and Error ══╗
                             （重试 3 次 · 间隔 2 秒） 出错 ─▶ Use Fallback Data ────┘                     └─ false ─▶ Continue      ║
                                                                                                                                  ║ 触发
10a · Error Alert                                                                                                                 ║
Error Trigger ─▶ Build Alert ─▶ Send Alert（已禁用）  ◀═══════════════════════════════════════════════════════════════════════════╝
```

## 你将学到

n8n 错误处理的四个层次，作用范围从小到大：

| 层次 | 在哪里设置 | 什么时候用 |
|---|---|---|
| 1. **Retry On Fail**（失败重试） | 节点 → *Settings* | 调用 *偶尔* 失败（超时、限流、502）。 |
| 2. **On Error → Continue (using error output)**（走错误输出） | 节点 → *Settings* | 你有合理的 *备用方案*（缓存数据、默认值、跳过这一条）。 |
| 3. **Stop and Error**（主动报错） | 流程中的一个节点 | 数据无效，你想带着清晰的提示 *主动* 失败。 |
| 4. **Error Workflow**（错误工作流） | 工作流 → *Settings* | 发生了你没处理到的失败，需要让人知道。 |

## 配置

1. 导入 **两个** 文件：[`error-alert-workflow.json`](error-alert-workflow.json) 和 [`flaky-workflow-demo.json`](flaky-workflow-demo.json)。
2. 在 **10a · Error Alert** 中，可以选择把 Slack/Discord 的 Webhook 地址粘贴到 **Send Alert** 并启用该节点（或换成 *Send Email*、*Telegram*、*Microsoft Teams*，飞书 / 钉钉见 [快速上手 · 发送到其他聊天工具](../../docs/getting-started.zh-CN.md#6-发送到其他聊天工具)）。然后 **发布 10a**。在 n8n 2.x 中，错误工作流只有发布后才会运行；否则失败只会写进服务器日志。
3. **把两者关联起来：** 打开 **10b · Error Handling Demo** → **⋯ → Settings → Error Workflow** → 选择 **10a · Error Alert** → 保存。
4. 以后你搭的每个重要工作流都这样设置一下。一个错误工作流可以服务所有工作流。

## 动手试试

**A · 重试 + 备用方案（默认）**

在 10b 中点击 **Test workflow**。**Call Unreliable API** 调用 `httpbin.org/status/500`，它总是失败。n8n 会尝试 3 次，每次间隔 2 秒（总共约 4 秒）。然后数据项从该节点的 **错误输出** 流向 **Use Fallback Data**：

```json
{ "source": "fallback", "data": { "note": "cached default values" }, "apiError": "500 - …" }
```

这次运行 **成功** 结束，因为失败已经被处理了。

**B · 主动失败 → 告警**

1. 在 **Settings** 中把 `failOnPurpose` 设为 `true`。
2. 错误工作流只会在 **生产** 运行（触发器 / 定时 / Webhook）时触发，点击 *Test workflow* 时不会触发。要亲眼看到告警：
   - 把 Manual Trigger 换成 **Schedule Trigger**（每分钟一次），把工作流发布一分钟，**或者**
   - 打开 **10a**，点击 **Test workflow**，查看 Error Trigger 显示的示例数据，预览消息格式。
3. 告警内容类似：

   ```
   ❌ Workflow *10b · Error Handling Demo* failed
   • Node: Stop and Error
   • Error: Stopped on purpose (data source: fallback). This failure triggers the Error Workflow.
   • Mode: trigger
   • Details: https://your-n8n/workflow/…/executions/…
   ```

## 工作原理

| 节点 | 作用 |
|---|---|
| **Call Unreliable API** | *Settings*：开启 **Retry On Fail**，**Max Tries** 3，**Wait Between Tries** 2000 毫秒，**On Error** = *Continue (using error output)*。这个节点因此有两个输出：成功（上）和错误（下）。 |
| **Use API Data** / **Use Fallback Data** | 正常路径与备用方案。两者输出的数据结构相同（`source`、`data`），后面的节点不用关心走的是哪条路。 |
| **Fail on Purpose?** | 用 `$('Settings').first().json` 读取 **Settings** 中的开关。 |
| **Stop and Error** | 以你自定义的信息让执行失败。 |
| **Error Trigger**（10a） | 接收 `workflow.name`、`execution.id`、`execution.url`、`execution.error.message`、`execution.lastNodeExecuted`…… |

## 最佳实践

- **每个生产工作流都应该挂一个错误工作流。** 悄无声息的失败是自动化的头号痛点。
- 只对 **幂等** 操作（重复执行也安全）做重试。不要盲目重试“扣款”这类操作。
- 让备用输出与正常输出 **结构一致**，这样下游节点可以保持简单。
- 在错误信息中写上 **上下文**：哪个客户、哪个订单、哪一步。
- 自部署时设置 `N8N_EDITOR_BASE_URL`，这样告警中的 `execution.url` 才是可点击的链接。

## 常见问题

| 现象 | 解决方法 |
|---|---|
| 错误工作流从来没运行过 | 常见原因有三个：10a 没有 **发布**；失败发生在手动测试运行中；或失败的工作流没有设置 *Settings → Error Workflow*。 |
| `execution.url` 为空 | 在自部署实例上设置 `N8N_EDITOR_BASE_URL`。 |
| 节点没有错误输出 | 把 *Settings → On Error* 设为 **Continue (using error output)**。而 *Continue*（regular output）会把错误混进正常输出里。 |
