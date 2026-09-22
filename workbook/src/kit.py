# -*- coding: utf-8 -*-
"""Rendering helpers for the redesigned workbook."""
from html import escape as _e

def esc(s):
    """Escape everything except the <b>…</b> emphasis we author by hand."""
    return (_e(s, quote=False)
            .replace('&lt;b&gt;', '<b>').replace('&lt;/b&gt;', '</b>')
            .replace('&lt;br&gt;', '<br>')
            .replace('&lt;ar&gt;', '<span class="li-ar">').replace('&lt;/ar&gt;', '</span>')
            .replace('&lt;en&gt;', '<span class="li-en">').replace('&lt;/en&gt;', '</span>'))

def h2(num, en, ar):
    return ('<div class="h2"><div class="row">'
            f'<div class="n">{esc(num)}</div>'
            f'<div class="en">{esc(en)}</div>'
            f'<div class="ar">{esc(ar)}</div>'
            '</div></div>')

def h3(en, ar):
    return ('<div class="h3">'
            f'<div class="en">{esc(en)}</div>'
            f'<div class="ar">{esc(ar)}</div>'
            '</div>')

def ar(text):
    return f'<p class="ar">{esc(text)}</p>'

def en(text):
    return f'<p class="en">{esc(text)}</p>'

def bank(text, rtl=False):
    cls = 'bank rtl' if rtl else 'bank'
    return f'<div class="{cls}">{esc(text)}</div>'

def ex(*pairs):
    """pairs: (english, arabic|None) or (english,) ."""
    rows = []
    for p in pairs:
        e = p[0]
        a = p[1] if len(p) > 1 else None
        if a:
            rows.append('<div class="ex"><div class="row">'
                        f'<div class="e">{esc(e)}</div>'
                        f'<div class="a">{esc(a)}</div>'
                        '</div></div>')
        else:
            rows.append('<div class="ex"><div class="row">'
                        f'<div class="e">{esc(e)}</div></div></div>')
    return '<div class="exgroup">' + ''.join(rows) + '</div>'

def formula(text, label='Structure'):
    lbl = f'<span class="lbl">{esc(label)}</span>' if label else ''
    return f'<div class="formula">{lbl}{esc(text)}</div>'

def note(*lines, ltr=False):
    cls = 'note en' if ltr else 'note'
    body = ''.join(f'<p>{esc(l)}</p>' for l in lines)
    return f'<div class="{cls}">{body}</div>'

def qbar(label='Exam practice', arlabel='أسئلة'):
    return ('<div class="qbar">'
            f'<div class="l">{esc(label)}</div>'
            '<div class="r"></div>'
            f'<div class="ar">{esc(arlabel)}</div>'
            '</div>')

_QN = [0]
def qreset():
    _QN[0] = 0

def q(stem, opts, correct=None, number=True):
    """opts: list of strings exactly as printed. correct: index (0-based) or None."""
    if number:
        _QN[0] += 1
        n = f'<div class="qn">Q{_QN[0]}</div>'
    else:
        n = ''
    o = []
    for i, t in enumerate(opts):
        cls = 'opt ok' if correct is not None and i == correct else 'opt'
        o.append(f'<div class="{cls}"><div class="m"></div><div class="tx">{esc(t)}</div></div>')
    return ('<div class="q"><div class="stem">'
            f'{n}<div class="qt">{esc(stem)}</div></div>'
            '<div class="opts">' + ''.join(o) + '</div></div>')

def qcols(a, b):
    return f'<div class="qcols"><div>{a}</div><div>{b}</div></div>'

def tcap(ar_text, en_text=''):
    e = f'<span class="en">{esc(en_text)}</span>' if en_text else ''
    return f'<div class="tcap">{e}{esc(ar_text)}</div>'

def group(*parts):
    return '<div class="grp">' + ''.join(parts) + '</div>'


def table(headers, rows, caption_ar=None, caption_en='', tight=False, widths=None):
    """headers: list of (text, cls). rows: list of list of (text, cls)."""
    out = ['<div class="tblwrap">']
    if caption_ar or caption_en:
        out.append(tcap(caption_ar or '', caption_en))
    cls = 'tight' if tight else ''
    out.append(f'<table class="{cls}">')
    if widths:
        out.append('<colgroup>' + ''.join(f'<col style="width:{w}">' for w in widths) + '</colgroup>')
    out.append('<thead><tr>')
    for t, c in headers:
        out.append(f'<th class="{c}">{esc(t)}</th>')
    out.append('</tr></thead><tbody>')
    for r in rows:
        out.append('<tr>')
        for t, c in r:
            out.append(f'<td class="{c}">{esc(t)}</td>')
        out.append('</tr>')
    out.append('</tbody></table></div>')
    return ''.join(out)

def pagebreak():
    return '<div style="page-break-after:always"></div>'
