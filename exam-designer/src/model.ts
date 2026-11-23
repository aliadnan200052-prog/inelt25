import type {
  Dir,
  Exam,
  ExamTypeKey,
  Item,
  Pair,
  Question,
  QuestionType,
} from './types';

export const uid = () =>
  Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);

/* ─── Question types ─── */

export interface TypeMeta {
  label: string;
  group: 'essay' | 'objective';
  hint: string;
  titleAr: string;
  titleEn: string;
  answerLines: number;
  numbering: Question['numbering'];
}

export const TYPE_META: Record<QuestionType, TypeMeta> = {
  answer: {
    label: 'أجب عن الأسئلة',
    group: 'essay',
    hint: 'فروع يُجاب عنها كتابةً',
    titleAr: 'أجب عن الأسئلة التالية:',
    titleEn: 'Answer the following questions:',
    answerLines: 0,
    numbering: 'letters',
  },
  fill: {
    label: 'املأ الفراغات',
    group: 'essay',
    hint: 'اكتب ... أو ___ مكان الفراغ',
    titleAr: 'املأ الفراغات الآتية بما يناسبها:',
    titleEn: 'Fill in the blanks:',
    answerLines: 0,
    numbering: 'letters',
  },
  complete: {
    label: 'أكمل الجمل',
    group: 'essay',
    hint: 'جمل ناقصة يكملها الطالب',
    titleAr: 'أكمل الجمل الآتية:',
    titleEn: 'Complete the following sentences:',
    answerLines: 0,
    numbering: 'letters',
  },
  truefalse: {
    label: 'صح أو خطأ',
    group: 'objective',
    hint: 'عبارات مع قوسين للإجابة',
    titleAr: 'ضع علامة (✓) أمام العبارة الصحيحة وعلامة (✗) أمام العبارة الخاطئة:',
    titleEn: 'Put (✓) for the correct statement and (✗) for the wrong one:',
    answerLines: 0,
    numbering: 'numbers',
  },
  match: {
    label: 'صل بين العمودين',
    group: 'objective',
    hint: 'عمودان يُخلط ترتيب الثاني تلقائياً',
    titleAr: 'صل بين العمود (أ) وما يناسبه من العمود (ب):',
    titleEn: 'Match column (A) with column (B):',
    answerLines: 0,
    numbering: 'numbers',
  },
  translate: {
    label: 'ترجم',
    group: 'essay',
    hint: 'نصوص للترجمة مع أسطر للإجابة',
    titleAr: 'ترجم ما يأتي:',
    titleEn: 'Translate the following:',
    answerLines: 0,
    numbering: 'letters',
  },
  passage: {
    label: 'أسئلة القطعة',
    group: 'essay',
    hint: 'قطعة قراءة تتبعها أسئلة',
    titleAr: 'اقرأ القطعة الآتية ثم أجب عن الأسئلة التي تليها:',
    titleEn: 'Read the passage, then answer the questions:',
    answerLines: 0,
    numbering: 'letters',
  },
  grammar: {
    label: 'أسئلة القواعد',
    group: 'essay',
    hint: 'فروع نحوية أو لغوية',
    titleAr: 'أجب عمّا هو مطلوب بين القوسين:',
    titleEn: 'Do as required between brackets:',
    answerLines: 0,
    numbering: 'letters',
  },
  open: {
    label: 'إجابة مفتوحة',
    group: 'essay',
    hint: 'سؤال واحد مع مساحة للإجابة',
    titleAr: '',
    titleEn: '',
    answerLines: 0,
    numbering: 'none',
  },
  mcq: {
    label: 'اختيار من متعدد',
    group: 'objective',
    hint: 'سؤال وخيارات A B C D',
    titleAr: 'اختر الإجابة الصحيحة لكل مما يأتي:',
    titleEn: 'Choose the correct answer:',
    answerLines: 0,
    numbering: 'numbers',
  },
};

export const TYPE_ORDER: QuestionType[] = [
  'answer',
  'mcq',
  'fill',
  'complete',
  'truefalse',
  'match',
  'translate',
  'passage',
  'grammar',
  'open',
];

export const EXAM_TYPES: { key: ExamTypeKey; ar: string; en: string }[] = [
  { key: 'month1', ar: 'امتحان الشهر الأول', en: 'First Month Exam' },
  { key: 'month2', ar: 'امتحان الشهر الثاني', en: 'Second Month Exam' },
  { key: 'midyear', ar: 'امتحان نصف السنة', en: 'Mid-Year Exam' },
  { key: 'final', ar: 'امتحان نهاية السنة', en: 'Final Exam' },
  { key: 'daily', ar: 'امتحان يومي', en: 'Quiz' },
  { key: 'trial', ar: 'امتحان تجريبي', en: 'Mock Exam' },
  { key: 'other', ar: 'امتحان آخر', en: 'Exam' },
];

