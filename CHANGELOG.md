# CHANGELOG

## 文档（2026-11-16，未发版，仅仓库文档）

- 重写中英文 README：价值前置、徽章行、目录、30 秒安装、适用人群、Star 引导、路线图。
- 新增 `CONTRIBUTING.md` 与 Bug / Feature 两个 Issue 模板，降低参与门槛。
- 同步 `ROADMAP.md`、`docs/COMPATIBILITY.md` 的当前事实（已收录目录、插件版本 1.1.1）。
- 本批仅改文档，不重建 `client.js`、不升版本号。

## v1.1.1 (2026-11-15)

- 发布流程改为 npm trusted publishing（GitHub Actions OIDC），不再依赖会过期的 npm 令牌。
- 本版用于验证 trusted publisher 连接（npm 要求首次发布后连接才生效）。

## v1.1.0 (2026-11-15)

- 文档：中英文双语 README、三张脱敏界面示意图、安全与隐私说明、兼容性说明、插件市场上架指南、目录条目模板。
- 展示：重写详情页 hero 插图；完善中英文 `meta.description`（功能、用法、隐私、兼容边界）。
- 代码：新增宿主契约检查与激活兜底，`client.js` 的 `apply()` 用 try/catch 包裹安装过程——DSH 升级导致内部结构变化时插件安全停用，不会拖垮页面。
- 核查：全仓敏感信息扫描确认无密钥 / 凭据 / 本机路径 / 外部 URL；`npm pack --dry-run` 核对发布清单。
- 确认当前运行与官方最新 release 同为 `0.2.2-rc.3`，并建立升级复核清单。

## v1.0.0 (2026-11-15)

- 首个第三方可安装版本：从本机自用的原型抽出并重命名。
- 补齐 DSH 展示元数据（中英文 locale、图标、详情页）、MIT 许可与 GitHub README。
- 功能：文档居中 + 右侧会话、可拖动分栏、可选自动进入、窄屏切换、按会话保存；只改布局，不接管编辑 / 预览。
