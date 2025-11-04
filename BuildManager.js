import * as THREE from 'three';
import { BuildCameraController } from './BuildCameraController.js';
import { WorldStorage } from './WorldStorage.js';

export class BuildManager {
  constructor(game, loadingManager) {
    this.game = game;
    this.scene = new THREE.Scene();
    this.isActive = false;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.previewBlock = null;
    this.placedBlocks = [];
    this.collidableBuildObjects = [];
    this.platform = null;
    this.platformSize = 64; // Domyślny rozmiar
    this.cameraController = null;
    this.blockTypes = [
      { name: 'Trawa', texturePath: 'textures/trawa.png' },
      { name: 'Ziemia', texturePath: 'textures/ziemia.png' },
      { name: 'Drewno', texturePath: 'textures/drewno.png' },
      { name: 'Beton', texturePath: 'textures/beton.png' },
      { name: 'Piasek', texturePath: 'textures/piasek.png' }
    ];
    this.selectedBlockType = this.blockTypes[0];
    this.textureLoader = new THREE.TextureLoader(loadingManager);
    this.materials = {};
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);

    this.longPressTimer = null;
    this.isLongPress = false;
    this.touchStartPosition = { x: 0, y: 0 };
    this.onTouchStart = this.onTouchStart.bind(this);
    this.onTouchEnd = this.onTouchEnd.bind(this);
    this.onTouchMove = this.onTouchMove.bind(this);
  }

  preloadTextures() {
    console.log("Preloading textures for build mode...");
    this.blockTypes.forEach(blockType => {
      if (!this.materials[blockType.texturePath]) {
        const texture = this.textureLoader.load(blockType.texturePath);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        this.materials[blockType.texturePath] = new THREE.MeshLambertMaterial({ map: texture });
      }
    });
  }

  // ZMIANA: Funkcja przyjmuje teraz rozmiar
  enterBuildMode(size = 64) {
    this.isActive = true;
    this.platformSize = size; // Ustawienie wybranego rozmiaru
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
    window.addEventListener('contextmenu', e => e.preventDefault());

    window.addEventListener('touchstart', this.onTouchStart, { passive: false });
    window.addEventListener('touchend', this.onTouchEnd);
    window.addEventListener('touchmove', this.onTouchMove);

    document.getElementById('build-exit-button').onclick = () => this.game.switchToMainMenu();
    document.getElementById('build-mode-button').onclick = () => this.toggleCameraMode();
    document.getElementById('build-add-button').onclick = () => {
        const panel = document.getElementById('block-selection-panel');
        panel.style.display = panel.style.display === 'flex' ? 'none' : 'flex';
    };
    document.getElementById('build-save-button').onclick = () => this.saveWorld();
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
      this.previewBlock.material = this.materials[blockType.texturePath].clone();
      this.previewBlock.material.transparent = true;
      this.previewBlock.material.opacity = 0.5;
      console.log(`Selected block: ${blockType.name}`);
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
    window.removeEventListener('contextmenu', e => e.preventDefault());

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

  saveWorld() {
    if (this.placedBlocks.length === 0) return;
    const worldName = prompt("Podaj nazwę dla swojego świata:", "Mój Nowy Świat");
    if (worldName) {
      const blocksData = this.placedBlocks.map(block => ({
        x: block.position.x,
        y: block.position.y,
        z: block.position.z,
        texturePath: block.userData.texturePath
      }));
      
      console.log("Saving world data:", JSON.stringify(blocksData, null, 2));

      if (WorldStorage.saveWorld(worldName, blocksData)) {
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
      if (
          Math.abs(snappedPosition.x) < buildAreaLimit && 
          Math.abs(snappedPosition.z) < buildAreaLimit && 
          snappedPosition.y >= 0
      ) {
        this.previewBlock.visible = true;
        this.previewBlock.position.copy(snappedPosition);
      } else {
        this.previewBlock.visible = false;
      }

    } else {
      this.previewBlock.visible = false;
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
    this.longPressTimer = setTimeout(() => {
        this.isLongPress = true;
        this.removeBlock();
    }, 500);
  }

  onTouchEnd(event) {
    if (!this.isActive || !this.game.isMobile || event.target.closest('.build-ui-button') || event.target.closest('#block-selection-panel') || event.target.closest('#joystick-zone')) return;

    clearTimeout(this.longPressTimer);
    
    if (!this.isLongPress && this.previewBlock.visible) {
        this.placeBlock();
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
