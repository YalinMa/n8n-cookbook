# 08 · 合并两个 API 的数据（Merge Data from Two APIs）

[English](README.md) · **简体中文**

> 按共同的键把两个数据源的数据连接起来（类似 SQL 的 `JOIN`），生成一份合并报表。

| 难度 | 时间 | 凭证 | 用到的节点 |
|---|---|---|---|
| ⭐⭐ 中级 | 10 分钟 | 无 | HTTP Request ×2、Filter、Summarize、Merge、Edit Fields、Sort |

```
                ┌─▶ Get Users ─────────────────────────────────────────────┐ 输入 1
Manual Trigger ─┤                                                          ├─▶ Merge by User ID ─▶ Build Report Row ─▶ Rank Users
                └─▶ Get Todos ─▶ Only Completed ─▶ Count per User ─────────┘ 输入 2
                   （200 条）     （Filter）        （Summarize）
```

## 你将学到

- 从一个触发器出发运行 **并行分支**
- **Summarize**：按某个字段分组并计数（类似 `GROUP BY userId`）
- **Merge → Combine → Matching Fields**：在 `users.id = todos.userId` 的条件下连接两个列表
- 不同的 **连接方式**（内连接、左连接、全外连接）
- HTTP Request 节点如何把 JSON **数组** 响应拆分成多个数据项

## 配置

1. 导入 [`workflow.json`](workflow.json)。
2. 不需要凭证。数据来自 [JSONPlaceholder](https://jsonplaceholder.typicode.com/)，一个免费的假数据 REST API，包含 10 个用户和 200 条待办事项。

## 动手试试

点击 **Test workflow**，然后打开 **Rank Users**：

| Name | Email | Company | City | Completed Todos | Completion Rate |
|---|---|---|---|---|---|
| Chelsey Dietrich | Lucio_Hettinger@annie.ca | Keebler LLC | Roscoeview | 12 | 60% |
| Clementina DuBuque | Rey.Padberg@karina.biz | Hoeger LLC | Lebsackbury | 12 | 60% |
| Leanne Graham | Sincere@april.biz | Romaguera-Crona | Gwenborough | 11 | 55% |
| … | | | | | |

（每个用户有 20 条待办事项。）

## 工作原理

| 节点 | 作用 |
|---|---|
| **Get Users** / **Get Todos** | 两个普通的 `GET` 请求。API 返回的是 JSON 数组，所以 n8n 会自动把 **每个元素变成一个数据项**。 |
| **Only Completed** | 只保留 `completed` 为 true 的待办事项。 |
| **Count per User** | Summarize：按 `userId` 分组，对 `id` 进行 *Count*（计数）。输出：每个用户一个数据项，包含 `userId` 和 `count_id`。 |
| **Merge by User ID** | *Combine → Matching Fields*，`id`（输入 1）= `userId`（输入 2）。输出类型 **Enrich Input 1** 会保留 *所有* 用户，即使已完成数为 0（相当于左连接）。*Options → Fuzzy Compare* 已 **开启**，原因见下方警告。 |
| **Build Report Row** | 挑选并重命名需要的列。`$json.company.name` 可以读取嵌套对象。 |
| **Rank Users** | 按已完成数从高到低排序。 |

> ⚠️ **Merge 的头号陷阱：类型。** *Summarize* 把分组键输出为 **文本**（`"userId": "1"`），而用户 API 返回的是 **数字**（`"id": 1`）。严格比较时 `1 ≠ "1"`，所以什么都匹配不上，每个用户都显示 0。*Fuzzy Compare* 会把 `1` 和 `"1"` 视为相等。你可以把它关掉再运行一次，亲眼看看这个问题。

### Merge 输出类型速查

| 输出类型 | 对应 SQL | 保留什么 |
|---|---|---|
| Keep Matches | `INNER JOIN` | 只保留两边都有的行 |
| Keep Non-Matches | 反连接（anti-join） | 只在一边出现的行 |
| Keep Everything | `FULL OUTER JOIN` | 两边的所有行 |
| Enrich Input 1 | `LEFT JOIN` | 输入 1 的全部行 + 输入 2 中匹配的数据 |
| Enrich Input 2 | `RIGHT JOIN` | 输入 2 的全部行 + 输入 1 中匹配的数据 |

Merge 节点还可以 *Append*（把两个列表上下拼接），或 *By Position*（按位置合并，第 1 行配第 1 行……）。

## 扩展思路

- 真实场景中的组合：CRM 联系人 + 发票（谁还没付款？）、员工 + 工单（谁的工作量过大？）、电商订单 + 物流状态。
- 用 **Convert to File** 导出结果（见 [菜谱 05](../05-api-to-csv-export/README.zh-CN.md)）。
- 复杂的连接可以用 **Merge → SQL Query** 模式直接写 SQL。

## 常见问题

| 现象 | 解决方法 |
|---|---|
| Merge 没有输出 / 匹配不上 | 匹配字段的 **类型** 不同（字符串 `"1"` 与数字 `1`）。开启 *Options → Fuzzy Compare*，或先把一边转换类型。 |
| 每个用户的已完成数都是 0 | **Merge** 中的字段名对不上。检查 **Count per User** 的实际输出（`userId`、`count_id`）。 |
| 只运行了一个分支 | 两个分支必须连在同一个触发器的输出上。 |
