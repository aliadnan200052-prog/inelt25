import { useEffect, useRef, useState } from 'react';
import { Copy, FileText, FolderOpen, Plus, Trash2, Upload } from 'lucide-react';
import type { Exam } from '../types';
import { deepClone, examTitle, marksSum, newExam, normalizeExam, uid } from '../model';
import { deleteExam, listExams, saveExam } from '../store';
import { go } from '../App';
import { Logo } from '../ui/Logo';

const fmtDate = (t: number) =>
  new Intl.DateTimeFormat('ar', { dateStyle: 'medium', timeStyle: 'short', numberingSystem: 'latn' }).format(t);

export default function Home() {
  const [exams, setExams] = useState<Exam[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = () => listExams().then(setExams).catch(() => setExams([]));
  useEffect(() => {
    refresh();
  }, []);

  const create = async () => {
    const e = newExam();
    await saveExam(e);
    go(e.id);
  };

  const duplicate = async (src: Exam) => {
    const c = deepClone(src);
    c.id = uid();
    c.createdAt = c.updatedAt = Date.now();
    c.name = `${examTitle(src)} (نسخة)`;
    await saveExam(c);
    refresh();
  };

  const remove = async (e: Exam) => {
    if (!confirm(`حذف «${examTitle(e)}» نهائياً؟`)) return;
    await deleteExam(e.id);
    refresh();
  };

  const importFile = async (f: File) => {
    try {
      const data = JSON.parse(await f.text());
      if (!data || !Array.isArray(data.questions) || !data.design) throw new Error();
      const e = normalizeExam(data);
      e.id = uid();
      e.updatedAt = Date.now();
      await saveExam(e);
      go(e.id);
    } catch {
      alert('الملف غير صالح. اختر ملف امتحان محفوظاً من هذا التطبيق (.json).');
    }
  };

  return (
    <div className="home">
      <header className="home-top">
        <div className="brand">
          <Logo />
          <div>
            <div className="brand-name">مصمّم الامتحانات</div>
            <div className="brand-sub">أوراق امتحانات أنيقة وجاهزة للطباعة</div>
          </div>
        </div>
      </header>

      <main className="home-main">
        <section className="hero card">
          <div>
            <h1>أنشئ ورقة امتحان في دقائق</h1>
            <p>اكتب الأسئلة والدرجات، واختر التصميم، وشاهد الورقة كما ستُطبع، ثم صدّرها PDF.</p>
          </div>
          <div className="hero-actions">
            <button className="btn primary lg" onClick={create}>
              <Plus size={18} /> امتحان جديد
            </button>
            <button className="btn ghost" onClick={() => fileRef.current?.click()} title="فتح ملف امتحان محفوظ (.json)">
              <Upload size={16} /> فتح ملف
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                if (f) importFile(f);
              }}
            />
          </div>
        </section>

        <h2 className="list-title">امتحاناتي</h2>
        {exams === null ? null : exams.length === 0 ? (
          <div className="empty card">
            <FileText size={28} strokeWidth={1.5} />
            <p>لا توجد امتحانات بعد. ابدأ بإنشاء امتحانك الأول.</p>
          </div>
        ) : (
          <ul className="exam-list">
            {exams.map((e) => (
              <li key={e.id} className="exam-row card">
                <button className="exam-open" onClick={() => go(e.id)}>
                  <span className="exam-icon">
                    <FileText size={20} strokeWidth={1.6} />
                  </span>
                  <span className="exam-meta">
                    <span className="exam-name">{examTitle(e)}</span>
                    <span className="exam-sub">
                      {[e.info.school, `${e.questions.length} ${e.questions.length === 1 ? 'سؤال' : 'أسئلة'}`, marksSum(e) ? `${marksSum(e)} درجة` : '']
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                    <span className="exam-date">آخر تعديل: {fmtDate(e.updatedAt)}</span>
                  </span>
                </button>
                <div className="exam-actions">
                  <button className="btn ghost sm" onClick={() => go(e.id)}>
                    <FolderOpen size={15} /> فتح
                  </button>
                  <button className="btn ghost sm" onClick={() => duplicate(e)} title="إنشاء نسخة جديدة من هذا الامتحان">
                    <Copy size={15} /> نسخ
                  </button>
                  <button className="icon-btn danger" onClick={() => remove(e)} title="حذف" aria-label="حذف">
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="home-note">تُحفظ امتحاناتك تلقائياً على هذا الجهاز وفي هذا المتصفح.</p>
      </main>
    </div>
  );
}
