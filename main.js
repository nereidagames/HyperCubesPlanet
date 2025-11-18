import * as THREE from 'three';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { PlayerController, ThirdPersonCameraController } from './controls.js';
import { CharacterManager } from './character.js';
import { SceneManager } from './scene.js';
import { UIManager } from './ui.js';
import { MultiplayerManager } from './multiplayer.js';
import { BuildManager } from './BuildManager.js';
import { WorldStorage } from './WorldStorage.js';
import { CoinManager } from './CoinManager.js';
import { SkinBuilderManager } from './SkinBuilderManager.js';
import { PrefabBuilderManager } from './PrefabBuilderManager.js';
import { HyperCubePartBuilderManager } from './HyperCubePartBuilderManager.js';
import { SkinStorage } from './SkinStorage.js';
import Stats from 'three/addons/libs/stats.module.js';
import { BlockManager } from './BlockManager.js';

const LOADING_TEXTS = [
    "Dziurkowanie Kawałków Sera...",
    "Wprowadzanie Przycisku Skoku...",
    "Naprawianie Błędów...",
    "Ustawianie Grawitacji...",
    "Generowanie Sześciennych Światów...",
    "Karmienie Chomików w Serwerowni...",
    "Wczytywanie - Proszę czekać..."
];

const PLAYER_NAME_KEY = 'bsp_clone_player_name';
const JWT_TOKEN_KEY = 'bsp_clone_jwt_token';
const API_BASE_URL = 'https://hypercubes-nexus-server.onrender.com';

class BlockStarPlanetGame {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.css2dRenderer = new CSS2DRenderer();
    this.playerController = null;
    this.characterManager = null;
    this.cameraController = null;
    this.coinManager = null;
    this.blockManager = new BlockManager();
    this.gameState = 'Loading';
    this.buildManager = null;
    this.skinBuilderManager = null;
    this.prefabBuilderManager = null;
    this.partBuilderManager = null;
    this.exploreScene = null;
    this.isMobile = this.detectMobileDevice();
    this.clock = new THREE.Clock(); 

    this.stats = null;
    this.isFPSEnabled = false;

    this.loadingManager = null;
    this.loadingTextInterval = null;
    
    this.initialLoadComplete = false;

    this.previewScene = null;
    this.previewCamera = null;
    this.previewRenderer = null;
    this.previewCharacter = null;
    this.previewContainer = null;
    this.isPreviewDragging = false;
    this.previewPreviousMouseX = 0;

    this.positionUpdateInterval = null;

