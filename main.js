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

class BlockStarPlanetGame {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    this.quality = this.getQualityTier();
    console.log(`Wykryty poziom jakości: ${this.quality}`);

    this.renderer = new THREE.WebGLRenderer({ 
        antialias: this.quality === 'high'
    });
    
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

  getQualityTier() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const ram = navigator.deviceMemory || 2;

    if (isMobile && ram <= 4) {
      return 'low';
    }
    return 'high';
  }

  init() {
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

    this.loadingManager.onLoad = () => {
        if (this.initialLoadComplete) return;
        this.initialLoadComplete = true; 

        clearInterval(this.loadingTextInterval);
        loadingText.textContent = "Gotowe!";
        
        this.setupManagers();
        
        setTimeout(() => {
            if (loadingScreen) {
                loadingScreen.style.opacity = '0';
                setTimeout(() => { 
                    loadingScreen.style.display = 'none'; 
                    const playerName = localStorage.getItem(PLAYER_NAME_KEY);
                    if (playerName) {
                        this.uiManager.updatePlayerName(playerName);
                        this.startGame();
                    } else {
                        document.getElementById('name-input-panel').style.display = 'flex';
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
  
  startGame() {
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

    if (this.quality === 'high') {
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    document.getElementById('gameContainer').appendChild(this.renderer.domElement);
    this.css2dRenderer.setSize(window.innerWidth, window.innerHeight);
    this.css2dRenderer.domElement.style.position = 'absolute';
    this.css2dRenderer.domElement.style.top = '0px';
    this.css2dRenderer.domElement.style.pointerEvents = 'none';
    document.getElementById('gameContainer').appendChild(this.css2dRenderer.domElement);
  }

  setupManagers() {
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
    this.uiManager.onNameSubmit = (name) => {
        localStorage.setItem(PLAYER_NAME_KEY, name);
        this.uiManager.updatePlayerName(name);
        this.startGame();
        if (this.multiplayerManager) {
            this.multiplayerManager.sendMessage({ type: 'setNickname', nickname: name });
        }
    };

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

    this.sceneManager = new SceneManager(this.scene, this.quality);
    this.sceneManager.initialize();
    
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
    
    this.multiplayerManager = new MultiplayerManager(this.scene, this.uiManager, this.sceneManager);
    this.multiplayerManager.initialize();

    this.coinManager = new CoinManager(this.scene, this.uiManager, this.characterManager.character);
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
    // ... (bez zmian)
  }

  handleBuyBlock(block) {
    // ... (bez zmian)
  }

  populateShopUI() {
    // ... (bez zmian)
  }

  setupPreviewScene() {
    // ... (bez zmian)
  }

  showPlayerPreview() {
    // ... (bez zmian)
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
