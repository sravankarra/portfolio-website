// Mobile Navigation Toggle
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Close mobile menu when clicking on a link
document.querySelectorAll('.nav-link').forEach(n => n.addEventListener('click', () => {
    hamburger.classList.remove('active');
    navMenu.classList.remove('active');
}));

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Animate skill bars on scroll
const observerOptions = {
    threshold: 0.5,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const skillBars = entry.target.querySelectorAll('.skill-progress');
            skillBars.forEach(bar => {
                const width = bar.style.width;
                bar.style.width = '0%';
                setTimeout(() => {
                    bar.style.width = width;
                }, 200);
            });
        }
    });
}, observerOptions);

// Observe skills section
const skillsSection = document.querySelector('.skills');
if (skillsSection) {
    observer.observe(skillsSection);
}

// Initialize tooltips for project technologies
document.addEventListener('DOMContentLoaded', () => {
    const techTags = document.querySelectorAll('.tech-tag');
    techTags.forEach(tag => {
        tag.title = tag.textContent;
    });

    document.querySelectorAll('[data-live-url]').forEach((el) => {
        const live = el.getAttribute('data-live-url') || '';
        if (live === '/' || live === '') {
            el.textContent = window.location.origin;
            if (el.tagName === 'A') {
                el.href = window.location.origin + '/';
            }
        } else if (live.startsWith('/') && !live.startsWith('//')) {
            el.textContent = window.location.origin + live;
        }
    });

    const sizeProjectPreviews = () => {
        document.querySelectorAll('.project-preview-screen').forEach((screen) => {
            const iframe = screen.querySelector('iframe');
            if (!iframe) {
                return;
            }
            const scale = screen.clientWidth / 1280;
            iframe.style.transform = `scale(${scale})`;
        });
    };
    sizeProjectPreviews();
    window.addEventListener('resize', sizeProjectPreviews);
});

 