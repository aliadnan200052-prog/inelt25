# INELT 25 — redesigned exam workbook

`INELT25-National-English-Exam-Ali-Adnan-Redesigned.pdf` is a full editorial
redesign of the original 49-page grammar booklet. Every page is rebuilt as
live vector text, so the PDF is searchable, selectable and prints cleanly.

## Building

Needs Python 3, WeasyPrint, PyMuPDF and the Noto Sans Arabic + Lato font
families installed system-wide:

    apt-get install -y fonts-noto-core fonts-lato \
        libpango-1.0-0 libpangoft2-1.0-0 libcairo2 libgdk-pixbuf-2.0-0
    pip install weasyprint pymupdf

    cd src && python3 build.py ../INELT25-National-English-Exam-Ali-Adnan-Redesigned.pdf

`build.py` runs two passes: it lays out the body first to learn which page each
part opener lands on, then renders the cover and contents with those numbers
resolved, and merges the two into one file with bookmarks and metadata.

## Layout of the source

| file | contents |
| --- | --- |
| `build.py` | part list, cover, contents, part openers, closing page, build pipeline |
| `kit.py` | block helpers — headings, Arabic paragraphs, examples, formulas, notes, questions, tables |
| `content1..4.py` | the book text, part by part |
| `style.css` | the design system: page masters, colour tokens, typography, components |
