import { AlertTriangle, CheckCircle2, Download, FileDown, Printer, Settings2 } from 'lucide-react';
import type { DesignSettings, Exam } from '../types';
import { AR_FONTS, fontStack, LATIN_FONTS } from '../fonts';
import { examTitle } from '../model';
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

interface Props {
  exam: Exam;
  update: Update;
  layout: LayoutInfo | null;
  onExport: () => void;
}

export default function SettingsPanel({ exam, update, layout, onExport }: Props) {
  const d = exam.design;
  const set = <K extends keyof DesignSettings>(k: K, v: DesignSettings[K]) => update((e) => ({ ...e, design: { ...e.design, [k]: v } }));
  const m = d.margins;
  const uniform = m.top === m.bottom && m.top === m.left && m.top === m.right;

  const saveJson = () => {
    const blob = new Blob([JSON.stringify(exam, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${examTitle(exam)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };

  return (
    <div className="panel">
      {/* ─── the essentials ─── */}
      <section className="card essentials">
        <Field label="عدد النسخ في الصفحة">
          <Segmented
            value={d.copies}
            onChange={(v) => set('copies', v)}
            options={[
              { value: 'auto', label: 'تلقائي' },
              { value: 'single', label: 'نسخة واحدة' },
              { value: 'double', label: 'نسختان' },
            ]}
          />
        </Field>
        <CopiesStatus d={d} layout={layout} onSingle={() => set('copies', 'single')} />

        <div className="grid">
          <Field label="الخط العربي">
            <Select value={d.arFont} onChange={(v) => set('arFont', v)} options={AR_FONTS.map((f) => ({ value: f.id, label: f.label }))} />
          </Field>
          <Field label="الخط الإنجليزي">
            <Select value={d.latinFont} onChange={(v) => set('latinFont', v)} options={LATIN_FONTS.map((f) => ({ value: f.id, label: f.label }))} />
          </Field>
        </div>
        <Field label="حجم الخط">
          <Stepper value={d.fontSize} onChange={(v) => set('fontSize', v)} min={9} max={20} step={0.5} unit="pt" />
        </Field>
        <p className="font-sample" style={{ fontFamily: fontStack(d.arFont, d.latinFont) }}>
          اختر الإجابة الصحيحة — Choose the correct answer
        </p>

        <button className="btn primary lg export-btn" onClick={onExport}>
          <FileDown size={18} /> تصدير PDF
        </button>
        <p className="hint-text howto-line">
          <Printer size={14} /> في نافذة الطباعة اختر «حفظ بتنسيق PDF» والمقياس 100%.
        </p>
      </section>

      {/* ─── everything else ─── */}
      <Section title="الإعدادات" subtitle="الصفحة، الألوان، الترقيم، وغيرها" icon={<Settings2 size={18} />} defaultOpen={false}>
        <div className="settings-group">
          <h4>الصفحة</h4>
          <Toggle
            label="ملاءمة صفحة واحدة"
            hint="يُصغَّر الخط تلقائياً (حتى 9pt) لتُطبع الأسئلة على صفحة واحدة"
            checked={d.fitOnePage}
            onChange={(v) => set('fitOnePage', v)}
          />
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
              {uniform && (
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
              )}
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
          {d.copies !== 'single' && <Toggle label="خط قص متقطع مع رمز المقص" checked={d.cutLine} onChange={(v) => set('cutLine', v)} />}
        </div>

        <div className="settings-group">
          <h4>النص</h4>
          <div className="grid">
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
        </div>

        <div className="settings-group">
          <h4>الألوان</h4>
          <Segmented
            small
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
            </>
          )}
        </div>

        <div className="settings-group">
          <h4>اللغة والترقيم</h4>
          <div className="grid">
            <Field label="لغة الورقة" hint={d.lang === 'mixed' ? 'يُحدَّد اتجاه كل سؤال من نصه' : undefined}>
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
        </div>

        <div className="settings-group toggles">
          <h4>عناصر إضافية</h4>
          <Toggle label="إظهار درجة كل سؤال" checked={d.showMarksStudent} onChange={(v) => set('showMarksStudent', v)} />
          <Toggle label="ترقيم الصفحات" checked={d.pageNumbers} onChange={(v) => set('pageNumbers', v)} />
          <Toggle label="خط فاصل بين الأسئلة" checked={d.qDividers} onChange={(v) => set('qDividers', v)} />
        </div>

        <div className="settings-group">
          <h4>نسخة احتياطية</h4>
          <button className="btn ghost sm" onClick={saveJson}>
            <Download size={15} /> تنزيل ملف الامتحان (.json)
          </button>
          <p className="hint-text">لفتحه على جهاز آخر من زر «فتح ملف» في الصفحة الرئيسية.</p>
        </div>
      </Section>
    </div>
  );
}

function CopiesStatus({ d, layout, onSingle }: { d: DesignSettings; layout: LayoutInfo | null; onSingle: () => void }) {
  if (!layout || d.copies === 'single') return null;
  if (d.copies === 'auto' && layout.mode !== 'double') return null;
  const pct = Math.round(layout.fillRatio * 100);
  if (layout.mode === 'double')
    return (
      <div className="status ok">
        <CheckCircle2 size={16} />
        <span>نسختان في كل صفحة مع خط قص — اطبع نصف العدد المطلوب.</span>
      </div>
    );
  return (
    <div className="status warn">
      <AlertTriangle size={16} />
      <span>
        {`لا تتسع نسختان مقروءتان في الصفحة (المحتوى يحتاج ${pct}% من نصف الصفحة).`}
        <button type="button" className="btn ghost sm" onClick={onSingle}>
          استخدام نسخة واحدة
        </button>
      </span>
    </div>
  );
}

