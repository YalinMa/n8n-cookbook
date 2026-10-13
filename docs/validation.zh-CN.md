# 验证

[English](validation.md) · **简体中文**

本仓库的每个工作流都经过两层检查。

## 1. 静态检查：`scripts/validate.mjs`

无依赖，不到一秒即可完成，每次推送都会通过 [GitHub Actions](../.github/workflows/validate.yml) 自动运行。

```bash
node scripts/validate.mjs
```

它会检查每个 `examples/*/*.json`：

- JSON 合法，并包含 `name`、`nodes` 和 `connections`
- 每个节点都有 `id`、`name`、`type`、`typeVersion`、`position`、`parameters`
- 节点名称和 ID 唯一
- 每条连线都指向存在的节点，并使用已知的连接类型
- 至少有一个启用的触发器节点
- 没有孤立节点（除触发器、便签和 AI 子节点外，每个节点都有输入连线）
- **没有提交任何凭证或密钥**（没有 `credentials` 块；拒绝常见的 API Key 格式）
- 每个示例文件夹都有 `README.md` 和 `README.zh-CN.md`，每篇英文文档都有对应的中文版

## 2. 真实 n8n 运行：`scripts/test-in-n8n.sh`

在 `.n8n-test/`（已被 git 忽略）中启动一个临时 n8n 实例，用 n8n 命令行导入全部工作流，并调用真实的公开 API **实际运行**。每项检查都会查找 **具体的预期输出**（数据项数量、具体数值、路由走向），而不只是“没有报错”。

```bash
# 需要 Node.js 24+（n8n 2.x）
./scripts/test-in-n8n.sh
# 或使用本地安装的 n8n：
N8N=/path/to/node_modules/.bin/n8n ./scripts/test-in-n8n.sh
```

### 用命令行执行（`n8n execute`）

| 菜谱 | 测试变体 | 检查内容 |
|---|---|---|
| 02 天气 | 原样 | 获取到天气预报，消息格式正确 |
| 03 RSS 摘要 | 禁用发邮件节点 | 订阅源 → 筛选 → 前 10 条 → 聚合成 **1** 条 → HTML |
| 05 CSV 导出 | 原样 | 4 次分页请求 → **194** 个商品 → CSV |
| 06 可用性监控 | 原样 | 2 个网站宕机（HTTP 503 + DNS 失败）→ 一条告警 |
| 07 新版本 | 原样 | 生成“New release of …”消息 |
| 08 合并 | 原样 | 用户与已完成待办数 **不为 0** 地成功合并 |
| 10a 错误告警 | Error Trigger → 示例错误数据 | 生成告警文本 |
| 10b 错误演示 | 原样，以及 `failOnPurpose=true` | 重试 3 次 → 走备用分支；在 *Stop and Error* 处以自定义信息失败 |
| 11 地理编码 | 原样 | **12** 个城市分 4 批处理并暂停，再排序 |
| 12 子工作流 | 12b 关联已发布的 12a | 3 个事件 → 3 次子执行 → 格式化消息 |
| 14 CSV 清洗 | 示例文件由本地提供 | 13 行 → 9 行有效 + 4 行被拒 → **7** 个唯一联系人 |
| 18 PDF 发票 | 示例文件由本地提供 | 所有字段解析成功，金额校验通过 → *Book Invoice* |
| 20 网页抓取 | 原样 | 3 页 → **60** 本书 → 筛选 → CSV |

### 在运行中的 n8n 服务器上通过 HTTP 调用

