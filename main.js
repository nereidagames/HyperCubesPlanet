/* PLIK: main.js */
import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { createBaseCharacter } from './character.js';

import { STORAGE_KEYS } from './Config.js';
import { GameCore } from './GameCore.js';
import { AuthManager } from './AuthManager.js';
import { AssetLoader } from './AssetLoader.js';
import { GameStateManager } from './GameStateManager.js';
import { IntroManager } from './IntroManager.js'; // NOWOŚĆ: Import Intro

import { BlockManager } from './BlockManager.js';
import { UIManager } from './ui.js';
import { SceneManager } from './scene.js';
import { CharacterManager } from './character.js';
import { CoinManager } from './CoinManager.js';
import { MultiplayerManager } from './multiplayer.js';
import { PlayerController, ThirdPersonCameraController } from './controls.js';
import { ParkourManager } from './ParkourManager.js';

import { BuildManager } from './BuildManager.js';
import { SkinBuilderManager } from './SkinBuilderManager.js';
import { PrefabBuilderManager } from './PrefabBuilderManager.js';
import { HyperCubePartBuilderManager } from './HyperCubePartBuilderManager.js';

import { SkinStorage } from './SkinStorage.js';
import { WorldStorage } from './WorldStorage.js';

const API_BASE_URL = 'https://hypercubes-nexus-server.onrender.com';

class BlockStarPlanetGame {
  constructor() {
    console.log("Uruchamianie silnika gry...");
    this.isGameRunning = false; 

    this.core = new GameCore('gameContainer');
    this.scene = this.core.scene;
    this.camera = this.core.camera;
    this.renderer = this.core.renderer;
    this.css2dRenderer = this.core.css2dRenderer;

    this.blockManager = new BlockManager();
    
    // UI Manager
    this.ui = new UIManager((msg) => {
        if (this.multiplayer) this.multiplayer.sendMessage({ type: 'chatMessage', text: msg });
    });

    this.stateManager = new GameStateManager(this.core, this.ui);
    
    // AuthManager (tylko do sprawdzania sesji w tle, UI obsługuje IntroManager)
    this.auth = new AuthManager(this.startGame.bind(this));
    
    // IntroManager (Ekran logowania 3D)
    this.intro = new IntroManager(this.core, this.ui, this.startGame.bind(this));

    this.loader = new AssetLoader(this.blockManager, this.onAssetsLoaded.bind(this));

    this.stats = new Stats();
    this.stats.dom.style.display = 'none'; 
    document.body.appendChild(this.stats.dom);
    this.isFPSEnabled = false;
    this.setupStats();

    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    this.clock = new THREE.Clock();

    // Podgląd postaci w Menu (stary system, teraz używany w profilu gracza)
    this.previewScene = null;
    this.previewCamera = null;
    this.previewRenderer = null;
    this.previewCharacter = null;
    this.isPreviewDragging = false;
    this.previewMouseX = 0;

    this.blockManager.load();
    this.loader.preload();

    this.emergencyTimeout = setTimeout(() => {
        const loadingScreen = document.getElementById('loading-screen');
        if (!this.isGameRunning && loadingScreen && loadingScreen.style.display !== 'none' && loadingScreen.style.opacity !== '0') {
            console.warn("Timeout ładowania - wymuszanie startu...");
            this.onAssetsLoaded();
        }
    }, 8000);
  }

  onAssetsLoaded() {
      if (this.isGameRunning) return;
      this.isGameRunning = true;
      if (this.emergencyTimeout) clearTimeout(this.emergencyTimeout);

      console.log("Zasoby załadowane. Inicjalizacja UI...");
      
      try {
        this.ui.initialize(this.isMobile);

        // LOGIKA STARTOWA:
        const token = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
        if (token) {
            // Nadpisz zachowanie błędu sesji -> idź do Intro
            this.auth.showAuthScreen = () => {
                console.log("Sesja nieważna, uruchamianie Intro.");
                this.intro.start();
            };
            this.auth.checkSession(this.ui);
        } else {
            console.log("Brak tokenu, uruchamianie Intro.");
            this.intro.start();
        }

      } catch (e) {
          console.error("Błąd inicjalizacji UI:", e);
          this.intro.start();
      }
  }

