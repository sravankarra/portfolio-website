(() => {
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

  function pad(index) {
    return String(index).padStart(2, '0');
  }

  function hydrate(data) {
    const info = data.personal_info || {};
    const name = info.name || 'Sravan Karra';
    const first = name.split(' ')[0];
    const email = contactEmail(data);
    const mail = contactHref(email, name);
    const resume = (info.resume || '').trim();
    const resumeDownloadHref = '/resume/download';
    const brand = name.replace(/ /g, '');
    const aboutParas = (info.about || '').replace(/\r\n/g, '\n').split('\n').filter((para) => para.trim());
    const hire = linkedinUrl(data);
    const projects = data.projects || [];
    const total = projects.length + 1;

    const photo = document.querySelector('.hero-cutout');
    if (photo && info.profile_image) photo.src = info.profile_image;
    const brandEl = document.querySelector('.brand');
    if (brandEl) brandEl.innerHTML = `<span>&lt;/&gt;</span> ${escapeHtml(brand)}`;

    const heroName = document.querySelector('.hero-name');
    if (heroName) heroName.innerHTML = name.split(/\s+/).map(escapeHtml).join('<br>');
    const heroSub = document.querySelector('.hero-sub');
    if (heroSub) heroSub.textContent = info.title || '';
    const heroBio = document.querySelector('.hero-bio');
    if (heroBio) heroBio.textContent = aboutParas[0] || '';

    const intro = document.querySelector('.section-intro');
    if (intro) {
      const link = intro.querySelector('.text-link');
      intro.querySelectorAll('p:not(.eyebrow)').forEach((node) => node.remove());
      aboutParas.forEach((para) => {
        const p = document.createElement('p');
        p.textContent = para;
        intro.insertBefore(p, link);
      });
    }

    const stats = document.querySelector('.stats-grid');
    if (stats) {
      const education = (data.education || [])[0];
      stats.innerHTML = `
        ${info.title ? `<div class="stat"><strong>Profile</strong><span>${escapeHtml(info.title)}</span></div>` : ''}
        <div class="stat"><strong>${projects.length}</strong><span>${projects.length === 1 ? 'Personal Project' : 'Projects'}</span></div>
        ${education ? `<div class="stat"><strong>${escapeHtml(education.period)}</strong><span>${escapeHtml(education.degree)}</span></div>` : ''}
        ${info.location ? `<div class="stat"><strong>${escapeHtml(info.location)}</strong><span>Based in</span></div>` : ''}
      `;
    }

    const skillsGrid = document.querySelector('.skills-grid');
    if (skillsGrid) {
      const groups = [
        { title: 'Frontend', items: [] },
        { title: 'Backend', items: [] },
        { title: 'Tools & Others', items: [] },
      ];
      (data.skills || []).forEach((skill) => {
        const key = String(skill.category || '').toLowerCase();
        if (key.includes('web') || key.includes('front')) groups[0].items.push(skill);
        else if (key.includes('program') || key.includes('back') || key.includes('language')) groups[1].items.push(skill);
        else groups[2].items.push(skill);
      });
      skillsGrid.innerHTML = groups.filter((group) => group.items.length).map((group) => `
        <article class="skill-card">
          <h3>${escapeHtml(group.title)}</h3>
          ${group.items.map((skill) => `
            <div class="skill-row"><div class="skill-label"><span>${escapeHtml(skill.name)}</span><b>${escapeHtml(skill.level)}%</b></div><div class="skill-bar"><span class="skill-progress" style="--level: ${Number(skill.level) || 0}%"></span></div></div>
          `).join('')}
        </article>
      `).join('');
      window.initSkillCards?.();
    }

    const educationNav = document.querySelector('.nav-menu a[href="#education"]');
    let educationSection = document.getElementById('education');
    if ((data.education || []).length) {
      if (!educationSection) {
        educationSection = document.createElement('section');
        educationSection.id = 'education';
        educationSection.className = 'section padding-top-bottom background-dark z-bigger-2';
        const work = document.getElementById('projects');
        if (work) work.before(educationSection);
        else document.getElementById('skills')?.after(educationSection);
      } else {
        const work = document.getElementById('projects');
        const skills = document.getElementById('skills');
        if (work && educationSection.nextElementSibling !== work) work.before(educationSection);
        else if (!work && skills && educationSection.previousElementSibling !== skills) skills.after(educationSection);
      }
      educationSection.innerHTML = `
        <div class="content-wrap">
          <div class="section-heading"><p class="eyebrow">education</p><h2>My academic journey</h2></div>
          <div class="education-grid">
            ${(data.education || []).map((item) => `
              <article class="education-card">
                <span class="education-period">${escapeHtml(item.period)}</span>
                <h3>${escapeHtml(item.degree)}</h3>
                <strong>${escapeHtml(item.institution)}</strong>
                ${item.description ? `<p>${escapeHtml(item.description)}</p>` : ''}
              </article>
            `).join('')}
          </div>
        </div>`;
      if (!educationNav) {
        const skillsLink = document.querySelector('.nav-menu a[href="#skills"]');
        const link = document.createElement('a');
        link.className = 'nav-link hover-target';
        link.href = '#education';
        link.textContent = 'Education';
        skillsLink?.after(link);
        window.initNavOutline?.();
      }
    } else if (educationSection) {
      educationSection.remove();
      educationNav?.remove();
    }

    const names = document.querySelector('.case-study-wrapper');
    const images = document.querySelector('.case-study-images');
    if (names && images) {
      const cases = [{
        name: first.toLowerCase(),
        href: '#home',
        image: '<div class="depth-panel"><span>atmosphere</span><strong>build in depth</strong></div>',
        title: info.title || 'developer',
        scene: true,
      }];
      projects.forEach((project) => {
        const live = (project.live || '').trim();
        const github = (project.github || '').trim();
        const href = live || github || '#';
        const previewInner = project.image
          ? `<img src="${escapeHtml(project.image)}" alt="${escapeHtml(project.title)} preview">`
          : `<div class="project-showcase-mock"><span>featured work</span><strong>${escapeHtml(project.title)}</strong><p>${escapeHtml((project.technologies || []).join(' · ') || project.description || '')}</p></div>`;
        const linkedPreview = live
          ? `<a class="project-card-link hover-target" href="${escapeHtml(live)}"${live.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}>${previewInner}</a>`
          : previewInner;
        const actions = (live || github)
          ? `<div class="work-card-actions">${live ? `<a class="work-action hover-target" href="${escapeHtml(live)}"${live.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}><i class="fas fa-up-right-from-square"></i> Live</a>` : ''}${github ? `<a class="work-action hover-target" href="${escapeHtml(github)}" target="_blank" rel="noopener"><i class="fab fa-github"></i> GitHub</a>` : ''}</div>`
          : '';
        cases.push({
          name: (project.title || 'work').split(' ')[0].toLowerCase(),
          href,
          external: href.startsWith('http'),
          image: `${linkedPreview}${actions}`,
          title: (project.technologies || []).join(', ') || project.description || '',
        });
      });
      names.innerHTML = cases.map((item, index) => `
        <li class="case-study-name${index === 0 ? ' active' : ''}">
          <a href="${escapeHtml(item.href)}" class="hover-target"${item.external ? ' target="_blank" rel="noopener"' : ''}>${escapeHtml(item.name)}</a>
        </li>
      `).join('');
      images.innerHTML = cases.map((item, index) => `
        <li${index === 0 ? ' class="show"' : ''}>
          <div class="img-hero-background${item.scene ? ' is-scene' : ''}">${item.image}</div>
          <div class="hero-number-back">${pad(index + 1)}</div>
          <div class="hero-number">${pad(index + 1)}</div>
          <div class="hero-number-fixed">${pad(total || 1)}</div>
          <div class="case-study-title">${escapeHtml(item.title)}</div>
        </li>
      `).join('');
      window.alignWorkSideText?.();
    }

    const hireBtn = document.querySelector('.hire-button');
    if (hireBtn) hireBtn.href = hire;

    const talk = document.querySelector('.project-link-wrap');
    if (talk) {
      talk.href = email ? mail : hire;
    }

    const contactName = document.querySelector('.contact-name');
    const contactRole = document.querySelector('.contact-role');
    if (contactName) contactName.textContent = name;
    if (contactRole) contactRole.textContent = [info.location, info.title].filter(Boolean).join(' · ');

    const socialLinks = document.querySelector('.social-links');
    if (socialLinks) {
      socialLinks.innerHTML = (data.social_links || []).map((social) => {
        const isMail = (social.platform || '').toLowerCase().includes('mail') || (social.url || '').startsWith('mailto:');
        const href = isMail ? mail : social.url;
        return `<a class="hover-target" href="${escapeHtml(href)}" target="_blank" rel="noopener" aria-label="${escapeHtml(social.platform)}"><i class="${escapeHtml(social.icon)}"></i></a>`;
      }).join('');
    }

    const meta = document.querySelector('.contact-meta');
    if (meta) {
      meta.querySelectorAll('.email-link, .text-link').forEach((node) => node.remove());
      if (email) {
        const link = document.createElement('a');
        link.className = 'email-link hover-target';
        link.href = mail;
        link.target = '_blank';
        link.rel = 'noopener';
        link.textContent = email;
        meta.appendChild(link);
      }
      if (info.phone) {
        const phone = document.createElement('a');
        phone.className = 'email-link hover-target';
        phone.href = `tel:${info.phone}`;
        phone.textContent = info.phone;
        meta.appendChild(phone);
      }
      if (resume) {
        const download = document.createElement('a');
        download.className = 'text-link hover-target';
        download.href = resumeDownloadHref;
        download.textContent = 'Download resume';
        meta.appendChild(download);
      }
    }

    const footer = document.querySelector('footer span');
    if (footer) footer.textContent = `© 2026 ${name}`;
  }

  fetch('/api/portfolio', { credentials: 'same-origin' })
    .then((response) => (response.status === 200 ? response.json() : null))
    .then((data) => { if (data) hydrate(data); })
    .catch(() => {});
})();
