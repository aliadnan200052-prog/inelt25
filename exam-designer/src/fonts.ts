// Bundled fonts (only the Arabic + Latin subsets) so the preview and the
// printed PDF use exactly the same glyphs on every device.
import '@fontsource/amiri/arabic-400.css';
import '@fontsource/amiri/arabic-700.css';
import '@fontsource/amiri/latin-400.css';
import '@fontsource/amiri/latin-700.css';
import '@fontsource/noto-naskh-arabic/arabic-400.css';
import '@fontsource/noto-naskh-arabic/arabic-700.css';
import '@fontsource/noto-naskh-arabic/latin-400.css';
import '@fontsource/noto-naskh-arabic/latin-700.css';
import '@fontsource/cairo/arabic-400.css';
import '@fontsource/cairo/arabic-700.css';
import '@fontsource/cairo/latin-400.css';
import '@fontsource/cairo/latin-700.css';
import '@fontsource/tajawal/arabic-400.css';
import '@fontsource/tajawal/arabic-700.css';
import '@fontsource/tajawal/latin-400.css';
import '@fontsource/tajawal/latin-700.css';
import '@fontsource/ibm-plex-sans-arabic/arabic-400.css';
import '@fontsource/ibm-plex-sans-arabic/arabic-700.css';
import '@fontsource/ibm-plex-sans-arabic/latin-400.css';
import '@fontsource/ibm-plex-sans-arabic/latin-700.css';
import '@fontsource/noto-serif/latin-400.css';
import '@fontsource/noto-serif/latin-700.css';
import '@fontsource/open-sans/latin-400.css';
import '@fontsource/open-sans/latin-700.css';
// Tinos: metric-compatible with Times New Roman, used where Times New Roman isn't installed.
import '@fontsource/tinos/latin-400.css';
import '@fontsource/tinos/latin-700.css';

export const AR_FONTS = [
  { id: 'Amiri', label: 'أميري — نسخ أكاديمي' },
  { id: 'Noto Naskh Arabic', label: 'نوتو نسخ — واضح للطباعة' },
  { id: 'IBM Plex Sans Arabic', label: 'بلكس — حديث' },
  { id: 'Cairo', label: 'القاهرة — عريض' },
  { id: 'Tajawal', label: 'تجوال — خفيف' },
  { id: 'Times New Roman', label: 'Times New Roman' },
];

export const LATIN_FONTS = [
  { id: 'same', label: 'نفس الخط العربي' },
  { id: 'Times New Roman', label: 'Times New Roman' },
  { id: 'Noto Serif', label: 'Noto Serif — كلاسيكي' },
  { id: 'Open Sans', label: 'Open Sans — بسيط' },
];

// Times New Roman comes from the device; Tinos (same metrics) stands in where it is missing,
// and Amiri covers Arabic letters when the device's Times New Roman has none.
const FALLBACK: Record<string, string> = {
  'Times New Roman': '"Times New Roman", "Tinos", "Amiri"',
};
const fam = (f: string) => FALLBACK[f] ?? `"${f}"`;

export function fontStack(ar: string, latin: string) {
  // Latin font first: browsers fall back to the Arabic font for Arabic glyphs.
  return latin === 'same' ? `${fam(ar)}, serif` : `${fam(latin)}, ${fam(ar)}, serif`;
}
