import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';

// --- NOWE MODUŁY ---
import { STORAGE_KEYS } from './Config.js';
import { GameCore } from './GameCore.js';
import { AuthManager } from './AuthManager.js';
import { AssetLoader } from './AssetLoader.js';
import { GameStateManager } from './GameStateManager.js';

// --- ISTNIEJĄCE MANAGERY ---
import { BlockManager } from './BlockManager.js';
import { UIManager } from './ui.js';
import { SceneManager } from './scene.js';
import { CharacterManager } from './character.js';
import { CoinManager } from './CoinManager.js';
import { MultiplayerManager } from './multiplayer.js';
import { PlayerController, ThirdPersonCameraController } from './controls.js';

// --- BUILDERY ---
import { BuildManager } from './BuildManager.js';
import { SkinBuilderManager } from './SkinBuilderManager.js';
import { PrefabBuilderManager } from './PrefabBuilderManager.js';
import { HyperCubePartBuilderManager } from './HyperCubePartBuilderManager.js';

// --- STORAGE ---
import { SkinStorage } from './SkinStorage.js';
import { WorldStorage } from './WorldStorage.js';

class BlockStarPlanetGame {
  constructor() {
    // 1. Inicjalizacja Rdzenia (Scena, Kamera, Renderer)
    this.core = new GameCore('gameContainer');
    
    // 2. Inicjalizacja kluczowych systemów
    this.blockManager = new BlockManager();
    this.ui = new UIManager((msg) => {
        if (this.multiplayer) this.multiplayer.sendMessage({ type: 'chatMessage', text: msg });
    });
    
    this.stateManager = new GameStateManager(this.core, this.ui);
    this.auth = new AuthManager(this.startGame.bind(this));
    this.loader = new AssetLoader(this.blockManager, this.initGame.bind(this));

    // 3. Statystyki FPS
    this.stats = new Stats();
    this.stats.dom.style.left = '10px';
    this.stats.dom.style.top = '100px';
    this.stats.dom.style.display = 'none';
    document.body.appendChild(this.stats.dom);

    // 4. Start ładowania
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    this.blockManager.load();
    this.loader.preload(); // Uruchamia ekran ładowania
  }

  // Wywoływane przez AssetLoader po załadowaniu tekstur
  initGame() {
      this.auth.checkSession(this.ui);
  }

  // Wywoływane przez AuthManager po zalogowaniu
  async startGame(user, token, thumbnail) {
      console.log("Start gry dla:", user.username);
      
      // Zapisz sesję
      localStorage.setItem(STORAGE_KEYS.PLAYER_NAME, user.username);
      localStorage.setItem(STORAGE_KEYS.JWT_TOKEN, token);
      localStorage.setItem(STORAGE_KEYS.USER_ID, user.id);

      // Skonfiguruj UI
      this.ui.initialize(this.isMobile);
      this.ui.updatePlayerName(user.username);
      this.ui.checkAdminPermissions(user.username);
      if (thumbnail) this.ui.updatePlayerAvatar(thumbnail);
      if (user.ownedBlocks) this.blockManager.setOwnedBlocks(user.ownedBlocks);

      // Skonfiguruj FPS
      const fpsPref = localStorage.getItem(STORAGE_KEYS.FPS_ENABLED) === 'true';
      this.stats.dom.style.display = fpsPref ? 'block' : 'none';
      this.ui.onToggleFPS = () => {
          const visible = (this.stats.dom.style.display === 'none');
          this.stats.dom.style.display = visible ? 'block' : 'none';
          this.ui.updateFPSToggleText(visible);
          localStorage.setItem(STORAGE_KEYS.FPS_ENABLED, visible.toString());
      };
      this.ui.updateFPSToggleText(fpsPref);

      // --- INICJALIZACJA ŚWIATA I POSTACI ---
      this.sceneManager = new SceneManager(this.core.scene, this.loader.getLoadingManager());
      await this.sceneManager.initialize();

      this.characterManager = new CharacterManager(this.core.scene);
      this.characterManager.loadCharacter();
      
      // Załaduj skin gracza
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
      
      // Podpięcie callbacków Multiplayer <-> UI
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

      // --- MANAGERY BUDOWANIA ---
      // Przekazujemy "this.core.camera" i renderer, bo BuildManager używa ich do raycastingu
      // Ale uwaga: BuildManager tworzy WŁASNĄ scenę.
      this.buildManager = new BuildManager(this, this.loader.getLoadingManager(), this.blockManager);
      this.skinBuilderManager = new SkinBuilderManager(this, this.loader.getLoadingManager(), this.blockManager);
      this.prefabBuilderManager = new PrefabBuilderManager(this, this.loader.getLoadingManager(), this.blockManager);
      this.partBuilderManager = new HyperCubePartBuilderManager(this, this.loader.getLoadingManager(), this.blockManager);

      // --- PRZEKAZANIE DO STATE MANAGERA ---
      // To jest kluczowe: StateManager musi mieć dostęp do wszystkiego
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

      // Callback dla StateManagera, żeby mógł resetować kontroler przy zmianie świata
      this.stateManager.onRecreateController = (collidables) => {
          const targetCollidables = collidables || this.sceneManager.collidableObjects;
          this.recreatePlayerController(targetCollidables);
          // Aktualizuj referencję w StateManagerze
          this.stateManager.setManagers({ playerController: this.playerController });
      };

      // --- PODPIĘCIE PRZYCISKÓW UI ---
      this.setupUIActions();

      // Start pętli
      this.stateManager.switchToMainMenu();
      this.animate();
  }

