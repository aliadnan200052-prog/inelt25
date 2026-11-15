/* Verification of the estimator by simulation.
   node tools/vocab/test_engine.js
   Simulated examinees know each word with probability given by a logistic
   curve in log10(rank). Their true size over the 20,000-family universe is
   known exactly, so bias and interval coverage can be measured. */
'use strict';
const assert = require('assert');
const bank = require('../../js/vocab/bank.js');
const E = require('../../js/vocab/engine.js');

let failures = 0;
function check(name, cond, info) {
  console.log((cond ? 'PASS ' : 'FAIL ') + name + (info ? '  ' + info : ''));
  if (!cond) failures++;
}

// ── bank sanity ─────────────────────────────────────────────────────────
const bandCounts = bank.bands.map(b => bank.items.filter(i => i.band === b.id).length);
check('every band has >= 35 items', bandCounts.every(c => c >= 35), bandCounts.join(','));
check('items sit in their rank band', bank.items.every(i => {
  const b = bank.bands[i.band - 1]; return i.rank >= b.from && i.rank <= b.to; }));
check('universe = 20,000 families', bank.bands.reduce((s, b) => s + b.size, 0) === 20000);
const realSet = new Set(bank.items.map(i => i.w));
check('no pseudoword collides with a bank word', bank.pseudowords.every(p => !realSet.has(p)));
check('>= 40 pseudowords', bank.pseudowords.length >= 40, bank.pseudowords.length);
check('every example marks its target', bank.items.every(i => /\*[^*]+\*/.test(i.ex)));

// ── unit checks of the formulas ─────────────────────────────────────────
check('MCQ guessing correction: 6 right 3 wrong of 9 -> (6-1)/9',
  Math.abs(E.bandProportion(['correct','correct','correct','correct','correct','correct','wrong','wrong','wrong'], [], 0) - 5/9) < 1e-9);
check('pure guesser (1 right, 3 wrong of 4) scores 0',
  E.bandProportion(['correct','wrong','wrong','wrong'], [], 0) === 0);
check('yes/no correction: h=.8 f=.2 -> .75',
  Math.abs(E.bandProportion([], ['know','know','know','know','no'], 0.2) - 0.75) < 1e-9);
check('isotonic smoothing pools violators',
  JSON.stringify(E.isotonicDecreasing([1, .6, .8, .2], [1, 1, 1, 1]).map(x => +x.toFixed(2))) === '[1,0.7,0.7,0.2]');

// ── simulated examinees ─────────────────────────────────────────────────
function examinee(mid, slope, opt) {
  // P(know word of rank r) = 1 / (1 + exp(slope * (log10 r - log10 mid)))
  const pk = r => 1 / (1 + Math.exp(slope * (Math.log10(r) - Math.log10(mid))));
  let truth = 0;
  for (let r = 1; r <= 20000; r++) truth += pk(r);
  return { pk, truth, idk: opt.idk, claim: opt.claim, seenRate: opt.seen || 0.3 };
}
function run(person, mode, seed) {
  const rand = E.rng(seed * 7919 + 1);
  const s = E.createSession(bank, mode, { seed });
  const bandOf = {};
  let item, n = 0, bandsSeen = {};
  while ((item = E.nextItem(bank, s))) {
    n++;
    if (item.kind === 'pseudo') {
      E.answer(bank, s, rand() < person.claim ? 'know' : (rand() < person.seenRate ? 'seen' : 'no'));
      continue;
    }
    bandsSeen[item.band] = (bandsSeen[item.band] || 0) + 1;
    const it = E.itemById(bank, item.id);
    const knows = rand() < person.pk(it.rank);
    if (item.kind === 'check') {
      E.answer(bank, s, knows ? 'know' : (rand() < person.claim ? 'know' : (rand() < person.seenRate ? 'seen' : 'no')));
    } else if (knows) {
      E.answer(bank, s, item.options.findIndex(o => o.correct));
    } else {
      E.answer(bank, s, rand() < person.idk ? 'idk' : Math.floor(rand() * 4));
    }
  }
  return { n, res: E.score(bank, s.responses, { reps: 400, seed }), bandsSeen, s };
}

