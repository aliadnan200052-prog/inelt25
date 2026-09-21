/* ════════════════════════════════════════════
   Practice runner — self-contained. Nothing here touches the exam page,
   and no call it makes creates an attempt.
════════════════════════════════════════════ */
const SECTIONS = [
  { key: 'conversation', api: 'Conversation',           ar: 'الحوار',           en: 'Conversation' },
  { key: 'functions',    api: 'Functions',              ar: 'الوظائف اللغوية',  en: 'Functions' },
  { key: 'grammar',      api: 'Grammar',                ar: 'القواعد',          en: 'Grammar' },
  { key: 'reading',      api: 'Reading Comprehension',  ar: 'القراءة والفهم',   en: 'Reading' }
];
const ICONS = {
  reading:      '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
  grammar:      '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .622.622l4.353-1.321a2 2 0 0 0 .83-.497Z"/><path d="m15 5 4 4"/></svg>',
  functions:    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  conversation: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>'
};
const COUNTS = [5, 10, 20];
const KEYS = ['A','B','C','D'];

let pick = 'grammar', count = 10;
let qs = [], passage = '', i = 0, right = 0, answered = false;

const $ = id => document.getElementById(id);

function renderSetup() {
  $('sections').innerHTML = SECTIONS.map(s =>
    `<div class="pr-section${s.key === pick ? ' sel' : ''}" data-k="${s.key}">
       <div class="pr-section-icon">${ICONS[s.key]}</div>
       <div class="pr-section-name">${s.ar}</div>
       <div class="pr-section-en en">${s.en}</div>
     </div>`).join('');
  $('counts').innerHTML = COUNTS.map(c =>
    `<button class="pr-count${c === count ? ' sel' : ''}" data-c="${c}">${c}</button>`).join('');
}
function choose(k) { pick = k; renderSetup(); }
function setCount(c) { count = c; renderSetup(); }

async function start() {
  const btn = $('startBtn');
  btn.disabled = true;
  const api = SECTIONS.find(s => s.key === pick).api;
  let data;
  try {
    data = await ExamAPI.startPractice(api, count);
  } catch (e) {
    console.error('startPractice failed:', e);
    alert('تعذّر بدء التدريب. ' + (humanError(e) || 'حاول مرة أخرى.'));
    btn.disabled = false;
    return;
  }
  qs = data.questions || [];
  passage = data.passage || '';
  if (!qs.length) {
    alert('لا توجد أسئلة متاحة في هذا القسم بعد.');
    btn.disabled = false;
    return;
  }
  i = 0; right = 0;
  $('setup').classList.add('hidden');
  $('runner').classList.remove('hidden');
  renderQ();
  window.scrollTo(0, 0);
}

/* Question text, options and passages come from the question bank and go
   into innerHTML below. Escape them: unescaped, they run as HTML in the
   student's browser, where the auth token is. See index.html for the same
   helper. */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));

function renderQ() {
  const q = qs[i];
  answered = false;
  $('prPos').textContent = `سؤال ${i + 1} من ${qs.length}`;
  $('prScore').textContent = `${right} / ${i}`;
  $('prFill').style.width = (i / qs.length * 100) + '%';
  $('nextBtn').disabled = true;
  $('nextBtn').textContent = (i === qs.length - 1) ? 'إنهاء' : 'التالي';

  const opts = (q.options || []).map((o, n) =>
    `<div class="pr-opt" data-n="${n}">
       <div class="pr-key">${KEYS[n]}</div>
       <div class="pr-text">${esc(o)}</div>
       <div class="pr-mark">
         <svg class="tick" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
         <svg class="x" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
       </div>
     </div>`).join('');

  $('prCard').innerHTML =
    (passage ? `<div class="pr-passage">${esc(passage)}</div>` : '') +
    `<div class="pr-q">${esc(q.question)}</div>
     <div class="pr-opts" id="prOpts">${opts}</div>
     <div id="prExplain"></div>`;
}

function answer(n) {
  if (answered) return;
  answered = true;
  const q = qs[i];
  const correct = q.correct_answer;
  const list = $('prOpts');
  list.classList.add('done');
  list.querySelectorAll('.pr-opt').forEach(el => {
    const k = Number(el.dataset.n);
    if (k === correct) el.classList.add('correct');
    else if (k === n) el.classList.add('wrong');
  });
  if (n === correct) right++;
  $('prScore').textContent = `${right} / ${i + 1}`;
  $('nextBtn').disabled = false;
}

function next() {
  if (i < qs.length - 1) { i++; renderQ(); window.scrollTo(0, 0); }
  else finish();
}

function finish() {
  const pct = Math.round(right / qs.length * 100);
  $('runner').classList.add('hidden');
  $('summary').classList.remove('hidden');
  $('sumScore').textContent = `${right} / ${qs.length}`;
  $('sumText').textContent =
    pct >= 80 ? 'ممتاز! استمر على هذا المستوى.'
    : pct >= 50 ? 'جيد — راجع الأسئلة التي أخطأت فيها.'
    : 'تحتاج مراجعة هذا القسم. جرّب مرة أخرى.';
  window.scrollTo(0, 0);
}

function again() {
  $('summary').classList.add('hidden');
  $('setup').classList.remove('hidden');
  $('startBtn').disabled = false;
  window.scrollTo(0, 0);
}

$('startBtn').onclick = start;
$('nextBtn').onclick = next;
$('againBtn').onclick = again;

document.addEventListener('DOMContentLoaded', async () => {
  const s = localStorage.getItem('th') || 'light';
  document.documentElement.setAttribute('data-theme', s);
  const ok = await ExamAPI.requireSession();
  if (!ok) return;
  renderSetup();
});

/* Events are bound here rather than with onclick= in the markup, so the
   page's script-src needs no 'unsafe-inline' — an injected <script> or
   onerror= then does not run at all. Rows and options are redrawn on every
   render, so those use one delegated listener on a container that stays. */
document.addEventListener('click', e => {
  const sec = e.target.closest('.pr-section[data-k]');
  if (sec) return choose(sec.dataset.k);
  const cnt = e.target.closest('.pr-count[data-c]');
  if (cnt) return setCount(Number(cnt.dataset.c));
  const opt = e.target.closest('#prOpts .pr-opt[data-n]');
  if (opt) return answer(Number(opt.dataset.n));
});
