"""Build a static copy of the public portfolio for Netlify."""
import json
import os
import shutil
from pathlib import Path

os.environ['STATIC_EXPORT'] = '1'

from flask import render_template

from app import BASE_DIR, DATA_FILE, app, load_data

DIST = Path(BASE_DIR) / 'dist'


def main():
    if DIST.exists():
        shutil.rmtree(DIST)
    DIST.mkdir()

    shutil.copytree(
        Path(BASE_DIR) / 'static',
        DIST / 'static',
        ignore=shutil.ignore_patterns('profile-photo.png', 'profile-photo-original.png'),
    )

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

    missing = Path(BASE_DIR) / 'templates' / 'resume_missing.html'
    if missing.exists():
        (DIST / 'resume-missing.html').write_text(
            missing.read_text(encoding='utf-8').replace(
                "{{ data.personal_info.name }}", "Sravan Karra"
            ).replace("{{ url_for('index') }}", "/").replace(
                "{{ url_for('static', filename='css/styles.css') }}?v=7",
                "/static/css/styles.css",
            ),
            encoding='utf-8',
        )

    resume_target = resume if resume.startswith('/') else f'/{resume}'
    local_resume = DIST / resume_target.lstrip('/').replace('/', os.sep)
    if not local_resume.is_file():
        resume_target = '/resume-missing.html'

    (DIST / '_redirects').write_text(
        '\n'.join([
            '/api/portfolio /.netlify/functions/portfolio 200',
            '/api/admin /.netlify/functions/admin 200',
            '/admin /admin.html 200',
            '/admin_login_page /admin-login.html 200',
            f'/resume {resume_target} 200',
            '',
        ]),
        encoding='utf-8',
    )
    print(f'Built static site in {DIST}')


if __name__ == '__main__':
    main()
