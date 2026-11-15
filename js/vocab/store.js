/* ═══════════════════════════════════════════════════════════════════════
   Vocabulary Size Estimator · local persistence
   Everything lives in one localStorage key. Every access is wrapped so the
   app still works (without saving) in private windows or when storage is
   blocked.
   ═══════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';
  var KEY = 'vse:v1';
  var RECENT_DAYS = 60;          // a word tested within 60 days is avoided when possible
  var memory = null;             // fallback when storage is unavailable

  function empty() { return { history: [], recent: {}, session: null, prefs: { theme: 'auto', arabic: true } }; }

  function load() {
    var data = null;
    try { data = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { data = memory; }
    data = data || memory || empty();
    data.history = data.history || [];
    data.recent = data.recent || {};
    data.prefs = Object.assign({ theme: 'auto', arabic: true }, data.prefs || {});
    // forget old "recently tested" marks
    var cutoff = Date.now() - RECENT_DAYS * 864e5;
    Object.keys(data.recent).forEach(function (k) { if (data.recent[k] < cutoff) delete data.recent[k]; });
    return data;
  }

  function save(data) {
    memory = data;
    try { localStorage.setItem(KEY, JSON.stringify(data)); return true; } catch (e) { return false; }
  }

  function available() {
    try { localStorage.setItem(KEY + ':t', '1'); localStorage.removeItem(KEY + ':t'); return true; } catch (e) { return false; }
  }

  var api = {
    get: load,
    update: function (fn) { var d = load(); fn(d); save(d); return d; },
    available: available,
    clearAll: function () { memory = null; try { localStorage.removeItem(KEY); } catch (e) {} }
  };
  root.VSE_STORE = api;
})(this);