export const CLOSING_PRESETS = [
  'تمنياتي لكم بالتوفيق والنجاح',
  'مع أطيب التمنيات',
  'انتهت الأسئلة، مع تمنياتي لكم بالنجاح',
  'Good Luck',
  'Best Wishes',
];

export function newItem(optionCount = 4): Item {
  return {
    id: uid(),
    text: '',
    answer: '',
    options: Array.from({ length: optionCount }, () => ''),
    correct: null,
    tf: null,
  };
}

export const newPair = (): Pair => ({ id: uid(), left: '', right: '' });

export function newQuestion(type: QuestionType, lang: 'ar' | 'en' | 'mixed'): Question {
  const m = TYPE_META[type];
  const q: Question = {
    id: uid(),
    type,
    title: lang === 'en' ? m.titleEn : m.titleAr,
    instructions: '',
    marks: null,
    dir: 'inherit',
    passage: '',
    image: null,
    items: type === 'open' ? [] : [newItem()],
    pairs: type === 'match' ? [newPair(), newPair(), newPair()] : [],
    seed: Math.floor(Math.random() * 1e9),
    answerLines: m.answerLines,
    optionCount: 4,
    optionCols: 0,
    numbering: m.numbering,
    modelAnswer: '',
  };
  return q;
}

/** Ensure a question has everything its (possibly changed) type needs. */
export function retype(q: Question, type: QuestionType, lang: 'ar' | 'en' | 'mixed'): Question {
  const old = TYPE_META[q.type];
  const m = TYPE_META[type];
  const titleUnchanged = !q.title || q.title === old.titleAr || q.title === old.titleEn;
  return {
    ...q,
    type,
    title: titleUnchanged ? (lang === 'en' ? m.titleEn : m.titleAr) : q.title,
    answerLines: m.answerLines,
    numbering: m.numbering,
    items: type === 'open' ? q.items : q.items.length ? q.items : [newItem(q.optionCount)],
    pairs: type === 'match' && !q.pairs.length ? [newPair(), newPair(), newPair()] : q.pairs,
  };
}

export function newExam(): Exam {
  const now = Date.now();
  return {
    id: uid(),
    name: '',
    createdAt: now,
    updatedAt: now,
    info: {
      authority: '',
      school: '',
      subject: '',
      grade: '',
      teacher: '',
      examType: '',
      examTypeOther: '',
      year: academicYear(),
      date: '',
      duration: '',
      totalMarks: null,
      generalInstructions: '',
    },
    header: {
      layout: 'classic',
      show: {
        authority: true,
        school: true,
        subject: true,
        grade: true,
        teacher: false,
        examType: true,
        year: true,
        date: true,
        duration: true,
        totalMarks: true,
        logo: true,
      },
      logo: null,
      logoHeight: 20,
      logoPosition: 'center',
      titleAlign: 'center',
      border: 'double',
      studentName: true,
      studentSection: true,
      scoreBox: false,
    },
    questions: [],
    closing: {
      enabled: true,
      text: 'تمنياتي لكم بالتوفيق والنجاح',
      position: 'after',
      align: 'center',
      size: 12,
      signature: true,
    },
    design: {
      pageSize: 'A4',
      orientation: 'portrait',
      margins: { top: 12, bottom: 12, right: 14, left: 14 },
      arFont: 'Times New Roman',
      latinFont: 'Times New Roman',
      fontSize: 13,
      headingSize: 14,
      lineHeight: 1.55,
      colorMode: 'bw',
      accent: '#0f5a47',
      headingColor: '#0f5a47',
      dividerColor: '#0f5a47',
      lang: 'ar',
      copies: 'auto',
      cutLine: true,
      qDividers: false,
      showMarksStudent: true,
      pageNumbers: false,
      qNumberStyle: 'words',
      optionLabels: 'auto',
      digits: 'western',
      fitOnePage: true,
    },
  };
}

export function academicYear(d = new Date()) {
  const y = d.getFullYear();
  return d.getMonth() >= 7 ? `${y} - ${y + 1}` : `${y - 1} - ${y}`;
}

/** Fill in anything missing from older saved exams. */
export function normalizeExam(raw: Exam): Exam {
  const base = newExam();
  return {
    ...base,
    ...raw,
    info: { ...base.info, ...raw.info },
    header: { ...base.header, ...raw.header, show: { ...base.header.show, ...raw.header?.show } },
    closing: { ...base.closing, ...raw.closing },
    design: {
      ...base.design,
      ...raw.design,
      margins: { ...base.design.margins, ...raw.design?.margins },
    },
    questions: (raw.questions || []).map((q) => ({ ...newQuestion(q.type, 'ar'), ...q })),
  };
}