  setupMultiplayerCallbacks() {
      this.ui.onSendPrivateMessage = (recipient, text) => this.multiplayer.sendPrivateMessage(recipient, text);
      this.coinManager.onCollect = () => this.multiplayer.sendMessage({ type: 'collectCoin' });
      
      // Nadpisanie handleMessage w Multiplayerze, aby obsłużyć UI
      const originalHandle = this.multiplayer.handleMessage.bind(this.multiplayer);
      this.multiplayer.handleMessage = (msg) => {
          originalHandle(msg);
          if (msg.type === 'friendRequestReceived') { this.ui.showMessage(`Zaproszenie od ${msg.from}!`, 'info'); this.ui.loadFriendsData(); }
          if (msg.type === 'friendRequestAccepted') { this.ui.showMessage(`${msg.by} przyjął zaproszenie!`, 'success'); this.ui.loadFriendsData(); }
          if (msg.type === 'friendStatusChange') this.ui.loadFriendsData();
          if (msg.type === 'privateMessageSent' && this.ui.onMessageSent) this.ui.onMessageSent(msg);
          if (msg.type === 'privateMessageReceived' && this.ui.onMessageReceived) this.ui.onMessageReceived(msg);
      };
      
      // Pętla wysyłania pozycji (tylko w trybie gry)
      setInterval(() => {
          if ((this.stateManager.currentState === 'MainMenu' || this.stateManager.currentState === 'ExploreMode') && 
              this.characterManager && this.characterManager.character) {
              this.multiplayer.sendMyPosition(
                  this.characterManager.character.position,
                  this.characterManager.character.quaternion
              );
          }
      }, 50);
  }

