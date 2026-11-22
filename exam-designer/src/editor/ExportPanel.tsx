import { useState } from 'react';
import { Download, FileDown, KeyRound, Printer, User, UserCheck } from 'lucide-react';
import type { Exam, Variant } from '../types';
import { examTitle } from '../model';
import type { LayoutInfo } from '../paper/Paper';
import { Field, Section, TextInput } from '../ui/ui';
import type { Update } from '../pages/Editor';

export default function ExportPanel({
  exam,
  onExport,
  layout,
}: {
  exam: Exam;
  update: Update;
  onExport: (v: Variant, name: string) => void;
  layout: LayoutInfo | null;
}) {
  const [name, setName] = useState(examTitle(exam));

  const saveJson = () => {
    const blob = new Blob([JSON.stringify(exam, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${name || 'exam'}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };

  const options: { v: Variant; icon: JSX.Element; title: string; desc: string }[] = [
    {
      v: 'student',
      icon: <User size={20} />,
      title: 'نسخة الطالب',
      desc:
        layout?.mode === 'double'
          ? 'نسختان في كل صفحة مع خط قص — اطبع نصف العدد المطلوب.'
          : `${exam.design.showMarksStudent ? 'مع' : 'بدون'} درجات الأسئلة.`,
    },
    { v: 'teacher', icon: <UserCheck size={20} />, title: 'نسخة المدرس', desc: 'الورقة كاملة مع الدرجات والإجابات الصحيحة.' },
    { v: 'key', icon: <KeyRound size={20} />, title: 'نموذج الإجابة', desc: 'ورقة مختصرة بالإجابات الصحيحة لكل سؤال.' },
  ];

  return (
    <div className="panel">
      <Section title="تصدير PDF" icon={<FileDown size={18} />}>
        <div className="stack">
          <Field label="اسم الملف">
            <TextInput value={name} onChange={setName} />
          </Field>
          <div className="export-list">
            {options.map((o) => (
              <div key={o.v} className="export-opt">
                <span className="export-icon">{o.icon}</span>
                <span className="export-text">
                  <b>{o.title}</b>
                  <small>{o.desc}</small>
                </span>
                <button className={'btn sm ' + (o.v === 'student' ? 'primary' : 'soft')} onClick={() => onExport(o.v, name)}>
                  <FileDown size={15} /> تصدير PDF
                </button>
              </div>
            ))}
          </div>
          <div className="howto">
            <Printer size={18} />
            <div>
              <b>كيف يُحفظ الملف؟</b>
              <p>
                تُولَّد الورقة بمحرّك الطباعة في المتصفح بجودة متجهية عالية (نصوص حقيقية قابلة للتحديد، لا صورة). في النافذة التي تظهر اختر
                «حفظ بتنسيق PDF» أو «Save as PDF» كوجهة، وتأكّد أن الحجم {exam.design.pageSize} والهوامش «بلا» أو «افتراضي» والمقياس 100%.
              </p>
            </div>
          </div>
        </div>
      </Section>

      <Section title="نسخة احتياطية" subtitle="احفظ الامتحان كملف لفتحه على جهاز آخر" icon={<Download size={18} />} defaultOpen={false}>
        <button className="btn ghost" onClick={saveJson}>
          <Download size={16} /> تنزيل ملف الامتحان (.json)
        </button>
        <p className="hint-text">يمكنك فتح هذا الملف لاحقاً من زر «فتح ملف» في الصفحة الرئيسية.</p>
      </Section>
    </div>
  );
}
