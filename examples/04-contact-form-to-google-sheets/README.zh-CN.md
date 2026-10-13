# 04 · 联系表单 → Google Sheets（Contact Form to Google Sheets）

[English](README.md) · **简体中文**

> 用 n8n 发布一个托管的网页表单，把每次提交保存为 Google Sheets 中的一行。

| 难度 | 时间 | 凭证 | 用到的节点 |
|---|---|---|---|
| ⭐⭐ 入门+ | 15 分钟 | Google Sheets（OAuth2） | n8n Form Trigger、Edit Fields、Google Sheets、IF、No Op |

```
Contact Form ─▶ Clean Up Data ─▶ Append Row to Sheet ─▶ Is Urgent? ─┬─ true ─▶ Notify Team（占位节点）
（托管表单）    （去空格、转小写、   （Google Sheets）                 └─ false ─▶（结束）
                 加时间戳）
```

## 你将学到

- 用 n8n Form Trigger **不需要网站** 就能做表单
- 存储前先 **清洗数据**（去掉多余空格、统一邮箱格式、加时间戳）
- 连接 **Google 凭证**，并把字段 **自动映射** 到表格的列
- 用 **IF** 节点做分支

> **国内用户提示：** 在中国大陆访问 Google 服务需要相应的网络环境。如果不方便，可以把数据存到 [菜谱 19](../19-mini-crm-with-data-tables/README.zh-CN.md) 的 n8n 内置 Data Tables，或用 HTTP Request 节点调用飞书多维表格等服务的开放 API。表单和数据清洗部分完全一样。

## 配置

1. **创建表格。** 新建一个 Google Sheet，在第 1 行填入下面这些表头（必须完全一致）：

   | Submitted At | Name | Email | Topic | Message | Urgent |
   |---|---|---|---|---|---|

2. 导入 [`workflow.json`](workflow.json)。
3. **连接 Google。** 打开 **Append Row to Sheet → Credential → Create new → Google Sheets OAuth2 API**。
   - **n8n Cloud：** 点击 **Sign in with Google** 即可。
   - **自部署：** 你需要在 Google Cloud Console 创建自己的 OAuth 客户端。按照 n8n 的 [Google OAuth 指南](https://docs.n8n.io/integrations/builtin/credentials/google/oauth-single-service/) 操作。简单来说：创建项目，启用 *Google Sheets API* 和 *Google Drive API*，用 n8n 提供的回调地址创建一个 *OAuth client ID（Web application）*，再把 Client ID 和 Secret 粘贴进来。
4. 在 **Append Row to Sheet** 中，于 **Document** 选择你的表格，于 **Sheet** 选择工作表。

## 动手试试

1. 点击 **Test workflow**。打开 **Contact Form** 节点复制 **Test URL**，或直接在节点里点击 *Open form*。
2. 填写表单并提交。
3. 表格中会多出一行。如果你在“Is this urgent?”中选了 *Yes*，流程会继续走 **true** 分支。

发布工作流后，把 **Production URL** 分享给真实用户。你也可以用 `<iframe>` 把表单嵌入到网页中。

> 表单字段名是英文的。在 **Contact Form** 节点里可以直接把标签改成中文；注意同时修改 **Clean Up Data** 中引用这些字段的表达式（例如 `$json['姓名']`）。

## 工作原理

| 节点 | 作用 |
|---|---|
| **Contact Form** | 表单触发器。每个字段的标签会成为 `$json` 中的键名（例如 `$json.Email`、`$json['Is this urgent?']`）。 |
| **Clean Up Data** | 重命名并规范化字段。这里的字段名与表格表头完全一致，这正是自动映射能生效的原因。 |
| **Append Row to Sheet** | Google Sheets → *Append Row*，映射模式为 *Map Automatically*：字段名与表头相同的字段，会写入对应的列。 |
| **Is Urgent?** | IF 节点。**true** 输出继续去通知某人；**false** 输出到此结束。 |
| **Notify Team (placeholder)** | 一个 *No Op*（空操作）节点。把它换成 Slack、邮件、飞书或 Telegram 通知节点。 |

## 扩展思路

- **避免重复：** 使用 Sheets 的 *Append or Update Row* 操作，并按 `Email` 匹配。
- 用 **Send Email** 或 **Gmail** 节点给提交者 **自动回复**。
- **过滤垃圾提交：** 加一个隐藏的 "website" 字段，丢弃填写了该字段的提交。
- 把数据存到 **Airtable**、**Notion**、**HubSpot** 或数据库，而不是 Sheets。

## 常见问题

| 现象 | 解决方法 |
|---|---|
| `Column names were updated after the node's setup` | 重新打开节点刷新列，或检查表头有没有拼写错误。 |
| 数据写进了错误的列 / 多出了列 | 表头必须与 **Clean Up Data** 中的字段名完全一致，包括大小写和空格。 |
| Google 提示 `redirect_uri_mismatch`（自部署） | 把 n8n 凭证对话框中显示的 *OAuth Redirect URL* 复制到 Google Cloud 的 OAuth 客户端设置中。 |
| 表单提示 "Problem loading form" | Test URL 只在监听期间（点了 *Test workflow* 之后）有效；Production URL 只在工作流已发布时有效。 |