const MODE_LEN = { quick: 50, standard: 100, comprehensive: 180 };
const profiles = [
  ['beginner (~1,500)', 1200, 4], ['intermediate (~4,500)', 4000, 4],
  ['advanced (~9,000)', 9000, 5], ['near-native (~15,000)', 20000, 4]
];
for (const mode of ['quick', 'standard', 'comprehensive']) {
  for (const [name, mid, slope] of profiles) {
    for (const behaviour of [{ idk: 0.7, claim: 0.05, tag: 'honest' }, { idk: 0.0, claim: 0.3, tag: 'guesser/overclaimer' }]) {
      const p = examinee(mid, slope, behaviour);
      const R = 40; let cover = 0, err = 0, abserr = 0, lens = true, strat = true;
      for (let k = 1; k <= R; k++) {
        const { n, res, bandsSeen } = run(p, mode, k * 101 + mid);
        if (n !== MODE_LEN[mode]) lens = false;
        if (Object.keys(bandsSeen).length !== 10) strat = false;
        if (res.lo <= p.truth && p.truth <= res.hi) cover++;
        err += res.estimate - p.truth; abserr += Math.abs(res.estimate - p.truth);
      }
      const bias = err / R, mae = abserr / R;
      const info = `truth=${Math.round(p.truth)} bias=${Math.round(bias)} MAE=${Math.round(mae)} CI-coverage=${Math.round(100 * cover / R)}%`;
      check(`${mode}/${name}/${behaviour.tag}: length & all bands sampled`, lens && strat);
      // Bias must be small relative to the truth; coverage should be near 95%.
      check(`${mode}/${name}/${behaviour.tag}: |bias| < 12% of truth or < 600`,
        Math.abs(bias) < Math.max(600, 0.12 * p.truth), info);
      check(`${mode}/${name}/${behaviour.tag}: 95% CI coverage >= 80%`, cover / R >= 0.8, info);
    }
  }
}

// ── pseudoword handling ─────────────────────────────────────────────────
{
  const honest = examinee(4000, 4, { idk: 0.7, claim: 0.0 });
  const liar = examinee(4000, 4, { idk: 0.7, claim: 0.6 });
  const a = run(honest, 'standard', 5).res, b = run(liar, 'standard', 5).res;
  check('heavy over-claimer is flagged unreliable', !b.reliable && b.falseAlarm > 0.4, 'FA=' + b.falseAlarm.toFixed(2));
  check('honest examinee has no over-claiming warning', a.falseAlarm < 0.1 && a.warnings.every(w => !/fake words/.test(w.text) || /Too few/.test(w.text)));
}
// ── resumability: same seed + same answers => same items ────────────────
{
  const s1 = E.createSession(bank, 'quick', { seed: 42 });
  const s2 = E.createSession(bank, 'quick', { seed: 42 });
  let same = true;
  for (let i = 0; i < 50; i++) {
    const a = E.nextItem(bank, s1);
    const copy = JSON.parse(JSON.stringify(s2));             // simulate save/restore each step
    Object.assign(s2, copy);
    const b = E.nextItem(bank, s2);
    if (!a || !b || a.id !== b.id) { same = false; break; }
    const ans = a.kind === 'pseudo' || a.kind === 'check' ? 'no' : 'idk';
    E.answer(bank, s1, ans); E.answer(bank, s2, ans);
  }
  check('session restored from JSON continues identically', same);
}
// ── early stop produces an "insufficient data" result ───────────────────
{
  const s = E.createSession(bank, 'standard', { seed: 9 });
  for (let i = 0; i < 12; i++) { const it = E.nextItem(bank, s); E.answer(bank, s, it.kind === 'pseudo' || it.kind === 'check' ? 'know' : 0); }
  const r = E.score(bank, s.responses, { reps: 200 });
  check('12 answers -> flagged as insufficient', !r.reliable && /Not enough/.test(r.warnings[0].text));
}
// ── a perfectly consistent responder still gets a non-zero interval ─────
{
  const s = E.createSession(bank, 'quick', { seed: 3 }); let it;
  while ((it = E.nextItem(bank, s))) {
    if (it.kind === 'pseudo') E.answer(bank, s, 'no');
    else if (it.kind === 'check') E.answer(bank, s, it.band <= 4 ? 'know' : 'no');
    else E.answer(bank, s, it.band <= 4 ? it.options.findIndex(o => o.correct) : 'idk');
  }
  const r = E.score(bank, s.responses, { reps: 500 });
  check('consistent responder: estimate 4,000, interval contains it and is not zero-width',
    Math.round(r.estimate) === 4000 && r.lo < 4000 && r.hi > 4000, `${Math.round(r.lo)}-${Math.round(r.hi)}`);
}
console.log(failures ? `\n${failures} check(s) FAILED` : '\nAll checks passed');
process.exit(failures ? 1 : 0);
