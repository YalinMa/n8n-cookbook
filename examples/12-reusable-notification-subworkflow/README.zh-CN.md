# 12 · 可复用的通知子工作流（Reusable Notification Sub-workflow）

[English](README.md) · **简体中文**

> 逻辑只写 **一次**，任何工作流都能像调用函数一样调用它。本例：一个统一的发送通知的方式。

| 难度 | 时间 | 凭证 | 用到的节点 |
|---|---|---|---|
| ⭐⭐ 中级 | 15 分钟 | 无（可选：聊天 Webhook 地址） | Execute Workflow Trigger、Execute Workflow、Edit Fields、Code |

这个示例有 **两个** 工作流文件：

| 文件 | 作用 |
|---|---|
| [`notification-subworkflow.json`](notification-subworkflow.json) | **12a · Send Notification**：可复用的子工作流。接收 `level`、`title`、`message` 和 `link`，生成格式统一的消息并发送。 |
| [`order-events-workflow.json`](order-events-workflow.json) | **12b · Order Events**：一个“主”工作流，每个事件调用一次 12a。 |

```
12b · Order Events
Manual Trigger ─▶ Sample Events ─▶ Describe Event ─▶ Notify via Sub-workflow ─ ─ ─ ┐  调用（每个数据项一次）
                 （3 个数据项）   （level、title、                                  │
                                   message、link）                                 ▼
12a · Send Notification
When Called by Another Workflow ─▶ Format Message ─▶ Deliver（已禁用）─▶ Return Result ──▶ 返回 12b
```

## 你将学到

- 把大型自动化拆成 **小而可复用的工作流**（就像代码里的函数）
- 在 *Execute Workflow Trigger* 上声明 **带类型的输入**，让调用方看到一个只含这些字段的表单
- 用 **Execute Workflow**（*Run once for each item*）传入数据，并拿回子工作流最后一个节点的输出
- 为什么在 n8n 2.x 中子工作流必须 **发布**

## 配置

1. 先导入 **12a**（[`notification-subworkflow.json`](notification-subworkflow.json)），再导入 **12b**（[`order-events-workflow.json`](order-events-workflow.json)）。
2. 在 **12b** 中打开 **Notify via Sub-workflow** → **Workflow** → 选择 **12a · Send Notification (Sub-workflow)**。四个输入字段会显示出来，并且已经映射好。
3. **发布 12a**（在它的编辑器中点击 *Publish*）。在 n8n 2.x 中，其他工作流的生产运行只能调用 **已发布** 的子工作流。手动测试运行时，使用草稿版本也可以。
4. *（可选）* 在 12a 中把 Slack/Discord 的 Webhook 地址粘贴到 **Deliver** 并启用。之后所有调用 12a 的工作流都会发到这个频道。（飞书 / 钉钉 / 企业微信见 [快速上手 · 发送到其他聊天工具](../../docs/getting-started.zh-CN.md#6-发送到其他聊天工具)。）

## 动手试试

在 **12b** 中点击 **Test workflow**。**Notify via Sub-workflow** 会为每个事件返回一个结果：

```
ℹ️ *New order A-1001*
Ada · $129.90
👉 https://shop.example.com/admin/orders/A-1001

⚠️ *Low stock: MUG-BLUE*
Only 3 left in stock.

🚨 *Payment failed for A-1002*
Grace · $54.00
👉 https://shop.example.com/admin/orders/A-1002
```

打开 **12a → Executions**，可以看到它运行了三次子执行。

## 工作原理

| 节点 | 作用 |
|---|---|
| **When Called by Another Workflow**（12a） | 声明了 4 个输入的 *Execute Workflow Trigger*。这些输入会成为子工作流收到的数据项的字段。 |
| **Format Message**（12a） | 根据级别选择 emoji（`{ info: 'ℹ️', … }[$json.level]`），只在有链接时才附上链接。 |
| **Deliver**（12a） | 发送到你的聊天 Webhook（填好地址前处于禁用状态）。 |
| **Return Result**（12a） | **最后一个节点的输出会返回** 给调用方。 |
| **Describe Event**（12b） | 把不同结构的事件统一转换成这 4 个标准输入。 |
| **Notify via Sub-workflow**（12b） | *Execute Workflow*，模式为 **Run once for each item** → 产生 3 次子执行。 |

## 什么时候该做成子工作流

- 同样的步骤出现在 **2 个以上的工作流** 中（通知、日志、“按邮箱查找客户”……）
- 某个工作流变得 **太大**，难以阅读
- 想给 **AI 智能体** 提供一个自定义工具（*Call n8n Workflow Tool*），用的是同样的子工作流模式

## 扩展思路

- 在 12a 中加一个 `channel` 输入和一个 Switch，路由到 Slack、邮件、短信或飞书。
- 把 12a 用作 **错误工作流**（[菜谱 10](../10-error-handling-and-alerts/README.zh-CN.md)）的发送步骤。
- 在 12b 中设置 *Options → Wait For Sub-Workflow Completion: off*，调用后不等待结果。

## 常见问题

| 现象 | 解决方法 |
|---|---|
| `Workflow is not active and cannot be executed` | 发布 12a。生产调用方需要已发布的子工作流。 |
| `Workflow does not exist` | 12b 中的 *Workflow* 下拉框仍然指向原作者的 ID。重新选择 12a。 |
| 子工作流收到的字段为空 | 检查 12b 中 **Workflow Inputs** 下的字段映射。如果在 12a 中改过输入名，点击 *Refresh*。 |
| `… is not allowed to call this workflow` | 在 12a → *Settings → This workflow can be called by* 中允许该调用方。 |
