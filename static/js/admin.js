// Admin Panel JavaScript

// Auto-resize textareas
document.addEventListener('DOMContentLoaded', () => {
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach(textarea => {
        textarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = this.scrollHeight + 'px';
        });
    });
});

// Form validation and enhancement
document.addEventListener('DOMContentLoaded', () => {
    const forms = document.querySelectorAll('.admin-form');
    
    forms.forEach(form => {
        // Add form validation
        form.addEventListener('submit', (e) => {
            const requiredFields = form.querySelectorAll('[required]');
            let isValid = true;
            
            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    field.style.borderColor = '#dc3545';
                    isValid = false;
                } else {
                    field.style.borderColor = '#e9ecef';
                }
            });
            
            if (!isValid) {
                e.preventDefault();
                showAlert('Please fill in all required fields.', 'error');
            }
        });
        
        // Real-time validation feedback
        const inputs = form.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                if (input.hasAttribute('required') && !input.value.trim()) {
                    input.style.borderColor = '#dc3545';
                } else {
                    input.style.borderColor = '#e9ecef';
                }
            });
            
            input.addEventListener('input', () => {
                if (input.style.borderColor === 'rgb(220, 53, 69)') {
                    input.style.borderColor = '#e9ecef';
                }
            });
        });
    });
});

// Enhanced delete confirmations
document.addEventListener('DOMContentLoaded', () => {
    const deleteButtons = document.querySelectorAll('.btn-danger');
    
    deleteButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const itemType = getItemType(button);
            const confirmed = confirm(`Are you sure you want to delete this ${itemType}? This action cannot be undone.`);
            
            if (!confirmed) {
                e.preventDefault();
            }
        });
    });
});

// Helper function to determine item type
function getItemType(button) {
    if (button.closest('.skills-list')) return 'skill';
    if (button.closest('.projects-list')) return 'project';
    if (button.closest('.social-list')) return 'social link';
    return 'item';
}

// Show custom alerts
function showAlert(message, type = 'success') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.innerHTML = `
        ${message}
        <button class="close-btn" onclick="this.parentElement.remove()">&times;</button>
    `;
    
    const container = document.querySelector('.admin-container');
    const header = document.querySelector('.admin-header');
    container.insertBefore(alertDiv, header.nextSibling);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentElement) {
            alertDiv.remove();
        }
    }, 5000);
}

// Enhanced form interactions
document.addEventListener('DOMContentLoaded', () => {
    // Add character counter for textareas
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach(textarea => {
        const counter = document.createElement('div');
        counter.className = 'char-counter';
        counter.style.fontSize = '0.8rem';
        counter.style.color = '#666';
        counter.style.textAlign = 'right';
        counter.style.marginTop = '0.5rem';
        
        textarea.parentNode.appendChild(counter);
        
        const updateCounter = () => {
            const remaining = textarea.maxLength - textarea.value.length;
            counter.textContent = `${textarea.value.length} characters`;
        };
        
        textarea.addEventListener('input', updateCounter);
        updateCounter();
    });
    
    // Add URL validation for project and social links
    const urlInputs = document.querySelectorAll('input[type="url"]');
    urlInputs.forEach(input => {
        input.addEventListener('blur', () => {
            if (input.value && !isValidUrl(input.value)) {
                input.style.borderColor = '#dc3545';
                showAlert('Please enter a valid URL (e.g., https://example.com)', 'error');
            }
        });
    });
});

// URL validation helper
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// Enhanced mobile experience
document.addEventListener('DOMContentLoaded', () => {
    // Add touch support for mobile
    if ('ontouchstart' in window) {
        const touchElements = document.querySelectorAll('.skill-item, .project-item, .social-item');
        touchElements.forEach(element => {
            element.style.cursor = 'pointer';
            element.addEventListener('touchstart', () => {
                element.style.transform = 'scale(0.98)';
            });
            element.addEventListener('touchend', () => {
                element.style.transform = 'scale(1)';
            });
        });
    }
}); 