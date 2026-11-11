#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Génère le PDF de la fiche technique GLOBAL SOLUTIONS.
Source unique de vérité : docs/fiche-technique.md (Markdown).
Le PDF est ensuite déposé dans docs/ et à la racine pour téléchargement.
"""
import re
import sys
import glob
from reportlab.lib import colors
from reportlab.lib.enums import TA_JUSTIFY, TA_LEFT, TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (BaseDocTemplate, Frame, PageTemplate, Paragraph,
                                Spacer, Table, TableStyle, KeepTogether)

BASE = '/home/user/GS'
SRC = BASE + '/docs/fiche-technique.md'
OUT = BASE + '/docs/fiche-technique-GLOBAL-SOLUTIONS.pdf'

NAVY = colors.HexColor('#04293B')
SKY = colors.HexColor('#52C6F9')
SKY_DARK = colors.HexColor('#0A75A6')
GREY = colors.HexColor('#5C5C5C')
LINE = colors.HexColor('#D7D7D7')
MIST = colors.HexColor('#F3FBFF')

# ---------------------------------------------------------------- polices ---
FONT = 'DejaVu'
FONT_B = 'DejaVu-Bold'
FONT_I = 'DejaVu-Oblique'
def _font(name, path):
    """Enregistre une police si le fichier existe."""
    if glob.glob(path):
        pdfmetrics.registerFont(TTFont(name, path))
        return True
    return False

# DejaVu fournit le latin accentue (e, a, c, oe) et les symboles du document.
# L'oblique n'est pas toujours installee : on la remplace alors par la graisse
# normale, ce qui evite un repli complet vers Helvetica (accents degrades).
_ok = _font(FONT, '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf')
_okb = _font(FONT_B, '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf')
_oki = _font(FONT_I, '/usr/share/fonts/truetype/dejavu/DejaVuSans-Oblique.ttf')

if _ok and _okb:
    if not _oki:
        FONT_I = FONT
    pdfmetrics.registerFontFamily(FONT, normal=FONT, bold=FONT_B,
                                  italic=FONT_I, boldItalic=FONT_B)
    HAS_TTF = True
else:
    sys.stderr.write('Polices DejaVu indisponibles, repli Helvetica')
    FONT, FONT_B, FONT_I = 'Helvetica', 'Helvetica-Bold', 'Helvetica-Oblique'
    HAS_TTF = False

# ----------------------------------------------------------------- styles ---
S = getSampleStyleSheet()

st_h1 = ParagraphStyle('h1', fontName=FONT_B, fontSize=17, leading=22,
                       textColor=NAVY, spaceAfter=4, alignment=TA_LEFT)
st_sub = ParagraphStyle('sub', fontName=FONT, fontSize=9.5, leading=13,
                        textColor=GREY, spaceAfter=10)
st_h2 = ParagraphStyle('h2', fontName=FONT_B, fontSize=12, leading=15,
                       textColor=NAVY, spaceBefore=13, spaceAfter=6)
st_h3 = ParagraphStyle('h3', fontName=FONT_B, fontSize=10, leading=13,
                       textColor=SKY_DARK, spaceBefore=9, spaceAfter=4)
st_p = ParagraphStyle('p', fontName=FONT, fontSize=8.8, leading=12.8,
                      textColor=colors.HexColor('#1B1B1B'),
                      alignment=TA_JUSTIFY, spaceAfter=5)
st_li = ParagraphStyle('li', parent=st_p, leftIndent=11, bulletIndent=2,
                       spaceAfter=2.5)
st_th = ParagraphStyle('th', fontName=FONT_B, fontSize=7.4, leading=9.4,
                       textColor=NAVY)
st_td = ParagraphStyle('td', fontName=FONT, fontSize=7.6, leading=9.9,
                       textColor=colors.HexColor('#1B1B1B'))
st_td_c = ParagraphStyle('tdc', parent=st_td, fontName=FONT, textColor=SKY_DARK)
st_code = ParagraphStyle('code', fontName=FONT, fontSize=7.6, leading=10,
                         textColor=colors.HexColor('#0A5573'))
st_pre = ParagraphStyle('pre', fontName=FONT, fontSize=7.0, leading=9.2,
                        textColor=colors.HexColor('#E6F4FB'))
st_quote = ParagraphStyle('quote', parent=st_p, textColor=colors.HexColor('#123555'))
st_foot = ParagraphStyle('foot', fontName=FONT, fontSize=7.2, leading=9.8,
                         textColor=GREY, alignment=TA_CENTER)


# ------------------------------------------------------------- utilitaires ---
def inline(txt):
    """Convertit le balisage Markdown inline en balises ReportLab."""
    t = txt
    t = t.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    t = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', t)
    t = re.sub(r'(?<!\*)\*([^*]+?)\*(?!\*)', r'<i>\1</i>', t)
    t = re.sub(r'`([^`]+?)`', r'<font face="%s" size="7.4" color="#0A5573">\1</font>' % FONT, t)
    return t


def split_row(line):
    """Découpe une ligne de tableau Markdown en cellules."""
    cells = line.strip().strip('|').split('|')
    return [c.strip() for c in cells]


def is_sep(line):
    return bool(re.match(r'^\s*\|?[\s:-]+\|[\s:|:-]*$', line))


def make_table(rows, widths):
    head, body = rows[0], rows[1:]
    data = [[Paragraph(inline(c), st_th) for c in head]]
    for r in body:
        data.append([Paragraph(inline(c), st_td) for c in r])
    t = Table(data, colWidths=widths, repeatRows=1, hAlign='LEFT')
    cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), MIST),
        ('LINEBELOW', (0, 0), (-1, 0), 0.6, SKY),
        ('GRID', (0, 0), (-1, -1), 0.4, LINE),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]
    for i in range(1, len(data)):
        if i % 2 == 0:
            cmds.append(('BACKGROUND', (0, i), (-1, i), colors.HexColor('#FAFDFF')))
    t.setStyle(TableStyle(cmds))
    return t


def compute_widths(rows, avail):
    """Largeurs proportionnelles au contenu, bornées."""
    n = max(len(r) for r in rows)
    lens = [0] * n
    for r in rows:
        for i, c in enumerate(r):
            lens[i] = max(lens[i], len(c))
    total = sum(lens) or 1
    raw = [avail * l / total for l in lens]
    mini = avail * 0.06
    raw = [max(w, mini) for w in raw]
    s = sum(raw)
    return [w * avail / s for w in raw]


def make_pre(lines):
    txt = '\n'.join(lines)
    txt = txt.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    p = Paragraph(txt.replace('\n', '<br/>').replace(' ', '&nbsp;'), st_pre)
    t = Table([[p]], colWidths=[165 * mm], hAlign='LEFT')
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), NAVY),
        ('LEFTPADDING', (0, 0), (-1, -1), 7),
        ('RIGHTPADDING', (0, 0), (-1, -1), 7),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    return t


# --------------------------------------------------------------- découpage ---
def build_story(md):
    avail = 165 * mm
    lines = md.split('\n')
    story = []
    i = 0
    in_list = False
    list_kind = None
    pre_buf = None
    foot_lines = []

    while i < len(lines):
        line = lines[i]
        raw = line.rstrip()

        # --- bloc de code
        if raw.startswith('```'):
            if pre_buf is None:
                pre_buf = []
            else:
                story.append(Spacer(1, 2))
                story.append(make_pre(pre_buf))
                story.append(Spacer(1, 5))
                pre_buf = None
            i += 1
            continue
        if pre_buf is not None:
            pre_buf.append(raw)
            i += 1
            continue

        # --- tableau
        if raw.lstrip().startswith('|') and i + 1 < len(lines) and is_sep(lines[i + 1]):
            rows = [split_row(raw)]
            i += 2
            while i < len(lines) and lines[i].lstrip().startswith('|'):
                rows.append(split_row(lines[i]))
                i += 1
            widths = compute_widths(rows, avail)
            story.append(Spacer(1, 3))
            story.append(make_table(rows, widths))
            story.append(Spacer(1, 5))
            in_list, list_kind = False, None
            continue

        stripped = raw.strip()

        # --- séparateur
        if stripped == '---':
            if in_list:
                in_list, list_kind = False, None
            i += 1
            continue

        # --- titres
        if raw.startswith('### '):
            story.append(Paragraph(inline(raw[4:]), st_h3))
            i += 1
            continue
        if raw.startswith('## '):
            story.append(Paragraph(inline(raw[3:]), st_h2))
            i += 1
            continue
        if raw.startswith('# '):
            story.append(Paragraph(inline(raw[2:]), st_h1))
            i += 1
            continue

        # --- listes
        m_ul = re.match(r'^\s*[-*]\s+(.*)$', raw)
        m_ol = re.match(r'^\s*\d+\.\s+(.*)$', raw)
        if m_ul or m_ol:
            if not in_list or list_kind != ('ul' if m_ul else 'ol'):
                list_kind = 'ul' if m_ul else 'ol'
                in_list = True
            txt = (m_ul or m_ol).group(1)
            bullet = '•' if m_ul else (re.match(r'^\s*(\d+)\.', raw).group(1) + '.')
            story.append(Paragraph(inline(txt), st_li, bulletText=bullet))
            i += 1
            continue

        in_list, list_kind = False, None

        # --- citation
        if stripped.startswith('>'):
            txt = stripped.lstrip('> ').strip()
            story.append(Paragraph(inline(txt), st_quote))
            i += 1
            continue

        # --- paragraphe
        if stripped:
            # pied de page (dernier paragraphe en italique commencant par *)
            if stripped.startswith('*Fin de la fiche'):
                foot_lines.append(stripped)
                i += 1
                continue
            story.append(Paragraph(inline(stripped), st_p))
        i += 1

    return story, foot_lines


# ------------------------------------------------------------------ modèle ---
class Doc(BaseDocTemplate):
    def __init__(self, path, **kw):
        BaseDocTemplate.__init__(self, path, pagesize=A4,
                                 leftMargin=14 * mm, rightMargin=14 * mm,
                                 topMargin=15 * mm, bottomMargin=16 * mm,
                                 title='Fiche technique — Site institutionnel GLOBAL SOLUTIONS',
                                 author='GLOBAL SOLUTIONS SARL',
                                 subject='Fiche technique du site institutionnel',
                                 creator='GLOBAL SOLUTIONS')
        frame = Frame(self.leftMargin, self.bottomMargin,
                      self.width, self.height, id='normal',
                      leftPadding=0, rightPadding=0,
                      topPadding=0, bottomPadding=0)
        self.addPageTemplates([PageTemplate(id='main', frames=[frame],
                                            onPage=self.decorate)])

    def decorate(self, canvas, doc):
        canvas.saveState()
        w, h = A4
        # bandeau supérieur
        canvas.setFillColor(NAVY)
        canvas.rect(0, h - 9 * mm, w, 9 * mm, stroke=0, fill=1)
        canvas.setFillColor(SKY)
        canvas.rect(0, h - 10.2 * mm, w, 1.2 * mm, stroke=0, fill=1)
        canvas.setFillColor(colors.white)
        canvas.setFont(FONT_B, 7.4)
        canvas.drawString(14 * mm, h - 6.3 * mm,
                          'GLOBAL SOLUTIONS SARL — Fiche technique du site institutionnel')
        canvas.setFillColor(colors.HexColor('#C9DDE8'))
        canvas.setFont(FONT, 7.0)
        canvas.drawRightString(w - 14 * mm, h - 6.3 * mm, 'Édition du 11 novembre 2026')
        # pied de page
        canvas.setStrokeColor(LINE)
        canvas.setLineWidth(0.4)
        canvas.line(14 * mm, 12 * mm, w - 14 * mm, 12 * mm)
        canvas.setFillColor(GREY)
        canvas.setFont(FONT, 7.0)
        canvas.drawString(14 * mm, 8 * mm,
                          'RCCM-NI-NIA-2017-B-003 · NIF 40242/R · Niamey, Niger')
        canvas.drawRightString(w - 14 * mm, 8 * mm, 'Page %d' % doc.page)
        canvas.restoreState()


def main():
    md = open(SRC, encoding='utf-8').read()
    story, foot = build_story(md)
    story.append(Spacer(1, 10))
    for f in foot:
        story.append(Paragraph(inline(f.replace('*', '')), st_foot))

    doc = Doc(OUT)
    doc.build(story)

    import os
    print('PDF généré : %s (%.1f Ko)' % (OUT, os.path.getsize(OUT) / 1024.0))
    return OUT


if __name__ == '__main__':
    main()
