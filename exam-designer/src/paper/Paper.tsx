import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { DesignSettings, Exam, Variant } from '../types';
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
}

/* ─── Measurement ─── */

type Heights = Record<string, number>;

function Measurer({ segs, widthMm, onMeasure }: { segs: Segment[]; widthMm: number; onMeasure: (h: Heights) => void }) {
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
    const sig = JSON.stringify(h);
    if (sig !== last.current) {
      last.current = sig;
      onMeasure(h);
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
  variant: Variant;
  scale?: number;
  forPrint?: boolean;
  onLayout?: (info: LayoutInfo) => void;
}

export function PaperDoc({ exam, variant, scale = 1, forPrint, onLayout }: Props) {
  const d = exam.design;
  const g = geometry(d);
  const groups = useMemo(() => buildGroups(exam, variant), [exam, variant]);
  const segs = useMemo(() => groups.flatMap((x) => x.segs), [groups]);
  const byKey = useMemo(() => new Map(segs.map((s) => [s.key, s])), [segs]);

  const [hSingle, setHSingle] = useState<Heights>({});
  const [hRegion, setHRegion] = useState<Heights>({});

  const allowTwoUp = variant === 'student' && d.copies !== 'single';
  const separateRegionWidth = Math.abs(g.regionW - g.contentW) > 0.01;
  const footerPx = d.pageNumbers ? FOOTER_MM * PX_PER_MM : 0;

  const layout = useMemo(() => {
    const avail = g.contentH * PX_PER_MM - footerPx - 1;
    const single = paginate(groups, hSingle, avail);
    const regionHeights = separateRegionWidth ? hRegion : hSingle;
    const totalRegion = segs.reduce((a, s) => a + (regionHeights[s.key] ?? 0), 0);
    const regionAvail = g.regionH * PX_PER_MM - 1;
    const twoUpFits = totalRegion > 0 && totalRegion <= regionAvail;
    const mode: 'single' | 'double' = allowTwoUp && twoUpFits ? 'double' : 'single';
    return {
      single,
      mode,
      info: {
        mode,
        pages: mode === 'double' ? 1 : single.pages.length,
        twoUpRequested: variant === 'student' && d.copies === 'double',
        twoUpFits,
        fillRatio: totalRegion / regionAvail,
        tooTall: single.tooTall,
      } as LayoutInfo,
    };
  }, [groups, segs, hSingle, hRegion, g.contentH, g.regionH, footerPx, separateRegionWidth, allowTwoUp, variant, d.copies]);

  const infoSig = JSON.stringify(layout.info);
  useEffect(() => {
    onLayout?.(layout.info);
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
      <Measurer segs={segs} widthMm={g.contentW} onMeasure={setHSingle} />
      {allowTwoUp && separateRegionWidth && <Measurer segs={segs} widthMm={g.regionW} onMeasure={setHRegion} />}
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
