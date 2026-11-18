// Independent document collaboration client; no UI patch bundle included.
window.__ModuleLoader__.load({
  id: 'dsh-document-view',
  factory: (require) => {
const STORAGE_KEY = 'dsh.document-view.v1';
const clampRatio = value => Number.isFinite(value) ? Math.max(0.2, Math.min(0.65, value)) : 0.35;

function isDocument(address) {
  if (typeof address !== 'string' || !address) return false;
  if (address.startsWith('dsh-resource://file/')) return true;
  // HTML previews may open under a viewer address that is not a session file
  // address (absolute path, http URL, blob URL, ...). Recognize them by the
  // .html/.htm extension anywhere in the address so the split layout applies.
  const clean = address.split(/[?#]/, 1)[0];
  return /\.(?:html|htm)$/i.test(clean) || /\.(?:html|htm)[\\/]/i.test(clean);
}

function solveColumns(width, sidebar, ratio) {
  width = Math.max(0, Number.isFinite(width) ? width : 0);
  sidebar = Math.max(0, Math.min(width, Number.isFinite(sidebar) ? sidebar : 0));
  const available = width - sidebar;
  if (available < 760) return { sidebar, document: available, chat: 0, narrow: true };
  const chat = Math.round(Math.max(400, Math.min(available - 360, available * clampRatio(ratio))));
  return { sidebar, document: available - chat, chat, narrow: false };
}

class CollaborationState {
  constructor(storage) {
    this.storage = storage;
    this.auto = false;
    this.sessions = Object.create(null);
    this.counts = new Map();
    try {
      const saved = JSON.parse(storage?.getItem(STORAGE_KEY) || '{}');
      this.auto = saved.auto === true;
      for (const [id, value] of Object.entries(saved.sessions || {})) {
        if (!value || typeof value !== 'object') continue;
        this.sessions[id] = {
          enabled: value.enabled === true,
          ratio: clampRatio(value.ratio),
          suppressed: typeof value.suppressed === 'string' ? value.suppressed : ''
        };
      }
    } catch { /* Storage corruption must never block the shell. */ }
  }
  session(id) {
    return this.sessions[id] ||= { enabled: false, ratio: 0.35, suppressed: '' };
  }
  save() {
    try { this.storage?.setItem(STORAGE_KEY, JSON.stringify({ auto: this.auto, sessions: this.sessions })); }
    catch { /* Private browsing and quota errors keep in-memory behavior working. */ }
  }
  toggle(id, address) {
    const session = this.session(id);
    session.enabled = !session.enabled;
    session.suppressed = session.enabled ? '' : address || '';
    this.save();
  }
  observe(id, address, userGesture) {
    const session = this.session(id);
    if (this.auto && userGesture && isDocument(address) && session.suppressed !== address && !session.enabled) {
      session.enabled = true;
      session.suppressed = '';
      this.save();
    }
  }
  observeCount(id, count) {
    const previous = this.counts.get(id);
    this.counts.set(id, count);
    if (previous > 0 && count === 0) {
      this.session(id).enabled = false;
      this.save();
    }
  }
  setAuto(value) { this.auto = value === true; this.save(); }
  setRatio(id, value, persist = true) {
    const session = this.session(id), ratio = clampRatio(value);
    if (session.ratio === ratio) return;
    session.ratio = ratio;
    if (persist) this.save();
  }
}

// Mounted components stay in their original React ownership tree. Only the shell's
// grid geometry changes; no node is moved, cloned, or remounted by this module.

// Fail closed: this plugin depends on internal host services and DOM data
// attributes that are not a public API. If a future DSH release changes them,
// disable the plugin silently instead of throwing inside the module loader,
// so the host page keeps working. See docs/COMPATIBILITY.md for the checklist.
function hostContractIntact(scoped) {
  const slots = scoped?.slots;
  const sidebar = scoped?.sidebarRight;
  if (typeof scoped?.effect !== 'function') return false;
  if (!slots || typeof slots.inject !== 'function' || typeof slots.register !== 'function') return false;
  if (!sidebar || typeof sidebar.isExpanded !== 'function') return false;
  for (const store of [sidebar.mounted, sidebar.openTabs]) {
    if (!store || typeof store.getSnapshot !== 'function' || typeof store.subscribe !== 'function') return false;
  }
  return true;
}

function installDocumentCollaboration(ctx, require) {
  if (typeof window === 'undefined') return;
  ctx.inject(['slots', 'sidebarRight'], scoped => {
    if (!hostContractIntact(scoped)) {
      console.warn('[dsh-document-view] client host contract changed; plugin disabled safely. See docs/COMPATIBILITY.md');
      return;
    }
    scoped.effect(() => {
      const React = require('react');
      const { createPortal } = require('react-dom');
      const sidebar = scoped.sidebarRight;
      let storage;
      try { storage = window.localStorage; } catch {}
      const model = new CollaborationState(storage);
      const listeners = new Set();
      let revision = 0, fingerprint = '', raf = 0, disposed = false;
      let frame, right, center, observedFrame, observedPanel, drag;
      let pendingIntent, intentTimer;
      const headerMarks = new Map();
      const workbooks = new Map();
      let lastAddress = '', lastSession = '';
      let narrowView = 'document';
      let divider, compact, focusView;
      const focusMarks = new Map();
      const style = document.createElement('style');
      style.dataset.pluginCss = 'dsh-document-view/layout.css';
      style.textContent = `
        [data-fdc-active] { grid-template-columns:var(--fdc-columns) !important; transition:none !important; }
        [data-fdc-active] > [data-fdc-center] { grid-column:3; grid-row:1; min-width:0; border-radius:0 !important; }
        [data-fdc-active] > [data-rightbar-col] { grid-column:2; grid-row:1; position:relative; min-width:0; overflow:hidden; }
        [data-fdc-active] [data-sidebar-right-panel] { left:0 !important; right:auto !important; top:0 !important; bottom:0 !important; width:var(--fdc-doc-w,100%) !important; max-width:var(--fdc-doc-w,100%) !important; --dsh-sidebar-width:var(--fdc-doc-w,100%) !important; }
        [data-fdc-active] iframe[data-html-preview], [data-fdc-active] iframe[data-fdc-html] { width:100% !important; height:100% !important; border:0 !important; display:block !important; background:var(--dsw-alias-bg-base,#fff); }
        [data-fdc-active] [data-rightbar-col] :has(> iframe[data-html-preview]) { width:100%; height:100%; }
        [data-fdc-active] > [data-side="rightbar"] { display:none !important; }
        [data-fdc-active] [data-fdc-center] { --dsh-composer-side-clearance:12px; --dsh-composer-card-max-width:100%; border-left:1px solid var(--dsw-alias-border-l3,#ddd); }
        [data-fdc-divider] { position:absolute; top:var(--dsh-windows-titlebar-height,0px); bottom:0; width:8px; margin-left:-4px; z-index:30; cursor:col-resize; touch-action:none; }
        [data-fdc-divider]:hover,[data-fdc-divider]:focus-visible { background:color-mix(in srgb,var(--dsw-alias-button-info-fill,#2563eb) 35%,transparent); outline:none; }
        [data-fdc-active][data-fdc-narrow] > [data-fdc-center], [data-fdc-active][data-fdc-narrow] > [data-rightbar-col] { grid-column:2; padding-top:36px; }
        [data-fdc-active][data-fdc-narrow="document"] > [data-fdc-center], [data-fdc-active][data-fdc-narrow="chat"] > [data-rightbar-col] { visibility:hidden; pointer-events:none; }
        [data-fdc-active][data-fdc-narrow] [data-sidebar-right-panel] { top:36px !important; }
        /* Reuse the host's version watcher and tab-local page/zoom state. Never
           remount a document or refresh a dirty editor on our own timer. */
        [data-fdc-active] [data-rightbar-col] span[hidden]:has([data-textpreview-tool="auto-refresh"]) { display:inline-flex !important; }
        [data-fdc-active] [data-rightbar-col] [data-textpreview-tool="auto-refresh"] { width:auto; min-width:24px; padding:3px 6px; gap:4px; white-space:nowrap; }
        [data-fdc-active] [data-rightbar-col] [data-textpreview-tool="auto-refresh"]::after { content:"已暂停"; font-size:11px; }
        [data-fdc-active] [data-rightbar-col] [data-textpreview-tool="auto-refresh"][aria-pressed="true"]::after { content:"自动更新"; }
        .fdc-control { display:inline-flex; flex:none; align-items:center; gap:0; min-width:0; height:28px; font-size:12px; line-height:22px; border-radius:6px; background:transparent; color:var(--dsw-alias-label-tertiary,#666); }
        .fdc-control button { display:inline-flex; flex:none; align-items:center; justify-content:center; gap:5px; height:28px; box-sizing:border-box; color:inherit; background:transparent; border:0; border-radius:inherit; padding:3px 7px; font:inherit; cursor:pointer; white-space:nowrap; }
        .fdc-control:has(button[aria-pressed="true"]) { background:var(--dsw-alias-fill-tsp-secondary,#f0f1f3); }
        .fdc-control button[aria-pressed="true"] { color:var(--dsw-alias-state-business-primary,#2563eb); }
        .fdc-control button:hover { color:var(--dsw-alias-label-primary,#333); }
        .fdc-control button:focus-visible,[data-fdc-compact] button:focus-visible { outline:2px solid var(--dsw-alias-state-business-primary,#2563eb); outline-offset:2px; }
        .fdc-control .fdc-settings { width:20px; padding:0; }
        .fdc-panel { position:fixed; z-index:1000; box-sizing:border-box; width:min(260px,calc(100vw - 16px)); padding:12px; border:1px solid var(--dsw-alias-border-l3,#ddd); border-radius:var(--dsw-radius-md,8px); background:var(--dsw-alias-bg-base,#fff); box-shadow:0 4px 18px #0002; color:var(--dsw-alias-label-primary,#333); font-size:12px; }
        .fdc-panel { max-height:calc(100vh - 16px); overflow-y:auto; }
        .fdc-presets { display:flex; gap:4px; margin-top:10px; flex-wrap:wrap; }
        .fdc-presets button { cursor:pointer; border:1px solid var(--dsw-alias-border-l3,#ddd); border-radius:4px; padding:4px 6px; font:inherit; color:inherit; background:transparent; }
        .fdc-presets button[aria-pressed="true"] { color:var(--dsw-alias-state-business-primary,#2563eb); background:var(--dsw-alias-fill-tsp-secondary,#f0f1f3); }
        .fdc-panel label { display:flex; align-items:flex-start; gap:6px; line-height:1.6; cursor:pointer; }
        .fdc-panel p { color:var(--dsw-alias-label-secondary,#666); margin:8px 0 0; line-height:1.6; }
        [data-fdc-active] [data-fdc-header] { padding-inline:12px; }
        [data-fdc-active] [data-fdc-title-row] { display:grid; grid-template-columns:minmax(0,1fr) auto auto; gap:6px 8px; padding-inline-start:0; }
        [data-fdc-active] [data-fdc-title-cluster] { display:contents; }
        [data-fdc-active] [data-fdc-title-cluster] > nav { grid-column:1; grid-row:1; min-width:0; }
        [data-fdc-active] [data-conversation-header-corner] { grid-column:3; grid-row:1; margin:0; }
        [data-fdc-active] [data-fdc-header-actions] { grid-column:1/-1; grid-row:2; min-width:0; flex-wrap:wrap; gap:6px; }
        [data-fdc-active] [data-fdc-header-utilities] { grid-column:2; grid-row:1; min-width:0; margin:0; gap:6px; }
        [data-fdc-active] [data-conversation-tabs] { gap:18px; padding-left:0; overflow-x:auto; overscroll-behavior-x:contain; scrollbar-width:thin; }
        [data-fdc-active] [data-conversation-tabs] > button { flex:none; white-space:nowrap; }
        [data-fdc-compact] button { color:var(--dsw-alias-label-primary,#333); background:transparent; border:0; border-radius:var(--dsw-radius-xs,4px); padding:4px 7px; font:inherit; cursor:pointer; white-space:nowrap; }
        [data-fdc-compact] button[aria-pressed="true"] { color:var(--dsw-alias-state-business-primary,#2563eb); background:var(--dsw-alias-fill-tsp-secondary,#f0f1f3); }
        [data-fdc-compact] { position:absolute; top:var(--dsh-windows-titlebar-height,0px); right:8px; height:32px; z-index:35; display:flex; align-items:center; gap:4px; font-size:12px; background:var(--dsw-alias-bg-base,#fff); }
        [data-fdc-compact][hidden],[data-fdc-divider][hidden] { display:none; }
      `;
      document.head.appendChild(style);
      const notify = value => {
        if (fingerprint === value) return;
        fingerprint = value;
        revision++;
        listeners.forEach(listener => listener());
      };
      const schedule = () => {
        if (!disposed && !raf) raf = requestAnimationFrame(() => { raf = 0; sync(); });
      };
      const currentId = () => sidebar.mounted.getSnapshot();
      const active = () => { try { return sidebar.active(); } catch { return undefined; } };
      function clearIntent() {
        pendingIntent = undefined;
        clearTimeout(intentTimer);
      }
      function commitDrag() {
        if (drag?.changed) model.save();
        drag = undefined;
      }
      // The host's built-in HTML preview is a DOMPurify-sanitized document with
      // CSP `script-src 'none'` and an empty sandbox, so any single-file page
      // that lays itself out with inline JS (a deck calling fit()) never runs
      // and stays clipped at its intrinsic size. Render the ORIGINAL bytes in an
      // iframe of our own instead: sandbox="allow-scripts" only, so scripts run
      // while the frame keeps an opaque origin (no parent DOM, no cookies, no
      // storage). If the fetch fails we simply keep the host preview.
      const previewBlobs = new Map();
      function unlockHtmlPreview(address) {
        const host = document.querySelector('[data-rightbar-col] iframe[data-html-preview]:not([data-fdc-html])');
        if (!host || host.getAttribute('sandbox') !== '') return;
        const parent = host.parentElement;
        if (!parent || typeof address !== 'string' || !address.startsWith('dsh-resource://')) return;
        let mine = parent.querySelector('iframe[data-fdc-html]');
        if (!mine) {
          mine = document.createElement('iframe');
          mine.setAttribute('data-fdc-html', '');
          mine.setAttribute('data-html-preview', '');
          mine.setAttribute('sandbox', 'allow-scripts');
          mine.setAttribute('title', host.getAttribute('title') || 'HTML 预览');
          if (host.className) mine.className = host.className;
          parent.appendChild(mine);
        }
        if (mine.dataset.address === address) { host.style.display = 'none'; return; }
        mine.dataset.address = address;
        host.style.display = 'none';
        fetch(address, { cache: 'no-store' }).then(response => {
          if (!response.ok) throw new Error('preview fetch ' + response.status);
          return response.blob();
        }).then(blob => {
          if (mine.dataset.address !== address) return;
          const previous = previewBlobs.get(mine);
          const url = URL.createObjectURL(blob.type ? blob : new Blob([blob], { type: 'text/html' }));
          previewBlobs.set(mine, url);
          mine.src = url;
          if (previous) URL.revokeObjectURL(previous);
        }).catch(() => {
          // fetch may be refused for a custom scheme; navigating the frame to the
          // same local address still bypasses the sanitized copy. If that fails
          // too the user simply keeps the host preview.
          if (mine.dataset.address === address && mine.src !== address) mine.src = address;
        });
      }
      function consumeIntent(id, address) {
        if (!pendingIntent) return;
        const intent = pendingIntent;
        if (intent.id !== id || Date.now() >= intent.expires || !model.auto) { clearIntent(); return; }
        if (!sidebar.isExpanded() || !isDocument(address)) return;
        let matches = intent.requested === address;
        const prefix = `dsh-resource://file/session/${id}/`;
        if (!matches && intent.path && address.startsWith(prefix)) {
          try {
            const viewed = decodeURIComponent(address.slice(prefix.length)).replace(/\\/g,'/');
            const clicked = intent.path.replace(/\\/g,'/');
            matches = clicked === viewed || (!viewed.startsWith('/') && !/^[A-Za-z]:/.test(viewed) && clicked.endsWith(`/${viewed}`));
          } catch {}
        }
        if (!matches) return;
        clearIntent();
        model.observe(id, address, true);
      }
      function setLayout(id, ratio) {
        if (!id || currentId() !== id) return;
        commitDrag();
        model.setRatio(id, ratio);
        schedule();
      }
      function focusNarrowPanel(panel) {
        const chat = focusView === 'chat';
        const region = chat ? center : panel;
        focusView = undefined;
        if (!region) return;
        const target = [...region.querySelectorAll(chat ? 'textarea,[contenteditable="true"]' : 'iframe,[role="document"],[tabindex="0"]')].find(node =>
          !node.disabled && node.getBoundingClientRect().width > 0 && getComputedStyle(node).visibility !== 'hidden');
        if (target) target.focus({preventScroll:true});
        else {
          if (!focusMarks.has(region)) focusMarks.set(region, region.getAttribute('tabindex'));
          region.setAttribute('tabindex','-1'); region.focus({preventScroll:true});
        }
      }
      function toggle(id) {
        clearIntent();
        if (!id || id !== currentId()) return;
        const tab = active();
        model.toggle(id, tab?.contentId);
        if (!model.session(id).enabled) {
          right?.querySelector('[data-sidebar-right-mode="push"]')?.click();
        }
        if (model.session(id).enabled && !sidebar.isExpanded()) {
          try {
            if (isDocument(tab?.contentId) || tab?.kind === 'files') sidebar.toggleExpanded();
            else sidebar.openTab('files');
          } catch { /* The arriving session may not have adopted its sidebar yet. */ }
        }
        narrowView = 'document';
        schedule();
      }
      function Controls({ collaborationSessionId: id, documentSeat }) {
        React.useSyncExternalStore(listener => { listeners.add(listener); return () => listeners.delete(listener); }, () => revision);
        const [settingsOpen, setSettingsOpen] = React.useState(false);
        const anchor = React.useRef(null), popover = React.useRef(null);
        React.useLayoutEffect(() => {
          if (!settingsOpen) return;
          const position = () => {
            const bounds = anchor.current?.getBoundingClientRect(), panel = popover.current;
            if (!bounds || !panel) return;
            panel.style.left = `${Math.max(8, Math.min(window.innerWidth - panel.offsetWidth - 8, bounds.right - panel.offsetWidth))}px`;
            panel.style.top = `${Math.max(8, Math.min(window.innerHeight - panel.offsetHeight - 8, bounds.bottom + 6))}px`;
          };
          const outside = event => {
            if (!anchor.current?.contains(event.target) && !popover.current?.contains(event.target)) setSettingsOpen(false);
          };
          const escape = event => {
            if (event.key === 'Escape') { event.stopPropagation(); setSettingsOpen(false); anchor.current?.focus(); }
          };
          position();
          popover.current?.querySelector('input,button')?.focus({preventScroll:true});
          window.addEventListener('resize',position); document.addEventListener('scroll',position,true);
          document.addEventListener('pointerdown',outside,true); document.addEventListener('keydown',escape,true);
          return () => {
            window.removeEventListener('resize',position); document.removeEventListener('scroll',position,true);
            document.removeEventListener('pointerdown',outside,true); document.removeEventListener('keydown',escape,true);
          };
        }, [settingsOpen]);
        React.useEffect(() => { setSettingsOpen(false); }, [id]);
        if (!id) return null;
        const state = model.session(id);
        const h = React.createElement;
        if (documentSeat) return state.enabled ? h('div', {className:'fdc-control'}, h('button', {
          type:'button', 'aria-label':'退出文档协作', onClick:() => toggle(id)
        }, '退出协作')) : null;
        const icon = h('svg', {width:14,height:14,viewBox:'0 0 16 16',fill:'none','aria-hidden':true},
          h('rect',{x:2,y:2,width:12,height:12,rx:2,stroke:'currentColor'}),h('path',{d:'M9 2v12',stroke:'currentColor'}));
        return h('div', { className:'fdc-control' },
          h('button', { type:'button', 'aria-label':'文档协作模式', 'aria-pressed':state.enabled,
            title:state.enabled ? '退出文档协作，恢复普通会话布局' : '文档放在中间，对话放在右侧', onClick:() => toggle(id) }, icon, '文档协作'),
          h('button', { type:'button', className:'fdc-settings', ref:anchor, 'aria-label':'文档协作设置', 'aria-haspopup':'dialog', 'aria-expanded':settingsOpen,
            onClick:() => setSettingsOpen(value => !value) }, h('svg',{width:12,height:12,viewBox:'0 0 16 16',fill:'none','aria-hidden':true},h('path',{d:'m4 6 4 4 4-4',stroke:'currentColor',strokeWidth:1.5}))),
          settingsOpen && createPortal(h('div', {className:'fdc-panel',ref:popover,role:'dialog','aria-label':'文档协作选项'}, h('label', null, h('input', { type:'checkbox', checked:model.auto,
              onChange:event => { model.setAuto(event.target.checked); notify(`${fingerprint}:auto:${model.auto}`); schedule(); } }), '查看文档时自动进入协作模式'),
              h('div', {className:'fdc-presets',role:'group','aria-label':'分栏布局'},
                ...[['文档优先',0.35],['均衡',0.5],['对话优先',0.65]].map(([label,ratio]) => h('button', {
                  key:label,type:'button','aria-pressed':Math.abs(state.ratio-ratio)<0.001,
                  onClick:() => setLayout(id,ratio)
                },label))),
              h('p', null, '拖动分隔线调整宽度，双击或按 Home 恢复默认。'),
              h('p', null, '默认关闭。点击文件或切换文件标签时生效；AI 后台读写文件不会切换布局。手动退出后，同一文件不会反复开启。')),document.body));
      }
      function restoreFocusMarks() {
        for (const [node,value] of focusMarks) {
          if (value === null) node.removeAttribute('tabindex');
          else node.setAttribute('tabindex',value);
        }
        focusMarks.clear();
      }
      function removeGeometry() {
        restoreFocusMarks();
        if (frame) {
          frame.removeAttribute('data-fdc-active');
          frame.removeAttribute('data-fdc-narrow');
          frame.style.removeProperty('--fdc-columns');
        }
        if (divider) divider.hidden = true;
        if (compact) compact.hidden = true;
        commitDrag(); focusView = undefined;
      }
      function markHeader() {
        const actions = center?.querySelector('[data-slot="conversation.session.header.actions"]')?.parentElement;
        const cluster = actions?.parentElement, row = cluster?.parentElement;
        if (!cluster?.querySelector('nav') || !row?.querySelector('[data-conversation-header-corner]')) return;
        const elements = [[actions,'data-fdc-header-actions'],[cluster,'data-fdc-title-cluster'],[row,'data-fdc-title-row'],[row.parentElement,'data-fdc-header']];
        const utilities = row.querySelector('[data-slot="conversation.session.header.utilities"]')?.parentElement;
        if (utilities) elements.push([utilities,'data-fdc-header-utilities']);
        for (const [node, attribute] of elements) { node.setAttribute(attribute,''); headerMarks.set(node,attribute); }
        for (const [node, attribute] of headerMarks) {
          if (!node.isConnected) { node.removeAttribute(attribute); headerMarks.delete(node); }
        }
      }
      const workbookZoom = node => parseFloat(node.querySelector('.fortune-zoom-ratio-current')?.textContent || '') / 100;
      function zoomStep(node, goal) {
        const current = workbookZoom(node);
        if (!Number.isFinite(current) || Math.abs(current - goal) < 0.05) return false;
        // Native controls update both the canvas and the displayed percentage.
        // One click per animation frame avoids batching repeated stale ratios.
        const buttons = node.querySelectorAll('.fortune-zoom-container .fortune-zoom-button[role="button"]');
        const button = current < goal ? buttons[1] : buttons[0];
        if (!button) return false;
        button.click();
        return true;
      }
      function syncWorkbook(panel, enabled, fullscreen, projectedWidth) {
        for (const [node] of workbooks) if (!node.isConnected) workbooks.delete(node);
        const node = Array.from(panel?.querySelectorAll('[data-excel-preview]') || []).find(element =>
          !element.closest('[hidden]') && element.getBoundingClientRect().width > 0 && getComputedStyle(element).visibility !== 'hidden');
        if (!node) return;
        const width = node.getBoundingClientRect().width, zoom = workbookZoom(node);
        if (!Number.isFinite(zoom) || width < 1) return;
        let record = workbooks.get(node);
        if (!record) {
          record = { mode:'push', width:fullscreen ? projectedWidth : width, zoom, manual:false };
          workbooks.set(node,record);
        }
        if (record.switching) return;
        if (enabled && fullscreen) {
          if (record.mode !== 'fullscreen') { record.mode = 'fullscreen'; record.manual = false; }
          if (!record.manual) {
            const goal = Math.max(0.1, Math.min(4, Math.round(record.zoom * width / Math.max(1,record.width) * 10) / 10));
            if (zoomStep(node,goal)) schedule();
          }
        } else {
          if (record.mode === 'fullscreen') record.mode = record.manual ? 'push' : 'restoring';
          if (record.mode === 'restoring' && zoomStep(node,record.zoom)) { schedule(); return; }
          record.mode = 'push'; record.width = width; record.zoom = workbookZoom(node); record.manual = false;
        }
      }
      function manualZoom(event) {
        if (!event.isTrusted || !(event.target instanceof Element)) return;
        const keyboard = event.type === 'keydown' && (event.ctrlKey || event.metaKey) && ['+','=','-','0'].includes(event.key);
        const control = keyboard ? event.target : event.target.closest('.fortune-zoom-container');
        const node = control?.closest('[data-excel-preview]');
        const record = node && workbooks.get(node);
        if (record) { record.manual = true; if (record.mode === 'restoring') record.mode = 'push'; }
      }
      function sheetGesture(event) {
        if (!event.isTrusted || !(event.target instanceof Element)) return;
        const target = event.target.closest('.fortune-sheettab-container-c > *, .fortune-sheet-list-item');
        const node = target?.closest('[data-excel-preview]'), record = node && workbooks.get(node);
        if (!record || record.mode !== 'fullscreen') return;
        if (record.manual) { workbooks.delete(node); return; }
        event.preventDefault(); event.stopImmediatePropagation();
        if (record.switching) return;
        record.switching = true;
        let remaining = 40;
        const restore = () => {
          if (disposed || !node.isConnected || !target.isConnected) return;
          if (!record.manual && remaining-- && zoomStep(node,record.zoom)) { requestAnimationFrame(restore); return; }
          workbooks.delete(node);
          if (event.type === 'contextmenu') target.dispatchEvent(new MouseEvent('contextmenu', {bubbles:true,cancelable:true,clientX:event.clientX,clientY:event.clientY,button:2}));
          else target.click();
          schedule();
        };
        restore();
      }
      // Read the host's inline track, never our own overridden computed grid.
      // Measuring the sidebar here feeds the previous collaboration width back
      // into the next layout, preventing both collapse and native resizing.
      function sidebarWidth() {
        const track = frame?.style.gridTemplateColumns.match(/^\s*(\d+(?:\.\d+)?)px(?:\s|$)/);
        if (track) return Number(track[1]);
        if (frame?.hasAttribute('data-sidebar-collapsed')) return 0;
        return center?.previousElementSibling?.getBoundingClientRect().width || 0;
      }
      function markShell() {
        const column = document.querySelector('[data-rightbar-col]');
        const next = column?.parentElement;
        // The collapsed marker disappears when the panel opens. The owning
        // frame's explicit grid tracks remain present in both presentations.
        if (!next || !next.style.gridTemplateColumns) return false;
        if (frame !== next) {
          removeGeometry();
          center?.removeAttribute('data-fdc-center');
          divider?.remove(); compact?.remove();
          frame = next;
          frameObserver.disconnect(); nativeColumns = frame.style.gridTemplateColumns;
          frameObserver.observe(frame, {attributes:true,attributeFilter:['style']});
          right = column; center = right.previousElementSibling;
          if (!center) return false;
          center.setAttribute('data-fdc-center', '');
          divider = document.createElement('div');
          divider.dataset.fdcDivider = '';
          divider.setAttribute('role','separator'); divider.setAttribute('aria-label','调整文档与对话宽度');
          divider.title = '拖动调整宽度；双击或 Home 恢复默认';
          divider.addEventListener('dblclick', () => setLayout(currentId(),0.35));
          divider.setAttribute('aria-orientation','vertical'); divider.tabIndex = 0; divider.hidden = true;
          divider.addEventListener('pointerdown', event => {
            if (event.button !== 0 || !currentId()) return;
            event.preventDefault();
            commitDrag();
            drag = { id:currentId(), pointer:event.pointerId, changed:false };
            divider.setPointerCapture(event.pointerId);
          });
          divider.addEventListener('pointermove', event => {
            if (!drag || drag.pointer !== event.pointerId || drag.id !== currentId()) return;
            const rect = frame.getBoundingClientRect();
            const left = sidebarWidth();
            const previous = model.session(drag.id).ratio;
            model.setRatio(drag.id, (rect.right - event.clientX) / Math.max(1, rect.width - left), false);
            drag.changed ||= previous !== model.session(drag.id).ratio;
            schedule();
          });
          const release = commitDrag;
          divider.addEventListener('pointerup', release); divider.addEventListener('pointercancel', release); divider.addEventListener('lostpointercapture', release);
          divider.addEventListener('keydown', event => {
            const id = currentId();
            if (!id || !['ArrowLeft','ArrowRight','Home'].includes(event.key)) return;
            event.preventDefault();
            const width = frame.getBoundingClientRect().width, left = sidebarWidth();
            const geometry = solveColumns(width,left,model.session(id).ratio);
            const available = width-left;
            if (geometry.narrow || available <= 0) return;
            const ratio = geometry.chat/available;
            const minimum = Math.max(0.2,400/available), maximum = Math.min(0.65,1-360/available);
            setLayout(id,event.key === 'Home' ? 0.35 : Math.max(minimum,Math.min(maximum,ratio+(event.key === 'ArrowLeft' ? 0.02 : -0.02))));
            schedule();
          });
          compact = document.createElement('div'); compact.dataset.fdcCompact = ''; compact.hidden = true;
          for (const [label, view] of [['文档','document'],['对话','chat'],['退出协作','exit']]) {
            const button = document.createElement('button'); button.type = 'button'; button.textContent = label;
            button.dataset.view = view;
            button.addEventListener('click', () => {
              if (view === 'exit') toggle(currentId());
              else { narrowView = view; focusView = view; schedule(); }
            });
            compact.appendChild(button);
          }
          frame.append(divider, compact);
        }
        if (observedFrame !== frame) { resize.disconnect(); resize.observe(frame); observedFrame = frame; observedPanel = undefined; }
        markHeader();
        return true;
      }
      function sync() {
        if (disposed) return;
        const focused = document.activeElement;
        const id = currentId();
        if (drag && drag.id !== id) commitDrag();
        if (!id) { clearIntent(); removeGeometry(); notify('none'); return; }
        const tab = active();
        const address = tab?.contentId || '';
        const state = model.session(id);
        const inventory = sidebar.openTabs.getSnapshot();
        const htmlPreview = !!document.querySelector('[data-rightbar-col] iframe[data-html-preview],[data-sidebar-right-panel] iframe[data-html-preview]');
        const docs = inventory.filter(entry => entry.sessionId === id && isDocument(entry.contentId)).length + (htmlPreview ? 1 : 0);
        model.observeCount(id, docs);
        consumeIntent(id, address);
        const expanded = sidebar.isExpanded();
        const changed = id !== lastSession || address !== lastAddress;
        if (changed) narrowView = 'document';
        lastSession = id; lastAddress = address;
        const shellReady = markShell();
        const panel = right?.querySelector(`[data-sidebar-right-session="${CSS.escape(id)}"][data-sidebar-right-panel]`);
        if (observedPanel !== panel) {
          if (observedPanel) resize.unobserve(observedPanel);
          if (panel) resize.observe(panel);
          observedPanel = panel;
        }
        const width = frame?.getBoundingClientRect().width || 0;
        const left = sidebarWidth();
        const geometry = solveColumns(width, left, state.ratio);
        // On wide windows, a native fullscreen request is respected. On narrow
        // windows, native auto-fullscreen is adapted to the document/chat switch.
        const fullscreen = panel?.getAttribute('data-sidebar-right-panel') === 'fullscreen' && !geometry.narrow;
        const visible = shellReady && state.enabled && expanded && !fullscreen && (isDocument(address) || htmlPreview || tab?.kind === 'files');
        if (htmlPreview) unlockHtmlPreview(address);
        // Pin the right column's real width: the preview iframe must not be wider
        // than the visible center column, or a page that sizes itself from
        // window.innerWidth (deck fit()) scales for the wrong width and clips.
        if (right) right.style.setProperty('--fdc-doc-w', Math.max(1, Math.round(right.getBoundingClientRect().width)) + 'px');
        if (visible) {
          frame.setAttribute('data-fdc-active','');
          const columns = geometry.narrow ? `${left}px minmax(0,1fr) 0px` : `${left}px minmax(0,1fr) ${geometry.chat}px`;
          if (frame.style.getPropertyValue('--fdc-columns') !== columns) frame.style.setProperty('--fdc-columns', columns);
          if (geometry.narrow) frame.setAttribute('data-fdc-narrow', narrowView);
          else frame.removeAttribute('data-fdc-narrow');
          divider.hidden = geometry.narrow;
          divider.style.left = `${left + geometry.document}px`;
          const available = Math.max(1,width-left);
          const actual = Math.round(geometry.chat/available*100);
          divider.setAttribute('aria-valuenow',String(actual));
          divider.setAttribute('aria-valuemin',String(Math.round(Math.max(0.2,400/available)*100)));
          divider.setAttribute('aria-valuemax',String(Math.round(Math.min(0.65,1-360/available)*100)));
          divider.setAttribute('aria-valuetext',`对话 ${actual}%，文档 ${100-actual}%`);
          compact.hidden = !geometry.narrow;
          if (geometry.narrow && !focusView) {
            const hiddenRegion = narrowView === 'document' ? center : right;
            if (hiddenRegion?.contains(focused)) compact.querySelector(`[data-view="${narrowView}"]`)?.focus({preventScroll:true});
          }
          for (const button of compact.children) {
            const value=String(button.dataset.view === narrowView);
            if(button.getAttribute('aria-pressed')!==value) button.setAttribute('aria-pressed',value);
          }
        } else removeGeometry();
        if (visible && geometry.narrow && focusView) focusNarrowPanel(panel);
        else if (!geometry.narrow) focusView = undefined;
        syncWorkbook(panel, state.enabled, fullscreen, geometry.document);
        notify(JSON.stringify([id, state.enabled, model.auto, address, geometry.narrow, narrowView, visible, state.ratio]));
      }
      function viewGesture(event) {
        if (!event.isTrusted) return;
        const target = event.target instanceof Element ? event.target : document.activeElement;
        if (!target || target.closest('.fdc-control,[data-fdc-compact],[data-fdc-divider]')) return;
        if (event.type === 'keydown' && !['Enter',' '].includes(event.key)) return;
        if (target.closest('[data-dockkit-tab-close]')) return;
        const tabNode = target.closest('[data-dockkit-tab]');
        const fileAction = target.closest('[data-rightbar-col]') && target.closest('button,[role="button"],[data-files-entry="file"]');
        const resourceLink = target.closest('a[href^="dsh-resource://file/"],[data-resource-address^="dsh-resource://file/"]');
        // Native deliverable cards and Markdown file mentions are buttons whose
        // title carries the path, rather than links carrying a resource URL.
        const presentedPreview = target.closest('[data-presented-file] > button[title]');
        const mentionPreview = target.closest('code > button[title][aria-label]');
        if (!tabNode && !fileAction && !resourceLink && !presentedPreview && !mentionPreview) return;
        const id = currentId();
        const intendedTab = tabNode && sidebar.openTabs.getSnapshot().find(entry =>
          entry.sessionId === id && entry.tabId === tabNode.dataset.dockkitTab);
        const requested = intendedTab?.contentId || resourceLink?.getAttribute('href') || resourceLink?.getAttribute('data-resource-address');
        const row = presentedPreview || mentionPreview || target.closest('[data-files-entry="file"],[role="button"][title]');
        const requestedPath = row?.getAttribute('data-files-path') || row?.getAttribute('title');
        if (!isDocument(requested) && !requestedPath) return;
        clearIntent();
        if (!model.auto || !id) return;
        pendingIntent = {id, requested, path:requestedPath, expires:Date.now()+5000};
        intentTimer = setTimeout(clearIntent, 5000);
        // The next frame handles synchronous opens; subscriptions handle delayed ones.
        schedule();
      }
      const resize = new ResizeObserver(schedule);
      const frameObserver = new MutationObserver(() => {
        const columns = frame?.style.gridTemplateColumns;
        if (columns !== nativeColumns) { nativeColumns = columns; schedule(); }
      });
      let nativeColumns = '';
      const structuralSelector = '[data-rightbar-col],[data-sidebar-right-panel],[data-excel-preview],iframe[data-html-preview],[data-slot="conversation.session.header.actions"],.fortune-zoom-container';
      const observer = new MutationObserver(records => {
        if (records.some(record => {
          if (record.type === 'attributes') {
            return record.target === frame || record.target.matches('[data-sidebar-right-panel]') ||
              (record.target.closest('[data-rightbar-col]') && record.attributeName === 'hidden');
          }
          return [...record.addedNodes,...record.removedNodes].some(node => node instanceof Element &&
            (node.matches(structuralSelector) || node.querySelector(structuralSelector)));
        })) schedule();
      });
      observer.observe(document.body, { childList:true, subtree:true, attributes:true,
        attributeFilter:['data-sidebar-right-open','data-sidebar-right-panel','hidden','aria-selected','data-sidebar-collapsed','data-rightbar-collapsed'] });
      document.addEventListener('click', viewGesture, true);
      document.addEventListener('keydown', viewGesture, true);
      document.addEventListener('click', manualZoom, true);
      document.addEventListener('keydown', manualZoom, true);
      document.addEventListener('click', sheetGesture, true);
      document.addEventListener('contextmenu', sheetGesture, true);
      const unsubMounted = sidebar.mounted.subscribe(schedule);
      const unsubTabs = sidebar.openTabs.subscribe(schedule);
      const disposers = [];
      for (const seat of ['conversation.session.header.actions','sidebar.right.tab.document.actions']) {
        disposers.push(scoped.slots.inject(seat, () => scoped.slots.register({
          name:seat, id:`dsh-document-view:${seat}`, order:5,
          inject:sessionId => ({ collaborationSessionId:sessionId, documentSeat:seat.startsWith('sidebar.') })
        }, Controls)));
      }
      schedule();
      return () => {
        disposed = true; clearIntent(); commitDrag(); cancelAnimationFrame(raf); resize.disconnect(); observer.disconnect(); frameObserver.disconnect();
        document.removeEventListener('click',viewGesture,true); document.removeEventListener('keydown',viewGesture,true);
        document.removeEventListener('click',manualZoom,true);
        document.removeEventListener('keydown',manualZoom,true);
        document.removeEventListener('click',sheetGesture,true);
        document.removeEventListener('contextmenu',sheetGesture,true);
        unsubMounted(); unsubTabs(); disposers.forEach(dispose => dispose());
        removeGeometry(); center?.removeAttribute('data-fdc-center'); divider?.remove(); compact?.remove(); style.remove(); listeners.clear();
        for (const [node,attribute] of headerMarks) node.removeAttribute(attribute);
        headerMarks.clear();
        // Restore temporary native zoom even if the plugin is disabled while a
        // workbook stays mounted. Stop immediately on a subsequent user change.
        for (const [node,record] of workbooks) {
          if (record.mode === 'push' || record.manual) continue;
          let expected = workbookZoom(node), remaining = 40;
          const restore = () => {
            if (!node.isConnected || !remaining-- || Math.abs(workbookZoom(node) - expected) > 0.05) return;
            if (!zoomStep(node,record.zoom)) return;
            expected += expected < record.zoom ? 0.1 : -0.1;
            requestAnimationFrame(restore);
          };
          restore();
        }
        workbooks.clear();
        restoreFocusMarks();
      };
    }, 'dsh-document-view');
  });
}

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
