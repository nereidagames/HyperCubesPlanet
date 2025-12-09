import { API_BASE_URL, STORAGE_KEYS } from './Config.js';

export class AuthManager {
    constructor(onLoginSuccess) {
        this.onLoginSuccess = onLoginSuccess; 
    }

    bindEvents() {
        this.uiElements = {
            screen: document.getElementById('auth-screen'),
            welcomeView: document.getElementById('welcome-view'),
            loginForm: document.getElementById('login-form'),
            registerForm: document.getElementById('register-form'),
            message: document.getElementById('auth-message')
        };

        const showLoginBtn = document.getElementById('show-login-btn');
        const showRegisterBtn = document.getElementById('show-register-btn');
        const backButtons = document.querySelectorAll('.btn-back');

        if(showLoginBtn) showLoginBtn.onclick = () => this.showView(this.uiElements.loginForm);
        if(showRegisterBtn) showRegisterBtn.onclick = () => this.showView(this.uiElements.registerForm);
        
        if (backButtons) {
            backButtons.forEach(btn => btn.onclick = () => this.showView(this.uiElements.welcomeView));
        }

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

    // --- FIX: LEPSZA DIAGNOSTYKA SESJI ---
    async checkSession(uiManager) {
        const token = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
        const username = localStorage.getItem(STORAGE_KEYS.PLAYER_NAME);

        if (token && username) {
            try {
                if (!API_BASE_URL) throw new Error("Brak adresu API w Config.js");

                const response = await fetch(`${API_BASE_URL}/api/user/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                // Sprawdzamy czy odpowiedź to JSON
                const contentType = response.headers.get("content-type");
                if (!contentType || !contentType.includes("application/json")) {
                    throw new Error("Serwer zwrócił błąd (HTML zamiast JSON). Sprawdź adres API.");
                }

                if (response.ok) {
                    const data = await response.json();
                    if (data.thumbnail && uiManager) {
                        uiManager.updatePlayerAvatar(data.thumbnail);
                    }
                    this.onLoginSuccess(data.user, token);
                } else {
                    // Token wygasł lub jest nieprawidłowy
                    console.warn("Sesja wygasła.");
                    this.showAuthScreen();
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
        if (this.uiElements && this.uiElements.screen) {
            this.uiElements.screen.style.display = 'flex';
            this.showView(this.uiElements.welcomeView);
        }
    }

    showView(viewToShow) {
        if (!this.uiElements) return;
        if (this.uiElements.welcomeView) this.uiElements.welcomeView.style.display = 'none';
        if (this.uiElements.loginForm) this.uiElements.loginForm.style.display = 'none';
        if (this.uiElements.registerForm) this.uiElements.registerForm.style.display = 'none';
        
        if(viewToShow) viewToShow.style.display = 'flex';
        if(this.uiElements.message) this.uiElements.message.textContent = '';
    }

    // --- FIX: LEPSZA DIAGNOSTYKA REJESTRACJI ---
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
            
            // Odczytujemy jako tekst, żeby zobaczyć co przyszło (nawet jeśli to błąd HTML)
            const text = await response.text();
            
            try {
                const data = JSON.parse(text); // Próbujemy parsować JSON
                if (response.ok) {
                    this.setMessage('Rejestracja pomyślna! Zaloguj się.');
                    this.showView(this.uiElements.loginForm);
                } else {
                    this.setMessage(data.message || 'Błąd rejestracji.');
                }
            } catch (jsonError) {
                // To nie jest JSON! To prawdopodobnie strona błędu HTML (500/404)
                console.error("Otrzymano HTML zamiast JSON:", text);
                this.setMessage(`Błąd serwera! (Otrzymano HTML). Sprawdź konsolę.`);
                alert("Serwer zwrócił błąd HTML zamiast danych. Prawdopodobnie błąd kodu serwera lub zły adres.\nTreść: " + text.substring(0, 50));
            }
        } catch (error) {
            this.setMessage(`Błąd sieci: ${error.message}`);
        }
    }

    // --- FIX: LEPSZA DIAGNOSTYKA LOGOWANIA ---
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
            
            const text = await response.text();
            
            try {
                const data = JSON.parse(text);
                if (response.ok) {
                    this.setMessage('Zalogowano pomyślnie!');
                    if (this.uiElements.screen) this.uiElements.screen.style.display = 'none';
                    this.onLoginSuccess(data.user, data.token, data.thumbnail);
                } else {
                    this.setMessage(data.message || 'Błąd logowania.');
                }
            } catch (jsonError) {
                console.error("Otrzymano HTML zamiast JSON:", text);
                this.setMessage(`Błąd serwera! (Otrzymano HTML).`);
                alert("Serwer zwrócił błąd HTML zamiast danych.\nTreść: " + text.substring(0, 50));
            }
        } catch (error) {
            this.setMessage(`Błąd sieci: ${error.message}`);
        }
    }

    logout() {
        localStorage.removeItem(STORAGE_KEYS.JWT_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.PLAYER_NAME);
        localStorage.removeItem(STORAGE_KEYS.USER_ID);
        window.location.reload();
    }

    setMessage(msg) {
        if(this.uiElements && this.uiElements.message) this.uiElements.message.textContent = msg;
    }
}