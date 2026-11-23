import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ChevronDown,
  Copy,
  ImagePlus,
  Info,
  ListPlus,
  MessageSquareText,
  Plus,
  Quote,
  Shuffle,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react';
import type { Exam, Item, Question, QuestionType } from '../types';
import {
  CLOSING_PRESETS,
  cloneQuestion,
  fmtNum,
  letter,
  marksSum,
  newItem,
  newPair,
  newQuestion,
  optionLetter,
  questionDir,
  retype,
  shuffleOptions,
  TYPE_META,
  TYPE_ORDER,
} from '../model';
import { Field, IconButton, ImagePicker, NumberInput, Section, Segmented, Select, TextArea, TextInput, Toggle } from '../ui/ui';
import type { Update } from '../pages/Editor';

export default function QuestionsPanel({ exam, update }: { exam: Exam; update: Update }) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [picker, setPicker] = useState(exam.questions.length === 0);
  const [focusQ, setFocusQ] = useState<string | null>(null);

  const setQ = (id: string, fn: (q: Question) => Question) =>
    update((e) => ({ ...e, questions: e.questions.map((q) => (q.id === id ? fn(q) : q)) }));

  const add = (t: QuestionType) => {
    const q = newQuestion(t, exam.design.lang);
    update((e) => ({ ...e, questions: [...e.questions, q] }));
    setPicker(false);
    setFocusQ(q.id);
  };

  const move = (i: number, d: -1 | 1) =>
    update((e) => {
      const qs = [...e.questions];
      const j = i + d;
      if (j < 0 || j >= qs.length) return e;
      [qs[i], qs[j]] = [qs[j], qs[i]];
      return { ...e, questions: qs };
    });

  const duplicate = (i: number) =>
    update((e) => {
      const qs = [...e.questions];
      qs.splice(i + 1, 0, cloneQuestion(qs[i]));
      return { ...e, questions: qs };
    });

  const remove = (q: Question) => {
    const hasContent = q.title.trim() || q.items.some((i) => i.text.trim()) || q.pairs.some((p) => p.left || p.right);
    if (hasContent && !confirm('حذف هذا السؤال؟')) return;
    update((e) => ({ ...e, questions: e.questions.filter((x) => x.id !== q.id) }));
  };

  return (
    <div className="panel">
      <MarksBar exam={exam} update={update} />

      {exam.questions.map((q, i) => (
        <QuestionCard
          key={q.id}
          q={q}
          n={i + 1}
          count={exam.questions.length}
          exam={exam}
          collapsed={!!collapsed[q.id]}
          toggle={() => setCollapsed((c) => ({ ...c, [q.id]: !c[q.id] }))}
          set={(fn) => setQ(q.id, fn)}
          onMove={(d) => move(i, d)}
          onDuplicate={() => duplicate(i)}
          onRemove={() => remove(q)}
          autoFocus={focusQ === q.id}
        />
      ))}

      {picker ? (
        <TypePicker onPick={add} onClose={exam.questions.length ? () => setPicker(false) : undefined} />
      ) : (
        <button className="btn add-q" onClick={() => setPicker(true)}>
          <Plus size={18} /> إضافة سؤال
        </button>
      )}

      <ClosingSection exam={exam} update={update} />
    </div>
  );
}

/* ─── Marks summary ─── */

