from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, session, send_file
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
from urllib.parse import quote
import copy
import json
import os
import secrets
import smtplib

def load_env_file():
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
    if not os.path.exists(env_path):
        return
    with open(env_path, encoding='utf-8') as env_file:
        for raw_line in env_file:
            line = raw_line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            key, value = line.split('=', 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))

load_env_file()

app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, 'portfolio_data.json')
AUTH_FILE = os.path.join(BASE_DIR, 'admin_auth.json')
SECRET_FILE = '.secret_key'
RESUME_DIR = os.path.join(BASE_DIR, 'static', 'resumes')
ALLOWED_RESUME_EXTS = {'.pdf', '.doc', '.docx'}
SMTP_HOST = 'smtp.gmail.com'
SMTP_PORT = 587
app.config['MAX_CONTENT_LENGTH'] = 8 * 1024 * 1024
app.config['TEMPLATES_AUTO_RELOAD'] = False
app.jinja_env.auto_reload = False
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 604800


def env(name, default=''):
    return (os.environ.get(name) or default).strip()


def get_secret_key():
    key = env('SECRET_KEY')
    if key:
        return key
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), SECRET_FILE)
    if os.path.exists(path):
        with open(path, encoding='utf-8') as secret_file:
            stored = secret_file.read().strip()
            if stored:
                return stored
    generated = secrets.token_hex(32)
    with open(path, 'w', encoding='utf-8') as secret_file:
        secret_file.write(generated)
    return generated


app.secret_key = get_secret_key()


def admin_username():
    return env('ADMIN_USERNAME', 'admin')


def reset_mailbox():
    return env('RESET_EMAIL') or env('GMAIL_USER')


def utc_now():
    return datetime.now(timezone.utc)


def load_auth():
    if os.path.exists(AUTH_FILE):
        with open(AUTH_FILE, 'r', encoding='utf-8') as auth_file:
            auth = json.load(auth_file)
        if 'gmail_app_password' in auth:
            auth.pop('gmail_app_password', None)
            save_auth(auth)
        return auth
    password = env('ADMIN_PASSWORD')
    if not password:
        password = secrets.token_urlsafe(12)
    auth = {
        'username': admin_username(),
        'password_hash': generate_password_hash(password),
        'reset_token': None,
        'reset_expires': None,
        'last_reset_sent': None
    }
    save_auth(auth)
    return auth


def save_auth(auth):
    clean = dict(auth)
    clean.pop('gmail_app_password', None)
    with open(AUTH_FILE, 'w', encoding='utf-8') as auth_file:
        json.dump(clean, auth_file, indent=2)


def get_admin_username():
    return (load_auth().get('username') or admin_username()).strip()


def password_matches(password):
    auth = load_auth()
    password_hash = auth.get('password_hash')
    if password_hash and check_password_hash(password_hash, password):
        return True
    configured = env('ADMIN_PASSWORD')
    return bool(configured) and password == configured


def smtp_credentials():
    sender = env('GMAIL_USER') or reset_mailbox()
    password = env('GMAIL_APP_PASSWORD').replace(' ', '')
    recipient = reset_mailbox() or sender
    return sender, password, recipient


def friendly_smtp_error(error):
    text = str(error)
    lowered = text.lower()
    if '535' in text or 'badcredentials' in lowered or 'username and password not accepted' in lowered:
        return (
            'The mail server rejected the login. Set GMAIL_APP_PASSWORD to a 16-character '
            'Gmail App Password in your environment variables, not your normal Gmail password.'
        )
    if 'missing' in lowered or 'not configured' in lowered:
        return 'Email is not configured. Set RESET_EMAIL, GMAIL_USER, and GMAIL_APP_PASSWORD as environment variables.'
    return 'Could not send the reset email. Check the server mail settings.'


