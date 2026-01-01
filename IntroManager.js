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

        this.mapGroup = new THREE.Group();
        // Nie dodajemy do sceny tutaj, zrobimy to w setupScene
        
        this.textureLoader = new THREE.TextureLoader();
        this.materials = {};
        this.sharedGeometry = new THREE.BoxGeometry(1, 1, 1);

        this.defaultCamPos = new THREE.Vector3(0, 5.0, 10.0); 
        this.defaultLookAt = new THREE.Vector3(0, 2.0, 0); 
        this.zoomedCamPos = new THREE.Vector3(0, 2.0, 3.5);
        this.zoomedLookAt = new THREE.Vector3(0, 1.5, 0); 
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
        // Reset kamery
        this.camera.position.copy(this.defaultCamPos);
        this.camera.lookAt(this.defaultLookAt);
        this.targetCamPos.copy(this.defaultCamPos);
        this.currentLookAt.copy(this.defaultLookAt);
        this.targetLookAt.copy(this.defaultLookAt);

        // Wyczyść scenę CAŁKOWICIE
        while(this.scene.children.length > 0){ 
            this.scene.remove(this.scene.children[0]);
        }

        // Dodaj grupę mapy
        this.scene.add(this.mapGroup);

        // Światła
        const amb = new THREE.AmbientLight(0xffffff, 0.7);
        const dir = new THREE.DirectionalLight(0xffffff, 0.8);
        dir.position.set(10, 20, 10);
        dir.castShadow = true;
        dir.shadow.mapSize.width = 512;
        dir.shadow.mapSize.height = 512;
        this.scene.add(amb);
        this.scene.add(dir);

        // Postać
        this.previewCharacter = new THREE.Group();
        this.scene.add(this.previewCharacter);
        createBaseCharacter(this.previewCharacter);
        this.previewCharacter.position.y = 1; 

        // Ładuj mapę i skiny
        this.loadLoginMap();
        this.fetchStarterSkins();
    }

    async fetchStarterSkins() {
        try {
            const res = await fetch(`${API_BASE_URL}/api/starter-skins`);
            if(res.ok) {
                const data = await res.json();
                if(Array.isArray(data) && data.length > 0) {
                    this.serverStarterSkins = data.map(s => ({
                        name: s.name,
                        blocks: s.blocks_data 
                    }));
                }
            }
        } catch(e) {}
    }

    async loadLoginMap() {
        // Wyczyść starą mapę
        while(this.mapGroup.children.length > 0) {
            const child = this.mapGroup.children[0];
            // Nie usuwamy sharedGeometry!
            this.mapGroup.remove(child);
        }

        try {
            console.log("Ładowanie mapy logowania...");
            const res = await fetch(`${API_BASE_URL}/api/login-map`);
            let blocksData = [];
            
            if (res.ok) {
                blocksData = await res.json();
            }

            // FALLBACK: Jeśli mapa jest pusta lub błąd, stwórz podłogę
            if (!Array.isArray(blocksData) || blocksData.length === 0) {
                console.log("Mapa logowania pusta, generuję domyślną.");
                this.createDefaultFloor();
                return;
            }

            const blocksByTexture = {};
            let highestYAtCenter = -100;

            blocksData.forEach(block => {
                if (!blocksByTexture[block.texturePath]) {
                    blocksByTexture[block.texturePath] = [];
                }
                blocksByTexture[block.texturePath].push(block);

                if (Math.abs(block.x) < 0.6 && Math.abs(block.z) < 0.6) {
                    if (block.y > highestYAtCenter) {
                        highestYAtCenter = block.y;
                    }
                }
            });

            // Dostosuj kamerę do wysokości terenu
            if (highestYAtCenter > -100) {
                const charY = highestYAtCenter + 1.0;
                this.previewCharacter.position.y = charY;
                this.defaultLookAt.y = charY + 1.0;
                this.zoomedLookAt.y = charY + 0.8;
                this.defaultCamPos.y = charY + 2.5;
                this.zoomedCamPos.y = charY + 1.0;
                this.targetCamPos.copy(this.defaultCamPos);
                this.targetLookAt.copy(this.defaultLookAt);
            }

            const dummy = new THREE.Object3D();

            for (const [texturePath, blocks] of Object.entries(blocksByTexture)) {
                let material = this.materials[texturePath];
                if (!material) {
                    const tex = this.textureLoader.load(texturePath);
                    tex.magFilter = THREE.NearestFilter;
                    tex.minFilter = THREE.NearestFilter; 
                    material = new THREE.MeshLambertMaterial({ map: tex });
                    this.materials[texturePath] = material;
                }

                const instancedMesh = new THREE.InstancedMesh(this.sharedGeometry, material, blocks.length);
                instancedMesh.castShadow = true;
                instancedMesh.receiveShadow = true;

                blocks.forEach((block, index) => {
                    dummy.position.set(block.x, block.y, block.z);
                    dummy.updateMatrix();
                    instancedMesh.setMatrixAt(index, dummy.matrix);
                });

                instancedMesh.instanceMatrix.needsUpdate = true;
                this.mapGroup.add(instancedMesh);
            }

        } catch (e) {
            console.warn("Błąd mapy logowania:", e);
            this.createDefaultFloor();
        }
    }

    createDefaultFloor() {
        // Prosta szachownica
        const tex = this.textureLoader.load('textures/trawa.png');
        tex.magFilter = THREE.NearestFilter;
        const mat = new THREE.MeshLambertMaterial({ map: tex });
        
        const size = 10;
        const instancedMesh = new THREE.InstancedMesh(this.sharedGeometry, mat, size * size);
        const dummy = new THREE.Object3D();
        
        let i = 0;
        for(let x = -size/2; x < size/2; x++) {
            for(let z = -size/2; z < size/2; z++) {
                dummy.position.set(x, 0, z);
                dummy.updateMatrix();
                instancedMesh.setMatrixAt(i++, dummy.matrix);
            }
        }
        instancedMesh.instanceMatrix.needsUpdate = true;
        this.mapGroup.add(instancedMesh);
        this.previewCharacter.position.y = 1.5;
    }

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
            this.zoomOut(); 
        };
        
        if(btnShowRegister) btnShowRegister.onclick = () => { 
            this.showScreen('register');
            this.zoomIn();
        };

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

        const btnRegCancel = document.getElementById('btn-register-cancel');
        if(btnRegCancel) btnRegCancel.onclick = () => {
            this.showScreen('welcome');
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
        const skinsList = this.serverStarterSkins || STARTER_SKINS;
        
        this.currentSkinIndex += dir;
        if (this.currentSkinIndex < 0) this.currentSkinIndex = skinsList.length - 1;
        if (this.currentSkinIndex >= skinsList.length) this.currentSkinIndex = 0;
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

        const skinsList = this.serverStarterSkins || STARTER_SKINS;
        const skinData = skinsList[this.currentSkinIndex];
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

        if (this.previewCharacter) {
            this.previewCharacter.rotation.y += 0.005;
        }

        const speed = 0.05;
        this.camera.position.lerp(this.targetCamPos, speed);
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

        const skinsList = this.serverStarterSkins || STARTER_SKINS;
        const selectedSkinData = skinsList[this.currentSkinIndex];

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
        
        const authScreen = document.getElementById('auth-screen');
        if (authScreen) {
            authScreen.style.display = 'none';
        }

        if (this.previewCharacter) {
            this.scene.remove(this.previewCharacter);
            this.previewCharacter = null;
        }

        // Czyszczenie mapy
        if (this.mapGroup) {
            this.scene.remove(this.mapGroup);
            while(this.mapGroup.children.length > 0) {
                const child = this.mapGroup.children[0];
                if(child.geometry) child.geometry.dispose();
                this.mapGroup.remove(child);
            }
        }
        
        const ids = ['btn-show-login', 'btn-show-register', 'btn-login-cancel', 'btn-register-cancel', 'skin-prev', 'skin-next'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if(el) el.onclick = null;
        });
    }
}
