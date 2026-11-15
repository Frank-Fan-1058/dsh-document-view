# 上架插件市场：完整指南

> 本文只记录**已查证的公开规则与入口**（查证日期 2026-11-15）。各市场规则可能变化，操作前请以对应仓库的 `CONTRIBUTING.md` 为准。文中不含任何账号、密钥或凭据。

## 结论先行

**性价比最高的一步：给 GitHub 仓库加 `dsh-plugin` topic。** 多个市场（1024 Store、dsh 社区商店）会自动抓取带这个 topic 的公开仓库并做静态校验，通过后自动收录，无需逐个提交。其次是**发布到 npm**——市场的一键安装命令读的是 npm 包，不发 npm 就只能「浏览模式」（有仓库链接、无安装命令）。

按性价比排序：

1. **加 GitHub topic `dsh-plugin`**（自动收录，成本最低）
2. **`npm publish`**（解锁一键安装）
3. **向 awesome 目录发 catalog PR**（人工精选收录，可控）
4. **在 dsh-market 提交入口登记**（可选）

## 前置条件（本仓库已全部满足）

- [x] 公开 GitHub 仓库，默认分支有 `package.json`
- [x] `package.json` 声明了非空的 `dsh.bundle.patch`
- [x] 该 patch 文件（`cordis.patch.yml`）确实在默认分支上
- [x] 中英文展示元数据 `locale/en.json` / `locale/zh.json`
- [x] MIT `LICENSE`、`README`、图标与详情页
- [x] 有真实的兼容性测试证据（见 [COMPATIBILITY.md](COMPATIBILITY.md)）

静态校验只会**只读检查文件树**，不会安装依赖、不会执行插件代码。

## 渠道一：1024 Store / awesome 社区目录（推荐）

| | |
| --- | --- |
| 目录仓库 | [imsai-sh/awesome-deepseek-harness-plugins](https://github.com/imsai-sh/awesome-deepseek-harness-plugins) |
| 在线市场 | [deepseek1024.com](https://deepseek1024.com/) |
| 收录规范 | [CONTRIBUTING.md](https://github.com/imsai-sh/awesome-deepseek-harness-plugins/blob/HEAD/CONTRIBUTING.md) |
| 规模 | 约 1.4 万个插件（2026-11） |
| 安装命令 | `dsh1024 plugin --profile web add <npm-package>` |

### 路径 A：自动发现（零 PR）

1. 打开仓库页 → 右侧 **About** 旁的齿轮 → 在 Topics 加 `dsh-plugin`。
2. 自动收集服务会抓取新建 / 新推送的带 topic 仓库，静态校验 `package.json` 的 `dsh.bundle.patch` 与 patch 文件是否存在。
3. 通过后自动进入目录并同步到网站。

### 路径 B：提交 catalog PR（人工精选、可控）

1. Fork 目录仓库，基于其默认分支建分支（如 `add-Frank-Fan-1058-dsh-document-view`）。
2. 只新增**一个**文件 `catalog/plugins/frank-fan-1058--dsh-document-view.json`，内容可直接用本仓库的 [awesome-dsh-catalog-entry.json](awesome-dsh-catalog-entry.json)（把 `added` 改成提交当天日期）。
3. **不要**改目录仓库的 `README.md`、`catalog/README.md`、工作流或脚本——它们是 CI 生成的投影。
4. PR 标题：`catalog: add Frank-Fan-1058/dsh-document-view`，正文按仓库根 PR 模板如实填写插件验证与测试命令。
5. 非草稿新增类 PR 通过 `Plugin submission review / static-review` 后**自动合并**；合并后 CI 自动同步到网站与 README。
6. 修改 / 下架既有条目的 PR 不会自动合并，需维护者人工审核。

条目只允许这些字段：`$schema`、`id`、`name`、`repository`、`category`、`description`、`added`。分类选 `ui`（界面增强）。中英文简介要客观中性，不要最高级、Star 数或宣传语。

> 也可用官方提交 Skill：`npx skills add imsai-sh/awesome-deepseek-harness-plugins --skill submit-dsh-plugin -g`，然后让助手「使用 $submit-dsh-plugin 检查并提交我的 DeepSeek Harness 插件」。

## 渠道二：npm 发布（解锁一键安装）

1024 Store **只提供 npm 安装**：网站探测 manifest 声明的包名，只要 npm 上的 latest 版本声明了 `dsh.bundle` 就显示安装命令。未发 npm 的插件仍会收录，但只有仓库链接。

```sh
npm login                      # 需要你自己的 npm 账号
npm pack --dry-run             # 先核对发布文件清单
npm publish --access public
```

发布后核对：`npm view dsh-document-view dsh.bundle` 应返回 patch 声明。

> 本仓库 `files` 是白名单，开发用的 `AGENTS.md` / `PROJECT.md` / `临时/` 不会进包。发布前再跑一次 [SECURITY.md](../SECURITY.md) 里的敏感信息扫描。

## 渠道三：dsh-market（DSH 内置可视化市场）

| | |
| --- | --- |
| 仓库 | [dsh-market/dsh-market](https://github.com/dsh-market/dsh-market) |
| 站点 | [dshmarket.com](https://dshmarket.com/) |
| 形态 | 装在 DSH 里的市场插件（本机已装 `dshmarket@1.73.19`），在设置里浏览 / 搜索 / 一键安装 |
| 提交入口 | 仓库 README 的 **Submit your plugin** 链接 —— 请以该仓库 README 为准，本指南不复述可能变化的地址 |
| 注意 | 仓库明确写着「Please don't PR plugin entries against this repo」，**不要**往这个仓库发插件条目 PR |

该市场同样从 GitHub `topic:dsh-plugin` 自动同步，并支持在 DSH 0.2.1+ 的 **插件 → 发现 → 索引源** 添加自定义索引。其 README 也强调 **Listing ≠ endorsement**（收录不等于背书）。

## 其他聚合站

`dsh.market`、`dshopen.org`、`deepseekharness.online` 等站点会聚合 `dsh-plugin` topic 仓库，通常无需单独提交。加好 topic、把 README 写清楚、发好 Release，它们会自动抓到。

## 提升曝光的可做事项

- [ ] 仓库 **About** 写一句清晰描述 + 填 Homepage + 加 `dsh-plugin`、`deepseek-harness`、`dsh` 等 topic
- [ ] README 首屏放一张能一眼看懂的界面图（本仓库已放）
- [ ] 每次发版写清 Release notes，并打 `vN` tag
- [ ] 中英文 README 都齐全
- [ ] 在 DSH 社区 / 讨论区发一篇使用场景介绍（**对外发布前需你确认**）
- [ ] 回复 Issue、按反馈迭代，保持仓库活跃

## 需要你确认后我才能代做的动作

以下都是**对外部服务的写操作**，本指南只准备材料、不擅自执行：

1. 给 GitHub 仓库加 `dsh-plugin` topic
2. `npm publish`（需要你的 npm 账号登录）
3. Fork 目录仓库并创建 catalog PR
4. 修改仓库 About 描述
5. 在社区发帖宣传
