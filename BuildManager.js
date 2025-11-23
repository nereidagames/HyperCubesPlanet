import * as THREE from 'three';
import { BuildCameraController } from './BuildCameraController.js';
import { WorldStorage } from './WorldStorage.js';
import { PrefabStorage } from './PrefabStorage.js';

export class BuildManager {
  constructor(game, loadingManager, blockManager) {
    this.game = game;
    this.scene = new THREE.Scene();
    this.blockManager = blockManager;
    this.isActive = false;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.previewBlock = null;
    this.previewPrefab = null;
    this.currentBuildMode = 'block';
    this.selectedPrefabData = null;
    this.placedBlocks = [];
    this.collidableBuildObjects = [];
    this.platform = null;
    this.platformSize = 64;
    this.cameraController = null;
    
    this.blockTypes = []; 
    this.selectedBlockType = null;
    
    this.textureLoader = new THREE.TextureLoader(loadingManager);
    this.materials = {};
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onContextMenu = this.onContextMenu.bind(this);

    this.longPressTimer = null;
    this.isLongPress = false;
    this.touchStartPosition = { x: 0, y: 0 };
    this.onTouchStart = this.onTouchStart.bind(this);
    this.onTouchEnd = this.onTouchEnd.bind(this);
    this.onTouchMove = this.onTouchMove.bind(this);
  }

  onContextMenu(event) {
    event.preventDefault();
  }

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

  enterBuildMode(size = 64) {
    this.isActive = true;
    this.platformSize = size;
    
    this.blockTypes = this.blockManager.getOwnedBlockTypes();
    this.selectedBlockType = this.blockTypes[0] || null;
    this.currentBuildMode = 'block';

    this.preloadTextures();
    document.getElementById('build-ui-container').style.display = 'block';
    this.updateSaveButton();
    this.populateBlockSelectionPanel();
    
    this.scene.background = new THREE.Color(0x87CEEB);
    this.scene.fog = new THREE.Fog(0x87CEEB, 50, 200);
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(50, 50, 50);
    directionalLight.castShadow = true; 
    this.scene.add(directionalLight);
    
    this.createBuildPlatform();
    this.createPreviewBlock();
    this.previewPrefab = new THREE.Group();
    this.scene.add(this.previewPrefab);
    
    this.cameraController = new BuildCameraController(this.game.camera, this.game.renderer.domElement);
    this.cameraController.setIsMobile(this.game.isMobile);

    if (this.game.isMobile) {
        document.getElementById('jump-button').style.display = 'none';
    }

    this.setupBuildEventListeners();
  }

