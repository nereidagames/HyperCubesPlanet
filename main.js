import * as THREE from 'three';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { PlayerController, ThirdPersonCameraController } from './controls.js';
import { CharacterManager } from './character.js';
import { SceneManager } from './scene.js';
import { UIManager } from './ui.js';
import { MultiplayerManager } from './multiplayer.js';
import { BuildManager } from './BuildManager.js';
import { WorldStorage } from './WorldStorage.js';
import { CoinManager } from './CoinManager.js'; // POPRAWKA: Dodano import CoinManagera

class BlockStarPlanetGame {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.css2dRenderer = new CSS2DRenderer();
    this.playerController = null;
    this.characterManager = null;
    this.cameraController = null;
    this.coinManager = null; // POPRAWKA: Dodano właściwość dla CoinManagera
    this.gameState = 'MainMenu';
    this.buildManager = null;
    this.exploreScene = null;
    this.isMobile = this.detectMobileDevice();
    this.setupRenderer();
    this.init();
  }

  async init() {
    try {
      await this.setupManagers();
      this.animate();
      console.log('Game initialized successfully!');
      const loadingScreen = document.getElementById('loading-screen');
      if (loadingScreen) {
        loadingScreen.style.opacity = '0';
        setTimeout(() => { loadingScreen.style.display = 'none'; }, 500);
      }
    } catch (error) {
      console.error('CRITICAL: Error initializing game:', error);
      this.showError('Krytyczny błąd podczas ładowania gry.');
    }
  }

  detectMobileDevice() { return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent); }

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
    this.uiManager = new UIManager(
      (message) => { if (this.characterManager) this.characterManager.displayChatBubble(message); },
      async (modelType) => {
        await this.characterManager.changeCharacter(modelType);
        if(this.playerController) {
          this.playerController.groundRestingY = this.characterManager.currentGroundRestingY;
          this.playerController.player = this.characterManager.character;
        }
        if(this.cameraController) this.cameraController.target = this.characterManager.character;
      }
    );
    this.uiManager.initialize(this.isMobile);
    this.uiManager.onBuildClick = () => this.switchToBuildMode();
    this.uiManager.onDiscoverClick = () => this.showDiscoverPanel();
    this.buildManager = new BuildManager(this);
    this.sceneManager = new SceneManager(this.scene);
    await this.sceneManager.initialize();
    this.characterManager = new CharacterManager(this.scene);
    await this.characterManager.loadCharacter('cube');
    this.recreatePlayerController(this.sceneManager.collidableObjects);
    this.cameraController = new ThirdPersonCameraController(this.camera, this.characterManager.character, this.renderer.domElement, {
      distance: 15, height: 7, rotationSpeed: 0.005
    });
    this.cameraController.setIsMobile(this.isMobile);
    this.multiplayerManager = new MultiplayerManager(this.scene, this.uiManager);
    await this.multiplayerManager.initialize();
    
    // POPRAWKA: Inicjalizacja CoinManagera
    this.coinManager = new CoinManager(this.scene, this.uiManager, this.characterManager.character);
  }
  
  switchToBuildMode() {
    if (this.gameState === 'BuildMode') return;
    this.gameState = 'BuildMode';
    if(this.playerController) { this.playerController.destroy(); this.playerController = null; }
    if(this.cameraController) { this.cameraController.destroy(); this.cameraController = null; }
    document.querySelector('.ui-overlay').style.display = 'none';
    this.buildManager.enterBuildMode();
  }
  
  switchToMainMenu() {
    if (this.gameState === 'MainMenu') return;
    if (this.gameState === 'BuildMode') this.buildManager.exitBuildMode();
    else if (this.gameState === 'ExploreMode') {
      if(this.playerController) this.playerController.destroy();
      this.playerController = null;
      this.exploreScene = null;
      this.scene.add(this.characterManager.character);
    }
    this.gameState = 'MainMenu';
    document.querySelector('.ui-overlay').style.display = 'block';
    this.recreatePlayerController(this.sceneManager.collidableObjects);
    if (!this.cameraController) {
        this.cameraController = new ThirdPersonCameraController(this.camera, this.characterManager.character, this.renderer.domElement, {
            distance: 15, height: 7, rotationSpeed: 0.005
        });
        this.cameraController.setIsMobile(this.isMobile);
    } else {
        this.cameraController.target = this.characterManager.character;
    }
  }
  
  recreatePlayerController(collidables) {
      if(this.playerController) this.playerController.destroy();
      this.playerController = new PlayerController(this.characterManager.character, collidables, {
          moveSpeed: 8, jumpForce: 12, gravity: 25,
          groundRestingY: this.characterManager.currentGroundRestingY
      });
      this.playerController.setIsMobile(this.isMobile);
  }

  showDiscoverPanel() {
    const panel = document.getElementById('discover-panel');
    const list = document.getElementById('discover-list');
    const closeButton = document.getElementById('discover-close-button');
    list.innerHTML = '';
    const savedWorlds = WorldStorage.getSavedWorldsList();
    if (savedWorlds.length === 0) {
      list.innerHTML = '<p style="text-align: center;">Nie masz zapisanych światów!</p>';
    } else {
      savedWorlds.forEach(worldName => {
        const item = document.createElement('div');
        item.className = 'world-item';
        item.textContent = worldName;
        item.onclick = () => { panel.style.display = 'none'; this.loadAndExploreWorld(worldName); };
        list.appendChild(item);
      });
    }
    closeButton.onclick = () => { panel.style.display = 'none'; };
    panel.style.display = 'flex';
  }

  loadAndExploreWorld(worldName) {
    const worldData = WorldStorage.loadWorld(worldName);
    if (!worldData) { alert(`Nie udało się wczytać świata: ${worldName}`); return; }
    if(this.playerController) { this.playerController.destroy(); this.playerController = null; }
    if(this.cameraController) { this.cameraController.destroy(); this.cameraController = null; }

    this.gameState = 'ExploreMode';
    this.exploreScene = new THREE.Scene();
    this.exploreScene.background = new THREE.Color(0x87CEEB);
    
    // POPRAWKA: Dodanie oświetlenia do sceny eksploracji
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.exploreScene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(20, 30, 20);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.exploreScene.add(directionalLight);

    const worldBlocks = [];
    const textureLoader = new THREE.TextureLoader();
    const loadedMaterials = {};

    worldData.forEach(blockData => {
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
        
        // POPRAWKA: Włączenie cieni dla załadowanych bloków
        block.castShadow = true;
        block.receiveShadow = true;
        
        this.exploreScene.add(block);
        worldBlocks.push(block);
      }
    });

    this.exploreScene.add(this.characterManager.character);
    this.characterManager.character.position.set(0, 5, 0);
    this.recreatePlayerController(worldBlocks);
    
    this.cameraController = new ThirdPersonCameraController(this.camera, this.characterManager.character, this.renderer.domElement, {
        distance: 15, height: 7, rotationSpeed: 0.005
    });
    this.cameraController.setIsMobile(this.isMobile);

    document.querySelector('.ui-overlay').style.display = 'none';
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    const deltaTime = 0.016;
    
    if (this.gameState === 'MainMenu' && this.playerController && this.cameraController) {
      const rot = this.cameraController.update(deltaTime);
      this.playerController.update(deltaTime, this.cameraController.rotation.y || rot);
      if (this.characterManager) this.characterManager.update(deltaTime);
      if (this.multiplayerManager) this.multiplayerManager.update(deltaTime, this.characterManager.character);
      if (this.coinManager) this.coinManager.update(deltaTime); // POPRAWKA: Aktualizacja CoinManagera
      this.renderer.render(this.scene, this.camera);
      this.css2dRenderer.render(this.scene, this.camera);
    } else if (this.gameState === 'BuildMode' && this.buildManager) {
      this.buildManager.update(deltaTime);
      this.renderer.render(this.buildManager.scene, this.camera);
    } else if (this.gameState === 'ExploreMode' && this.playerController && this.cameraController) {
      const rot = this.cameraController.update(deltaTime);
      this.playerController.update(deltaTime, this.cameraController.rotation.y || rot);
      if (this.characterManager) this.characterManager.update(deltaTime);
      this.renderer.render(this.exploreScene, this.camera);
    }
  }
  
  showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #e74c3c; color: white; padding: 20px; border-radius: 10px; font-family: Arial, sans-serif; font-weight: bold; z-index: 10000;`;
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
  }
}

document.addEventListener('DOMContentLoaded', () => { new BlockStarPlanetGame(); });