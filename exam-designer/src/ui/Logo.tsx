export function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden className="logo">
      <rect width="64" height="64" rx="14" fill="var(--primary)" />
      <path d="M20 14h18l8 8v28a2 2 0 0 1-2 2H20a2 2 0 0 1-2-2V16a2 2 0 0 1 2-2z" fill="#fff" />
      <path d="M38 14v8h8" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinejoin="round" opacity=".35" />
      <path d="M24 31h16M24 38h16M24 45h10" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
