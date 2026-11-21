# 兼容性与安全说明

## 当前验证基线

| 项目 | 值 | 依据 |
| --- | --- | --- |
| 运行中的 DSH | `0.2.2-rc.5` | `dsh -V` 与本机安装包 |
| 插件版本 | `1.1.1` | `package.json` |
| Node.js | >= 20（仅构建时） | `engines.node` |
| 宿主要求 | `>=0.2.2-rc.3` | `dsh.engines.dsh` |

本插件就是在上述版本上开发并实际运行的，因此**与当前安装版本兼容**。DSH 内置插件清单里 `ui-sidebar-right`、`ui-sidebar-documentpreview`、`office-kit`、`ui-conversation` 等条目均存在，与本插件依赖的宿主能力一致。HTML 预览依赖宿主 `iframe[data-html-preview]` 标记（当前版本存在）；布局通过地址后缀与 DOM 双重判定，任一命中即生效。批注依赖宿主 PDF 预览的文字层（`data-pdf-page` / `data-pdf-text` / `data-document-zoom-surface`），文字层缺失时批注静默不生效，阅读与布局不受影响。

> 无法承诺「未来所有 DSH 版本都兼容」——插件依赖宿主内部 DOM 与 slot 名称，这些不属于公开稳定 API。下面说明失效时的行为与复核方法。

## 依赖的宿主契约

**Client 服务（通过 `ctx.inject` 注入）**

- `slots` — `inject()` / `register()`，注册槽位：
  - `conversation.session.header.actions`
  - `sidebar.right.tab.document.actions`
- `sidebarRight` — `mounted`（`getSnapshot` / `subscribe`）、`openTabs`（`getSnapshot` / `subscribe`）、`isExpanded()`、`active()`
- `sessions`（提交批注时按需读取，不参与激活检查）— `list.getSnapshot().byId`、`scope(sessionId).get('conversation').send(text)`

**DOM 钩子（稳定 data 属性，非构建哈希类名）**

`data-rightbar-col`、`data-sidebar-right-panel`、`data-sidebar-right-session`、`data-sidebar-right-mode`、`data-sidebar-collapsed`、`data-textpreview-tool`、`data-excel-preview`、`data-slot="conversation.session.header.actions"`、`.fortune-zoom-container`

批注额外依赖 PDF 预览层：`data-pdf-preview`、`data-pdf-page`、`data-pdf-text`、`data-document-zoom-surface`，以及 pdf.js 的文字层（`.textLayer`）。

## 失效时不会拖垮页面（v1.1.0 起）

两道保护，都是「 fail closed 」——宿主结构变了就安静停用，而不是抛错：

1. **契约检查**：`installDocumentCollaboration` 在执行前检查上述服务与方法是否齐全，缺失则打印一条 `console.warn` 并直接返回，不注入任何样式或监听。
2. **激活兜底**：`client.js` 的 `apply()` 用 `try/catch` 包住整个安装过程。即使 DSH 未来改了模块加载方式导致意外异常，也只停用本插件，**宿主页面照常可用**（不会出现白屏）。

因此升级 DSH 后最坏的结果是「插件暂时不生效」，而不是「DSH 起不来」。

## 宿主要求怎么声明

写在 `package.json` 的 `dsh.engines.dsh`，当前为 `>=0.2.2-rc.3`。

- 采用**下界**而非 `^` 或精确值：本插件的失效方式是「自动停用 + 页面照常可用」，不会拖垮宿主，所以新版本 DSH 不该被这个字段挡住。
- 这条声明的作用是：低于验证基线时由宿主直接拒绝安装并提示 `incompatible-version`，而不是装上去才发现不生效。
- 插件市场据此显示「符合宿主要求」，不再显示「未声明宿主要求」。

## 升级复核清单

DSH 发布新版本后，维护者按以下步骤复核（可提 PR）：

1. 记录新版本号，确认 `app.asar` 内的实际版本。
2. 打开任一文件，启用「文档视图」，确认中间文档 / 右侧对话同时可见。
3. 拖动分隔线，确认比例变化且刷新后保持；`←` / `→` / `Home` / 双击复位逐一验证。
4. 打开设置，验证自动进入、三种布局预设、自动更新 / 暂停。
5. 缩窄窗口，验证「文档 / 对话」切换、未发送输入保留、焦点不丢失。
6. 在 Word 或 PDF 里选中文字，验证浮条出现「删除线 / 批注」，保存后页面出现标记，缩放后标记仍贴合原文。
7. 打开「批注 N」面板，验证定位、编辑、删除与「提交给 AI」；提交后右侧会话收到结构化清单，批注变为已提交。
8. 退出 / 停用插件，确认宿主原生布局完全恢复、无残留样式与属性。
9. 检查浏览器 Console 是否出现 `[dsh-document-view] client host contract changed` 警告——出现即表示宿主契约已变，需对照上表适配选择器。
10. 更新本文件与 `locale/*.json` 的验证版本，发新版。

## 密钥与个人信息核查

发布前已对全仓（含 `src/`、`client.js`、`index.js`、`cordis.patch.yml`、`locale/`、`docs/`）做扫描：

- 无 API Key、Token、密码、私钥、Cookie、`.env`、凭据文件；
- 无本机绝对路径、用户名目录、内网地址、私有仓库地址；
- 代码内无外部 URL（仅 README / docs 中的公开文档链接，以及 `package.json` 的公开仓库字段）；
- 三张界面图为通用占位内容绘制的脱敏示意图，不含真实会话、文件名、账号或个人数据。

复核命令：

```sh
grep -rniE "api[_-]?key|secret|token|password|bearer|ghp_|BEGIN .*PRIVATE" . --exclude-dir=.git
npm pack --dry-run
```
