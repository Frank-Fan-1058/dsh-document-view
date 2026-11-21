// Lightweight release verification: model unit checks + artifact integrity.
// Run: node scripts/verify.mjs
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { CollaborationState, solveColumns, isDocument } from '../src/model.mjs';
import { AnnotationBook, clipQuote, decodeFilePath, formatAnnotationPrompt, locateChangedSpan, locateQuoteLoose, normalizeQuote, relativeToWorkspace } from '../src/annotations.mjs';

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
state.setAuto(true);
state.session('s1').enabled = true;
state.session('s1').ratio = 0.5;
state.dirty.add('s1');
state.save();
const restored = new CollaborationState(store);
check('auto mode persists', restored.auto === true);
check('per-session toggle persists', restored.session('s1').enabled === true);
check('per-session ratio persists', restored.session('s1').ratio === 0.5);
const corrupted = new CollaborationState({ getItem: () => '{not json', setItem() {} });
check('corrupted storage does not throw', corrupted.auto === false);
const sharedStore = memoryStorage();
const windowA = new CollaborationState(sharedStore);
const windowB = new CollaborationState(sharedStore);
windowA.session('s1').enabled = true; windowA.dirty.add('s1'); windowA.save();
windowB.reload();
check('layout merge sees another window session', windowB.session('s1').enabled === true);
windowB.session('s2').enabled = true; windowB.dirty.add('s2'); windowB.save();
windowA.reload();
check('layout merge keeps both windows sessions', windowA.session('s1').enabled === true && windowA.session('s2').enabled === true);
windowA.setAuto(true); windowB.reload();
check('layout merge keeps the auto flag', windowB.auto === true);
const dragStore = memoryStorage();
const dragging = new CollaborationState(dragStore);
dragging.setRatio('s1', 0.5, false);
dragging.save();
const afterDrag = new CollaborationState(dragStore);
check('ratio committed on drag end', afterDrag.session('s1').ratio === 0.5);

console.log('== annotations ==');
check('decode session file address', decodeFilePath('dsh-resource://file/session/s1/docs/%E6%B5%8B%E8%AF%95.docx') === 'docs/测试.docx');
check('decode absolute file address', decodeFilePath('dsh-resource://file/absolute/D:/docs/a.docx') === 'D:/docs/a.docx');
check('decode rejects other addresses', decodeFilePath('https://example.com/a.docx') === '');
check('decode rejects an empty session tail', decodeFilePath('dsh-resource://file/session/s1') === '');
check('decode tolerates a bad percent escape', decodeFilePath('dsh-resource://file/absolute/%E0%A4%A') === '');
check('normalizeQuote collapses whitespace', normalizeQuote('  a \n b ') === 'a b');
check('clipQuote truncates with an ellipsis', clipQuote('abcdef', 3) === 'abc…');
check('relative path inside workspace', relativeToWorkspace('C:\\ws\\docs\\a.docx', 'C:\\ws') === 'docs\\a.docx');
check('relative path keeps POSIX separators', relativeToWorkspace('/ws/docs/a.docx', '/ws') === 'docs/a.docx');
check('path outside workspace stays absolute', relativeToWorkspace('D:\\other\\a.docx', 'C:\\ws') === 'D:\\other\\a.docx');
function memoryStorage(seed = {}) {
  const data = { ...seed };
  return {
    _data: data,
    get length() { return Object.keys(data).length; },
    key(index) { return Object.keys(data)[index] ?? null; },
    getItem(key) { return Object.hasOwn(data, key) ? data[key] : null; },
    setItem(key, value) { data[key] = String(value); },
    removeItem(key) { delete data[key]; },
  };
}
const annotationStore = memoryStorage();
const book = new AnnotationBook(annotationStore);
const noted = book.add('docs/a.docx', {
  page: 2, type: 'comment', quote: '原文   有空格', note: '把口径改成 2026 年',
  rects: [{ x: 0.1, y: 0.2, w: 0.3, h: 0.02 }], prefix: '前文', suffix: '后文',
});
check('quote whitespace is normalized', noted.quote === '原文 有空格');
check('annotation is stored per file', book.count('docs/a.docx') === 1);
check('annotation uses one key per record', Object.keys(annotationStore._data).filter(key => key.startsWith('dsh.document-view.annotations.v2/')).length === 1);
book.markSent('docs/a.docx', [noted.id]);
check('sent marks are tracked', book.items('docs/a.docx')[0].status === 'sent');
const restoredBook = new AnnotationBook(annotationStore);
check('annotations persist', restoredBook.count('docs/a.docx') === 1 && restoredBook.items('docs/a.docx')[0].status === 'sent');
const reopened = restoredBook.update('docs/a.docx', noted.id, { note: '改成 2027 年' });
check('editing a sent annotation reopens it', reopened.status === 'open' && reopened.note === '改成 2027 年');
const legacyStore = memoryStorage({
  'dsh.document-view.annotations.v1': JSON.stringify({
    files: { 'legacy.docx': { items: [{ id: 'legacy1', page: 1, type: 'comment', quote: '旧批注', note: '迁移' }] } },
  }),
});
const migrated = new AnnotationBook(legacyStore);
check('legacy annotations migrate to per-record keys', migrated.count('legacy.docx') === 1 && !Object.hasOwn(legacyStore._data, 'dsh.document-view.annotations.v1'));
const beforeRemote = book.count('docs/a.docx');
book.applyStorageEvent('dsh.document-view.annotations.v2/' + encodeURIComponent('docs/a.docx') + '/remote1', JSON.stringify({ id: 'remote1', page: 1, type: 'comment', quote: '远程批注', note: '', createdAt: Date.now() }));
check('storage event adds a remote annotation', book.count('docs/a.docx') === beforeRemote + 1);
const sharedBookStore = memoryStorage();
const firstWindow = new AnnotationBook(sharedBookStore);
const secondWindow = new AnnotationBook(sharedBookStore);
const sharedItem = firstWindow.add('shared.docx', { page: 1, type: 'comment', quote: '共享', note: 'A' });
secondWindow.reload();
check('second window sees the first window annotation', secondWindow.count('shared.docx') === 1);
const sharedKey = Object.keys(sharedBookStore._data).find(key => key.startsWith('dsh.document-view.annotations.v2/'));
const edited = JSON.parse(sharedBookStore._data[sharedKey]);
edited.note = 'B 改的';
firstWindow.applyStorageEvent(sharedKey, JSON.stringify(edited));
check('storage event updates the other window', firstWindow.items('shared.docx')[0].note === 'B 改的');
firstWindow.applyStorageEvent(sharedKey, null);
check('storage event delete removes the mark', firstWindow.count('shared.docx') === 0);
const prompt = formatAnnotationPrompt('docs/a.docx', [
  { page: 2, type: 'comment', quote: '原文', note: '改成 2026 年', prefix: '前文', suffix: '后文' },
  { page: 3, type: 'delete', quote: '删这段', note: '' },
]);
check('prompt names file and count', prompt.includes('`docs/a.docx`') && prompt.includes('共 2 条'));
check('prompt keeps page and quote', prompt.includes('第 2 页 · 修改') && prompt.includes('「原文」'));
check('delete gets default instruction', prompt.includes('删掉这段文字'));
check('prompt labels target apart from context',
  prompt.includes('- 目标（只替换「」内的字符）：「原文」') &&
  prompt.includes('- 前文（仅定位，不要改）：…前文') &&
  prompt.includes('- 后文（仅定位，不要改）：后文…') &&
  prompt.includes('- 目标（只删「」内的字符）：「删这段」'));
