/* PLIK: SkinBuilderManager.js */
import * as THREE from 'three';
import { BuildCameraController } from './BuildCameraController.js';
import { SkinStorage } from './SkinStorage.js';
import { HyperCubePartStorage } from './HyperCubePartStorage.js';
import { createBaseCharacter } from './character.js';

const API_BASE_URL = 'https://hypercubes-nexus-server.onrender.com';
const JWT_TOKEN_KEY = 'bsp_clone_jwt_token';

export class SkinBuilderManager {
  constructor(game, loadingManager, blockManager) {
    this.game = game;
    this.scene = new THREE.Scene();
    this.blockManager = blockManager;
    this.isActive = false;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    
    this.previewBlock = null;
    this.previewPart = null;
    this.currentBuildMode = 'block';
    this.selectedPartData = null;
    this.placedBlocks = [];
    this.collidableBuildObjects = [];
    this.platform = null;
    this.platformSize = 16; 
    this.cameraController = null;
    
    this.baseCharacterVisuals = null;

    this.blockTypes = [];
    this.selectedBlockType = null;
    
    // Nowa flaga: Czy budujemy oficjalny skin startowy?
    this.isStarterMode = false;

    this.textureLoader = new THREE.TextureLoader(loadingManager);
    this.materials = {};
    
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onContextMenu = this.onContextMenu.bind(this);
    this.onTouchStart = this.onTouchStart.bind(this);
    this.onTouchEnd = this.onTouchEnd.bind(this);
    this.onTouchMove = this.onTouchMove.bind(this);
  }

  onContextMenu(event) { event.preventDefault(); }

  preloadTextures() {
    const allBlocks = this.blockManager.getAllBlockDefinitions();
    allBlocks.forEach(blockType => {
      if (!this.materials[blockType.texturePath]) {
        const texture = this.textureLoader.load(blockType.texturePath);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        this.materials[blockType.texturePath] = new THREE.MeshLambertMaterial({ map: texture });
      }
    });
  }

  // Zaktualizowana metoda wejścia
  enterBuildMode(isStarterMode = false) {
    this.isActive = true;
    this.isStarterMode = isStarterMode;
    
    this.blockTypes = this.blockManager.getOwnedBlockTypes();
    this.selectedBlockType = this.blockTypes[0] || null;
    this.currentBuildMode = 'block';

    this.preloadTextures();
    document.getElementById('build-ui-container').style.display = 'block';
    
    // Aktualizacja tekstu przycisku
    const saveBtn = document.getElementById('build-save-button');
    if (saveBtn) {
        saveBtn.textContent = this.isStarterMode ? "Zapisz Starter" : "Zapisz Skin";
    }

    this.updateSaveButton();
    this.populateBlockSelectionPanel();
    
    this.scene.background = new THREE.Color(0x2c3e50);
    this.scene.fog = new THREE.Fog(0x2c3e50, 30, 100);
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    this.scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(10, 20, 15);
    this.scene.add(directionalLight);
    
    this.createBuildPlatform();
    
    // Baza postaci (Nogi)
    this.baseCharacterVisuals = new THREE.Group();
    createBaseCharacter(this.baseCharacterVisuals);
    // Skalujemy nogi tak, żeby pasowały do bloków 1x1 w edytorze
    // W grze skin jest skalowany w dół (0.125), tutaj nogi w górę (8x)
    this.baseCharacterVisuals.scale.setScalar(8);
    this.baseCharacterVisuals.position.set(0, -4.0, 0); // Odpowiednie przesunięcie
    this.scene.add(this.baseCharacterVisuals);

    this.createPreviewBlock();
    this.previewPart = new THREE.Group();
    this.scene.add(this.previewPart);
    
    this.cameraController = new BuildCameraController(this.game.camera, this.game.renderer.domElement);
    
    if (this.game.isMobile) {
        document.getElementById('jump-button').style.display = 'none';
        const joy = document.getElementById('joystick-zone');
        if(joy) { 
            joy.style.display = 'block'; 
            joy.innerHTML = ''; 
        }
    }
    
    this.cameraController.setIsMobile(this.game.isMobile);
    this.cameraController.distance = 30;

    this.setupBuildEventListeners();
  }