def send_reset_email(reset_url):
    sender, app_password, recipient = smtp_credentials()
    if not sender or not recipient or not app_password:
        raise RuntimeError('Email is not configured.')

    message = EmailMessage()
    message['Subject'] = 'Reset your portfolio admin password'
    message['From'] = sender
    message['To'] = recipient
    message.set_content(
        f'Use this link to create a new admin password (valid for 30 minutes):\n\n{reset_url}\n'
    )
    message.add_alternative(
        f'''<p>You asked to reset your portfolio admin password.</p>
<p><a href="{reset_url}">Create a new password</a></p>
<p>This link expires in 30 minutes. If you did not request it, you can ignore this email.</p>''',
        subtype='html'
    )

    last_error = None
    try:
        with smtplib.SMTP_SSL(SMTP_HOST, 465, timeout=20) as smtp:
            smtp.login(sender, app_password)
            smtp.send_message(message)
            return
    except Exception as error:
        last_error = error

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=20) as smtp:
            smtp.starttls()
            smtp.login(sender, app_password)
            smtp.send_message(message)
            return
    except Exception as error:
        last_error = error

    raise last_error


_DATA_CACHE = {'mtime': None, 'data': None}


def load_data():
    """Load portfolio data from JSON file"""
    try:
        mtime = os.path.getmtime(DATA_FILE)
    except OSError:
        mtime = None

    if _DATA_CACHE['data'] is not None and _DATA_CACHE['mtime'] == mtime:
        data = copy.deepcopy(_DATA_CACHE['data'])
    elif os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
        _DATA_CACHE['mtime'] = mtime
        _DATA_CACHE['data'] = copy.deepcopy(data)
    else:
        data = get_default_data()
        _DATA_CACHE['mtime'] = mtime
        _DATA_CACHE['data'] = copy.deepcopy(data)

    data.setdefault('personal_info', {})
    data['personal_info'].setdefault('resume', '')
    data.setdefault('skills', [])
    data.setdefault('education', [])
    data.setdefault('projects', [])
    data.setdefault('social_links', [])
    return data

def save_data(data):
    """Save portfolio data to JSON file"""
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)
    try:
        _DATA_CACHE['mtime'] = os.path.getmtime(DATA_FILE)
    except OSError:
        _DATA_CACHE['mtime'] = None
    _DATA_CACHE['data'] = copy.deepcopy(data)


def require_admin():
    if session.get('is_admin', False):
        return True
    flash('Access denied! Please login as admin.', 'error')
    return False


def resume_local_path(resume_url):
    """Return the filesystem path for an uploaded resume, or None."""
    if not resume_url:
        return None
    prefix = '/static/resumes/'
    if not resume_url.startswith(prefix):
        return None
    filename = secure_filename(os.path.basename(resume_url))
    if not filename:
        return None
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_RESUME_EXTS:
        return None
    full = os.path.abspath(os.path.join(RESUME_DIR, filename))
    base = os.path.abspath(RESUME_DIR)
    try:
        if os.path.commonpath([full, base]) != base:
            return None
    except ValueError:
        return None
    return full


def delete_local_resume(resume_url):
    path = resume_local_path(resume_url)
    if not path or not os.path.isfile(path):
        return
    try:
        os.remove(path)
    except PermissionError:
        # Windows can briefly lock a file after it was served; skip and overwrite next upload.
        pass


def is_safe_resume_url(url):
    if not url:
        return False
    lowered = url.lower()
    return lowered.startswith(('http://', 'https://', '/static/'))

