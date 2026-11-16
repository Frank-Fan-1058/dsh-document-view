<div align="center">
  <img src="icon.svg" alt="dsh-document-view" width="96" />

  <h1>dsh-document-view</h1>

  <p><strong>边看文档，边聊 AI。</strong><br />文档居中显示，当前会话留在右侧 —— 不用再来回切换，也不用把文件反复贴进对话框。</p>

  <p>简体中文 · <a href="README.en.md">English →</a></p>
</div>

[![Stars](https://img.shields.io/github/stars/Frank-Fan-1058/dsh-document-view?style=flat-square&logo=github)](https://github.com/Frank-Fan-1058/dsh-document-view/stargazers)
[![Forks](https://img.shields.io/github/forks/Frank-Fan-1058/dsh-document-view?style=flat-square)](https://github.com/Frank-Fan-1058/dsh-document-view/network/members)
[![Issues](https://img.shields.io/github/issues/Frank-Fan-1058/dsh-document-view?style=flat-square)](https://github.com/Frank-Fan-1058/dsh-document-view/issues)
[![npm](https://img.shields.io/npm/v/dsh-document-view?style=flat-square)](https://www.npmjs.com/package/dsh-document-view)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)
[![DSH](https://img.shields.io/badge/DSH-0.2.2--rc.3-4c51bf?style=flat-square)](https://github.com/deepseek-ai/DeepSeek-Harness)
[![零网络请求](https://img.shields.io/badge/network-zero-2e7d32?style=flat-square)](SECURITY.md)

> ⭐ 如果它帮你省下了来回切换，给仓库点个 Star —— 这能让更多 DSH 用户在插件市场里发现它。

![文档视图：中间是文档，右侧是当前会话](docs/screenshots/01-overview.png)

> 界面图为**脱敏示意图**，用通用占位内容绘制，不含真实会话、文件名、账号或个人数据。

<details>
<summary>目录</summary>

- [30 秒装上](#30-秒装上)
- [为什么需要它](#为什么需要它)
- [适合谁](#适合谁)
- [核心能力](#核心能力)
- [隐私与安全](#隐私与安全)
- [要求与兼容性](#要求与兼容性)
- [安装](#安装)
- [使用](#使用)
- [常见问题](#常见问题)
- [路线图](#路线图)
- [参与贡献](#参与贡献)
- [许可证](#许可证)

</details>

---

## 30 秒装上

已发布到 npm，一行命令即可：

```sh
# 官方 CLI
dsh plugin --profile web add dsh-document-view

# 或 1024 Store
dsh1024 plugin --profile web add dsh-document-view
```

包地址：[npm / dsh-document-view](https://www.npmjs.com/package/dsh-document-view)（当前 `1.1.1`）。装完在 DSH 插件列表启用、刷新页面即可。其它装法见 [安装](#安装)。

## 为什么需要它

在 DSH 里打开一个文件，文档会占满右侧栏，正在进行的对话被挤走。想让 AI 对照文档解释、总结、改写，只能在「看文档」和「看对话」之间反复切换，上下文一直在丢；把内容复制进对话，又得反复粘贴、还容易截断。

`dsh-document-view` 只做一件事：**把这两块同时留在屏幕上**。它不接管编辑器、不改动保存逻辑、也不碰你的文件 —— 只是重新排布窗口，让 DSH 原生的文档 / Office 预览和对话框并排工作。

| | 默认布局 | 开启文档视图 |
| --- | --- | --- |
| 看文档 | 右侧栏独占 | 中间区域显示 |
| 当前对话 | 被挤走，需要切回 | 右侧始终可见 |
| 让 AI 对照文档回答 | 来回切换 / 反复粘贴 | 同屏完成 |
| 编辑、保存、预览 | 原生功能 | **仍是原生功能** |

## 适合谁

- 读论文、报告、合同、需求文档时，想让 AI 边看边解释
- 对着 Excel / PPT 核对数据，随时追问某一行、某一页
- 一边改代码或 Markdown，一边让 AI 评审，不想来回切标签
- 用大屏或多显示器，希望文档和对话各占一块

## 核心能力

### 1. 文档与对话同屏

![分栏与可调分隔线](docs/screenshots/01-overview.png)

打开任意文件后，在会话头部或文件标签的操作区点 **「文档视图」** 即可开启。拖动分隔线调整宽度，也可以用 `←` / `→` 微调、`Home` 复位、双击分隔线恢复默认比例。开关和比例**按会话分别记住**。

### 2. 设置与自动进入

![文档视图设置](docs/screenshots/02-settings.png)

开关旁的箭头打开设置：

- **查看文档时自动进入**（默认关闭）：只在你主动点击文件或文件标签时触发，后台文件操作不会打扰你；手动退出后，同一个文件不会反复自动打开。
- **文档优先 / 均衡 / 对话优先** 三种预设，按会话保存。
- **自动更新 / 已暂停**：沿用宿主原生的文件变化监听，需要仔细阅读时可暂停跟随，继续后显示最新内容，并保留原生预览的页码与缩放状态。

### 3. 窄窗口也能用

![窄窗口下的文档 / 对话切换](docs/screenshots/03-narrow.png)

窗口不够宽时自动切换为「文档 / 对话」单栏切换，**未发送的输入不会丢**；宽转窄时若焦点落在即将隐藏的区域，会移到可见的切换按钮上。

### 4. 只用原生能力

Markdown、PDF、Word、Excel、PPT 的渲染、编辑、保存与预览，全部继续由 DSH 自带的查看器和 Office 引擎负责。本插件**不读取、不写入、不上传**你的文件，也不重复实现任何编辑功能。停用插件即恢复默认布局。

## 隐私与安全

插件会接触你的工作界面，所以这一点值得单独说清楚 —— 以下每条都能从源码核对：

- **零网络请求**：代码里没有 `fetch`、`XMLHttpRequest`、`WebSocket`，也没有任何外部 URL。
- **零文件访问**：不调用任何读写文件的接口，不碰编辑器内容。
- **零凭据**：包内不含 API Key、Token、密码、Cookie 或任何密钥；没有 `.env`、没有配置文件。
- **只存一项偏好**：用浏览器 `localStorage` 保存「自动进入开关 + 每个会话的分栏比例」，键名 `dsh.document-view.v1`，不保存文档内容、路径、文件名或对话内容。
- **作用域收窄**：所有样式限定在插件自己加的 `[data-fdc-*]` 属性下，不改宿主全局样式；不移动、不克隆、不重新挂载任何 React 组件，只调整窗口网格的几何尺寸。

详见 [SECURITY.md](SECURITY.md) 与 [docs/COMPATIBILITY.md](docs/COMPATIBILITY.md)。

## 要求与兼容性

- [DeepSeek Harness](https://github.com/deepseek-ai/DeepSeek-Harness) 桌面版 / Web 版，已在 **v0.2.2-rc.3** 上验证通过。
- Node.js >= 20 —— **仅从源码重建时需要**；单纯安装使用不需要 Node.js。
- 不设 `engines.dsh` 硬约束：版本约束写错会直接阻止安装，兼容性声明放在本文档与 [兼容性说明](docs/COMPATIBILITY.md)。

> 插件依赖宿主的 DOM 结构与 slot 名称。DSH 升级后若这些内部结构变化，插件会**自动停用并保持页面可用**（不会白屏），随后按 [升级复核清单](docs/COMPATIBILITY.md#升级复核清单) 重验即可。

## 安装

**方式零：从 npm 安装（推荐，解锁一键安装）**

```sh
dsh1024 plugin --profile web add dsh-document-view
# 或
dsh plugin --profile web add dsh-document-view
```

**方式一：本地目录安装**

```sh
git clone https://github.com/Frank-Fan-1058/dsh-document-view.git
```

然后打开 DSH → **插件 → 添加插件**，选中 `dsh-document-view` 目录 → 在插件列表启用 → 刷新页面（或重启 DSH）。

**方式二：打包成 tarball**

```sh
npm pack
```

把生成的 `dsh-document-view-*.tgz` 解压到任意目录，再按方式一第 2 步指向该目录。

**方式三：从源码构建**

```sh
npm install            # 仅构建时需要
node scripts/build.mjs
node scripts/verify.mjs
```

`src/` 是源码，`client.js` 是自包含构建产物（内联全部 CSS，无运行时依赖）。**改了 `src/` 必须重建** `client.js`，不要手改产物。

> `file:` 依赖是实体拷贝：改了源码要删掉 `node_modules/<包名>` 再重装，运行副本才会更新。

## 使用

1. 在右侧栏打开一个文件（Markdown / PDF / Office 均可）。
2. 点会话头部或文件标签上的 **「文档视图」**。
3. 拖动分隔线调宽度；`←` / `→` 微调，`Home` 或双击分隔线复位。
4. 点开关旁的箭头进设置，按需开启「自动进入」或选布局预设。
5. 再点一次开关（或会话顶部 / 文件顶部的退出入口）即可退出，恢复默认布局。

## 常见问题

**会影响我已有的文档编辑器或 Office 插件吗？** 不会。本插件不改 Univer、Office 转换服务或任何原生编辑器，只调整窗口布局。

**我的文件会被读取或上传吗？** 不会。插件不发网络请求、不读写文件，只保存开关与比例两项偏好。

**关掉插件后布局会残留吗？** 不会。卸载时会移除所有注入的样式、属性、分隔线与监听，恢复宿主原生布局。

**升级 DSH 后失效了怎么办？** 插件会安全地自动停用（页面照常可用）。请提 [Issue](https://github.com/Frank-Fan-1058/dsh-document-view/issues) 并附上 DSH 版本，维护者按 [升级复核清单](docs/COMPATIBILITY.md#升级复核清单) 适配。

**支持哪些文件类型？** 宿主原生支持什么就支持什么：Markdown、PDF、Word、Excel、PPT 等，本插件不做格式限制。

## 路线图

已发布：v1.0.0 首个第三方可安装版本、v1.1.0 双语文档与安全兜底、v1.1.1 npm trusted publishing。

已收录：npm 包、1024 Store / awesome 目录（PR #942 已合并）、GitHub `dsh-plugin` topic。接下来（按反馈排期）：跟进 dsh-market 目录 PR 审核；DSH 新版本发布后按升级复核清单重验；视反馈补充更多语言与布局预设。完整清单见 [ROADMAP.md](ROADMAP.md)，版本记录见 [CHANGELOG.md](CHANGELOG.md)。

## 参与贡献

欢迎提 [Issue](https://github.com/Frank-Fan-1058/dsh-document-view/issues) 与 PR，流程见 [CONTRIBUTING.md](CONTRIBUTING.md)。改 `src/` 后请一并提交重建后的 `client.js`；涉及界面文案时同步更新 `locale/en.json` 与 `locale/zh.json`。请勿在示意图或示例中放入真实会话、文件名、账号或个人数据。

想让更多人在 DSH 内直接搜到并安装？完整流程（1024 Store / dsh-market 的收录方式、`dsh-plugin` topic、npm 发布、目录 PR 模板）见 **[docs/PUBLISHING.md](docs/PUBLISHING.md)**，仓库内已备好可直接复用的 [目录条目](docs/awesome-dsh-catalog-entry.json)。

## 许可证

[MIT](LICENSE) © 2026 dsh-document-view contributors

---

<p align="center">觉得有用？<a href="https://github.com/Frank-Fan-1058/dsh-document-view">给个 ⭐ Star</a> · <a href="https://github.com/Frank-Fan-1058/dsh-document-view/issues">反馈问题</a> · <a href="README.en.md">English README</a></p>
