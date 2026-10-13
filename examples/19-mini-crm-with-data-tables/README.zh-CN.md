# 19 · 用 Data Tables 做迷你 CRM（Mini CRM with Data Tables）

[English](README.md) · **简体中文**

> 用 Data Tables 把数据存在 **n8n 内部**，并以一个迷你 REST API 的形式提供出来：新增 / 更新联系人，以及查询联系人列表。

| 难度 | 时间 | 凭证 | 用到的节点 |
|---|---|---|---|
| ⭐⭐ 中级 | 10 分钟 | 无 | Data Table（建表、upsert、查询）、Webhook ×2、Edit Fields、IF、Code、Respond to Webhook |

```
Run Once: Create Table ─▶ Create Contacts Table              （一次性初始化，重复执行也安全）

POST /crm/contacts ─▶ Clean Input ─▶ Valid Email? ─┬─ true  ─▶ Find Existing Contact ─▶ Merge With Existing ─▶ Upsert Contact ─▶ Reply: Saved   （200）
                                                   └─ false ─▶ Reply: Bad Request                                                             （400）

GET  /crm/contacts ─▶ Get All Rows ─▶ Filter & Shape ─▶ Reply: Contacts                               （?stage=lead）
```

## 你将学到

- **Data Tables**：n8n 内置的数据库。不需要外部账号，可以在 *Overview → Data tables* 中查看
- 在工作流中用 **create if not exists**（不存在才创建）建表
- **Upsert**：邮箱已存在就更新，否则新增，因此不会产生重复
- **部分更新**：先查出已存的记录，这样调用方没传的字段不会被清空
- **同一路径**、不同 **HTTP 方法**（POST 与 GET）的两个 Webhook，就像一个 REST API
- *Always Output Data*：即使表是空的，也能返回响应

## 配置

1. 导入 [`workflow.json`](workflow.json)。
2. 在 **Run Once: Create Table** 上点击 ▶（*Execute step*）。这会创建 `cookbook_contacts` 表，包含 `email, name, company, stage, notes` 这几列（另有自动生成的 `id`、`createdAt`、`updatedAt`）。
3. **发布** 工作流。

> Data Tables 内置于当前版本的 n8n 中（包括所有 2.x 版本），Cloud 和自部署都可以使用。节点 **按名称** 查找数据表，所以导入后不用重新选择任何东西就能运行。

## 动手试试

```bash
# 新增联系人
curl -X POST http://localhost:5678/webhook/crm/contacts -H "Content-Type: application/json" \
  -d '{"email":"Ada@Example.com","name":"Ada Lovelace","company":"Analytical Engines","stage":"lead"}'
# {"ok":true,"contact":{"id":1,"email":"ada@example.com",...,"stage":"lead"}}

curl -X POST http://localhost:5678/webhook/crm/contacts -H "Content-Type: application/json" \
  -d '{"email":"grace@navy.example","name":"Grace Hopper","company":"US Navy","stage":"customer"}'

# 同一个邮箱再提交一次，只传部分字段 → 更新第 1 行（不会重复），公司名保留
curl -X POST http://localhost:5678/webhook/crm/contacts -H "Content-Type: application/json" \
  -d '{"email":"ada@example.com","stage":"qualified","notes":"Demo booked"}'
# {"ok":true,"contact":{"id":1,"name":"Ada Lovelace","company":"Analytical Engines","stage":"qualified",...}}

# 无效输入
curl -X POST http://localhost:5678/webhook/crm/contacts -H "Content-Type: application/json" -d '{"email":"nope"}'
# 400 {"ok":false,"error":"A valid email is required."}

# 查询全部，或按阶段筛选
curl http://localhost:5678/webhook/crm/contacts
curl "http://localhost:5678/webhook/crm/contacts?stage=qualified"
# {"count":1,"stage":"qualified","contacts":[{"id":1,"email":"ada@example.com",...}]}
```

然后打开 **Overview → Data tables → cookbook_contacts**，就能在 n8n 界面中查看和编辑这些记录。（中文姓名、公司名同样可以存储。）

## 工作原理

| 节点 | 作用 |
|---|---|
| **Create Contacts Table** | Data Table → *Table → Create*，开启 *Create If Not Exists*。 |
| **Clean Input** | 规范化邮箱（去空格 + 转小写）。 |
| **Find Existing Contact** | Data Table → *Row → Get*，条件为 `email` 等于输入值，最多 1 条。开启了 *Always Output Data*，所以新联系人会得到一个空数据项，而不是让流程停下来。 |
| **Merge With Existing** | 每个字段依次取：请求中传入的值，否则用已存的值，再否则用默认值。`stage` 必须是 `lead, qualified, customer, lost` 之一。 |
| **Upsert Contact** | Data Table → *Row → Upsert*，按 `email` 匹配。返回保存后的记录，包括 `id` 和 `updatedAt`。 |
| **Get All Rows** | Data Table → *Row → Get*，*Return All*。开启了 *Settings → Always Output Data*，所以表为空时也会输出一个（空的）数据项。 |
| **Filter & Shape** | 应用可选的 `?stage=` 筛选，返回 `{count, stage, contacts}`。 |

> ⚠️ **Upsert 的陷阱：** upsert 会写入 *每一个* 映射的列。如果没有 *Find + Merge* 这一步，一个只传了 `{"email": …, "stage": "qualified"}` 的请求，会把 `name` 和 `company` 覆盖成空值。本菜谱的自动化测试正是发现了这个问题。

## Data Tables 与其他存储方式对比

| | Data Tables | Google Sheets | Postgres / MySQL |
|---|---|---|---|
| 准备工作 | 无 | Google 账号 + OAuth | 一台数据库服务器 |
| 速度 | 快（本地） | 慢，有调用限制 | 快 |
| 容量 | 小到中等（受实例存储空间限制） | 约 1000 万个单元格 | 大 |
| 能否给不用 n8n 的人使用 | 不能 | 能（很适合团队协作） | 通过其他工具 |
| 最适合 | 工作流状态、查询表、小应用 | 需要人手工编辑的名单 | 生产数据 |

## 扩展思路

- 用 *Row → Delete* 操作加一个 `DELETE /crm/contacts?email=…` 接口。
- 给 [菜谱 15](../15-ai-agent-with-tools-and-memory/README.zh-CN.md) 的 AI 智能体加一个 Data Table 工具：“这周我们新增了哪些客户？”
- 用联系表单（[菜谱 04](../04-contact-form-to-google-sheets/README.zh-CN.md)）或清洗后的 CSV（[菜谱 14](../14-clean-and-dedupe-contact-list/README.zh-CN.md)）往表里写数据。
- 给两个 Webhook 都加上 *Header Auth*，保护这个 API。

## 常见问题

| 现象 | 解决方法 |
|---|---|
| `Data table with name "cookbook_contacts" not found` | 先运行 **Run Once: Create Table**。 |
| `Attempted to use Data table node but the module is disabled` | 这个实例没有启用 Data Tables（版本太旧，或被管理员禁用）。请升级 n8n。 |
| 表为空时 GET 请求一直卡住或报错 | 确认 **Get All Rows** 开启了 *Always Output Data*。 |