def get_default_data():
    """Return default portfolio data structure"""
    return {
        "personal_info": {
            "name": "Sravan Karra",
            "title": "MCA Student | Aspiring Software Developer",
            "about": "Hello! I'm Sravan, an enthusiastic MCA student passionate about exploring the world of software development, data science, and artificial intelligence. I love solving problems, learning new technologies, and creating impactful solutions that make life easier.\r\nI am currently pursuing my Master of Computer Applications (MCA) at BVC College, with a strong interest in building a career in the IT industry. My academic journey has equipped me with a solid foundation in programming, algorithms, and emerging technologies.\r\nMy goal is to work in a challenging environment where I can apply my skills, grow professionally, and contribute to innovative projects.",
            "location": "Amalapuram",
            "email": "sravankarra2003@gmail.com",
            "phone": null,
            "profile_image": "/static/images/profile-photo.webp",
            "resume": ""
        },
        "skills": [
            {"name": "Python", "level": 90, "category": "Programming Languages"},
            {"name": "C", "level": 85, "category": "Programming Languages"},
            {"name": "C++", "level": 80, "category": "Programming Languages"},
            {"name": "Java", "level": 75, "category": "Programming Languages"},
            {"name": "HTML", "level": 85, "category": "Web Development"},
            {"name": "CSS", "level": 80, "category": "Web Development"},
            {"name": "JavaScript", "level": 75, "category": "Web Development"},
            {"name": "Git", "level": 85, "category": "Tools & Platforms"},
            {"name": "GitHub", "level": 80, "category": "Tools & Platforms"},
            {"name": "VS Code", "level": 90, "category": "Tools & Platforms"},
            {"name": "Data Structures", "level": 85, "category": "Concepts"},
            {"name": "Algorithms", "level": 80, "category": "Concepts"},
            {"name": "Database Management", "level": 75, "category": "Concepts"},
            {"name": "OOP", "level": 80, "category": "Concepts"}
        ],
        "education": [
            {
                "degree": "Master of Computer Applications (MCA)",
                "institution": "BVC College",
                "period": "Present",
                "description": "Currently pursuing with focus on programming, data science, and software development"
            },
            {
                "degree": "Bachelor of Science (B.Sc.)",
                "institution": "Vidyanidhi Degree College, affiliated to Adikavi Nannaya University",
                "period": "Completed",
                "description": "Completed coursework in programming, data science, and software development"
            }
        ],
        "projects": [
            {
                "title": "Portfolio Website",
                "description": "A personal portfolio website built with Python Flask, featuring dynamic content management and responsive design.",
                "image": "",
                "technologies": ["Python", "Flask", "HTML", "CSS", "JavaScript"],
                "github": "https://github.com/karrasravan",
                "live": "/"
            }
        ],
        "social_links": [
            {"platform": "LinkedIn", "url": "https://www.linkedin.com/in/karrasravan", "icon": "fab fa-linkedin"},
            {"platform": "GitHub", "url": "https://github.com/karrasravan", "icon": "fab fa-github"},
            {"platform": "Email", "url": "mailto:sravankarra2003@gmail.com", "icon": "fas fa-envelope"}
        ]
    }

def get_linkedin_url(data):
    for social in data.get('social_links') or []:
        platform = (social.get('platform') or '').lower()
        url = (social.get('url') or '').strip()
        if url and ('linkedin' in platform or 'linkedin.com' in url.lower()):
            return url
    return 'https://www.linkedin.com/in/karrasravan'


def project_preview_src(live):
    live = (live or '').strip()
    if not live:
        return ''
    if live in ('/', '/#', '/#home') or live.startswith('/#'):
        return '/?embed=1'
    if live.startswith('/') and not live.startswith('//'):
        if 'embed=' in live:
            return live
        return live + ('&' if '?' in live else '?') + 'embed=1'
    return live


app.add_template_filter(project_preview_src, 'preview_src')


def contact_mail_url(email, name='Sravan'):
    """Open a compose window to the public contact email."""
    email = normalize_email(email)
    if not email:
        return '#contact'
    first_name = (name or 'there').split()[0]
    subject = f'Hello {first_name}'
    if email.lower().endswith('@gmail.com'):
        return (
            'https://mail.google.com/mail/?view=cm&fs=1&tf=1'
            f'&to={quote(email)}'
            f'&su={quote(subject)}'
        )
    return f'mailto:{email}?subject={quote(subject)}'


def normalize_email(value):
    value = (value or '').strip()
    if value.lower().startswith('mailto:'):
        value = value[7:].strip()
    value = value.split('?')[0].strip()
    if '@' not in value or ' ' in value:
        return ''
    return value


def is_email_social(social):
    platform = (social.get('platform') or '').lower()
    url = (social.get('url') or '').lower()
    icon = (social.get('icon') or '').lower()
    return (
        platform in ('email', 'mail', 'gmail', 'e-mail')
        or url.startswith('mailto:')
        or 'envelope' in icon
        or '@' in (social.get('url') or '')
    )


def social_contact_email(data):
    for social in data.get('social_links') or []:
        if is_email_social(social):
            email = normalize_email(social.get('url'))
            if email:
                return email
    return ''


def resolve_contact_email(data):
    personal = normalize_email((data.get('personal_info') or {}).get('email'))
    social = social_contact_email(data)
    return social or personal


def apply_contact_email(data, email):
    email = normalize_email(email)
    data.setdefault('personal_info', {})
    data['personal_info']['email'] = email
    sync_contact_email(data)
    return email


