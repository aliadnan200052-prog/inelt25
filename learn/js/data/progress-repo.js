// ════════════════════════════════════════════════════════════
// ProgressRepository — the learner's profile, lesson progress,
// attempt log, speaking log, level results and review states.
//
// Local implementation (this browser). The async interface matches
// the tables in db/schema.sql, so a server adapter can replace it.
// ════════════════════════════════════════════════════════════
import * as srs from '../engine/srs.js';

const KEY = 'learn.progress.v1';
const MAX_ATTEMPTS = 5000;

const TASK_OF = { mcq: 'recognition', match: 'recognition', produce: 'production' };
export const taskOf = type => TASK_OF[type] || 'recall';

function blank() {
  return {
    profile: {
      createdAt: Date.now(),
      onboarded: false,
      name: '',
      currentLevel: 'A0',
      unlockedLevel: 'A0',
      supportLang: 'ar',
      speechRate: 0.95,
      placement: null,
    },
    lessonProgress: {},
    itemStates: {},
    attempts: [],
    speakingLogs: [],
    levelResults: [],
  };
}

export class LocalProgressRepository {
  constructor() {
    this.data = this._load();
    this.listeners = new Set();
  }

  _load() {
    try {
      const d = JSON.parse(localStorage.getItem(KEY));
      if (d && d.profile) return { ...blank(), ...d, profile: { ...blank().profile, ...d.profile } };
    } catch { /* fall through */ }
    return blank();
  }

  _save() {
    if (this.data.attempts.length > MAX_ATTEMPTS) this.data.attempts = this.data.attempts.slice(-MAX_ATTEMPTS);
    try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch { /* storage full/blocked: keep in memory */ }
    for (const fn of this.listeners) fn();
  }

  onChange(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }

  // ── Profile ───────────────────────────────────────────────
  get profile() { return this.data.profile; }
  async updateProfile(patch) { this.data.profile = { ...this.data.profile, ...patch }; this._save(); }

  // ── Lessons ───────────────────────────────────────────────
  get lessonProgress() { return this.data.lessonProgress; }
  async saveLessonProgress(id, patch) {
    const cur = this.data.lessonProgress[id] || { startedAt: Date.now(), stageScores: {}, visited: [] };
    this.data.lessonProgress[id] = { ...cur, ...patch };
    this._save();
  }

  // ── Evidence ──────────────────────────────────────────────
  get attempts() { return this.data.attempts; }
  async logAttempt(a) {
    this.data.attempts.push({ ts: Date.now(), source: 'lesson', ...a, response: a.response != null ? String(a.response).slice(0, 300) : undefined });
    this._save();
  }

  get speakingLogs() { return this.data.speakingLogs; }
  async logSpeaking(entry) { this.data.speakingLogs.push({ ts: Date.now(), ...entry }); this._save(); }

  get levelResults() { return this.data.levelResults; }
  async addLevelResult(r) { this.data.levelResults.push({ ts: Date.now(), ...r }); this._save(); }

  // ── Review states ─────────────────────────────────────────
  get states() { return Object.values(this.data.itemStates); }
  state(itemId) { return this.data.itemStates[itemId]; }
  async putState(s) { this.data.itemStates[s.itemId] = s; this._save(); }

  /** Items met in a finished lesson enter the scheduler (idempotent). */
  async introduce(itemIds, now = Date.now()) {
    let added = 0;
    for (const id of itemIds) {
      const cur = this.data.itemStates[id];
      if (!cur || cur.stage === 'new') {
        this.data.itemStates[id] = srs.introduce(cur || srs.newState(id, now), now);
        added++;
      }
    }
    this._save();
    return added;
  }

  /**
   * An answer inside a lesson touches items the learner already knows
   * (recycling). Wrong → the item comes back sooner. Right → counts as a
   * review only if it was due; otherwise the context is still credited.
   */
  async applyLessonEvidence(itemIds, { correct, near, type, contextId }, now = Date.now()) {
    for (const id of itemIds || []) {
      const s = this.data.itemStates[id];
      if (!s || s.stage === 'new') continue;
      const task = taskOf(type);
      if (!correct && !near) this.data.itemStates[id] = srs.grade(s, { quality: 'again', task }, now);
      else if (s.due <= now) this.data.itemStates[id] = srs.grade(s, { quality: near ? 'hard' : 'good', task, contextId }, now);
      else if (contextId && !s.contexts.includes(contextId)) this.data.itemStates[id] = { ...s, contexts: [...s.contexts, contextId] };
    }
    this._save();
  }

  // ── Admin-scheduled reviews ───────────────────────────────
  forcedItems(schedules, now = Date.now()) {
    const out = [];
    for (const sc of schedules || []) {
      const dueAt = new Date(sc.due).getTime();
      if (!(dueAt <= now)) continue;
      for (const id of sc.items || []) {
        const s = this.data.itemStates[id];
        // Once reviewed after the scheduled date, the push is done.
        if (s && s.lastSeen != null && s.lastSeen >= dueAt) continue;
        if (sc.audience === 'all' || (s && s.stage !== 'new')) out.push(id);
      }
    }
    return [...new Set(out)];
  }

  /** Items forced by a schedule must exist as states to be reviewed. */
  async ensureStates(itemIds, now = Date.now()) {
    let changed = false;
    for (const id of itemIds) {
      if (!this.data.itemStates[id]) { this.data.itemStates[id] = { ...srs.introduce(srs.newState(id, now), now), lastSeen: null }; changed = true; }
    }
    if (changed) this._save();
  }

  // ── Housekeeping ──────────────────────────────────────────
  exportJSON() { return JSON.stringify(this.data, null, 2); }
  async reset() { this.data = blank(); this._save(); }
}
