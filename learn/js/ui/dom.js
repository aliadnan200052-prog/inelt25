// Tiny DOM helpers. Content is always inserted as text, never as HTML,
// so admin-authored strings cannot inject markup.

export function h(tag, attrs, ...children) {
  const [name, ...classes] = tag.split('.');
  const el = document.createElement(name || 'div');
  if (classes.length) el.className = classes.join(' ');
  if (attrs && (typeof attrs !== 'object' || attrs instanceof Node || Array.isArray(attrs))) {
    children.unshift(attrs);
    attrs = null;
  }
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className += (el.className ? ' ' : '') + v;
    else if (k === 'text') el.textContent = v;
    else if (k === 'on') for (const [ev, fn] of Object.entries(v)) el.addEventListener(ev, fn);
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k in el && typeof v !== 'string') el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  append(el, children);
  return el;
}

function append(el, children) {
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}

export function mount(el, ...children) {
  el.replaceChildren();
  append(el, children);
  return el;
}

/** Arabic support text — only rendered when the learner wants it. */
export function ar(text, app) {
  if (!text || !app?.support) return null;
  return h('p.ar-support', { dir: 'rtl', lang: 'ar' }, text);
}

export function icon(name) {
  const paths = {
    play: 'M8 5v14l11-7z',
    pause: 'M6 5h4v14H6zM14 5h4v14h-4z',
    replay: 'M12 5V1L7 6l5 5V7a6 6 0 1 1-6 6H4a8 8 0 1 0 8-8z',
    back: 'M15.4 7.4 14 6l-6 6 6 6 1.4-1.4L10.8 12z',
    mic: 'M12 14a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V21h2v-3.1A7 7 0 0 0 19 11z',
    stop: 'M6 6h12v12H6z',
    check: 'M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z',
    lock: 'M12 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm6-9h-1V6a5 5 0 0 0-10 0v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2zM9 6a3 3 0 0 1 6 0v2H9z',
    speaker: 'M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4z',
    home: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
    path: 'M4 6h16v2H4zm0 5h10v2H4zm0 5h16v2H4z',
    review: 'M12 6v3l4-4-4-4v3a8 8 0 0 0-6.9 12l1.5-1.5A6 6 0 0 1 12 6zm6.9 1.9-1.5 1.5A6 6 0 0 1 12 18v-3l-4 4 4 4v-3a8 8 0 0 0 6.9-12z',
    chart: 'M5 9h3v10H5zm5.5-5h3v15h-3zM16 13h3v6h-3z',
    listen: 'M12 3a9 9 0 0 0-9 9v7a2 2 0 0 0 2 2h3v-8H5v-1a7 7 0 0 1 14 0v1h-3v8h3a2 2 0 0 0 2-2v-7a9 9 0 0 0-9-9z',
    speak: 'M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z',
    words: 'M4 4h16v2H4zm0 4h10v2H4zm0 4h16v2H4zm0 4h10v2H4z',
    grammar: 'M4 5h16v3H4zm0 5.5h10v3H4zM4 16h16v3H4z',
    settings: 'M19.4 13a7.5 7.5 0 0 0 0-2l2.1-1.6-2-3.4-2.5 1a7.3 7.3 0 0 0-1.7-1L15 3.3h-4l-.4 2.7a7.3 7.3 0 0 0-1.7 1l-2.5-1-2 3.4L6.6 11a7.5 7.5 0 0 0 0 2l-2.1 1.6 2 3.4 2.5-1a7.3 7.3 0 0 0 1.7 1l.4 2.7h4l.4-2.7a7.3 7.3 0 0 0 1.7-1l2.5 1 2-3.4zM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z',
    arrow: 'M8.6 16.6 13.2 12 8.6 7.4 10 6l6 6-6 6z',
  };
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', 'ico');
  const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  p.setAttribute('d', paths[name] || '');
  svg.appendChild(p);
  return svg;
}

export function pct(x) {
  return x == null ? '—' : `${Math.round(x * 100)}%`;
}

export function button(label, onClick, cls = 'btn-primary', attrs = {}) {
  return h(`button.btn.${cls}`, { type: 'button', on: { click: onClick }, ...attrs }, label);
}

export function relTime(ts, now = Date.now()) {
  const d = ts - now;
  const abs = Math.abs(d);
  const m = 60000, hr = 60 * m, day = 24 * hr;
  if (abs < hr) return d > 0 ? `in ${Math.max(1, Math.round(abs / m))} min` : 'now';
  if (abs < day) return d > 0 ? `in ${Math.round(abs / hr)} h` : `${Math.round(abs / hr)} h ago`;
  return d > 0 ? `in ${Math.round(abs / day)} days` : `${Math.round(abs / day)} days ago`;
}

/** Null-safe append (the native one prints "null" for null children). */
export function add(el, ...children) {
  append(el, children);
  return el;
}

/** Null-safe replaceChildren. */
export function put(el, ...children) {
  return mount(el, ...children);
}