function MarksBar({ exam, update }: { exam: Exam; update: Update }) {
  const sum = marksSum(exam);
  const total = exam.info.totalMarks;
  const unmarked = exam.questions.filter((q) => !q.marks).length;
  const ok = total == null || Math.abs(sum - total) < 1e-9;
  return (
    <div className={'marks-bar card' + (ok ? '' : ' warn')}>
      <div className="marks-main">
        <span className="marks-label">مجموع الدرجات</span>
        <span className="marks-val">
          {fmtNum(sum)}
          {total != null && <small> / {fmtNum(total)}</small>}
        </span>
      </div>
      <div className="marks-msg">
        {exam.questions.length === 0 ? (
          <span className="muted">أضف السؤال الأول للبدء.</span>
        ) : !ok ? (
          <span className="warn-text">
            <AlertTriangle size={15} /> مجموع درجات الأسئلة ({fmtNum(sum)}) لا يساوي الدرجة الكلية ({fmtNum(total!)}).
          </span>
        ) : total != null ? (
          <span className="ok-text">
            <CheckCircle2 size={15} /> المجموع مطابق للدرجة الكلية.
          </span>
        ) : (
          <span className="muted">لم تُحدَّد الدرجة الكلية.</span>
        )}
        {unmarked > 0 && exam.questions.length > 0 && <span className="muted"> {unmarked === 1 ? 'سؤال واحد' : `${unmarked} أسئلة`} بلا درجة.</span>}
      </div>
      {sum > 0 && !ok && (
        <button className="btn ghost sm" onClick={() => update((e) => ({ ...e, info: { ...e.info, totalMarks: sum } }))}>
          اعتماد {fmtNum(sum)} درجة كلية
        </button>
      )}
      {sum > 0 && total == null && (
        <button className="btn ghost sm" onClick={() => update((e) => ({ ...e, info: { ...e.info, totalMarks: sum } }))}>
          اعتماد المجموع درجةً كلية
        </button>
      )}
    </div>
  );
}

/* ─── Type picker ─── */

