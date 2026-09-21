/* ════════════════════════════════════════════
   QUESTION BANK
   Moved server-side into Supabase (see backend/schema.sql,
   backend/functions/exam-start). No question or answer data is
   embedded in this file anymore — the original seed content was
   extracted to backend/seed-questions.json for import via the
   admin dashboard's "Upload" feature. See /js/api.js for how the
   exam now fetches a randomized set from the server.
════════════════════════════════════════════ */

/* ════════════════════════════════════════════
   STATE
════════════════════════════════════════════ */
let cQ = 0, uA = [], tR = 3600, tI = null;
let started = false, submitted = false, sTime = null, qs = [], passage = "";
let passageOpen = true;
let navDir = 0; // presentation only: which way the question card slides in
let sInfo = { name:"", university:"", college:"", department:"" };
let res = { correct:0, wrong:0, score:0, pct:0, passed:false };
function total() { return qs.length || 40 }
function resetState() {
  cQ=0; uA=[]; tR=3600; started=false; submitted=false; sTime=null; qs=[]; passage=""; passageOpen=true;
  if (tI) { clearInterval(tI); tI=null }
  res={correct:0,wrong:0,score:0,pct:0,passed:false};
}
/* ── Output escaping ──────────────────────────────────────────────────────
   Question text, options and reading passages are written by whoever can
   write to the question bank, and they land in innerHTML below. Anything
   unescaped there runs as HTML in every student's browser, and the auth
   token lives in localStorage — so an injected script is an account
   takeover, not a cosmetic bug. admin.html has always escaped its table;
   these pages now do the same.
   A section name is used to look up a colour and an icon, so it is pinned
   to the four known values: an unknown key could otherwise reach through
   the prototype and reach the style attribute. */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const secKey = s => (SECTION_KEYS.indexOf(s) >= 0 ? s : null);
const SECTION_KEYS = ['Reading Comprehension', 'Grammar', 'Functions', 'Conversation'];
const sNames = {
  "Reading Comprehension":"القراءة والفهم",
  "Grammar":"القواعد",
  "Functions":"الوظائف اللغوية",
  "Conversation":"الحوار"
};
const sColors = {
  "Reading Comprehension":"#5134B0",
  "Grammar":"#1B5E9E",
  "Functions":"#8F5F11",
  "Conversation":"#276F52"
};
const sIcons = {
  "Reading Comprehension":'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
  "Grammar":'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .622.622l4.353-1.321a2 2 0 0 0 .83-.497Z"/><path d="m15 5 4 4"/></svg>',
  "Functions":'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  "Conversation":'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>'
};

