import { CalendarDays, ClipboardList, ImagePlus, LayoutTemplate, Trash2 } from 'lucide-react';
import type { Exam, ExamInfo, HeaderField, HeaderSettings } from '../types';
import { EXAM_TYPES } from '../model';
import { Field, ImagePicker, NumberInput, Section, Segmented, Select, TextArea, TextInput, Toggle } from '../ui/ui';
import type { Update } from '../pages/Editor';

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
};

const SHOW_FIELDS: { k: HeaderField; label: string }[] = [
  { k: 'logo', label: 'الشعار' },
  { k: 'authority', label: 'الجهة' },
  { k: 'school', label: 'المدرسة' },
  { k: 'subject', label: 'المادة' },
  { k: 'examType', label: 'نوع الامتحان' },
  { k: 'grade', label: 'الصف' },
  { k: 'year', label: 'العام الدراسي' },
  { k: 'date', label: 'التاريخ' },
  { k: 'duration', label: 'الزمن' },
  { k: 'totalMarks', label: 'الدرجة الكلية' },
  { k: 'teacher', label: 'اسم المدرس' },
];

export default function InfoPanel({ exam, update }: { exam: Exam; update: Update }) {
  const info = exam.info;
  const h = exam.header;
  const ltr = exam.design.lang === 'en';
  const S = ltr ? 'يسار' : 'يمين';
  const E = ltr ? 'يمين' : 'يسار';
  const set = <K extends keyof ExamInfo>(k: K, v: ExamInfo[K]) => update((e) => ({ ...e, info: { ...e.info, [k]: v } }));
  const setH = <K extends keyof HeaderSettings>(k: K, v: HeaderSettings[K]) =>
    update((e) => ({ ...e, header: { ...e.header, [k]: v } }));

  return (
    <div className="panel">
      <Section title="معلومات الامتحان" subtitle="كل الحقول اختيارية — الحقل الفارغ لا يظهر في الورقة" icon={<ClipboardList size={18} />}>
        <div className="grid">
          <Field label="اسم المدرسة">
            <TextInput value={info.school} onChange={(v) => set('school', v)} placeholder="مثال: ثانوية المتميزين" />
          </Field>
          <Field label="اسم المادة">
            <TextInput value={info.subject} onChange={(v) => set('subject', v)} placeholder="مثال: اللغة العربية" />
          </Field>
          <Field label="الصف / المرحلة">
            <TextInput value={info.grade} onChange={(v) => set('grade', v)} placeholder="مثال: الثالث المتوسط" />
          </Field>
          <Field label="اسم المدرس">
            <TextInput value={info.teacher} onChange={(v) => set('teacher', v)} />
          </Field>
          <Field label="نوع الامتحان">
            <Select
              value={info.examType}
              onChange={(v) => set('examType', v)}
              options={[{ value: '', label: '— بدون —' }, ...EXAM_TYPES.map((t) => ({ value: t.key, label: t.ar }))]}
            />
          </Field>
          {info.examType === 'other' && (
            <Field label="اسم الامتحان">
              <TextInput value={info.examTypeOther} onChange={(v) => set('examTypeOther', v)} placeholder="مثال: امتحان الفصل الأول" />
            </Field>
          )}
          <Field label="التاريخ">
            <div className="input-with-btn">
              <TextInput value={info.date} onChange={(v) => set('date', v)} placeholder="اكتب التاريخ" />
              <button type="button" className="btn ghost sm" onClick={() => set('date', today())} title="تاريخ اليوم">
                <CalendarDays size={15} /> اليوم
              </button>
            </div>
          </Field>
          <Field label="مدة الامتحان">
            <TextInput value={info.duration} onChange={(v) => set('duration', v)} placeholder="مثال: ساعتان" list="durations" />
            <datalist id="durations">
              {['30 دقيقة', '45 دقيقة', 'ساعة واحدة', 'ساعة ونصف', 'ساعتان', 'ثلاث ساعات'].map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </Field>
          <Field label="الدرجة الكلية">
            <NumberInput value={info.totalMarks} onChange={(v) => set('totalMarks', v)} placeholder="مثال: 100" />
          </Field>
        </div>
        <div className="stack">
          <Field label="شعار المدرسة (اختياري)">
            <div className="logo-pick">
              {h.logo ? (
                <>
                  <img src={h.logo} alt="" className="logo-thumb" />
                  <div className="logo-controls">
                    <label className="range-row">
                      <span>الارتفاع</span>
                      <input type="range" min={10} max={35} value={h.logoHeight} onChange={(e) => setH('logoHeight', +e.target.value)} />
                      <span className="range-val">{h.logoHeight} مم</span>
                    </label>
                    <div className="row">
                      <ImagePicker onPick={(src) => setH('logo', src)}>تغيير</ImagePicker>
                      <button type="button" className="btn ghost sm danger-text" onClick={() => setH('logo', null)}>
                        <Trash2 size={14} /> إزالة
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <ImagePicker onPick={(src) => setH('logo', src)} className="btn ghost">
                  <ImagePlus size={16} /> رفع شعار
                </ImagePicker>
              )}
            </div>
          </Field>
        </div>
      </Section>

      <Section title="إعدادات إضافية" subtitle="الجهة، العام الدراسي، التعليمات، وشكل الترويسة" icon={<LayoutTemplate size={18} />} defaultOpen={false}>
        <div className="stack">
          <div className="grid">
          <Field label="الجهة / المديرية" hint="سطر علوي اختياري">
            <TextInput value={info.authority} onChange={(v) => set('authority', v)} placeholder="مثال: وزارة التربية" />
          </Field>
          <Field label="العام الدراسي">
            <TextInput value={info.year} onChange={(v) => set('year', v)} placeholder="2025 - 2026" />
          </Field>
          <Field label="تعليمات عامة" hint="تظهر تحت الترويسة، مثل: أجب عن خمسة أسئلة فقط" full>
            <TextArea value={info.generalInstructions} onChange={(v) => set('generalInstructions', v)} minRows={2} />
          </Field>
          </div>
          <Field label="نمط الترويسة">
            <div className="layout-picker">
              {(
                [
                  ['classic', 'كلاسيكي', 'ثلاثة أعمدة'],
                  ['centered', 'متوسط', 'عناصر في المنتصف'],
                  ['boxed', 'جدول', 'معلومات داخل إطار'],
                ] as const
              ).map(([v, label, sub]) => (
                <button key={v} type="button" className={'layout-opt' + (h.layout === v ? ' active' : '')} onClick={() => setH('layout', v)}>
                  <span className={'mini mini-' + v}>
                    <i />
                    <i />
                    <i />
                  </span>
                  <b>{label}</b>
                  <small>{sub}</small>
                </button>
              ))}
            </div>
          </Field>


          <div className="grid">
            <Field label="موضع الشعار">
              <Segmented
                small
                value={h.logoPosition}
                onChange={(v) => setH('logoPosition', v)}
                options={[
                  { value: 'start', label: S },
                  { value: 'center', label: 'وسط' },
                  { value: 'end', label: E },
                ]}
              />
            </Field>
            {h.layout !== 'classic' && (
              <Field label="محاذاة العناوين">
                <Segmented
                  small
                  value={h.titleAlign}
                  onChange={(v) => setH('titleAlign', v)}
                  options={[
                    { value: 'start', label: S },
                    { value: 'center', label: 'وسط' },
                    { value: 'end', label: E },
                  ]}
                />
              </Field>
            )}
            <Field label="الخط الفاصل أسفل الترويسة">
              <Segmented
                small
                value={h.border}
                onChange={(v) => setH('border', v)}
                options={[
                  { value: 'double', label: 'مزدوج' },
                  { value: 'line', label: 'مفرد' },
                  { value: 'none', label: 'بدون' },
                ]}
              />
            </Field>
          </div>

          <Field label="العناصر الظاهرة في الترويسة">
            <div className="chips">
              {SHOW_FIELDS.map(({ k, label }) => (
                <button
                  key={k}
                  type="button"
                  className={'chip-toggle' + (h.show[k] ? ' on' : '')}
                  aria-pressed={h.show[k]}
                  onClick={() => setH('show', { ...h.show, [k]: !h.show[k] })}
                >
                  {label}
                </button>
              ))}
            </div>
          </Field>

          <div className="toggles">
            <Toggle label="حقل اسم الطالب" checked={h.studentName} onChange={(v) => setH('studentName', v)} />
            <Toggle label="حقل الشعبة" checked={h.studentSection} onChange={(v) => setH('studentSection', v)} />
            <Toggle label="مربع الدرجة" hint="لكتابة درجة الطالب عند التصحيح" checked={h.scoreBox} onChange={(v) => setH('scoreBox', v)} />
          </div>
        </div>
      </Section>
    </div>
  );
}
