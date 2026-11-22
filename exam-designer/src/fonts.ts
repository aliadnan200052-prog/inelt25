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

export const AR_FONTS = [
  { id: 'Amiri', label: 'أميري — نسخ أكاديمي' },
  { id: 'Noto Naskh Arabic', label: 'نوتو نسخ — واضح للطباعة' },
  { id: 'IBM Plex Sans Arabic', label: 'بلكس — حديث' },
  { id: 'Cairo', label: 'القاهرة — عريض' },
  { id: 'Tajawal', label: 'تجوال — خفيف' },
];

export const LATIN_FONTS = [
  { id: 'same', label: 'نفس الخط العربي' },
  { id: 'Noto Serif', label: 'Noto Serif — كلاسيكي' },
  { id: 'Open Sans', label: 'Open Sans — بسيط' },
];

export function fontStack(ar: string, latin: string) {
  const a = `"${ar}"`;
  // Latin font first: browsers fall back to the Arabic font for Arabic glyphs.
  return latin === 'same' ? `${a}, serif` : `"${latin}", ${a}, serif`;
}
