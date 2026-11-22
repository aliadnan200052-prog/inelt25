import type { ReactNode } from 'react';
import type { Dir, Exam, Item, Question, Variant } from '../types';
import {
  examTypeLabel,
  fmtNum,
  letter,
  marksText,
  optionLetter,
  questionDir,
  questionLabel,
  seededOrder,
} from '../model';

/* A paper is a list of groups (header, each question, closing).
   Each group is a list of segments – the smallest pieces the paginator may
   move to the next page. A question is only split between segments, and its
   heading always stays with what follows it. */

export interface Segment {
  key: string;
  node: ReactNode;
  keepWithNext?: boolean;
  gapBefore?: boolean;
  bottom?: boolean; // pinned to the bottom of the last page
}
export interface Group {
  key: string;
  segs: Segment[];
}

export const LABELS = {
  ar: {
    subject: 'المادة',
    grade: 'الصف',
    date: 'التاريخ',
    duration: 'الزمن',
    total: 'الدرجة الكلية',
    year: 'العام الدراسي',
    teacher: 'مدرس المادة',
    name: 'اسم الطالب',
    section: 'الشعبة',
    score: 'الدرجة',
    page: 'الصفحة',
    of: 'من',
    cont: 'يتبع',
    key: 'نموذج الإجابة',
    teacherCopy: 'نسخة المدرس',
    colA: 'العمود (أ)',
    colB: 'العمود (ب)',
    answer: 'الإجابة',
    instructions: 'تعليمات',
    trueW: 'صح',
    falseW: 'خطأ',
  },
  en: {
    subject: 'Subject',
    grade: 'Class',
    date: 'Date',
    duration: 'Time',
    total: 'Total marks',
    year: 'Academic year',
    teacher: 'Teacher',
    name: 'Name',
    section: 'Section',
    score: 'Score',
    page: 'Page',
    of: 'of',
    cont: 'Continued',
    key: 'Answer Key',
    teacherCopy: "Teacher's copy",
    colA: 'Column (A)',
    colB: 'Column (B)',
    answer: 'Answer',
    instructions: 'Instructions',
    trueW: 'True',
    falseW: 'False',
  },
};
export type Labels = (typeof LABELS)['ar'];

const EASTERN = '٠١٢٣٤٥٦٧٨٩';
export function makeDigits(exam: Exam) {
  return (s: string, dir: Dir) =>
    exam.design.digits === 'eastern' && dir === 'rtl' ? s.replace(/\d/g, (d) => EASTERN[+d]) : s;
}

/* ─── Text with blanks ─── */

const BLANK_RE = /(\.{3,}|…+|_{3,})/g;
const HAS_BLANK = /(\.{3,}|…+|_{3,})/;

export function RichText({ text, answer }: { text: string; answer?: string }) {
  if (!text) return null;
  const parts = text.split(BLANK_RE);
  const answers = answer ? answer.split(/[|،,]\s*/) : [];
  let b = 0;
  return (
    <bdi className="rt">
      {parts.map((p, i) => {
        if (i % 2 === 1) {
          const len = p.length;
          const fill = answers[b++];
          const w = Math.min(Math.max(len * 0.45, 4), 20);
          return (
            <span key={i} className={'blank' + (fill ? ' filled' : '')} style={{ minWidth: `${w}em` }}>
              {fill || ' '}
            </span>
          );
        }
        return p;
      })}
    </bdi>
  );
}

function Lines({ n }: { n: number }) {
  if (!n) return null;
  return (
    <div className="ans-lines">
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="ans-line" />
      ))}
    </div>
  );
}

/* ─── Header ─── */