def sync_contact_email(data):
    """Keep Get In Touch, the email link, and Email social icons on the same address."""
    email = normalize_email((data.get('personal_info') or {}).get('email'))
    data.setdefault('social_links', [])
    if not email:
        return
    mail_url = f'mailto:{email}'
    found = False
    for social in data['social_links']:
        if is_email_social(social):
            social['url'] = mail_url
            found = True
    if not found:
        data['social_links'].append({
            'platform': 'Email',
            'url': mail_url,
            'icon': 'fas fa-envelope',
        })


TECH_ICON_MAP = (
    ('html', 'fab fa-html5', 'html'),
    ('css', 'fab fa-css3-alt', 'css'),
    ('javascript', 'fab fa-js-square', 'js'),
    ('python', 'fab fa-python', 'py'),
    ('java', 'fab fa-java', 'js'),
    ('react', 'fab fa-react', 'js'),
    ('node', 'fab fa-node-js', 'js'),
    ('git', 'fab fa-git-alt', 'git'),
    ('github', 'fab fa-github', 'git'),
)


def tech_icons_from_skills(skills):
    names = [(skill.get('name') or '').lower() for skill in skills or []]
    icons = []
    used = set()
    for key, icon, css in TECH_ICON_MAP:
        if key in used:
            continue
        if any(key == name or key in name.split() for name in names):
            icons.append({'icon': icon, 'css': css})
            used.add(key)
    return icons[:6]


@app.after_request
def set_cache_headers(response):
    if request.endpoint == 'static':
        response.headers['Cache-Control'] = 'public, max-age=604800'
    elif request.endpoint in ('index', 'admin', 'get_data'):
        response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
        response.headers['Pragma'] = 'no-cache'
    return response


@app.route('/')
def index():
    """Main portfolio page"""
    data = load_data()
    # Check if user is admin
    is_admin = session.get('is_admin', False)
    embed = request.args.get('embed') == '1'
    contact_email = resolve_contact_email(data)
    return render_template(
        'index.html',
        data=data,
        is_admin=is_admin,
        linkedin_url=get_linkedin_url(data),
        embed=embed,
        tech_icons=tech_icons_from_skills(data.get('skills')),
        contact_email=contact_email,
        contact_href=contact_mail_url(
            contact_email,
            data['personal_info'].get('name', 'Sravan'),
        ),
    )


@app.route('/resume')
def view_resume():
    """Open the uploaded resume in a new browser tab."""
    data = load_data()
    resume = ((data.get('personal_info') or {}).get('resume') or '').strip()
    local = resume_local_path(resume)
    if local and os.path.isfile(local):
        return send_file(local, as_attachment=False)
    if resume.startswith(('http://', 'https://', '/static/')):
        return redirect(resume)
    return render_template('resume_missing.html', data=data), 404

@app.route('/admin_login', methods=['POST'])
def admin_login():
    """Handle admin login"""
    username = (request.form.get('username') or '').strip()
    password = (request.form.get('password') or '').strip()
    
    if username.lower() == get_admin_username().lower() and password_matches(password):
        session['is_admin'] = True
        flash('Admin access granted!', 'success')
        return redirect(url_for('admin'))
    else:
        flash('Invalid username or password!', 'error')
        return redirect(url_for('admin_login_page'))

@app.route('/admin_logout')
def admin_logout():
    """Logout admin"""
    session.pop('is_admin', None)
    flash('Logged out successfully!', 'success')
    return redirect(url_for('index'))

@app.route('/admin')
def admin():
    """Admin panel page"""
    if not session.get('is_admin', False):
        flash('Access denied! Please login as admin.', 'error')
        return redirect(url_for('index'))
    
    data = load_data()
    return render_template('admin.html', data=data)

@app.route('/admin_login_page')
def admin_login_page():
    """Admin login page"""
    return render_template('admin_login.html')