function TypePicker({ onPick, onClose }: { onPick: (t: QuestionType) => void; onClose?: () => void }) {
  const group = (g: 'essay' | 'objective') => TYPE_ORDER.filter((t) => TYPE_META[t].group === g);
  return (
    <div className="type-picker card">
      <div className="tp-head">
        <b>اختر نوع السؤال</b>
        {onClose && (
          <IconButton title="إغلاق" onClick={onClose}>
            <X size={16} />
          </IconButton>
        )}
      </div>
      {(
        [
          ['objective', 'اختيار من متعدد وأسئلة موضوعية'],
          ['essay', 'أسئلة مقالية'],
        ] as const
      ).map(([g, title]) => (
        <div key={g} className="tp-group">
          <div className="tp-title">{title}</div>
          <div className="tp-grid">
            {group(g).map((t) => (
              <button key={t} type="button" className="tp-opt" onClick={() => onPick(t)}>
                <b>{TYPE_META[t].label}</b>
                <small>{TYPE_META[t].hint}</small>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Keyboard flow: Enter moves to the next field of the card ─── */

function focusNext(from: HTMLElement): boolean {
  const card = from.closest('.q-card');
  if (!card) return false;
  const all = Array.from(card.querySelectorAll<HTMLElement>('[data-nav]'));
  const i = all.indexOf(from);
  if (i >= 0 && i + 1 < all.length) {
    all[i + 1].focus();
    return true;
  }
  return false;
}

/* ─── Question card ─── */

interface CardProps {
  q: Question;
  n: number;
  count: number;
  exam: Exam;
  collapsed: boolean;
  toggle: () => void;
  set: (fn: (q: Question) => Question) => void;
  onMove: (d: -1 | 1) => void;
  onDuplicate: () => void;
  onRemove: () => void;
  autoFocus: boolean;
}

function QuestionCard({ q, n, count, exam, collapsed, toggle, set, onMove, onDuplicate, onRemove, autoFocus }: CardProps) {
  const [showInstr, setShowInstr] = useState(!!q.instructions);
  const [showAdv, setShowAdv] = useState(false);
  const [showPassage, setShowPassage] = useState(!!q.passage);
  const [newId, setNewId] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const dir = questionDir(q, exam.design.lang);
  const meta = TYPE_META[q.type];

  useEffect(() => {
    if (autoFocus && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const first =
        ref.current.querySelector<HTMLElement>('.items [data-nav]') ?? ref.current.querySelector<HTMLElement>('[data-nav]');
      setTimeout(() => first?.focus({ preventScroll: true }), 250);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const patch = (p: Partial<Question>) => set((x) => ({ ...x, ...p }));
  const setItem = (id: string, p: Partial<Item>) => set((x) => ({ ...x, items: x.items.map((i) => (i.id === id ? { ...i, ...p } : i)) }));
  const addItemAfter = (idx: number, init?: Partial<Item>) => {
    const it = { ...newItem(q.optionCount), ...init };
    set((x) => {
      const items = [...x.items];
      items.splice(idx + 1, 0, it);
      return { ...x, items };
    });
    setNewId(it.id);
    return it;
  };
  const removeItem = (id: string) => set((x) => ({ ...x, items: x.items.filter((i) => i.id !== id) }));

  /** Paste several lines into a field → one item per line */
  const onPasteLines = (idx: number, text: string, current: string) => {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2 || current.trim()) return false;
    set((x) => {
      const items = [...x.items];
      items[idx] = { ...items[idx], text: lines[0] };
      const extra = lines.slice(1).map((t) => ({ ...newItem(x.optionCount), text: t }));
      items.splice(idx + 1, 0, ...extra);
      return { ...x, items };
    });
    return true;
  };

  const summary = q.title.trim() || q.items.find((i) => i.text.trim())?.text || 'سؤال فارغ';

  return (
    <div className={'q-card card' + (collapsed ? ' collapsed' : '')} ref={ref}>
      <div className="q-card-head">
        <button type="button" className="q-badge" onClick={toggle} title={collapsed ? 'توسيع' : 'طيّ'}>
          <span className="q-n">س{n}</span>
          <span className="q-type">{meta.label}</span>
          <ChevronDown size={16} className="chev" />
        </button>
        <label className="q-marks-input" title="درجة السؤال">
          <span>الدرجة</span>
          <NumberInput value={q.marks} onChange={(v) => patch({ marks: v })} placeholder="—" />
        </label>
        <div className="q-actions">
          <IconButton title="نقل للأعلى" onClick={() => onMove(-1)} disabled={n === 1}>
            <ArrowUp size={16} />
          </IconButton>
          <IconButton title="نقل للأسفل" onClick={() => onMove(1)} disabled={n === count}>
            <ArrowDown size={16} />
          </IconButton>
          <IconButton title="تكرار السؤال" onClick={onDuplicate}>
            <Copy size={16} />
          </IconButton>
          <IconButton title="حذف السؤال" onClick={onRemove} danger>
            <Trash2 size={16} />
          </IconButton>
        </div>
      </div>

      {collapsed ? (
        <button type="button" className="q-summary" onClick={toggle} dir="auto">
          {summary}
        </button>
      ) : (
        <div className="q-body">
          <div className="q-row">
            <Field label="نوع السؤال">
              <Select
                value={q.type}
                onChange={(t) => set((x) => retype(x, t, exam.design.lang))}
                options={TYPE_ORDER.map((t) => ({ value: t, label: TYPE_META[t].label }))}
              />
            </Field>
          </div>

          <Field label={q.type === 'open' ? 'نص السؤال' : 'نص السؤال / المطلوب'}>
            <TextArea
              data-nav
              value={q.title}
              onChange={(v) => patch({ title: v })}
              onKeyDown={(e: KeyboardEvent<HTMLTextAreaElement>) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && q.type !== 'open') {
                  e.preventDefault();
                  focusNext(e.currentTarget);
                }
              }}
              placeholder={q.type === 'open' ? 'اكتب السؤال هنا…' : meta.titleAr}
              minRows={1}
            />
          </Field>

          {(showInstr || q.instructions) && (
            <Field label="تعليمات السؤال">
              <div className="input-with-btn">
                <TextArea value={q.instructions} onChange={(v) => patch({ instructions: v })} placeholder="مثال: أجب عن ثلاثة فروع فقط" />
                <IconButton
                  title="إزالة التعليمات"
                  onClick={() => {
                    patch({ instructions: '' });
                    setShowInstr(false);
                  }}
                >
                  <X size={15} />
                </IconButton>
              </div>
            </Field>
          )}

          {(q.type === 'passage' || showPassage || q.passage) && (
            <Field label="القطعة">
              <TextArea value={q.passage} onChange={(v) => patch({ passage: v })} minRows={4} placeholder="الصق نص القطعة هنا…" />
            </Field>
          )}

          {q.image && (
            <div className="img-edit">
              <img src={q.image.src} alt="" />
              <div className="img-controls">
                <label className="range-row">
                  <span>العرض</span>
                  <input
                    type="range"
                    min={15}
                    max={100}
                    value={q.image.width}
                    onChange={(e) => patch({ image: { ...q.image!, width: +e.target.value } })}
                  />
                  <span className="range-val">{q.image.width}%</span>
                </label>
                <div className="row">
                  <Segmented
                    small
                    value={q.image.align}
                    onChange={(v) => patch({ image: { ...q.image!, align: v } })}
                    options={[
                      { value: 'start', label: 'بداية' },
                      { value: 'center', label: 'وسط' },
                      { value: 'end', label: 'نهاية' },
                    ]}
                  />
                  <button type="button" className="btn ghost sm danger-text" onClick={() => patch({ image: null })}>
                    <Trash2 size={14} /> إزالة الصورة
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="q-extras">
            {!showInstr && !q.instructions && (
              <button type="button" className="link-btn" onClick={() => setShowInstr(true)}>
                <Info size={14} /> تعليمات
              </button>
            )}
            {!q.image && (
              <ImagePicker className="link-btn" onPick={(src) => patch({ image: { src, width: 60, align: 'center' } })}>
                <ImagePlus size={14} /> صورة
              </ImagePicker>
            )}
            {q.type !== 'passage' && !q.passage && !showPassage && (
              <button type="button" className="link-btn" onClick={() => setShowPassage(true)}>
                <Quote size={14} /> نص أو قطعة
              </button>
            )}
            <button type="button" className={'link-btn' + (showAdv ? ' active' : '')} onClick={() => setShowAdv(!showAdv)}>
              <SlidersHorizontal size={14} /> خيارات متقدمة
            </button>
          </div>

          {showAdv && <Advanced q={q} patch={patch} set={set} />}

          {/* type-specific editors */}
          {q.type === 'mcq' ? (
            <McqItems q={q} dir={exam.design.optionLabels} qdir={dir} setItem={setItem} addItemAfter={addItemAfter} removeItem={removeItem} newId={newId} set={set} />
          ) : q.type === 'match' ? (
            <MatchPairs q={q} set={set} qdir={dir} />
          ) : q.type === 'open' ? null : (
            <div className="items">
              <div className="items-label">
                {q.type === 'truefalse' ? 'العبارات' : 'الفروع'}
                <small>Enter لإضافة فرع جديد · الصق عدة أسطر لإضافتها دفعة واحدة</small>
              </div>
              {q.items.map((it, i) => (
                <ItemRow
                  key={it.id}
                  q={q}
                  it={it}
                  idx={i}
                  label={q.numbering === 'none' ? '•' : q.numbering === 'letters' ? letter(i, dir) : String(i + 1)}
                  autoFocus={it.id === newId}
                  setItem={setItem}
                  onEnter={() => addItemAfter(i)}
                  onRemove={() => removeItem(it.id)}
                  onPasteLines={(t) => onPasteLines(i, t, it.text)}
                  canRemove={q.items.length > 1}
                />
              ))}
              <button type="button" className="btn ghost sm add-item" onClick={() => addItemAfter(q.items.length - 1)}>
                <ListPlus size={15} /> {q.type === 'truefalse' ? 'إضافة عبارة' : 'إضافة فرع'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Advanced({ q, patch, set }: { q: Question; patch: (p: Partial<Question>) => void; set: (fn: (q: Question) => Question) => void }) {
  return (
    <div className="advanced">
      <Field label="اتجاه السؤال">
        <Segmented
          small
          value={q.dir}
          onChange={(v) => patch({ dir: v })}
          options={[
            { value: 'inherit', label: 'تلقائي' },
            { value: 'rtl', label: 'عربي ←' },
            { value: 'ltr', label: '→ English' },
          ]}
        />
      </Field>
      {q.type !== 'open' && q.type !== 'match' && (
        <Field label="ترقيم الفروع">
          <Segmented
            small
            value={q.numbering}
            onChange={(v) => patch({ numbering: v })}
            options={[
              { value: 'letters', label: 'أ ب ج' },
              { value: 'numbers', label: '1 2 3' },
              { value: 'none', label: 'بدون' },
            ]}
          />
        </Field>
      )}
      {q.type === 'mcq' && (
        <>
          <Field label="عدد الخيارات">
            <Segmented
              small
              value={q.optionCount}
              onChange={(c) =>
                set((x) => ({
                  ...x,
                  optionCount: c,
                  items: x.items.map((it) => ({
                    ...it,
                    options: Array.from({ length: c }, (_, i) => it.options[i] ?? ''),
                    correct: it.correct != null && it.correct >= c ? null : it.correct,
                  })),
                }))
              }
              options={[2, 3, 4, 5, 6].map((n) => ({ value: n, label: String(n) }))}
            />
          </Field>
          <Field label="ترتيب الخيارات في الورقة">
            <Segmented
              small
              value={q.optionCols}
              onChange={(v) => patch({ optionCols: v })}
              options={[
                { value: 0, label: 'تلقائي' },
                { value: 1, label: 'عمود' },
                { value: 2, label: 'عمودان' },
                { value: 4, label: 'سطر واحد' },
              ]}
            />
          </Field>
          <button type="button" className="btn ghost sm" onClick={() => set(shuffleOptions)}>
            <Shuffle size={15} /> ترتيب الخيارات عشوائياً
          </button>
        </>
      )}
      {q.type === 'match' && (
        <button type="button" className="btn ghost sm" onClick={() => patch({ seed: Math.floor(Math.random() * 1e9) })}>
          <Shuffle size={15} /> إعادة خلط العمود (ب)
        </button>
      )}
    </div>
  );
}

/* ─── Items ─── */

interface ItemRowProps {
  q: Question;
  it: Item;
  idx: number;
  label: string;
  autoFocus: boolean;
  setItem: (id: string, p: Partial<Item>) => void;
  onEnter: () => void;
  onRemove: () => void;
  onPasteLines: (t: string) => boolean;
  canRemove: boolean;
}

function ItemRow({ q, it, label, autoFocus, setItem, onEnter, onRemove, onPasteLines, canRemove }: ItemRowProps) {
  const tf = q.type === 'truefalse';
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (autoFocus) ref.current?.querySelector<HTMLElement>('textarea')?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const fillHint = q.type === 'fill' || q.type === 'complete';
  return (
    <div className="item-row" ref={ref}>
      <span className="item-lbl">{label}</span>
      <div className="item-main">
        <div className="item-line">
          <TextArea
            data-nav
            value={it.text}
            onChange={(v) => setItem(it.id, { text: v })}
            placeholder={
              fillHint ? 'مثال: عاصمة العراق هي ........' : tf ? 'اكتب العبارة' : q.type === 'translate' ? 'النص المراد ترجمته' : 'اكتب الفرع'
            }
            onKeyDown={(e: KeyboardEvent<HTMLTextAreaElement>) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                onEnter();
              } else if (e.key === 'Backspace' && !it.text && canRemove) {
                e.preventDefault();
                const prev = ref.current?.previousElementSibling?.querySelector<HTMLTextAreaElement>('textarea');
                onRemove();
                prev?.focus();
              }
            }}
            onPaste={(e) => {
              if (onPasteLines(e.clipboardData.getData('text'))) e.preventDefault();
            }}
          />
          <IconButton title="حذف" onClick={onRemove} disabled={!canRemove}>
            <X size={15} />
          </IconButton>
        </div>
      </div>
    </div>
  );
}

function McqItems({
  q,
  dir,
  qdir,
  setItem,
  addItemAfter,
  removeItem,
  newId,
}: {
  q: Question;
  dir: 'auto' | 'latin' | 'arabic';
  qdir: 'rtl' | 'ltr';
  setItem: (id: string, p: Partial<Item>) => void;
  addItemAfter: (i: number) => Item;
  removeItem: (id: string) => void;
  newId: string | null;
  set: (fn: (q: Question) => Question) => void;
}) {
  const enter = (e: KeyboardEvent<HTMLElement>, last: boolean, i: number) => {
    if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing) return;
    e.preventDefault();
    if (last || !focusNext(e.currentTarget)) addItemAfter(i);
  };
  return (
    <div className="items">
      <div className="items-label">
        الأسئلة والخيارات
      </div>
      {q.items.map((it, i) => (
        <McqItem
          key={it.id}
          n={i + 1}
          it={it}
          autoFocus={it.id === newId}
          optLabel={(oi) => optionLetter(oi, qdir, dir)}
          setItem={setItem}
          onKey={(e, last) => enter(e, last, i)}
          onRemove={q.items.length > 1 ? () => removeItem(it.id) : undefined}
        />
      ))}
      <button type="button" className="btn ghost sm add-item" onClick={() => addItemAfter(q.items.length - 1)}>
        <ListPlus size={15} /> إضافة سؤال اختيار
      </button>
    </div>
  );
}

function McqItem({
  n,
  it,
  autoFocus,
  optLabel,
  setItem,
  onKey,
  onRemove,
}: {
  n: number;
  it: Item;
  autoFocus: boolean;
  optLabel: (i: number) => string;
  setItem: (id: string, p: Partial<Item>) => void;
  onKey: (e: KeyboardEvent<HTMLElement>, last: boolean) => void;
  onRemove?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (autoFocus) ref.current?.querySelector<HTMLElement>('textarea')?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="mcq-item" ref={ref}>
      <div className="item-line">
        <span className="item-lbl">{n}</span>
        <TextArea data-nav value={it.text} onChange={(v) => setItem(it.id, { text: v })} placeholder="نص السؤال" onKeyDown={(e) => onKey(e, false)} />
        {onRemove && (
          <IconButton title="حذف" onClick={onRemove}>
            <X size={15} />
          </IconButton>
        )}
      </div>
      <div className="mcq-opts">
        {it.options.map((o, oi) => (
          <div key={oi} className="mcq-opt">
            <span className="opt-mark">{optLabel(oi)}</span>
            <input
              data-nav
              className="input"
              dir="auto"
              value={o}
              placeholder={`الخيار ${optLabel(oi)}`}
              onChange={(e) => setItem(it.id, { options: it.options.map((x, xi) => (xi === oi ? e.target.value : x)) })}
              onKeyDown={(e) => onKey(e, oi === it.options.length - 1)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function MatchPairs({ q, set, qdir }: { q: Question; set: (fn: (q: Question) => Question) => void; qdir: 'rtl' | 'ltr' }) {
  const [newId, setNewId] = useState<string | null>(null);
  const setPair = (id: string, k: 'left' | 'right', v: string) =>
    set((x) => ({ ...x, pairs: x.pairs.map((p) => (p.id === id ? { ...p, [k]: v } : p)) }));
  const add = (distractor = false) => {
    const p = newPair();
    set((x) => ({ ...x, pairs: [...x.pairs, p] }));
    setNewId(distractor ? p.id + ':r' : p.id);
  };
  useEffect(() => {
    if (!newId) return;
    const [id, side] = newId.split(':');
    document.querySelector<HTMLElement>(`[data-pair="${id}"] input[data-side="${side === 'r' ? 'right' : 'left'}"]`)?.focus();
  }, [newId]);
  return (
    <div className="items">
      <div className="items-label">
        أزواج التوصيل
        <small>اكتب كل عنصر مع ما يقابله — يُخلط ترتيب العمود (ب) تلقائياً في الورقة</small>
      </div>
      <div className="match-head">
        <span />
        <span>العمود (أ)</span>
        <span>العمود (ب) — الإجابة المطابقة</span>
        <span />
      </div>
      {q.pairs.map((p, i) => (
        <div className="match-row" key={p.id} data-pair={p.id}>
          <span className="item-lbl">{p.left || !p.right ? i + 1 : '+'}</span>
          <input
            data-nav
            data-side="left"
            className="input"
            dir="auto"
            value={p.left}
            placeholder={p.left || !p.right ? 'عنصر' : 'خيار إضافي للتمويه'}
            onChange={(e) => setPair(p.id, 'left', e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                focusNext(e.currentTarget);
              }
            }}
          />
          <input
            data-nav
            data-side="right"
            className="input"
            dir="auto"
            value={p.right}
            placeholder={`ما يقابله`}
            onChange={(e) => setPair(p.id, 'right', e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (!focusNext(e.currentTarget)) add();
              }
            }}
          />
          <IconButton title="حذف" onClick={() => set((x) => ({ ...x, pairs: x.pairs.filter((y) => y.id !== p.id) }))} disabled={q.pairs.length <= 1}>
            <X size={15} />
          </IconButton>
        </div>
      ))}
      <div className="row">
        <button type="button" className="btn ghost sm add-item" onClick={() => add()}>
          <ListPlus size={15} /> إضافة زوج
        </button>
        <button type="button" className="btn ghost sm" onClick={() => add(true)} title="خيار في العمود (ب) لا يقابله شيء">
          <Plus size={15} /> خيار تمويه في العمود (ب)
        </button>
      </div>
      <p className="hint-text">
        ترتيب العمود (ب) في الورقة: {qdir === 'rtl' ? 'أ، ب، ج…' : 'a, b, c…'} بترتيب مختلط. لخيار التمويه اترك العمود (أ) فارغاً.
      </p>
    </div>
  );
}

/* ─── Closing ─── */

function ClosingSection({ exam, update }: { exam: Exam; update: Update }) {
  const c = exam.closing;
  const setC = <K extends keyof Exam['closing']>(k: K, v: Exam['closing'][K]) => update((e) => ({ ...e, closing: { ...e.closing, [k]: v } }));
  return (
    <Section title="العبارات الختامية" subtitle="تظهر بعد آخر سؤال" icon={<MessageSquareText size={18} />} defaultOpen={false}>
      <div className="stack">
        <Toggle label="إظهار عبارة ختامية" checked={c.enabled} onChange={(v) => setC('enabled', v)} />
        {c.enabled && (
          <>
            <div className="chips">
              {CLOSING_PRESETS.map((p) => (
                <button key={p} type="button" className={'chip-toggle' + (c.text === p ? ' on' : '')} onClick={() => setC('text', p)} dir="auto">
                  {p}
                </button>
              ))}
            </div>
            <Field label="العبارة">
              <TextInput value={c.text} onChange={(v) => setC('text', v)} placeholder="اكتب عبارة مخصصة" />
            </Field>
            <details className="mini-details">
              <summary>خيارات إضافية</summary>
              <div className="stack details-body">
            <div className="grid">
              <Field label="المكان">
                <Segmented
                  small
                  value={c.position}
                  onChange={(v) => setC('position', v)}
                  options={[
                    { value: 'after', label: 'بعد آخر سؤال' },
                    { value: 'bottom', label: 'أسفل الصفحة' },
                  ]}
                />
              </Field>
              <Field label="المحاذاة">
                <Segmented
                  small
                  value={c.align}
                  onChange={(v) => setC('align', v)}
                  options={[
                    { value: 'start', label: 'بداية' },
                    { value: 'center', label: 'وسط' },
                    { value: 'end', label: 'نهاية' },
                  ]}
                />
              </Field>
              <Field label="حجم الخط">
                <Segmented
                  small
                  value={c.size}
                  onChange={(v) => setC('size', v)}
                  options={[10, 11, 12, 14, 16].map((n) => ({ value: n, label: String(n) }))}
                />
              </Field>
            </div>
            <Toggle
              label="توقيع مدرس المادة"
              hint={exam.info.teacher ? `يظهر: مدرس المادة: ${exam.info.teacher}` : 'أضف اسم المدرس في معلومات الامتحان'}
              checked={c.signature}
              onChange={(v) => setC('signature', v)}
            />
              </div>
            </details>
          </>
        )}
      </div>
    </Section>
  );
}
