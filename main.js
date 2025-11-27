import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';

// --- MODUŁY SYSTEMOWE ---
import { STORAGE_KEYS } from './Config.js';
import { GameCore } from './GameCore.js';
import { AuthManager } from './AuthManager.js';
import { AssetLoader } from './AssetLoader.js';
import { GameStateManager } from './GameStateManager.js';

// --- MANAGERY GRY ---
import { BlockManager } from './BlockManager.js';
import { UIManager } from './ui.js';
import { SceneManager } from './scene.js';
import { CharacterManager } from './character.js';
import { CoinManager } from './CoinManager.js';
import { MultiplayerManager } from './multiplayer.js';
import { PlayerController, ThirdPersonCameraController } from './controls.js';

// --- MANAGERY BUDOWANIA ---
import { BuildManager } from './BuildManager.js';
import { SkinBuilderManager } from './SkinBuilderManager.js';
import { PrefabBuilderManager } from './PrefabBuilderManager.js';
import { HyperCubePartBuilderManager } from './HyperCubePartBuilderManager.js';

// --- STORAGE ---
import { SkinStorage } from './SkinStorage.js';
import { WorldStorage } from './WorldStorage.js';

class BlockStarPlanetGame {
  constructor() {
    console.log("Uruchamianie silnika gry...");

    // 1. Inicjalizacja Rdzenia
    this.core = new GameCore('gameContainer');

    // 2. Inicjalizacja Managerów
    this.blockManager = new BlockManager();
    
    this.ui = new UIManager((msg) => {
        if (this.multiplayer) this.multiplayer.sendMessage({ type: 'chatMessage', text: msg });
    });

    this.stateManager = new GameStateManager(this.core, this.ui);
    
    this.auth = new AuthManager(this.startGame.bind(this));
    this.loader = new AssetLoader(this.blockManager, this.onAssetsLoaded.bind(this));

    // 3. Statystyki FPS
    this.setupStats();

    // 4. START APLIKACJI
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Ładujemy definicje bloków
    this.blockManager.load();
    
    // Rozpoczynamy ładowanie tekstur
    // Fail-safe: Jeśli assety nie załadują się w 5 sekund, wymuś start
    this.loader.preload();
    setTimeout(() => {
        if (document.getElementById('loading-screen').style.display !== 'none') {
            console.warn("Wymuszanie startu po timeout...");
            this.onAssetsLoaded();
        }
    }, 5000);
  }

  // KROK 1: Zasoby załadowane -> UI i Sesja
  onAssetsLoaded() {
      console.log("Zasoby załadowane. Sprawdzanie sesji...");
      this.ui.initialize(this.isMobile);
      this.auth.checkSession(this.ui);
  }

  // KROK 2: Użytkownik zalogowany -> Start Gry
  async startGame(user, token, thumbnail) {
      console.log("Start gry dla:", user.username);
      
      localStorage.setItem(STORAGE_KEYS.PLAYER_NAME, user.username);
      localStorage.setItem(STORAGE_KEYS.JWT_TOKEN, token);
      localStorage.setItem(STORAGE_KEYS.USER_ID, user.id);

      this.ui.updatePlayerName(user.username);
      if (thumbnail) this.ui.updatePlayerAvatar(thumbnail);
      this.ui.checkAdminPermissions(user.username);
      this.ui.loadFriendsData();

      if (user.ownedBlocks) {
          this.blockManager.setOwnedBlocks(user.ownedBlocks);
      }

      document.querySelector('.ui-overlay').style.display = 'block';

      // --- ŚWIAT ---
      this.sceneManager = new SceneManager(this.core.scene, this.loader.getLoadingManager());
      await this.sceneManager.initialize();

      // --- POSTAĆ ---
      this.characterManager = new CharacterManager(this.core.scene);
      this.characterManager.loadCharacter();
      
      const lastSkinId = SkinStorage.getLastUsedSkinId();
      if (lastSkinId) {
          SkinStorage.loadSkinData(lastSkinId).then(data => {
              if(data) this.characterManager.applySkin(data);
          });
      }

      this.coinManager = new CoinManager(this.core.scene, this.ui, this.characterManager.character, user.coins);

      // --- MULTIPLAYER ---
      this.multiplayer = new MultiplayerManager(
          this.core.scene, 
          this.ui, 
          this.sceneManager, 
          this.characterManager.materialsCache, 
          this.coinManager
      );
      this.multiplayer.initialize(token);
      this.setupMultiplayerCallbacks();

      // --- KONTROLERY ---
      this.recreatePlayerController(this.sceneManager.collidableObjects);
      
      this.cameraController = new ThirdPersonCameraController(
          this.core.camera, 
          this.characterManager.character, 
          this.core.renderer.domElement, 
          { distance: 5, height: 2, floorY: this.sceneManager.FLOOR_TOP_Y }
      );
      this.cameraController.setIsMobile(this.isMobile);

      // --- BUILDERY ---
      const loadingManager = this.loader.getLoadingManager();
      this.buildManager = new BuildManager(this, loadingManager, this.blockManager);
      this.skinBuilderManager = new SkinBuilderManager(this, loadingManager, this.blockManager);
      this.prefabBuilderManager = new PrefabBuilderManager(this, loadingManager, this.blockManager);
      this.partBuilderManager = new HyperCubePartBuilderManager(this, loadingManager, this.blockManager);

      // --- STATE MANAGER CONFIG ---
      this.stateManager.setManagers({
          playerController: this.playerController,
          cameraController: this.cameraController,
          character: this.characterManager,
          multiplayer: this.multiplayer,
          coin: this.coinManager,
          build: this.buildManager,
          skinBuild: this.skinBuilderManager,
          prefabBuild: this.prefabBuilderManager,
          partBuild: this.partBuilderManager
      });

      this.setupUIActions();

      this.stateManager.switchToMainMenu();
      this.animate();
      
      this.setupPositionUpdateLoop();
      console.log('Gra uruchomiona pomyślnie!');
  }

