import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';

export function Field({ label, hint, children, full }: { label: string; hint?: string; children: ReactNode; full?: boolean }) {
  return (
    <label className={'field' + (full ? ' full' : '')}>
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

export function TextInput({
  value,
  onChange,
  ...rest
}: { value: string; onChange: (v: string) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  return <input className="input" dir="auto" value={value} onChange={(e) => onChange(e.target.value)} {...rest} />;
}

export function NumberInput({
  value,
  onChange,
  min,
  max,
  step,
  placeholder,
  className,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  className?: string;
}) {
  const [text, setText] = useState(value == null ? '' : String(value));
  useEffect(() => {
    const parsed = text.trim() === '' ? null : Number(text);
    if (parsed !== value) setText(value == null ? '' : String(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <input
      className={'input num ' + (className || '')}
      inputMode="decimal"
      dir="ltr"
      value={text}
      placeholder={placeholder}
      onChange={(e) => {
        const t = e.target.value.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/[^\d.]/g, '');
        setText(t);
        if (t.trim() === '') return onChange(null);
        let n = Number(t);
        if (Number.isNaN(n)) return;
        if (max != null) n = Math.min(max, n);
        onChange(n);
      }}
      onBlur={() => {
        if (value != null && min != null && value < min) onChange(min);
        setText(value == null ? '' : String(value));
      }}
      step={step}
    />
  );
}

export function TextArea({
  value,
  onChange,
  minRows = 1,
  className,
  ...rest
}: { value: string; onChange: (v: string) => void; minRows?: number } & Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'value' | 'onChange'
>) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 2 + 'px';
  }, [value]);
  return (
    <textarea
      ref={ref}
      className={'input textarea ' + (className || '')}
      dir="auto"
      rows={minRows}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      {...rest}
    />
  );
}

export function Select<T extends string | number>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <select
      className="input select"
      value={String(value)}
      onChange={(e) => {
        const o = options.find((x) => String(x.value) === e.target.value);
        if (o) onChange(o.value);
      }}
    >
      {options.map((o) => (
        <option key={String(o.value)} value={String(o.value)}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  const id = useId();
  return (
    <div className="toggle-row">
      <label htmlFor={id} className="toggle-text">
        <span>{label}</span>
        {hint && <small>{hint}</small>}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        className={'switch' + (checked ? ' on' : '')}
        onClick={() => onChange(!checked)}
      >
        <span />
      </button>
    </div>
  );
}

export function Segmented<T extends string | number>({
  value,
  onChange,
  options,
  small,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode; title?: string }[];
  small?: boolean;
}) {
  return (
    <div className={'segmented' + (small ? ' small' : '')} role="radiogroup">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          title={o.title}
          className={o.value === value ? 'active' : ''}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Section({
  title,
  icon,
  children,
  defaultOpen = true,
  aside,
  subtitle,
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  aside?: ReactNode;
  subtitle?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className={'card section' + (open ? ' open' : '')}>
      <div className="section-head">
        <button type="button" className="section-toggle" onClick={() => setOpen(!open)} aria-expanded={open}>
          {icon && <span className="section-icon">{icon}</span>}
          <span className="section-titles">
            <span className="section-title">{title}</span>
            {subtitle && <span className="section-sub">{subtitle}</span>}
          </span>
          <ChevronDown className="chev" size={18} />
        </button>
        {aside}
      </div>
      {open && <div className="section-body">{children}</div>}
    </section>
  );
}

export function IconButton({
  title,
  onClick,
  children,
  disabled,
  danger,
}: {
  title: string;
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button type="button" className={'icon-btn' + (danger ? ' danger' : '')} title={title} aria-label={title} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

/* ─── Images ─── */

export function readImage(file: File, maxDim = 1600): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('bad image'));
      img.onload = () => {
        const r = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.round(img.width * r);
        const h = Math.round(img.height * r);
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        const ctx = c.getContext('2d')!;
        const png = file.type === 'image/png' || file.type === 'image/svg+xml' || file.type === 'image/gif';
        if (!png) {
          ctx.fillStyle = '#fff';
          ctx.fillRect(0, 0, w, h);
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(png ? c.toDataURL('image/png') : c.toDataURL('image/jpeg', 0.9));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function ImagePicker({ onPick, children, className }: { onPick: (src: string) => void; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <button type="button" className={className || 'btn ghost sm'} onClick={() => ref.current?.click()}>
        {children}
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (!f) return;
          try {
            onPick(await readImage(f));
          } catch {
            alert('تعذّر قراءة الصورة. جرّب صورة بصيغة PNG أو JPG.');
          }
        }}
      />
    </>
  );
}
