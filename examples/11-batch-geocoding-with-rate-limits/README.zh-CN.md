# 11 · 限速批量地理编码（Batch Geocoding with Rate Limits）

[English](README.md) · **简体中文**

> 通过 API 处理一长串数据时 **分批并暂停**，避免超出调用频率限制，最后把所有结果汇总起来。

| 难度 | 时间 | 凭证 | 用到的节点 |
|---|---|---|---|
| ⭐⭐ 中级 | 10 分钟 | 无 | Code、Loop Over Items、HTTP Request（重试）、Edit Fields、Wait、Sort、Convert to File |

```
Manual Trigger ─▶ City List ─▶ Loop Over Items ──done──▶ Sort by Population ─▶ Convert to CSV
                 （12 个数据项）（每批 3 个）
                                     │ loop                                   ▲
                                     ▼                                        │ 回到循环
                                Geocode City ─▶ Keep Useful Fields ─▶ Pause 1 Second
```

## 你将学到

- **Loop Over Items**（以前叫 *Split in Batches*）：它的两个输出 *loop* 和 *done*，以及回环连线如何工作
- 在批次之间用 **Wait** 节点遵守 **调用频率限制**
- 用 **Retry On Fail** 应对偶尔失败的请求
- 用可选链（`$json.results?.[0]?.country ?? ''`）优雅地处理 **“查无结果”**
- 用 `$('Loop Over Items').item` 引用当前循环中的数据项

## 什么时候需要循环？

大多数时候 **不需要**。节点本来就会对每个数据项各运行一次（见 [核心概念](../../docs/core-concepts.zh-CN.md#2-数据是一组数据项item)）。以下情况才用 *Loop Over Items*：

- 需要在一组组请求之间 **暂停**（限流、礼貌地抓取网页）
- 处理 **成千上万** 条数据时控制内存占用
- 每一批都要执行 **多步流程**，一批完成后再开始下一批

如果只是简单的“每秒一个请求”、没有其他步骤，用 HTTP Request 节点自带的 *Options → Batching* 就够了（[菜谱 20](../20-web-scraping-with-html-node/README.zh-CN.md) 用的就是它）。

## 配置

1. 导入 [`workflow.json`](workflow.json)。
2. 编辑 **City List** 中的列表，或把这个节点换成 Google Sheets、CSV 文件（[菜谱 14](../14-clean-and-dedupe-contact-list/README.zh-CN.md)）或数据库。

不需要凭证。数据来自免费的 [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api)（也支持中文城市名，例如 `上海`，可以在请求参数里把 `language` 设为 `zh`）。

## 动手试试

点击 **Test workflow**。可以看到 **Loop Over Items** 转了 4 圈（12 个城市 ÷ 3）。因为有暂停，大约需要 4 秒。然后打开 **Sort by Population**：

| city | found | country | latitude | longitude | population | timezone |
|---|---|---|---|---|---|---|
| Mumbai | true | India | 19.07 | 72.88 | 12 691 836 | Asia/Kolkata |
| São Paulo | true | Brazil | −23.55 | −46.64 | 12 400 232 | America/Sao_Paulo |
| … | | | | | | |
| Atlantis | **false** | | | | 0 | |

在 **Convert to CSV** → *Binary* 标签页下载 CSV。

## 工作原理

| 节点 | 作用 |
|---|---|
| **City List** | 生成 12 个数据项，每个城市一个。 |
| **Loop Over Items** | 每批 3 个。从 **loop** 输出发出 3 个数据项，等它们回来后再发下一批……最后一批完成后，从 **done** 输出发出 **全部** 结果。 |
| **Geocode City** | `GET /v1/search?name=<city>&count=1`。*Retry On Fail*：重试 3 次，间隔 3 秒。 |
| **Keep Useful Fields** | 把响应展平。`?.` 和 `??` 保证查不到城市时也不会报错。 |
| **Pause 1 Second** | Wait 节点。它的输出 **连回 Loop Over Items**，正是这条回连的箭头让它成为一个循环。 |
| **Sort by Population** / **Convert to CSV** | 在 *done* 输出的汇总结果上只运行一次。 |

## 扩展思路

- 结合 [菜谱 02](../02-daily-weather-report/README.zh-CN.md)：先查坐标，再获取每个城市的天气。
- 把结果写回列表来源的 Google Sheet（*Update Row*）。
- 列表特别大时，参照 API 文档中的限制，逐步调大批大小、缩短暂停时间。

## 常见问题

| 现象 | 解决方法 |
|---|---|
| 循环永远停不下来 | 循环内部改变了数据项数量，或者回连接到了错误的输入。循环中最后一个节点必须连回 *Loop Over Items* 的输入。 |
| 结果中只有第一批 | 你把链路末端接在了 **loop** 输出上，而不是从 **done** 读取结果。 |
| `429 Too Many Requests` | 加长 Wait 时间，或减小批大小。 |