  setupStats() {
      const fpsPref = localStorage.getItem(STORAGE_KEYS.FPS_ENABLED) === 'true';
      if (fpsPref) {
          this.isFPSEnabled = true;
          this.stats.dom.style.display = 'block';
      }
      this.ui.onToggleFPS = () => {
          this.isFPSEnabled = !this.isFPSEnabled;
          this.stats.dom.style.display = this.isFPSEnabled ? 'block' : 'none';
          this.ui.updateFPSToggleText(this.isFPSEnabled);
          localStorage.setItem(STORAGE_KEYS.FPS_ENABLED, this.isFPSEnabled.toString());
      };
      this.ui.updateFPSToggleText(this.isFPSEnabled);
  }

  setupMultiplayerCallbacks() {
      this.ui.onSendPrivateMessage = (recipient, text) => this.multiplayer.sendPrivateMessage(recipient, text);
      this.coinManager.onCollect = () => this.multiplayer.sendMessage({ type: 'collectCoin' });
      
      const originalHandle = this.multiplayer.handleMessage.bind(this.multiplayer);
      this.multiplayer.handleMessage = (msg) => {
          originalHandle(msg);
          if (msg.type === 'friendRequestReceived') { this.ui.showMessage(`Zaproszenie od ${msg.from}!`, 'info'); this.ui.loadFriendsData(); }
          if (msg.type === 'friendRequestAccepted') { this.ui.showMessage(`${msg.by} przyjął zaproszenie!`, 'success'); this.ui.loadFriendsData(); }
          if (msg.type === 'friendStatusChange') this.ui.loadFriendsData();
          if (msg.type === 'privateMessageSent' && this.ui.onMessageSent) this.ui.onMessageSent(msg);
          if (msg.type === 'privateMessageReceived' && this.ui.onMessageReceived) this.ui.onMessageReceived(msg);
      };
  }

  setupUIActions() {
      this.ui.onWorldSizeSelected = (size) => this.stateManager.switchToBuildMode(size);
      this.ui.onSkinBuilderClick = () => this.stateManager.switchToSkinBuilder();
      this.ui.onPrefabBuilderClick = () => this.stateManager.switchToPrefabBuilder();
      this.ui.onPartBuilderClick = () => this.stateManager.switchToPartBuilder();
      
      this.ui.onPlayClick = () => this.ui.showDiscoverPanel('worlds');
      this.ui.onDiscoverClick = () => this.ui.showDiscoverPanel('skins');
      
      this.ui.onWorldSelect = async (worldItem) => {
          if (!worldItem.id) return;
          const worldData = await WorldStorage.loadWorldData(worldItem.id);
          if (worldData) {
              worldData.id = worldItem.id;
              this.loadAndExploreWorld(worldData);
          } else {
              this.ui.showMessage("Błąd świata.", "error");
          }
      };

      this.ui.onBuyBlock = async (block) => {
          const result = await this.blockManager.buyBlock(block.name, block.cost);
          if(result.success) {
              this.ui.showMessage(`Kupiono: ${block.name}!`, 'success');
              this.coinManager.updateBalance(result.newBalance);
              this.ui.populateShopUI();
          } else {
              this.ui.showMessage(result.message, 'error');
          }
      };

      this.ui.onSkinSelect = async (skinId, skinName, thumbnail, ownerId) => {
          const myId = parseInt(localStorage.getItem(STORAGE_KEYS.USER_ID) || "0");
          if (ownerId && ownerId !== myId) { this.ui.showMessage("Tryb podglądu.", "info"); return; }
          
          const data = await SkinStorage.loadSkinData(skinId);
          if (data) {
              this.characterManager.applySkin(data);
              SkinStorage.setLastUsedSkinId(skinId);
              this.ui.updatePlayerAvatar(thumbnail);
              this.multiplayer.sendMessage({ type: 'mySkin', skinData: data });
              this.ui.showMessage(`Założono: ${skinName}`, 'success');
          }
      };
      
      this.ui.onEditNexusClick = () => this.stateManager.switchToBuildMode(64);
      this.ui.onShopOpen = () => this.ui.populateShop(
          this.blockManager.getAllBlockDefinitions(),
          (name) => this.blockManager.isOwned(name)
      );
  }

