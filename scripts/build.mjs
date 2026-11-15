// Rebuild the self-contained client bundle from src/.
// Usage: node scripts/build.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const name = 'dsh-document-view';

const strip = p => readFileSync(root + p, 'utf8').replace(/^export /gm, '');
const model = strip('src/model.mjs');
const browser = strip('src/collaboration.mjs');

const client = `// Independent document collaboration client; no UI patch bundle included.
window.__ModuleLoader__.load({
  id: '${name}',
  factory: (require) => {
${model}
${browser}
    function apply(ctx) {
      installDocumentCollaboration(ctx, require)
    }
    return { apply };
  }
});
`;

writeFileSync(root + 'client.js', client);
console.log('Built self-contained client.js for ' + name + ' (' + client.split('\n').length + ' lines).');
