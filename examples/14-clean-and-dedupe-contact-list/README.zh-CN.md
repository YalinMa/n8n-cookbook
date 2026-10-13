# 14 · 联系人清单清洗与去重（Clean & Deduplicate a Contact List）

[English](README.md) · **简体中文**

> 下载一份杂乱的 CSV，规范化每个字段，剔除有问题的行，去掉重复项，导出一个干净的文件。

| 难度 | 时间 | 凭证 | 用到的节点 |
|---|---|---|---|
| ⭐⭐ 中级 | 10 分钟 | 无 | HTTP Request（文件）、Extract from File（CSV）、Edit Fields、IF（正则）、Remove Duplicates、Sort、Convert to File |

```
Manual Trigger ─▶ Settings ─▶ Download CSV ─▶ Parse CSV ─▶ Normalize Fields ─▶ Valid Contact? ─┬─ true  ─▶ Remove Duplicate Emails ─▶ Sort by Name ─▶ Export Clean CSV
                 （csvUrl）   （二进制文件）  （13 个数据项）                                   └─ false ─▶ Rejected Rows（附原因）
```

## 你将学到

- 处理 **文件**：以二进制形式下载，再用 **Extract from File** 把 CSV 的每一行变成数据项
- 用表达式清洗文本：`trim()`、`toLowerCase()`、首字母大写、只保留数字
- 用 Luxon 解析 **两种日期格式**（`DateTime.fromFormat` / `fromISO`）
- 用 **正则** 条件校验，并保留被拒的行 **及其原因**
- 按指定字段 **Remove Duplicates**（去重）

## 配置

1. 导入 [`workflow.json`](workflow.json)。它会直接使用本仓库中的 [`sample-contacts.csv`](sample-contacts.csv)，导入即可运行。
2. 要清洗你自己的文件，修改 **Settings → csvUrl**，或把 *Settings + Download CSV* 换成：
   - **Google Drive → Download file**
   - 邮件附件（**Gmail Trigger** / **IMAP**）
   - **n8n Form** 上的上传字段（[菜谱 04](../04-contact-form-to-google-sheets/README.zh-CN.md)）
3. 如果你的列名不同，修改 **Normalize Fields** 中的字段名（`$json['Full Name']`、`$json['E-mail']`……）。中文列名同样可以，例如 `$json['姓名']`。

> **中文 CSV 编码提示：** 用 Excel 直接“另存为 CSV”得到的中文文件通常是 GBK 编码，n8n 的 CSV 解析不支持 GBK，中文会变成乱码。请在 Excel 中选择 **“CSV UTF-8（逗号分隔）”** 格式保存，或用 WPS / 文本编辑器转成 UTF-8。

## 动手试试

点击 **Test workflow**。示例文件有 13 行，包含各种典型问题：

| 源数据中的问题 | 例子 | 处理结果 |
|---|---|---|
| 多余空格、大小写混乱 | `  ada lovelace `、`ADA@Example.com` | `Ada Lovelace`、`ada@example.com` |
| 电话格式不一 | `(555) 010-2030`、`555.010.2030` | `5550102030` |
| 两种日期格式 | `03/02/2026` 和 `2026-02-03` | ISO 格式 `2026-03-02` |
| 同一个人出现两次 | Grace Hopper ×2、Ada Lovelace ×2 | 只保留一条 |
| 邮箱格式错误 | `margaret@@apollo.example`、`dmr@bell-labs` | 被拒：*invalid email* |
| 缺少数据 | 没有邮箱 / 没有姓名 | 被拒：*missing email* / *missing name* |

数据项数量：**13 → 9 条有效 + 4 条被拒 → 7 个唯一联系人**。在 **Export Clean CSV** → *Binary* 标签页下载结果。

## 工作原理

| 节点 | 作用 |
|---|---|
| **Download CSV** | *Response Format: File* 的 HTTP Request，CSV 以二进制数据形式返回。 |
| **Parse CSV** | Extract from File → CSV，表头行成为字段名。*Include Empty Cells* 会把缺失的值保留为 `""`，而不是直接去掉这个键。 |
| **Normalize Fields** | 每个字段一个表达式。首字母大写的写法 `.toLowerCase().replace(/(^\|[\s-])\S/g, s => s.toUpperCase())` 也能正确处理 `Berners-Lee`。 |
| **Valid Contact?** | 姓名不为空，**并且** 邮箱匹配 `^[^@\s]+@[^@\s]+\.[a-z]{2,}$`。 |
| **Remove Duplicate Emails** | *Compare: Selected Fields → email*，保留第一次出现的那条。 |
| **Rejected Rows** | 添加一个人能看懂的 `reason`（*Include Other Fields* 会保留原始数据），可以直接发回给名单的负责人。 |

## 扩展思路

- 把 **Rejected Rows** 通过邮件发给名单负责人（先聚合成一条）。
- 把干净的联系人写入你的 CRM，或 [菜谱 19](../19-mini-crm-with-data-tables/README.zh-CN.md) 的 Data Table。
- 用 *Remove Duplicates → Remove Items Processed in Previous Executions* 做 **跨多次运行** 的去重。
- 用 Code 节点和类似 `libphonenumber` 的规则，按国家校验电话号码（例如中国手机号 `^1[3-9]\d{9}$`）。

## 常见问题

| 现象 | 解决方法 |
|---|---|
| 所有字段都是 `undefined` | 列名不一致。查看 **Parse CSV** 的输出并修改表达式。注意 BOM：开启 *Options → Exclude Byte Order Mark*。 |
| `Cannot read properties of undefined (reading 'trim')` | 某一列完全不存在。保留 `?? ''` 这类兜底写法。 |
| 分号分隔的文件（很多欧洲地区的 Excel 会这样导出） | Parse CSV → *Options → Delimiter* 设为 `;`。 |
| 中文或带重音的字符乱码 | 文件不是 UTF-8 编码。中文文件请转成 UTF-8（见上方提示）；西欧字符可尝试 Parse CSV → *Options → Encoding* 设为 `latin1`。 |
