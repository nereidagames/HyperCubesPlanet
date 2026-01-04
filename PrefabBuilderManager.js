/* PLIK: PrefabBuilderManager.js */
import * as THREE from 'three';
import { BuildCameraController } from './BuildCameraController.js';
import { PrefabStorage } from './PrefabStorage.js';

export class PrefabBuilderManager {
  constructor(game, loadingManager, blockManager) {
    this.game = game;
    this.scene = new THREE.Scene();
    this.blockManager = blockManager;
    this.isActive = false;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    
    this.previewBlock = null;
    this.placedBlocks = [];
    this.collidableBuildObjects = [];
    this.platform = null;
    this.platformSize = 32;
    this.cameraController = null;

    this.blockTypes = [];
    this.selectedBlockType = null;
    this.recentBlocks = [];
    
    this.textureLoader = new THREE.TextureLoader(loadingManager);
    this.materials = {};
    this.sharedBoxGeometry = new THREE.BoxGeometry(1, 1, 1);

    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
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
        texture.minFilter = THREE.NearestMipmapNearestFilter;
        this.materials[blockType.texturePath] = new THREE.MeshLambertMaterial({ map: texture });
      }
    });
  }

  enterBuildMode() {
    this.isActive = true;
    
    // 1. Ustaw bloki
    this.blockTypes = this.blockManager.getOwnedBlockTypes();
    if (this.blockTypes.length > 0) this.selectedBlockType = this.blockTypes[0];

    // 2. Tekstury
    this.preloadTextures();

    // 3. UI
    document.getElementById('build-ui-container').style.display = 'block';
    
    const buildElements = ['.build-top-left', '.build-sidebar-right', '.build-bottom-bar', '#build-rotate-zone'];
    buildElements.forEach(selector => {
        const el = document.querySelector(selector);
        if (el) el.style.display = 'flex';
    });
    
    const rightUi = document.querySelector('.right-ui');
    if(rightUi) rightUi.style.display = 'none';

    const saveBtn = document.getElementById('build-save-btn-new');
    if(saveBtn) saveBtn.textContent = "Zapisz Prefab";

    if (this.selectedBlockType) this.selectBlockType(this.selectedBlockType);
    this.updateHotbarUI();
    
    // 4. Scena
    this.scene.background = new THREE.Color(0x2c3e50);
    this.scene.fog = new THREE.Fog(0x2c3e50, 20, 150);
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    this.scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(10, 20, 15);
    this.scene.add(directionalLight);
    
    this.createBuildPlatform();
    this.createPreviewBlock();
    
    // 5. Kamera
    this.cameraController = new BuildCameraController(this.game.camera, this.game.renderer.domElement);
    if (this.game.isMobile) {
        document.getElementById('mobile-game-controls').style.display = 'block';
        document.getElementById('jump-button').style.display = 'none';
        const joy = document.getElementById('joystick-zone');
        if(joy) { joy.innerHTML = ''; joy.style.display = 'block'; }
    }
    this.cameraController.setIsMobile(this.game.isMobile);
    this.cameraController.distance = 35;

    this.setupBuildEventListeners();
  }

  // --- HOTBAR ---
  addToHotbar(blockType) {
      const idx = this.recentBlocks.findIndex(b => b.name === blockType.name);
      if (idx !== -1) this.recentBlocks.splice(idx, 1);
      this.recentBlocks.unshift(blockType);
      if (this.recentBlocks.length > 8) this.recentBlocks.pop();
      this.updateHotbarUI();
  }

  updateHotbarUI() {
      const container = document.getElementById('build-hotbar-container');
      if (!container) return;
      container.innerHTML = '';
      this.recentBlocks.forEach(blockType => {
          const slot = document.createElement('div');
          slot.className = 'hotbar-slot';
          slot.style.backgroundImage = `url(${blockType.texturePath})`;
          if (this.selectedBlockType && this.selectedBlockType.name === blockType.name) {
              slot.classList.add('active');
          }
          slot.onclick = () => { this.selectBlockType(blockType); };
          container.appendChild(slot);
      });
  }

  populateBlockSelectionPanel() {
      const list = document.getElementById('build-block-list');
      if (!list) return;
      list.innerHTML = '';
      this.blockTypes.forEach(blockType => {
          const blockItem = document.createElement('div');
          blockItem.className = 'block-item';
          blockItem.style.backgroundImage = `url(${blockType.texturePath})`;
          blockItem.style.backgroundSize = 'cover';
          blockItem.onclick = () => {
              this.selectBlockType(blockType);
              this.addToHotbar(blockType);
              document.getElementById('block-selection-panel').style.display = 'none';
          };
          list.appendChild(blockItem);
      });
  }

  createBuildPlatform() {
    const geometry = new THREE.BoxGeometry(this.platformSize, 1, this.platformSize);
    const material = new THREE.MeshLambertMaterial({ color: 0x7f8c8d, transparent: true, opacity: 0.5 });
    this.platform = new THREE.Mesh(geometry, material);
    this.platform.position.y = -0.5;
    this.scene.add(this.platform);
    this.collidableBuildObjects.push(this.platform);
    const gridHelper = new THREE.GridHelper(this.platformSize, this.platformSize);
    gridHelper.position.y = 0.01;
    this.scene.add(gridHelper);
    const edges = new THREE.EdgesGeometry(geometry);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xecf0f1, linewidth: 2 }));
    line.position.y = -0.5;
    this.scene.add(line);
  }

  createPreviewBlock() {
    if (!this.selectedBlockType) return;
    const previewGeo = this.sharedBoxGeometry;
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
    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('contextmenu', this.onContextMenu);
    window.addEventListener('touchstart', this.onTouchStart, { passive: false });
    window.addEventListener('touchend', this.onTouchEnd);
    window.addEventListener('touchmove', this.onTouchMove);

    document.getElementById('build-exit-btn-new').onclick = () => this.game.stateManager.switchToMainMenu();
    document.getElementById('build-mode-toggle-new').onclick = () => this.toggleCameraMode();
    document.getElementById('build-save-btn-new').onclick = () => this.savePrefab();

    document.getElementById('build-add-btn-new').onclick = () => {
        // Tylko bloki w prefabie
        document.getElementById('block-selection-panel').style.display = 'none';
        document.getElementById('add-choice-panel').style.display = 'flex';
        document.getElementById('add-choice-prefabs').style.display = 'none';
        document.getElementById('add-choice-parts').style.display = 'none';
    };
    
    document.getElementById('add-choice-blocks').onclick = () => {
        document.getElementById('add-choice-panel').style.display = 'none';
        document.getElementById('block-selection-panel').style.display = 'flex';
        this.populateBlockSelectionPanel();
        document.getElementById('build-tab-blocks').click();
    };
    
    document.getElementById('add-choice-close').onclick = () => {
        document.getElementById('add-choice-panel').style.display = 'none';
        document.getElementById('block-selection-panel').style.display = 'none';
    };
  }
  
  selectBlockType(blockType) {
      this.selectedBlockType = blockType;
      if (this.previewBlock) {
        this.previewBlock.material = this.materials[blockType.texturePath].clone();
        this.previewBlock.material.transparent = true;
        this.previewBlock.material.opacity = 0.6;
      }
      this.updateHotbarUI();
  }

  toggleCameraMode() {
      const button = document.getElementById('build-mode-toggle-new');
      if (this.cameraController.mode === 'orbital') {
          this.cameraController.setMode('free');
          button.textContent = 'Tryb: Zaawansowany';
      } else {
          this.cameraController.setMode('orbital');
          button.textContent = 'Tryb: Łatwy';
      }
  }

  removeBuildEventListeners() {
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('contextmenu', this.onContextMenu);
    window.removeEventListener('touchstart', this.onTouchStart);
    window.removeEventListener('touchend', this.onTouchEnd);
    window.removeEventListener('touchmove', this.onTouchMove);

    document.getElementById('build-exit-btn-new').onclick = null;
    document.getElementById('build-mode-toggle-new').onclick = null;
    document.getElementById('build-add-btn-new').onclick = null;
    document.getElementById('build-save-btn-new').onclick = null;
    document.getElementById('add-choice-blocks').onclick = null;
    document.getElementById('add-choice-close').onclick = null;

    if (this.cameraController) this.cameraController.destroy();
  }
  
  onMouseMove(e) {
    this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  }
  
  isEventOnUI(event) {
      const target = event.target;
      if (target.closest('#build-rotate-zone')) return true;
      return (target.closest('.build-ui-button') || target.closest('.panel-list') || target.closest('.build-sidebar-right') || target.closest('.build-top-left') || target.closest('.build-bottom-bar') || target.closest('#tools-modal') || target.closest('#block-selection-panel') || target.closest('#add-choice-panel') || target.closest('#joystick-zone'));
  }

  onMouseDown(event) {
    if (!this.isActive || this.game.isMobile || this.isEventOnUI(event)) return;
    if (event.button === 0 && this.previewBlock.visible) this.placeBlock();
    else if (event.button === 2) this.removeBlock();
  }
  
  onMouseUp() {}

  placeBlock() {
    if (!this.selectedBlockType) return;
    const blockGeo = this.sharedBoxGeometry;
    const blockMat = this.materials[this.selectedBlockType.texturePath];
    const newBlock = new THREE.Mesh(blockGeo, blockMat);
    newBlock.userData.texturePath = this.selectedBlockType.texturePath;
    newBlock.position.copy(this.previewBlock.position);
    this.scene.add(newBlock);
    this.placedBlocks.push(newBlock);
    this.collidableBuildObjects.push(newBlock);
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
    const button = document.getElementById('build-save-btn-new');
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
    if (this.placedBlocks.length > 0) {
        this.placedBlocks.forEach(block => {
            const clone = block.clone();
            thumbnailScene.add(clone);
            box.expandByObject(clone);
        });
    } else { return null; }
    
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const thumbnailCamera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    const distance = maxDim * 2.0; 
    thumbnailCamera.position.set(center.x + distance * 0.8, center.y + distance * 0.5, center.z + distance);
    thumbnailCamera.lookAt(center);
    thumbnailRenderer.render(thumbnailScene, thumbnailCamera);
    const dataURL = thumbnailRenderer.domElement.toDataURL('image/png');
    thumbnailRenderer.dispose();
    return dataURL;
  }

  async savePrefab() {
    if (this.placedBlocks.length === 0) return;
    const prefabName = prompt("Podaj nazwę dla swojego prefabrykatu:", "Moja Konstrukcja");
    if (prefabName) {
      const blocksData = this.placedBlocks.map(block => ({
        x: block.position.x,
        y: block.position.y,
        z: block.position.z,
        texturePath: block.userData.texturePath
      }));
      const thumbnail = this.generateThumbnail();
      const success = await PrefabStorage.savePrefab(prefabName, blocksData, thumbnail);
      if (success) {
        alert(`Prefabrykat "${prefabName}" został pomyślnie zapisany!`);
        this.game.stateManager.switchToMainMenu();
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
    
    const rightUi = document.querySelector('.right-ui');
    if(rightUi) rightUi.style.display = 'flex';
    const buildElements = ['.build-top-left', '.build-sidebar-right', '.build-bottom-bar', '#build-rotate-zone'];
    buildElements.forEach(selector => { const el = document.querySelector(selector); if(el) el.style.display='none'; });

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
      const buildHeightLimit = 32;
      if (Math.abs(snappedPosition.x) < buildAreaLimit && Math.abs(snappedPosition.z) < buildAreaLimit && snappedPosition.y >= 0 && snappedPosition.y < buildHeightLimit) {
        if (this.previewBlock) this.previewBlock.visible = true;
        if (this.previewBlock) this.previewBlock.position.copy(snappedPosition);
      } else {
        if (this.previewBlock) this.previewBlock.visible = false;
      }
    } else {
      if (this.previewBlock) this.previewBlock.visible = false;
    }
  }

  onTouchStart(event) {
    if (!this.isActive || !this.game.isMobile || this.isEventOnUI(event)) return;
    event.preventDefault();
    this.isLongPress = false;
    const touch = event.touches[0];
    this.mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
    this.touchStartPosition = { x: touch.clientX, y: touch.clientY };
    clearTimeout(this.longPressTimer);
    this.longPressTimer = setTimeout(() => { this.isLongPress = true; this.removeBlock(); }, 500);
  }
  onTouchEnd(event) {
    if (!this.isActive || !this.game.isMobile || this.isEventOnUI(event)) return;
    clearTimeout(this.longPressTimer);
    if (!this.isLongPress && this.previewBlock && this.previewBlock.visible) { this.placeBlock(); }
  }
  onTouchMove(event) {
    if (!this.isActive || !this.game.isMobile) return;
    const touch = event.touches[0];
    const deltaX = touch.clientX - this.touchStartPosition.x;
    const deltaY = touch.clientY - this.touchStartPosition.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    if (distance > 10) { clearTimeout(this.longPressTimer); }
    this.mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
  }
}