@app.route('/forgot_password', methods=['GET', 'POST'])
def forgot_password():
    """Send a password reset link to the configured admin mailbox."""
    if request.method == 'POST':
        auth = load_auth()
        last_sent = auth.get('last_reset_sent')
        if last_sent:
            try:
                last_dt = datetime.fromisoformat(last_sent)
                if utc_now() - last_dt < timedelta(seconds=60):
                    flash('Please wait a minute before requesting another reset email.', 'error')
                    return redirect(url_for('forgot_password'))
            except ValueError:
                pass

        token = secrets.token_urlsafe(32)
        auth['reset_token'] = token
        auth['reset_expires'] = (utc_now() + timedelta(minutes=30)).isoformat()
        save_auth(auth)

        reset_url = url_for('reset_password', token=token, _external=True)
        try:
            send_reset_email(reset_url)
            auth = load_auth()
            auth['last_reset_sent'] = utc_now().isoformat()
            save_auth(auth)
            flash('If email is configured, a reset link was sent to the admin inbox. Check inbox and spam.', 'success')
        except Exception as error:
            flash(friendly_smtp_error(error), 'error')
        return redirect(url_for('forgot_password'))

    return render_template('forgot_password.html')


@app.route('/reset_password/<token>', methods=['GET', 'POST'])
def reset_password(token):
    """Create a new admin password from a emailed reset link."""
    auth = load_auth()
    expires = auth.get('reset_expires')
    token_valid = (
        auth.get('reset_token')
        and secrets.compare_digest(auth.get('reset_token'), token)
        and expires
    )
    if token_valid:
        try:
            token_valid = utc_now() <= datetime.fromisoformat(expires)
        except ValueError:
            token_valid = False

    if not token_valid:
        flash('This reset link is invalid or has expired. Please request a new one.', 'error')
        return redirect(url_for('forgot_password'))

    if request.method == 'POST':
        new_password = (request.form.get('password') or '').strip()
        confirm_password = (request.form.get('confirm_password') or '').strip()
        if len(new_password) < 8:
            flash('Password must be at least 8 characters.', 'error')
            return redirect(url_for('reset_password', token=token))
        if new_password != confirm_password:
            flash('Passwords do not match.', 'error')
            return redirect(url_for('reset_password', token=token))

        auth['password_hash'] = generate_password_hash(new_password)
        auth['reset_token'] = None
        auth['reset_expires'] = None
        save_auth(auth)
        flash('Password updated. You can log in with your new password.', 'success')
        return redirect(url_for('admin_login_page'))

    return render_template('reset_password.html')

@app.route('/admin/update_personal', methods=['POST'])
def update_personal():
    """Update personal information"""
    data = load_data()
    
    data['personal_info']['name'] = (request.form.get('name') or '').strip()
    data['personal_info']['title'] = (request.form.get('title') or '').strip()
    data['personal_info']['about'] = request.form.get('about') or ''
    data['personal_info']['location'] = (request.form.get('location') or '').strip()
    data['personal_info']['email'] = normalize_email(request.form.get('email'))
    data['personal_info']['phone'] = (request.form.get('phone') or '').strip()
    data['personal_info']['profile_image'] = (request.form.get('profile_image') or '').strip()
    apply_contact_email(data, data['personal_info']['email'])
    save_data(data)
    flash('Personal information updated successfully!', 'success')
    return redirect(url_for('admin'))


@app.errorhandler(413)
def file_too_large(_error):
    flash('Resume file is too large. Maximum size is 8 MB.', 'error')
    if session.get('is_admin', False):
        return redirect(url_for('admin'))
    return 'File too large', 413


@app.route('/admin/upload_resume', methods=['POST'])
def upload_resume():
    """Upload a resume file or save a resume URL."""
    if not require_admin():
        return redirect(url_for('admin_login_page'))

    data = load_data()
    uploaded = request.files.get('resume_file')
    resume_url = (request.form.get('resume_url') or '').strip()
    current = data['personal_info'].get('resume', '')

    if uploaded and uploaded.filename:
        filename = secure_filename(uploaded.filename)
        ext = os.path.splitext(filename)[1].lower()
        if ext not in ALLOWED_RESUME_EXTS:
            flash('Resume must be a PDF, DOC, or DOCX file.', 'error')
            return redirect(url_for('admin'))

        os.makedirs(RESUME_DIR, exist_ok=True)
        stored_name = f'sravan-karra-resume{ext}'
        new_url = f'/static/resumes/{stored_name}'
        if current != new_url:
            delete_local_resume(current)
        uploaded.save(os.path.join(RESUME_DIR, stored_name))
        data['personal_info']['resume'] = new_url
        save_data(data)
        flash('Resume uploaded. Visitors can download it from the homepage.', 'success')
        return redirect(url_for('admin'))

    if resume_url:
        if not is_safe_resume_url(resume_url):
            flash('Resume link must start with http://, https://, or /static/.', 'error')
            return redirect(url_for('admin'))
        if resume_url != current:
            delete_local_resume(current)
        data['personal_info']['resume'] = resume_url
        save_data(data)
        flash('Resume link saved. Visitors can download it from the homepage.', 'success')
        return redirect(url_for('admin'))

    flash('Choose a resume file or paste a resume URL.', 'error')
    return redirect(url_for('admin'))


