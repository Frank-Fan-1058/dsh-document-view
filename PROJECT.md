# dsh-document-view

2026-11-15 v1.0.0：从本机 `frank-document-collaboration` 抽出独立可分发版本；重命名为 `dsh-document-view`，补齐 locale / icon / docs / LICENSE / README / .gitignore，初始化 git 仓库（commit `0a3778b` + tag `v1.0.0`）。功能代码与已验证的本地版本一致（仅标识符与存储键改名）。分发方式：GitHub 仓库 + 本地目录安装。仓库归属 `Frank-Fan-1058`（从浏览器已登录的 GitHub 账号读取）。
2026-11-15：已发布。用户在 GitHub 建好空仓后，已 `git remote add origin` → `branch -M main` → 直连 push `main` 与 `v1.0.0` tag；`git ls-remote` 核对远端含 `refs/heads/main`、`refs/tags/v1.0.0`。代理路径触发过 gh-proxy 的凭据弹窗（用户无该账号），改回直连复用已存 GCM 凭据成功，未索取任何密码。仓库：https://github.com/Frank-Fan-1058/dsh-document-view 。
