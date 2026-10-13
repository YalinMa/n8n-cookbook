# 20 · 用 HTML 节点抓取网页（Web Scraping with the HTML Node）

[English](README.md) · **简体中文**

> 抓取一个没有 API 的商品目录：礼貌地访问多个页面，用 **CSS 选择器** 提取数据，清洗后导出 CSV。

| 难度 | 时间 | 凭证 | 用到的节点 |
|---|---|---|---|
| ⭐⭐ 中级 | 10 分钟 | 无 | Code、HTTP Request（分批）、HTML（提取）、Filter、Sort、Convert to File |

```
Manual Trigger ─▶ Settings ─▶ Page URLs ─▶ Fetch Page ─▶ Extract Books ─▶ One Item per Book ─▶ Rated 4★+ and In Stock ─▶ Cheapest First ─▶ Export CSV
                 （pages: 3） （3 个数据项）（每秒 1 次）  （CSS 选择器      （3 页 → 60 本书）     （Filter → 24 本）
                                                          → 每页 5 个数组）
```

## 你将学到

- **HTML** 节点的 *Extract HTML Content*，配合 **CSS 选择器**（提取文本和属性，开启 *Return Array*）
- **礼貌抓取**：用 *HTTP Request → Options → Batching* 做到每秒一个请求（不需要写循环）
- 在 Code 节点中把几个平行的数组“拉链式”合并成 **每条记录一个数据项**
- 清洗抓取到的文本：`£51.77` → `51.77`，`star-rating Three` → `3`，相对链接 → 绝对 URL
- 网页抓取的 **道德与规则**

## 配置

1. 导入 [`workflow.json`](workflow.json)。
2. 可以按需修改 **Settings → pages**（1–50）和 **minRating**。

抓取目标是 [books.toscrape.com](https://books.toscrape.com)，一个 **专门用来练习网页抓取** 的公开沙盒网站。

## 动手试试

点击 **Test workflow**（因为每页之间暂停 1 秒，大约需要 3 秒）。数据项数量：**3 页 → 60 本书 → 24 本评分 4★ 以上且有货**。**Cheapest First** 的结果：

| title | priceGBP | rating | inStock | url |
|---|---|---|---|---|
| Untitled Collection: Sabbath Poems 2014 | 14.27 | 4 | true | https://books.toscrape.com/catalogue/… |
| Sophie's World | 15.94 | 5 | true | … |
| Thirst | 17.27 | 5 | true | … |

在 **Export CSV** → *Binary* 标签页下载 CSV。

## 工作原理

| 节点 | 作用 |
|---|---|
| **Page URLs** | 生成 `…/catalogue/page-1.html` … `page-N.html`，每个地址一个数据项。 |
| **Fetch Page** | *Response Format: Text*（HTML 内容在 `$json.data` 中）。*Batching：每 1000 毫秒 1 个数据项*。 |
| **Extract Books** | 五个选择器，都开启了 *Return Array*，所以每页会得到 5 个等长的列表。 |
| **One Item per Book** | 遍历每一页、每一本书，清洗每个值，并根据页面地址拼出绝对 URL。 |
| **Rated 4★+ and In Stock** | 两个条件的 Filter；`minRating` 来自 **Settings**。 |
| **Cheapest First** / **Export CSV** | 按价格升序排序，然后生成 CSV 文件。 |

### 如何找到 CSS 选择器

1. 在 Chrome / Edge / Firefox 中打开页面 → 右键点击某个元素 → **检查（Inspect）**。
2. 找一个能唯一定位你想要内容的 class 或标签（`article.product_pod`、`.price_color`）。
3. 在开发者工具的控制台中测试：`document.querySelectorAll('article.product_pod .price_color').length`，在这个网站上应该是 20。
4. 要提取属性（链接、图片地址、data-* 等），设置 *Return Value: Attribute*。

## 负责任地抓取 ⚖️

- 先查看网站的 **服务条款** 和 **`robots.txt`**。
- 有 **官方 API** 或 RSS（[菜谱 03](../03-rss-news-digest-email/README.zh-CN.md)）时，优先使用它们。
- **放慢速度**（请求间隔 ≥ 1 秒），并用 `User-Agent` 请求头表明身份。
- 没有合法依据时，不要采集 **个人信息**（欧盟 GDPR、中国《个人信息保护法》等法律都有相关规定）。
- 网站会改版。要做好偶尔更新选择器的准备。

## 扩展思路

- 顺着每本书的 `url` 抓取详情（简介、UPC）：再加一对 HTTP + HTML 节点，同样开启分批。
- 把数据存进 Data Table（[菜谱 19](../19-mini-crm-with-data-tables/README.zh-CN.md)）并做对比（[菜谱 07](../07-github-release-watcher/README.zh-CN.md) 的模式），持续跟踪 **价格变化**。
- 大量依赖 JavaScript 的网站（内容由 JS 加载），用普通 HTTP 请求抓不到。可以使用无头浏览器服务或社区节点，或者在开发者工具 → *Network* 中找出页面实际调用的 JSON API。

## 常见问题

| 现象 | 解决方法 |
|---|---|
| 数组是空的 | 选择器没匹配上。在开发者工具中测试，并查看 **Fetch Page** 返回的 HTML（如果网站用 JavaScript 渲染，它可能和浏览器中看到的不一样）。 |
| `403 Forbidden` / 出现验证码页面 | 网站在拦截爬虫。请尊重网站的选择，或寻找 API。 |
| `£` 显示成 `Â£` | 编码问题。价格清洗只保留数字和小数点，所以数值仍然是对的。 |
| Code 节点报 `URL is not defined` | Code 沙箱中没有 `URL` 类。像本菜谱一样改用字符串拼接。 |
