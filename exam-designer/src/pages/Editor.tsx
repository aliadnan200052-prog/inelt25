import { useCallback, useDeferredValue, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, Check, ChevronLeft, ChevronRight, Eye, FileDown, Loader2, X } from 'lucide-react';
import type { Exam } from '../types';
import { examTitle } from '../model';
import { loadExam, saveExam } from '../store';
import { go } from '../App';
import { geometry, PaperDoc, type LayoutInfo } from '../paper/Paper';
import InfoPanel from '../editor/InfoPanel';
import QuestionsPanel from '../editor/QuestionsPanel';
import SettingsPanel from '../editor/SettingsPanel';
import Preview from '../editor/Preview';

export type Update = (fn: (e: Exam) => Exam) => void;

const STEPS = ['معلومات الامتحان', 'الأسئلة', 'المعاينة والتصدير'];

export default function Editor({ id }: { id: string }) {
  const [exam, setExam] = useState<Exam | null>(null);
  const [missing, setMissing] = useState(false);
  const [step, setStep] = useState(0);
  const [saved, setSaved] = useState<'saved' | 'saving'>('saved');
  const [layout, setLayout] = useState<LayoutInfo | null>(null);
  const [mobilePreview, setMobilePreview] = useState(false);
  const [printJob, setPrintJob] = useState<{ name: string; n: number } | null>(null);
  const dirty = useRef(false);

  useEffect(() => {
    loadExam(id).then((e) => (e ? setExam(e) : setMissing(true)));
  }, [id]);

  const update: Update = useCallback((fn) => {
    dirty.current = true;
    setExam((e) => (e ? { ...fn(e), updatedAt: Date.now() } : e));
  }, []);

  // autosave
  useEffect(() => {
    if (!exam || !dirty.current) return;
    setSaved('saving');
    const t = setTimeout(() => {
      saveExam(exam).then(() => setSaved('saved'));
    }, 500);
    return () => clearTimeout(t);
  }, [exam]);

  // save immediately when leaving the page
  useEffect(() => {
    const flush = () => {
      if (exam && dirty.current) saveExam(exam);
    };
    window.addEventListener('pagehide', flush);
    return () => window.removeEventListener('pagehide', flush);
  }, [exam]);

  const deferred = useDeferredValue(exam);

  if (missing)
    return (
      <div className="center-msg">
        <p>لم يُعثر على هذا الامتحان على هذا الجهاز.</p>
        <button className="btn primary" onClick={() => go(null)}>
          العودة إلى الرئيسية
        </button>
      </div>
    );
  if (!exam || !deferred) return <div className="center-msg">جارٍ التحميل…</div>;

  const exportPdf = () => setPrintJob({ name: examTitle(exam), n: Date.now() });

  const panels = [
    <InfoPanel key="i" exam={exam} update={update} />,
    <QuestionsPanel key="q" exam={exam} update={update} />,
    <SettingsPanel key="s" exam={exam} update={update} layout={layout} onExport={exportPdf} />,
  ];

  return (
    <div className={'editor step-' + step + (mobilePreview ? ' show-preview' : '')}>
      <header className="topbar">
        <button className="btn ghost sm back" onClick={() => go(null)} title="الامتحانات">
          <ArrowRight size={17} /> <span className="hide-sm">امتحاناتي</span>
        </button>
        <div className="topbar-title">
          <input
            className="title-input"
            value={exam.name}
            placeholder={examTitle({ ...exam, name: '' })}
            onChange={(e) => update((x) => ({ ...x, name: e.target.value }))}
            aria-label="اسم الامتحان"
          />
          <span className={'save-state ' + saved}>
            {saved === 'saving' ? <Loader2 size={13} className="spin" /> : <Check size={13} />}
            {saved === 'saving' ? 'جارٍ الحفظ' : 'محفوظ'}
          </span>
        </div>
        <button className="btn ghost sm preview-toggle" onClick={() => setMobilePreview(!mobilePreview)}>
          {mobilePreview ? <X size={16} /> : <Eye size={16} />} {mobilePreview ? 'إغلاق' : 'معاينة'}
        </button>
        <button className="btn primary sm" onClick={exportPdf}>
          <FileDown size={16} /> <span>تصدير PDF</span>
        </button>
      </header>

      <nav className="stepper" aria-label="خطوات إنشاء الامتحان">
        {STEPS.map((s, i) => (
          <button
            key={s}
            className={'step' + (i === step ? ' active' : '') + (i < step ? ' done' : '')}
            onClick={() => {
              setStep(i);
              setMobilePreview(false);
              window.scrollTo({ top: 0 });
            }}
            aria-current={i === step ? 'step' : undefined}
          >
            <span className="step-n">{i + 1}</span>
            <span className="step-label">{s}</span>
          </button>
        ))}
      </nav>

      <div className="workspace">
        <div className="pane-edit">
            {panels[step]}
            <div className="step-nav">
              {step > 0 ? (
                <button className="btn ghost" onClick={() => setStep(step - 1)}>
                  <ChevronRight size={17} /> {STEPS[step - 1]}
                </button>
              ) : (
                <span />
              )}
              {step < STEPS.length - 1 && (
                <button className="btn soft" onClick={() => setStep(step + 1)}>
                  {STEPS[step + 1]} <ChevronLeft size={17} />
                </button>
              )}
            </div>
        </div>
        <div className="pane-preview">
          <Preview exam={deferred} onLayout={setLayout} />
        </div>
      </div>

      {printJob && <PrintJob key={printJob.n} exam={exam} job={printJob} onDone={() => setPrintJob(null)} />}
    </div>
  );
}

/* ─── Printing: the very same paper DOM, rendered unscaled for the browser's PDF engine ─── */

function PrintJob({ exam, job, onDone }: { exam: Exam; job: { name: string }; onDone: () => void }) {
  const [host] = useState(() => {
    const d = document.createElement('div');
    d.id = 'print-root';
    return d;
  });
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    document.body.appendChild(host);
    const g = geometry(exam.design);
    const style = document.createElement('style');
    style.textContent = `@page { size: ${g.pageW}mm ${g.pageH}mm; margin: 0; }`;
    document.head.appendChild(style);
    const oldTitle = document.title;
    let cancelled = false;

    const cleanup = () => {
      document.title = oldTitle;
      style.remove();
      host.remove();
    };
    const after = () => {
      window.removeEventListener('afterprint', after);
      onDone();
    };

    (async () => {
      await document.fonts?.ready;
      await new Promise((r) => setTimeout(r, 250));
      await Promise.all(
        Array.from(host.querySelectorAll('img')).map((img) => (img.complete ? null : img.decode().catch(() => null))),
      );
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      if (cancelled) return;
      setBusy(false);
      document.title = job.name.replace(/[\\/:*?"<>|]/g, '-');
      window.addEventListener('afterprint', after);
      window.print();
    })();

    return () => {
      cancelled = true;
      window.removeEventListener('afterprint', after);
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {createPortal(<PaperDoc exam={exam} forPrint />, host)}
      {busy && (
        <div className="print-busy" role="status">
          <Loader2 size={18} className="spin" /> جارٍ تجهيز ملف PDF…
        </div>
      )}
    </>
  );
}
