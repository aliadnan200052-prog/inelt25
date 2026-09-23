// ════════════════════════════════════════════════════════════
// Feedback: answer checking + a library of common learner errors.
//
// Every checker returns the same contract:
//   { correct, near, score, feedback: { yourAnswer, better, why, why_ar } }
// "why" is ONE short reason at the learner's level — never a lecture.
// ════════════════════════════════════════════════════════════
import { matchAnswer, containsPattern, normalize, canonical, wordDiff } from './text.js';

/**
 * Frequent errors of (mostly Arabic-speaking) learners of English.
 * `re` runs on normalised text (lowercase, no punctuation, contractions kept).
 * `fix(match)` returns the corrected fragment.
 */
export const COMMON_ERRORS = [
  { id: 'be-agree', re: /\b(i am|i'm|we are|we're|they are|they're|he is|she is|you are|you're) (agree|disagree)\b/,
    fix: m => m.replace(/^(i am|i'm)/, 'I').replace(/^(we are|we're)/, 'we').replace(/^(they are|they're)/, 'they')
      .replace(/^(you are|you're)/, 'you').replace(/^(he|she) is (agree|disagree)/, (_, p, v) => `${p} ${v}s`),
    why: '"Agree" is a verb, so we don\'t use "am/is/are" before it.',
    why_ar: '"agree" فعل، لذلك لا نضع قبله am/is/are.' },
  { id: 'be-plus-verb', re: /\b(i am|i'm) (understand|know|like|want|need|live|work|study|think|go|come)\b/,
    fix: m => m.replace(/^(i am|i'm) /, 'I '),
    why: 'Use the verb on its own here: "I understand", not "I am understand".',
    why_ar: 'استخدم الفعل وحده: I understand وليس I am understand.' },
  { id: 'have-years', re: /\b(i|he|she|you|we|they) (have|has) (\d+|[a-z]+ty(-[a-z]+)?|ten|eleven|twelve|[a-z]+teen) years\b/,
    fix: m => m.replace(/\b(i|he|she|you|we|they) (have|has) /, (_, p) => `${p === 'i' ? 'I' : p} ${{ i: 'am', he: 'is', she: 'is' }[p] || 'are'} `).replace(/ years$/, ' (years old)'),
    why: 'For age, English uses "be": "I am 20 (years old)".',
    why_ar: 'للتعبير عن العمر نستخدم be: I am 20.' },
  { id: 'discuss-about', re: /\bdiscuss(ed|es|ing)? about\b/, fix: m => m.replace(/ about$/, ''),
    why: '"Discuss" doesn\'t need "about": discuss the problem.', why_ar: 'الفعل discuss لا يحتاج about.' },
  { id: 'more-better', re: /\bmore (better|worse|bigger|easier|cheaper|faster|smaller|older|younger)\b/, fix: m => m.replace(/^more /, ''),
    why: '"Better" is already a comparative, so we don\'t add "more".', why_ar: 'كلمة better صيغة مقارنة أصلاً، لا نضيف more.' },
  { id: 'people-is', re: /\bpeople (is|was|has)\b/, fix: m => m.replace(/ is$/, ' are').replace(/ was$/, ' were').replace(/ has$/, ' have'),
    why: '"People" is plural: people are, people were.', why_ar: 'كلمة people جمع: people are.' },
  { id: 'uncountable-s', re: /\b(informations|advices|furnitures|homeworks|equipments|luggages|knowledges|researches)\b/,
    fix: m => m.replace(/s$/, ''),
    why: 'This noun is uncountable in English — no -s.', why_ar: 'هذا الاسم غير معدود في الإنجليزية، لا يأخذ s.' },
  { id: 'an-advice', re: /\b(a|an) (advice|information|homework|news|furniture)\b/, fix: m => m.replace(/^(a|an) /, 'some '),
    why: 'This noun is uncountable, so no "a/an". Try "some advice" or "a piece of advice".', why_ar: 'اسم غير معدود، لا نستخدم معه a/an.' },
  { id: 'modal-to', re: /\b(can|must|should|will|would|could|might) to (\w+)/, fix: m => m.replace(/ to /, ' '),
    why: 'After can/must/should we use the verb without "to".', why_ar: 'بعد can/must/should يأتي الفعل بدون to.' },
  { id: 'did-past', re: /\b(did|didn't|did not) (went|saw|came|took|made|got|had|was|bought|ate|wrote|told|said|found|left)\b/,
    fix: m => m.replace(/(went|saw|came|took|made|got|had|was|bought|ate|wrote|told|said|found|left)$/, v => ({ went: 'go', saw: 'see', came: 'come', took: 'take', made: 'make', got: 'get', had: 'have', was: 'be', bought: 'buy', ate: 'eat', wrote: 'write', told: 'tell', said: 'say', found: 'find', left: 'leave' })[v]),
    why: 'After "did/didn\'t", use the base verb: didn\'t go.', why_ar: 'بعد did/didn\'t يأتي الفعل بصيغته الأساسية.' },
  { id: 'since-years', re: /\bsince (\d+|two|three|four|five|six|ten|many|several) (years|months|weeks|days)\b/, fix: m => m.replace(/^since/, 'for'),
    why: 'Use "for" with a length of time (for 3 years), "since" with a starting point (since 2020).', why_ar: 'for مع المدة، since مع نقطة البداية.' },
  { id: 'married-with', re: /\bmarried with\b/, fix: () => 'married to',
    why: 'We say "married to someone".', why_ar: 'نقول married to.' },
  { id: 'explain-me', re: /\bexplain (me|him|her|us|them)\b/, fix: m => m.replace(/^explain /, 'explain to '),
    why: 'We explain something TO someone: "explain it to me".', why_ar: 'نقول explain to me.' },
  { id: 'say-me', re: /\bsay (me|him|her|us|them)\b/, fix: m => m.replace(/^say/, 'tell'),
    why: 'Use "tell" + person: "tell me". "Say" is followed by the words.', why_ar: 'مع الشخص نستخدم tell: tell me.' },
  { id: 'do-mistake', re: /\bd(o|id|oing|oes) (a |many |some |a lot of |the same )?((big|small|few|silly|stupid|serious) )?mistakes?\b/, fix: m => m.replace(/^d(o|id|oing|oes)/, w => ({ do: 'make', did: 'made', doing: 'making', does: 'makes' })[w]),
    why: 'The collocation is "make a mistake".', why_ar: 'التعبير الصحيح make a mistake.' },
  { id: 'make-homework', re: /\bma(ke|de|king|kes) (my |the |your )?homework\b/, fix: m => m.replace(/^ma(ke|de|king|kes)/, w => ({ make: 'do', made: 'did', making: 'doing', makes: 'does' })[w]),
    why: 'The collocation is "do homework".', why_ar: 'نقول do homework.' },
  { id: 'do-decision', re: /\bd(o|id|oing|oes) (a |an |the |this |that |my |your |our |their )?((big|good|bad|quick|final|difficult|hard|important|wrong|right|easy) )?decisions?\b/, fix: m => m.replace(/^d(o|id|oing|oes)/, w => ({ do: 'make', did: 'made', doing: 'making', does: 'makes' })[w]),
    why: 'The collocation is "make a decision".', why_ar: 'نقول make a decision.' },
  { id: 'very-like', re: /\bi very (like|love|enjoy)\b/, fix: m => m.replace(/^i very (\w+)/, 'I $1 it very much'),
    why: '"Very" can\'t go before a verb. Say "I really like…" or "I like… very much".', why_ar: 'لا تأتي very قبل الفعل: I really like.' },
  { id: 'go-to-home', re: /\b(go|went|going|come|came|get|got) to home\b/, fix: m => m.replace(/ to home$/, ' home'),
    why: 'No "to" before "home": go home.', why_ar: 'لا نضع to قبل home.' },
  { id: 'listen-music', re: /\blisten(ed|ing|s)? (music|the radio|him|her|me|podcasts?)\b/, fix: m => m.replace(/^(listen\w*) /, '$1 to '),
    why: 'We "listen TO" something.', why_ar: 'نقول listen to.' },
  { id: 'enter-to', re: /\bent(er|ered|ering) (to|in|into) (the )?(room|class|classroom|building|house|office)\b/, fix: m => m.replace(/ (to|in|into) /, ' '),
    why: '"Enter" takes a direct object: enter the room.', why_ar: 'الفعل enter لا يحتاج حرف جر.' },
  { id: 'depend-of', re: /\bdepend(s|ed|ing)? (of|from|in)\b/, fix: m => m.replace(/ (of|from|in)$/, ' on'),
    why: 'The preposition is "on": it depends on…', why_ar: 'نقول depend on.' },
  { id: 'interested-for', re: /\binterested (for|about|with|on)\b/, fix: () => 'interested in',
    why: 'We say "interested in".', why_ar: 'نقول interested in.' },
  { id: 'look-forward-verb', re: /\blook(ing)? forward to (see|meet|hear|work|visit|talk)\b/, fix: m => m + 'ing',
    why: 'After "look forward to" use -ing: looking forward to seeing you.', why_ar: 'بعد look forward to يأتي الفعل مع ing.' },
  { id: 'he-dont', re: /\b(he|she|it) (don't|do not)\b/, fix: m => m.replace(/(don't|do not)$/, "doesn't"),
    why: 'With he/she/it we use "doesn\'t".', why_ar: 'مع he/she/it نستخدم doesn\'t.' },
  { id: 'third-person-s', re: /(?<!\b(?:does|did|will|would|can|could|should|must|might|may|let|to|doesn't|didn't|won't|can't|not) )\b(he|she|my (mother|father|brother|sister|friend)) (work|live|go|like|want|study|have|play|watch|get|come)\b/,
    fix: m => m.replace(/(work|live|go|like|want|study|have|play|watch|get|come)$/, v => ({ go: 'goes', study: 'studies', have: 'has', watch: 'watches' })[v] || v + 's'),
    why: 'In the present simple, he/she/it takes -s: she works.', why_ar: 'في المضارع البسيط مع he/she/it نضيف s للفعل.' },
  { id: 'i-am-agree-with', re: /\bin my opinion i think\b/, fix: () => 'in my opinion / I think',
    why: '"In my opinion" and "I think" mean the same — use one of them.', why_ar: 'استخدم أحدهما فقط.' },
];

/** Find common errors in free text. Returns at most `limit` findings. */
export function detectErrors(text, limit = 3) {
  const n = normalize(text);
  const found = [];
  for (const rule of COMMON_ERRORS) {
    const m = n.match(rule.re);
    if (m) {
      found.push({ id: rule.id, found: m[0], better: rule.fix(m[0]), why: rule.why, why_ar: rule.why_ar });
      if (found.length >= limit) break;
    }
  }
  return found;
}

function anticipated(ex, response) {
  for (const err of ex.errors || []) {
    let hit = false;
    try { hit = new RegExp(err.match, 'i').test(normalize(response)); }
    catch { hit = normalize(response).includes(normalize(err.match)); }
    if (hit) return err;
  }
  return null;
}

function result(correct, near, response, better, why, why_ar, score) {
  return {
    correct, near,
    score: score ?? (correct ? 1 : near ? 0.75 : 0),
    feedback: correct ? null : { yourAnswer: response, better, why: why || '', why_ar: why_ar || '' },
  };
}

/**
 * Check any exercise type. `response` shape depends on the type:
 *   mcq → option index · gap/recall/transform/correct/order/dictation → string
 *   match → array of chosen right-hand indices · produce → string
 */
export function checkExercise(ex, response) {
  switch (ex.type) {
    case 'mcq': {
      const correct = Number(response) === Number(ex.answer);
      const why = (ex.explain && ex.explain[response]) || ex.why || '';
      return result(correct, false, ex.options[response], ex.options[ex.answer], why, ex.why_ar);
    }
    case 'gap': case 'recall': case 'transform': case 'correct': case 'order': {
      const answers = ex.answers || (ex.answer != null ? [ex.answer] : []);
      const m = matchAnswer(response, answers);
      if (m.correct) return result(true, false, response, m.matched);
      const better = ex.type === 'gap' && ex.text ? ex.text.replace('___', answers[0]) : answers[0];
      if (m.near) return result(false, true, response, better, 'Almost — check the spelling.', 'قريب جدًا — راجع الإملاء.');
      const a = anticipated(ex, response);
      if (a) return result(false, false, response, better, a.why, a.why_ar);
      const full = ex.type === 'gap' && ex.text ? ex.text.replace('___', response) : response;
      const d = detectErrors(full, 1)[0];
      if (d) return result(false, false, response, better, d.why, d.why_ar);
      return result(false, false, response, better, ex.why || 'Compare your answer with the better version.', ex.why_ar);
    }
    case 'match': {
      const pairs = ex.pairs || [];
      const ok = pairs.filter((_, i) => Number(response?.[i]) === i).length;
      const correct = ok === pairs.length;
      return result(correct, false, `${ok} of ${pairs.length} matched`, pairs.map(p => `${p[0]} → ${p[1]}`).join(' · '), ex.why || '', ex.why_ar, pairs.length ? ok / pairs.length : 0);
    }
    case 'dictation': {
      const diff = wordDiff(ex.text, response);
      const correct = diff.score === 1;
      const near = !correct && diff.score >= 0.8;
      return { ...result(correct, near, response, ex.text, near ? 'Nearly all of it — look at the words marked.' : 'Listen again for the words you missed.', '', diff.score), diff };
    }
    case 'produce': return checkProduction(ex, response);
    default:
      return result(false, false, String(response ?? ''), '', 'Unknown exercise type.');
  }
}

/**
 * Own-sentence production. Correct = uses the target language AND no
 * common error was detected. The learner then confirms meaning themselves;
 * we never pretend a regex understands meaning.
 */
export function checkProduction(ex, response) {
  const text = String(response || '').trim();
  const words = normalize(text).split(' ').filter(Boolean).length;
  const minWords = ex.minWords ?? 4;
  if (words < minWords) {
    return result(false, false, text, ex.sample || '', `Write a full sentence (at least ${minWords} words).`, `اكتب جملة كاملة (${minWords} كلمات على الأقل).`, 0);
  }
  const usesTarget = !ex.target || !ex.target.length || containsPattern(text, ex.target);
  const errors = detectErrors(text, 2);
  if (!usesTarget) {
    return { ...result(false, false, text, ex.sample || '', `Try to use ${ex.targetLabel ? `"${ex.targetLabel}"` : 'the target expression'} in your sentence.`, 'حاول أن تستخدم التعبير المطلوب.', 0.3), usesTarget, errors };
  }
  if (errors.length) {
    const e = errors[0];
    return { ...result(false, true, text, text.replace(new RegExp(escapeRe(e.found), 'i'), e.better), e.why, e.why_ar, 0.7), usesTarget, errors };
  }
  return { ...result(true, false, text, text), usesTarget, errors };
}

function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

/** Quality for the scheduler, derived from the check — learners don't self-rate. */
export function qualityFrom(check, { hintUsed = false } = {}) {
  if (!check.correct) return check.near ? 'hard' : 'again';
  return hintUsed ? 'hard' : 'good';
}

export { canonical };
