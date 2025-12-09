import * as THREE from 'three';
import { BuildCameraController } from './BuildCameraController.js';
import { HyperCubePartStorage } from './HyperCubePartStorage.js';

export class HyperCubePartBuilderManager {
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
    this.platformSize = 16;
    this.cameraController = null;
    this.blockTypes = [];
    this.selectedBlockType = null;
    this.textureLoader = new THREE.TextureLoader(loadingManager);
    this.materials = {};
    // Bindingi
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

  enterBuildMode() {
    this.isActive = true;
    this.blockTypes = this.blockManager.getOwnedBlockTypes();
    this.selectedBlockType = this.blockTypes[0] || null;

    this.preloadTextures();
    document.getElementById('build-ui-container').style.display = 'block';
    this.updateSaveButton();
    this.populateBlockSelectionPanel();
    
    this.scene.background = new THREE.Color(0x5e3434); 
    this.scene.fog = new THREE.Fog(0x5e3434, 20, 100);
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    this.scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(10, 20, 15);
    this.scene.add(directionalLight);
    
    this.createBuildPlatform();
    this.createPreviewBlock();
    
    this.cameraController = new BuildCameraController(this.game.camera, this.game.renderer.domElement);

    // FIX: KOLEJNOŚĆ UI NA MOBILE
    if (this.game.isMobile) {
        document.getElementById('jump-button').style.display = 'none';
        const joy = document.getElementById('joystick-zone');
        if(joy) { 
            joy.style.display = 'block'; 
            joy.innerHTML = ''; 
        }
    }
    
    this.cameraController.setIsMobile(this.game.isMobile);
    this.cameraController.distance = 25;

    this.setupBuildEventListeners();
  }

  createBuildPlatform() {
    const geometry = new THREE.BoxGeometry(this.platformSize, 1, this.platformSize);
    const material = new THREE.MeshLambertMaterial({ color: 0xbdc3c7, transparent: true, opacity: 0.5 });
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

    // FIX: Poprawione wywołanie stateManager
    document.getElementById('build-exit-button').onclick = () => this.game.stateManager.switchToMainMenu();
    
    document.getElementById('build-mode-button').onclick = () => this.toggleCameraMode();
    document.getElementById('build-add-button').onclick = () => {
        const panel = document.getElementById('block-selection-panel');
        panel.style.display = panel.style.display === 'flex' ? 'none' : 'flex';
    };
    document.getElementById('build-save-button').onclick = () => this.savePart();
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
  
  selectBlockType(blockType) {
      this.selectedBlockType = blockType;
      if (this.previewBlock) {
        this.previewBlock.material = this.materials[blockType.texturePath].clone();
        this.previewBlock.material.transparent = true;
        this.previewBlock.material.opacity = 0.6;
      }
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
    if (this.cameraController) this.cameraController.destroy();
  }
  
  onMouseMove(event) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }
  
  onMouseDown(event) {
    if (!this.isActive || this.game.isMobile || event.target.closest('.build-ui-button') || event.target.closest('#block-selection-panel') || event.target.closest('#joystick-zone')) return;
    if (event.button === 0 && this.previewBlock.visible) this.placeBlock();
    else if (event.button === 2) this.removeBlock();
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

  async savePart() {
    if (this.placedBlocks.length === 0) return;
    const partName = prompt("Podaj nazwę dla swojej części HyperCube:", "Moja Część");
    if (partName) {
      const blocksData = this.placedBlocks.map(block => ({
        x: block.position.x,
        y: block.position.y,
        z: block.position.z,
        texturePath: block.userData.texturePath
      }));
      const thumbnail = this.generateThumbnail();
      // FIX: Czekamy na serwer
      const success = await HyperCubePartStorage.savePart(partName, blocksData, thumbnail);
      if (success) {
        alert(`Część "${partName}" została pomyślnie zapisana!`);
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
    if (!this.isActive || !this.game.isMobile || event.target.closest('.build-ui-button') || event.target.closest('#block-selection-panel') || event.target.closest('#joystick-zone')) return;
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
    if (!this.isActive || !this.game.isMobile || event.target.closest('.build-ui-button') || event.target.closest('#block-selection-panel') || event.target.closest('#joystick-zone')) return;
    clearTimeout(this.longPressTimer);
    if (!this.isLongPress && this.previewBlock && this.previewBlock.visible) { this.placeBlock(); }
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