  async startGame(user, token, thumbnail) {
      console.log("Start gry dla:", user.username);
      
      // 1. ZAMKNIJ INTRO I WYCZYŚĆ JEGO SCENĘ
      if (this.intro) {
          this.intro.dispose();
      }
      
      // CAŁKOWITE CZYSZCZENIE SCENY (Usuwamy światła z intro, dummy character itd.)
      while(this.scene.children.length > 0){ 
          this.scene.remove(this.scene.children[0]); 
      }
      
      localStorage.setItem(STORAGE_KEYS.PLAYER_NAME, user.username);
      localStorage.setItem(STORAGE_KEYS.JWT_TOKEN, token);
      localStorage.setItem(STORAGE_KEYS.USER_ID, user.id);

      // Aktualizacja HUD
      this.ui.updatePlayerName(user.username);
      if (thumbnail) this.ui.updatePlayerAvatar(thumbnail);
      this.ui.checkAdminPermissions(user.username);
      this.ui.loadFriendsData();

      if (user.level) {
          this.ui.updateLevelInfo(user.level, user.xp, user.maxXp || 100);
      }
      
      if (user.pendingXp) {
          this.ui.updatePendingRewards(user.pendingXp);
      }

      if (user.ownedBlocks) {
          this.blockManager.setOwnedBlocks(user.ownedBlocks);
      }

      document.querySelector('.ui-overlay').style.display = 'block';

      // 2. ŁADOWANIE NEXUSA (Właściwa gra)
      this.sceneManager = new SceneManager(this.scene, this.loader.getLoadingManager());
      try { await this.sceneManager.initialize(); } catch(e) { console.error(e); }

      this.characterManager = new CharacterManager(this.scene);
      this.characterManager.loadCharacter();
      
      // Bezpieczna pozycja
      const safeY = this.sceneManager.getSafeY(0, 0);
      this.characterManager.character.position.set(0, safeY + 2.0, 0);

      // Ładowanie skina (z currentSkinId zwróconego przez login/register)
      if (user.currentSkinId) {
          SkinStorage.loadSkinData(user.currentSkinId).then(data => { 
              if(data) this.characterManager.applySkin(data); 
          });
      } else {
          // Fallback lokalny (dla starych kont bez currentSkinId)
          const lastSkinId = SkinStorage.getLastUsedSkinId();
          if (lastSkinId) {
             SkinStorage.loadSkinData(lastSkinId).then(data => { 
                  if(data) this.characterManager.applySkin(data); 
             });
          }
      }

      this.coinManager = new CoinManager(this.scene, this.ui, this.characterManager.character, user.coins);

      this.multiplayer = new MultiplayerManager(this.scene, this.ui, this.sceneManager, this.characterManager.materialsCache, this.coinManager);
      this.multiplayer.initialize(token);
      this.setupMultiplayerCallbacks();

      // 3. KONTROLER Z GRID PARTITIONING
      this.recreatePlayerController(this.sceneManager.collidableObjects, this.sceneManager.collisionMap);
      
      this.cameraController = new ThirdPersonCameraController(
          this.camera, this.characterManager.character, this.core.renderer.domElement, 
          { distance: 5, height: 2, floorY: this.sceneManager.FLOOR_TOP_Y }
      );
      this.cameraController.setIsMobile(this.isMobile);

      const loadingManager = this.loader.getLoadingManager();
      this.buildManager = new BuildManager(this, loadingManager, this.blockManager);
      this.skinBuilderManager = new SkinBuilderManager(this, loadingManager, this.blockManager);
      this.prefabBuilderManager = new PrefabBuilderManager(this, loadingManager, this.blockManager);
      this.partBuilderManager = new HyperCubePartBuilderManager(this, loadingManager, this.blockManager);
      
      this.parkourManager = new ParkourManager(this, this.ui);

      this.stateManager.setManagers({
          playerController: this.playerController,
          cameraController: this.cameraController,
          character: this.characterManager,
          multiplayer: this.multiplayer,
          coin: this.coinManager,
          build: this.buildManager,
          skinBuild: this.skinBuilderManager,
          prefabBuild: this.prefabBuilderManager,
          partBuild: this.partBuilderManager,
          parkour: this.parkourManager
      });

      this.stateManager.onRecreateController = (collidables) => {
          const targetCollidables = collidables || this.sceneManager.collidableObjects;
          const targetMap = collidables ? null : this.sceneManager.collisionMap;
          
          this.recreatePlayerController(targetCollidables, targetMap);
          this.stateManager.setManagers({ playerController: this.playerController });
      };

      this.setupCharacterPreview();
      this.setupUIActions();
      this.stateManager.switchToMainMenu();
      this.animate();
      this.setupPositionUpdateLoop();
  }

