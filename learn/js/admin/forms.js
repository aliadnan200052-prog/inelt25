// Schema-driven form builder for the admin panel. Every field list
// comes from js/data/content-schema.js, so the forms, the line formats
// and the validation can never drift apart.
import { h, button, add, put } from '../ui/dom.js';
import { codecs, EXERCISE_TYPES, PRONUNCIATION_TYPES, blankExercise, validateExercise } from '../data/content-schema.js';

let uid = 0;

/**
 * renderForm(fields, value, ctx) → { el, read() }
 * read() returns { value, errors } — value is a NEW object.
 * ctx: { itemIds: string[], units: [{id,title,level}] }
 */
export function renderForm(fields, value = {}, ctx = {}) {
  const controls = [];
  const el = h('div.a-form');
  for (const f of fields) {
    const id = `f${++uid}`;
    const v = value[f.key];
    let input;
    switch (f.type) {
      case 'textarea':
        input = h('textarea.text-input.prose', { id, rows: 3, dir: f.dir || null }, v ?? '');
        break;
      case 'number':
        input = h('input.text-input', { id, type: 'number', value: v ?? '' });
        break;
      case 'date':
        input = h('input.text-input', { id, type: 'date', value: v ? String(v).slice(0, 10) : '' });
        break;
      case 'select':
        input = h('select.text-input', { id }, f.options.map(o => h('option', { value: o, selected: o === (v ?? '') }, o || '—')));
        break;
      case 'unit':
        input = h('select.text-input', { id }, (ctx.units || []).map(u => h('option', { value: u.id, selected: u.id === v }, `${u.level} · ${u.title} (${u.id})`)));
        break;
      case 'list': case 'pairs': case 'script': case 'contexts':
        input = h('textarea.text-input', { id, rows: Math.min(10, Math.max(3, (codecs[f.type].format(v) || '').split('\n').length + 1)) }, codecs[f.type].format(v));
        break;
      case 'items': {
        const listId = `${id}-dl`;
        input = h('input.text-input', { id, type: 'text', value: codecs.items.format(v), list: listId, placeholder: 'item-id, item-id' });
        el.append(h('datalist', { id: listId }, (ctx.itemIds || []).map(i => h('option', { value: i }))));
        break;
      }
      case 'json':
        input = h('textarea.text-input', { id, rows: v ? Math.min(14, JSON.stringify(v, null, 2).split('\n').length + 1) : 3 }, v == null ? '' : JSON.stringify(v, null, 2));
        break;
      default:
        input = h('input.text-input', { id, type: 'text', value: v ?? '', dir: f.dir || null });
    }
    controls.push({ f, input });
    add(el, h('label.field', { for: id }, h('span', f.label, f.required ? ' *' : ''), input));
  }

  function read() {
    const out = { ...value };
    const errors = [];
    for (const { f, input } of controls) {
      const raw = input.value;
      let v;
      switch (f.type) {
        case 'number': v = raw === '' ? undefined : Number(raw); break;
        case 'list': case 'pairs': case 'script': case 'contexts': v = codecs[f.type].parse(raw); break;
        case 'items': v = codecs.items.parse(raw); break;
        case 'json':
          if (raw.trim() === '') v = undefined;
          else { try { v = JSON.parse(raw); } catch (e) { errors.push(`${f.label}: invalid JSON (${e.message})`); v = value[f.key]; } }
          break;
        default: v = raw.trim() === '' ? undefined : raw.trim();
      }
      if (v === undefined || (Array.isArray(v) && !v.length && !f.required)) delete out[f.key];
      else out[f.key] = v;
      if (f.required && (v == null || v === '' || (Array.isArray(v) && !v.length))) errors.push(`${f.label} is required`);
      if (f.type === 'items' && ctx.itemIds) for (const i of v || []) if (!ctx.itemIds.includes(i)) errors.push(`${f.label}: unknown item "${i}"`);
    }
    return { value: out, errors };
  }
  return { el, read };
}

export function errorList(errors) {
  if (!errors?.length) return null;
  return h('div.a-errors', { role: 'alert' }, h('strong', `${errors.length} problem${errors.length === 1 ? '' : 's'}`), h('ul', errors.slice(0, 30).map(e => h('li', e))));
}

/**
 * Editable list of exercises (questions). Each block: type, move, delete,
 * and a schema form. getValue() returns { value, errors }.
 */
