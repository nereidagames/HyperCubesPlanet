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

const PLAYER_NAME_KEY = 'bsp_clone_player_name';
const JWT_TOKEN_KEY = 'bsp_clone_jwt_token';
const API_BASE_URL = 'https://hypercubes-nexus-server.onrender.com';

const LOADING_TEXTS = [
    "Dziurkowanie Kawałków Sera...",
    "Wprowadzanie Przycisku Skoku...",
    "Naprawianie Błędów...",
    "Ustawianie Grawitacji...",
    "Generowanie Sześciennych Światów...",
    "Karmienie Chomików w Serwerowni...",
    "Wczytywanie - Proszę czekać..."
];

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
    
    this.mailState = {
        conversations: [],
        activeConversation: null
    };

    this.setupRenderer();
    this.init();
  }

  async init() {
    try {
      this.blockManager.load(); // Wstępna inicjalizacja (darmowe bloki)
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

                    if (token && username) {
                        // Pobieramy aktualne dane użytkownika (monety, bloki, miniaturka)
                        fetch(`${API_BASE_URL}/api/user/me`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        })
                        .then(res => {
                            if (res.ok) return res.json();
                            throw new Error('Token invalid');
                        })
                        .then(data => {
                            if (data.thumbnail && this.uiManager) {
                                this.uiManager.updatePlayerAvatar(data.thumbnail);
                            }
                            this.startGame(data.user, token);
                        })
                        .catch((err) => {
                            console.warn("Błąd weryfikacji tokenu:", err);
                            this.setupAuthScreen();
                        });
                    } else {
                        this.setupAuthScreen();
                    }
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
      localStorage.setItem('bsp_clone_user_id', user.id);

      this.uiManager.updatePlayerName(user.username);
      this.uiManager.checkAdminPermissions(user.username);

      // Aktualizacja stanu bloków z serwera
      if (user.ownedBlocks) {
          this.blockManager.setOwnedBlocks(user.ownedBlocks);
      }

      document.querySelector('.ui-overlay').style.display = 'block';

      this.coinManager = new CoinManager(this.scene, this.uiManager, this.characterManager.character, user.coins);

      this.multiplayerManager = new MultiplayerManager(
          this.scene, 
          this.uiManager, 
          this.sceneManager, 
          this.characterManager.materialsCache, 
          this.coinManager
      );
      
      this.multiplayerManager.initialize(token);

      this.uiManager.onSendPrivateMessage = (recipient, text) => {
          if (this.multiplayerManager) {
              this.multiplayerManager.sendPrivateMessage(recipient, text);
          }
      };

      const originalHandle = this.multiplayerManager.handleMessage.bind(this.multiplayerManager);
      this.multiplayerManager.handleMessage = (msg) => {
          originalHandle(msg); 
          if (msg.type === 'friendRequestReceived') {
              this.uiManager.showMessage(`Zaproszenie od ${msg.from}!`, 'info');
              this.uiManager.loadFriendsData();
          }
          if (msg.type === 'friendRequestAccepted') {
              this.uiManager.showMessage(`${msg.by} przyjął zaproszenie!`, 'success');
              this.uiManager.loadFriendsData();
          }
          if (msg.type === 'friendStatusChange') {
              this.uiManager.loadFriendsData();
          }
          if (msg.type === 'privateMessageSent') {
              if (this.uiManager.onMessageSent) this.uiManager.onMessageSent(msg);
          }
          if (msg.type === 'privateMessageReceived') {
              if (this.uiManager.onMessageReceived) this.uiManager.onMessageReceived(msg);
          }
      };
      
      this.coinManager.onCollect = () => {
          this.multiplayerManager.sendMessage({ type: 'collectCoin' });
      };

      this.uiManager.loadFriendsData();

      this.animate();
      this.gameState = 'MainMenu';
      
      if (this.positionUpdateInterval) clearInterval(this.positionUpdateInterval);
      this.positionUpdateInterval = setInterval(() => {
        if ((this.gameState === 'MainMenu' || this.gameState === 'ExploreMode') && this.characterManager.character) {
          this.multiplayerManager.sendMyPosition(
            this.characterManager.character.position,
            this.characterManager.character.quaternion
          );
        }
      }, 50); 

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
                  
                  if (data.thumbnail) {
                      this.uiManager.updatePlayerAvatar(data.thumbnail);
                  }
                  
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
    localStorage.removeItem('bsp_clone_user_id');
    window.location.reload();
  }
  
  async setupMailSystem() {
    if (this.uiManager) {
        this.uiManager.openPanel('mail-panel');
        this.uiManager.setupMailSystem(); 
    }
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

    const mailButton = document.querySelector('.top-bar-item:nth-child(2)');
    if(mailButton) {
      mailButton.onclick = () => {
        this.uiManager.openPanel('mail-panel');
        this.uiManager.setupMailSystem(); 
      };
    }
    
    this.uiManager.onWorldSizeSelected = (size) => this.switchToBuildMode(size);
    this.uiManager.onSkinBuilderClick = () => this.switchToSkinBuilderMode();
    this.uiManager.onPrefabBuilderClick = () => this.switchToPrefabBuilderMode();
    this.uiManager.onPartBuilderClick = () => this.switchToPartBuilderMode();
    
    this.uiManager.onPlayClick = () => this.uiManager.showDiscoverPanel('worlds');
    this.uiManager.onDiscoverClick = () => this.uiManager.showDiscoverPanel('skins');
    
    this.uiManager.onSkinSelect = async (skinId, skinName, thumbnail, ownerId) => {
        const myId = parseInt(localStorage.getItem('bsp_clone_user_id') || "0");

        if (ownerId && ownerId !== myId) {
            this.uiManager.showMessage("To nie Twój skin! (Tryb podglądu)", "info");
            return;
        }

        const blocksData = await SkinStorage.loadSkinData(skinId);
        if (blocksData) {
            this.characterManager.applySkin(blocksData);
            SkinStorage.setLastUsedSkinId(skinId);
            this.uiManager.updatePlayerAvatar(thumbnail);
            this.uiManager.uploadSkinThumbnail(thumbnail);
            if (this.multiplayerManager && this.multiplayerManager.ws) {
                this.multiplayerManager.ws.send(JSON.stringify({ type: 'mySkin', skinData: blocksData }));
            }
            this.uiManager.showMessage(`Założono skina: ${skinName}`, 'success');
        } else {
            this.uiManager.showMessage("Błąd pobierania skina.", "error");
        }
    };

    this.uiManager.onWorldSelect = async (worldItem) => {
        if (!worldItem.id) return;
        const worldData = await WorldStorage.loadWorldData(worldItem.id);
        if (worldData) {
            worldData.id = worldItem.id; 
            this.loadAndExploreWorld(worldData);
        } else {
            this.uiManager.showMessage("Błąd świata.", "error");
        }
    };

    this.uiManager.onEditNexusClick = () => {
         this.gameState = 'BuildMode';
         this.toggleMainUI(false);
         this.toggleMobileControls(false);
         this.buildManager.enterBuildMode(64, true);
    };

    this.uiManager.onPlayerAvatarClick = () => this.showPlayerPreview();
    this.uiManager.onShopOpen = () => this.populateShopUI();
    
    // ZMIENIONA OBSŁUGA KUPNA
    this.uiManager.onBuyBlock = async (block) => this.handleBuyBlock(block);
    
    this.uiManager.onToggleFPS = () => this.toggleFPSCounter();
    
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.onclick = () => this.logout();
    }
    
    const coinAddBtn = document.getElementById('coin-add-btn');
    if (coinAddBtn) {
        coinAddBtn.onclick = () => {
            this.uiManager.showMessage("Funkcja doładowania monet jest w przygotowaniu!", "info");
        };
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

    this.sceneManager = new SceneManager(this.scene, this.loadingManager);
    await this.sceneManager.initialize();
    
    this.characterManager = new CharacterManager(this.scene);
    this.characterManager.loadCharacter();
    
    const lastSkinId = SkinStorage.getLastUsedSkinId();
    if (lastSkinId) {
        const blocksData = await SkinStorage.loadSkinData(lastSkinId);
        if (blocksData) {
            this.characterManager.applySkin(blocksData);
        }
    }

    this.recreatePlayerController(this.sceneManager.collidableObjects);
    this.cameraController = new ThirdPersonCameraController(this.camera, this.characterManager.character, this.renderer.domElement, {
      distance: 5,
      height: 2, 
      rotationSpeed: 0.005,
      floorY: this.sceneManager.FLOOR_TOP_Y
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
    this.toggleMobileControls(false);
    this.buildManager.enterBuildMode(size);
  }

  switchToSkinBuilderMode() {
    if (this.gameState !== 'MainMenu') return;
    this.gameState = 'SkinBuilderMode';
    this.toggleMainUI(false);
    this.toggleMobileControls(false);
    this.skinBuilderManager.enterBuildMode();
  }

  switchToPrefabBuilderMode() {
    if (this.gameState !== 'MainMenu') return;
    this.gameState = 'PrefabBuilderMode';
    this.toggleMainUI(false);
    this.toggleMobileControls(false);
    this.prefabBuilderManager.enterBuildMode();
  }

  switchToPartBuilderMode() {
    if (this.gameState !== 'MainMenu') return;
    this.gameState = 'PartBuilderMode';
    this.toggleMainUI(false);
    this.toggleMobileControls(false);
    this.partBuilderManager.enterBuildMode();
  }
  
  switchToMainMenu() {
    if (this.gameState === 'MainMenu') return;
    
    if (this.gameState === 'ExploreMode') {
        if (this.multiplayerManager) {
            this.multiplayerManager.joinWorld('nexus');
            this.multiplayerManager.setScene(this.scene);
        }
        
        this.scene.add(this.characterManager.character);
        this.characterManager.character.position.set(0, 5, 0); 
        document.getElementById('explore-exit-button').style.display = 'none';
    } else {
        if (this.gameState === 'BuildMode') this.buildManager.exitBuildMode();
        else if (this.gameState === 'SkinBuilderMode') this.skinBuilderManager.exitBuildMode();
        else if (this.gameState === 'PrefabBuilderMode') this.prefabBuilderManager.exitBuildMode();
        else if (this.gameState === 'PartBuilderMode') this.partBuilderManager.exitBuildMode();
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

  loadAndExploreWorld(worldData) {
    if (!worldData) return;

    let worldBlocksData;
    let worldSize;
    
    if (Array.isArray(worldData)) {
        worldBlocksData = worldData;
        worldSize = 64;
    } else {
        worldBlocksData = worldData.blocks || [];
        worldSize = worldData.size || 64;
    }
    
    if (this.multiplayerManager && worldData.id) {
        this.multiplayerManager.joinWorld(worldData.id);
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
    
    if(this.multiplayerManager) {
        this.multiplayerManager.setScene(this.exploreScene);
    }

    this.recreatePlayerController(allCollidables);
    this.cameraController.enabled = true;
  }

  // --- NOWA OBSŁUGA KUPNA ---
  async handleBuyBlock(block) {
    const result = await this.blockManager.buyBlock(block.name, block.cost);
    
    if (result.success) {
        this.uiManager.showMessage(`Kupiono: ${block.name}!`, 'success');
        this.coinManager.updateBalance(result.newBalance); // Aktualizuj monety na kliencie
        this.populateShopUI(); // Odśwież sklep
    } else {
        this.uiManager.showMessage(result.message || "Błąd zakupu", 'error');
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

    if (this.gameState === 'MainMenu' || this.gameState === 'ExploreMode') {
        if(this.playerController && this.cameraController) {
            const rot = this.cameraController.update(deltaTime);
            this.playerController.update(deltaTime, rot);
        }
        if (this.characterManager) this.characterManager.update(deltaTime);
        if (this.multiplayerManager) this.multiplayerManager.update(deltaTime);
        if (this.coinManager) this.coinManager.update(deltaTime);
        
        const targetScene = (this.gameState === 'ExploreMode') ? this.exploreScene : this.scene;
        this.renderer.render(targetScene, this.camera);
        this.css2dRenderer.render(targetScene, this.camera);

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