  setupCharacterPreview() { 
      const container = document.getElementById('player-preview-renderer-container'); 
      if (!container) return; 
      
      this.previewScene = new THREE.Scene(); 
      this.previewScene.background = new THREE.Color(0x333333); 
      this.previewCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 100); 
      this.previewCamera.position.set(0, 1, 4); 
      this.previewCamera.lookAt(0, 0, 0); 
      
      this.previewRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true }); 
      this.previewRenderer.setSize(300, 300); 
      container.innerHTML = ''; 
      container.appendChild(this.previewRenderer.domElement); 
      
      const rect = container.getBoundingClientRect(); 
      if(rect.width > 0) { 
          this.previewRenderer.setSize(rect.width, rect.height); 
          this.previewCamera.aspect = rect.width / rect.height; 
          this.previewCamera.updateProjectionMatrix(); 
      } 
      
      const ambLight = new THREE.AmbientLight(0xffffff, 0.8); 
      this.previewScene.add(ambLight); 
      const dirLight = new THREE.DirectionalLight(0xffffff, 0.5); 
      dirLight.position.set(2, 5, 3); 
      this.previewScene.add(dirLight); 
      
      this.previewCharacter = new THREE.Group(); 
      createBaseCharacter(this.previewCharacter); 
      this.previewCharacter.position.y = -1; 
      this.previewScene.add(this.previewCharacter); 
      
      const onStart = (x) => { this.isPreviewDragging = true; this.previewMouseX = x; }; 
      const onMove = (x) => { if (this.isPreviewDragging && this.previewCharacter) { const delta = x - this.previewMouseX; this.previewCharacter.rotation.y += delta * 0.01; this.previewMouseX = x; } }; 
      const onEnd = () => { this.isPreviewDragging = false; }; 
      
      container.addEventListener('mousedown', (e) => onStart(e.clientX)); 
      window.addEventListener('mousemove', (e) => onMove(e.clientX)); 
      window.addEventListener('mouseup', onEnd); 
      container.addEventListener('touchstart', (e) => onStart(e.touches[0].clientX), {passive: false}); 
      window.addEventListener('touchmove', (e) => onMove(e.touches[0].clientX), {passive: false}); 
      window.addEventListener('touchend', onEnd); 
  }

  setupStats() { 
      const fpsPref = localStorage.getItem(STORAGE_KEYS.FPS_ENABLED) === 'true'; 
      if (fpsPref) { this.isFPSEnabled = true; this.stats.dom.style.display = 'block'; } 
      
      this.ui.onToggleFPS = () => { 
          this.isFPSEnabled = !this.isFPSEnabled; 
          this.stats.dom.style.display = this.isFPSEnabled ? 'block' : 'none'; 
          if(this.ui.updateFPSToggleText) this.ui.updateFPSToggleText(this.isFPSEnabled); 
          localStorage.setItem(STORAGE_KEYS.FPS_ENABLED, this.isFPSEnabled.toString()); 
      }; 
      
      if(this.ui.updateFPSToggleText) this.ui.updateFPSToggleText(this.isFPSEnabled); 
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
      this.ui.onDiscoverClick = () => this.ui.openPanel('discover-choice-panel'); 
      this.ui.onPlayClick = () => this.ui.openPanel('play-choice-panel');
      this.ui.onOpenOtherProfile = (username) => this.ui.openOtherPlayerProfile(username);

      this.ui.onPlayerAvatarClick = () => { 
          if (this.previewCharacter) { 
              while(this.previewCharacter.children.length > 4) { 
                  this.previewCharacter.remove(this.previewCharacter.children[this.previewCharacter.children.length-1]); 
              } 
              if (this.characterManager.skinContainer) { 
                  const skinClone = this.characterManager.skinContainer.clone(); 
                  this.previewCharacter.add(skinClone); 
              } 
          } 
      };

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
          if (ownerId && ownerId !== myId) { 
              this.ui.showMessage("Nie możesz ubrać cudzego skina!", "error"); 
              return; 
          } 
          const data = await SkinStorage.loadSkinData(skinId); 
          if (data) { 
              this.characterManager.applySkin(data); 
              this.ui.updatePlayerAvatar(thumbnail); 
              this.multiplayer.sendMessage({ type: 'mySkin', skinData: data }); 
              this.ui.showMessage(`Założono: ${skinName}`, 'success'); 

              try {
                  const token = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
                  await fetch(`${API_BASE_URL}/api/user/equip`, {
                      method: 'POST',
                      headers: { 
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${token}` 
                      },
                      body: JSON.stringify({ skinId, thumbnail })
                  });
              } catch (e) {
                  console.error("Błąd zapisu skina na serwerze", e);
              }
          } 
      };
      
      this.ui.onUsePrefab = async (item) => {
          this.stateManager.switchToPrefabBuilder();
          setTimeout(async () => {
              await this.prefabBuilderManager.selectPrefab(item.id);
          }, 100);
      };

      this.ui.onUsePart = async (item) => {
          this.stateManager.switchToPartBuilder();
          setTimeout(async () => {
              await this.partBuilderManager.selectPart(item.id);
          }, 100);
      };

      // --- OBSŁUGA NOWYCH TRYBÓW BUDOWANIA ---
      // (64 = size, true = isNexusMode, false = isLoginMapMode)
      this.ui.onEditNexusClick = () => {
           this.stateManager.switchToBuildMode(64, true, false);
      };
      
      this.ui.onEditLoginMapClick = () => {
           this.stateManager.switchToBuildMode(64, false, true);
      };

      this.ui.onShopOpen = () => this.ui.populateShop(this.blockManager.getAllBlockDefinitions(),(name) => this.blockManager.isOwned(name));
  }

  recreatePlayerController(collidables, collisionMap = null) { 
      if(this.playerController) this.playerController.destroy(); 
      
      const map = collisionMap || this.sceneManager.collisionMap;

      this.playerController = new PlayerController(
          this.characterManager.character, 
          collidables, 
          map, 
          { moveSpeed: 8, jumpForce: 18, gravity: 50, groundRestingY: this.sceneManager.FLOOR_TOP_Y }
      ); 
      this.playerController.setIsMobile(this.isMobile); 
  }

  setupPositionUpdateLoop() { 
      if (this.positionUpdateInterval) clearInterval(this.positionUpdateInterval); 
      this.positionUpdateInterval = setInterval(() => { 
          if ((this.stateManager.currentState === 'MainMenu' || this.stateManager.currentState === 'ExploreMode') && this.characterManager && this.characterManager.character) { 
              if(this.multiplayer) { 
                  this.multiplayer.sendMyPosition(this.characterManager.character.position, this.characterManager.character.quaternion); 
              } 
          } 
      }, 50); 
  }

  loadAndExploreWorld(worldData) {
      const worldBlocksData = Array.isArray(worldData) ? worldData : (worldData.blocks || []);
      const worldSize = Array.isArray(worldData) ? 64 : (worldData.size || 64);
      
      const exploreScene = new THREE.Scene();
      exploreScene.background = new THREE.Color(0x87CEEB);
      const ambient = new THREE.AmbientLight(0xffffff, 0.8);
      exploreScene.add(ambient);
      const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
      dirLight.position.set(20, 40, 20);
      exploreScene.add(dirLight);

      const globalCollidables = [];
      const loader = this.loader.getTextureLoader();
      const materials = {};

      const floorGeo = new THREE.BoxGeometry(worldSize, 1, worldSize);
      const floorMat = new THREE.MeshLambertMaterial({ color: 0x559022 });
      const floor = new THREE.Mesh(floorGeo, floorMat);
      floor.position.y = -0.5;
      exploreScene.add(floor);
      globalCollidables.push(floor);
      
      const barrierHeight = 100;
      const half = worldSize / 2;
      const barrierMat = new THREE.MeshBasicMaterial({ visible: false });
      const w1 = new THREE.Mesh(new THREE.BoxGeometry(worldSize, barrierHeight, 1), barrierMat); w1.position.set(0, 50, half); exploreScene.add(w1); globalCollidables.push(w1);
      const w2 = new THREE.Mesh(new THREE.BoxGeometry(worldSize, barrierHeight, 1), barrierMat); w2.position.set(0, 50, -half); exploreScene.add(w2); globalCollidables.push(w2);
      const w3 = new THREE.Mesh(new THREE.BoxGeometry(1, barrierHeight, worldSize), barrierMat); w3.position.set(half, 50, 0); exploreScene.add(w3); globalCollidables.push(w3);
      const w4 = new THREE.Mesh(new THREE.BoxGeometry(1, barrierHeight, worldSize), barrierMat); w4.position.set(-half, 50, 0); exploreScene.add(w4); globalCollidables.push(w4);

      // Tymczasowa mapa kolizji dla świata użytkownika
      const tempCollisionMap = new Map();
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
              
              const key = `${Math.floor(data.x)},${Math.floor(data.y)},${Math.floor(data.z)}`;
              tempCollisionMap.set(key, {
                  isBlock: true,
                  boundingBox: new THREE.Box3().setFromCenterAndSize(
                      new THREE.Vector3(data.x, data.y, data.z),
                      new THREE.Vector3(1, 1, 1)
                  )
              });
          }
      });

      exploreScene.add(this.characterManager.character);
      if (worldData.spawnPoint) {
          this.characterManager.character.position.set(worldData.spawnPoint.x, worldData.spawnPoint.y, worldData.spawnPoint.z);
      } else {
          this.characterManager.character.position.set(0, 5, 0);
      }

      this.stateManager.exploreScene = exploreScene;
      this.multiplayer.setScene(exploreScene);
      this.stateManager.switchToExploreMode(exploreScene);
      
      const exitBtn = document.getElementById('explore-exit-button');
      if(exitBtn) {
          exitBtn.style.display = 'flex'; 
          exitBtn.onclick = () => { this.stateManager.switchToMainMenu(); };
      }

      if (this.parkourManager) {
          this.parkourManager.init(worldData);
      }

      this.recreatePlayerController(globalCollidables, tempCollisionMap);
      
      this.stateManager.setManagers({ playerController: this.playerController });
      this.cameraController.enabled = true;
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    if (this.isFPSEnabled) this.stats.update();
    const delta = this.clock.getDelta();
    this.stateManager.update(delta);
    if (this.previewRenderer && document.getElementById('player-preview-panel').style.display === 'flex') {
      if (this.previewCharacter && !this.isPreviewDragging) { this.previewCharacter.rotation.y += 0.005; }
      this.previewRenderer.render(this.previewScene, this.previewCamera);
    }
  }
}

if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => new BlockStarPlanetGame()); } else { new BlockStarPlanetGame(); }