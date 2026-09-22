/** Lingo Town mark: a little house with a speech-bubble door. */
export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={className} aria-hidden>
      <rect width="48" height="48" rx="14" fill="var(--lt-teal)" />
      <path d="M11 22L24 11L37 22V36C37 37.1 36.1 38 35 38H13C11.9 38 11 37.1 11 36Z" fill="#FFFDF8" />
      <path d="M9 23L24 10L39 23" fill="none" stroke="var(--lt-terra)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 26H29C30.1 26 31 26.9 31 28V32C31 33.1 30.1 34 29 34H23L20 37V34H19C17.9 34 17 33.1 17 32V28C17 26.9 17.9 26 19 26Z" fill="var(--lt-teal)" />
    </svg>
  );
}
