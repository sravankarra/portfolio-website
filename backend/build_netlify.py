"""Build a static copy of the public portfolio for Netlify."""
import json
import os
import shutil
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent
ROOT_DIR = BACKEND_DIR.parent
sys.path.insert(0, str(BACKEND_DIR))

os.environ['STATIC_EXPORT'] = '1'

from flask import render_template

from app import DATA_FILE, FRONTEND_DIR, ROOT_DIR as APP_ROOT, app, load_data

DIST = Path(APP_ROOT) / 'dist'


def main():
    if DIST.exists():
        shutil.rmtree(DIST)
    DIST.mkdir()

    shutil.copytree(Path(FRONTEND_DIR) / 'static', DIST / 'static')

    client = app.test_client()
    html = client.get('/').get_data(as_text=True)
    (DIST / 'index.html').write_text(html, encoding='utf-8')

    with app.app_context():
        with app.test_request_context('/'):
            data = load_data()
            (DIST / 'admin.html').write_text(
                render_template('admin.html', data=data),
                encoding='utf-8',
            )
            (DIST / 'admin-login.html').write_text(
                render_template('admin_login.html'),
                encoding='utf-8',
            )

    resume = '/static/resumes/sravan-karra-resume.pdf'
    if Path(DATA_FILE).exists():
        with open(DATA_FILE, encoding='utf-8') as data_file:
            data = json.load(data_file)
        resume = ((data.get('personal_info') or {}).get('resume') or resume).strip() or resume

    resume_html = client.get('/resume').get_data(as_text=True)
    (DIST / 'resume.html').write_text(resume_html, encoding='utf-8')

    resume_target = resume if resume.startswith(('http://', 'https://', '/')) else f'/{resume}'
    local_resume = DIST / resume_target.lstrip('/').replace('/', os.sep)
    if not resume.startswith(('http://', 'https://')) and not local_resume.is_file():
        resume_target = '/resume.html'

    (DIST / '_redirects').write_text(
        '\n'.join([
            '/api/portfolio /.netlify/functions/portfolio 200',
            '/api/admin /.netlify/functions/admin 200',
            '/admin /admin.html 200',
            '/admin_login_page /admin-login.html 200',
            '/resume /resume.html 200',
            f'/resume/download {resume_target} 302',
            '',
        ]),
        encoding='utf-8',
    )
    print(f'Built static site in {DIST}')


if __name__ == '__main__':
    main()