check('prompt never clips the target', (() => {
  const long = '长'.repeat(300);
  const out = formatAnnotationPrompt('a.docx', [{ page: 1, type: 'delete', quote: long, note: '', prefix: '前', suffix: '后' }]);
  return out.includes(`「${long}」`) && out.includes('前文（仅定位，不要改）：…前');
})());
check('prompt states the punctuation rule for deletes', prompt.includes('多余的标点'));
check('prompt forbids touching context text', prompt.includes('一个字都不要改'));

console.log('== changed span ==');
{
  // A delete leaves the two anchors apart by the whitespace the PDF layer puts
  // between them, and the comma that used to start the next sentence is gone.
  const seam = locateChangedSpan(
    '日内将款项一次性全额支付至甲方指定账户。价格适用 贵公司不得将酒店提供的优惠价格',
    '日内将款项一次性全额支付至甲方指定账户。价格适用',
    '，贵公司不得将酒店提供的优惠价格',
    '本协议内的优惠价格仅限于贵公司内部使用',
  );
  check('locates the seam left by a deletion', Boolean(seam) && seam.to - seam.from === 1);
  const joined = locateChangedSpan(
    '价格适用贵公司不得将酒店提供的优惠价格',
    '价格适用',
    '，贵公司不得将酒店提供的优惠价格',
    '本协议内的优惠价格仅限于贵公司内部使用',
  );
  check('locates a deletion that left the anchors adjacent', Boolean(joined) && joined.to === joined.from);
  const replaced = locateChangedSpan(
    '如发现贵公司有以上情况发生，酒店将立即终止双方合作，收回已售房间并退预付款，并保留追究因此',
    '如发现贵公司有以上情况发生，酒店将立即终止双方合作，',
    '，并保留追究因此',
    '收回已售房间并不退预付款',
  );
  check('locates the replacement text', Boolean(replaced) &&
    '如发现贵公司有以上情况发生，酒店将立即终止双方合作，收回已售房间并退预付款，并保留追究因此'.slice(replaced.from, replaced.to) === '收回已售房间并退预付款');
  check('refuses a gap that still holds the original quote',
    locateChangedSpan('甲，原文，乙', '甲，', '，乙', '原文') === null);
  check('refuses without both anchors', locateChangedSpan('甲，新文', '甲，', '', '原文') === null);
}

console.log('== anchors ==');
{
  // The text layer drops the space the selection carried; without this the mark
  // would be stored without anchors and could never be re-found after an edit.
  const spaced = locateQuoteLoose('1、此协议将在酒店收到签署并回传的协议后7天内起生效。', '7 天');
  check('loose match survives a spacing difference', Boolean(spaced) &&
    '1、此协议将在酒店收到签署并回传的协议后7天内起生效。'.slice(spaced.from, spaced.to) === '7天');
  check('loose match gives up on a real mismatch',
    locateQuoteLoose('1、此协议将在酒店收到签署并回传的协议后7天内起生效。', '9 天') === null);
}

console.log('== artifact ==');
const client = readFileSync(root + 'client.js', 'utf8');
try {
  execFileSync(process.execPath, ['--check', root + 'client.js'], { stdio: 'ignore' });
  check('client.js parses as JavaScript', true);
} catch {
  check('client.js parses as JavaScript', false);
}
check('client.js registers module loader id', client.includes("id: 'dsh-document-view'"));
check('client.js contains host contract guard', client.includes('hostContractIntact'));
check('client.js includes annotation prompt formatter', client.includes('formatAnnotationPrompt'));
check('client.js includes annotation marks', client.includes('fdc-anno-mark') && client.includes('AnnotationBook'));
check('client.js highlights the ledger span', client.includes('fdc-anno-mark.is-done') && client.includes('annotationAnchorRects'));
check('client.js marks a landed edit differently', client.includes('is-done') && client.includes('已改动（原批注'));
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
