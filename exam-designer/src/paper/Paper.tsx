import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { DesignSettings, Exam } from '../types';
import { buildGroups, LABELS, makeDigits, type Group, type Segment } from './blocks';
import { fontStack } from '../fonts';
import './paper.css';

export const PX_PER_MM = 96 / 25.4;
const SIZES = { A4: [210, 297], Letter: [215.9, 279.4], A5: [148, 210] } as const;
const FOOTER_MM = 7;
const TWO_UP_GAP_MM = 12;

export interface Geometry {
  pageW: number;
  pageH: number;
  contentW: number;
  contentH: number;
  stacked: boolean; // two-up copies stacked vertically (portrait) or side by side
  regionW: number;
  regionH: number;
}

export function geometry(d: DesignSettings): Geometry {
  let [w, h]: number[] = [...SIZES[d.pageSize]];
  if (d.orientation === 'landscape') [w, h] = [h, w];
  const m = d.margins;
  const contentW = w - m.left - m.right;
  const contentH = h - m.top - m.bottom;
  const stacked = h >= w;
  return {
    pageW: w,
    pageH: h,
    contentW,
    contentH,
    stacked,
    regionW: stacked ? contentW : (contentW - TWO_UP_GAP_MM) / 2,
    regionH: stacked ? (contentH - TWO_UP_GAP_MM) / 2 : contentH,
  };
}

export function paperVars(d: DesignSettings): CSSProperties {
  const colors =
    d.colorMode === 'bw'
      ? { head: '#000', line: '#000' }
      : d.colorMode === 'gray'
        ? { head: '#262626', line: '#7a7a7a' }
        : { head: d.headingColor, line: d.dividerColor };
  return {
    '--p-font': fontStack(d.arFont, d.latinFont),
    '--p-fs': `${d.fontSize}pt`,
    '--p-hs': `${d.headingSize}pt`,
    '--p-lh': String(d.lineHeight),
    '--p-head': colors.head,
    '--p-line': colors.line,
  } as CSSProperties;
}

export interface LayoutInfo {
  mode: 'single' | 'double';
  pages: number;
  twoUpRequested: boolean;
  twoUpFits: boolean;
  fillRatio: number; // how much of one two-up region the content uses
  tooTall: boolean;
  fontSize: number; // the size actually printed (after fitting to one page)
  shrunk: boolean;
  overflow: boolean; // more than one page even at the smallest readable size
}

/* ─── Measurement ─── */

type Heights = Record<string, number>;
const TAG = '__tag';
const MIN_FONT_PT = 9;
const FIT_STEP = 0.04;