  setupUIActions() {
      this.ui.onWorldSizeSelected = (size) => this.stateManager.switchToBuildMode(size);
      this.ui.onSkinBuilderClick = () => this.stateManager.switchToSkinBuilder();
      this.ui.onPrefabBuilderClick = () => this.stateManager.switchToPrefabBuilder();
      this.ui.onPartBuilderClick = () => this.stateManager.switchToPartBuilder();
      
      this.ui.onPlayClick = () => this.ui.showDiscoverPanel('worlds');
      this.ui.onDiscoverClick = () => this.ui.showDiscoverPanel('skins');
      
      // Logika wyboru świata (Explore Mode)
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

      // Sklep i Skiny
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
              this.ui.uploadSkinThumbnail(thumbnail); // (Zakładając że metoda istnieje w UI, inaczej w API)
              this.multiplayer.sendMessage({ type: 'mySkin', skinData: data });
              this.ui.showMessage(`Założono: ${skinName}`, 'success');
          }
      };
      
      this.ui.onEditNexusClick = () => this.stateManager.switchToBuildMode(64); // Tryb Nexus (admin) obsługiwany w BuildManager
      
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

  // Ta funkcja musi zostać w main.js, bo tworzy nową scenę i spina wiele systemów
  loadAndExploreWorld(worldData) {
      this.stateManager.loadAndExploreWorld(worldData); // Ustawia flagi stanu

      // Logika tworzenia sceny świata (przeniesiona z starego main.js)
      const worldBlocksData = Array.isArray(worldData) ? worldData : (worldData.blocks || []);
      const worldSize = Array.isArray(worldData) ? 64 : (worldData.size || 64);
      
      const exploreScene = new THREE.Scene();
      exploreScene.background = new THREE.Color(0x87CEEB);
      const ambient = new THREE.AmbientLight(0xffffff, 0.8);
      exploreScene.add(ambient);
      const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
      dirLight.position.set(20, 40, 20);
      exploreScene.add(dirLight);

      // Generowanie podłogi i bloków
      const allCollidables = [];
      const loader = this.loader.getTextureLoader();
      const materials = {}; // Cache lokalny dla świata

      const floorGeo = new THREE.BoxGeometry(worldSize, 1, worldSize);
      const floorMat = new THREE.MeshLambertMaterial({ color: 0x559022 });
      const floor = new THREE.Mesh(floorGeo, floorMat);
      floor.position.y = -0.5;
      exploreScene.add(floor);
      allCollidables.push(floor);
      
      // Granice świata
      const barrierHeight = 100;
      const half = worldSize / 2;
      const barrierMat = new THREE.MeshBasicMaterial({ visible: false }); // Niewidzialne ściany
      const w1 = new THREE.Mesh(new THREE.BoxGeometry(worldSize, barrierHeight, 1), barrierMat); w1.position.set(0, 50, half); exploreScene.add(w1); allCollidables.push(w1);
      const w2 = new THREE.Mesh(new THREE.BoxGeometry(worldSize, barrierHeight, 1), barrierMat); w2.position.set(0, 50, -half); exploreScene.add(w2); allCollidables.push(w2);
      const w3 = new THREE.Mesh(new THREE.BoxGeometry(1, barrierHeight, worldSize), barrierMat); w3.position.set(half, 50, 0); exploreScene.add(w3); allCollidables.push(w3);
      const w4 = new THREE.Mesh(new THREE.BoxGeometry(1, barrierHeight, worldSize), barrierMat); w4.position.set(-half, 50, 0); exploreScene.add(w4); allCollidables.push(w4);

      // Bloki
      const geometry = new THREE.BoxGeometry(1, 1, 1); // Współdzielona geometria
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

      // Przeniesienie gracza
      exploreScene.add(this.characterManager.character);
      if (worldData.spawnPoint) {
          this.characterManager.character.position.set(worldData.spawnPoint.x, worldData.spawnPoint.y, worldData.spawnPoint.z);
      } else {
          this.characterManager.character.position.set(0, 5, 0);
      }

      // Aktualizacja referencji w StateManagerze
      this.stateManager.exploreScene = exploreScene;
      this.multiplayer.setScene(exploreScene);
      
      this.recreatePlayerController(allCollidables);
      // Aktualizuj kontroler w StateManagerze
      this.stateManager.setManagers({ playerController: this.playerController });
      
      this.cameraController.enabled = true;
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    if (this.isFPSEnabled) this.stats.update();
    
    const delta = this.clock.getDelta();
    this.stateManager.update(delta); // Delegacja do GameStateManagera
    
    // Preview postaci (UI)
    if (this.previewRenderer && document.getElementById('player-preview-panel').style.display === 'flex') {
      if (this.previewCharacter && !this.isPreviewDragging) {
        this.previewCharacter.rotation.y += 0.005;
      }
      this.previewRenderer.render(this.previewScene, this.previewCamera);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => { new BlockStarPlanetGame(); });