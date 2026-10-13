# 快速上手

[English](getting-started.md) · **简体中文**

本页带你从零开始，大约 5 分钟跑起第一个工作流。

## 1. 运行 n8n

以下方式 **任选其一**。

### 方式 A：npx（最快，需要 Node.js 24+）

```bash
npx n8n
```

打开 <http://localhost:5678>。数据保存在 `~/.n8n`。按 `Ctrl+C` 停止。

> 用 `node -v` 查看版本。n8n 2.x 在 Node 22 及更早版本上无法启动。请升级 Node（例如用 [nvm](https://github.com/nvm-sh/nvm)：`nvm install 24`），或改用 Docker。
>
> 国内下载慢时，可以先配置 npm 镜像：`npm config set registry https://registry.npmmirror.com`。

### 方式 B：Docker（适合长期运行）

```bash
docker volume create n8n_data
docker run -it --rm --name n8n -p 5678:5678 \
  -e GENERIC_TIMEZONE="Asia/Shanghai" -e TZ="Asia/Shanghai" \
  -v n8n_data:/home/node/.n8n \
  docker.n8n.io/n8nio/n8n
```

把时区改成你所在的时区。定时触发器（菜谱 02、03、06、07）会用到它。

### 方式 C：n8n Cloud（无需安装）

在 [n8n.io](https://n8n.io) 注册，有免费试用。在 Cloud 上，菜谱 04 的 Google 登录一键即可完成。

> **首次启动：** n8n 会让你创建一个 *owner 账号*（管理员账号）。这是你自己实例上的本地账号，信息只保存在你的机器上（或你的 Cloud 工作区里）。

## 2. 导入菜谱

**从文件导入**

1. 从本仓库下载一个 `workflow.json`（或直接克隆整个仓库）。
2. 在 n8n 中：**Overview → Create Workflow**。在编辑器右上角打开 **⋯** 菜单 → **Import from File…**
3. 选择文件，节点就会出现在画布上。

**从 URL 导入**

在同一个 **⋯** 菜单中选择 **Import from URL…**，粘贴 GitHub 的 *raw* 地址：

```
https://raw.githubusercontent.com/YalinMa/n8n-cookbook/main/examples/01-hello-webhook-api/workflow.json
```

**复制粘贴**

在 GitHub 上打开 JSON 文件，全部复制，然后直接粘贴到 n8n 画布上（`Ctrl/Cmd + V`）。

## 3. 运行

- 点击 **Test workflow**（画布底部的按钮）。
- 绿色对勾表示哪些节点运行过。每条连线上的数字是通过它的 **数据项（item）** 数量。
- 点击任意节点，可以查看它的 **Input**（输入）和 **Output**（输出）。可以在 *Table*、*JSON*、*Schema* 三种视图之间切换。

## 4. 添加凭证（仅菜谱 03、04、09、15 需要）

凭证（credential）**加密保存在 n8n 内部**，永远不会写进工作流 JSON。所以菜谱文件可以放心分享。

1. 打开显示 ⚠️ 警告的节点。
2. **Credential to connect with → Create new credential**。
3. 填写各项字段。每个菜谱的 README 都写明了要填什么。
4. 点击 **Save**，n8n 会测试连接。

之后可以在 **Overview → Credentials** 统一管理所有凭证。

## 5. 正式上线：发布（Publish）

*Test workflow* 只立即运行一次。要让工作流 **自动运行**（按计划运行，或在 Webhook / 表单被调用时运行），请点击编辑器顶部的 **Publish**（发布）。（在 n8n 1.x 中，这是 **Inactive → Active** 开关。）修改已发布的工作流后，需要再次发布，新版本才会生效。

| | 测试运行（手动） | 生产运行（已发布） |
|---|---|---|
| 由谁启动 | 你点击 *Test workflow* | 定时、Webhook、表单、应用事件 |
| Webhook 地址 | `/webhook-test/...`（只接收一次调用） | `/webhook/...`（一直在线） |
| 在编辑器中显示 | 是，实时显示 | 在 **Executions**（执行记录）中查看 |
| 保存静态数据（菜谱 07） | 否 | 是 |
| 触发错误工作流（菜谱 10） | 否 | 是 |

## 6. 发送到其他聊天工具

菜谱 02、06、07、10a、12a、16 用 HTTP Request 节点发送消息。默认的请求体 `{"text": …, "content": …}` 可以直接用于 **Slack**（读取 `text`）和 **Discord**（读取 `content`）。其他聊天工具需要不同的 JSON 格式：把 *Send Body → JSON* 改成下表中对应的一行，再粘贴该工具的 Webhook 地址即可。

| 工具 | JSON 请求体 |
|---|---|
| Slack | `{{ JSON.stringify({ text: $json.text }) }}` |
| Discord | `{{ JSON.stringify({ content: $json.text }) }}` |
| Microsoft Teams（Workflows webhook） | `{{ JSON.stringify({ text: $json.text }) }}` |
| 飞书 / Lark | `{{ JSON.stringify({ msg_type: 'text', content: { text: $json.text } }) }}` |
| 钉钉 | `{{ JSON.stringify({ msgtype: 'text', text: { content: $json.text } }) }}` |
| 企业微信 | `{{ JSON.stringify({ msgtype: 'text', text: { content: $json.text } }) }}` |

飞书和钉钉的机器人通常有 **自定义关键词** 或 **加签** 安全设置。用关键词时，确保消息里包含该关键词；加签的原理与菜谱 13 中的 HMAC 签名相同，可以参考。

## 下一步

阅读 **[核心概念](core-concepts.zh-CN.md)** 和 **[应用场景指南](use-cases.zh-CN.md)**，然后打开 [菜谱 01](../examples/01-hello-webhook-api/README.zh-CN.md)。
