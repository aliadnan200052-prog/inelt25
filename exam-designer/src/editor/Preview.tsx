import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Minus, Plus, Scissors } from 'lucide-react';
import type { Exam } from '../types';
import { geometry, PaperDoc, PX_PER_MM, type LayoutInfo } from '../paper/Paper';
import { fmtNum, marksSum } from '../model';

export default function Preview({ exam, onLayout }: { exam: Exam; onLayout: (l: LayoutInfo) => void }) {
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
  const fit = Math.min(1, Math.max(0.2, (boxW - 24) / pageWpx));
  const scale = fit * zoom;

  const sum = marksSum(exam);
  const total = exam.info.totalMarks;
  const mismatch = total != null && exam.questions.length > 0 && Math.abs(sum - total) > 1e-9;

  return (
    <div className="preview">
      <div className="preview-bar">
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
          {layout?.shrunk && !layout.overflow && <span className="chip muted">صُغّر الخط إلى {fmtNum(layout.fontSize)}pt ليتسع في صفحة واحدة</span>}
          {layout?.overflow && exam.design.fitOnePage && (
            <span className="chip warn">
              <AlertTriangle size={13} /> الأسئلة لا تتسع في صفحة واحدة حتى بأصغر خط مقروء
            </span>
          )}
          {layout?.twoUpRequested && !layout.twoUpFits && (
            <span className="chip warn">
              <AlertTriangle size={13} /> لا تتسع نسختان في الصفحة — تُعرض نسخة واحدة
            </span>
          )}
          {layout?.tooTall && (
            <span className="chip warn">
              <AlertTriangle size={13} /> يوجد عنصر أطول من الصفحة
            </span>
          )}
          {mismatch && (
            <span className="chip warn">
              <AlertTriangle size={13} /> مجموع الدرجات {fmtNum(sum)} ≠ الدرجة الكلية {fmtNum(total!)}
            </span>
          )}
        </div>
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

      <div className="preview-canvas" ref={boxRef}>
        <PaperDoc
          exam={exam}
          scale={scale}
          onLayout={(l) => {
            setLayout(l);
            onLayout(l);
          }}
        />
      </div>
    </div>
  );
}
