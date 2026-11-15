# dsh-document-view 工作指引

- 这是可独立分发给第三方的 DSH bundle（不是本机 `file:` 私有插件）；包名 = 仓库名 = 插件 row id = `dsh-document-view`。
- 运行时只需 `index.js` / `client.js` / `cordis.patch.yml` / `locale/` / `icon.svg` / `docs/`；`src/` 是源码，`scripts/build.mjs` 把 `src/` 拼成自包含 `client.js`。
- 改 `src/` 后必须 `node scripts/build.mjs` 重建 `client.js`；不要手改 `client.js`。
- `client.js` 内联全部 CSS，不引用任何外部 `.css`；`dataset.pluginCss` 只是标记字符串，不是文件依赖。
- `dsh.client` 只保留 `{ platform: 'web' }`，不要加 `immediately` / `inject`（会改变加载行为）。
- 不设 `engines.dsh`：约束写错会阻止安装，兼容性写进 README 与 `meta.description`。
- 展示元数据在 `locale/en.json` / `locale/zh.json`；详情图在 `docs/`，中英文共用一张无文字 `preview.svg`。
- 版本与进展记在 `CHANGELOG.md` / `PROJECT.md`；`git tag vN` 才算正式发版。
