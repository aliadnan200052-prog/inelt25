# -*- coding: utf-8 -*-
import os, sys
from kit import *
import content1 as c1, content2 as c2, content3 as c3, content4 as c4

HERE = os.path.dirname(os.path.abspath(__file__))

PARTS = [
    dict(id='p01', label='Part 1',  en='Parts of Speech',              ar='أجزاء الكلام',
         full='Part 1 • Parts of Speech',              blocks=c1.PART1),
    dict(id='p02', label='Part 2',  en='Articles',                     ar='أدوات التعريف والتنكير',
         full='Part 2 • Articles',                     blocks=c1.PART2),
    dict(id='p03', label='Part 3',  en='Plural',                       ar='ألجمع',
         full='Part 3 • Plural',                       blocks=c1.PART3),
    dict(id='p04', label='Part 3',  en='Tenses',                       ar='ألازمان',
         full='Part 3 • Tenses',                       blocks=c2.PART_TENSES),
    dict(id='p05', label='Part 5',  en='Wh-question',                  ar='أدوات السؤال',
         full='Part 5 • Wh-question',                  blocks=c3.PART_WH),
    dict(id='p06', label='Part 6',  en='If Conditional',               ar='If الشرطية',
         full='Part 6 • If Conditional',               blocks=c3.PART_IF),
    dict(id='p07', label='Part 7',  en='Tag Questions',                ar='Iلاسئلة الذيلية',
         full='Part 7 • Tag Questions',                blocks=c3.PART_TAG),
    dict(id='p08', label='Part 8',  en='Determiners',                  ar='المحددات',
         full='Part 8 • Determiners',                  blocks=c3.PART_DET),
    dict(id='p09', label='Part 8',  en='Used to',                      ar='اعتاد على',
         full='Part 8 • Used to',                      blocks=c3.PART_USEDTO),
    dict(id='p10', label='Part 9',  en='Active and Passive voice',     ar='المبني للمجهول و المعلوم',
         full='Part 9 • Active and Passive voice',     blocks=c4.PART_VOICE),
    dict(id='p11', label='Part 10', en='Superlatives and comparative', ar='صفات المفاضلة والمقارنة',
         full='Part 10 • Superlatives and comparative', blocks=c4.PART_COMP),
    dict(id='p12', label='Part 10', en='Reported Speech',              ar='الكلام المنقول',
         full='Part 10 • Reported Speech',             blocks=c4.PART_REPORTED),
    dict(id='p13', label='Part 10', en='So, Very and Too',             ar='',
         full='Part 10 • So, Very and Too',            blocks=c4.PART_SVT),
]

def cover():
    return f'''
<div class="cover">
  <div class="band"></div>
  <div class="hair" style="top:20mm"></div>
  <img class="mark" src="logo_white.png">
  <div class="kicker">Ali Adnan</div>
  <h1>الامتحان الوطني الانكليزي</h1>
  <div class="sub">INELT 25</div>
  <div class="authorline"></div>
  <div class="author">الاستاذ علي عدنان</div>
  <div class="hair" style="top:198mm"></div>
  <div class="foot">
    <div class="inner">
      <div class="lbl">Contact</div>
      <div class="contact">
        <div class="c"><span class="t">WhatsApp</span>07702556147</div>
        <div class="c"><span class="t">Telegram</span>inelt25</div>
      </div>
    </div>
  </div>
</div>'''

def toc(pagemap):
    rows = []
    for i, p in enumerate(PARTS, 1):
        ar_line = f'<div class="a">{esc(p["ar"])}</div>' if p['ar'] else '<div class="a"></div>'
        rows.append(
            f'<div class="row">'
            f'<div class="num">{i:02d}</div>'
            f'<div class="e">{esc(p["full"])}</div>'
            f'{ar_line}'
            f'<div class="dots"></div>'
            f'<div class="pg">{pagemap.get(p["id"], "")}</div>'
            f'</div>')
    return f'''
<div class="front">
  <div class="toc-head">
    <div class="en">Contents</div>
    <div class="ar">المحتويات</div>
    <div class="bar"></div>
  </div>
  <div class="toc">{''.join(rows)}</div>
</div>'''