export function examTitle(e: Exam): string {
  if (e.name?.trim()) return e.name.trim();
  const t = examTypeLabel(e, 'ar');
  const parts = [e.info.subject, t, e.info.grade].filter(Boolean);
  return parts.length ? parts.join(' — ') : 'امتحان بلا عنوان';
}

export function examTypeLabel(e: Exam, lang: 'ar' | 'en'): string {
  const { examType, examTypeOther } = e.info;
  if (!examType) return '';
  if (examType === 'other') return examTypeOther.trim();
  const t = EXAM_TYPES.find((x) => x.key === examType);
  return t ? t[lang] : '';
}

export function marksSum(e: Exam): number {
  return e.questions.reduce((s, q) => s + (q.marks || 0), 0);
}

/* ─── Language helpers for the paper ─── */

const AR_RE = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/;
const LAT_RE = /[A-Za-z]/;

export function detectDir(text: string): Dir | null {
  for (const ch of text) {
    if (AR_RE.test(ch)) return 'rtl';
    if (LAT_RE.test(ch)) return 'ltr';
  }
  return null;
}

export function questionDir(q: Question, lang: 'ar' | 'en' | 'mixed'): Dir {
  if (q.dir !== 'inherit') return q.dir;
  if (lang === 'ar') return 'rtl';
  if (lang === 'en') return 'ltr';
  const sample = [q.title, q.passage, ...q.items.map((i) => i.text), ...q.pairs.map((p) => p.left)].join(' ');
  return detectDir(sample) || 'rtl';
}

export const AR_LETTERS = ['أ', 'ب', 'ج', 'د', 'هـ', 'و', 'ز', 'ح', 'ط', 'ي', 'ك', 'ل', 'م', 'ن', 'س', 'ع', 'ف', 'ص', 'ق', 'ر'];
const AR_ORDINALS = [
  'الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن', 'التاسع', 'العاشر',
  'الحادي عشر', 'الثاني عشر', 'الثالث عشر', 'الرابع عشر', 'الخامس عشر', 'السادس عشر', 'السابع عشر', 'الثامن عشر', 'التاسع عشر', 'العشرون',
];

export function letter(i: number, dir: Dir): string {
  if (dir === 'rtl') return AR_LETTERS[i] ?? String(i + 1);
  return String.fromCharCode(97 + (i % 26));
}

export function optionLetter(i: number, dir: Dir, style: 'auto' | 'latin' | 'arabic'): string {
  const ar = style === 'arabic' || (style === 'auto' && dir === 'rtl');
  return ar ? AR_LETTERS[i] ?? String(i + 1) : String.fromCharCode(65 + (i % 26));
}

export function questionLabel(n: number, dir: Dir, style: 'words' | 'short' | 'number'): string {
  if (dir === 'rtl') {
    if (style === 'words') return `السؤال ${AR_ORDINALS[n - 1] ?? n}`;
    if (style === 'short') return `س${n}`;
    return `${n}`;
  }
  if (style === 'words') return `Question ${n}`;
  if (style === 'short') return `Q${n}`;
  return `${n}`;
}

export function marksText(m: number, dir: Dir): string {
  const n = fmtNum(m);
  if (dir === 'ltr') return `${n} ${m === 1 ? 'mark' : 'marks'}`;
  if (m === 1) return 'درجة واحدة';
  if (m === 2) return 'درجتان';
  if (m >= 3 && m <= 10 && Number.isInteger(m)) return `${n} درجات`;
  return `${n} درجة`;
}

export const fmtNum = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0+$/, '').replace(/\.$/, ''));

/** Deterministic shuffle (mulberry32) – avoids the identity order when possible. */
export function seededOrder(n: number, seed: number): number[] {
  let s = seed >>> 0;
  const rnd = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  let best: number[] = [];
  for (let attempt = 0; attempt < 8; attempt++) {
    const a = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    best = a;
    if (n < 2 || a.filter((v, i) => v === i).length <= Math.floor(n / 3)) break;
  }
  return best;
}

/** Shuffle options of every MCQ item, keeping the correct answer attached. */
export function shuffleOptions(q: Question): Question {
  return {
    ...q,
    items: q.items.map((it) => {
      const opts = it.options.map((text, i) => ({ text, i }));
      for (let i = opts.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [opts[i], opts[j]] = [opts[j], opts[i]];
      }
      return {
        ...it,
        options: opts.map((o) => o.text),
        correct: it.correct == null ? null : opts.findIndex((o) => o.i === it.correct),
      };
    }),
  };
}

export function deepClone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

/** New ids everywhere, so a duplicated question/exam is independent. */
export function cloneQuestion(q: Question): Question {
  const c = deepClone(q);
  c.id = uid();
  c.items = c.items.map((i) => ({ ...i, id: uid() }));
  c.pairs = c.pairs.map((p) => ({ ...p, id: uid() }));
  return c;
}
