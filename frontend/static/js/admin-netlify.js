(() => {
  const API = '/api/admin';

  const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  async function request(action, options = {}) {
    const response = await fetch(`${API}?action=${encodeURIComponent(action)}`, {
      credentials: 'same-origin',
      ...options,
    });
    let payload = {};
    try {
      payload = await response.json();
    } catch {
      payload = {};
    }
    if (!response.ok) {
      throw new Error(payload.error || 'Request failed.');
    }
    return payload;
  }

  function showAlert(message, type = 'success') {
    if (typeof window.showAlert === 'function') {
      window.showAlert(message, type);
      return;
    }
    const box = document.querySelector('.admin-login-box') || document.body;
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    box.insertBefore(alert, box.firstChild);
  }

  function fileToDataUrl(input) {
    const file = input?.files?.[0];
    if (!file) return Promise.resolve('');
    if (file.size > 6 * 1024 * 1024) {
      return Promise.reject(new Error('Image must be under 6 MB.'));
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Could not read the image.'));
      reader.readAsDataURL(file);
    });
  }

  async function collectCurrentData() {
    const form = document.getElementById('save-all-form');
    if (!form) {
      return window.__portfolioData || {};
    }
    const value = (name) => (document.querySelector(`[name="${name}"]`) || {}).value || '';
    const skills = [];
    const education = [];
    const internships = [];
    const projects = [];
    const socials = [];
    let index = 0;
    while (document.querySelector(`[name="skill_name_${index}"]`)) {
      const name = value(`skill_name_${index}`).trim();
      if (name) {
        skills.push({
          name,
          level: Number(value(`skill_level_${index}`)) || 50,
          category: value(`skill_category_${index}`).trim() || 'Other',
        });
      }
      index += 1;
    }
    index = 0;
    while (document.querySelector(`[name="education_degree_${index}"]`)) {
      const degree = value(`education_degree_${index}`).trim();
      if (degree) {
        education.push({
          degree,
          institution: value(`education_institution_${index}`).trim(),
          period: value(`education_period_${index}`).trim(),
          description: value(`education_description_${index}`).trim(),
        });
      }
      index += 1;
    }
    index = 0;
    while (document.querySelector(`[name="internship_title_${index}"]`)) {
      const title = value(`internship_title_${index}`).trim();
      if (title) {
        internships.push({
          title,
          period: value(`internship_period_${index}`).trim(),
          bullets: value(`internship_bullets_${index}`).split('\n').map((line) => line.trim()).filter(Boolean),
        });
      }
      index += 1;
    }
    index = 0;
    while (document.querySelector(`[name="project_title_${index}"]`)) {
      const title = value(`project_title_${index}`).trim();
      if (title) {
        const fileInput = document.querySelector(`[name="project_image_file_${index}"]`);
        const uploaded = await fileToDataUrl(fileInput);
        projects.push({
          title,
          description: value(`project_description_${index}`).trim(),
          image: uploaded || value(`project_image_${index}`).trim(),
          technologies: value(`project_technologies_${index}`).split(',').map((item) => item.trim()).filter(Boolean),
          github: value(`project_github_${index}`).trim(),
          live: value(`project_live_${index}`).trim(),
        });
      }
      index += 1;
    }
    index = 0;
    while (document.querySelector(`[name="social_platform_${index}"]`)) {
      const platform = value(`social_platform_${index}`).trim();
      if (platform) {
        socials.push({
          platform,
          url: value(`social_url_${index}`).trim(),
          icon: value(`social_icon_${index}`).trim() || 'fas fa-link',
        });
      }
      index += 1;
    }
    return {
      personal_info: {
        name: value('name').trim(),
        title: value('title').trim(),
        about: value('about'),
        location: value('location').trim(),
        email: value('email').trim(),
        phone: value('phone').trim(),
        profile_image: value('profile_image').trim(),
        resume: (window.__portfolioData?.personal_info || {}).resume || '',
        languages: value('languages').trim(),
      },
      skills,
      education,
      internships,
      projects,
      social_links: socials,
    };
  }

  function renderLists(data) {
    const skills = document.querySelector('.skills-list');
    const education = document.querySelector('.education-list');
    const internshipsEl = document.querySelector('.internship-list');
    const projects = document.querySelector('.projects-list');
    const socials = document.querySelector('.social-list');
    if (skills) {
      skills.innerHTML = (data.skills || []).map((skill, index) => `
        <div class="skill-item item-edit">
          <div class="item-edit-grid">
            <div class="form-group"><label>Skill Name</label><input form="save-all-form" type="text" name="skill_name_${index}" value="${escapeHtml(skill.name)}" required></div>
            <div class="form-group"><label>Level (%)</label><input form="save-all-form" type="number" name="skill_level_${index}" min="0" max="100" value="${escapeHtml(skill.level)}" required></div>
            <div class="form-group"><label>Category</label><input form="save-all-form" type="text" name="skill_category_${index}" value="${escapeHtml(skill.category)}" required></div>
          </div>
          <a href="#delete-skill-${index}" class="btn btn-danger btn-small" data-delete="skills" data-index="${index}"><i class="fas fa-trash"></i></a>
        </div>`).join('');
    }
    if (education) {
      education.innerHTML = (data.education || []).map((item, index) => `
        <div class="education-item item-edit">
          <div class="item-edit-stack">
            <div class="form-group"><label>Degree</label><input form="save-all-form" type="text" name="education_degree_${index}" value="${escapeHtml(item.degree)}" required></div>
            <div class="form-group"><label>Institution</label><input form="save-all-form" type="text" name="education_institution_${index}" value="${escapeHtml(item.institution)}" required></div>
            <div class="form-row">
              <div class="form-group"><label>Period</label><input form="save-all-form" type="text" name="education_period_${index}" value="${escapeHtml(item.period)}" required></div>
              <div class="form-group"><label>Description</label><textarea form="save-all-form" name="education_description_${index}" rows="2" required>${escapeHtml(item.description)}</textarea></div>
            </div>
          </div>
          <a href="#delete-education-${index}" class="btn btn-danger btn-small" data-delete="education" data-index="${index}"><i class="fas fa-trash"></i></a>
        </div>`).join('');
    }
    if (internshipsEl) {
      internshipsEl.innerHTML = (data.internships || []).map((item, index) => `
        <div class="education-item item-edit">
          <div class="item-edit-stack">
            <div class="form-group"><label>Title</label><input form="save-all-form" type="text" name="internship_title_${index}" value="${escapeHtml(item.title)}" required></div>
            <div class="form-group"><label>Period</label><input form="save-all-form" type="text" name="internship_period_${index}" value="${escapeHtml(item.period || '')}"></div>
            <div class="form-group"><label>Bullet points (one per line)</label><textarea form="save-all-form" name="internship_bullets_${index}" rows="3">${escapeHtml((item.bullets || []).join('\n'))}</textarea></div>
          </div>
          <a href="#delete-internship-${index}" class="btn btn-danger btn-small" data-delete="internships" data-index="${index}"><i class="fas fa-trash"></i></a>
        </div>`).join('');
    }
    if (projects) {
      projects.innerHTML = (data.projects || []).map((project, index) => `
        <div class="project-item item-edit">
          <div class="item-edit-stack">
            <div class="form-group"><label>Title</label><input form="save-all-form" type="text" name="project_title_${index}" value="${escapeHtml(project.title)}" required></div>
            <div class="form-group"><label>Description</label><textarea form="save-all-form" name="project_description_${index}" rows="3" required>${escapeHtml(project.description)}</textarea></div>
            <div class="form-group">
              <label>Work card preview image</label>
              ${project.image ? `<div class="project-preview-thumb"><img src="${escapeHtml(project.image)}" alt="${escapeHtml(project.title)} preview"></div>` : ''}
              <input form="save-all-form" type="file" name="project_image_file_${index}" accept="image/png,image/jpeg,image/webp,image/gif">
              <small>Upload a new image to replace the Work card preview.</small>
              <input form="save-all-form" type="hidden" name="project_image_${index}" value="${escapeHtml(project.image)}">
            </div>
            <div class="form-group"><label>Technologies</label><input form="save-all-form" type="text" name="project_technologies_${index}" value="${escapeHtml((project.technologies || []).join(', '))}" required></div>
            <div class="form-row">
              <div class="form-group"><label>Git repository link</label><input form="save-all-form" type="url" name="project_github_${index}" value="${escapeHtml(project.github)}" placeholder="https://github.com/username/repo"></div>
              <div class="form-group"><label>Live website link</label><input form="save-all-form" type="url" name="project_live_${index}" value="${escapeHtml(project.live)}" placeholder="https://your-site.netlify.app"></div>
            </div>
          </div>
          <a href="#delete-project-${index}" class="btn btn-danger btn-small" data-delete="projects" data-index="${index}"><i class="fas fa-trash"></i></a>
        </div>`).join('');
    }
    if (socials) {
      socials.innerHTML = (data.social_links || []).map((social, index) => `
        <div class="social-item item-edit">
          <div class="item-edit-grid">
            <div class="form-group"><label>Platform</label><input form="save-all-form" type="text" name="social_platform_${index}" value="${escapeHtml(social.platform)}" required></div>
            <div class="form-group"><label>URL</label><input form="save-all-form" type="text" name="social_url_${index}" value="${escapeHtml(social.url)}" required></div>
            <div class="form-group"><label>Icon</label><input form="save-all-form" type="text" name="social_icon_${index}" value="${escapeHtml(social.icon)}"></div>
          </div>
          <a href="#delete-social-${index}" class="btn btn-danger btn-small" data-delete="social_links" data-index="${index}"><i class="fas fa-trash"></i></a>
        </div>`).join('');
    }
  }

  function fillPersonal(data) {
    const info = data.personal_info || {};
    const set = (id, val) => {
      const field = document.getElementById(id);
      if (field) field.value = val || '';
    };
    set('name', info.name);
    set('title', info.title);
    set('about', info.about);
    set('profile_image', info.profile_image);
    set('location', info.location);
    set('email', info.email);
    set('phone', info.phone);
    set('languages', info.languages);
    set('resume_url', info.resume && !String(info.resume).startsWith('/static/resumes/') ? info.resume : '');
  }

  async function saveData(data, message = 'All changes saved successfully!') {
    const saved = await request('data', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data }),
    });
    window.__portfolioData = saved.data || data;
    fillPersonal(window.__portfolioData);
    renderLists(window.__portfolioData);
    showAlert(message, 'success');
  }

  async function setupLogin() {
    const form = document.querySelector('.admin-login-form');
    if (!form) return;
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const username = document.getElementById('username')?.value || '';
      const password = document.getElementById('password')?.value || '';
      try {
        await request('login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });
        window.location.href = '/admin.html';
      } catch (error) {
        showAlert(error.message || 'Invalid username or password.', 'error');
      }
    });
  }

  async function setupAdmin() {
    if (!document.querySelector('.admin-container')) return;
    try {
      await request('session');
    } catch {
      window.location.href = '/admin-login.html';
      return;
    }

    try {
      const payload = await request('data');
      if (payload.data) {
        window.__portfolioData = payload.data;
        fillPersonal(payload.data);
        renderLists(payload.data);
      } else {
        window.__portfolioData = await collectCurrentData();
      }
    } catch {
      window.__portfolioData = await collectCurrentData();
    }

    const saveForm = document.getElementById('save-all-form');
    if (saveForm) {
      saveForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        try {
          await saveData(await collectCurrentData());
        } catch (error) {
          showAlert(error.message, 'error');
        }
      });
    }

    document.addEventListener('submit', async (event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement) || form.id === 'save-all-form') return;
      event.preventDefault();
      const data = await collectCurrentData();
      const action = form.getAttribute('action') || '';
      try {
        if (action.includes('add_skill')) {
          data.skills.push({
            name: form.skill_name.value.trim(),
            level: Number(form.skill_level.value) || 50,
            category: form.skill_category.value.trim() || 'Other',
          });
          form.reset();
          await saveData(data, 'Skill added successfully!');
        } else if (action.includes('add_education')) {
          data.education.push({
            degree: form.education_degree.value.trim(),
            institution: form.education_institution.value.trim(),
            period: form.education_period.value.trim(),
            description: form.education_description.value.trim(),
          });
          form.reset();
          await saveData(data, 'Education entry added successfully!');
        } else if (action.includes('add_internship')) {
          data.internships = data.internships || [];
          data.internships.push({
            title: form.internship_title.value.trim(),
            period: form.internship_period.value.trim(),
            bullets: form.internship_bullets.value.split('\n').map((line) => line.trim()).filter(Boolean),
          });
          form.reset();
          await saveData(data, 'Internship added successfully!');
        } else if (action.includes('add_project')) {
          const uploaded = await fileToDataUrl(form.project_image_file);
          data.projects.push({
            title: form.project_title.value.trim(),
            description: form.project_description.value.trim(),
            image: uploaded || form.project_image.value.trim(),
            technologies: form.project_technologies.value.split(',').map((item) => item.trim()).filter(Boolean),
            github: form.project_github.value.trim(),
            live: form.project_live.value.trim(),
          });
          form.reset();
          await saveData(data, 'Project added successfully!');
        } else if (action.includes('add_social')) {
          data.social_links.push({
            platform: form.social_platform.value.trim(),
            url: form.social_url.value.trim(),
            icon: form.social_icon.value.trim() || 'fas fa-link',
          });
          form.reset();
          await saveData(data, 'Social link added successfully!');
        } else if (action.includes('upload_resume')) {
          const resumeUrl = (form.resume_url?.value || '').trim();
          if (!resumeUrl) {
            showAlert('On the live site, paste a public resume URL.', 'error');
            return;
          }
          data.personal_info.resume = resumeUrl;
          await saveData(data, 'Resume link saved.');
        } else if (action.includes('delete_resume')) {
          data.personal_info.resume = '';
          await saveData(data, 'Resume removed from the site.');
        }
      } catch (error) {
        showAlert(error.message, 'error');
      }
    });

    document.addEventListener('click', async (event) => {
      const link = event.target.closest('[data-delete], a[href*="delete_"]');
      if (!link || link.id === 'admin-logout-link') return;
      event.preventDefault();
      if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) return;
      const data = await collectCurrentData();
      const kind = link.getAttribute('data-delete');
      const index = Number(link.getAttribute('data-index'));
      if (kind && Number.isInteger(index)) {
        data[kind].splice(index, 1);
        try {
          await saveData(data, 'Item deleted successfully!');
        } catch (error) {
          showAlert(error.message, 'error');
        }
        return;
      }
      const href = link.getAttribute('href') || '';
      const match = href.match(/delete_(skill|education|internship|project|social)\/(\d+)/);
      if (!match) return;
      const map = { skill: 'skills', education: 'education', internship: 'internships', project: 'projects', social: 'social_links' };
      data[map[match[1]]].splice(Number(match[2]), 1);
      try {
        await saveData(data, 'Item deleted successfully!');
      } catch (error) {
        showAlert(error.message, 'error');
      }
    });

    const logout = document.getElementById('admin-logout-link');
    if (logout) {
      logout.addEventListener('click', async (event) => {
        event.preventDefault();
        await request('logout', { method: 'POST' });
        window.location.href = '/admin-login.html';
      });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    setupLogin();
    setupAdmin();
  });
})();
