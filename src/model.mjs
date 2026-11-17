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
