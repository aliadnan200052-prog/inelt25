import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, ChevronLeft, Minus, Plus, Scissors } from 'lucide-react';
import type { Exam, Variant } from '../types';
import { geometry, PaperDoc, PX_PER_MM, type LayoutInfo } from '../paper/Paper';
import { marksSum } from '../model';
import { Segmented } from '../ui/ui';

interface Props {
  exam: Exam;
  variant: Variant;
  setVariant: (v: Variant) => void;
  onStudentLayout: (l: LayoutInfo) => void;
  wide?: boolean;
  onNext?: () => void;
}

export default function Preview({ exam, variant, setVariant, onStudentLayout, wide, onNext }: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [boxW, setBoxW] = useState(600);
  const [zoom, setZoom] = useState(1);
  const [layout, setLayout] = useState<LayoutInfo | null>(null);
  const g = geometry(exam.design);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setBoxW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pageWpx = g.pageW * PX_PER_MM;
  const fit = Math.min(wide ? 1.15 : 1, Math.max(0.2, (boxW - 24) / pageWpx));
  const scale = fit * zoom;

  const onLayout = (l: LayoutInfo) => {
    setLayout(l);
    if (variant === 'student') onStudentLayout(l);
  };

  const sum = marksSum(exam);
  const total = exam.info.totalMarks;
  const mismatch = total != null && exam.questions.length > 0 && Math.abs(sum - total) > 1e-9;

  return (
    <div className={'preview' + (wide ? ' wide' : '')}>
      <div className="preview-bar">
        <Segmented
          small
          value={variant}
          onChange={setVariant}
          options={[
            { value: 'student', label: 'نسخة الطالب' },
            { value: 'teacher', label: 'نسخة المدرس' },
            { value: 'key', label: 'نموذج الإجابة' },
          ]}
        />
        <div className="zoom">
          <button className="icon-btn" title="تصغير" aria-label="تصغير" onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(2)))}>
            <Minus size={15} />
          </button>
          <button className="zoom-val" onClick={() => setZoom(1)} title="ملاءمة العرض">
            {Math.round(scale * 100)}%
          </button>
          <button className="icon-btn" title="تكبير" aria-label="تكبير" onClick={() => setZoom((z) => Math.min(3, +(z + 0.1).toFixed(2)))}>
            <Plus size={15} />
          </button>
        </div>
      </div>

      <div className="preview-status">
        {layout && (
          <span className="chip">
            {layout.mode === 'double' ? (
              <>
                <Scissors size={13} /> نسختان في الصفحة
              </>
            ) : (
              `${layout.pages} ${layout.pages === 1 ? 'صفحة' : layout.pages === 2 ? 'صفحتان' : 'صفحات'}`
            )}
          </span>
        )}
        <span className="chip muted">
          {exam.design.pageSize} · {exam.design.orientation === 'portrait' ? 'عمودي' : 'أفقي'}
        </span>
        {variant === 'student' && layout?.twoUpRequested && !layout.twoUpFits && (
          <span className="chip warn">
            <AlertTriangle size={13} /> المحتوى لا يتسع لنسختين في الصفحة — تُعرض نسخة واحدة
          </span>
        )}
        {layout?.tooTall && (
          <span className="chip warn">
            <AlertTriangle size={13} /> يوجد عنصر أطول من الصفحة — قسّمه أو صغّر الصورة
          </span>
        )}
        {mismatch && (
          <span className="chip warn">
            <AlertTriangle size={13} /> مجموع الدرجات {sum} ≠ الدرجة الكلية {total}
          </span>
        )}
      </div>

      <div className="preview-canvas" ref={boxRef}>
        <PaperDoc exam={exam} variant={variant} scale={scale} onLayout={onLayout} />
      </div>

      {/* keep the student-copy layout known (two-up status) while another copy is shown */}
      {variant !== 'student' && (
        <div className="offscreen" aria-hidden>
          <PaperDoc exam={exam} variant="student" scale={0.1} onLayout={onStudentLayout} />
        </div>
      )}

      {onNext && (
        <div className="preview-next">
          <button className="btn primary" onClick={onNext}>
            متابعة إلى التصدير <ChevronLeft size={17} />
          </button>
        </div>
      )}
    </div>
  );
}
