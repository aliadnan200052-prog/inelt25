// ════════════════════════════════════════════════════════════
// Text normalisation and answer matching.
// Pure functions — shared by the browser and the node tests.
// ════════════════════════════════════════════════════════════

const CONTRACTIONS = [
  [/\bi'm\b/g, 'i am'], [/\byou're\b/g, 'you are'], [/\bwe're\b/g, 'we are'],
  [/\bthey're\b/g, 'they are'], [/\bit's\b/g, 'it is'], [/\bthat's\b/g, 'that is'],
  [/\bthere's\b/g, 'there is'], [/\bwhat's\b/g, 'what is'], [/\bwhere's\b/g, 'where is'],
  [/\bhe's\b/g, 'he is'], [/\bshe's\b/g, 'she is'], [/\blet's\b/g, 'let us'],
  [/\bcan't\b/g, 'cannot'], [/\bwon't\b/g, 'will not'], [/\bshan't\b/g, 'shall not'],
  [/\bi've\b/g, 'i have'], [/\byou've\b/g, 'you have'], [/\bwe've\b/g, 'we have'], [/\bthey've\b/g, 'they have'],
  [/\bi'll\b/g, 'i will'], [/\byou'll\b/g, 'you will'], [/\bwe'll\b/g, 'we will'], [/\bthey'll\b/g, 'they will'],
  [/\bhe'll\b/g, 'he will'], [/\bshe'll\b/g, 'she will'], [/\bit'll\b/g, 'it will'],
  [/\bi'd\b/g, 'i would'], [/\byou'd\b/g, 'you would'], [/\bwe'd\b/g, 'we would'], [/\bthey'd\b/g, 'they would'],
  [/\bhe'd\b/g, 'he would'], [/\bshe'd\b/g, 'she would'],
  [/\b(\w+)n't\b/g, '$1 not'],
  [/\bcan not\b/g, 'cannot'],
];

/** Lowercase, straighten quotes, drop punctuation (keeping apostrophes), collapse spaces. */
export function normalize(s) {
  return String(s ?? '')
    .toLowerCase()
    .replace(/[‘’ʼ`´]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[^\p{L}\p{N}'\s-]/gu, ' ')
    .replace(/\s-\s|-{2,}/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Normalise and expand contractions, so "I'm" and "I am" compare equal. */
export function canonical(s) {
  let out = normalize(s);
  for (const [re, rep] of CONTRACTIONS) out = out.replace(re, rep);
  return out.replace(/\s+/g, ' ').trim();
}

export function tokens(s) {
  const n = normalize(s);
  return n ? n.split(' ') : [];
}

export function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

/**
 * Compare a typed answer with the accepted answers.
 * - correct: identical after canonicalisation
 * - near:    same number of words and only small spelling slips
 *            (1 edit per word, 2 in long words, ≤ 3 in total) — "almost", not "wrong"
 */
export function matchAnswer(given, answers) {
  const g = canonical(given);
  const list = (Array.isArray(answers) ? answers : [answers]).filter(a => a != null && a !== '');
  if (!g) return { correct: false, near: false, matched: list[0] ?? '' };
  for (const a of list) {
    if (canonical(a) === g) return { correct: true, near: false, matched: a };
  }
  const gw = g.split(' ');
  for (const a of list) {
    const aw = canonical(a).split(' ');
    if (aw.length !== gw.length) continue;
    let total = 0, ok = true;
    for (let i = 0; i < aw.length; i++) {
      const d = levenshtein(aw[i], gw[i]);
      // Very short words (a, in, on) must be exact: "in" vs "on" is grammar, not spelling.
      const allowed = aw[i].length >= 7 ? 2 : aw[i].length >= 4 ? 1 : 0;
      if (d > allowed) { ok = false; break; }
      total += d;
    }
    if (ok && total > 0 && total <= 3) return { correct: false, near: true, matched: a };
  }
  return { correct: false, near: false, matched: list[0] ?? '' };
}

/** Does free text contain any of the item's patterns? Patterns are regex source strings. */
export function containsPattern(text, patterns) {
  const raw = String(text ?? '').trim().replace(/[\u2018\u2019]/g, "'");
  const n = normalize(text);
  const c = canonical(text);
  return (patterns || []).some(p => {
    try {
      const re = new RegExp(p, 'i');
      return re.test(n) || re.test(c) || re.test(raw);
    } catch {
      return n.includes(String(p).toLowerCase());
    }
  });
}

/** Replace the cloze substring with a blank (case-insensitive, first occurrence). */
export function makeCloze(sentence, cloze) {
  const i = sentence.toLowerCase().indexOf(String(cloze).toLowerCase());
  if (i < 0) return { before: sentence, after: '', answer: cloze, found: false };
  return {
    before: sentence.slice(0, i),
    after: sentence.slice(i + cloze.length),
    answer: sentence.slice(i, i + cloze.length),
    found: true,
  };
}

/** First-letter hint: "make a decision" → "m___ a d_______". */
export function firstLetterHint(answer) {
  return String(answer).split(' ').map(w =>
    w.length <= 1 ? w : w[0] + w.slice(1).replace(/[\p{L}]/gu, '_')
  ).join(' ');
}

/** Word-level diff for dictation feedback: [{ word, ok }] over the expected text. */
export function wordDiff(expected, given) {
  const e = tokens(expected), g = tokens(given);
  // LCS so one missing word does not mark every later word wrong.
  const dp = Array.from({ length: e.length + 1 }, () => new Array(g.length + 1).fill(0));
  for (let i = e.length - 1; i >= 0; i--)
    for (let j = g.length - 1; j >= 0; j--)
      dp[i][j] = e[i] === g[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out = [];
  let i = 0, j = 0;
  while (i < e.length) {
    if (j < g.length && e[i] === g[j]) { out.push({ word: e[i], ok: true }); i++; j++; }
    else if (j < g.length && dp[i][j + 1] >= dp[i + 1][j]) j++;
    else { out.push({ word: e[i], ok: false }); i++; }
  }
  const correct = out.filter(w => w.ok).length;
  return { words: out, score: e.length ? correct / e.length : 0 };
}

export function shuffle(arr, rand = Math.random) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
