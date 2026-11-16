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

## Commit message convention

GitHub shows, next to every file, the subject of **the last commit that touched it**. Keep subjects short and self-explanatory.

```
<type>: <one sentence, imperative, under 60 characters>
```

Types: `feat` / `fix` / `refactor` / `perf` / `test` / `docs` / `chore` / `release`. Add a scope in parentheses only when the repo has several areas, e.g. `fix(desktop):`.

Rules:

1. **One commit, one thing.** Do not bundle a README rewrite, new templates and an About change into a single subject.
2. **Short enough to never be truncated.** Put details in the commit body or `CHANGELOG.md`.
3. **English subject, lowercase type, no bare `Update file` / `Create file` subjects.**
4. Releases use `release: v1.1.1 — <one-line selling point>` and list verification in the body.

Examples:

```sh
docs: rewrite bilingual READMEs and add contributing guide
docs: add commit message convention
release: v1.1.1 — switch to npm trusted publishing
fix: keep unsent input when collapsing to a narrow window
```
