// Lightweight release verification: model unit checks + artifact integrity.
// Run: node scripts/verify.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { CollaborationState, solveColumns, isDocument } from '../src/model.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
let failures = 0;
const check = (name, cond) => {
  console.log(`${cond ? '  PASS' : '  FAIL'}  ${name}`);
  if (!cond) failures++;
};

console.log('== model ==');
check('isDocument accepts dsh-resource://file/', isDocument('dsh-resource://file/a.md'));
check('isDocument rejects other addresses', !isDocument('https://example.com/a.md'));
check('isDocument accepts html addresses', isDocument('file:///D:/tmp/page.html'));
check('isDocument accepts html viewer titles', isDocument('index.html'));
check('solveColumns narrow below 760px', solveColumns(700, 0, 0.35).narrow === true);
check('solveColumns wide splits document/chat', (() => {
  const r = solveColumns(1200, 0, 0.35);
  return !r.narrow && r.document >= 360 && r.chat >= 400 && r.document + r.chat === 1200;
})());
check('ratio clamped to 0.2..0.65', (() => {
  const r = solveColumns(1200, 0, 0.99);
  return r.chat === Math.round(1200 * 0.65);
})());

const store = {
  data: {},
  getItem(k) { return this.data[k] ?? null; },
  setItem(k, v) { this.data[k] = v; },
};
const state = new CollaborationState(store);
check('auto mode off by default', state.auto === false);
state.auto = true;
state.session('s1').enabled = true;
state.session('s1').ratio = 0.5;
state.save();
const restored = new CollaborationState(store);
check('auto mode persists', restored.auto === true);
check('per-session toggle persists', restored.session('s1').enabled === true);
check('per-session ratio persists', restored.session('s1').ratio === 0.5);
const corrupted = new CollaborationState({ getItem: () => '{not json', setItem() {} });
check('corrupted storage does not throw', corrupted.auto === false);

console.log('== artifact ==');
const client = readFileSync(root + 'client.js', 'utf8');
check('client.js registers module loader id', client.includes("id: 'dsh-document-view'"));
check('client.js contains host contract guard', client.includes('hostContractIntact'));
check('client.js wraps activation in try/catch', client.includes('disabled safely after activation error'));
check('client.js has no external URL', !/https?:\/\//.test(client));
// The only fetch allowed is the host's local dsh-resource:// protocol, used to
// read the file you already opened so our own HTML preview can render it. It is
// not a network call: no http(s) URL, no WebSocket, no XHR.
check('client.js makes no network request', !/https?:\/\//.test(client) && !/\b(XMLHttpRequest|WebSocket|EventSource)\s*\(/.test(client));
check('client.js fetches only the local resource protocol', (() => {
  const calls = client.match(/\bfetch\(/g) || [];
  if (calls.length === 0) return true;
  return !/fetch\((?!address)/.test(client) && client.includes('dsh-resource://');
})());
check('client.js has no hardcoded local path', !/[A-Za-z]:\\|C:\/Users|\/Users\//.test(client));
check('client.js inlines CSS (no external stylesheet)', !/\.css['"]\s*\)/.test(client) && client.includes('style.textContent'));

const pkg = JSON.parse(readFileSync(root + 'package.json', 'utf8'));
check('manifest declares dsh.bundle.patch', typeof pkg.dsh?.bundle?.patch === 'string' && pkg.dsh.bundle.patch.length > 0);
check('patch file exists', readFileSync(root + 'cordis.patch.yml', 'utf8').includes('dsh-document-view'));
check('no engines.dsh hard constraint', !('dsh' in (pkg.engines || {})));
check('exports locale + icon', !!pkg.exports['./locale/*.json'] && !!pkg.exports['./icon']);

for (const f of ['locale/en.json', 'locale/zh.json']) {
  const meta = JSON.parse(readFileSync(root + f, 'utf8')).meta;
  check(`${f} has localized title/description/detail`, !!(meta.title && meta.description && meta.detail));
  const detailPath = root + meta.detail;
  const body = readFileSync(detailPath, 'utf8');
  const img = body.match(/!\[[^\]]*\]\(([^)]+)\)/);
  check(`${f} detail image exists`, !!img && !!readFileSync(root + 'docs/' + img[1]));
}

console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
