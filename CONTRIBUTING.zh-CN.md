# 参与贡献

[English](CONTRIBUTING.md) · **简体中文**

感谢你帮助更多人轻松学会 n8n！

## 添加一个菜谱

1. 新建 `examples/NN-short-name/`（使用下一个空闲编号，英文短横线命名）。
2. 在 n8n 中搭好工作流，然后用 **⋯ → Download** 导出 JSON，保存为 `workflow.json`。
3. 提交前清理导出文件：
   - 删除每个节点的 `credentials` 块，让使用者挂上自己的凭证。
   - 删除 `pinData`、`meta.instanceId`、`id`、`versionId` 和 `active`（或把 `pinData` 保留为 `{}`）。
   - 确保任何地方（URL、请求头、Code 节点）都没有 API Key、令牌或个人数据。
   - 给每个节点起一个有意义的名字（如 "Get Forecast"，而不是 "HTTP Request1"）。
   - 添加一张便签，用 3–5 行概括这个菜谱。
   - 尽量使用免费、无需密钥的公开 API，让大家导入就能运行。
   - 如果工作流使用定时触发，同时加一个 **Manual Trigger** 用于测试。
4. 参照现有菜谱编写 `README.md`：概要表格、ASCII 流程图、*What you'll learn*、*Setup*、*Try it*、*How it works*、*Ideas to extend*、*Troubleshooting*。
   同时添加简体中文版 `README.zh-CN.md`，两个文件保持同步：章节相同、链接相同（中文版链接指向 `.zh-CN.md` 版本），n8n 界面上的名称保留英文并附中文说明。语言切换链接放在标题下一行。
5. 在主 `README.md` 和 `README.zh-CN.md` 的菜谱表格中各加一行。
6. 运行检查：

   ```bash
   node scripts/validate.mjs
   ./scripts/test-in-n8n.sh      # 可选：在真实 n8n 中导入并运行全部工作流
   ```

## 修复菜谱

请提交 issue 或 PR，说明哪里出了问题（n8n 版本、报错信息）。n8n 更新很快，非常欢迎帮忙更新节点。翻译改进同样欢迎！