export function exerciseList(list = [], ctx = {}, { allowed = Object.keys(EXERCISE_TYPES), skill } = {}) {
  let blocks = list.map(ex => ({ ex }));
  const wrap = h('div.a-list');

  function draw() {
    put(wrap, ...blocks.map((b, i) => {
      const def = EXERCISE_TYPES[b.ex.type];
      b.form = renderForm(def.fields, b.ex, ctx);
      return h('div.a-block',
        h('div.a-block-head',
          h('strong', `${i + 1}. ${def.label}`), h('span.muted.small', b.ex.id || ''),
          button('↑', () => move(i, -1), 'btn-ghost btn-sm', { 'aria-label': 'Move up', disabled: i === 0 }),
          button('↓', () => move(i, 1), 'btn-ghost btn-sm', { 'aria-label': 'Move down', disabled: i === blocks.length - 1 }),
          button('Delete', () => { sync(); blocks.splice(i, 1); draw(); }, 'btn-ghost btn-sm')),
        b.form.el);
    }),
    h('div.a-toolbar',
      (() => {
        const sel = h('select.text-input', { 'aria-label': 'Exercise type' }, allowed.map(t => h('option', { value: t }, EXERCISE_TYPES[t].label)));
        return [sel, button('Add question', () => { sync(); blocks.push({ ex: { ...blankExercise(sel.value), ...(skill ? { skill } : {}) } }); draw(); }, 'btn-ghost btn-sm')];
      })()));
  }
  function sync() { blocks = blocks.map(b => ({ ex: b.form ? b.form.read().value : b.ex })); }
  function move(i, d) { sync(); const [b] = blocks.splice(i, 1); blocks.splice(i + d, 0, b); draw(); }
  draw();

  return {
    el: wrap,
    getValue() {
      const errors = [];
      const value = blocks.map((b, i) => {
        const r = b.form.read();
        errors.push(...r.errors.map(e => `Question ${i + 1}: ${e}`));
        errors.push(...validateExercise(r.value, `Question ${i + 1}`, { itemIds: ctx.itemIds ? new Set(ctx.itemIds) : null }));
        return r.value;
      });
      return { value, errors };
    },
  };
}

/** Pronunciation blocks with the admin line formats. */
export function pronunciationList(list = []) {
  let blocks = list.map(b => ({ b }));
  const wrap = h('div.a-list');
  function draw() {
    put(wrap, ...blocks.map((x, i) => {
      const type = x.b.type;
      const def = PRONUNCIATION_TYPES[type];
      x.title = h('input.text-input', { type: 'text', value: x.b.title || '', placeholder: 'Title' });
      x.tip = h('input.text-input', { type: 'text', value: x.b.tip || '', placeholder: 'Tip (one sentence)' });
      x.tipAr = h('input.text-input', { type: 'text', value: x.b.tip_ar || '', placeholder: 'Tip (Arabic, optional)', dir: 'rtl' });
      x.lines = h('textarea.text-input', { rows: 5 }, codecs.pron[type].format(x.b));
      return h('div.a-block',
        h('div.a-block-head', h('strong', `${i + 1}. ${def.label}`),
          button('Delete', () => { sync(); blocks.splice(i, 1); draw(); }, 'btn-ghost btn-sm')),
        h('div.a-form', x.title, x.tip, x.tipAr, h('label.field', h('span', 'Content ', h('span.help', def.help)), x.lines)));
    }),
    h('div.a-toolbar', (() => {
      const sel = h('select.text-input', { 'aria-label': 'Activity type' }, Object.entries(PRONUNCIATION_TYPES).map(([k, d]) => h('option', { value: k }, d.label)));
      return [sel, button('Add activity', () => { sync(); blocks.push({ b: { id: `pr-${Date.now().toString(36)}`, type: sel.value, title: '', tip: '' } }); draw(); }, 'btn-ghost btn-sm')];
    })()));
  }
  function read(x) {
    const b = { id: x.b.id, type: x.b.type, title: x.title.value.trim(), tip: x.tip.value.trim(), ...codecs.pron[x.b.type].parse(x.lines.value) };
    if (x.tipAr.value.trim()) b.tip_ar = x.tipAr.value.trim();
    return b;
  }
  function sync() { blocks = blocks.map(x => ({ b: x.title ? read(x) : x.b })); }
  draw();
  return { el: wrap, getValue: () => ({ value: blocks.map(read), errors: [] }) };
}