    this.setupRenderer();
    this.init();
  }

  async init() {
    try {
      this.blockManager.load();
      this.setupLoadingManager();
      this.preloadInitialAssets();
    } catch (error) {
      console.error('CRITICAL: Error initializing game:', error);
      this.showError('Krytyczny błąd podczas ładowania gry.');
    }
  }

  setupLoadingManager() {
    const loadingScreen = document.getElementById('loading-screen');
    const progressBarFill = document.getElementById('progress-bar-fill');
    const loadingText = document.getElementById('loading-text');

    this.loadingManager = new THREE.LoadingManager();

    this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
        const progress = (itemsLoaded / itemsTotal) * 100;
        progressBarFill.style.width = `${progress}%`;
    };

    this.loadingManager.onLoad = async () => {
        if (this.initialLoadComplete) return;
        this.initialLoadComplete = true; 

        clearInterval(this.loadingTextInterval);
        loadingText.textContent = "Gotowe!";
        
        await this.setupManagers();
        
        setTimeout(() => {
            if (loadingScreen) {
                loadingScreen.style.opacity = '0';
                setTimeout(() => { 
                    loadingScreen.style.display = 'none'; 
                    const token = localStorage.getItem(JWT_TOKEN_KEY);
                    const username = localStorage.getItem(PLAYER_NAME_KEY);

                    // Na tym etapie, dla uproszczenia, zawsze pokazujemy ekran logowania,
                    // aby pobrać świeże dane (np. saldo monet).
                    // W przyszłości można dodać weryfikację tokenu i automatyczne logowanie.
                    this.setupAuthScreen();

                }, 500);
            }
        }, 500);
    };

    this.loadingTextInterval = setInterval(() => {
        const randomIndex = Math.floor(Math.random() * LOADING_TEXTS.length);
        loadingText.textContent = LOADING_TEXTS[randomIndex];
    }, 2000);
  }
  
  startGame(user, token) {
      localStorage.setItem(PLAYER_NAME_KEY, user.username);
      localStorage.setItem(JWT_TOKEN_KEY, token);

      this.uiManager.updatePlayerName(user.username);
      
      document.querySelector('.ui-overlay').style.display = 'block';

      this.coinManager = new CoinManager(this.scene, this.uiManager, this.characterManager.character, user.coins);

      this.multiplayerManager = new MultiplayerManager(this.scene, this.uiManager, this.sceneManager, this.characterManager.materialsCache);
      this.multiplayerManager.initialize(token);

      this.animate();
      this.gameState = 'MainMenu';
      
      if (this.positionUpdateInterval) clearInterval(this.positionUpdateInterval);
      this.positionUpdateInterval = setInterval(() => {
        if (this.gameState === 'MainMenu' && this.multiplayerManager && this.characterManager.character) {
          this.multiplayerManager.sendMessage({
            type: 'playerMove',
            position: this.characterManager.character.position,
            quaternion: this.characterManager.character.quaternion
          });
        }
      }, 100);

      console.log('Game initialized successfully!');
  }

  setupAuthScreen() {
      const authScreen = document.getElementById('auth-screen');
      const welcomeView = document.getElementById('welcome-view');
      const loginForm = document.getElementById('login-form');
      const registerForm = document.getElementById('register-form');
      const showLoginBtn = document.getElementById('show-login-btn');
      const showRegisterBtn = document.getElementById('show-register-btn');
      const backButtons = document.querySelectorAll('.btn-back');
      const authMessage = document.getElementById('auth-message');

      const showView = (view) => {
          welcomeView.style.display = 'none';
          loginForm.style.display = 'none';
          registerForm.style.display = 'none';
          view.style.display = 'flex';
          authMessage.textContent = '';
      };

      showLoginBtn.onclick = () => showView(loginForm);
      showRegisterBtn.onclick = () => showView(registerForm);
      backButtons.forEach(btn => btn.onclick = () => showView(welcomeView));

      registerForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          authMessage.textContent = 'Rejestrowanie...';
          const username = document.getElementById('register-username').value;
          const password = document.getElementById('register-password').value;
          const passwordConfirm = document.getElementById('register-password-confirm').value;

          if (password !== passwordConfirm) {
              authMessage.textContent = 'Hasła nie są takie same!';
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
                  authMessage.textContent = 'Rejestracja pomyślna! Teraz możesz się zalogować.';
                  showView(loginForm);
              } else {
                  authMessage.textContent = data.message || 'Błąd rejestracji.';
              }
          } catch (error) {
              authMessage.textContent = 'Błąd połączenia z serwerem.';
          }
      });

      loginForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          authMessage.textContent = 'Logowanie...';
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
                  authMessage.textContent = 'Zalogowano pomyślnie!';
                  authScreen.style.display = 'none';
                  this.startGame(data.user, data.token);
              } else {
                  authMessage.textContent = data.message || 'Błąd logowania.';
              }
          } catch (error) {
              authMessage.textContent = 'Błąd połączenia z serwerem.';
          }
      });

      authScreen.style.display = 'flex';
  }

  logout() {
    localStorage.removeItem(JWT_TOKEN_KEY);
    localStorage.removeItem(PLAYER_NAME_KEY);
    window.location.reload();
  }

  preloadInitialAssets() {
    const textureLoader = new THREE.TextureLoader(this.loadingManager);
    const allBlocks = this.blockManager.getAllBlockDefinitions();
    allBlocks.forEach(block => {
        textureLoader.load(block.texturePath);
    });
  }

  detectMobileDevice() { 
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent); 
  }

  setupRenderer() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x87CEEB, 1);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('gameContainer').appendChild(this.renderer.domElement);
    this.css2dRenderer.setSize(window.innerWidth, window.innerHeight);
    this.css2dRenderer.domElement.style.position = 'absolute';
    this.css2dRenderer.domElement.style.top = '0px';
    this.css2dRenderer.domElement.style.pointerEvents = 'none';
    document.getElementById('gameContainer').appendChild(this.css2dRenderer.domElement);
  }

  async setupManagers() {
    let deferredPrompt;
    const installButton = document.getElementById('install-button');

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      if (installButton) {
        installButton.style.display = 'block';
      }
    });

    if (installButton) {
        installButton.addEventListener('click', async () => {
          if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response to the install prompt: ${outcome}`);
            deferredPrompt = null;
            installButton.style.display = 'none';
          }
        });
    }
      
    this.uiManager = new UIManager(
      (message) => { 
        if (this.multiplayerManager) {
            this.multiplayerManager.sendMessage({ type: 'chatMessage', text: message });
        }
      }
    );
    this.uiManager.initialize(this.isMobile);
    this.uiManager.onWorldSizeSelected = (size) => this.switchToBuildMode(size);
    this.uiManager.onSkinBuilderClick = () => this.switchToSkinBuilderMode();
    this.uiManager.onPrefabBuilderClick = () => this.switchToPrefabBuilderMode();
    this.uiManager.onPartBuilderClick = () => this.switchToPartBuilderMode();
    this.uiManager.onPlayClick = () => this.showDiscoverPanel('worlds');
    this.uiManager.onPlayerAvatarClick = () => this.showPlayerPreview();
    this.uiManager.onShopOpen = () => this.populateShopUI();
    this.uiManager.onBuyBlock = (block) => this.handleBuyBlock(block);
    this.uiManager.onDiscoverClick = () => this.showDiscoverPanel('skins');
    this.uiManager.onToggleFPS = () => this.toggleFPSCounter();
    
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.onclick = () => this.logout();
    }

    document.getElementById('explore-exit-button').onclick = () => this.switchToMainMenu();

    this.stats = new Stats();
    this.stats.dom.style.left = '10px';
    this.stats.dom.style.top = '100px';
    this.stats.dom.style.display = 'none';
    document.getElementById('gameContainer').appendChild(this.stats.dom);

    const savedFPSPref = localStorage.getItem('bsp_clone_fps_enabled');
    if (savedFPSPref === 'true') {
        this.isFPSEnabled = true;
        this.stats.dom.style.display = 'block';
    }
    this.uiManager.updateFPSToggleText(this.isFPSEnabled);
    
    this.toggleMobileControls(true);

    this.buildManager = new BuildManager(this, this.loadingManager, this.blockManager);
    this.skinBuilderManager = new SkinBuilderManager(this, this.loadingManager, this.blockManager);
    this.prefabBuilderManager = new PrefabBuilderManager(this, this.loadingManager, this.blockManager);
    this.partBuilderManager = new HyperCubePartBuilderManager(this, this.loadingManager, this.blockManager);

    this.sceneManager = new SceneManager(this.scene);
    await this.sceneManager.initialize();
    
    this.characterManager = new CharacterManager(this.scene);
    this.characterManager.loadCharacter();
    
    const lastSkinName = SkinStorage.getLastUsedSkin();
    if (lastSkinName) {
        const skinData = SkinStorage.loadSkin(lastSkinName);
        this.characterManager.applySkin(skinData);
    }

    this.recreatePlayerController(this.sceneManager.collidableObjects);
    this.cameraController = new ThirdPersonCameraController(this.camera, this.characterManager.character, this.renderer.domElement, {
      distance: 4, height: 2, rotationSpeed: 0.005
    });
    this.cameraController.setIsMobile(this.isMobile);
  }
  
  toggleFPSCounter() {
    this.isFPSEnabled = !this.isFPSEnabled;
    this.stats.dom.style.display = this.isFPSEnabled ? 'block' : 'none';
    this.uiManager.updateFPSToggleText(this.isFPSEnabled);
    localStorage.setItem('bsp_clone_fps_enabled', this.isFPSEnabled.toString());
  }

  switchToBuildMode(size) {
    if (this.gameState !== 'MainMenu') return;
    this.gameState = 'BuildMode';
    this.toggleMainUI(false);
    this.buildManager.enterBuildMode(size);
  }

  switchToSkinBuilderMode() {
    if (this.gameState !== 'MainMenu') return;
    this.gameState = 'SkinBuilderMode';
    this.toggleMainUI(false);
    this.skinBuilderManager.enterBuildMode();
  }

  switchToPrefabBuilderMode() {
    if (this.gameState !== 'MainMenu') return;
    this.gameState = 'PrefabBuilderMode';
    this.toggleMainUI(false);
    this.prefabBuilderManager.enterBuildMode();
  }

  switchToPartBuilderMode() {
    if (this.gameState !== 'MainMenu') return;
    this.gameState = 'PartBuilderMode';
    this.toggleMainUI(false);
    this.partBuilderManager.enterBuildMode();
  }
  
  switchToMainMenu() {
    if (this.gameState === 'MainMenu') return;
    
    if (this.gameState === 'BuildMode') {
        this.buildManager.exitBuildMode();
    } else if (this.gameState === 'SkinBuilderMode') {
        this.skinBuilderManager.exitBuildMode();
    } else if (this.gameState === 'PrefabBuilderMode') {
        this.prefabBuilderManager.exitBuildMode();
    } else if (this.gameState === 'PartBuilderMode') {
        this.partBuilderManager.exitBuildMode();
    } else if (this.gameState === 'ExploreMode') {
      this.scene.add(this.characterManager.character);
      this.characterManager.character.position.set(0, 5, 0); 
      document.getElementById('explore-exit-button').style.display = 'none';
    }

    this.gameState = 'MainMenu';
    this.toggleMainUI(true);
    this.toggleMobileControls(true); 
    
    this.recreatePlayerController(this.sceneManager.collidableObjects);
    this.cameraController.target = this.characterManager.character;
  }
  
  toggleMainUI(visible) {
      document.querySelector('.ui-overlay').style.display = visible ? 'block' : 'none';
      if(this.playerController) this.playerController.destroy();
      this.playerController = null;
      if(this.cameraController) this.cameraController.enabled = visible;
  }

  toggleMobileControls(visible) {
      if (!this.isMobile) return;
      const mobileControls = document.getElementById('mobile-game-controls');
      if (mobileControls) {
          mobileControls.style.display = visible ? 'block' : 'none';
      }
  }
  
  recreatePlayerController(collidables) {
      if(this.playerController) this.playerController.destroy();
      this.playerController = new PlayerController(this.characterManager.character, collidables, {
          moveSpeed: 8, jumpForce: 18, gravity: 50,
          groundRestingY: this.sceneManager.FLOOR_TOP_Y
      });
      this.playerController.setIsMobile(this.isMobile);
  }

  showDiscoverPanel(type) {
    const list = document.getElementById('discover-list');
    const title = document.getElementById('discover-panel-title');
    list.innerHTML = '';
    
    if (type === 'worlds') {
        title.textContent = 'Wybierz Świat';
        const savedWorlds = WorldStorage.getSavedWorldsList();
        if (savedWorlds.length === 0) {
            list.innerHTML = '<p style="text-align: center;">Nie masz zapisanych światów!</p>';
        } else {
            savedWorlds.forEach(worldName => {
                const item = document.createElement('div');
                item.className = 'panel-item';
                item.textContent = worldName;
                item.onclick = () => { this.uiManager.closeAllPanels(); this.loadAndExploreWorld(worldName); };
                list.appendChild(item);
            });
        }
    } else if (type === 'skins') {
        title.textContent = 'Wybierz Skina';
        const savedSkins = SkinStorage.getSavedSkinsList();
        if (savedSkins.length === 0) {
            list.innerHTML = '<p style="text-align: center;">Nie masz zapisanych skinów!</p>';
        } else {
            savedSkins.forEach(skinName => {
                const item = document.createElement('div');
                item.className = 'panel-item';
                item.textContent = skinName;
                item.onclick = () => {
                    this.uiManager.closeAllPanels();
                    const skinData = SkinStorage.loadSkin(skinName);
                    this.characterManager.applySkin(skinData);
                    SkinStorage.setLastUsedSkin(skinName);
                    this.uiManager.showMessage(`Założono skina: ${skinName}`, 'success');
                };
                list.appendChild(item);
            });
        }
    }

    this.uiManager.openPanel('discover-panel');
  }

  loadAndExploreWorld(worldName) {
    const worldSaveData = WorldStorage.loadWorld(worldName);
    if (!worldSaveData) { alert(`Nie udało się wczytać świata: ${worldName}`); return; }

    let worldBlocksData;
    let worldSize;
    if (Array.isArray(worldSaveData)) {
        worldBlocksData = worldSaveData;
        worldSize = 64;
    } else {
        worldBlocksData = worldSaveData.blocks;
        worldSize = worldSaveData.size || 64;
    }
    
    this.gameState = 'ExploreMode';
    this.toggleMainUI(false);
    this.toggleMobileControls(true);
    document.getElementById('explore-exit-button').style.display = 'flex';
    
    this.exploreScene = new THREE.Scene();
    this.exploreScene.background = new THREE.Color(0x87CEEB);
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.exploreScene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(20, 30, 20);
    directionalLight.castShadow = true;
    this.exploreScene.add(directionalLight);

    const allCollidables = [];
    const textureLoader = new THREE.TextureLoader(this.loadingManager);
    const loadedMaterials = {};

    const floorGeometry = new THREE.BoxGeometry(worldSize, 1, worldSize);
    const floorMaterial = new THREE.MeshLambertMaterial({ color: 0x559022 });
    const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
    floorMesh.position.y = -0.5;
    floorMesh.receiveShadow = true;
    this.exploreScene.add(floorMesh);
    allCollidables.push(floorMesh);

    const edges = new THREE.EdgesGeometry(floorGeometry);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x8A2BE2, linewidth: 4 }));
    line.position.y = -0.5;
    this.exploreScene.add(line);

    worldBlocksData.forEach(blockData => {
      if (blockData.texturePath) {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        let material;
        if (loadedMaterials[blockData.texturePath]) {
          material = loadedMaterials[blockData.texturePath];
        } else {
          const texture = textureLoader.load(blockData.texturePath);
          texture.magFilter = THREE.NearestFilter;
          texture.minFilter = THREE.NearestFilter;
          material = new THREE.MeshLambertMaterial({ map: texture });
          loadedMaterials[blockData.texturePath] = material;
        }
        const block = new THREE.Mesh(geometry, material);
        block.position.set(blockData.x, blockData.y, blockData.z);
        block.castShadow = true;
        block.receiveShadow = true;
        this.exploreScene.add(block);
        allCollidables.push(block);
      }
    });

    const barrierHeight = 100;
    const halfSize = worldSize / 2;
    const barrierMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 });

    const wallZ1 = new THREE.Mesh(new THREE.BoxGeometry(worldSize, barrierHeight, 1), barrierMaterial);
    wallZ1.position.set(0, barrierHeight / 2, halfSize - 0.5);
    this.exploreScene.add(wallZ1);
    allCollidables.push(wallZ1);

    const wallZ2 = new THREE.Mesh(new THREE.BoxGeometry(worldSize, barrierHeight, 1), barrierMaterial);
    wallZ2.position.set(0, barrierHeight / 2, -halfSize + 0.5);
    this.exploreScene.add(wallZ2);
    allCollidables.push(wallZ2);
    
    const wallX1 = new THREE.Mesh(new THREE.BoxGeometry(1, barrierHeight, worldSize), barrierMaterial);
    wallX1.position.set(halfSize - 0.5, barrierHeight / 2, 0);
    this.exploreScene.add(wallX1);
    allCollidables.push(wallX1);
    
    const wallX2 = new THREE.Mesh(new THREE.BoxGeometry(1, barrierHeight, worldSize), barrierMaterial);
    wallX2.position.set(-halfSize + 0.5, barrierHeight / 2, 0);
    this.exploreScene.add(wallX2);
    allCollidables.push(wallX2);


    this.exploreScene.add(this.characterManager.character);
    this.characterManager.character.position.set(0, 5, 0);
    this.recreatePlayerController(allCollidables);
    this.cameraController.enabled = true;
  }

  handleBuyBlock(block) {
    if (this.coinManager.spendCoins(block.cost)) {
        this.blockManager.unlockBlock(block.name);
        this.uiManager.showMessage(`Odblokowano: ${block.name}!`, 'success');
        this.populateShopUI();
    } else {
        this.uiManager.showMessage('Masz za mało monet!', 'error');
    }
  }

  populateShopUI() {
    this.uiManager.populateShop(
        this.blockManager.getAllBlockDefinitions(),
        (blockName) => this.blockManager.isOwned(blockName)
    );
  }

  setupPreviewScene() {
    this.previewContainer = document.getElementById('player-preview-renderer-container');
    const { clientWidth, clientHeight } = this.previewContainer;

    this.previewScene = new THREE.Scene();
    this.previewScene.background = new THREE.Color(0x3d3d3d);

    this.previewCamera = new THREE.PerspectiveCamera(50, clientWidth / clientHeight, 0.1, 100);
    this.previewCamera.position.set(0, 0.5, 4);

    this.previewRenderer = new THREE.WebGLRenderer({ antialias: true });
    this.previewRenderer.setSize(clientWidth, clientHeight);
    this.previewRenderer.setPixelRatio(window.devicePixelRatio);
    this.previewContainer.appendChild(this.previewRenderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 1.5);
    this.previewScene.add(ambient);
    const directional = new THREE.DirectionalLight(0xffffff, 1.5);
    directional.position.set(2, 5, 5);
    this.previewScene.add(directional);

    const onPointerDown = (e) => {
        this.isPreviewDragging = true;
        this.previewPreviousMouseX = e.clientX || e.touches[0].clientX;
    };
    const onPointerUp = () => {
        this.isPreviewDragging = false;
    };
    const onPointerMove = (e) => {
        if (!this.isPreviewDragging) return;
        const clientX = e.clientX || e.touches[0].clientX;
        const deltaX = clientX - this.previewPreviousMouseX;
        if (this.previewCharacter) {
            this.previewCharacter.rotation.y += deltaX * 0.01;
        }
        this.previewPreviousMouseX = clientX;
    };

    this.previewContainer.addEventListener('mousedown', onPointerDown);
    this.previewContainer.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('mouseup', onPointerUp);
    window.addEventListener('touchend', onPointerUp);
    this.previewContainer.addEventListener('mousemove', onPointerMove);
    this.previewContainer.addEventListener('touchmove', onPointerMove, { passive: true });
    this.previewContainer.addEventListener('mouseleave', onPointerUp);
  }

  showPlayerPreview() {
    if (!this.previewRenderer) {
      this.setupPreviewScene();
    }

    if (this.previewCharacter) {
      this.previewScene.remove(this.previewCharacter);
    }
    
    this.previewCharacter = this.characterManager.character.clone(true);
    this.previewCharacter.position.set(0, 0, 0); 
    this.previewCharacter.rotation.set(0, 0, 0);
    this.previewScene.add(this.previewCharacter);
    
    this.uiManager.openPanel('player-preview-panel');
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    
    if (this.isFPSEnabled) this.stats.update();

    const deltaTime = this.clock.getDelta();
    
    if (this.gameState === 'Loading') return;

    if (this.gameState === 'MainMenu') {
        if(this.playerController && this.cameraController) {
            const rot = this.cameraController.update(deltaTime);
            this.playerController.update(deltaTime, rot);
        }
        if (this.characterManager) this.characterManager.update(deltaTime);
        if (this.multiplayerManager) this.multiplayerManager.update(deltaTime);
        if (this.coinManager) this.coinManager.update(deltaTime);
        this.renderer.render(this.scene, this.camera);
        this.css2dRenderer.render(this.scene, this.camera);
    } else if (this.gameState === 'BuildMode') {
        this.buildManager.update(deltaTime);
        this.renderer.render(this.buildManager.scene, this.camera);
    } else if (this.gameState === 'SkinBuilderMode') {
        this.skinBuilderManager.update(deltaTime);
        this.renderer.render(this.skinBuilderManager.scene, this.camera);
    } else if (this.gameState === 'PrefabBuilderMode') {
        this.prefabBuilderManager.update(deltaTime);
        this.renderer.render(this.prefabBuilderManager.scene, this.camera);
    } else if (this.gameState === 'PartBuilderMode') {
        this.partBuilderManager.update(deltaTime);
        this.renderer.render(this.partBuilderManager.scene, this.camera);
    } else if (this.gameState === 'ExploreMode') {
        if (this.playerController && this.cameraController) {
            const rot = this.cameraController.update(deltaTime);
            this.playerController.update(deltaTime, rot);
        }
        if (this.characterManager) this.characterManager.update(deltaTime);
        this.renderer.render(this.exploreScene, this.camera);
    }

    if (this.previewRenderer && document.getElementById('player-preview-panel').style.display === 'flex') {
      if (this.previewCharacter && !this.isPreviewDragging) {
        this.previewCharacter.rotation.y += 0.005;
      }
      this.previewRenderer.render(this.previewScene, this.previewCamera);
    }
  }
  
  showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #e74c3c; color: white; padding: 20px; border-radius: 10px; font-family: Arial, sans-serif; font-weight: bold; z-index: 10000;`;
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);

    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 5000);
  }
}

document.addEventListener('DOMContentLoaded', () => { new BlockStarPlanetGame(); });
