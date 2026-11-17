# dsh-document-view 工作指引

- 这是可独立分发给第三方的 DSH bundle（不是本机 `file:` 私有插件）；包名 = 仓库名 = 插件 row id = `dsh-document-view`。
- 运行时只需 `index.js` / `client.js` / `cordis.patch.yml` / `locale/` / `icon.svg` / `docs/`；`src/` 是源码，`scripts/build.mjs` 把 `src/` 拼成自包含 `client.js`。
- 改 `src/` 后必须 `node scripts/build.mjs` 重建 `client.js`；不要手改 `client.js`。
- `client.js` 内联全部 CSS，不引用任何外部 `.css`；`dataset.pluginCss` 只是标记字符串，不是文件依赖。
- `dsh.client` 只保留 `{ platform: 'web' }`，不要加 `immediately` / `inject`（会改变加载行为）。
- 宿主要求写在 `package.json` 的 `dsh.engines.dsh`（当前 `>=0.2.2-rc.3`）。**写错或过窄会直接拒绝安装**，改动前先在本机实测；细则仍写进 README / `docs/COMPATIBILITY.md`。
- 展示元数据在 `locale/en.json` / `locale/zh.json`；详情页单图在 `docs/DETAIL*.md` → `preview.svg`（640×300、无文字、明暗主题可读）。
- `docs/screenshots/*.png` 是**通用占位内容绘制的脱敏示意图**，生成脚本在 `scripts/` 之外由维护者本地运行；**绝不放入真实会话、文件名、账号、路径或个人数据**。新增示意图必须保持这一条。
- 公开仓库不得出现密钥、凭据、本机绝对路径、内网地址、私有仓库地址；发版前按 `docs/COMPATIBILITY.md` 的核查命令扫一遍。
- 版本与进展记在 `CHANGELOG.md` / `PROJECT.md`；`git tag vN` 才算正式发版。
