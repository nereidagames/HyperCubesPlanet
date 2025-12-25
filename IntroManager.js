/* PLIK: IntroManager.js */
import * as THREE from 'three';
import { STARTER_SKINS } from './StarterSkins.js';
import { createBaseCharacter } from './character.js';
import { API_BASE_URL, STORAGE_KEYS } from './Config.js';

export class IntroManager {
    constructor(gameCore, uiManager, onLoginSuccess) {
        this.core = gameCore;
        this.ui = uiManager;
        this.onLoginSuccess = onLoginSuccess; 

        this.scene = gameCore.scene;
        this.camera = gameCore.camera;
        this.renderer = gameCore.renderer;

        this.currentSkinIndex = 0;
        this.previewCharacter = null;
        this.introAnimId = null;
        this.isIntroActive = false;

        this.screens = {};

        // --- ZMIENNE DO ANIMACJI KAMERY ---
        // Pozycja startowa (oddalona)
        this.defaultCamPos = new THREE.Vector3(0, 4, 9);
        this.defaultLookAt = new THREE.Vector3(0, 2, 0);

        // Pozycja przybliżona (Kreator)
        this.zoomedCamPos = new THREE.Vector3(0, 2.2, 5.5);
        this.zoomedLookAt = new THREE.Vector3(0, 1.4, 0);

        // Aktualne cele (do których dążymy w animate)
        this.targetCamPos = this.defaultCamPos.clone();
        this.currentLookAt = this.defaultLookAt.clone();
        this.targetLookAt = this.defaultLookAt.clone();
    }

    refreshElements() {
        this.screens = {
            main: document.getElementById('auth-screen'),
            welcome: document.getElementById('bsp-welcome-screen'),
            login: document.getElementById('bsp-login-modal'),
            register: document.getElementById('bsp-register-screen')
        };
    }

    start() {
        this.isIntroActive = true;
        this.refreshElements();
        this.setupScene();
        this.setupEvents();
        this.showScreen('welcome');
        this.updateSkinPreview();
        this.animate();
    }

    setupScene() {
        // Reset pozycji kamery na start
        this.camera.position.copy(this.defaultCamPos);
        this.camera.lookAt(this.defaultLookAt);
        
        // Reset celów animacji
        this.targetCamPos.copy(this.defaultCamPos);
        this.currentLookAt.copy(this.defaultLookAt);
        this.targetLookAt.copy(this.defaultLookAt);

        // Usuń stare światła/obiekty
        while(this.scene.children.length > 0){ 
            this.scene.remove(this.scene.children[0]); 
        }

        const amb = new THREE.AmbientLight(0xffffff, 0.8);
        const dir = new THREE.DirectionalLight(0xffffff, 0.6);
        dir.position.set(5, 10, 7);
        this.scene.add(amb);
        this.scene.add(dir);

        this.previewCharacter = new THREE.Group();
        this.scene.add(this.previewCharacter);
        
        createBaseCharacter(this.previewCharacter);
        this.previewCharacter.position.y = 1; 
    }

    // --- FUNKCJE ANIMACJI ---
    zoomIn() {
        this.targetCamPos.copy(this.zoomedCamPos);
        this.targetLookAt.copy(this.zoomedLookAt);
    }

    zoomOut() {
        this.targetCamPos.copy(this.defaultCamPos);
        this.targetLookAt.copy(this.defaultLookAt);
    }

    setupEvents() {
        const btnShowLogin = document.getElementById('btn-show-login');
        const btnShowRegister = document.getElementById('btn-show-register');

        if(btnShowLogin) btnShowLogin.onclick = () => { 
            this.showScreen('login');
            // Przy logowaniu nie przybliżamy, bo modal zasłoni postać
            this.zoomOut(); 
        };
        
        if(btnShowRegister) btnShowRegister.onclick = () => { 
            this.showScreen('register');
            // Przy rejestracji PRZYBLIŻAMY
            this.zoomIn();
        };

        // Powrót z logowania
        const btnLoginCancel = document.getElementById('btn-login-cancel');
        if(btnLoginCancel) btnLoginCancel.onclick = () => {
            this.showScreen('welcome');
            this.zoomOut();
        };

        const formLogin = document.getElementById('login-form');
        if(formLogin) {
            formLogin.onsubmit = (e) => {
                e.preventDefault();
                this.handleLogin();
            };
        }

        // Powrót z rejestracji
        const btnRegCancel = document.getElementById('btn-register-cancel');
        if(btnRegCancel) btnRegCancel.onclick = () => {
            this.showScreen('welcome');
            // ODDALAMY
            this.zoomOut();
        };

        const formReg = document.getElementById('register-form');
        const arrowLeft = document.getElementById('skin-prev');
        const arrowRight = document.getElementById('skin-next');

        if(arrowLeft) arrowLeft.onclick = () => this.cycleSkin(-1);
        if(arrowRight) arrowRight.onclick = () => this.cycleSkin(1);

        if(formReg) {
            formReg.onsubmit = (e) => {
                e.preventDefault();
                this.handleRegister();
            };
        }
    }

