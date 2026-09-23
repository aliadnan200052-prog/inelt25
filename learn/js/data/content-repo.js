// ════════════════════════════════════════════════════════════
// ContentRepository — the only place the app reads content from.
//
// Local implementation: published content comes from the static
// JSON files in /learn/content/; edits made in the admin panel are
// kept as an overlay in this browser until they are exported and
// committed (or until a server adapter replaces this class — it
// only has to implement the same async methods, see db/schema.sql).
// ════════════════════════════════════════════════════════════

const OVERLAY_KEY = 'learn.content.overlay.v1';

function readOverlay() {
  try { return JSON.parse(localStorage.getItem(OVERLAY_KEY)) || {}; } catch { return {}; }
}

export class LocalContentRepository {
  constructor(base = new URL('../../content/', import.meta.url).href) {
    this.base = base;
    this.cache = {};
    this.overlay = readOverlay();
  }

  async fetchJSON(path) {
    if (this.cache[path]) return this.cache[path];
    const res = await fetch(this.base + path, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`Could not load ${path} (${res.status})`);
    return (this.cache[path] = await res.json());
  }

  _o(key, fallback) {
    return this.overlay[key] !== undefined ? this.overlay[key] : fallback;
  }

  async getCatalog() { return this._o('catalog', await this.fetchJSON('catalog.json')); }
  async getItems() { return this._o('items', await this.fetchJSON('items.json')); }
  async getItemsById() { return Object.fromEntries((await this.getItems()).map(i => [i.id, i])); }
  async getVideos() { return this._o('videos', await this.fetchJSON('videos.json')); }
  async getPlacement() { return this._o('placement', await this.fetchJSON('placement.json')); }
  async getAssessments() { return this._o('assessments', await this.fetchJSON('assessments.json')); }
  async getSchedules() { return this._o('schedules', await this.fetchJSON('schedules.json')); }

  async getLesson(id) {
    const edited = this.overlay.lessons?.[id];
    if (edited === null) throw new Error(`Lesson ${id} was deleted`);
    if (edited) return edited;
    return this.fetchJSON(`lessons/${encodeURIComponent(id)}.json`);
  }

  /** Lesson body merged with its catalog entry (title, level, can-dos…). */
  async getLessonFull(id) {
    const [body, catalog] = await Promise.all([this.getLesson(id), this.getCatalog()]);
    const meta = catalog.lessons.find(l => l.id === id) || {};
    const unit = catalog.units.find(u => u.id === meta.unitId) || {};
    return { ...body, meta: { ...meta, level: unit.level, unitTitle: unit.title } };
  }

  // ── Admin writes (overlay) ────────────────────────────────
  _save() {
    try { localStorage.setItem(OVERLAY_KEY, JSON.stringify(this.overlay)); }
    catch (e) { throw new Error('Browser storage is full or blocked. Export your content and clear old edits.'); }
  }
  async saveCatalog(catalog) { this.overlay.catalog = catalog; this._save(); }
  async saveItems(items) { this.overlay.items = items; this._save(); }
  async saveVideos(videos) { this.overlay.videos = videos; this._save(); }
  async savePlacement(p) { this.overlay.placement = p; this._save(); }
  async saveAssessments(a) { this.overlay.assessments = a; this._save(); }
  async saveSchedules(s) { this.overlay.schedules = s; this._save(); }
  async saveLesson(body) { this.overlay.lessons = { ...(this.overlay.lessons || {}), [body.id]: body }; this._save(); }
  async deleteLesson(id) { this.overlay.lessons = { ...(this.overlay.lessons || {}), [id]: null }; this._save(); }

  hasLocalEdits() { return Object.keys(this.overlay).length > 0; }
  async discardLocalEdits() { this.overlay = {}; localStorage.removeItem(OVERLAY_KEY); }

  /** Everything, as one JSON bundle (for committing to /learn/content or importing elsewhere). */
  async exportBundle() {
    const catalog = await this.getCatalog();
    const lessons = {};
    for (const l of catalog.lessons) {
      try { lessons[l.id] = await this.getLesson(l.id); } catch { /* deleted or missing */ }
    }
    return {
      format: 'learn-content-bundle', version: 1, exportedAt: new Date().toISOString(),
      catalog, items: await this.getItems(), videos: await this.getVideos(),
      placement: await this.getPlacement(), assessments: await this.getAssessments(),
      schedules: await this.getSchedules(), lessons,
    };
  }

  async importBundle(b) {
    if (b?.format !== 'learn-content-bundle') throw new Error('Not a content bundle exported from this admin panel.');
    this.overlay = {
      catalog: b.catalog, items: b.items, videos: b.videos, placement: b.placement,
      assessments: b.assessments, schedules: b.schedules || [], lessons: b.lessons || {},
    };
    this._save();
  }
}
