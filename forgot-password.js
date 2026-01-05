// JavaScript for Arabic Forgot Password Page

document.addEventListener('DOMContentLoaded', function() {
    // Get form elements
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    
    // Success modal
    const successModal = new bootstrap.Modal(document.getElementById('successModal'));
    const successMessage = document.getElementById('successMessage');

    // Arabic messages
    const messages = {
        buttons: {
            sendingReset: 'جاري الإرسال...',
            sendReset: 'إرسال رابط الاستعادة'
        },
        success: {
            forgotPassword: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى {email}. يرجى التحقق من بريدك الإلكتروني واتباع التعليمات.'
        },
        validation: {
            emailInvalid: 'يرجى إدخال عنوان بريد إلكتروني صحيح',
            fieldRequired: 'هذا الحقل مطلوب'
        }
    };

    // Form validation
    function validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    function validateForm(form) {
        let isValid = true;
        const inputs = form.querySelectorAll('input[required]');
        
        inputs.forEach(input => {
            const value = input.value.trim();
            
            // Remove previous validation classes
            input.classList.remove('is-valid', 'is-invalid');
            
            if (value === '') {
                input.classList.add('is-invalid');
                isValid = false;
            } else if (input.type === 'email' && !validateEmail(value)) {
                input.classList.add('is-invalid');
                isValid = false;
            } else {
                input.classList.add('is-valid');
            }
        });
        
        return isValid;
    }

    function clearValidation(form) {
        const inputs = form.querySelectorAll('input');
        inputs.forEach(input => {
            input.classList.remove('is-valid', 'is-invalid');
        });
    }

    // Form submission handler
    forgotPasswordForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (validateForm(this)) {
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            
            // Show loading state
            submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm ms-2"></span>${messages.buttons.sendingReset}`;
            submitBtn.disabled = true;
            
            // Simulate API call
            setTimeout(() => {
                const email = document.getElementById('forgotEmail').value;
                successMessage.textContent = messages.success.forgotPassword.replace('{email}', email);
                successModal.show();
                
                // Reset button
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                
                // Clear form
                this.reset();
                clearValidation(this);
                
                // Redirect to login page after modal is closed
                successModal._element.addEventListener('hidden.bs.modal', function() {
                    window.location.href = 'login.html';
                }, { once: true });
            }, 2000);
        }
    });

    // Real-time validation for better UX
    const allInputs = document.querySelectorAll('input');
    allInputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (this.value.trim() !== '') {
                if (this.type === 'email' && !validateEmail(this.value)) {
                    this.classList.add('is-invalid');
                    this.classList.remove('is-valid');
                } else {
                    this.classList.add('is-valid');
                    this.classList.remove('is-invalid');
                }
            }
        });
        
        input.addEventListener('input', function() {
            // Remove invalid class when user starts typing
            if (this.classList.contains('is-invalid')) {
                this.classList.remove('is-invalid');
            }
        });
    });

    // RTL-specific enhancements
    const inputs = document.querySelectorAll('input[type="text"], input[type="email"]');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            // Ensure cursor starts at the right position for RTL
            setTimeout(() => {
                if (this.value === '') {
                    this.style.textAlign = 'right';
                }
            }, 10);
        });
        
        input.addEventListener('input', function() {
            // Maintain RTL alignment while typing
            this.style.textAlign = 'right';
        });
    });

    // Handle form auto-fill detection
    function checkAutoFill() {
        const inputs = document.querySelectorAll('input');
        inputs.forEach(input => {
            if (input.value !== '') {
                input.classList.add('is-valid');
            }
        });
    }

    // Check for auto-filled inputs after a short delay
    setTimeout(checkAutoFill, 500);
    
    // Also check when the page becomes visible (user switches tabs)
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            setTimeout(checkAutoFill, 100);
        }
    });
});