@app.route('/admin/delete_resume', methods=['POST'])
def delete_resume():
    """Remove the current resume file or link."""
    if not require_admin():
        return redirect(url_for('admin_login_page'))

    data = load_data()
    delete_local_resume(data['personal_info'].get('resume', ''))
    data['personal_info']['resume'] = ''
    save_data(data)
    flash('Resume removed from the site.', 'success')
    return redirect(url_for('admin'))


def _int_in_range(value, default, minimum, maximum):
    try:
        number = int(value if value not in (None, '') else default)
    except ValueError:
        number = default
    return max(minimum, min(maximum, number))


@app.route('/admin/save_changes', methods=['POST'])
def save_changes():
    """Save personal info and edits to existing skills, education, projects, and social links."""
    if not session.get('is_admin', False):
        flash('Access denied! Please login as admin.', 'error')
        return redirect(url_for('admin_login_page'))

    data = load_data()
    old_email = normalize_email(data['personal_info'].get('email'))

    data['personal_info']['name'] = (request.form.get('name') or '').strip()
    data['personal_info']['title'] = (request.form.get('title') or '').strip()
    data['personal_info']['about'] = request.form.get('about') or ''
    data['personal_info']['location'] = (request.form.get('location') or '').strip()
    new_personal_email = normalize_email(request.form.get('email'))
    data['personal_info']['email'] = new_personal_email
    data['personal_info']['phone'] = (request.form.get('phone') or '').strip()
    data['personal_info']['profile_image'] = (request.form.get('profile_image') or '').strip()

    if any(key.startswith('skill_name_') for key in request.form):
        skills = []
        index = 0
        while f'skill_name_{index}' in request.form:
            name = (request.form.get(f'skill_name_{index}') or '').strip()
            if name:
                skills.append({
                    'name': name,
                    'level': _int_in_range(request.form.get(f'skill_level_{index}'), 50, 0, 100),
                    'category': (request.form.get(f'skill_category_{index}') or 'Other').strip()
                })
            index += 1
        data['skills'] = skills

    if any(key.startswith('education_degree_') for key in request.form):
        education = []
        index = 0
        while f'education_degree_{index}' in request.form:
            degree = (request.form.get(f'education_degree_{index}') or '').strip()
            if degree:
                education.append({
                    'degree': degree,
                    'institution': (request.form.get(f'education_institution_{index}') or '').strip(),
                    'period': (request.form.get(f'education_period_{index}') or '').strip(),
                    'description': (request.form.get(f'education_description_{index}') or '').strip()
                })
            index += 1
        data['education'] = education

    if any(key.startswith('project_title_') for key in request.form):
        projects = []
        index = 0
        while f'project_title_{index}' in request.form:
            title = (request.form.get(f'project_title_{index}') or '').strip()
            if title:
                technologies = [
                    tech.strip()
                    for tech in (request.form.get(f'project_technologies_{index}') or '').split(',')
                    if tech.strip()
                ]
                projects.append({
                    'title': title,
                    'description': (request.form.get(f'project_description_{index}') or '').strip(),
                    'image': (request.form.get(f'project_image_{index}') or '').strip(),
                    'technologies': technologies,
                    'github': (request.form.get(f'project_github_{index}') or '').strip(),
                    'live': (request.form.get(f'project_live_{index}') or '').strip()
                })
            index += 1
        data['projects'] = projects

    if any(key.startswith('social_platform_') for key in request.form):
        social_links = []
        index = 0
        while f'social_platform_{index}' in request.form:
            platform = (request.form.get(f'social_platform_{index}') or '').strip()
            if platform:
                social_links.append({
                    'platform': platform,
                    'url': (request.form.get(f'social_url_{index}') or '').strip(),
                    'icon': (request.form.get(f'social_icon_{index}') or 'fas fa-link').strip()
                })
            index += 1
        data['social_links'] = social_links

    social_email = social_contact_email(data)
    if new_personal_email and new_personal_email != old_email:
        chosen_email = new_personal_email
    elif social_email and social_email != old_email:
        chosen_email = social_email
    else:
        chosen_email = new_personal_email or social_email or old_email
    apply_contact_email(data, chosen_email)
    save_data(data)
    flash('All changes saved successfully!', 'success')
    return redirect(url_for('admin'))

