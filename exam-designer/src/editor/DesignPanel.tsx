import { AlertTriangle, CheckCircle2, Copy, FileText, Languages, ListOrdered, Palette, Type } from 'lucide-react';
import type { DesignSettings, Exam } from '../types';
import { AR_FONTS, LATIN_FONTS } from '../fonts';
import type { LayoutInfo } from '../paper/Paper';
import { Field, Section, Segmented, Select, Toggle } from '../ui/ui';
import type { Update } from '../pages/Editor';

const SWATCHES = ['#0f5a47', '#1f3a5f', '#5a1f2e', '#3d3d3d', '#5b4636', '#2e4a2e'];

function Stepper({ value, onChange, min, max, step = 1, unit }: { value: number; onChange: (v: number) => void; min: number; max: number; step?: number; unit?: string }) {
  const clamp = (v: number) => Math.min(max, Math.max(min, +v.toFixed(2)));
  return (
    <div className="num-stepper">
      <button type="button" onClick={() => onChange(clamp(value - step))} aria-label="إنقاص" disabled={value <= min}>
        −
      </button>
      <span>
        {value}
        {unit && <small> {unit}</small>}
      </span>
      <button type="button" onClick={() => onChange(clamp(value + step))} aria-label="زيادة" disabled={value >= max}>
        +
      </button>
    </div>
  );
}

