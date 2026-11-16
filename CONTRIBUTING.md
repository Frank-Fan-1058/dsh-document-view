# 参与贡献 / Contributing

谢谢你愿意让 dsh-document-view 更好。Issue 与 PR 都欢迎。

## 提 Issue

- 用仓库自带的 [Bug 反馈](.github/ISSUE_TEMPLATE/bug_report.md) 或 [功能建议](.github/ISSUE_TEMPLATE/feature_request.md) 模板，附上 DSH 版本、操作系统、复现步骤。
- 截图或示意图**不要包含真实会话、文件名、账号、路径或个人数据**（本仓库的示意图均为脱敏占位内容）。

## 提 PR

1. 源码在 `src/`。改完必须重建产物：

```sh
npm install
node scripts/build.mjs
node scripts/verify.mjs
```

2. 把重建后的 `client.js` 一起提交（`client.js` 是内联全部 CSS 的自包含产物，**不要手改**）。
3. 改界面文案时同步更新 `locale/en.json` 与 `locale/zh.json`。
4. 涉及兼容性或安全边界时，一并更新 `docs/COMPATIBILITY.md` / `SECURITY.md`。
5. 在 PR 描述里说明改动动机与验证方式；版本记录写在 `CHANGELOG.md`，由维护者在发版时统一处理。

## 设计原则

- **只改布局**：不接管编辑器、不读写文件、不发网络请求、不引入运行时依赖。
- **安全降级**：DSH 升级导致宿主内部结构变化时，插件应自动停用并保持页面可用，不白屏。
- **最小侵入**：样式限定在插件自有属性下，不改宿主全局样式。

Thanks for helping more DeepSeek Harness users read and chat on the same screen.

## 提交说明规范（Commit message）

GitHub 文件列表里每一行显示的「备注」，就是**该文件最近一次提交说明**。为了让仓库一眼看得懂，提交说明统一按下面写（参考 DSH 生态高星仓库与 Conventional Commits）：

```
<type>: <一句话说清这一件事>（不超过 50 字，中文优先）
```

type 只用这几种：

- `feat` 新功能 / `fix` 修缺陷 / `refactor` 重构 / `test` 测试
- `docs` 文档（README、指南、CHANGELOG、ROADMAP）
- `chore` 构建 / CI / 依赖 / 忽略规则 / `catalog` 目录收录
- `release` 发版（配合 `git tag vN`）

四条规矩：

1. **一条只说一件事**。不要把「重写 README + 加模板 + 改 About + 改 Release」塞进一条。
2. **短到不会被截断**。要展开的写进 commit body 或 CHANGELOG，不堆在标题里。
3. **前缀固定英文小写，正文用中文**；不写 `Update publish.yml`、`Create xxx` 这类不带前缀的裸说明。
4. 发版用 `release: v1.1.1 — 一句话卖点`，body 里写验证结果。

示例：

```sh
docs: 中英 README 首屏改为价值前置
docs: 新增 CONTRIBUTING 与 Issue 模板
release: v1.1.1 — 改用 trusted publishing 发布
fix: 窄屏切换时保留未发送输入
```
