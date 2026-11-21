// Rebuild the self-contained client bundle from src/.
// Usage: node scripts/build.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const name = 'dsh-document-view';

const strip = p => readFileSync(root + p, 'utf8').replace(/^export /gm, '');
const model = strip('src/model.mjs');
const annotations = strip('src/annotations.mjs');
const browser = strip('src/collaboration.mjs');

const client = `// Independent document collaboration client; no UI patch bundle included.
window.__ModuleLoader__.load({
  id: '${name}',
  factory: (require) => {
${model}
${annotations}
${browser}
    // Fail-safe activation: a future DSH release may change the module
    // loader or host contract. Never let an unexpected error inside this
    // plugin take down the page; disable it and report one clear line.
    function apply(ctx) {
      try {
        installDocumentCollaboration(ctx, require);
      } catch (error) {
        console.warn('[dsh-document-view] disabled safely after activation error:', error);
      }
    }
    return { apply };
  }
});
`;

writeFileSync(root + 'client.js', client);
console.log('Built self-contained client.js for ' + name + ' (' + client.split('\n').length + ' lines).');
