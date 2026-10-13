# n8n 速查表

[English](cheatsheet.md) · **简体中文**

## 表达式

| 用途 | 表达式 |
|---|---|
| 当前数据项的字段 | `{{ $json.email }}` |
| 嵌套字段 / 特殊字段名 | `{{ $json.address.city }}`、`{{ $json['Is this urgent?'] }}` |
| 默认值 | `{{ $json.name \|\| 'stranger' }}`、`{{ $json.brand ?? '' }}` |
| 前面某节点中“同一个”数据项 | `{{ $('Webhook').item.json.body.id }}` |
| 前面某节点的第一个数据项 | `{{ $('Settings').first().json.city }}` |
| 前面某节点的全部数据项 | `{{ $('Get Users').all().length }}` |
| Webhook 的请求体 / 查询参数 / 请求头 | `{{ $json.body.x }}`、`{{ $json.query.x }}`、`{{ $json.headers['user-agent'] }}` |
| 数据项序号 | `{{ $itemIndex }}` |
| 工作流 / 执行信息 | `{{ $workflow.name }}`、`{{ $execution.id }}` |
| 环境变量（自部署） | `{{ $env.MY_VAR }}` |
| 三元表达式 | `{{ $json.score > 80 ? 'hot' : 'cold' }}` |
| 数组 → 文本 | `{{ $json.tags.join(', ') }}` |
| 对象 → JSON 字符串 | `{{ JSON.stringify($json) }}` |

## 日期（Luxon）

| 用途 | 表达式 |
|---|---|
| 现在 / 今天 | `{{ $now }}`、`{{ $today }}` |
| 格式化 | `{{ $now.toFormat('yyyy-MM-dd HH:mm') }}` |
| ISO 字符串 | `{{ $now.toISO() }}` |
| 加减时间 | `{{ $now.minus({ days: 7 }) }}`、`{{ $now.plus({ hours: 2 }) }}` |
| 解析字符串 | `{{ DateTime.fromISO($json.created_at) }}` |
| 星期几 | `{{ $now.toFormat('cccc') }}` |
| Unix 毫秒 | `{{ $now.toMillis() }}` |

## Cron（Schedule Trigger → Custom）

| 计划 | Cron |
|---|---|
| 每 15 分钟 | `*/15 * * * *` |
| 每天 08:00 | `0 8 * * *` |
| 工作日 08:00 | `0 8 * * 1-5` |
| 每周一 09:30 | `30 9 * * 1` |
| 每月 1 日零点 | `0 0 1 * *` |

## 我该用哪个节点？

| 我想要…… | 节点 |
|---|---|
| 调用任意 API | HTTP Request |
| 添加 / 重命名 / 删除字段 | Edit Fields (Set) |
| 只保留部分数据项 | Filter |
| 走不同分支 | IF / Switch |
| 把数组拆成多个数据项 | Split Out |
| 把多个数据项合成一个数组 | Aggregate |
| 计数 / 求和 / 分组 | Summarize |
| 合并两个数据源 | Merge |
| 排序 / 取前 N 个 | Sort / Limit |
| 跳过之前见过的数据项 | Remove Duplicates |
| 分批处理并暂停 | Loop Over Items + Wait |
| 生成或读取 CSV/XLSX/JSON 文件 | Convert to File / Extract from File |
| 写自定义逻辑 | Code |
| 复用一个工作流 | Execute Workflow（子工作流） |
| 响应 Webhook 请求 | Respond to Webhook |
| 主动报错 | Stop and Error |
| 出错时收到告警 | Error Trigger（放在错误工作流中） |

## 键盘快捷键（编辑器）

| 按键 | 作用 |
|---|---|
| `Tab` | 打开节点面板 |
| `Ctrl/Cmd + Enter` | 测试工作流 |
| `D` | 禁用 / 启用选中的节点 |
| `P` | 固定 / 取消固定选中节点的数据 |
| `Shift + S` | 添加便签 |
| `Ctrl/Cmd + C / V` | 复制 / 粘贴节点（以 JSON 形式！） |
| `F2` | 重命名节点 |
| `1` / `0` | 适应画布 / 重置缩放 |
