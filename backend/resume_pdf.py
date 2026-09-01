"""Build the one-page single-column resume PDF from portfolio data."""
import os
import re
from collections import OrderedDict
from xml.sax.saxutils import escape

from reportlab.lib.colors import Color
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    HRFlowable,
    KeepTogether,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
)

TEXT = Color(0.12549, 0.141176, 0.164706)
MUTED = Color(0.34902, 0.388235, 0.431373)
SECTION = Color(0.156863, 0.352941, 0.45098)
RULE = Color(0.717647, 0.776471, 0.811765)
MARGIN = 62.7
PAGE_WIDTH, PAGE_HEIGHT = A4
RESUME_FILENAME = 'sravan-karra-resume.pdf'


def _clean(value):
    return re.sub(r'\s+', ' ', (value or '').replace('\r', ' ').replace('\n', ' ')).strip()


def _xml(value):
    return escape(_clean(value))


def _summary(about, max_chars=0):
    parts = [part.strip() for part in re.split(r'\r?\n+', about or '') if part.strip()]
    text = ' '.join(parts)
    if max_chars and len(text) > max_chars:
        trimmed = text[: max_chars - 1].rsplit(' ', 1)[0]
        return f'{trimmed}.'
    return text


def _grouped_skills(skills):
    groups = OrderedDict()
    for skill in skills or []:
        name = _clean(skill.get('name'))
        if not name:
            continue
        category = _clean(skill.get('category')) or 'Skills'
        groups.setdefault(category, [])
        if name not in groups[category]:
            groups[category].append(name)
    return groups


def _styles(scale):
    body = 9.6 * scale
    return {
        'name': ParagraphStyle(
            'ResumeName',
            fontName='Helvetica-Bold',
            fontSize=22 * scale,
            leading=25 * scale,
            textColor=TEXT,
            alignment=TA_CENTER,
            spaceAfter=2,
        ),
        'contact': ParagraphStyle(
            'ResumeContact',
            fontName='Helvetica',
            fontSize=9.2 * scale,
            leading=12.5 * scale,
            textColor=MUTED,
            alignment=TA_CENTER,
            spaceAfter=10 * scale,
        ),
        'section': ParagraphStyle(
            'ResumeSection',
            fontName='Helvetica-Bold',
            fontSize=10.7 * scale,
            leading=13 * scale,
            textColor=SECTION,
            alignment=TA_LEFT,
            spaceBefore=8 * scale,
            spaceAfter=2,
        ),
        'body': ParagraphStyle(
            'ResumeBody',
            fontName='Helvetica',
            fontSize=body,
            leading=13.4 * scale,
            textColor=TEXT,
            alignment=TA_LEFT,
            spaceAfter=2,
        ),
        'skill': ParagraphStyle(
            'ResumeSkill',
            fontName='Helvetica',
            fontSize=body,
            leading=13.4 * scale,
            textColor=TEXT,
            alignment=TA_LEFT,
            spaceAfter=3 * scale,
        ),
        'role': ParagraphStyle(
            'ResumeRole',
            fontName='Helvetica-Bold',
            fontSize=10.1 * scale,
            leading=12.5 * scale,
            textColor=TEXT,
            alignment=TA_LEFT,
            spaceBefore=4 * scale,
            spaceAfter=1,
        ),
        'date': ParagraphStyle(
            'ResumeDate',
            fontName='Helvetica-Oblique',
            fontSize=9 * scale,
            leading=11.5 * scale,
            textColor=MUTED,
            alignment=TA_LEFT,
            spaceAfter=2,
        ),
        'bullet': ParagraphStyle(
            'ResumeBullet',
            fontName='Helvetica',
            fontSize=body,
            leading=13.4 * scale,
            textColor=TEXT,
            leftIndent=12,
            bulletIndent=0,
            alignment=TA_LEFT,
            spaceAfter=1,
        ),
    }


def _section(story, styles, title):
    story.append(Paragraph(_xml(title).upper(), styles['section']))
    story.append(HRFlowable(width='100%', thickness=0.7, color=RULE, spaceBefore=0, spaceAfter=6, hAlign='LEFT'))


def _entry(story, styles, title, period, bullets, max_bullets):
    block = [Paragraph(_xml(title), styles['role'])]
    if period:
        block.append(Paragraph(_xml(period), styles['date']))
    for bullet in (bullets or [])[:max_bullets]:
        text = _clean(bullet)
        if text:
            block.append(Paragraph(f'&bull; {_xml(text)}', styles['bullet']))
    story.append(KeepTogether(block))


