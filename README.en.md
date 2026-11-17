<div align="center">
  <img src="icon.svg" alt="dsh-document-view" width="96" />

  <h1>dsh-document-view</h1>

  <p><strong>Read the document. Keep the conversation.</strong><br />A split document view for DeepSeek Harness: the file stays in the center, your AI chat stays on the right — no tab hopping, no copy-pasting the file into the prompt.</p>

  <p>English · <a href="README.md">简体中文 →</a></p>
</div>

[![Stars](https://img.shields.io/github/stars/Frank-Fan-1058/dsh-document-view?style=flat-square&logo=github)](https://github.com/Frank-Fan-1058/dsh-document-view/stargazers)
[![Forks](https://img.shields.io/github/forks/Frank-Fan-1058/dsh-document-view?style=flat-square)](https://github.com/Frank-Fan-1058/dsh-document-view/network/members)
[![Issues](https://img.shields.io/github/issues/Frank-Fan-1058/dsh-document-view?style=flat-square)](https://github.com/Frank-Fan-1058/dsh-document-view/issues)
[![npm](https://img.shields.io/npm/v/dsh-document-view?style=flat-square)](https://www.npmjs.com/package/dsh-document-view)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)
[![DSH](https://img.shields.io/badge/DSH-0.2.2--rc.3-4c51bf?style=flat-square)](https://github.com/deepseek-ai/DeepSeek-Harness)
[![零网络请求](https://img.shields.io/badge/network-zero-2e7d32?style=flat-square)](SECURITY.md)

> ⭐ If this saves you a few round trips, star the repo — it helps other DeepSeek Harness users discover the plugin in marketplaces.

![Document view: document in the center, conversation on the right](docs/screenshots/01-overview.png)

> Screenshots are **desensitized illustrations** with generic placeholder content. They contain no real sessions, file names, accounts, or personal data.

<details>
<summary>Table of contents</summary>

- [Install in 30 seconds](#install-in-30-seconds)
- [The problem](#the-problem)
- [Who it is for](#who-it-is-for)
- [Features](#features)
- [Privacy & security](#privacy--security)
- [Requirements & compatibility](#requirements--compatibility)
- [Install](#install)
- [Usage](#usage)
- [FAQ](#faq)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

</details>

---

## Install in 30 seconds

Published on npm — one command:

```sh
# Official CLI
dsh plugin --profile web add dsh-document-view

# Or 1024 Store
dsh1024 plugin --profile web add dsh-document-view
```

Package: [npm / dsh-document-view](https://www.npmjs.com/package/dsh-document-view) (currently `1.1.1`). Enable it in the DSH plugin list and refresh the page. Other install options are in [Install](#install).

## The problem

Open a file in DSH and it takes over the right sidebar, pushing your conversation away. Asking the AI to explain, summarize or rewrite against that document means constantly switching between "reading" and "chatting" — and losing context every time. Pasting the content into the chat means repeated copy-paste and truncated context.

`dsh-document-view` does exactly one thing: **keeps both on screen**. It does not take over the editor, change save behavior, or touch your files. It only rearranges the window so DSH native document / Office preview and the chat panel work side by side.

| | Default | Document view on |
| --- | --- | --- |
| Document | Takes the right sidebar | Center area |
| Conversation | Pushed away | Always visible on the right |
| Ask AI about the document | Switch back and forth / paste | Same screen |
| Editing / saving / preview | Native | **Still native** |

## Who it is for

- Reading papers, reports, contracts or specs while asking the AI about them
- Checking Excel / PowerPoint data and following up on a specific row or slide
- Editing code or Markdown while getting AI review, without switching tabs
- Using a large or multi-monitor setup and wanting document and chat side by side

## Features

### 1. Document and chat, side by side

![Split view with a resizable divider](docs/screenshots/01-overview.png)

Open any file, then click **Document view** in the conversation header actions or the file tab actions. Drag the divider to resize; `←` / `→` nudge it, `Home` resets the ratio, and double-clicking the divider restores the default. The toggle and ratio are **saved per session**.

### 2. Settings and auto-enter

![Document view settings](docs/screenshots/02-settings.png)

The arrow next to the toggle opens settings:

- **Auto-enter on document view** (off by default) — fires only when *you* click a file or file tab; background file operations never open it. After you exit manually, the same file will not re-open repeatedly.
- **Document-first / Balanced / Chat-first** presets, saved per session.
- **Auto update / Paused** — reuses the host native file watcher. Pause when you want to read carefully; resuming shows the latest content while preserving the native viewer page and zoom state.

### 3. Works in narrow windows

![Document / Chat switch in a narrow window](docs/screenshots/03-narrow.png)

When the window is too narrow it switches to a single-column **Document / Chat** toggle. **Unsent input is preserved**, and focus moves to the visible switch if the current focus would be hidden.

### 4. Native all the way down

Rendering, editing, saving and preview of Markdown, PDF, Word, Excel, PowerPoint and local HTML files remain entirely with DSH own viewers and Office engine. The plugin **never reads, writes or uploads your files** and reimplements no editing feature. Disable it and the default layout returns.

## Privacy & security

The plugin touches your workspace UI, so every claim below is verifiable from the source:

- **No network calls** — no `fetch`, `XMLHttpRequest`, `WebSocket`, no external URLs in the code.
- **No file access** — no filesystem or editor read/write APIs.
- **No credentials** — no API keys, tokens, passwords, cookies, `.env` or config files ship in the package.
- **One preference only** — browser `localStorage` holds the auto-enter toggle and per-session ratios under `dsh.document-view.v1`; no document content, paths, file names or chat content.
- **Narrow CSS scope** — all styles are scoped to the plugin own `[data-fdc-*]` attributes. No host components are moved, cloned or remounted; only the window grid geometry changes.

See [SECURITY.md](SECURITY.md) and [docs/COMPATIBILITY.md](docs/COMPATIBILITY.md).

## Requirements & compatibility

- [DeepSeek Harness](https://github.com/deepseek-ai/DeepSeek-Harness) Desktop / Web, verified on **v0.2.2-rc.3**.
- Node.js >= 20 — **only for rebuilding from source**; not needed to install or use.
- **Host requirement declared**: `dsh.engines.dsh = ">=0.2.2-rc.3"`. On older DSH versions the host refuses the install with `incompatible-version` instead of loading a plugin that would blank the page. Granular boundaries are in the [compatibility notes](docs/COMPATIBILITY.md).

> The plugin relies on the host DOM structure and slot names. If a DSH upgrade changes them, the plugin **disables itself safely and the page keeps working** (no white screen). Re-verify with the [upgrade checklist](docs/COMPATIBILITY.md).

## Install

**Option 0 — from npm (recommended, unlocks one-line install)**

```sh
dsh1024 plugin --profile web add dsh-document-view
# or
dsh plugin --profile web add dsh-document-view
```

**Option 1 — local directory**

```sh
git clone https://github.com/Frank-Fan-1058/dsh-document-view.git
```

Then in DSH: **Plugins → Add plugin**, pick the `dsh-document-view` directory, enable it, and refresh the page (or restart DSH).

**Option 2 — tarball**

```sh
npm pack
```

Extract `dsh-document-view-*.tgz` anywhere, then point step 2 of Option 1 at that directory.

**Option 3 — build from source**

```sh
npm install            # only needed to rebuild
node scripts/build.mjs
node scripts/verify.mjs
```

`src/` is the source; `client.js` is the self-contained build artifact (all CSS inlined, no runtime dependencies). **Rebuild `client.js` after any `src/` change** — do not hand-edit the artifact.

> `file:` dependencies are physical copies: after editing source, remove `node_modules/<package>` and reinstall so the running copy updates.

## Usage

1. Open a file in the right sidebar (Markdown / PDF / Office).
2. Click **Document view** in the conversation header or file tab actions.
3. Drag the divider; `←` / `→` to nudge, `Home` or double-click to reset.
4. Open settings via the arrow for auto-enter and layout presets.
5. Click the toggle again (or the exit entry in the session / file header) to return to the default layout.

## FAQ

**Will it affect my editors or Office plugins?** No. It changes layout only — Univer, Office converters and native editors are untouched.

**Are my files read or uploaded?** No. No network requests, no file I/O, only the toggle and ratios are stored.

**Does anything remain after disabling?** No. All injected styles, attributes, the divider and listeners are removed on teardown.

**What if a DSH upgrade breaks it?** It disables itself safely and the page stays usable. Open an [Issue](https://github.com/Frank-Fan-1058/dsh-document-view/issues) with your DSH version.

**Which file types are supported?** Whatever the host supports natively — Markdown, PDF, Word, Excel, PowerPoint, local HTML, etc. The plugin adds no format restrictions.

## Roadmap

Shipped: v1.0.0 first third-party installable release, v1.1.0 bilingual docs and safe-deactivation fallback, v1.1.1 npm trusted publishing.

Already listed: npm package, 1024 Store / awesome catalog (PR #942 merged), and the GitHub `dsh-plugin` topic. Next (feedback-driven): follow up on the dsh-market catalog PR review; re-verify after new DSH releases; add more locales and layout presets. See [ROADMAP.md](ROADMAP.md) and [CHANGELOG.md](CHANGELOG.md).

## Contributing

Issues and PRs welcome — see [CONTRIBUTING.md](CONTRIBUTING.md). Rebuild `client.js` when changing `src/`; update both `locale/en.json` and `locale/zh.json` when changing UI copy. Never put real sessions, file names, accounts or personal data into illustrations or examples.

Want more people to find it inside DSH? See **[docs/PUBLISHING.md](docs/PUBLISHING.md)** for the full playbook (1024 Store, dsh-market, the `dsh-plugin` GitHub topic, npm publishing) and the ready-to-use [catalog entry](docs/awesome-dsh-catalog-entry.json).

## License

[MIT](LICENSE) © 2026 dsh-document-view contributors

---

<p align="center">Found it useful? <a href="https://github.com/Frank-Fan-1058/dsh-document-view">Give it a ⭐ Star</a> · <a href="https://github.com/Frank-Fan-1058/dsh-document-view/issues">Report an issue</a> · <a href="README.md">中文 README</a></p>