@app.route('/admin/add_skill', methods=['POST'])
def add_skill():
    """Add a new skill"""
    data = load_data()
    
    skill = {
        "name": request.form.get('skill_name', ''),
        "level": int(request.form.get('skill_level', 50)),
        "category": request.form.get('skill_category', 'Other')
    }
    
    data['skills'].append(skill)
    save_data(data)
    flash('Skill added successfully!', 'success')
    return redirect(url_for('admin'))

@app.route('/admin/delete_skill/<int:index>')
def delete_skill(index):
    """Delete a skill by index"""
    data = load_data()
    
    if 0 <= index < len(data['skills']):
        del data['skills'][index]
        save_data(data)
        flash('Skill deleted successfully!', 'success')
    
    return redirect(url_for('admin'))

@app.route('/admin/add_education', methods=['POST'])
def add_education():
    """Add a new education entry"""
    data = load_data()
    
    education = {
        "degree": request.form.get('education_degree', ''),
        "institution": request.form.get('education_institution', ''),
        "period": request.form.get('education_period', ''),
        "description": request.form.get('education_description', '')
    }
    
    data['education'].append(education)
    save_data(data)
    flash('Education entry added successfully!', 'success')
    return redirect(url_for('admin'))

@app.route('/admin/delete_education/<int:index>')
def delete_education(index):
    """Delete an education entry by index"""
    data = load_data()
    
    if 0 <= index < len(data['education']):
        del data['education'][index]
        save_data(data)
        flash('Education entry deleted successfully!', 'success')
    
    return redirect(url_for('admin'))

@app.route('/admin/add_project', methods=['POST'])
def add_project():
    """Add a new project"""
    data = load_data()
    
    project = {
        "title": request.form.get('project_title', ''),
        "description": request.form.get('project_description', ''),
        "image": request.form.get('project_image', ''),
        "technologies": request.form.get('project_technologies', '').split(','),
        "github": request.form.get('project_github', ''),
        "live": request.form.get('project_live', '')
    }
    
    data['projects'].append(project)
    save_data(data)
    flash('Project added successfully!', 'success')
    return redirect(url_for('admin'))

@app.route('/admin/delete_project/<int:index>')
def delete_project(index):
    """Delete a project by index"""
    data = load_data()
    
    if 0 <= index < len(data['projects']):
        del data['projects'][index]
        save_data(data)
        flash('Project deleted successfully!', 'success')
    
    return redirect(url_for('admin'))

@app.route('/admin/add_social', methods=['POST'])
def add_social():
    """Add a new social link"""
    data = load_data()
    
    social = {
        "platform": (request.form.get('social_platform') or '').strip(),
        "url": (request.form.get('social_url') or '').strip(),
        "icon": (request.form.get('social_icon') or 'fas fa-link').strip()
    }
    if not social['url'] and is_email_social(social):
        email = (data.get('personal_info') or {}).get('email', '').strip()
        if email:
            social['url'] = f'mailto:{email}'
    
    data['social_links'].append(social)
    save_data(data)
    flash('Social link added successfully!', 'success')
    return redirect(url_for('admin'))

@app.route('/admin/delete_social/<int:index>')
def delete_social(index):
    """Delete a social link by index"""
    data = load_data()
    
    if 0 <= index < len(data['social_links']):
        del data['social_links'][index]
        save_data(data)
        flash('Social link deleted successfully!', 'success')
    
    return redirect(url_for('admin'))

@app.route('/api/data')
def get_data():
    """API endpoint to get portfolio data"""
    data = load_data()
    return jsonify(data)

if __name__ == '__main__':
    # Create data file if it doesn't exist
    if not os.path.exists(DATA_FILE):
        save_data(get_default_data())
    os.makedirs(RESUME_DIR, exist_ok=True)
    
    # Use environment variable for port (for deployment)
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=False, host='0.0.0.0', port=port, threaded=True, use_reloader=False) 