def _story(data, scale, summary_max, max_bullets, include_project_copy):
    info = data.get('personal_info') or {}
    styles = _styles(scale)
    story = []

    name = _clean(info.get('name')) or 'Sravan Karra'
    story.append(Paragraph(escape(name.upper()), styles['name']))

    contact = [part for part in (
        _clean(info.get('location')),
        _clean(info.get('phone')),
        _clean(info.get('email')),
    ) if part]
    if contact:
        story.append(Paragraph(escape(' | '.join(contact)), styles['contact']))
    else:
        story.append(Spacer(1, 8 * scale))

    summary = _summary(info.get('about'), summary_max)
    if summary:
        _section(story, styles, 'Professional Summary')
        story.append(Paragraph(_xml(summary), styles['body']))

    skills = _grouped_skills(data.get('skills'))
    if skills:
        _section(story, styles, 'Skills')
        for category, names in skills.items():
            story.append(Paragraph(
                f'<font name="Helvetica-Bold">{_xml(category)}:</font> {_xml(", ".join(names))}',
                styles['skill'],
            ))

    internships = data.get('internships') or []
    if internships:
        _section(story, styles, 'Internships')
        for item in internships:
            title = _clean(item.get('title')) or _clean(item.get('organization'))
            if not title:
                continue
            bullets = item.get('bullets') or []
            if isinstance(bullets, str):
                bullets = [line.strip() for line in bullets.split('\n') if line.strip()]
            description = _clean(item.get('description'))
            if description and description not in bullets:
                bullets = [description] + list(bullets)
            _entry(story, styles, title, item.get('period'), bullets, max_bullets)

    projects = data.get('projects') or []
    if projects:
        _section(story, styles, 'Projects')
        for project in projects:
            title = _clean(project.get('title'))
            if not title:
                continue
            bullets = []
            if include_project_copy:
                description = _clean(project.get('description'))
                if description:
                    bullets.append(description)
            techs = [tech for tech in (project.get('technologies') or []) if _clean(tech)]
            if techs:
                bullets.append('Technologies: ' + ', '.join(_clean(tech) for tech in techs))
            _entry(story, styles, title, '', bullets, max_bullets)

    education = data.get('education') or []
    if education:
        _section(story, styles, 'Education')
        for item in education:
            degree = _clean(item.get('degree'))
            institution = _clean(item.get('institution'))
            title = ', '.join(part for part in (degree, institution) if part)
            if not title:
                continue
            _entry(story, styles, title, item.get('period'), [], 0)

    languages = _clean(info.get('languages'))
    if languages:
        _section(story, styles, 'Languages')
        story.append(Paragraph(_xml(languages), styles['body']))

    return story


def _page_count(path):
    with open(path, 'rb') as handle:
        return handle.read().count(b'/Type /Page')


def generate_resume_pdf(data, output_path):
    """Write a one-page A4 resume using the existing single-column template."""
    os.makedirs(os.path.dirname(output_path) or '.', exist_ok=True)
    attempts = (
        {'scale': 1.0, 'summary_max': 0, 'max_bullets': 3, 'include_project_copy': True},
        {'scale': 0.94, 'summary_max': 620, 'max_bullets': 2, 'include_project_copy': True},
        {'scale': 0.88, 'summary_max': 420, 'max_bullets': 2, 'include_project_copy': False},
        {'scale': 0.82, 'summary_max': 280, 'max_bullets': 1, 'include_project_copy': False},
    )
    last_path = output_path
    for attempt in attempts:
        doc = SimpleDocTemplate(
            output_path,
            pagesize=A4,
            leftMargin=MARGIN,
            rightMargin=MARGIN,
            topMargin=48,
            bottomMargin=36,
            title=f'{_clean((data.get("personal_info") or {}).get("name")) or "Sravan Karra"} - Resume',
            author=_clean((data.get('personal_info') or {}).get('name')) or 'Sravan Karra',
            subject='Single-column resume',
        )
        story = _story(data, **attempt)
        pages = {'count': 0}

        def _count(canvas, _doc):
            pages['count'] = max(pages['count'], canvas.getPageNumber())

        doc.build(story, onFirstPage=_count, onLaterPages=_count)
        last_path = output_path
        counted = pages['count'] or _page_count(output_path)
        if counted <= 1:
            return output_path
    return last_path


def sync_resume_pdf(data, base_dir):
    """Regenerate the local resume PDF unless an external URL is stored."""
    info = data.setdefault('personal_info', {})
    current = (info.get('resume') or '').strip()
    if current.startswith(('http://', 'https://')):
        return current
    output = os.path.join(base_dir, 'static', 'resumes', RESUME_FILENAME)
    generate_resume_pdf(data, output)
    info['resume'] = f'/static/resumes/{RESUME_FILENAME}'
    return info['resume']
