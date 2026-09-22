import type { Character } from "@/data/types";
import { Portrait } from "./Portrait";

type Props = { placeId: string; character: Character; className?: string };

/** Wide interior illustration used on the scene hero and media cards. */
export function SceneArt({ placeId, character, className }: Props) {
  return (
    <svg viewBox="0 0 360 200" className={className} preserveAspectRatio="xMidYMid slice" aria-hidden>
      <rect width="360" height="200" fill="var(--lt-wall)" />
      {placeId === "bakery" ? <BakeryBack /> : <CafeBack />}
      {/* the character stands behind the counter */}
      <svg x="128" y="46" width="112" height="112" viewBox="0 0 96 96" overflow="visible">
        <Portrait style={character.portrait} bare size={96} />
      </svg>
      {placeId === "bakery" ? <BakeryFront /> : <CafeFront />}
    </svg>
  );
}

function Pendant({ x, color, len = 34 }: { x: number; color: string; len?: number }) {
  return (
    <g>
      <line x1={x} y1="0" x2={x} y2={len} stroke="var(--lt-ink)" strokeOpacity="0.45" strokeWidth="1.2" />
      <circle cx={x} cy={len + 14} r="26" fill="var(--lt-sun)" opacity="0.14" />
      <path d={`M${x - 13} ${len + 12}C${x - 13} ${len} ${x + 13} ${len} ${x + 13} ${len + 12}Z`} fill={color} />
      <ellipse cx={x} cy={len + 12} rx="5" ry="2" fill="var(--lt-sun)" />
    </g>
  );
}

function CafeBack() {
  return (
    <g>
      {/* window with a view of the street */}
      <rect x="18" y="18" width="92" height="66" rx="10" fill="var(--lt-sky)" />
      <path d="M18 64C40 56 60 62 80 56C94 52 104 56 110 58V74C110 79.5 105.5 84 100 84H28C22.5 84 18 79.5 18 74Z" fill="var(--lt-leaf)" opacity="0.35" />
      <rect x="18" y="18" width="92" height="66" rx="10" fill="none" stroke="var(--lt-teal-pressed)" strokeWidth="4" />
      <line x1="64" y1="18" x2="64" y2="84" stroke="var(--lt-teal-pressed)" strokeWidth="3" />
      {/* plant hanging beside the window */}
      <path d="M118 0V30" stroke="var(--lt-ink)" strokeOpacity="0.4" strokeWidth="1.2" />
      <path d="M110 30H126L123 42H113Z" fill="var(--lt-terra)" />
      <path d="M113 40C108 48 110 56 106 62M118 42C118 52 120 58 118 66M123 40C128 48 128 54 131 60" stroke="var(--lt-leaf)" strokeWidth="3" strokeLinecap="round" fill="none" />
      {/* chalkboard menu */}
      <rect x="136" y="20" width="84" height="52" rx="6" fill="#2B3A36" />
      <rect x="136" y="20" width="84" height="52" rx="6" fill="none" stroke="#8A6547" strokeWidth="3" />
      <g stroke="#FFFDF8" strokeOpacity="0.7" strokeWidth="1.6" strokeLinecap="round">
        <path d="M148 34H178M148 44H170M148 54H182M148 62H166" />
        <path d="M196 34H208M196 44H208M196 54H208" strokeOpacity="0.45" />
      </g>
      {/* shelf with cups */}
      <rect x="244" y="64" width="100" height="5" rx="2" fill="#8A6547" />
      {[252, 270, 288].map((x, i) => (
        <g key={x}>
          <rect x={x} y="50" width="13" height="14" rx="3" fill={i === 1 ? "var(--lt-terra)" : "var(--lt-surface)"} stroke="var(--lt-ink)" strokeOpacity="0.15" />
        </g>
      ))}
      <rect x="310" y="40" width="22" height="24" rx="5" fill="var(--lt-teal-soft)" stroke="var(--lt-ink)" strokeOpacity="0.15" />
      <rect x="244" y="104" width="100" height="5" rx="2" fill="#8A6547" />
      <rect x="252" y="84" width="16" height="20" rx="4" fill="var(--lt-sun-soft)" stroke="var(--lt-ink)" strokeOpacity="0.15" />
      <rect x="274" y="88" width="16" height="16" rx="4" fill="var(--lt-teal)" opacity="0.8" />
      <Pendant x={236} color="var(--lt-terra)" len={10} />
    </g>
  );
}

