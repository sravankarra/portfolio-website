(() => {
  const TECH = [
    ['html', 'fab fa-html5', 'html'],
    ['css', 'fab fa-css3-alt', 'css'],
    ['javascript', 'fab fa-js-square', 'js'],
    ['python', 'fab fa-python', 'py'],
    ['java', 'fab fa-java', 'js'],
    ['git', 'fab fa-git-alt', 'git'],
    ['github', 'fab fa-github', 'git'],
  ];

  const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  function normalizeEmail(value) {
    let email = (value || '').trim();
    if (email.toLowerCase().startsWith('mailto:')) email = email.slice(7).trim();
    email = email.split('?')[0].trim();
    if (!email.includes('@') || email.includes(' ')) return '';
    return email;
  }

  function contactEmail(data) {
    const personal = normalizeEmail((data.personal_info || {}).email);
    for (const social of data.social_links || []) {
      const platform = (social.platform || '').toLowerCase();
      const url = social.url || '';
      if (platform.includes('mail') || url.startsWith('mailto:') || url.includes('@')) {
        const email = normalizeEmail(url);
        if (email) return email;
      }
    }
    return personal;
  }

  function contactHref(email, name) {
    if (!email) return '#contact';
    const first = (name || 'there').split(' ')[0];
    const subject = encodeURIComponent(`Hello ${first}`);
    if (email.toLowerCase().endsWith('@gmail.com')) {
      return `https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=${encodeURIComponent(email)}&su=${subject}`;
    }
    return `mailto:${email}?subject=${subject}`;
  }

  function linkedinUrl(data) {
    for (const social of data.social_links || []) {
      const platform = (social.platform || '').toLowerCase();
      const url = (social.url || '').trim();
      if (url && (platform.includes('linkedin') || url.toLowerCase().includes('linkedin.com'))) {
        return url;
      }
    }
    return 'https://www.linkedin.com/in/karrasravan';
  }

  function techIcons(skills) {
    const names = (skills || []).map((skill) => (skill.name || '').toLowerCase());
    const icons = [];
    const used = new Set();
    for (const [key, icon, css] of TECH) {
      if (used.has(key)) continue;
      if (names.some((name) => name === key || name.split(' ').includes(key))) {
        icons.push({ icon, css });
        used.add(key);
      }
    }
    return icons.slice(0, 6);
  }

  function hydrate(data) {
    const info = data.personal_info || {};
    const name = info.name || 'Sravan Karra';
    const first = name.split(' ')[0];
    const email = contactEmail(data);
    const mail = contactHref(email, name);
    const resume = (info.resume || '').trim();
    const resumeHref = resume || '/resume';
    const brand = name.replace(/ /g, '');
    const aboutParas = (info.about || '').replace(/\r\n/g, '\n').split('\n').filter((para) => para.trim());
    const hire = linkedinUrl(data);

    document.title = `${name} | Portfolio`;
    const brandEl = document.querySelector('.brand');
    if (brandEl) brandEl.innerHTML = `<span>&lt;/&gt;</span> ${escapeHtml(brand)}`;

    const heroTitle = document.querySelector('.hero h1');
    if (heroTitle) heroTitle.innerHTML = `Hi, I'm <strong>${escapeHtml(first)}</strong>`;
    const heroRole = document.querySelector('.hero h2');
    if (heroRole) heroRole.textContent = info.title || '';
    const heroDesc = document.querySelector('.hero-description');
    if (heroDesc) heroDesc.textContent = aboutParas[0] || '';

    const actions = document.querySelector('.hero-actions');
    if (actions) {
      actions.innerHTML = `
        <a class="button button-primary" href="#projects">View My Work <i class="fas fa-arrow-right"></i></a>
        ${resume ? `<a class="button button-outline" href="${escapeHtml(resumeHref)}" target="_blank" rel="noopener">Download Resume <i class="fas fa-download"></i></a>` : ''}
        ${email ? `<a class="button button-outline" href="${escapeHtml(mail)}" target="_blank" rel="noopener">Contact Me <i class="fas fa-envelope"></i></a>` : ''}
      `;
    }

    const icons = techIcons(data.skills);
    const strip = document.querySelector('.tech-strip .tech-icons');
    if (strip) {
      strip.innerHTML = icons.map((item) => `<i class="${item.icon} ${item.css}"></i>`).join('');
    }

    const photo = document.querySelector('.profile-image');
    if (photo && info.profile_image) {
      photo.src = info.profile_image;
      photo.alt = name;
    }

    const codeName = document.querySelector('.code-card em');
    if (codeName) codeName.textContent = `name: '${first}',`;
    const codeSkills = document.querySelector('.code-skills');
    if (codeSkills) {
      codeSkills.textContent = `skills: [${(data.skills || []).map((skill) => `'${skill.name}'`).join(', ')}],`;
    }

    const intro = document.querySelector('.section-intro');
    if (intro) {
      const heading = intro.querySelector('h2');
      const link = intro.querySelector('.text-link');
      intro.querySelectorAll('p').forEach((node) => node.remove());
      aboutParas.forEach((para) => {
        const p = document.createElement('p');
        p.textContent = para;
        intro.insertBefore(p, link);
      });
      if (heading) heading.innerHTML = 'Passionate about<br><strong>creating digital solutions</strong>';
    }

    const stats = document.querySelector('.stats-grid');
    if (stats) {
      const education = (data.education || [])[0];
      const projectCount = (data.projects || []).length;
      stats.innerHTML = `
        ${info.title ? `<div class="stat"><i class="fas fa-seedling"></i><div><strong>Profile</strong><span>${escapeHtml(info.title)}</span></div></div>` : ''}
        <div class="stat"><i class="fas fa-code"></i><div><strong>${projectCount}</strong><span>${projectCount === 1 ? 'Personal Project' : 'Projects'}</span></div></div>
        ${education ? `<div class="stat"><i class="fas fa-graduation-cap"></i><div><strong>${escapeHtml(education.period)}</strong><span>${escapeHtml(education.degree)}</span></div></div>` : ''}
        ${info.location ? `<div class="stat"><i class="fas fa-book-open"></i><div><strong>${escapeHtml(info.location)}</strong><span>Based in</span></div></div>` : ''}
      `;
    }

    const skillsGrid = document.querySelector('.skills-grid');
    if (skillsGrid) {
      skillsGrid.innerHTML = (data.skills || []).map((skill) => `
        <div class="skill-row"><div class="skill-label"><span>${escapeHtml(skill.name)}</span><b>${escapeHtml(skill.level)}%</b></div><div class="skill-bar"><span class="skill-progress" style="width: ${Number(skill.level) || 0}%"></span></div></div>
      `).join('');
    }

    const educationNav = document.querySelector('.nav-menu a[href="#education"]');
    let educationSection = document.getElementById('education');
    if ((data.education || []).length) {
      if (!educationSection) {
        educationSection = document.createElement('section');
        educationSection.id = 'education';
        educationSection.className = 'education section-shell section-band';
        document.getElementById('skills')?.after(educationSection);
      }
      educationSection.innerHTML = `
        <div class="section-heading"><span class="eyebrow">EDUCATION</span><h2>My Academic Journey</h2></div>
        <div class="education-grid">
          ${(data.education || []).map((item) => `
            <article class="education-card">
              <span class="education-period">${escapeHtml(item.period)}</span>
              <h3>${escapeHtml(item.degree)}</h3>
              <strong>${escapeHtml(item.institution)}</strong>
              ${item.description ? `<p>${escapeHtml(item.description)}</p>` : ''}
            </article>
          `).join('')}
        </div>`;
      if (!educationNav) {
        const skillsLink = document.querySelector('.nav-menu a[href="#skills"]');
        const item = document.createElement('li');
        item.innerHTML = '<a class="nav-link" href="#education">Education</a>';
        skillsLink?.parentElement?.after(item);
      }
    } else if (educationSection) {
      educationSection.remove();
      educationNav?.parentElement?.remove();
    }

    const projectsGrid = document.querySelector('.projects-grid');
    if (projectsGrid) {
      projectsGrid.innerHTML = (data.projects || []).map((project, index) => {
        const live = project.live || '';
        const preview = project.image
          ? `<img src="${escapeHtml(project.image)}" alt="${escapeHtml(project.title)} preview" loading="lazy">`
          : '<div class="project-placeholder"><i class="fas fa-laptop-code"></i></div>';
        return `
          <article class="project-card">
            ${live ? `<div class="project-preview">
              <div class="project-preview-bar"><span></span><span></span><span></span>
                <a class="project-preview-url" href="${escapeHtml(live)}" target="_blank" rel="noopener">${escapeHtml(live)}</a>
              </div>
              <div class="project-preview-screen">
                ${preview}
                <a class="project-preview-hit" href="${escapeHtml(live)}" target="_blank" rel="noopener">
                  <span class="project-preview-cta">Open live preview <i class="fas fa-arrow-up-right-from-square"></i></span>
                </a>
              </div>
            </div>` : preview}
            <div class="project-content">
              <div class="project-number">${String(index + 1).padStart(2, '0')}</div>
              <h3>${escapeHtml(project.title)}</h3>
              <p>${escapeHtml(project.description)}</p>
              <div class="project-footer">
                <span>${escapeHtml((project.technologies || []).join(' · '))}</span>
                <div class="project-links">
                  ${live ? `<a href="${escapeHtml(live)}" target="_blank" rel="noopener">Live Preview</a>` : ''}
                  ${project.github ? `<a href="${escapeHtml(project.github)}" target="_blank" rel="noopener">GitHub</a>` : ''}
                </div>
              </div>
            </div>
          </article>`;
      }).join('');
    }

    const hireBtn = document.querySelector('.hire-button');
    if (hireBtn) hireBtn.href = hire;

    const contactActions = document.querySelector('#contact .button-primary')?.parentElement;
    if (contactActions) {
      const heading = contactActions.querySelector('h2');
      const copy = contactActions.querySelector('p');
      contactActions.querySelectorAll('.button').forEach((node) => node.remove());
      if (email) {
        const touch = document.createElement('a');
        touch.className = 'button button-primary';
        touch.href = mail;
        touch.target = '_blank';
        touch.rel = 'noopener';
        touch.innerHTML = 'Get In Touch <i class="fas fa-arrow-right"></i>';
        contactActions.appendChild(touch);
      }
      if (resume) {
        const download = document.createElement('a');
        download.className = 'button button-outline';
        download.href = resumeHref;
        download.target = '_blank';
        download.rel = 'noopener';
        download.innerHTML = 'Download Resume <i class="fas fa-download"></i>';
        contactActions.appendChild(download);
      }
      if (heading) heading.textContent = 'Have a project in mind?';
      if (copy) copy.textContent = "I'm always open to discussing new projects, creative ideas or opportunities to be part of your vision.";
    }

    const cardName = document.querySelector('.contact-card strong');
    const cardMeta = document.querySelector('.contact-card span');
    if (cardName) cardName.textContent = name;
    if (cardMeta) {
      cardMeta.textContent = [info.location, info.title].filter(Boolean).join(' · ');
    }

    const socialLinks = document.querySelector('.social-links');
    if (socialLinks) {
      socialLinks.innerHTML = (data.social_links || []).map((social) => {
        const isMail = (social.platform || '').toLowerCase().includes('mail') || (social.url || '').startsWith('mailto:');
        const href = isMail ? mail : social.url;
        return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener" aria-label="${escapeHtml(social.platform)}"><i class="${escapeHtml(social.icon)}"></i></a>`;
      }).join('');
    }
    const socialArea = document.querySelector('.social-area');
    if (socialArea) {
      socialArea.querySelectorAll('.email-link').forEach((node) => node.remove());
      if (email) {
        const link = document.createElement('a');
        link.className = 'email-link';
        link.href = mail;
        link.target = '_blank';
        link.rel = 'noopener';
        link.textContent = email;
        socialArea.appendChild(link);
      }
      if (info.phone) {
        const phone = document.createElement('a');
        phone.className = 'email-link';
        phone.href = `tel:${info.phone}`;
        phone.textContent = info.phone;
        socialArea.appendChild(phone);
      }
    }

    const footer = document.querySelector('footer span');
    if (footer) footer.textContent = `© 2024 ${name}`;
  }

  fetch('/api/portfolio', { credentials: 'same-origin' })
    .then((response) => (response.status === 200 ? response.json() : null))
    .then((data) => {
      if (data) hydrate(data);
    })
    .catch(() => {});
})();
