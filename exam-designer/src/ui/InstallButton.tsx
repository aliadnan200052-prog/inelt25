import { useEffect, useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { canPrompt, isIos, isStandalone, onInstallChange, promptInstall } from '../install';

/** «تثبيت التطبيق»: the browser's install prompt, or the steps on iPhone/iPad. */
export function InstallButton() {
  const [, setTick] = useState(0);
  const [iosHelp, setIosHelp] = useState(false);
  useEffect(() => onInstallChange(() => setTick((t) => t + 1)), []);

  if (isStandalone()) return null;
  const ios = isIos();
  if (!canPrompt() && !ios) return null;

  return (
    <>
      <button className="btn ghost" onClick={() => (ios ? setIosHelp(true) : promptInstall())}>
        <Download size={16} /> تثبيت التطبيق
      </button>
      {iosHelp && (
        <div className="install-help card" role="dialog" aria-label="تثبيت التطبيق">
          <button className="icon-btn" aria-label="إغلاق" onClick={() => setIosHelp(false)}>
            <X size={16} />
          </button>
          <b>تثبيت التطبيق على iPhone أو iPad</b>
          <ol>
            <li>
              افتح الصفحة في Safari واضغط زر المشاركة <Share size={14} />.
            </li>
            <li>اختر «إضافة إلى الشاشة الرئيسية».</li>
            <li>اضغط «إضافة»، فيظهر التطبيق بين تطبيقاتك.</li>
          </ol>
        </div>
      )}
    </>
  );
}