function CafeFront() {
  return (
    <g>
      {/* counter */}
      <rect x="0" y="146" width="360" height="54" fill="#8A6547" />
      <rect x="0" y="140" width="360" height="10" rx="2" fill="#A47B58" />
      <g stroke="#6B4A33" strokeOpacity="0.5" strokeWidth="1.2">
        <path d="M60 150V200M120 150V200M180 150V200M240 150V200M300 150V200" />
      </g>
      {/* espresso machine */}
      <rect x="22" y="100" width="76" height="42" rx="6" fill="var(--lt-teal)" />
      <rect x="22" y="100" width="76" height="9" rx="4" fill="var(--lt-teal-pressed)" />
      <circle cx="42" cy="122" r="6" fill="var(--lt-surface)" />
      <path d="M42 122L45 119" stroke="var(--lt-ink)" strokeWidth="1.3" strokeLinecap="round" />
      <rect x="62" y="116" width="22" height="7" rx="2" fill="var(--lt-teal-pressed)" />
      <rect x="68" y="128" width="11" height="12" rx="2" fill="var(--lt-surface)" />
      {/* a latte with steam */}
      <path d="M278 122H304L301 140H281Z" fill="var(--lt-surface)" stroke="var(--lt-ink)" strokeOpacity="0.2" />
      <path d="M304 127C311 127 311 135 303 135" fill="none" stroke="var(--lt-surface)" strokeWidth="3" />
      <ellipse cx="291" cy="122" rx="13" ry="2.6" fill="#B98A62" />
      <g stroke="var(--lt-ink)" strokeOpacity="0.25" strokeWidth="1.8" strokeLinecap="round" fill="none">
        <path d="M286 114C283 110 289 107 286 102" />
        <path d="M295 114C292 110 298 107 295 102" />
      </g>
      {/* tip jar */}
      <rect x="318" y="120" width="20" height="20" rx="5" fill="var(--lt-sky)" stroke="var(--lt-ink)" strokeOpacity="0.2" />
      <circle cx="324" cy="133" r="3" fill="var(--lt-sun)" />
      <circle cx="331" cy="135" r="3" fill="var(--lt-sun)" />
    </g>
  );
}

function BakeryBack() {
  return (
    <g>
      {[44, 84, 124].map((y) => (
        <rect key={y} x="14" y={y} width="104" height="5" rx="2" fill="#8A6547" />
      ))}
      {[44, 84, 124].map((y, row) =>
        [26, 56, 86].map((x, i) => (
          <g key={`${x}${y}`}>
            <ellipse cx={x + 8} cy={y - 7} rx={row === 1 ? 11 : 13} ry={row === 1 ? 7 : 8} fill={(i + row) % 2 ? "#C48A4E" : "var(--lt-sun)"} />
            <path d={`M${x + 1} ${y - 9}l3 3M${x + 7} ${y - 10}l3 3M${x + 13} ${y - 9}l3 3`} stroke="#6B4A33" strokeOpacity="0.55" strokeWidth="1.2" />
          </g>
        )),
      )}
      <rect x="248" y="22" width="96" height="70" rx="10" fill="var(--lt-sky)" />
      <rect x="248" y="22" width="96" height="70" rx="10" fill="none" stroke="var(--lt-terra-deep)" strokeWidth="4" />
      <path d="M248 58H344M296 22V92" stroke="var(--lt-terra-deep)" strokeWidth="3" />
      <Pendant x={196} color="var(--lt-terra)" len={2} />
    </g>
  );
}

function BakeryFront() {
  return (
    <g>
      <rect x="0" y="146" width="360" height="54" fill="var(--lt-terra-deep)" />
      <rect x="0" y="140" width="360" height="10" rx="2" fill="#A47B58" />
      {/* display glass */}
      <rect x="18" y="154" width="120" height="36" rx="6" fill="var(--lt-sky)" opacity="0.5" />
      {[34, 64, 94, 120].map((x) => (
        <ellipse key={x} cx={x} cy="180" rx="10" ry="6" fill="var(--lt-sun)" />
      ))}
      {/* basket of baguettes */}
      <path d="M270 122H330L324 142H276Z" fill="#A47B58" />
      <path d="M284 124L276 92M298 124L296 88M312 124L320 94" stroke="#C48A4E" strokeWidth="8" strokeLinecap="round" />
    </g>
  );
}