    showScreen(screenName) {
        if(this.screens.welcome) this.screens.welcome.style.display = 'none';
        if(this.screens.login) this.screens.login.style.display = 'none';
        if(this.screens.register) this.screens.register.style.display = 'none';

        if (screenName === 'welcome' && this.screens.welcome) this.screens.welcome.style.display = 'flex';
        if (screenName === 'login' && this.screens.login) this.screens.login.style.display = 'flex';
        if (screenName === 'register' && this.screens.register) this.screens.register.style.display = 'block';
    }

    cycleSkin(dir) {
        this.currentSkinIndex += dir;
        if (this.currentSkinIndex < 0) this.currentSkinIndex = STARTER_SKINS.length - 1;
        if (this.currentSkinIndex >= STARTER_SKINS.length) this.currentSkinIndex = 0;
        this.updateSkinPreview();
    }

    updateSkinPreview() {
        if (!this.previewCharacter) return;

        for (let i = this.previewCharacter.children.length - 1; i >= 0; i--) {
            const child = this.previewCharacter.children[i];
            if (child.type === 'Group') {
                this.previewCharacter.remove(child);
            }
        }

        const skinData = STARTER_SKINS[this.currentSkinIndex];
        if (!skinData) return;

        const skinGroup = new THREE.Group();
        skinGroup.scale.setScalar(0.125); 
        skinGroup.position.y = 0.5;

        const loader = new THREE.TextureLoader();

        skinData.blocks.forEach(b => {
            const geo = new THREE.BoxGeometry(1, 1, 1);
            const tex = loader.load(b.texturePath);
            tex.magFilter = THREE.NearestFilter;
            const mat = new THREE.MeshLambertMaterial({ map: tex });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(b.x, b.y, b.z);
            skinGroup.add(mesh);
        });

        this.previewCharacter.add(skinGroup);
    }

    animate() {
        if (!this.isIntroActive) return;

        this.introAnimId = requestAnimationFrame(() => this.animate());

        // 1. Obrót postaci
        if (this.previewCharacter) {
            this.previewCharacter.rotation.y += 0.005;
        }

        // 2. Animacja kamery (Lerp - płynne dążenie do celu)
        // Im mniejsza liczba (0.05), tym wolniejsza i płynniejsza animacja
        const speed = 0.05;

        // Interpolacja pozycji
        this.camera.position.lerp(this.targetCamPos, speed);

        // Interpolacja punktu patrzenia (LookAt)
        this.currentLookAt.lerp(this.targetLookAt, speed);
        this.camera.lookAt(this.currentLookAt);

        this.core.render(this.scene);
    }

    async handleLogin() {
        const usernameInput = document.getElementById('login-username');
        const passwordInput = document.getElementById('login-password');
        const msg = document.getElementById('auth-message');

        const username = usernameInput.value;
        const password = passwordInput.value;

        if (!username || !password) return;

        try {
            const res = await fetch(`${API_BASE_URL}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();
            if (res.ok) {
                this.dispose();
                this.onLoginSuccess(data.user, data.token, data.thumbnail);
            } else {
                if (msg) msg.textContent = data.message || "Błąd logowania";
            }
        } catch (e) {
            console.error(e);
            if (msg) msg.textContent = "Błąd połączenia";
        }
    }

    async handleRegister() {
        const uInput = document.getElementById('register-username');
        const pInput = document.getElementById('register-password');
        const pcInput = document.getElementById('register-password-confirm');

        if (pInput.value !== pcInput.value) {
            alert("Hasła nie są takie same!");
            return;
        }

        const selectedSkinData = STARTER_SKINS[this.currentSkinIndex];

        try {
            const res = await fetch(`${API_BASE_URL}/api/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: uInput.value,
                    password: pInput.value,
                    starterSkin: selectedSkinData
                })
            });

            const data = await res.json();
            if (res.ok) {
                alert("Konto utworzone! Możesz się zalogować.");
                // Po rejestracji wracamy do logowania i oddalamy kamerę
                this.showScreen('login');
                this.zoomOut();
            } else {
                alert("Błąd: " + data.message);
            }
        } catch (e) {
            alert("Błąd sieci: " + e.message);
        }
    }

    dispose() {
        this.isIntroActive = false;
        if (this.introAnimId) cancelAnimationFrame(this.introAnimId);
        
        if (this.screens.main) this.screens.main.style.display = 'none';

        if (this.previewCharacter) {
            this.scene.remove(this.previewCharacter);
            this.previewCharacter = null;
        }
        
        const ids = ['btn-show-login', 'btn-show-register', 'btn-login-cancel', 'btn-register-cancel', 'skin-prev', 'skin-next'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if(el) el.onclick = null;
        });
    }
}