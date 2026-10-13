# 🍳 n8n Cookbook（n8n 实战菜谱）

[English](README.md) · **简体中文**

**20 个可直接导入的 [n8n](https://n8n.io) 实用工作流，从第一个 Webhook 一路做到 AI 智能体（AI Agent）。** 每个菜谱都配有分步指南、逐节点讲解，以及进一步扩展的思路。

[![Validate workflows](https://github.com/YalinMa/n8n-cookbook/actions/workflows/validate.yml/badge.svg)](https://github.com/YalinMa/n8n-cookbook/actions/workflows/validate.yml)
![n8n](https://img.shields.io/badge/n8n-2.x-EA4B71)
![License: MIT](https://img.shields.io/badge/license-MIT-blue)

> 刚接触 n8n？先看 **[快速上手](docs/getting-started.zh-CN.md)**（2 分钟跑起 n8n），再读 **[核心概念](docs/core-concepts.zh-CN.md)**（理解一切的 8 个关键概念），然后用 **[应用场景指南](docs/use-cases.zh-CN.md)** 了解每个菜谱在实际工作中的用途，以及该先学哪几个。

> **关于语言：** n8n 编辑器界面是英文的，所以文档中的按钮、节点和选项名称（如 **Test workflow**、**Publish**、*Edit Fields*）保留英文，并附中文说明，方便你在界面里直接找到。

## 菜谱目录

### 第一部分 · 基础

| # | 菜谱 | 你将学到 | 需要的凭证 | 难度 |
|---|---|---|---|---|
| 01 | [**Hello Webhook API**](examples/01-hello-webhook-api/README.zh-CN.md) | Webhook 触发器、表达式、响应 HTTP 请求 | — | ⭐ |
| 02 | [**每日天气播报**](examples/02-daily-weather-report/README.zh-CN.md) | 定时触发、HTTP Request、Code 节点 | — | ⭐ |
| 03 | [**RSS 新闻摘要邮件**](examples/03-rss-news-digest-email/README.zh-CN.md) | Cron、筛选、限量、聚合（多条 → 一条）、发邮件 | SMTP | ⭐⭐ |
| 04 | [**联系表单 → Google Sheets**](examples/04-contact-form-to-google-sheets/README.zh-CN.md) | 托管表单、数据清洗、Google OAuth、IF 分支 | Google | ⭐⭐ |
| 05 | [**API 数据 → CSV 导出**](examples/05-api-to-csv-export/README.zh-CN.md) | 分页、Split Out、筛选、排序、文件 | — | ⭐⭐ |
| 06 | [**网站可用性监控**](examples/06-website-uptime-monitor/README.zh-CN.md) | 逐条处理、容错的 HTTP 调用、告警 | — | ⭐⭐ |
| 07 | [**GitHub 新版本监控**](examples/07-github-release-watcher/README.zh-CN.md) | 用静态数据去重、动态 URL | — | ⭐⭐ |
| 08 | [**合并两个 API 的数据**](examples/08-merge-data-from-two-apis/README.zh-CN.md) | 并行分支、Summarize、Merge（类似 JOIN） | — | ⭐⭐ |
| 09 | [**AI 客服工单分拣**](examples/09-ai-support-ticket-triage/README.zh-CN.md) | 大模型结构化提取、AI 子节点、Switch | OpenAI* | ⭐⭐⭐ |
| 10 | [**错误处理与告警**](examples/10-error-handling-and-alerts/README.zh-CN.md) | 重试、错误输出、Stop and Error、错误工作流 | — | ⭐⭐⭐ |

### 第二部分 · 进阶

| # | 菜谱 | 你将学到 | 需要的凭证 | 难度 |
|---|---|---|---|---|
| 11 | [**限速批量地理编码**](examples/11-batch-geocoding-with-rate-limits/README.zh-CN.md) | Loop Over Items、Wait、重试、处理“查无结果” | — | ⭐⭐ |
| 12 | [**可复用的通知子工作流**](examples/12-reusable-notification-subworkflow/README.zh-CN.md) | Execute Workflow、带类型的输入、发布子工作流 | — | ⭐⭐ |
| 13 | [**带 HMAC 签名的安全 Webhook**](examples/13-secure-webhook-hmac-signature/README.zh-CN.md) | 原始请求体、Crypto 节点、401 响应 | — | ⭐⭐⭐ |
| 14 | [**联系人清单清洗与去重**](examples/14-clean-and-dedupe-contact-list/README.zh-CN.md) | Extract from File（CSV）、正则校验、Remove Duplicates | — | ⭐⭐ |
| 15 | [**带工具和记忆的 AI 智能体**](examples/15-ai-agent-with-tools-and-memory/README.zh-CN.md) | Chat Trigger、AI Agent、把 HTTP Request 当工具、`$fromAI()`、记忆 | OpenAI* | ⭐⭐⭐ |
| 16 | [**人工审批流程**](examples/16-human-approval-workflow/README.zh-CN.md) | Wait 节点、`$execution.resumeUrl`、暂停与恢复 | — | ⭐⭐⭐ |
| 17 | [**用 Webhook 提供 HTML 看板**](examples/17-html-dashboard-from-webhook/README.zh-CN.md) | GET + 查询参数、返回 HTML 页面、内嵌 SVG 图表 | — | ⭐⭐ |
| 18 | [**PDF 发票解析**](examples/18-pdf-invoice-parser/README.zh-CN.md) | 提取 PDF 文本、正则解析、数据校验 | — | ⭐⭐ |
| 19 | [**用 Data Tables 做迷你 CRM**](examples/19-mini-crm-with-data-tables/README.zh-CN.md) | n8n 内置数据库、upsert、部分更新、REST API | — | ⭐⭐ |
| 20 | [**用 HTML 节点抓取网页**](examples/20-web-scraping-with-html-node/README.zh-CN.md) | CSS 选择器、礼貌限速、清洗抓取的数据 | — | ⭐⭐ |

<sub>* 也可以换成任意聊天模型：Anthropic、Gemini、Ollama（免费、本地运行）、DeepSeek、通义千问等兼容 OpenAI 接口的模型……02、06、07、10、12、16 中可选的聊天通知只需要一个 Slack/Discord 的 incoming webhook 地址；飞书、钉钉、企业微信的消息格式略有不同，见 [快速上手 · 发送到其他聊天工具](docs/getting-started.zh-CN.md#6-发送到其他聊天工具)。</sub>

**20 个菜谱中有 16 个不需要任何账号或 API Key。** 导入后点击 *Test workflow*（测试工作流）即可运行。

## 快速开始

```bash
# 1. 本地运行 n8n（需要 Node.js 24+），也可以用 Docker / n8n Cloud，见 docs/getting-started.zh-CN.md
npx n8n

# 2. 打开 http://localhost:5678 并创建管理员（owner）账号
# 3. Workflows → Create → ⋯ → Import from File → 选择任意 examples/*/workflow.json
# 4. 点击 "Test workflow"
```

也可以不下载文件直接导入：复制工作流文件的 **raw** 地址，例如

```
https://raw.githubusercontent.com/YalinMa/n8n-cookbook/main/examples/02-daily-weather-report/workflow.json
```

然后在 n8n 编辑器中使用 **⋯ → Import from URL**。

> **国内网络提示：** 如果访问 `raw.githubusercontent.com` 或 `npx` 下载较慢，可以先 `git clone` 本仓库再用 *Import from File* 导入，或给 npm 配置国内镜像（如 `npm config set registry https://registry.npmmirror.com`）。

## 推荐学习路线

```
第一部分  01 Webhook ──▶ 02 定时 + API ──▶ 03 多条 → 一条 ──▶ 04 表单 + 凭证
                                                                  │
             10 错误处理 ◀── 09 AI ◀── 08 合并 ◀── 07 记忆 ◀── 06 逐条处理 ◀── 05 分页
                │
第二部分  11 循环与限速 ──▶ 12 子工作流 ──▶ 13 Webhook 安全 ──▶ 14 文件与数据清洗
                                                                    │
             20 网页抓取 ◀── 19 Data Tables ◀── 18 PDF ◀── 17 网页 ◀── 16 人工审批 ◀── 15 AI 智能体
```

每个菜谱只引入少量新概念，并建立在前面的基础上。也可以按主题挑选：

| 我想要…… | 菜谱 |
|---|---|
| 搭建 API 或接收 Webhook | 01、13、16、17、19 |
| 定时自动运行 | 02、03、06、07 |
| 搬运和转换数据 | 05、08、11、14、18、20 |
| 使用 AI | 09、15 |
| 让工作流更稳健 | 10、11、12、13 |
| 不借助外部工具存储数据 | 07（静态数据）、19（Data Tables） |

## 每个菜谱包含什么

```
examples/NN-菜谱名/
├── README.md        # 英文说明：用途、配置、测试方法、逐节点讲解、扩展思路、常见问题
├── README.zh-CN.md  # 同样内容的简体中文版
└── workflow.json    # 导入 n8n 的工作流文件（10 和 12 有两个文件；14 和 18 附带示例数据）
```

每个工作流画布里还有一张 **便签（sticky note）** 概括该菜谱，导入后一看就懂。（便签内容为英文。）

## 仓库结构

```
n8n-cookbook/
├── README.md / README.zh-CN.md   # 每个 Markdown 文件都有英文版和简体中文版
├── docs/
│   ├── getting-started.md   # 安装 n8n、导入工作流、添加凭证
│   ├── core-concepts.md     # 数据项、表达式、触发器、凭证、执行记录……
│   ├── use-cases.md         # 每个菜谱的用途：真实场景、学习路线
│   ├── cheatsheet.md        # 表达式与节点速查表
│   └── validation.md        # 工作流的测试方法
├── examples/                # 20 个菜谱
├── scripts/
│   ├── validate.mjs         # 静态检查（无依赖）
│   ├── test-in-n8n.sh       # 在真实 n8n 实例中导入并运行全部工作流
│   └── …                    # 辅助脚本：测试变体、模拟 OpenAI 服务、执行结果检查
└── .github/workflows/validate.yml
```

## 验证

每个工作流都经过两层检查：

1. **静态检查**（`node scripts/validate.mjs`）：JSON 合法、节点名称和 ID 唯一、每条连线都指向真实节点、存在触发器、没有孤立节点、没有提交任何凭证或密钥，并检查每篇文档都有中英文两个版本。每次推送都会通过 GitHub Actions 自动运行。
2. **真实 n8n 运行**（`./scripts/test-in-n8n.sh`）：全部 22 个文件导入真实的 n8n 2.42 实例，并调用真实公开 API **实际执行**。Webhook、表单、聊天、审批和看板类菜谱会在运行中的服务器上通过 HTTP 调用。AI 菜谱使用模拟的 OpenAI 服务，无需密钥。每次运行都会检查是否得到预期的数据，而不只是“没有报错”。

**最新结果：65 / 65 项检查通过。** 真实运行发现了好几个静态检查查不出的 bug。完整测试矩阵、发现的 bug 以及未覆盖的部分（真实的 SMTP / Google / OpenAI 账号）见 [docs/validation.zh-CN.md](docs/validation.zh-CN.md)。

## 参与贡献

欢迎提出想法、修复问题或贡献新菜谱。见 [CONTRIBUTING.zh-CN.md](CONTRIBUTING.zh-CN.md)。

## 许可证

[MIT](LICENSE)。你可以随意使用这些工作流，包括商业用途。

*n8n 是 n8n GmbH 的商标。本项目为独立的社区项目。*