| 菜谱 | 检查内容 |
|---|---|
| 01 Webhook | `POST /webhook/hello` 返回问候 JSON |
| 04 表单 → Sheets（禁用 Sheets） | 表单页面正常显示；提交的数据被去空格、转小写，并走到 *紧急* 分支（在保存的执行记录中核对） |
| 09 AI 分拣（模拟 OpenAI） | 4 张工单 → 结构化提取 → 各自到达正确的 Switch 输出 |
| 10 错误工作流 | 10b 的一次 **生产** 失败自动启动了已发布的错误工作流 10a |
| 13 HMAC Webhook | 签名正确 → 200；请求体被篡改 → 401；缺少签名 → 401 |
| 15 AI 智能体（模拟 OpenAI） | 智能体先调用真实的汇率工具，再调用计算器；追问时用到了 **记忆** |
| 16 人工审批 | ≤ 100 → 自动通过；> 100 → 暂停；打开同意 / 拒绝链接后恢复的是 **同一次** 执行，并显示确认页面 |
| 17 HTML 看板 | `?base=USD` → 200 `text/html` 页面；恶意的 `base` 参数回退为 EUR |
| 19 Data Tables CRM | 建表（重复执行两次也安全）；新增、**部分** 更新保留已存字段、邮箱无效返回 400、列表查询 + `?stage=` 筛选 |

辅助脚本：`make-test-variants.mjs`（生成仅用于测试的副本）、`summarize-execution.mjs` 和 `inspect-executions.mjs`（每个节点的数据项数量和输出），以及 `mock-openai.mjs`。这个模拟服务是一个行为固定的假 OpenAI 接口：为 09 按关键词给工单分类，为 15 的智能体发起工具调用。

### 最新结果

n8n **2.42.7**，Node.js 24.21，2026-10-13：

```
== Importing workflows                          22 / 22 ✓
== Executing workflows with the CLI             13 / 13 ✓
== Failing on purpose (10b)                      1 /  1 ✓
== Live server tests                            24 / 24 ✓
== Stored executions (04 data, 09 routing)       5 /  5 ✓
== Result: 65 passed, 0 failed
```

## 真实运行发现的 bug

这些问题全部通过了静态检查，只有真正运行时才暴露出来。每个问题的修复和说明都已写进对应菜谱：

| 菜谱 | 出了什么问题 | 修复 |
|---|---|---|
| 08 | 所有用户的已完成待办数都是 0。*Summarize* 把分组键输出为文本（`"1"`），而用户 API 返回的是数字（`1`），所以 *Merge* 一直匹配不上。 | 开启 *Fuzzy Compare*，并在 README 中加了“类型”警告 |
| 12 | `Workflow is not active and cannot be executed` | 在 n8n 2.x 中，子工作流必须先 **发布**，生产调用方才能使用。已写进配置步骤。 |
| 15 | `… has a "supplyData" method but no "execute" method` | 旧版 *HTTP Request Tool (LangChain)* 节点无法配合当前的 AI Agent 使用；改为把标准 HTTP Request 节点当作工具，并配合 `$fromAI()` |
| 16 | 审批链接返回 `Invalid token` | n8n 2.x 会在 `$execution.resumeUrl` 后加上 `?signature=…`，所以额外参数必须用 `&` 拼接，而不是 `?` |
| 19 | 部分更新（只传 `{"email", "stage"}`）把已存的公司名清空了 | upsert 会写入每一个映射的列；在 upsert 前增加了 *Find Existing → Merge With Existing* |
| 20 | `URL is not defined` | Code 节点的沙箱里没有 `URL` 类；改用字符串拼接链接 |
| 10（文档） | README 曾说错误工作流不需要发布 | 在 2.x 中 **必须** 发布；已更正，并由在线测试覆盖 |
| 03 | RSS 订阅源一次网络抖动就导致运行失败 | 给订阅源节点开启 *Retry On Fail* |

## 没有自动覆盖的部分

这些需要你自己的账号，因此没有在真实服务上运行：

- 通过 SMTP 真正发送邮件（03）
- 向真实的 Google Sheet 追加一行（04）
- 调用真实的 OpenAI API（09、15）。节点连接、提示词、工具调用、记忆和解析都用模拟服务测试过；回答质量取决于你选用的模型。
- 发送到真实的 Slack/Discord/飞书/钉钉 Webhook（02、06、07、10a、12a、16；这些节点默认是禁用的）

如果你在更新版本的 n8n 上遇到问题，欢迎 [提交 issue](https://github.com/YalinMa/n8n-cookbook/issues)。
