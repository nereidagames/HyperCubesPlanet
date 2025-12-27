/* PLIK: AuthManager.js */
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
        // Reszta eventów jest obsługiwana przez IntroManager, 
        // AuthManager służy teraz głównie do sesji.
    }

    async checkSession(uiManager) {
        const token = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
        if (token) {
            try {
                // Wywołujemy przesunięty endpoint
                const response = await fetch(`${API_BASE_URL}/api/user/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                const contentType = response.headers.get("content-type");
                if (!contentType || !contentType.includes("application/json")) {
                    // Jeśli to nie JSON, to znaczy że serwer zwrócił błąd 404/500 w HTML
                    // Rzucamy błąd, aby main.js mógł go złapać i uruchomić Intro
                    throw new Error("Serwer zwrócił błąd (HTML zamiast JSON).");
                }

                if (response.ok) {
                    const data = await response.json();
                    if (data.thumbnail && uiManager) {
                        uiManager.updatePlayerAvatar(data.thumbnail);
                    }
                    this.onLoginSuccess(data.user, token, data.thumbnail);
                } else {
                    // Token nieważny
                    this.showAuthScreen();
                }
            } catch (err) {
                console.warn("Błąd sesji:", err);
                this.showAuthScreen(); // To uruchomi IntroManager
            }
        } else {
            this.showAuthScreen();
        }
    }

    showAuthScreen() {
        // Ta metoda jest nadpisywana w main.js, aby uruchamiać IntroManager.js
        // Domyślna implementacja (na wszelki wypadek):
        if (this.uiElements && this.uiElements.screen) {
            this.uiElements.screen.style.display = 'flex';
        }
    }
}
