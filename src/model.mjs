const STORAGE_KEY = 'dsh.document-view.v1';
const clampRatio = value => Number.isFinite(value) ? Math.max(0.2, Math.min(0.65, value)) : 0.35;

export function isDocument(address) {
  if (typeof address !== 'string' || !address) return false;
  if (address.startsWith('dsh-resource://file/')) return true;
  // HTML previews may open under a viewer address that is not a session file
  // address (absolute path, http URL, blob URL, ...). Recognize them by the
  // .html/.htm extension anywhere in the address so the split layout applies.
  const clean = address.split(/[?#]/, 1)[0];
  return /\.(?:html|htm)$/i.test(clean) || /\.(?:html|htm)[\\/]/i.test(clean);
}

export function solveColumns(width, sidebar, ratio) {
  width = Math.max(0, Number.isFinite(width) ? width : 0);
  sidebar = Math.max(0, Math.min(width, Number.isFinite(sidebar) ? sidebar : 0));
  const available = width - sidebar;
  if (available < 760) return { sidebar, document: available, chat: 0, narrow: true };
  const chat = Math.round(Math.max(400, Math.min(available - 360, available * clampRatio(ratio))));
  return { sidebar, document: available - chat, chat, narrow: false };
}

export class CollaborationState {
  constructor(storage) {
    this.storage = storage;
    this.auto = false;
    this.sessions = Object.create(null);
    this.counts = new Map();
    this.dirty = new Set();
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
  // Merge with what other windows already saved: only the flags this window
  // changed override the stored value, so two windows on different sessions
  // no longer erase each other.
  save() {
    if (!this.storage) return false;
    try {
      let remote = {};
      try { remote = JSON.parse(this.storage.getItem(STORAGE_KEY) || '{}'); } catch { /* treat as empty */ }
      const sessions = { ...(remote.sessions || {}) };
      let auto = remote.auto === true;
      if (this.dirty.has('auto')) auto = this.auto;
      for (const id of this.dirty) {
        if (id === 'auto') continue;
        sessions[id] = this.session(id);
      }
      for (const [id, value] of Object.entries(this.sessions)) {
        if (!(id in sessions)) sessions[id] = value;
      }
      for (const [id, value] of Object.entries(remote.sessions || {})) {
        if (this.dirty.has(id) || !value || typeof value !== 'object') continue;
        this.sessions[id] = {
          enabled: value.enabled === true,
          ratio: clampRatio(value.ratio),
          suppressed: typeof value.suppressed === 'string' ? value.suppressed : '',
        };
      }
      this.storage.setItem(STORAGE_KEY, JSON.stringify({ auto, sessions }));
      this.dirty.clear();
      return true;
    } catch { return false; }
  }
  // Adopt another window's write without dropping this window's pending edits.
  reload() {
    try {
      const remote = JSON.parse(this.storage?.getItem(STORAGE_KEY) || '{}');
      if (!this.dirty.has('auto')) this.auto = remote.auto === true;
      const sessions = {};
      for (const [id, value] of Object.entries(remote.sessions || {})) {
        if (!value || typeof value !== 'object') continue;
        sessions[id] = {
          enabled: value.enabled === true,
          ratio: clampRatio(value.ratio),
          suppressed: typeof value.suppressed === 'string' ? value.suppressed : '',
        };
      }
      for (const id of this.dirty) if (id !== 'auto') sessions[id] = this.session(id);
      for (const [id, value] of Object.entries(this.sessions)) if (!(id in sessions)) sessions[id] = value;
      this.sessions = sessions;
    } catch { /* keep the current in-memory state */ }
  }
  toggle(id, address) {
    const session = this.session(id);
    session.enabled = !session.enabled;
    session.suppressed = session.enabled ? '' : address || '';
    this.dirty.add(id);
    this.save();
  }
  observe(id, address, userGesture) {
    const session = this.session(id);
    if (this.auto && userGesture && isDocument(address) && session.suppressed !== address && !session.enabled) {
      session.enabled = true;
      session.suppressed = '';
      this.dirty.add(id);
      this.save();
    }
  }
  observeCount(id, count) {
    const previous = this.counts.get(id);
    this.counts.set(id, count);
    if (previous > 0 && count === 0) {
      this.session(id).enabled = false;
      this.dirty.add(id);
      this.save();
    }
  }
  setAuto(value) { this.auto = value === true; this.dirty.add('auto'); this.save(); }
  setRatio(id, value, persist = true) {
    const session = this.session(id), ratio = clampRatio(value);
    if (session.ratio === ratio) return;
    session.ratio = ratio;
    // Dragging commits on pointer-up, so the id must stay dirty until then.
    this.dirty.add(id);
    if (persist) this.save();
  }
}
