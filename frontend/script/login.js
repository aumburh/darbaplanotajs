/*
Author: Rainers
Last Modified By: Rainers
Last Modified: 2025-06-10
*/

document.addEventListener('DOMContentLoaded', function() {
    // Create and manage popup notifications
    function showPopup(message, type = 'error') {
        const popupContainer = document.createElement('div');
        popupContainer.className = 'fixed left-1/2 transform -translate-x-1/2 w-80 max-w-[90%] z-50';
        
        const popup = document.createElement('div');
        popup.className = `p-4 rounded-lg shadow-lg text-white ${
            type === 'error' ? 'bg-red-500' : 'bg-green-500'
        } transform transition-all duration-300 opacity-0 translate-y-[-20px]`;
        popup.innerHTML = `
            <div class="flex items-center justify-between">
                <span>${message}</span>
                <button class="ml-2 text-white hover:text-gray-200" onclick="this.parentElement.parentElement.remove(); adjustPopupPositions();">
                    <svg class="w-5 h-5" fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>
        `;
        
        popupContainer.appendChild(popup);
        document.body.appendChild(popupContainer);
        
        // Function to adjust positions of all popups
        function adjustPopupPositions() {
            const popups = document.querySelectorAll('.fixed.left-1\\/2');
            let topOffset = 20; // Initial offset from top
            popups.forEach(p => {
                p.style.top = `${topOffset}px`;
                topOffset += p.offsetHeight + 8; // 8px margin between popups
            });
        }
        
        // Trigger slide-in animation and position adjustment
        setTimeout(() => {
            adjustPopupPositions();
            popup.classList.remove('opacity-0', 'translate-y-[-20px]');
            popup.classList.add('opacity-100', 'translate-y-0');
        }, 50);
        
        // Auto-dismiss with slide-down and fade-out
        setTimeout(() => {
            popup.classList.remove('opacity-100', 'translate-y-0');
            popup.classList.add('opacity-0', 'translate-y-[20px]');
            setTimeout(() => {
                popupContainer.remove();
                adjustPopupPositions();
            }, 300);
        }, 3000);
    }

    // Toggle between login and register forms
    function showLogin() {
        const loginContainer = document.getElementById("login-form");
        const registerContainer = document.getElementById("register-form");
        
        if (loginContainer && registerContainer) {
            loginContainer.classList.remove('hidden');
            registerContainer.classList.add('hidden');
        } else {
            console.error('Login or register container not found');
        }
    }

    function showRegister() {
        const loginContainer = document.getElementById("login-form");
        const registerContainer = document.getElementById("register-form");
        
        if (loginContainer && registerContainer) {
            loginContainer.classList.add('hidden');
            registerContainer.classList.remove('hidden');
        } else {
            console.error('Login or register container not found');
        }
    }

    // Event listeners for form toggle
    const toRegister = document.getElementById("to-register");
    const toLogin = document.getElementById("to-login");
    
    if (toRegister) {
        toRegister.addEventListener('click', e => {
            e.preventDefault();
            console.log('Register link clicked');
            showRegister();
        });
    } else {
        console.error('Element with ID "to-register" not found');
    }
    
    if (toLogin) {
        toLogin.addEventListener('click', e => {
            e.preventDefault();
            console.log('Login link clicked');
            showLogin();
        });
    } else {
        console.error('Element with ID "to-login" not found');
    }

    // Password toggle functionality
    function setupPasswordToggle(inputId, toggleId) {
        const passwordInput = document.getElementById(inputId);
        const toggle = document.getElementById(toggleId);
        if (passwordInput && toggle) {
            toggle.addEventListener('click', function() {
                const isPassword = passwordInput.type === 'password';
                passwordInput.type = isPassword ? 'text' : 'password';
                toggle.classList.toggle('fa-eye', !isPassword);
                toggle.classList.toggle('fa-eye-slash', isPassword);
            });
        }
    }

    setupPasswordToggle('login-password', 'toggle-login-password');
    setupPasswordToggle('reg-password', 'toggle-reg-password');
    setupPasswordToggle('reg-password2', 'toggle-reg-password2');

    // Form validation helpers
    function showError(inputId, message) {
        const input = document.getElementById(inputId);
        if (input) {
            input.classList.add('input-error');
            showPopup(message, 'error');
        }
    }

    function clearError(inputId) {
        const input = document.getElementById(inputId);
        if (input) {
            input.classList.remove('input-error');
        }
    }

    // Password strength validation
    const regPassword = document.getElementById('reg-password');
    if (regPassword) {
        regPassword.addEventListener('input', function() {
            const password = this.value;
            const requirements = {
                length: password.length >= 8,
                uppercase: /[A-Z]/.test(password),
                number: /\d/.test(password)
            };

            Object.keys(requirements).forEach(req => {
                const element = document.querySelector(`.password-requirement[data-requirement="${req}"]`);
                if (element) {
                    element.classList.toggle('text-green-300', requirements[req]);
                    element.classList.toggle('text-gray-400', !requirements[req]);
                }
            });
        });
    }

    // Login form submission
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            clearError('login-identifier');
            clearError('login-password');

            const identifier = document.getElementById('login-identifier').value.trim();
            const password = document.getElementById('login-password').value.trim();
            let isValid = true;

            if (!identifier) {
                showError('login-identifier', 'Lūdzu ievadiet e-pastu vai lietotājvārdu');
                isValid = false;
            }
            if (!password) {
                showError('login-password', 'Lūdzu ievadiet paroli');
                isValid = false;
            }

            if (!isValid) return;

            try {
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ identifier, password })
                });
                const data = await res.json();
                if (res.ok && data.token) {
                    localStorage.setItem('token', data.token);
                    window.location.href = '/';
                } else {
                    showPopup('Nepareizs e-pasts/lietotājvārds vai parole', 'error');
                }
            } catch (err) {
                showError('login-container', 'Servera kļūda');
            }
        });
    }

    // Register form submission
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            clearError('reg-email');
            clearError('reg-username');
            clearError('reg-password');
            clearError('reg-password2');
            clearError('terms');

            const email = document.getElementById('reg-email').value.trim();
            const username = document.getElementById('reg-username').value.trim();
            const password = document.getElementById('reg-password').value;
            const password2 = document.getElementById('reg-password2').value;
            const terms = document.getElementById('terms');
            let isValid = true;

            // Validate password strength requirements
            const passwordStrength = {
                length: email.length >= 8,
                uppercase: /[A-Z]/.test(password),
                number: /\d/.test(password)
            };

            if (!passwordStrength.length) {
                showError('reg-password', 'Parolei jābūt vismaz 8 rakstzīmēm');
                isValid = false;
            }
            if (!passwordStrength.uppercase) {
                showError('reg-password', 'Parolei jābūt vismaz vienam lielajam burtam');
                isValid = false;
            }
            if (!passwordStrength.number) {
                showError('reg-password', 'Parolei jābūt vismaz vienam ciparam');
                isValid = false;
            }

            if (!email) {
                showError('reg-email', 'Lūdzu ievadiet e-pastu');
                isValid = false;
            } else if (!/^\S+@\S+\.\S+$/.test(email)) {
                showError('reg-email', 'Lūdzu ievadiet derīgu e-pastu');
                isValid = false;
            }

            if (!username) {
                showError('reg-username', 'Lūdzu ievadiet lietotājvārdu');
                isValid = false;
            } else if (username.length < 3) {
                showError('reg-username', 'Lietotājvārdam jābūt vismaz 3 rakstzīmēm');
                isValid = false;
            }

            if (!password) {
                showError('reg-password', 'Lūdzu ievadiet paroli');
                isValid = false;
            }

            if (password !== password2) {
                showError('reg-password2', 'Paroles nesakrīt');
                isValid = false;
            }

            if (!terms?.checked) {
                showError('terms', 'Lūdzu piekrītiet lietošanas noteikumiem');
                isValid = false;
            }

            if (!isValid) return;

            try {
                const res = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, username, password })
                });
                const data = await res.json();
                if (res.ok) {
                    showPopup('Reģistrācija veiksmīga! Tagad pieslēdzieties.', 'success');
                    showLogin();
                } else {
                    showPopup(data.message || 'Reģistrācija neizdevās', 'error');
                }
            } catch {
                showPopup('Servera kļūda', 'error');
            }
        });
    }

    // Initialize with login form
    showLogin();
});