export default function DesignPanel({ exam, update, layout }: { exam: Exam; update: Update; layout: LayoutInfo | null }) {
  const d = exam.design;
  const set = <K extends keyof DesignSettings>(k: K, v: DesignSettings[K]) => update((e) => ({ ...e, design: { ...e.design, [k]: v } }));
  const m = d.margins;
  const uniform = m.top === m.bottom && m.top === m.left && m.top === m.right;

  return (
    <div className="panel">
      <Section title="النسخ في الصفحة" subtitle="وفّر الورق بطباعة نسختين على ورقة واحدة" icon={<Copy size={18} />}>
        <div className="stack">
          <Segmented
            value={d.copies}
            onChange={(v) => set('copies', v)}
            options={[
              { value: 'auto', label: 'تلقائي' },
              { value: 'single', label: 'نسخة واحدة' },
              { value: 'double', label: 'نسختان' },
            ]}
          />
          <CopiesStatus d={d} layout={layout} onSingle={() => set('copies', 'single')} />
          {d.copies !== 'single' && (
            <Toggle label="خط قص متقطع مع رمز المقص" hint="عند الإيقاف يظهر خط فاصل متصل" checked={d.cutLine} onChange={(v) => set('cutLine', v)} />
          )}
        </div>
      </Section>

      <Section title="الصفحة" icon={<FileText size={18} />}>
        <div className="grid">
          <Field label="حجم الورق">
            <Segmented
              small
              value={d.pageSize}
              onChange={(v) => set('pageSize', v)}
              options={[
                { value: 'A4', label: 'A4' },
                { value: 'A5', label: 'A5' },
                { value: 'Letter', label: 'Letter' },
              ]}
            />
          </Field>
          <Field label="الاتجاه">
            <Segmented
              small
              value={d.orientation}
              onChange={(v) => set('orientation', v)}
              options={[
                { value: 'portrait', label: 'عمودي' },
                { value: 'landscape', label: 'أفقي' },
              ]}
            />
          </Field>
        </div>
        <Field label="الهوامش">
          <div className="margins">
            {uniform ? (
              <label className="range-row">
                <input
                  type="range"
                  min={5}
                  max={30}
                  value={m.top}
                  onChange={(e) => set('margins', { top: +e.target.value, bottom: +e.target.value, left: +e.target.value, right: +e.target.value })}
                />
                <span className="range-val">{m.top} مم</span>
              </label>
            ) : null}
            <details className="mini-details" open={!uniform}>
              <summary>هوامش مختلفة لكل جهة</summary>
              <div className="margin-grid">
                {(
                  [
                    ['top', 'أعلى'],
                    ['bottom', 'أسفل'],
                    ['right', 'يمين'],
                    ['left', 'يسار'],
                  ] as const
                ).map(([k, label]) => (
                  <label key={k} className="margin-cell">
                    <span>{label}</span>
                    <Stepper value={m[k]} min={3} max={40} onChange={(v) => set('margins', { ...m, [k]: v })} unit="مم" />
                  </label>
                ))}
              </div>
            </details>
          </div>
        </Field>
      </Section>

      <Section title="الخطوط" icon={<Type size={18} />}>
        <div className="grid">
          <Field label="الخط العربي">
            <Select value={d.arFont} onChange={(v) => set('arFont', v)} options={AR_FONTS.map((f) => ({ value: f.id, label: f.label }))} />
          </Field>
          <Field label="الخط الإنجليزي">
            <Select value={d.latinFont} onChange={(v) => set('latinFont', v)} options={LATIN_FONTS.map((f) => ({ value: f.id, label: f.label }))} />
          </Field>
          <Field label="حجم النص">
            <Stepper value={d.fontSize} onChange={(v) => set('fontSize', v)} min={9} max={20} step={0.5} unit="pt" />
          </Field>
          <Field label="حجم العناوين">
            <Stepper value={d.headingSize} onChange={(v) => set('headingSize', v)} min={10} max={24} step={0.5} unit="pt" />
          </Field>
          <Field label="تباعد الأسطر">
            <Segmented
              small
              value={d.lineHeight}
              onChange={(v) => set('lineHeight', v)}
              options={[
                { value: 1.3, label: 'ضيق' },
                { value: 1.55, label: 'عادي' },
                { value: 1.85, label: 'واسع' },
              ]}
            />
          </Field>
        </div>
        <p className="font-sample" style={{ fontFamily: `"${d.latinFont === 'same' ? d.arFont : d.latinFont}", "${d.arFont}"` }}>
          نموذج للخط: اختر الإجابة الصحيحة — Choose the correct answer
        </p>
      </Section>

      <Section title="الألوان" subtitle="الألوان تقتصر على العناوين والخطوط لتوفير الحبر" icon={<Palette size={18} />} defaultOpen={false}>
        <div className="stack">
          <Segmented
            value={d.colorMode}
            onChange={(v) => set('colorMode', v)}
            options={[
              { value: 'bw', label: 'أسود وأبيض' },
              { value: 'gray', label: 'رمادي' },
              { value: 'accent', label: 'لون مخصص' },
            ]}
          />
          {d.colorMode === 'accent' && (
            <>
              <div className="swatches">
                {SWATCHES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={'swatch' + (d.headingColor === c && d.dividerColor === c ? ' on' : '')}
                    style={{ background: c }}
                    title={c}
                    aria-label={c}
                    onClick={() => update((e) => ({ ...e, design: { ...e.design, accent: c, headingColor: c, dividerColor: c } }))}
                  />
                ))}
              </div>
              <div className="grid">
                <Field label="لون العناوين">
                  <input type="color" className="color-input" value={d.headingColor} onChange={(e) => set('headingColor', e.target.value)} />
                </Field>
                <Field label="لون الخطوط الفاصلة">
                  <input type="color" className="color-input" value={d.dividerColor} onChange={(e) => set('dividerColor', e.target.value)} />
                </Field>
              </div>
              <p className="hint-text">لا تُستخدم خلفيات ملوّنة إطلاقاً، فيبقى استهلاك الحبر في حدّه الأدنى. يُفضّل لون داكن ليكون مقروءاً عند الطباعة بالأبيض والأسود.</p>
            </>
          )}
        </div>
      </Section>

      <Section title="لغة الورقة والترقيم" icon={<Languages size={18} />}>
        <div className="grid">
          <Field label="لغة الورقة" hint={d.lang === 'mixed' ? 'يُحدَّد اتجاه كل سؤال تلقائياً من نصه' : undefined}>
            <Segmented
              small
              value={d.lang}
              onChange={(v) => set('lang', v)}
              options={[
                { value: 'ar', label: 'عربية' },
                { value: 'en', label: 'English' },
                { value: 'mixed', label: 'مختلطة' },
              ]}
            />
          </Field>
          <Field label="عنوان السؤال">
            <Segmented
              small
              value={d.qNumberStyle}
              onChange={(v) => set('qNumberStyle', v)}
              options={[
                { value: 'words', label: 'السؤال الأول' },
                { value: 'short', label: 'س1' },
                { value: 'number', label: '1-' },
              ]}
            />
          </Field>
          <Field label="حروف الخيارات">
            <Segmented
              small
              value={d.optionLabels}
              onChange={(v) => set('optionLabels', v)}
              options={[
                { value: 'auto', label: 'حسب اللغة' },
                { value: 'latin', label: 'A B C' },
                { value: 'arabic', label: 'أ ب ج' },
              ]}
            />
          </Field>
          <Field label="الأرقام في الأسئلة العربية">
            <Segmented
              small
              value={d.digits}
              onChange={(v) => set('digits', v)}
              options={[
                { value: 'western', label: '1 2 3' },
                { value: 'eastern', label: '١ ٢ ٣' },
              ]}
            />
          </Field>
        </div>
      </Section>

      <Section title="الدرجات والعناصر الإضافية" icon={<ListOrdered size={18} />} defaultOpen={false}>
        <div className="toggles">
          <Toggle
            label="إظهار درجات الأسئلة في نسخة الطالب"
            hint="تظهر الدرجات دائماً في نسخة المدرس"
            checked={d.showMarksStudent}
            onChange={(v) => set('showMarksStudent', v)}
          />
          <Toggle label="ترقيم الصفحات" hint="مع كلمة «يتبع» أسفل الصفحات غير الأخيرة" checked={d.pageNumbers} onChange={(v) => set('pageNumbers', v)} />
          <Toggle label="خط فاصل بين الأسئلة" checked={d.qDividers} onChange={(v) => set('qDividers', v)} />
        </div>
      </Section>
    </div>
  );
}