  recreatePlayerController(collidables) {
      if(this.playerController) this.playerController.destroy();
      this.playerController = new PlayerController(this.characterManager.character, collidables, {
          moveSpeed: 8, jumpForce: 18, gravity: 50, groundRestingY: this.sceneManager.FLOOR_TOP_Y
      });
      this.playerController.setIsMobile(this.isMobile);
  }

  setupPositionUpdateLoop() {
      if (this.positionUpdateInterval) clearInterval(this.positionUpdateInterval);
      this.positionUpdateInterval = setInterval(() => {
        if ((this.stateManager.currentState === 'MainMenu' || this.stateManager.currentState === 'ExploreMode') && 
            this.characterManager && this.characterManager.character) {
          if(this.multiplayer) {
              this.multiplayer.sendMyPosition(
                this.characterManager.character.position,
                this.characterManager.character.quaternion
              );
          }
        }
      }, 50); 
  }

  // --- ŁADOWANIE OBCYCH ŚWIATÓW (Tutaj main.js buduje, a StateManager wyświetla) ---
  loadAndExploreWorld(worldData) {
      const worldBlocksData = Array.isArray(worldData) ? worldData : (worldData.blocks || []);
      const worldSize = Array.isArray(worldData) ? 64 : (worldData.size || 64);
      
      // Multiplayer: Dołącz do pokoju świata
      if (this.multiplayer && worldData.id) {
          this.multiplayer.joinWorld(worldData.id);
      }

      // Tworzenie sceny
      const exploreScene = new THREE.Scene();
      exploreScene.background = new THREE.Color(0x87CEEB);
      const ambient = new THREE.AmbientLight(0xffffff, 0.8);
      exploreScene.add(ambient);
      const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
      dirLight.position.set(20, 40, 20);
      exploreScene.add(dirLight);

      const allCollidables = [];
      const loader = this.loader.getTextureLoader();
      const materials = {};

      // Podłoga
      const floorGeo = new THREE.BoxGeometry(worldSize, 1, worldSize);
      const floorMat = new THREE.MeshLambertMaterial({ color: 0x559022 });
      const floor = new THREE.Mesh(floorGeo, floorMat);
      floor.position.y = -0.5;
      exploreScene.add(floor);
      allCollidables.push(floor);
      
      // Bariery
      const barrierHeight = 100;
      const half = worldSize / 2;
      const barrierMat = new THREE.MeshBasicMaterial({ visible: false });
      const w1 = new THREE.Mesh(new THREE.BoxGeometry(worldSize, barrierHeight, 1), barrierMat); w1.position.set(0, 50, half); exploreScene.add(w1); allCollidables.push(w1);
      const w2 = new THREE.Mesh(new THREE.BoxGeometry(worldSize, barrierHeight, 1), barrierMat); w2.position.set(0, 50, -half); exploreScene.add(w2); allCollidables.push(w2);
      const w3 = new THREE.Mesh(new THREE.BoxGeometry(1, barrierHeight, worldSize), barrierMat); w3.position.set(half, 50, 0); exploreScene.add(w3); allCollidables.push(w3);
      const w4 = new THREE.Mesh(new THREE.BoxGeometry(1, barrierHeight, worldSize), barrierMat); w4.position.set(-half, 50, 0); exploreScene.add(w4); allCollidables.push(w4);

      // Bloki
      const geometry = new THREE.BoxGeometry(1, 1, 1); 
      worldBlocksData.forEach(data => {
          if(data.texturePath) {
              let mat = materials[data.texturePath];
              if(!mat) {
                  const tex = loader.load(data.texturePath);
                  tex.magFilter = THREE.NearestFilter;
                  mat = new THREE.MeshLambertMaterial({ map: tex });
                  materials[data.texturePath] = mat;
              }
              const mesh = new THREE.Mesh(geometry, mat);
              mesh.position.set(data.x, data.y, data.z);
              exploreScene.add(mesh);
              allCollidables.push(mesh);
          }
      });

      // Gracz
      exploreScene.add(this.characterManager.character);
      if (worldData.spawnPoint) {
          this.characterManager.character.position.set(worldData.spawnPoint.x, worldData.spawnPoint.y, worldData.spawnPoint.z);
      } else {
          this.characterManager.character.position.set(0, 5, 0);
      }

      // Przełączenie w StateManagerze
      this.stateManager.switchToExploreMode(exploreScene);
      this.multiplayer.setScene(exploreScene);

      // Rekreacja kontrolera dla nowej sceny
      this.recreatePlayerController(allCollidables);
      this.stateManager.setManagers({ playerController: this.playerController });
      this.cameraController.enabled = true;
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    if (this.isFPSEnabled) this.stats.update();
    
    const delta = this.clock.getDelta();
    this.stateManager.update(delta); // Delegacja
    
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
    setTimeout(() => errorDiv.remove(), 5000);
  }
}

document.addEventListener('DOMContentLoaded', () => { new BlockStarPlanetGame(); });