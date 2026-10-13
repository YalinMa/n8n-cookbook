# 05 · API 数据 → CSV 导出（API Data to CSV Export）

[English](README.md) · **简体中文**

> 取回一个分页 REST API 的所有页面，筛选并整理记录，然后下载成 CSV 文件。

| 难度 | 时间 | 凭证 | 用到的节点 |
|---|---|---|---|
| ⭐⭐ 中级 | 10 分钟 | 无 | HTTP Request（分页）、Split Out、Filter、Edit Fields、Sort、Convert to File |

```
Manual Trigger ─▶ Fetch All Products ─▶ One Item per Product ─▶ Rating ≥ 4.5 and In Stock ─▶ Pick Columns ─▶ Sort by Rating ─▶ Convert to CSV
                 （4 页 × 50 条）        （Split Out：约 194 条）     （Filter）                     （Set）         （Sort）          （.csv 文件）
```

## 你将学到

- HTTP Request 节点内置的 **分页（pagination）** 功能，以及 `$pageCount` 和 `$response`
- **Split Out**：把一个包含数组的数据项拆成多个数据项
- 按 **多个条件**（AND）筛选
- 用 **Edit Fields** 选择并重命名列
- 在 n8n 中处理 **二进制数据**（文件）

## 配置

1. 导入 [`workflow.json`](workflow.json)。
2. 不需要凭证。数据来自 [DummyJSON](https://dummyjson.com/docs/products)，一个免费的假数据 API。

## 动手试试

1. 点击 **Test workflow**。
2. 打开 **Convert to CSV**，把输出切换到 **Binary** 标签页，点击 **Download**。
3. 用 Excel、WPS、Numbers 或 Google Sheets 打开文件：

   ```csv
   ID,Product,Brand,Category,Price (USD),Rating,Stock
   …,…,…,…,…,4.99,…
   ```

## 工作原理

| 节点 | 作用 |
|---|---|
| **Fetch All Products** | `GET /products?limit=50`。在 *Options → Pagination* 中，每次请求发送 `skip = $pageCount * 50`。当 `skip + limit >= total` 时停止，并设置了最多 20 次请求的安全上限。每一页成为一个数据项。 |
| **One Item per Product** | 对 `products` 字段执行 Split Out。4 个“页”数据项变成约 194 个“商品”数据项。 |
| **Rating ≥ 4.5 and In Stock** | 两个条件以 **AND** 连接的 Filter。 |
| **Pick Columns** | Edit Fields 只保留列出的字段，并使用易读的列名。 |
| **Sort by Rating** | 先按评分降序，评分相同时再按价格升序。 |
| **Convert to CSV** | 把所有数据项转换成一个 CSV 文件（二进制属性 `data`）。文件名包含当天日期。 |

### 实际中常见的分页方式

| API 风格 | *Pagination* 如何配置 |
|---|---|
| `?page=1,2,3…` | *Update a Parameter in Each Request* → `page` = `{{ $pageCount + 1 }}` |
| `?offset=` / `?skip=` | 同上，使用 `{{ $pageCount * 每页条数 }}`（本例） |
| 游标（响应体中的 `next_cursor`） | `cursor` = `{{ $response.body.next_cursor }}`，结束条件为 `{{ !$response.body.next_cursor }}` |
| `Link` 响应头 / `next` 地址 | *Response Contains Next URL* → `{{ $response.body.next }}` |

## 扩展思路

- **把文件存到有用的地方：** 在 *Convert to CSV* 后加 **Google Drive**、**Dropbox**、**S3**（阿里云 OSS 等兼容 S3 的存储也可以）或 **Send Email** 节点。二进制数据会自动传递。
- 写入 **Google Sheets** 而不是 CSV 文件（见 [菜谱 04](../04-contact-form-to-google-sheets/README.zh-CN.md)）。
- 设置定时，每晚自动导出。
- 在 **Convert to File** 中选择 *XLSX*，得到 Excel 文件。

## 常见问题

| 现象 | 解决方法 |
|---|---|
| 只拿到 50 个商品 | 没有开启分页。检查 **Fetch All Products** 的 *Options → Pagination*。 |
| 无限翻页 / `Max requests reached` | *结束条件* 表达式永远不成立。检查响应中的字段名。 |
| CSV 列顺序很奇怪 | 列顺序与 **Pick Columns** 中的字段顺序一致。 |