  createBuildPlatform() {
    const geometry = new THREE.BoxGeometry(this.platformSize, 1, this.platformSize);
    const material = new THREE.MeshLambertMaterial({ color: 0xbdc3c7, transparent: true, opacity: 0.2 });
    this.platform = new THREE.Mesh(geometry, material);
    this.platform.position.y = -0.5; 
    this.scene.add(this.platform);
    this.collidableBuildObjects.push(this.platform);
    
    const gridHelper = new THREE.GridHelper(this.platformSize, this.platformSize);
    gridHelper.position.y = 0.01;
    this.scene.add(gridHelper);
    
    const edges = new THREE.EdgesGeometry(geometry);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x8A2BE2, linewidth: 2 }));
    line.position.y = -0.5;
    this.scene.add(line);
  }

  createPreviewBlock() {
    if (!this.selectedBlockType) return;
    const previewGeo = new THREE.BoxGeometry(1, 1, 1);
    const previewMat = this.materials[this.selectedBlockType.texturePath].clone();
    previewMat.transparent = true;
    previewMat.opacity = 0.6;
    this.previewBlock = new THREE.Mesh(previewGeo, previewMat);
    this.previewBlock.visible = false;
    this.scene.add(this.previewBlock);
  }
  
  setupBuildEventListeners() {
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('contextmenu', this.onContextMenu);
    window.addEventListener('touchstart', this.onTouchStart, { passive: false });
    window.addEventListener('touchend', this.onTouchEnd);
    window.addEventListener('touchmove', this.onTouchMove);

    document.getElementById('build-exit-button').onclick = () => this.game.stateManager.switchToMainMenu();
    
    document.getElementById('build-mode-button').onclick = () => this.toggleCameraMode();
    
    // --- POPRAWIONA LOGIKA OTWIERANIA MENU ---
    document.getElementById('build-add-button').onclick = () => {
        // Reset widoczności paneli wyboru
        document.getElementById('block-selection-panel').style.display = 'none';
        document.getElementById('part-selection-panel').style.display = 'none';
        
        document.getElementById('add-choice-panel').style.display = 'flex';
        // W skin builderze pokazujemy tylko parts i bloki
        document.getElementById('add-choice-prefabs').style.display = 'none';
        document.getElementById('add-choice-parts').style.display = 'block';
    };
    
    document.getElementById('build-save-button').onclick = () => this.saveSkin();

    document.getElementById('add-choice-blocks').onclick = () => {
        document.getElementById('add-choice-panel').style.display = 'none';
        document.getElementById('part-selection-panel').style.display = 'none'; // Zamykamy części
        document.getElementById('block-selection-panel').style.display = 'flex';
    };
    
    document.getElementById('add-choice-parts').onclick = () => {
        document.getElementById('add-choice-panel').style.display = 'none';
        document.getElementById('block-selection-panel').style.display = 'none'; // Zamykamy bloki
        this.showPartSelectionPanel();
    };
    
    document.getElementById('add-choice-close').onclick = () => {
        document.getElementById('add-choice-panel').style.display = 'none';
        document.getElementById('block-selection-panel').style.display = 'none';
        document.getElementById('part-selection-panel').style.display = 'none';
    };
  }
  
  populateBlockSelectionPanel() {
      const panel = document.getElementById('block-selection-panel');
      panel.innerHTML = '';
      this.blockTypes.forEach(blockType => {
          const blockItem = document.createElement('div');
          blockItem.className = 'block-item';
          blockItem.style.backgroundImage = `url(${blockType.texturePath})`;
          blockItem.style.backgroundSize = 'cover';
          blockItem.onclick = () => {
              this.selectBlockType(blockType);
              panel.style.display = 'none';
          };
          panel.appendChild(blockItem);
      });
  }

  async showPartSelectionPanel() {
      const panel = document.getElementById('part-selection-panel');
      panel.innerHTML = '<p class="text-outline">Ładowanie...</p>';
      panel.style.display = 'flex';
      const partsList = await HyperCubePartStorage.getSavedPartsList();
      panel.innerHTML = '';
      if (partsList.length === 0) {
          panel.innerHTML = '<div class="panel-item text-outline">Brak części</div>';
      } else {
          partsList.forEach(item => {
              const div = document.createElement('div');
              div.className = 'panel-item part-item';
              div.textContent = item.name; 
              div.onclick = async () => {
                  await this.selectPart(item.id);
                  panel.style.display = 'none';
              };
              panel.appendChild(div);
          });
      }
  }
  
  selectBlockType(blockType) {
      this.currentBuildMode = 'block';
      this.selectedBlockType = blockType;
      if (this.previewBlock) {
        this.previewBlock.material = this.materials[blockType.texturePath].clone();
        this.previewBlock.material.transparent = true;
        this.previewBlock.material.opacity = 0.6;
      }
      this.previewPart.visible = false;
      this.previewBlock.visible = true;
  }

  async selectPart(partId) {
      this.currentBuildMode = 'part';
      this.selectedPartData = await HyperCubePartStorage.loadPart(partId);
      if (!this.selectedPartData) return;
      while(this.previewPart.children.length) { this.previewPart.remove(this.previewPart.children[0]); }
      this.selectedPartData.forEach(blockData => {
          const geo = new THREE.BoxGeometry(1, 1, 1);
          const mat = this.materials[blockData.texturePath].clone();
          mat.transparent = true;
          mat.opacity = 0.5;
          const block = new THREE.Mesh(geo, mat);
          block.position.set(blockData.x, blockData.y, blockData.z);
          this.previewPart.add(block);
      });
      this.previewBlock.visible = false;
      this.previewPart.visible = true;
  }

  toggleCameraMode() {
      const button = document.getElementById('build-mode-button');
      if (this.cameraController.mode === 'orbital') {
          this.cameraController.setMode('free');
          button.textContent = 'Zaawansowany';
      } else {
          this.cameraController.setMode('orbital');
          button.textContent = 'Łatwy';
      }
  }

  removeBuildEventListeners() {
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('contextmenu', this.onContextMenu);
    window.removeEventListener('touchstart', this.onTouchStart);
    window.removeEventListener('touchend', this.onTouchEnd);
    window.removeEventListener('touchmove', this.onTouchMove);

    document.getElementById('build-exit-button').onclick = null;
    document.getElementById('build-mode-button').onclick = null;
    document.getElementById('build-add-button').onclick = null;
    document.getElementById('build-save-button').onclick = null;
    document.getElementById('add-choice-blocks').onclick = null;
    document.getElementById('add-choice-parts').onclick = null;
    document.getElementById('add-choice-close').onclick = null;

    if (this.cameraController) this.cameraController.destroy();
  }
  
  onMouseMove(event) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }
  
  onMouseDown(event) {
    if (!this.isActive || this.game.isMobile || event.target.closest('.build-ui-button') || event.target.closest('#block-selection-panel') || event.target.closest('#part-selection-panel') || event.target.closest('#add-choice-panel') || event.target.closest('#joystick-zone')) return;
    
    if (event.button === 0) {
        if (this.currentBuildMode === 'block' && this.previewBlock.visible) {
            this.placeBlock();
        } else if (this.currentBuildMode === 'part' && this.previewPart.visible) {
            this.placePart();
        }
    } else if (event.button === 2) {
        this.removeBlock();
    }
  }

  placeBlock() {
    if (!this.selectedBlockType) return;
    const blockGeo = new THREE.BoxGeometry(1, 1, 1);
    const blockMat = this.materials[this.selectedBlockType.texturePath];
    const newBlock = new THREE.Mesh(blockGeo, blockMat);
    newBlock.userData.texturePath = this.selectedBlockType.texturePath;
    newBlock.position.copy(this.previewBlock.position);
    this.scene.add(newBlock);
    this.placedBlocks.push(newBlock);
    this.collidableBuildObjects.push(newBlock);
    this.updateSaveButton();
  }
  
  placePart() {
    if (!this.selectedPartData) return;
    this.selectedPartData.forEach(blockData => {
        const finalPosition = new THREE.Vector3(blockData.x, blockData.y, blockData.z).add(this.previewPart.position);
        // Ograniczenia budowania
        const buildAreaLimit = this.platformSize / 2;
        const buildHeightLimit = 20;
        if (Math.abs(finalPosition.x) < buildAreaLimit && Math.abs(finalPosition.z) < buildAreaLimit && finalPosition.y >= 0 && finalPosition.y < buildHeightLimit) {
            const blockGeo = new THREE.BoxGeometry(1, 1, 1);
            const blockMat = this.materials[blockData.texturePath];
            const newBlock = new THREE.Mesh(blockGeo, blockMat);
            newBlock.userData.texturePath = blockData.texturePath;
            newBlock.position.copy(finalPosition);
            this.scene.add(newBlock);
            this.placedBlocks.push(newBlock);
            this.collidableBuildObjects.push(newBlock);
        }
    });
    this.updateSaveButton();
  }
  
  removeBlock() {
    this.raycaster.setFromCamera(this.mouse, this.game.camera);
    const intersects = this.raycaster.intersectObjects(this.placedBlocks);
    if (intersects.length > 0) {
      const blockToRemove = intersects[0].object;
      this.scene.remove(blockToRemove);
      this.placedBlocks = this.placedBlocks.filter(b => b !== blockToRemove);
      this.collidableBuildObjects = this.collidableBuildObjects.filter(b => b !== blockToRemove);
      this.updateSaveButton();
    }
  }
  
  updateSaveButton() {
    const button = document.getElementById('build-save-button');
    if (this.placedBlocks.length > 0) {
      button.style.opacity = '1';
      button.style.cursor = 'pointer';
    } else {
      button.style.opacity = '0.5';
      button.style.cursor = 'not-allowed';
    }
  }

  generateThumbnail() {
    const width = 150;
    const height = 150;
    const thumbnailRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    thumbnailRenderer.setSize(width, height);
    const thumbnailScene = new THREE.Scene();
    const ambLight = new THREE.AmbientLight(0xffffff, 1.0);
    thumbnailScene.add(ambLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLight.position.set(5, 10, 7);
    thumbnailScene.add(dirLight);
    
    const box = new THREE.Box3();
    const thumbLegs = new THREE.Group();
    createBaseCharacter(thumbLegs);
    thumbLegs.scale.setScalar(8);
    thumbLegs.position.set(0, -4.0, 0);
    thumbnailScene.add(thumbLegs);
    box.expandByObject(thumbLegs);
    
    if (this.placedBlocks.length > 0) {
        this.placedBlocks.forEach(block => {
            const clone = block.clone();
            thumbnailScene.add(clone);
            box.expandByObject(clone);
        });
    }
    
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    
    const thumbnailCamera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    const distance = maxDim * 2.0; 
    thumbnailCamera.position.set(center.x + distance * 0.8, center.y + distance * 0.2, center.z + distance);
    thumbnailCamera.lookAt(center);
    
    thumbnailRenderer.render(thumbnailScene, thumbnailCamera);
    const dataURL = thumbnailRenderer.domElement.toDataURL('image/png');
    thumbnailRenderer.dispose();
    return dataURL;
  }

  // --- ZAPISYWANIE (OBSŁUGA DWÓCH TRYBÓW) ---
  async saveSkin() {
    if (this.placedBlocks.length === 0) return;
    
    const skinName = prompt(this.isStarterMode ? "Nazwa startera:" : "Podaj nazwę dla swojego skina:", "Mój Skin");
    if (!skinName) return;

    const blocksData = this.placedBlocks.map(block => ({
        x: block.position.x,
        y: block.position.y,
        z: block.position.z,
        texturePath: block.userData.texturePath
    }));
    
    const thumbnail = this.generateThumbnail();
    
    if (this.isStarterMode) {
        // Zapisz jako Starter Skin (Admin)
        const token = localStorage.getItem(JWT_TOKEN_KEY);
        try {
            const res = await fetch(`${API_BASE_URL}/api/starter-skins`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ name: skinName, blocks: blocksData, thumbnail })
            });
            const d = await res.json();
            if (res.ok) {
                alert("Starter Skin zapisany!");
                this.game.stateManager.switchToMainMenu();
            } else {
                alert("Błąd: " + d.message);
            }
        } catch(e) { console.error(e); alert("Błąd sieci"); }
    } else {
        // Zapisz jako zwykły skin gracza
        const success = await SkinStorage.saveSkin(skinName, blocksData, thumbnail);
        if (success) {
            alert(`Skin "${skinName}" został pomyślnie zapisany!`);
            this.game.stateManager.switchToMainMenu();
        }
    }
  }

  exitBuildMode() {
    this.isActive = false;
    this.isStarterMode = false;
    this.removeBuildEventListeners();
    this.collidableBuildObjects = [];
    this.placedBlocks = [];
    while(this.scene.children.length > 0){ this.scene.remove(this.scene.children[0]); }
    this.baseCharacterVisuals = null;
    document.getElementById('build-ui-container').style.display = 'none';
    if (this.game.isMobile) {
        document.getElementById('jump-button').style.display = 'block';
        document.getElementById('joystick-zone').style.display = 'none';
    }
  }
  
  update(deltaTime) {
    if (!this.isActive) return;
    this.cameraController.update(deltaTime);
    this.raycaster.setFromCamera(this.mouse, this.game.camera);
    const intersects = this.raycaster.intersectObjects(this.collidableBuildObjects);
    
    if (intersects.length > 0) {
      const intersect = intersects[0];
      const normal = intersect.face.normal.clone();
      const snappedPosition = new THREE.Vector3().copy(intersect.point)
        .add(normal.multiplyScalar(0.5)).floor().addScalar(0.5);
      
      const buildAreaLimit = this.platformSize / 2;
      const buildHeightLimit = 20;
      let isVisible = false;
      
      if (Math.abs(snappedPosition.x) < buildAreaLimit && Math.abs(snappedPosition.z) < buildAreaLimit && snappedPosition.y >= 0 && snappedPosition.y < buildHeightLimit) {
          isVisible = true;
          if (this.currentBuildMode === 'block') { if (this.previewBlock) this.previewBlock.position.copy(snappedPosition); } 
          else { if (this.previewPart) this.previewPart.position.copy(snappedPosition); }
      }
      
      if (this.previewBlock) this.previewBlock.visible = isVisible && this.currentBuildMode === 'block';
      if (this.previewPart) this.previewPart.visible = isVisible && this.currentBuildMode === 'part';
    } else {
      if (this.previewBlock) this.previewBlock.visible = false;
      if (this.previewPart) this.previewPart.visible = false;
    }
  }

  onTouchStart(event) {
    if (!this.isActive || !this.game.isMobile || event.target.closest('.build-ui-button') || event.target.closest('#block-selection-panel') || event.target.closest('#part-selection-panel') || event.target.closest('#add-choice-panel') || event.target.closest('#joystick-zone')) return;
    event.preventDefault();
    this.isLongPress = false;
    const touch = event.touches[0];
    this.mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
    this.touchStartPosition.x = touch.clientX;
    this.touchStartPosition.y = touch.clientY;
    clearTimeout(this.longPressTimer);
    this.longPressTimer = setTimeout(() => { this.isLongPress = true; this.removeBlock(); }, 500);
  }

  onTouchEnd(event) {
    if (!this.isActive || !this.game.isMobile || event.target.closest('.build-ui-button') || event.target.closest('#block-selection-panel') || event.target.closest('#part-selection-panel') || event.target.closest('#add-choice-panel') || event.target.closest('#joystick-zone')) return;
    clearTimeout(this.longPressTimer);
    if (!this.isLongPress) {
        if (this.currentBuildMode === 'block' && this.previewBlock && this.previewBlock.visible) { this.placeBlock(); } 
        else if (this.currentBuildMode === 'part' && this.previewPart && this.previewPart.visible) { this.placePart(); }
    }
  }

  onTouchMove(event) {
    if (!this.isActive || !this.game.isMobile) return;
    const touch = event.touches[0];
    const deltaX = touch.clientX - this.touchStartPosition.x;
    const deltaY = touch.clientY - this.touchStartPosition.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const MOVE_THRESHOLD = 10; 
    if (distance > MOVE_THRESHOLD) { clearTimeout(this.longPressTimer); }
    this.mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
  }
}