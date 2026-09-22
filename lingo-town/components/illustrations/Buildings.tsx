/**
 * Small building sprites for the town map. Each draws with its base
 * centred on (0,0) so the map can place it with a translate().
 */

const W = "var(--lt-wall)";
const R = "var(--lt-roof)";
const INK = "#1F2A2E";
const WIN = "var(--lt-sun-soft)";

export function Cafe() {
  return (
    <g>
      <ellipse cx="0" cy="2" rx="34" ry="5" fill="#000" opacity="0.08" />
      <rect x="-28" y="-40" width="56" height="40" rx="3" fill={W} />
      <path d="M-33 -40L0 -58L33 -40Z" fill={R} />
      <rect x="-3" y="-66" width="6" height="12" rx="1.5" fill="var(--lt-terra-deep)" />
      {/* striped awning */}
      <path d="M-30 -30H30L27 -22H-27Z" fill="var(--lt-teal)" />
      {[-24, -12, 0, 12].map((x) => (
        <path key={x} d={`M${x} -30H${x + 6}L${x + 5.4} -22H${x - 0.6}Z`} fill="#FFFDF8" opacity="0.85" />
      ))}
      <rect x="-22" y="-18" width="14" height="12" rx="2" fill={WIN} />
      <rect x="8" y="-18" width="14" height="12" rx="2" fill={WIN} />
      <rect x="-5" y="-17" width="10" height="17" rx="5" fill="var(--lt-teal-pressed)" />
      {/* steam from the cup sign */}
      <circle cx="0" cy="-45" r="4.5" fill="#FFFDF8" stroke={INK} strokeOpacity="0.2" />
    </g>
  );
}

export function Bakery() {
  return (
    <g>
      <ellipse cx="0" cy="2" rx="32" ry="5" fill="#000" opacity="0.08" />
      <rect x="-26" y="-44" width="52" height="44" rx="3" fill={W} />
      <path d="M-30 -44C-30 -58 30 -58 30 -44Z" fill="var(--lt-terra)" />
      <path d="M-28 -32H28L25 -25H-25Z" fill="var(--lt-terra-deep)" />
      {[-22, -10, 2, 14].map((x) => (
        <path key={x} d={`M${x} -32H${x + 6}L${x + 5.4} -25H${x - 0.6}Z`} fill="var(--lt-sun-soft)" />
      ))}
      <rect x="-20" y="-20" width="13" height="11" rx="2" fill={WIN} />
      <rect x="7" y="-20" width="13" height="11" rx="2" fill={WIN} />
      <ellipse cx="13.5" cy="-14" rx="4" ry="2" fill="var(--lt-sun)" />
      <rect x="-5" y="-18" width="10" height="18" rx="2" fill="#6B4A33" />
      <ellipse cx="0" cy="-49" rx="9" ry="4" fill="var(--lt-sun)" />
      <path d="M-5 -50l2 2M-1 -51l2 2M3 -50l2 2" stroke="#6B4A33" strokeWidth="1" />
    </g>
  );
}

export function Pharmacy() {
  return (
    <g>
      <ellipse cx="0" cy="2" rx="30" ry="5" fill="#000" opacity="0.08" />
      <rect x="-26" y="-46" width="52" height="46" rx="3" fill={W} />
      <rect x="-29" y="-50" width="58" height="7" rx="2" fill="var(--lt-leaf)" />
      <rect x="-20" y="-36" width="12" height="12" rx="2" fill={WIN} />
      <rect x="8" y="-36" width="12" height="12" rx="2" fill={WIN} />
      <rect x="-6" y="-20" width="12" height="20" rx="2" fill="var(--lt-leaf)" />
      <g transform="translate(0 -33)">
        <rect x="-5" y="-1.8" width="10" height="3.6" rx="1" fill="var(--lt-leaf)" />
        <rect x="-1.8" y="-5" width="3.6" height="10" rx="1" fill="var(--lt-leaf)" />
      </g>
    </g>
  );
}

export function Station() {
  return (
    <g>
      <ellipse cx="0" cy="2" rx="40" ry="5" fill="#000" opacity="0.08" />
      <rect x="-36" y="-30" width="72" height="30" rx="3" fill={W} />
      <path d="M-42 -30H42L34 -42H-34Z" fill="var(--lt-teal-pressed)" />
      <circle cx="0" cy="-36" r="5" fill="#FFFDF8" />
      <path d="M0 -38.5V-36H2" stroke={INK} strokeWidth="1.1" fill="none" strokeLinecap="round" />
      {[-28, -14, 6, 20].map((x) => (
        <rect key={x} x={x} y="-22" width="9" height="12" rx="4.5" fill={WIN} />
      ))}
      <rect x="-4" y="-20" width="8" height="20" rx="1.5" fill="var(--lt-teal)" />
    </g>
  );
}

export function Hotel() {
  return (
    <g>
      <ellipse cx="0" cy="2" rx="30" ry="5" fill="#000" opacity="0.08" />
      <rect x="-24" y="-62" width="48" height="62" rx="3" fill={W} />
      <rect x="-27" y="-66" width="54" height="7" rx="2" fill={R} />
      {[-54, -42, -30].map((y) =>
        [-17, -5, 7].map((x) => <rect key={`${x}${y}`} x={x} y={y} width="9" height="8" rx="1.5" fill={WIN} />),
      )}
      <path d="M-12 -14H12L10 -10H-10Z" fill="var(--lt-terra-deep)" />
      <rect x="-6" y="-10" width="12" height="10" rx="1.5" fill="var(--lt-terra)" />
    </g>
  );
}

export function Tree({ x, y, s = 1, tone = 0 }: { x: number; y: number; s?: number; tone?: 0 | 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="1" rx="10" ry="3" fill="#000" opacity="0.07" />
      <rect x="-1.6" y="-10" width="3.2" height="11" rx="1.2" fill="#8A6547" />
      <circle cx="0" cy="-17" r="10" fill={tone ? "#5F7F4D" : "var(--lt-leaf)"} />
      <circle cx="-4" cy="-20" r="4" fill="#FFFDF8" opacity="0.14" />
    </g>
  );
}

export const buildingFor: Record<string, () => React.JSX.Element> = {
  cafe: Cafe,
  bakery: Bakery,
  pharmacy: Pharmacy,
  station: Station,
  hotel: Hotel,
};
