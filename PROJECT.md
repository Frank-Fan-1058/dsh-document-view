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
| npm publish | **已发布** `dsh-document-view@1.1.1`，`dist-tags.latest = 1.1.1`，带 SLSA provenance 与 attestations，26 个文件 |
| 免令牌发布 | **已打通**：trusted publisher 已连接 `Frank-Fan-1058/dsh-document-view` + `publish.yml`；v1.1.1 由 Actions OIDC 发布成功，不再需要任何令牌 |

外网可达（GitHub / npm / npmmirror 均 200），CATVPN 本就运行，未额外打开。GitHub 侧全部通过本机 GCM 凭据 + REST/GraphQL API 完成。

## 发布凭据要点（避免重复踩坑）

- 本机 Git 凭据是 **OAuth token**，scopes 为 `gist, read:org, repo`，**没有 `workflow`** → `git push` 含 `.github/workflows/*` 的提交会被拒。workflow 文件改用 GitHub 网页编辑器创建（已成功）。
- npm 令牌若勾选「Bypass 2FA」，**无权配置 trusted publishing**（E403），且该令牌将于 2027-01 被撤销——应改用 trusted publishing，不再发长期令牌。
- 发布脚本 `scripts/publish-npm.mjs` 已修好（`stdio:'inherit'` 返回 null，不能 `.toString()`）。

## 待办

- 已无阻塞项：打 tag + 建 Release 即由 Actions 自动发布（无需令牌）。
- PR #15514：CI 唯一失败项是「仓库创建不足 1 天」，会自动复检通过（约 11-16 07:17Z 后）。
- 1024 Store 尚未切到 npm 安装命令，等其目录同步周期刷新。
- 每次 DSH 升级按 `docs/COMPATIBILITY.md` 的升级复核清单重验。

## 网络踩坑（2026-11-15）

- 本机 `curl` 走系统代理（`127.0.0.1:7890`）能通，但 **`git` 不走系统代理** → 表现为 curl 200 而 git push 连不上。
- 给 git 显式加代理（`-c http.proxy=http://127.0.0.1:7890`）后，Windows 默认的 schannel TLS 后端会报 `failed to receive handshake`；改 `GIT_SSL_BACKEND=openssl` 即可正常 fetch/push。
- 完整可用组合：`GIT_SSL_BACKEND=openssl git -c http.proxy=http://127.0.0.1:7890 <cmd>`。

