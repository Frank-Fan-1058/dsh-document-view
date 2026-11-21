# Security & privacy

`dsh-document-view` is a client bundle for the document split view and in-page review marks. The following claims are verifiable from the source (`src/`, `client.js`, `index.js`):

| Concern | Status |
| --- | --- |
| Network requests | None — no `https?://` URL, `XMLHttpRequest`, `WebSocket` or `EventSource`. The only `fetch` reads the file you already opened through the host's local `dsh-resource://` protocol, to render our own HTML preview |
| File I/O | Read-only, and only the open document: the HTML preview re-reads that one file through the host's own protocol; annotations read the rendered page text layer. No filesystem API, no writes |
| Credentials | None — no API keys, tokens, passwords, cookies, `.env`, or config files in the package |
| Data stored | Two local stores. `dsh.document-view.v1`: the auto-enter flag and per-session column ratios. The `dsh.document-view.annotations.v2/` prefix: one key per annotation — file path, page number, the quoted snippet, your comment, and open/sent status; a `storage` listener keeps concurrently open windows converged |
| Data not stored | Full document contents, chat content, account data, or anything you did not select for an annotation |
| Sending to the model | Only when you press **Send to AI**: the review prompt goes through the host's own conversation service, exactly like a typed message. The plugin itself makes no network call |
| Host modification | CSS is scoped to the plugin's own `[data-fdc-*]` attributes; no host React nodes are moved, cloned or remounted |
| Teardown | Removes all injected styles, attributes, divider, observer, annotation layer, popover and listeners on disable |

The only URLs in the repository are documentation links in the README, the `docs/` guides, and the public `repository` / `bugs` / `homepage` fields in `package.json`.

## Reporting a vulnerability

Open a [GitHub Issue](https://github.com/Frank-Fan-1058/dsh-document-view/issues) with a description and reproduction steps. For a privately disclosed issue, use GitHub's private vulnerability reporting on the repository's **Security** tab.

## Verifying the shipped files

```sh
npm pack --dry-run     # inspect the exact published file list
```

`files` in `package.json` is a whitelist; development-only documents (`AGENTS.md`, `PROJECT.md`, `临时/`, `归档/`) are not part of the package.