function Header({ exam, variant, L, dir }: { exam: Exam; variant: Variant; L: Labels; dir: Dir }) {
  const { info, header: h } = exam;
  const lang = dir === 'rtl' ? 'ar' : 'en';
  const digits = makeDigits(exam);
  const show = (k: keyof typeof h.show, v: string | number | null) =>
    h.show[k] && v !== null && v !== undefined && String(v).trim() !== '';
  const type = examTypeLabel(exam, lang);
  const titleLine = variant === 'key' ? L.key : type;

  const metaPairs: [string, string][] = [];
  if (show('subject', info.subject)) metaPairs.push([L.subject, info.subject]);
  if (show('grade', info.grade)) metaPairs.push([L.grade, info.grade]);
  if (show('date', info.date)) metaPairs.push([L.date, info.date]);
  if (show('duration', info.duration)) metaPairs.push([L.duration, info.duration]);
  if (show('totalMarks', info.totalMarks)) metaPairs.push([L.total, digits(fmtNum(info.totalMarks!), dir)]);
  if (show('teacher', info.teacher)) metaPairs.push([L.teacher, info.teacher]);

  const logo =
    h.show.logo && h.logo ? (
      <img className="hdr-logo" src={h.logo} style={{ height: `${h.logoHeight}mm` }} alt="" />
    ) : null;

  const authority = show('authority', info.authority) ? (
    <div className="hdr-authority">{info.authority}</div>
  ) : null;
  const school = show('school', info.school) ? <div className="hdr-school">{info.school}</div> : null;
  const title =
    (variant === 'key' || h.show.examType) && titleLine ? <div className="hdr-title">{titleLine}</div> : null;
  const year = show('year', info.year) ? (
    <div className="hdr-year">
      {L.year}: {info.year}
    </div>
  ) : null;
  const badge = variant === 'teacher' ? <div className="hdr-badge">{L.teacherCopy}</div> : null;

  const kv = ([k, v]: [string, string]) => (
    <div className="kv" key={k}>
      <span className="k">{k}:</span> <span className="v">{v}</span>
    </div>
  );

  let body: ReactNode;
  if (h.layout === 'classic') {
    const startCol = [authority, school].filter(Boolean);
    const half = Math.max(0, Math.ceil((metaPairs.length + startCol.length) / 2) - startCol.length);
    const startMeta = metaPairs.slice(0, half);
    const endMeta = metaPairs.slice(half);
    const center = (
      <div className="hdr-c center">
        {h.logoPosition === 'center' && logo}
        {title}
        {year}
        {badge}
      </div>
    );
    body = (
      <div className={'hdr-classic logo-' + h.logoPosition}>
        {h.logoPosition === 'start' && logo && <div className="hdr-c logo-cell">{logo}</div>}
        <div className="hdr-c start">
          {startCol}
          {startMeta.map(kv)}
        </div>
        {center}
        <div className="hdr-c end">{endMeta.map(kv)}</div>
        {h.logoPosition === 'end' && logo && <div className="hdr-c logo-cell">{logo}</div>}
      </div>
    );
  } else if (h.layout === 'centered') {
    body = (
      <div className={'hdr-centered align-' + h.titleAlign}>
        {logo && <div className={'logo-row align-' + h.logoPosition}>{logo}</div>}
        {authority}
        {school}
        {title}
        {year}
        {badge}
        {metaPairs.length > 0 && (
          <div className="meta-row">
            {metaPairs.map(([k, v]) => (
              <span key={k} className="meta">
                <span className="k">{k}:</span> <span className="v">{v}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    );
  } else {
    body = (
      <div className="hdr-boxed">
        <div className={'boxed-top logo-' + h.logoPosition}>
          {logo && <div className="logo-cell">{logo}</div>}
          <div className={'boxed-titles align-' + h.titleAlign}>
            {authority}
            {school}
            {title}
            {year}
            {badge}
          </div>
        </div>
        {metaPairs.length > 0 && (
          <div className="boxed-grid" style={{ gridTemplateColumns: `repeat(${Math.min(3, metaPairs.length)}, 1fr)` }}>
            {metaPairs.map(kv)}
          </div>
        )}
      </div>
    );
  }

  const student =
    variant !== 'key' && (h.studentName || h.studentSection || h.scoreBox) ? (
      <div className="student-row">
        {h.studentName && (
          <div className="sf grow">
            <span>{L.name}:</span>
            <span className="fill" />
          </div>
        )}
        {h.studentSection && (
          <div className="sf">
            <span>{L.section}:</span>
            <span className="fill short" />
          </div>
        )}
        {h.scoreBox && (
          <div className="sf score">
            <span>{L.score}:</span>
            <span className="box">
              <span className="fill tiny" />
              {info.totalMarks ? <span> / {digits(fmtNum(info.totalMarks), dir)}</span> : null}
            </span>
          </div>
        )}
      </div>
    ) : null;

  return (
    <div className={'hdr border-' + h.border} dir={dir}>
      {body}
      <div className="hdr-rule" />
      {student}
    </div>
  );
}

/* ─── Questions ─── */

interface Ctx {
  exam: Exam;
  variant: Variant;
  digits: (s: string, d: Dir) => string;
}

function itemLabel(q: Question, i: number, dir: Dir, ctx: Ctx) {
  if (q.numbering === 'none') return null;
  const s = q.numbering === 'letters' ? letter(i, dir) : String(i + 1);
  const sep = q.numbering === 'letters' && dir === 'ltr' ? ')' : q.numbering === 'numbers' && dir === 'ltr' ? '.' : '-';
  return <span className="it-lbl">{ctx.digits(s, dir) + sep}</span>;
}

function optionCols(q: Question, item: Item): number {
  if (q.optionCols) return q.optionCols;
  const max = Math.max(0, ...item.options.map((o) => o.length));
  const n = item.options.length;
  if (max <= 14 && n <= 4) return n;
  if (max <= 32) return 2;
  return 1;
}

function questionSegments(q: Question, n: number, ctx: Ctx): Segment[] {
  const { exam, variant } = ctx;
  const d = exam.design;
  const dir = questionDir(q, d.lang);
  const Lq = LABELS[dir === 'rtl' ? 'ar' : 'en'];
  const teacher = variant === 'teacher';
  const showMarks = (variant !== 'student' || d.showMarksStudent) && q.marks != null && q.marks > 0;
  const segs: Segment[] = [];
  const k = (s: string) => `${q.id}:${s}`;

  segs.push({
    key: k('head'),
    keepWithNext: true,
    gapBefore: n > 1,
    node: (
      <div className={'q-head' + (d.qDividers && n > 1 ? ' divided' : '')} dir={dir}>
        <div className="q-title">
          <span className="q-num">
            {ctx.digits(questionLabel(n, dir, d.qNumberStyle), dir)}
            {d.qNumberStyle === 'number' ? (dir === 'rtl' ? '- ' : '. ') : ': '}
          </span>
          <RichText text={q.title} />
        </div>
        {showMarks && <div className="q-marks">({ctx.digits(marksText(q.marks!, dir), dir)})</div>}
        {q.instructions.trim() && <div className="q-instr">{q.instructions}</div>}
      </div>
    ),
  });

  if (q.passage.trim()) {
    segs.push({
      key: k('passage'),
      keepWithNext: true,
      node: (
        <div className="q-passage" dir={dir}>
          {q.passage}
        </div>
      ),
    });
  }
  if (q.image) {
    segs.push({
      key: k('img'),
      keepWithNext: q.type !== 'open',
      node: (
        <div className={'q-img align-' + q.image.align} dir={dir}>
          <img src={q.image.src} style={{ width: `${q.image.width}%` }} alt="" />
        </div>
      ),
    });
  }

  const answerLine = (a: string) =>
    teacher && a.trim() ? (
      <div className="t-answer">
        {Lq.answer}: {a}
      </div>
    ) : null;

  switch (q.type) {
    case 'open': {
      segs.push({
        key: k('open'),
        node: (
          <div className="it-open" dir={dir}>
            {teacher && q.modelAnswer.trim() ? answerLine(q.modelAnswer) : <Lines n={q.answerLines} />}
          </div>
        ),
      });
      break;
    }
    case 'mcq': {
      q.items.forEach((it, i) => {
        const cols = optionCols(q, it);
        segs.push({
          key: k(it.id),
          node: (
            <div className="it it-mcq" dir={dir}>
              {itemLabel(q, i, dir, ctx)}
              <div className="it-body">
                <RichText text={it.text} />
                <div className="opts" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
                  {it.options.map((o, oi) => (
                    <div key={oi} className={'opt' + (teacher && it.correct === oi ? ' correct' : '')}>
                      <span className="opt-lbl">
                        {ctx.digits(optionLetter(oi, dir, d.optionLabels), dir)}
                        {dir === 'rtl' ? '-' : ')'}
                      </span>{' '}
                      <bdi>{o}</bdi>
                      {teacher && it.correct === oi && <span className="tick"> ✓</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ),
        });
      });
      break;
    }
    case 'truefalse': {
      q.items.forEach((it, i) => {
        segs.push({
          key: k(it.id),
          node: (
            <div className="it it-tf" dir={dir}>
              {itemLabel(q, i, dir, ctx)}
              <div className="it-body">
                <RichText text={it.text} />
              </div>
              <span className="tf-box">
                ({' '}
                {teacher && it.tf != null ? (it.tf ? '✓' : '✗') : ' '}
                {' '})
              </span>
            </div>
          ),
        });
      });
      break;
    }
    case 'match': {
      const lefts = q.pairs.filter((p) => p.left.trim());
      const rightsRaw = q.pairs.filter((p) => p.right.trim());
      const order = seededOrder(rightsRaw.length, q.seed);
      const rights = order.map((i) => rightsRaw[i]);
      const rows = Math.max(lefts.length, rights.length);
      segs.push({
        key: k('mhead'),
        keepWithNext: true,
        node: (
          <div className="m-row m-head" dir={dir}>
            <div>{Lq.colA}</div>
            <div>{Lq.colB}</div>
          </div>
        ),
      });
      for (let r = 0; r < rows; r++) {
        const L = lefts[r];
        const R = rights[r];
        const ansIdx = L ? rights.findIndex((x) => x.id === L.id) : -1;
        segs.push({
          key: k('m' + r),
          node: (
            <div className="m-row" dir={dir}>
              <div className="m-cell">
                {L && (
                  <>
                    <span className="it-lbl">{ctx.digits(String(r + 1), dir) + (dir === 'rtl' ? '-' : '.')}</span>
                    <bdi className="m-text">{L.left}</bdi>
                    <span className="tf-box">
                      ({' '}
                      {teacher && ansIdx >= 0 ? letter(ansIdx, dir) : ' '}
                      {' '})
                    </span>
                  </>
                )}
              </div>
              <div className="m-cell">
                {R && (
                  <>
                    <span className="it-lbl">{letter(r, dir) + (dir === 'rtl' ? '-' : ')')}</span>
                    <bdi className="m-text">{R.right}</bdi>
                  </>
                )}
              </div>
            </div>
          ),
        });
      }
      break;
    }
    default: {
      // answer / fill / complete / translate / passage / grammar
      const blanksInline = q.type === 'fill' || q.type === 'complete';
      q.items.forEach((it, i) => {
        segs.push({
          key: k(it.id),
          node: (
            <div className="it" dir={dir}>
              {itemLabel(q, i, dir, ctx)}
              <div className="it-body">
                <RichText text={it.text} answer={teacher && blanksInline ? it.answer : undefined} />
                {teacher && it.answer.trim() ? (
                  blanksInline && HAS_BLANK.test(it.text) ? null : answerLine(it.answer)
                ) : (
                  <Lines n={q.answerLines} />
                )}
              </div>
            </div>
          ),
        });
      });
    }
  }
  return segs;
}

/* ─── Answer key ─── */

function keySegments(q: Question, n: number, ctx: Ctx): Segment[] {
  const d = ctx.exam.design;
  const dir = questionDir(q, d.lang);
  const Lq = LABELS[dir === 'rtl' ? 'ar' : 'en'];
  const k = (s: string) => `${q.id}:key:${s}`;
  const head: Segment = {
    key: k('head'),
    keepWithNext: true,
    gapBefore: n > 1,
    node: (
      <div className="q-head" dir={dir}>
        <div className="q-title">
          <span className="q-num">{ctx.digits(questionLabel(n, dir, d.qNumberStyle), dir)}</span>
        </div>
        {q.marks ? <div className="q-marks">({ctx.digits(marksText(q.marks, dir), dir)})</div> : null}
      </div>
    ),
  };
  const lbl = (i: number) =>
    q.numbering === 'letters' ? letter(i, dir) : ctx.digits(String(i + 1), dir);
  const missing = '—';
  let body: ReactNode;
  if (q.type === 'mcq' || q.type === 'truefalse') {
    body = (
      <div className="key-grid" dir={dir}>
        {q.items.map((it, i) => (
          <div key={it.id} className="key-cell">
            <span className="it-lbl">{lbl(i)}-</span>{' '}
            <b>
              {q.type === 'mcq'
                ? it.correct != null
                  ? optionLetter(it.correct, dir, d.optionLabels) +
                    (it.options[it.correct] && it.options[it.correct].length <= 18 ? ` (${it.options[it.correct]})` : '')
                  : missing
                : it.tf == null
                  ? missing
                  : it.tf
                    ? `✓ ${Lq.trueW}`
                    : `✗ ${Lq.falseW}`}
            </b>
          </div>
        ))}
      </div>
    );
  } else if (q.type === 'match') {
    const lefts = q.pairs.filter((p) => p.left.trim());
    const rightsRaw = q.pairs.filter((p) => p.right.trim());
    const rights = seededOrder(rightsRaw.length, q.seed).map((i) => rightsRaw[i]);
    body = (
      <div className="key-grid" dir={dir}>
        {lefts.map((p, i) => {
          const ri = rights.findIndex((r) => r.id === p.id);
          return (
            <div key={p.id} className="key-cell">
              {ctx.digits(String(i + 1), dir)} {dir === 'rtl' ? '←' : '→'} <b>{ri >= 0 ? letter(ri, dir) : missing}</b>
            </div>
          );
        })}
      </div>
    );
  } else if (q.type === 'open') {
    body = (
      <div className="key-list" dir={dir}>
        {q.modelAnswer.trim() || missing}
      </div>
    );
  } else {
    body = (
      <div className="key-list" dir={dir}>
        {q.items.map((it, i) => (
          <div key={it.id} className="it">
            <span className="it-lbl">{lbl(i)}-</span>
            <div className="it-body">{it.answer.trim() || missing}</div>
          </div>
        ))}
      </div>
    );
  }
  return [head, { key: k('body'), node: body }];
}

/* ─── Build the whole paper ─── */

export function buildGroups(exam: Exam, variant: Variant): Group[] {
  const d = exam.design;
  const frameDir: Dir = d.lang === 'en' ? 'ltr' : 'rtl';
  const L = LABELS[frameDir === 'rtl' ? 'ar' : 'en'];
  const ctx: Ctx = { exam, variant, digits: makeDigits(exam) };
  const groups: Group[] = [];

  groups.push({
    key: 'header',
    segs: [{ key: 'header', node: <Header exam={exam} variant={variant} L={L} dir={frameDir} /> }],
  });

  if (variant !== 'key' && exam.info.generalInstructions.trim()) {
    groups.push({
      key: 'gi',
      segs: [
        {
          key: 'gi',
          node: (
            <div className="gen-instr" dir={frameDir}>
              <b>{L.instructions}: </b>
              {exam.info.generalInstructions}
            </div>
          ),
        },
      ],
    });
  }

  exam.questions.forEach((q, i) => {
    groups.push({
      key: q.id,
      segs: variant === 'key' ? keySegments(q, i + 1, ctx) : questionSegments(q, i + 1, ctx),
    });
  });

  const c = exam.closing;
  if (variant !== 'key' && c.enabled && (c.text.trim() || c.signature)) {
    const cdir = frameDir;
    groups.push({
      key: 'closing',
      segs: [
        {
          key: 'closing',
          bottom: c.position === 'bottom',
          gapBefore: true,
          node: (
            <div className="closing" dir={cdir}>
              {c.text.trim() && (
                <div
                  className={'closing-text align-' + c.align}
                  style={{ fontSize: `${c.size}pt` }}
                >
                  <bdi>{c.text}</bdi>
                </div>
              )}
              {c.signature && (
                <div className="signature">
                  <span>{L.teacher}: </span>
                  {exam.info.teacher.trim() ? <b>{exam.info.teacher}</b> : <span className="fill sig" />}
                </div>
              )}
            </div>
          ),
        },
      ],
    });
  }
  return groups;
}
