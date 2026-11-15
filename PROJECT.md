# dsh-document-view

面向第三方分发的 DSH bundle。仓库：https://github.com/Frank-Fan-1058/dsh-document-view

## 当前状态

- v1.1.0（2026-11-15）：发布页面与文档大幅完善，新增双语 README、脱敏界面示意图、安全/兼容性/上架指南；代码增加宿主契约检查与激活兜底。Release 已发布。
- v1.0.0（2026-11-15）：首个第三方可安装版本，GitHub 仓库 + Release 已上线。
- 验证基线：DSH `0.2.2-rc.3`（当前官方最新 release）。

## 上架进展（2026-11-15，全部纯 CLI 完成）

| 动作 | 结果 |
| --- | --- |
| GitHub topics | `dsh-plugin`, `deepseek-harness`, `dsh`, `document-view`, `split-view`, `plugin` 已加 |
| 仓库 About | 描述「边看文档，边聊 AI：DSH 分栏文档视图插件（文档居中 + 右侧会话）」+ Homepage 已填；Discussions 已开启 |
| 1024 Store / awesome 目录 | [PR #942](https://github.com/imsai-sh/awesome-deepseek-harness-plugins/pull/942) 静态审查通过后**已自动合并**，条目进 main |
| dsh-market 数据源 | [PR #15514](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/pull/15514) 已提交，待维护者人工审核（该目录要求仓库创建满 1 天，仓库 2026-11-15 07:17Z 创建，约 11-16 07:17Z 后满足） |
| 介绍帖 | [Discussions #1](https://github.com/Frank-Fan-1058/dsh-document-view/discussions/1) 已发布（Show and tell） |
| npm publish | **待执行**：本机无 npm 凭据；已备好纯 CLI 脚本 `scripts/publish-npm.mjs`，设置一次 `NODE_AUTH_TOKEN` 后即可发布 |

外网可达（GitHub / npm / npmmirror 均 200），CATVPN 本就运行，未额外打开。GitHub 侧全部通过本机 GCM 凭据 + REST/GraphQL API 完成，未使用浏览器。

## 待办

- 设置一次 npm 令牌后执行 `node scripts/publish-npm.mjs`，发布到 npm（解锁 1024 Store 一键安装）。
- PR #15514 满 1 天后若 CI 未通过，按机器人评论修正条目；通过后等维护者合并。
- 每次 DSH 升级按 `docs/COMPATIBILITY.md` 的升级复核清单重验。
