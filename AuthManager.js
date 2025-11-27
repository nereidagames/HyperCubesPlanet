import { API_BASE_URL, STORAGE_KEYS } from './Config.js';

export class AuthManager {
    constructor(onLoginSuccess) {
        this.onLoginSuccess = onLoginSuccess; // Funkcja z main.js (startGame)
        this.uiElements = {
            screen: document.getElementById('auth-screen'),
            welcomeView: document.getElementById('welcome-view'),
            loginForm: document.getElementById('login-form'),
            registerForm: document.getElementById('register-form'),
            message: document.getElementById('auth-message')
        };
        
        this.bindEvents();
    }

    // Sprawdza, czy mamy token w pamięci przy starcie
    async checkSession(uiManager) {
        const token = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
        const username = localStorage.getItem(STORAGE_KEYS.PLAYER_NAME);

        if (token && username) {
            try {
                const response = await fetch(`${API_BASE_URL}/api/user/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const data = await response.json();
                    // Jeśli UI jest gotowe, zaktualizuj avatar
                    if (data.thumbnail && uiManager) {
                        uiManager.updatePlayerAvatar(data.thumbnail);
                    }
                    // Sukces - uruchom grę
                    this.onLoginSuccess(data.user, token);
                } else {
                    throw new Error('Token invalid');
                }
            } catch (err) {
                console.warn("Błąd sesji:", err);
                this.showAuthScreen();
            }
        } else {
            this.showAuthScreen();
        }
    }

    showAuthScreen() {
        if (this.uiElements.screen) this.uiElements.screen.style.display = 'flex';
        this.showView(this.uiElements.welcomeView);
    }

    showView(viewToShow) {
        this.uiElements.welcomeView.style.display = 'none';
        this.uiElements.loginForm.style.display = 'none';
        this.uiElements.registerForm.style.display = 'none';
        
        if(viewToShow) viewToShow.style.display = 'flex';
        if(this.uiElements.message) this.uiElements.message.textContent = '';
    }

    bindEvents() {
        const showLoginBtn = document.getElementById('show-login-btn');
        const showRegisterBtn = document.getElementById('show-register-btn');
        const backButtons = document.querySelectorAll('.btn-back');

        if(showLoginBtn) showLoginBtn.onclick = () => this.showView(this.uiElements.loginForm);
        if(showRegisterBtn) showRegisterBtn.onclick = () => this.showView(this.uiElements.registerForm);
        backButtons.forEach(btn => btn.onclick = () => this.showView(this.uiElements.welcomeView));

        if(this.uiElements.registerForm) {
            this.uiElements.registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }
        if(this.uiElements.loginForm) {
            this.uiElements.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.onclick = () => this.logout();
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        this.setMessage('Rejestrowanie...');
        const username = document.getElementById('register-username').value;
        const password = document.getElementById('register-password').value;
        const passwordConfirm = document.getElementById('register-password-confirm').value;

        if (password !== passwordConfirm) {
            this.setMessage('Hasła nie są takie same!');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            if (response.ok) {
                this.setMessage('Rejestracja pomyślna! Zaloguj się.');
                this.showView(this.uiElements.loginForm);
            } else {
                this.setMessage(data.message || 'Błąd rejestracji.');
            }
        } catch (error) {
            this.setMessage('Błąd połączenia z serwerem.');
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        this.setMessage('Logowanie...');
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        try {
            const response = await fetch(`${API_BASE_URL}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            if (response.ok) {
                this.setMessage('Zalogowano pomyślnie!');
                if (this.uiElements.screen) this.uiElements.screen.style.display = 'none';
                
                // Uruchom grę przez callback
                this.onLoginSuccess(data.user, data.token, data.thumbnail);
            } else {
                this.setMessage(data.message || 'Błąd logowania.');
            }
        } catch (error) {
            this.setMessage('Błąd połączenia z serwerem.');
        }
    }

    logout() {
        localStorage.removeItem(STORAGE_KEYS.JWT_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.PLAYER_NAME);
        localStorage.removeItem(STORAGE_KEYS.USER_ID);
        window.location.reload();
    }

    setMessage(msg) {
        if(this.uiElements.message) this.uiElements.message.textContent = msg;
    }
}