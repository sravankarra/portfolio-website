from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, session
import json
import os
from datetime import datetime

app = Flask(__name__)
app.secret_key = 'karra-sravan-portfolio-2024-secure-key'  # Change this to a secure secret key for production

# Data file to store portfolio information
DATA_FILE = 'portfolio_data.json'

# Admin access configuration
ADMIN_USERNAME = 'admin'  # Your admin username
ADMIN_PASSWORD = 'sravan2024admin'  # Your admin password

def load_data():
    """Load portfolio data from JSON file"""
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'r') as f:
            return json.load(f)
    return get_default_data()

def save_data(data):
    """Save portfolio data to JSON file"""
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f, indent=2)

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
            "profile_image": "/static/images/profile-photo.jpg"
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
                "live": ""
            }
        ],
        "social_links": [
            {"platform": "LinkedIn", "url": "https://www.linkedin.com/in/karrasravan", "icon": "fab fa-linkedin"},
            {"platform": "GitHub", "url": "https://github.com/karrasravan", "icon": "fab fa-github"},
            {"platform": "Email", "url": "mailto:sravankarra2003@gmail.com", "icon": "fas fa-envelope"}
        ]
    }

@app.route('/')
def index():
    """Main portfolio page"""
    data = load_data()
    # Check if user is admin
    is_admin = session.get('is_admin', False)
    return render_template('index.html', data=data, is_admin=is_admin)

@app.route('/admin_login', methods=['POST'])
def admin_login():
    """Handle admin login"""
    username = request.form.get('username')
    password = request.form.get('password')
    
    if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
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

@app.route('/admin/update_personal', methods=['POST'])
def update_personal():
    """Update personal information"""
    data = load_data()
    
    data['personal_info']['name'] = request.form.get('name', '')
    data['personal_info']['title'] = request.form.get('title', '')
    data['personal_info']['about'] = request.form.get('about', '')
    data['personal_info']['location'] = request.form.get('location', '')
    data['personal_info']['email'] = request.form.get('email', '')
    data['personal_info']['phone'] = request.form.get('phone', '')
    data['personal_info']['profile_image'] = request.form.get('profile_image', '')
    
    save_data(data)
    flash('Personal information updated successfully!', 'success')
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
        "platform": request.form.get('social_platform', ''),
        "url": request.form.get('social_url', ''),
        "icon": request.form.get('social_icon', 'fas fa-link')
    }
    
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
    
    # Use environment variable for port (for deployment)
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=False, host='0.0.0.0', port=port) 