  createBuildPlatform() {
    const geometry = new THREE.BoxGeometry(this.platformSize, 1, this.platformSize);
    const material = new THREE.MeshLambertMaterial({ color: 0x559022 });
    this.platform = new THREE.Mesh(geometry, material);
    this.platform.position.y = -0.5;
    this.platform.receiveShadow = true;
    this.scene.add(this.platform);
    this.collidableBuildObjects.push(this.platform);
    
    const edges = new THREE.EdgesGeometry(geometry);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x8A2BE2, linewidth: 4 }));
    line.position.y = -0.5;
    this.scene.add(line);
  }

  createPreviewBlock() {
    if (!this.selectedBlockType) return;
    const previewGeo = new THREE.BoxGeometry(1.01, 1.01, 1.01);
    const previewMat = this.materials[this.selectedBlockType.texturePath].clone();
    previewMat.transparent = true;
    previewMat.opacity = 0.5;
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

    document.getElementById('build-exit-button').onclick = () => this.game.switchToMainMenu();
    document.getElementById('build-mode-button').onclick = () => this.toggleCameraMode();
    document.getElementById('build-add-button').onclick = () => {
        document.getElementById('add-choice-panel').style.display = 'flex';
        document.getElementById('add-choice-parts').style.display = 'none';
        document.getElementById('add-choice-prefabs').style.display = 'block';
    };
    document.getElementById('build-save-button').onclick = () => this.saveWorld();

    document.getElementById('add-choice-blocks').onclick = () => {
        document.getElementById('add-choice-panel').style.display = 'none';
        document.getElementById('block-selection-panel').style.display = 'flex';
    };
    document.getElementById('add-choice-prefabs').onclick = () => {
        document.getElementById('add-choice-panel').style.display = 'none';
        this.showPrefabSelectionPanel();
    };
    document.getElementById('add-choice-close').onclick = () => {
        document.getElementById('add-choice-panel').style.display = 'none';
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

  // --- PANEL PREFABRYKATÓW Z MINIATURKAMI ---
  showPrefabSelectionPanel() {
      const panel = document.getElementById('prefab-selection-panel');
      panel.innerHTML = '';
      const prefabNames = PrefabStorage.getSavedPrefabsList();
      
      if (prefabNames.length === 0) {
          panel.innerHTML = '<div class="panel-item text-outline">Brak prefabrykatów</div>';
      } else {
          prefabNames.forEach(name => {
              const item = document.createElement('div');
              item.className = 'panel-item prefab-item';
              item.style.display = 'flex';
              item.style.alignItems = 'center';
              item.style.padding = '5px';
              item.style.justifyContent = 'flex-start';
              item.style.height = 'auto';
              item.style.minHeight = '60px';

              // Miniaturka
              const thumbContainer = document.createElement('div');
              thumbContainer.style.width = '50px';
              thumbContainer.style.height = '50px';
              thumbContainer.style.backgroundColor = '#333';
              thumbContainer.style.borderRadius = '5px';
              thumbContainer.style.marginRight = '10px';
              thumbContainer.style.overflow = 'hidden';
              thumbContainer.style.flexShrink = '0';
              thumbContainer.style.border = '1px solid white';

              const thumbData = PrefabStorage.getThumbnail(name);
              if (thumbData) {
                  const img = document.createElement('img');
                  img.src = thumbData;
                  img.style.width = '100%';
                  img.style.height = '100%';
                  img.style.objectFit = 'cover';
                  thumbContainer.appendChild(img);
              } else {
                  thumbContainer.textContent = '🏗️';
                  thumbContainer.style.display = 'flex';
                  thumbContainer.style.alignItems = 'center';
                  thumbContainer.style.justifyContent = 'center';
                  thumbContainer.style.color = 'white';
                  thumbContainer.style.fontSize = '20px';
              }

              const textSpan = document.createElement('span');
              textSpan.textContent = name;
              textSpan.className = 'text-outline';
              textSpan.style.fontSize = '14px';
              textSpan.style.wordBreak = 'break-word';

              item.appendChild(thumbContainer);
              item.appendChild(textSpan);

              item.onclick = () => {
                  this.selectPrefab(name);
                  panel.style.display = 'none';
              };
              panel.appendChild(item);
          });
      }
      panel.style.display = 'flex';
  }
  
  selectBlockType(blockType) {
      this.currentBuildMode = 'block';
      this.selectedBlockType = blockType;
      if (this.previewBlock) {
        this.previewBlock.material = this.materials[blockType.texturePath].clone();
        this.previewBlock.material.transparent = true;
        this.previewBlock.material.opacity = 0.5;
      }
      this.previewPrefab.visible = false;
      this.previewBlock.visible = true;
  }

  selectPrefab(prefabName) {
      this.currentBuildMode = 'prefab';
      this.selectedPrefabData = PrefabStorage.loadPrefab(prefabName);
      if (!this.selectedPrefabData) return;

      while(this.previewPrefab.children.length) {
          this.previewPrefab.remove(this.previewPrefab.children[0]);
      }
      
      this.selectedPrefabData.forEach(blockData => {
          const geo = new THREE.BoxGeometry(1, 1, 1);
          const mat = this.materials[blockData.texturePath].clone();
          mat.transparent = true;
          mat.opacity = 0.5;
          const block = new THREE.Mesh(geo, mat);
          block.position.set(blockData.x, blockData.y, blockData.z);
          this.previewPrefab.add(block);
      });

      this.previewBlock.visible = false;
      this.previewPrefab.visible = true;
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
    document.getElementById('add-choice-prefabs').onclick = null;
    document.getElementById('add-choice-close').onclick = null;

    if (this.cameraController) this.cameraController.destroy();
  }
  
  onMouseMove(event) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }
  
  onMouseDown(event) {
    if (!this.isActive || this.game.isMobile || event.target.closest('.build-ui-button') || event.target.closest('#block-selection-panel') || event.target.closest('#prefab-selection-panel') || event.target.closest('#add-choice-panel') || event.target.closest('#joystick-zone')) return;
    
    if (event.button === 0) {
        if (this.currentBuildMode === 'block' && this.previewBlock.visible) {
            this.placeBlock();
        } else if (this.currentBuildMode === 'prefab' && this.previewPrefab.visible) {
            this.placePrefab();
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
    
    newBlock.castShadow = true;
    newBlock.receiveShadow = true;

    this.scene.add(newBlock);
    this.placedBlocks.push(newBlock);
    this.collidableBuildObjects.push(newBlock);
    this.updateSaveButton();
  }
  
  placePrefab() {
    if (!this.selectedPrefabData) return;
    const buildAreaLimit = this.platformSize / 2;
    
    this.selectedPrefabData.forEach(blockData => {
        const finalPosition = new THREE.Vector3(blockData.x, blockData.y, blockData.z).add(this.previewPrefab.position);

        if (
            Math.abs(finalPosition.x) < buildAreaLimit && 
            Math.abs(finalPosition.z) < buildAreaLimit &&
            finalPosition.y >= 0
        ) {
            const blockGeo = new THREE.BoxGeometry(1, 1, 1);
            const blockMat = this.materials[blockData.texturePath];
            const newBlock = new THREE.Mesh(blockGeo, blockMat);
            newBlock.userData.texturePath = blockData.texturePath;
            newBlock.position.copy(finalPosition);
            newBlock.castShadow = true;
            newBlock.receiveShadow = true;

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

  // --- GENEROWANIE MINIATURKI ŚWIATA (BEZ ZMIAN) ---
  generateThumbnail() {
    const width = 200;
    const height = 150;
    const thumbnailRenderer = new THREE.WebGLRenderer({ alpha: false, antialias: true });
    thumbnailRenderer.setSize(width, height);
    thumbnailRenderer.setClearColor(0x87CEEB);
    
    const thumbnailScene = new THREE.Scene();
    const ambLight = new THREE.AmbientLight(0xffffff, 0.8);
    thumbnailScene.add(ambLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLight.position.set(50, 50, 50);
    thumbnailScene.add(dirLight);

    const floorGeo = new THREE.BoxGeometry(this.platformSize, 1, this.platformSize);
    const floorMat = new THREE.MeshLambertMaterial({ color: 0x559022 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -0.5;
    thumbnailScene.add(floor);

    if (this.placedBlocks.length > 0) {
        this.placedBlocks.forEach(block => {
            const clone = block.clone();
            thumbnailScene.add(clone);
        });
    }

    const thumbnailCamera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    const distance = this.platformSize * 1.5; 
    thumbnailCamera.position.set(distance, distance * 0.8, distance);
    thumbnailCamera.lookAt(0, 0, 0);

    thumbnailRenderer.render(thumbnailScene, thumbnailCamera);
    
    const dataURL = thumbnailRenderer.domElement.toDataURL('image/jpeg', 0.8);
    thumbnailRenderer.dispose();
    
    return dataURL;
  }

  saveWorld() {
    if (this.placedBlocks.length === 0) return;
    const worldName = prompt("Podaj nazwę dla swojego świata:", "Mój Nowy Świat");
    if (worldName) {
      
      const thumbnail = this.generateThumbnail();

      const worldData = {
        size: this.platformSize,
        thumbnail: thumbnail,
        blocks: this.placedBlocks.map(block => ({
            x: block.position.x,
            y: block.position.y,
            z: block.position.z,
            texturePath: block.userData.texturePath
        }))
      };
      
      if (WorldStorage.saveWorld(worldName, worldData)) {
        alert(`Świat "${worldName}" został pomyślnie zapisany!`);
        this.game.switchToMainMenu();
      }
    }
  }

  exitBuildMode() {
    this.isActive = false;
    this.removeBuildEventListeners();
    this.collidableBuildObjects = [];
    this.placedBlocks = [];
    while(this.scene.children.length > 0){ this.scene.remove(this.scene.children[0]); }
    document.getElementById('build-ui-container').style.display = 'none';
    
    if (this.game.isMobile) {
        document.getElementById('jump-button').style.display = 'block';
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
      let isVisible = false;
      if (
          Math.abs(snappedPosition.x) < buildAreaLimit && 
          Math.abs(snappedPosition.z) < buildAreaLimit && 
          snappedPosition.y >= 0
      ) {
          isVisible = true;
          if (this.currentBuildMode === 'block') {
              if (this.previewBlock) this.previewBlock.position.copy(snappedPosition);
          } else {
              if (this.previewPrefab) this.previewPrefab.position.copy(snappedPosition);
          }
      }
      
      if (this.previewBlock) this.previewBlock.visible = isVisible && this.currentBuildMode === 'block';
      if (this.previewPrefab) this.previewPrefab.visible = isVisible && this.currentBuildMode === 'prefab';

    } else {
      if (this.previewBlock) this.previewBlock.visible = false;
      if (this.previewPrefab) this.previewPrefab.visible = false;
    }
  }

  onTouchStart(event) {
    if (!this.isActive || !this.game.isMobile || event.target.closest('.build-ui-button') || event.target.closest('#block-selection-panel') || event.target.closest('#prefab-selection-panel') || event.target.closest('#add-choice-panel') || event.target.closest('#joystick-zone')) return;
    
    event.preventDefault();
    this.isLongPress = false;
    
    const touch = event.touches[0];
    this.mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
    
    this.touchStartPosition.x = touch.clientX;
    this.touchStartPosition.y = touch.clientY;

    clearTimeout(this.longPressTimer);
    this.longPressTimer = setTimeout(() => {
        this.isLongPress = true;
        this.removeBlock();
    }, 500);
  }

  onTouchEnd(event) {
    if (!this.isActive || !this.game.isMobile || event.target.closest('.build-ui-button') || event.target.closest('#block-selection-panel') || event.target.closest('#prefab-selection-panel') || event.target.closest('#add-choice-panel') || event.target.closest('#joystick-zone')) return;

    clearTimeout(this.longPressTimer);
    
    if (!this.isLongPress) {
        if (this.currentBuildMode === 'block' && this.previewBlock && this.previewBlock.visible) {
            this.placeBlock();
        } else if (this.currentBuildMode === 'prefab' && this.previewPrefab && this.previewPrefab.visible) {
            this.placePrefab();
        }
    }
  }

  onTouchMove(event) {
    if (!this.isActive || !this.game.isMobile) return;
    
    const touch = event.touches[0];
    
    const deltaX = touch.clientX - this.touchStartPosition.x;
    const deltaY = touch.clientY - this.touchStartPosition.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const MOVE_THRESHOLD = 10; 

    if (distance > MOVE_THRESHOLD) {
        clearTimeout(this.longPressTimer);
    }
    
    this.mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
  }
}