def opener(p, idx):
    reset = ''
    ar_block = f'<div class="par">{esc(p["ar"])}</div>' if p['ar'] else ''
    sset = p['full'].replace("'", "\\2019 ")
    return f'''
<div class="opener" id="{p['id']}"{reset}>
  <div class="top"></div>
  <div class="hairT"></div>
  <img class="mono" src="logo_white.png">
  <div class="plabel">{esc(p['label'])} &nbsp;·&nbsp; {idx:02d}</div>
  <div class="pen" style="string-set: partname '{sset}'">{esc(p['en'])}</div>
  <div class="prule"></div>
  {ar_block}
  <div class="meta"><span>INELT 25</span><span>National English Exam</span></div>
  <div class="foot">الامتحان الوطني الانكليزي &nbsp;·&nbsp; الاستاذ علي عدنان</div>
</div>'''

def wrap(body, title='الامتحان الوطني الانكليزي — الاستاذ علي عدنان'):
    return f"""<!doctype html>
<html lang="ar" dir="ltr">
<head>
<meta charset="utf-8">
<title>{title}</title>
<link rel="stylesheet" href="style.css">
</head>
<body>
{body}
</body></html>"""


def backcover():
    return '''
<div class="backcover">
  <div class="bg"></div>
  <img class="mark" src="logo_white.png">
  <div class="t1">الامتحان الوطني الانكليزي</div>
  <div class="t2">INELT 25</div>
  <div class="line"></div>
  <div class="t3">الاستاذ علي عدنان</div>
  <div class="contact">
    <div class="lbl">Contact</div>
    <div class="c"><span class="t">WhatsApp</span>07702556147</div><div class="c"><span class="t">Telegram</span>inelt25</div>
  </div>
</div>'''


def main_body():
    out = []
    for i, p in enumerate(PARTS, 1):
        out.append(opener(p, i))
        out.append('<section class="body">' + ''.join(p['blocks']) + '</section>')
    out.append(backcover())
    return '\n'.join(out)


def front_matter(pagemap):
    return cover() + '\n' + toc(pagemap)


def render(html_text, name):
    path = os.path.join(HERE, name)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(html_text)
    from weasyprint import HTML
    return HTML(filename=path, base_url=HERE).render()


if __name__ == '__main__':
    out_pdf = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'book.pdf')

    # -- pass 1: main body, to learn where each part opener lands
    qreset()
    doc_main = render(wrap(main_body()), 'body.html')
    pagemap = {}
    for idx, page in enumerate(doc_main.pages, 1):
        for a in page.anchors:
            pagemap.setdefault(a, idx)

    # -- pass 2: front matter with resolved page numbers
    doc_front = render(wrap(front_matter(pagemap)), 'front.html')

    main_pdf = os.path.join(HERE, '_body.pdf')
    front_pdf = os.path.join(HERE, '_front.pdf')
    doc_main.write_pdf(main_pdf)
    doc_front.write_pdf(front_pdf)

    import pymupdf
    merged = pymupdf.open()
    merged.insert_pdf(pymupdf.open(front_pdf))
    merged.insert_pdf(pymupdf.open(main_pdf))
    merged.set_metadata({
        'title': 'الامتحان الوطني الانكليزي — INELT 25',
        'author': 'الاستاذ علي عدنان',
        'subject': 'National English Exam — grammar workbook',
        'creator': 'INELT 25',
    })
    toc_entries = [[1, p['full'], pagemap.get(p['id'], 1) + len(doc_front.pages)] for p in PARTS]
    merged.set_toc(toc_entries)
    merged.save(out_pdf, garbage=4, deflate=True)
    print('front:', len(doc_front.pages), 'body:', len(doc_main.pages),
          'total:', len(merged), '->', out_pdf)