function CopiesStatus({ d, layout, onSingle }: { d: DesignSettings; layout: LayoutInfo | null; onSingle: () => void }) {
  if (!layout) return null;
  const pct = Math.round(layout.fillRatio * 100);
  if (d.copies === 'single')
    return <p className="hint-text">تُطبع نسخة واحدة في كل صفحة. {layout.twoUpFits && 'هذا الامتحان قصير بما يكفي لنسختين في الصفحة.'}</p>;
  if (layout.twoUpFits)
    return (
      <div className="status ok">
        <CheckCircle2 size={16} />
        <span>
          يتسع الامتحان لنسختين في الصفحة دون تصغير الخط (يشغل {pct}% من نصف الصفحة).
          {d.copies === 'auto' && ' تم تفعيل وضع النسختين تلقائياً.'}
        </span>
      </div>
    );
  return (
    <div className={'status ' + (d.copies === 'double' ? 'warn' : 'info')}>
      <AlertTriangle size={16} />
      <span>
        {d.copies === 'double'
          ? `لا يتسع المحتوى لنسختين مقروءتين في الصفحة (يحتاج ${pct}% من نصف الصفحة). نقترح استخدام نسخة واحدة في الصفحة، أو تقليل حجم الخط أو الهوامش.`
          : `الامتحان أطول من نصف صفحة (${pct}%)، لذا تُطبع نسخة واحدة في كل صفحة.`}
        {d.copies === 'double' && (
          <button type="button" className="btn ghost sm" onClick={onSingle}>
            استخدام نسخة واحدة
          </button>
        )}
      </span>
    </div>
  );
}