function Measurer({ segs, widthMm, tag, onMeasure }: { segs: Segment[]; widthMm: number; tag: string; onMeasure: (h: Heights) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [tick, setTick] = useState(0);
  const last = useRef('');

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const h: Heights = {};
    el.querySelectorAll<HTMLElement>(':scope > .seg').forEach((s) => {
      h[s.dataset.k!] = s.getBoundingClientRect().height;
    });
    const sig = tag + JSON.stringify(h);
    if (sig !== last.current) {
      last.current = sig;
      onMeasure({ ...h, [TAG]: tag as unknown as number });
    }
  });

  useEffect(() => {
    const el = ref.current;
    const bump = () => setTick((t) => t + 1);
    el?.addEventListener('load', bump, true);
    document.fonts?.addEventListener?.('loadingdone', bump);
    document.fonts?.ready.then(bump);
    return () => {
      el?.removeEventListener('load', bump, true);
      document.fonts?.removeEventListener?.('loadingdone', bump);
    };
  }, []);

  return (
    <div className="paper-measure" aria-hidden data-tick={tick}>
      <div ref={ref} style={{ width: `${widthMm}mm` }}>
        {segs.map((s) => (
          <div key={s.key} data-k={s.key} className={'seg' + (s.gapBefore ? ' gap' : '')}>
            {s.node}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Pagination ─── */

function paginate(groups: Group[], h: Heights, avail: number): { pages: string[][]; tooTall: boolean } {
  const pages: string[][] = [[]];
  let used = 0;
  let tooTall = false;
  const H = (s: Segment) => h[s.key] ?? 0;
  const cur = () => pages[pages.length - 1];
  const newPage = () => {
    pages.push([]);
    used = 0;
  };
  const place = (s: Segment) => {
    if (H(s) > avail) tooTall = true;
    cur().push(s.key);
    used += H(s);
  };

  for (const g of groups) {
    const total = g.segs.reduce((a, s) => a + H(s), 0);
    if (used + total <= avail) {
      g.segs.forEach(place);
      continue;
    }
    // Move a whole question to the next page only when little space would be wasted,
    // or when it is short; otherwise split it between its parts.
    const remaining = avail - used;
    if (total <= avail && cur().length && (remaining < avail * 0.28 || g.segs.length <= 3)) {
      newPage();
      g.segs.forEach(place);
      continue;
    }
    // Too big for one page: split between segments, keeping headings with what follows.
    g.segs.forEach((s, i) => {
      let need = H(s);
      let j = i;
      while (g.segs[j].keepWithNext && j + 1 < g.segs.length) {
        j++;
        need += H(g.segs[j]);
      }
      if (need > avail) need = H(s);
      if (used + need > avail && cur().length) newPage();
      place(s);
    });
  }
  return { pages, tooTall };
}

/* ─── Paper document ─── */

interface Props {
  exam: Exam;
  scale?: number;
  forPrint?: boolean;
  onLayout?: (info: LayoutInfo) => void;
}

/** Lines can tighten by this much (as extra fit steps) once the font is at its minimum. */
const LH_EXTRA = 0.12;
const MIN_LINE_HEIGHT = 1.2;

/** The exam shrunk by k: font sizes first, then (below minFit) tighter line spacing. */
function scaled(exam: Exam, k: number, minFit: number): Exam {
  if (k === 1) return exam;
  const fk = Math.max(k, minFit);
  const r = (n: number) => Math.round(n * fk * 10) / 10;
  const lh = k < minFit ? Math.max(MIN_LINE_HEIGHT, exam.design.lineHeight - (minFit - k) * 3) : exam.design.lineHeight;
  return {
    ...exam,
    design: { ...exam.design, fontSize: r(exam.design.fontSize), headingSize: r(exam.design.headingSize), lineHeight: lh },
    closing: { ...exam.closing, size: r(exam.closing.size) },
  };
}

export function PaperDoc({ exam: source, scale = 1, forPrint, onLayout }: Props) {
  const [fit, setFit] = useState(1);
  // a new exam starts again from the chosen size, then shrinks if needed
  useLayoutEffect(() => setFit(1), [source]);
  const tag = String(fit);
  const minFit = Math.min(1, MIN_FONT_PT / source.design.fontSize);
  const lowest = minFit - LH_EXTRA;
  const exam = useMemo(() => scaled(source, fit, minFit), [source, fit, minFit]);

  const d = exam.design;
  const g = geometry(d);
  const groups = useMemo(() => buildGroups(exam), [exam]);
  const segs = useMemo(() => groups.flatMap((x) => x.segs), [groups]);
  const byKey = useMemo(() => new Map(segs.map((s) => [s.key, s])), [segs]);

  const [hSingle, setHSingle] = useState<Heights>({});
  const [hRegion, setHRegion] = useState<Heights>({});
  const twoUpAtFull = useRef(false);

  const allowTwoUp = d.copies !== 'single';
  const separateRegionWidth = Math.abs(g.regionW - g.contentW) > 0.01;
  const footerPx = d.pageNumbers ? FOOTER_MM * PX_PER_MM : 0;
  const measured = String(hSingle[TAG]) === tag;

  const layout = useMemo(() => {
    const avail = g.contentH * PX_PER_MM - footerPx - 1;
    const single = paginate(groups, hSingle, avail);
    const regionHeights = separateRegionWidth ? hRegion : hSingle;
    const totalRegion = segs.reduce((a, s) => a + (regionHeights[s.key] ?? 0), 0);
    const regionAvail = g.regionH * PX_PER_MM - 1;
    if (fit === 1 && measured && (!separateRegionWidth || String(hRegion[TAG]) === tag)) {
      twoUpAtFull.current = totalRegion > 0 && totalRegion <= regionAvail;
    }
    const twoUpFits = twoUpAtFull.current;
    // two copies only at the chosen font size, never with a shrunk font
    const mode: 'single' | 'double' = allowTwoUp && twoUpFits && fit === 1 ? 'double' : 'single';
    return {
      single,
      mode,
      info: {
        mode,
        pages: mode === 'double' ? 1 : single.pages.length,
        twoUpRequested: d.copies === 'double',
        twoUpFits,
        fillRatio: fit === 1 ? totalRegion / regionAvail : 1,
        tooTall: single.tooTall,
        fontSize: d.fontSize,
        shrunk: fit < 1,
        overflow: single.pages.length > 1,
      } as LayoutInfo,
    };
  }, [groups, segs, hSingle, hRegion, g.contentH, g.regionH, footerPx, separateRegionWidth, allowTwoUp, d.copies, d.fontSize, fit, tag, measured]);

  // fit to one page: step the font down until the paper is a single page
  useLayoutEffect(() => {
    if (!source.design.fitOnePage || !measured || layout.mode === 'double') return;
    if (layout.single.pages.length > 1 && fit - FIT_STEP >= lowest - 1e-9) setFit(+(fit - FIT_STEP).toFixed(3));
  }, [layout, measured, fit, lowest, source.design.fitOnePage]);

  const settled =
    measured &&
    !(source.design.fitOnePage && layout.mode !== 'double' && layout.single.pages.length > 1 && fit - FIT_STEP >= lowest - 1e-9);
  const infoSig = settled ? JSON.stringify(layout.info) : '';
  useEffect(() => {
    if (settled) onLayout?.(layout.info);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [infoSig]);

  const digits = makeDigits(exam);
  const frameDir = d.lang === 'en' ? 'ltr' : 'rtl';
  const L = LABELS[frameDir === 'rtl' ? 'ar' : 'en'];

  const renderSegs = (keys: string[]) =>
    keys.map((k, i) => {
      const s = byKey.get(k);
      if (!s) return null;
      const cls = 'seg' + (s.gapBefore && i > 0 ? ' gap' : '') + (s.bottom ? ' at-bottom' : '');
      return (
        <div key={k} className={cls}>
          {s.node}
        </div>
      );
    });

  const pageStyle: CSSProperties = {
    width: `${g.pageW}mm`,
    height: `${g.pageH}mm`,
    paddingTop: `${d.margins.top}mm`,
    paddingBottom: `${d.margins.bottom}mm`,
    paddingLeft: `${d.margins.left}mm`,
    paddingRight: `${d.margins.right}mm`,
  };

  let pages: JSX.Element[];
  if (layout.mode === 'double') {
    const keys = segs.map((s) => s.key);
    const region = (n: number) => (
      <div className="region" key={n} style={{ width: `${g.regionW}mm`, height: `${g.regionH}mm` }}>
        {renderSegs(keys)}
      </div>
    );
    pages = [
      <div className="page" style={pageStyle} key="p0">
        <div className={'page-content two-up ' + (g.stacked ? 'stacked' : 'side')}>
          {region(0)}
          <div className={'cut' + (d.cutLine ? ' dashed' : ' solid')} style={g.stacked ? { height: `${TWO_UP_GAP_MM}mm` } : { width: `${TWO_UP_GAP_MM}mm` }}>
            <span className="cut-line" />
            {d.cutLine && <span className="scissors">✂</span>}
          </div>
          {region(1)}
        </div>
      </div>,
    ];
  } else {
    const ps = layout.single.pages;
    pages = ps.map((keys, i) => (
      <div className="page" style={pageStyle} key={'p' + i}>
        <div className="page-content" style={{ height: `${g.contentH}mm` }}>
          <div className="page-body">{renderSegs(keys)}</div>
          {d.pageNumbers && (
            <div className="page-foot" dir={frameDir} style={{ height: `${FOOTER_MM}mm` }}>
              <span>
                {L.page} {digits(String(i + 1), frameDir)} {L.of} {digits(String(ps.length), frameDir)}
              </span>
              {i < ps.length - 1 && <span className="cont">{frameDir === 'rtl' ? `${L.cont} ←` : `${L.cont} →`}</span>}
            </div>
          )}
        </div>
      </div>
    ));
  }

  const gapMm = forPrint ? 0 : 8;
  const totalHpx = pages.length * g.pageH * PX_PER_MM + (pages.length - 1) * gapMm * PX_PER_MM;
  const widthPx = g.pageW * PX_PER_MM;

  return (
    <div className={'paper-root' + (forPrint ? ' for-print' : '')} style={paperVars(d)}>
      <Measurer segs={segs} widthMm={g.contentW} tag={tag} onMeasure={setHSingle} />
      {allowTwoUp && separateRegionWidth && <Measurer segs={segs} widthMm={g.regionW} tag={tag} onMeasure={setHRegion} />}
      {forPrint ? (
        <div className="paper-pages">{pages}</div>
      ) : (
        <div className="paper-scaler" style={{ width: widthPx * scale, height: totalHpx * scale }}>
          <div className="paper-pages" style={{ transform: `scale(${scale})`, width: widthPx, rowGap: `${gapMm}mm` }}>
            {pages}
          </div>
        </div>
      )}
    </div>
  );
}
