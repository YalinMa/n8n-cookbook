# 07 · GitHub 新版本监控（GitHub Release Watcher）

[English](README.md) · **简体中文**

> 监控 GitHub 仓库，有新版本发布时只通知你 **一次**。不重复，也不需要数据库。

| 难度 | 时间 | 凭证 | 用到的节点 |
|---|---|---|---|
| ⭐⭐ 中级 | 10 分钟 | 无（可选：聊天 Webhook 地址） | Schedule Trigger、Code、HTTP Request、Edit Fields |

```
Every Hour ─────┐
                ├─▶ Repos to Watch ─▶ Get Latest Release ─▶ Keep Only New Releases ─▶ Build Message ─▶ Send to Chat（已禁用）
Manual Trigger ─┘   （3 个数据项）    （GitHub REST API）    （静态数据记忆）
```

## 你将学到

- 用 **动态 URL**（`/repos/{{ $json.repo }}/releases/latest`）和自定义 **请求头** 调用公开 API
- **去重**：用 `$getWorkflowStaticData('global')` 在多次运行之间记住已经处理过的内容
- 返回 **0 个数据项** 来提前结束工作流
- **手动** 执行与 **生产** 执行的区别

## 配置

1. 导入 [`workflow.json`](workflow.json)。
2. 编辑 **Repos to Watch** 中的列表（格式为 `owner/name`，例如 `facebook/react`）。
3. *（可选）* 把 Slack/Discord 的 Webhook 地址粘贴到 **Send to Chat** 并启用它（飞书 / 钉钉 / 企业微信见 [快速上手 · 发送到其他聊天工具](../../docs/getting-started.zh-CN.md#6-发送到其他聊天工具)）。
4. **发布** 工作流。

> **GitHub 调用限制。** 未认证的请求每个 IP 每小时最多 60 次。每小时检查 3 个仓库完全够用。如果要监控很多仓库，请在 **Get Latest Release** 上添加 GitHub 凭证（*Header Auth*：`Authorization: Bearer <token>`），上限会提升到每小时 5000 次。

## 动手试试

点击 **Test workflow**。由于手动运行不保存记忆，**每个** 版本都会被当成“新版本”，你会在 **Build Message** 中看到 3 条消息：

```
🚀 New release of *n8n-io/n8n*: n8n@2.x.y
https://github.com/n8n-io/n8n/releases/tag/n8n@2.x.y
```

在生产环境中（工作流已发布），第一次运行会记下当前的版本标签。之后只有自上次检查以来发布的新版本才会通知你。

## 工作原理

| 节点 | 作用 |
|---|---|
| **Repos to Watch** | 每个仓库返回一个数据项。 |
| **Get Latest Release** | `GET https://api.github.com/repos/<repo>/releases/latest`。GitHub 要求必须带 `User-Agent` 请求头。 |
| **Keep Only New Releases** | 读取 `memory = $getWorkflowStaticData('global')`，把每个 `tag_name` 与 `memory.lastTags[repo]` 比较。保存新的标签，只返回发生变化的数据项。一次 **生产** 运行成功结束后，n8n 会自动保存 `memory`。 |
| **Build Message** / **Send to Chat** | 生成并发送通知。 |

### 什么时候用静态数据，什么时候用真正的数据库

| 静态数据 | 数据库 / Google Sheets / Redis |
|---|---|
| 数据量小（几 KB），简单的键值对 | 数据量大或会持续增长 |
| 只有这个工作流需要它 | 其他工作流或其他人也需要 |
| 丢了也无妨（最坏情况：多发一条重复提醒） | 绝不能丢失 |

n8n 还有一个内置的 **Remove Duplicates** 节点，其中的 *Remove Items Processed in Previous Executions* 操作可以替代这个 Code 节点，而且不用写代码，值得接下来试试。

## 扩展思路

- 附上更新日志：`release.body` 里是 Markdown 格式的 changelog，可以用大模型总结一下。
- 对不发布 release 的仓库，改为监控 **tags**（`/tags`）。
- 自动在 Jira / Linear / 禅道中创建“升级到 vX.Y”的任务。

## 常见问题

| 现象 | 解决方法 |
|---|---|
| 某个仓库返回 `404 Not Found` | 该仓库没有 *releases*，只有 tags；或者仓库名拼错了。 |
| `403 rate limit exceeded` | 添加 GitHub token（见“配置”），或降低检查频率。 |
| 生产环境中一直收到重复提醒 | 只有工作流 **成功结束** 时才会保存静态数据。查看执行记录里有没有报错。 |