/* ════════════════════════════════════════════
   SOUND ENGINE
════════════════════════════════════════════ */
let snd = true, aCtx = null;
function initAudio() { if (!aCtx) aCtx = new (window.AudioContext || window.webkitAudioContext)() }
function tone(f, d, t, v) {
  if (!snd || !aCtx) return;
  try {
    const o = aCtx.createOscillator(), g = aCtx.createGain();
    o.type = t || 'sine';
    o.frequency.setValueAtTime(f, aCtx.currentTime);
    g.gain.setValueAtTime(v || .08, aCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(.001, aCtx.currentTime + d);
    o.connect(g); g.connect(aCtx.destination);
    o.start(); o.stop(aCtx.currentTime + d);
  } catch(e) {}
}
function playSound(n) {
  initAudio(); if (!snd) return;
  switch(n) {
    case 'sel': tone(660, .07, 'sine', .06); break;
    case 'next': tone(440, .08, 'sine', .05); setTimeout(() => tone(550, .08, 'sine', .05), 70); break;
    case 'prev': tone(550, .08, 'sine', .05); setTimeout(() => tone(440, .08, 'sine', .05), 70); break;
    case 'sub': tone(523, .12, 'sine', .08); setTimeout(() => tone(659, .12, 'sine', .08), 130); setTimeout(() => tone(784, .18, 'sine', .08), 260); break;
    case 'tout': tone(300, .28, 'square', .04); setTimeout(() => tone(250, .38, 'square', .04), 280); break;
    case 'res': tone(523, .18, 'sine', .08); setTimeout(() => tone(659, .18, 'sine', .08), 180); setTimeout(() => tone(784, .18, 'sine', .08), 360); setTimeout(() => tone(1047, .36, 'sine', .08), 540); break;
  }
}
function toggleSound() {
  snd = !snd;
  localStorage.setItem('snd', snd ? '1' : '0');
  updateSoundUI();
}
function updateSoundUI() {
  const btn = document.getElementById('soundToggle');
  const icon = document.getElementById('soundIcon');
  btn.classList.toggle('active', snd);
  if (!snd) {
    icon.innerHTML = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>';
  } else {
    icon.innerHTML = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>';
  }
}
function loadSound() {
  // Sound has been removed from the UI entirely — always off, and we
  // skip touching #soundToggle/#soundIcon since those elements no longer exist.
  snd = false;
}

/* ════════════════════════════════════════════
   THEME
════════════════════════════════════════════ */
function toggleTheme() {
  const h = document.documentElement;
  const next = h.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  h.setAttribute('data-theme', next);
  localStorage.setItem('th', next);
  updateThemeIcon(next);
}
function updateThemeIcon(theme) {
  const btn = document.getElementById('themeToggle');
  const icon = btn.querySelector('svg');
  if (theme === 'light') {
    icon.innerHTML = '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';
  } else {
    icon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
  }
}
function loadTheme() {
  const s = localStorage.getItem('th') || 'light';
  document.documentElement.setAttribute('data-theme', s);
  updateThemeIcon(s);
}

/* ════════════════════════════════════════════
   HISTORY
════════════════════════════════════════════ */
// loadHist() no longer reads a local score history (per the platform's
// "minimal student data" policy — scores are never persisted server-side
// either). It now shows live attempts-remaining / premium status instead,
// fetched from the account API in js/api.js.
async function loadHist() {
  const g = document.getElementById('historyGrid');
  g.innerHTML = '<div class="history-empty">...جارٍ التحميل</div>';
  try {
    const status = await ExamAPI.getStatus(); // { attempts_used, premium }
    const remaining = status.premium ? '∞' : Math.max(0, 2 - status.attempts_used);
    g.innerHTML =
      `<div class="history-item"><div class="history-icon icon-gold"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8A5F22" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg></div><div><div class="history-label">الحساب</div><div class="history-value en">${status.premium ? 'Premium' : 'Free'}</div></div></div>` +
      `<div class="history-item"><div class="history-icon icon-green"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1E6B4A" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.02"/></svg></div><div><div class="history-label">محاولات متبقية</div><div class="history-value en">${remaining}</div></div></div>` +
      `<div class="history-item"><div class="history-icon icon-blue"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B6E8F" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg></div><div><div class="history-label">محاولات مستخدمة</div><div class="history-value en">${status.attempts_used}</div></div></div>`;
  } catch (e) {
    g.innerHTML = '<div class="history-empty">تعذّر تحميل حالة الحساب</div>';
  }
}
// saveHist intentionally removed: scores are graded and returned by the
// server per-attempt and are not persisted anywhere (see exam-submit).

/* ════════════════════════════════════════════
   QUESTION SELECTION
════════════════════════════════════════════ */
function shuffle(a) {
  const r = a.slice();
  for (let i = r.length-1; i > 0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [r[i],r[j]] = [r[j],r[i]];
  }
  return r;
}
let currentAttemptId = null;

// Fetches a freshly randomized 40-question exam from the server. The
// server enforces the attempt limit and never sends correct answers —
// qs[i].correctAnswer is filled in only after submission, from the
// grading response (see submitExam below).
async function selectQs() {
  const data = await ExamAPI.startExam(); // throws ExamAPI.LockedError if attempts are exhausted
  currentAttemptId = data.attempt_id;
  passage = data.passage;
  qs = data.questions.map(q => ({
    id: q.id, section: q.section, question: q.question, options: q.options,
    correctAnswer: null
  }));
  uA = new Array(qs.length).fill(null);
}

/* ════════════════════════════════════════════
   REGISTRATION → CONFIRM
════════════════════════════════════════════ */
// goToConfirm()/backToWelcome() removed — the name/university/college/
// department step no longer exists. Students go straight from login to
// the confirmPage (see the DOMContentLoaded handler below).

/* ════════════════════════════════════════════
   EXAM START
════════════════════════════════════════════ */
async function startExam() {
  const btn = document.activeElement;
  if (btn && btn.tagName === 'BUTTON') btn.disabled = true;
  try {
    await selectQs();
  } catch (e) {
    if (e.code === 'attempts_exhausted') {
      window.location.href = '/upgrade';
      return;
    }
    if (e.code === 'unauthorized') {
      window.location.href = '/login';
      return;
    }
    console.error('startExam failed:', e);
    alert('تعذّر بدء الامتحان. ' + (humanError(e) || 'حاول مرة أخرى.'));
    if (btn) btn.disabled = false;
    return;
  }
  document.getElementById('confirmPage').classList.add('hidden');
  document.getElementById('examPage').classList.remove('hidden');
  if (btn) btn.disabled = false; // re-enable for next time (e.g. after a retry)
  started = true; sTime = new Date();
  renderQ(); renderGrid(); updateProg(); startTimer();
  window.scrollTo(0,0);
}

/* ════════════════════════════════════════════
   TIMER
════════════════════════════════════════════ */
function startTimer() {
  tI = setInterval(() => {
    tR--;
    updateTimer();
    if (tR <= 0) { clearInterval(tI); playSound('tout'); submitExam(true) }
  }, 1000);
}
function updateTimer() {
  const m = Math.floor(tR/60), s = tR%60;
  document.getElementById('timerDisplay').textContent =
    String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
  const box = document.getElementById('timerBox');
  box.classList.remove('warn','danger');
  if (tR <= 300) box.classList.add('danger');
  else if (tR <= 600) box.classList.add('warn');
}

/* ════════════════════════════════════════════
   RENDER QUESTION
════════════════════════════════════════════ */
function renderQ() {
  const q = qs[cQ];
  const card = document.getElementById('questionCard');
  if (!q) { card.innerHTML = '<div style="color:var(--text-muted);text-align:right">لا توجد أسئلة.</div>'; return }

  const keys = ['A','B','C','D'];
  let optHTML = '';
  for (let i = 0; i < 4; i++) {
    const sel = uA[cQ] === i ? 'selected' : '';
    optHTML += `
      <div class="option ${sel}" data-opt="${i}">
        <div class="option-key">${keys[i]}</div>
        <div class="option-text">${esc(q.options[i])}</div>
        <div class="option-check">
          <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
      </div>`;
  }

  let passageHTML = '';
  if (q.section === 'Reading Comprehension') {
    const readingQs = qs.filter(x => x.section === 'Reading Comprehension');
    const posInSection = qs.slice(0, cQ).filter(x => x.section === 'Reading Comprehension').length + 1;
    passageHTML = `
      <div class="reading-passage">
        <div class="passage-label">
          <span class="passage-label-text"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> نص القراءة <span class="passage-progress en">${posInSection}/${readingQs.length}</span></span>
          <button type="button" class="passage-toggle">${passageOpen ? 'إخفاء النص ▲' : 'عرض النص ▼'}</button>
        </div>
        <div class="passage-body${passageOpen ? '' : ' collapsed'}">${esc(passage)}</div>
      </div>`;
  }

  const sk = secKey(q.section);
  const badgeColor = sk ? sColors[sk] : 'var(--text-secondary)';
  card.innerHTML = `
    <div class="question-meta">
      <div class="section-badge" style="background:${badgeColor}1a;border-color:${badgeColor}40;color:${badgeColor}">${sk ? sIcons[sk] + ' ' + sNames[sk] : esc(q.section)}</div>
      <div class="question-counter en">${cQ+1} / ${total()}</div>
    </div>
    ${passageHTML}
    <div class="question-text">${esc(q.question)}</div>
    <div class="options-list">${optHTML}</div>`;

  // Keep the header's section indicator in sync with the question on screen.
  const indicator = document.getElementById('sectionIndicator');
  if (indicator) {
    indicator.className = 'section-indicator show';
    indicator.style.background = `${badgeColor}1a`;
    indicator.style.borderColor = `${badgeColor}40`;
    indicator.style.color = badgeColor;
    indicator.innerHTML = sk ? `${sIcons[sk]} ${sNames[sk]}` : esc(q.section);
  }

  // Nav buttons
  const prev = document.getElementById('prevBtn');
  const next = document.getElementById('nextBtn');
  prev.disabled = cQ === 0;

  if (cQ === total()-1) {
    next.innerHTML = `<span>إنهاء</span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7" transform="scale(-1,1) translate(-24,0)"/></svg>`;
    next.className = 'btn btn-success';
    next.onclick = showSubmitModal;
  } else {
    next.innerHTML = `<span>التالي</span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>`;
    next.className = 'btn btn-ghost';
    next.onclick = goToNext;
  }
  // Presentation only: slide the card when navigating between questions.
  if (navDir) {
    card.classList.remove('slide-next', 'slide-prev');
    void card.offsetWidth; // restart the animation
    card.classList.add(navDir > 0 ? 'slide-next' : 'slide-prev');
    navDir = 0;
  }

  renderGrid();
}

function selAns(i) {
  playSound('sel'); uA[cQ] = i;
  renderQ(); updateProg(); renderGrid();
}
function togglePassage() {
  passageOpen = !passageOpen;
  renderQ();
}
function goToNext() {
  playSound('next');
  if (cQ < total()-1) { navDir = 1; cQ++; renderQ() } else showSubmitModal();
}
function goToPrevious() {
  playSound('prev');
  if (cQ > 0) { navDir = -1; cQ--; renderQ() }
}
function goToQuestion(i) { navDir = i > cQ ? 1 : i < cQ ? -1 : 0; cQ = i; renderQ() }

function renderGrid() {
  const g = document.getElementById('questionGrid');
  let h = '';
  for (let i = 0; i < total(); i++) {
    let cls = 'grid-cell';
    if (i === cQ) cls += ' current';
    if (uA[i] !== null) cls += ' answered';
    h += `<div class="${cls}" data-q="${i}" title="سؤال ${i+1}">${i+1}</div>`;
  }
  g.innerHTML = h;
}

function updateProg() {
  const answered = uA.filter(x => x !== null).length;
  const pct = Math.round(answered / total() * 100);
  document.getElementById('progressFill').style.width = pct + '%';
  document.getElementById('progressValue').textContent = pct + '%';
  let mh = '';
  for (let i = 0; i < total(); i++) {
    mh += `<div class="mini-segment ${uA[i] !== null ? 'done' : 'empty'}"></div>`;
  }
  document.getElementById('sectionMiniBar').innerHTML = mh;
}

/* ════════════════════════════════════════════
   NUMBER COUNT-UP (presentation only)
   Animates a value the server already returned up to its exact final
   figure. Nothing here computes or alters a score.
════════════════════════════════════════════ */
function countUp(el, to, decimals, suffix) {
  if (!el) return;
  const sfx = suffix || '';
  const fmt = v => v.toFixed(decimals) + sfx;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    el.textContent = fmt(to);
    return;
  }
  const dur = 700, t0 = performance.now();
  (function step(now) {
    const p = Math.min(1, (now - t0) / dur);
    el.textContent = fmt(to * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(step); else el.textContent = fmt(to);
  })(t0);
}

/* ════════════════════════════════════════════
   MODAL
════════════════════════════════════════════ */
function showSubmitModal() {
  const answered = uA.filter(x => x !== null).length;
  document.getElementById('modalAnswered').textContent = answered;
  document.getElementById('modalUnanswered').textContent = total() - answered;
  document.getElementById('submitModal').classList.remove('hidden');
}
function closeSubmitModal() {
  document.getElementById('submitModal').classList.add('hidden');
}

/* ════════════════════════════════════════════
   SUBMIT & RESULTS
════════════════════════════════════════════ */
async function submitExam(auto) {
  // Only the timer running out submits automatically, and it says so with
  // a literal true. Anything else — a click handler handing over its event,
  // say — is a student pressing the button.
  auto = auto === true;
  if (submitted) return;
  submitted = true;
  if (tI) clearInterval(tI);
  playSound('sub');

  // Grading happens on the server against the questions actually served
  // for this attempt — the browser only sends which option index was
  // picked per question id, never a computed score.
  const answers = qs.map((q, i) => ({ question_id: q.id, selected: uA[i] }));
  let grade;
  try {
    grade = await ExamAPI.submitExam(currentAttemptId, answers);
  } catch (e) {
    submitted = false;
    if (tR > 0 && !auto) startTimer();
    console.error('submitExam failed:', e);
    alert('تعذّر إرسال الامتحان. ' + (humanError(e) || 'تحقّق من اتصالك وحاول مرة أخرى.')
          + '\n\nإجاباتك محفوظة — أعد المحاولة من نفس النافذة.');
    return;
  }

  // Merge correct answers back into qs for the review page.
  const byId = new Map(grade.review.map(r => [r.id, r]));
  qs = qs.map(q => {
    const r = byId.get(q.id);
    return r ? { ...q, correctAnswer: r.correct_answer } : q;
  });

  const { correct, wrong, score, pct, passed, section_stats: ss } = grade;
  res = {correct, wrong, score, pct, passed};

  const end = new Date(), tk = Math.floor((end - sTime)/1000);
  const tm = Math.floor(tk/60), ts = tk%60;

  document.getElementById('examPage').classList.add('hidden');
  document.getElementById('submitModal').classList.add('hidden');
  document.getElementById('resultsPage').classList.remove('hidden');

  document.getElementById('resStudentName').textContent = sInfo.name;
  document.getElementById('resStudentMeta').textContent =
    sInfo.university + ' · ' + sInfo.college + ' · ' + sInfo.department;

  const ic = document.getElementById('resultIcon');
  if (passed) {
    ic.innerHTML = '<svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.801 10A10 10 0 1 1 17 3.335"/><path d="m9 11 3 3L22 4"/></svg>';
    ic.className = 'result-icon pass';
    document.getElementById('resultTitle').textContent = 'تهانينا! لقد نجحت!';
    document.getElementById('resultSubtitle').textContent = 'أداء رائع! لقد اجتزت الامتحان بنجاح.';
  } else {
    ic.innerHTML = '<svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.02"/></svg>';
    ic.className = 'result-icon fail';
    document.getElementById('resultTitle').textContent = 'حاول مرة أخرى!';
    document.getElementById('resultSubtitle').textContent = 'لم تنجح هذه المرة. راجع دروسك وحاول مجدداً.';
  }
  document.getElementById('autoSubmitNote').classList.toggle('hidden', !auto);

  countUp(document.getElementById('scoreNumber'), score, 1);
  countUp(document.getElementById('correctCount'), correct, 0);
  countUp(document.getElementById('wrongCount'), wrong, 0);
  countUp(document.getElementById('percentage'), pct, 1, '%');
  document.getElementById('timeTaken').textContent =
    String(tm).padStart(2,'0') + ':' + String(ts).padStart(2,'0');

  // Animate ring — r=85, circumference = 2π×85 = 534.07
  const circ = document.getElementById('scoreCircleProgress');
  setTimeout(() => {
    circ.style.strokeDashoffset = 534.07 * (1 - pct/100);
  }, 300);

  // Section performance cards
  const entries = Object.entries(ss);
  let spH = '';
  for (let i = 0; i < entries.length; i++) {
    const [sec, st] = entries[i];
    const p = Math.round(st.c / st.t * 100);
    const col = secKey(sec) ? sColors[sec] : 'var(--text-secondary)';
    spH += `
      <div class="section-card">
        <div class="section-card-top">
          <div class="section-name">${secKey(sec) ? sIcons[sec] + ' ' + sNames[sec] : esc(sec)}</div>
          <div class="section-score-chip">${st.c}/${st.t}</div>
        </div>
        <div class="section-bar">
          <div class="section-fill" id="secbar${i}" style="width:0%;background:${col}"></div>
        </div>
      </div>`;
  }
  document.getElementById('sectionPerformance').innerHTML = spH;
  setTimeout(() => {
    for (let i = 0; i < entries.length; i++) {
      const st = entries[i][1];
      document.getElementById('secbar'+i).style.width = (st.c/st.t*100) + '%';
    }
  }, 700);

  setTimeout(() => playSound('res'), 800);
  window.scrollTo(0,0);
}

/* ════════════════════════════════════════════
   REVIEW
════════════════════════════════════════════ */
function showReviewPage() {
  document.getElementById('resultsPage').classList.add('hidden');
  document.getElementById('reviewPage').classList.remove('hidden');
  document.getElementById('reviewCorrect').textContent = res.correct;
  document.getElementById('reviewWrong').textContent = res.wrong;
  document.getElementById('reviewScore').textContent = res.score.toFixed(1);

  const keys = ['A','B','C','D'];
  let h = '';
  for (let i = 0; i < total(); i++) {
    const q = qs[i], ua = uA[i], ca = q.correctAnswer;
    const isCor = ua === ca, isUna = ua === null;
    const cls = isCor ? 'correct' : (isUna ? 'unanswered' : 'wrong');
    const badge = isCor
      ? '<div class="badge badge-success"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21.801 10A10 10 0 1 1 17 3.335"/><path d="m9 11 3 3L22 4"/></svg> صحيحة</div>'
      : (isUna ? '<div class="badge badge-muted"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg> لم يُجب</div>' : '<div class="badge badge-danger"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg> خاطئة</div>');

    let optH = '';
    for (let j = 0; j < 4; j++) {
      let optCls = 'review-option';
      let lbl = keys[j];
      if (j === ca) { optCls += ' correct-answer'; lbl += ' <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px"><polyline points="20 6 9 17 4 12"/></svg>' }
      else if (j === ua && !isCor) { optCls += ' wrong-selected'; lbl += ' <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' }
      optH += `<div class="${optCls}"><span class="review-opt-key">${lbl}</span><span>${esc(q.options[j])}</span></div>`;
    }

    h += `
      <div class="review-question ${cls}">
        <div class="review-q-header">
          <span class="review-q-number">سؤال ${i+1} — ${secKey(q.section) ? sNames[q.section] : esc(q.section)}</span>
          ${badge}
        </div>
        <div class="review-q-text">${esc(q.question)}</div>
        <div class="review-options">${optH}</div>
      </div>`;
  }
  document.getElementById('reviewQuestions').innerHTML = h;
  window.scrollTo(0,0);
}

function backToResults() {
  document.getElementById('reviewPage').classList.add('hidden');
  document.getElementById('resultsPage').classList.remove('hidden');
}

async function restartExam() {
  playSound('next');

  // Free users only get one attempt — send them to the payment page
  // instead of letting them retry.
  let status;
  try { status = await ExamAPI.getStatus(); } catch { status = null; }
  if (!status || !status.premium) {
    window.location.href = '/upgrade';
    return;
  }

  resetState();
  ['resultsPage','reviewPage','examPage','confirmPage'].forEach(id =>
    document.getElementById(id).classList.add('hidden'));
  document.getElementById('submitModal').classList.add('hidden');
  document.getElementById('confirmPage').classList.remove('hidden');
  const startBtn = document.getElementById('btnStartExam');
  if (startBtn) startBtn.disabled = false; // guard against it ever getting stuck
  document.getElementById('timerDisplay').textContent = '60:00';
  document.getElementById('timerBox').classList.remove('warn','danger');
  document.getElementById('autoSubmitNote').classList.add('hidden');
  const sc = document.getElementById('scoreCircleProgress');
  if (sc) sc.style.strokeDashoffset = '534.07';
  window.scrollTo(0,0);
}

/* ════════════════════════════════════════════
   KEYBOARD NAVIGATION
════════════════════════════════════════════ */
document.addEventListener('keydown', e => {
  if (!started || submitted) return;
  if (e.key === 'ArrowLeft') { playSound('next'); goToNext() }
  if (e.key === 'ArrowRight') { playSound('prev'); goToPrevious() }
  if (e.key >= '1' && e.key <= '4') { playSound('sel'); selAns(parseInt(e.key)-1) }
  if (e.key === 'Enter' && cQ === total()-1) showSubmitModal();
  if (e.key === 'Escape') closeSubmitModal();
});

window.addEventListener('beforeunload', e => {
  if (started && !submitted) {
    e.preventDefault();
    e.returnValue = 'أنت في منتصف الاختبار.';
  }
});

/* ════════════════════════════════════════════
   RIPPLE EFFECT
════════════════════════════════════════════ */
document.addEventListener('click', e => {
  const btn = e.target.closest('.btn');
  if (!btn) return;
  const r = document.createElement('span');
  r.className = 'ripple';
  const rect = btn.getBoundingClientRect();
  const sz = Math.max(rect.width, rect.height);
  r.style.cssText = `width:${sz}px;height:${sz}px;left:${e.clientX-rect.left-sz/2}px;top:${e.clientY-rect.top-sz/2}px`;
  btn.appendChild(r);
  setTimeout(() => r.remove(), 600);
});

/* ════════════════════════════════════════════
   INIT
════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {
  loadTheme();
  loadSound();

  // Auth guard: this page requires a signed-in user. A visitor with no
  // session now meets the welcome screen first, which hands off to
  // /login; a signed-in user carries straight on as before.
  const hasSession = await ExamAPI.getSession();
  if (!hasSession) { window.location.href = '/welcome'; return; }

  // (top-left floating sign-out button removed — the sign-out button next
  // to "ابدأ الامتحان" on the confirm page is the only one now)

  // Skip the name/university/college registration page entirely — go
  // straight to the exam instructions screen, greeting the student by name.
  //
  // Google hands the name back on the session we already hold, so this
  // costs no extra call. E-mail sign-ups carry no name, so fall back to the
  // part before the @, with its separators and digits read as word breaks.
  const session = await ExamAPI.getSession();
  const email = session?.user?.email || 'Student';
  const meta = session?.user?.user_metadata || {};
  const fullName = String(meta.full_name || meta.name || '').trim();
  const handle = (session?.user?.email || '').split('@')[0]
                   .replace(/[._+\-]+/g, ' ').replace(/\d+/g, ' ').trim();
  // The greeting wants one word; a certificate wants the whole name.
  const firstWord = (fullName || handle).split(/\s+/)[0] || '';
  const firstName = firstWord
        ? firstWord.charAt(0).toUpperCase() + firstWord.slice(1)
        : email;
  sInfo = { name: fullName || handle || email, university: '', college: '', department: '' };
  document.getElementById('confirmName').textContent = firstName;
  const boot = document.getElementById('bootSkeleton');
  if (boot) boot.remove();
  document.getElementById('confirmPage').classList.remove('hidden');

  // If we just came back from a successful Stripe checkout, let the user
  // know their premium unlock is active (webhook grants it asynchronously,
  // usually within a couple of seconds).
  if (new URLSearchParams(location.search).get('premium') === 'success') {
    setTimeout(() => alert('تم تفعيل الاشتراك المميز بنجاح! يمكنك الآن أداء عدد غير محدود من المحاولات.'), 400);
    history.replaceState({}, '', location.pathname);
  }
});

/* ── Event wiring ────────────────────────────────────────────────────────
   These were onclick= attributes in the markup. Bound here instead, the
   page's script-src no longer needs 'unsafe-inline', so an injected
   <script> or onerror= does not run at all — the escaping above stops the
   injection, and this stops anything that ever slips past it.
   Options and grid cells are redrawn on every question, so they are
   delegated to the containers, which are not. */
const on = (id, ev, fn) => {
  const el = document.getElementById(id);
  // This file is loaded after every element it binds. If markup ever moves
  // above it, say so rather than leaving a dead button that looks fine.
  if (!el) return console.error('[inelt] nothing to bind for #' + id);
  el.addEventListener(ev, fn);
};
on('themeToggle',       'click', toggleTheme);
on('dashSignOut',       'click', () => ExamAPI.signOut());
on('railSignOut',       'click', () => ExamAPI.signOut());
on('btnStartExam',      'click', startExam);
on('prevBtn',           'click', goToPrevious);
on('nextBtn',           'click', goToNext);
on('openSubmitBtn',     'click', showSubmitModal);
on('cancelSubmitBtn',   'click', closeSubmitModal);
on('confirmSubmitBtn',  'click', () => submitExam());   // not (submitExam): the
                                    // event object would arrive as `auto`
on('reviewBtn',         'click', showReviewPage);
on('backToResultsBtn',  'click', backToResults);
document.querySelectorAll('.restart-btn').forEach(b => b.addEventListener('click', restartExam));

document.getElementById('questionCard')?.addEventListener('click', e => {
  const opt = e.target.closest('.option[data-opt]');
  if (opt) return selAns(Number(opt.dataset.opt));
  if (e.target.closest('.passage-toggle')) return togglePassage();
});
document.getElementById('questionGrid')?.addEventListener('click', e => {
  const cell = e.target.closest('.grid-cell[data-q]');
  if (cell) goToQuestion(Number(cell.dataset.q));
});
