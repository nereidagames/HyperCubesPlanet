import * as THREE from 'three';
import { BuildCameraController } from './BuildCameraController.js';
import { WorldStorage } from './WorldStorage.js';
import { PrefabStorage } from './PrefabStorage.js';

const API_BASE_URL = 'https://hypercubes-nexus-server.onrender.com';
const JWT_TOKEN_KEY = 'bsp_clone_jwt_token';

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
    this.previewLineGroup = new THREE.Group();
    this.scene.add(this.previewLineGroup);

    this.currentBuildMode = 'block';
    this.currentTool = 'single';
    
    this.isDraggingLine = false;
    this.dragStartPos = null;

    this.selectedPrefabData = null;
    this.placedBlocks = [];
    this.collidableBuildObjects = [];
    this.platform = null;
    this.platformSize = 64;
    this.cameraController = null;
    
    this.isNexusMode = false;
    this.blockTypes = []; 
    this.selectedBlockType = null;
    
    this.textureLoader = new THREE.TextureLoader(loadingManager);
    this.materials = {};
    
    // OPTYMALIZACJA PAMIĘCI: Współdzielona geometria
    this.sharedBoxGeometry = new THREE.BoxGeometry(1, 1, 1);
    
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
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
        
        // --- OPTYMALIZACJA MOBILNA ---
        // NearestFilter jest najszybszy. 
        // NearestMipmapNearestFilter zapobiega "szumowi" w oddali, ale jest lekki.
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestMipmapNearestFilter;
        
        // Anizotropia 16 zabija wydajność na mobile przy tysiącach obiektów.
        // Dajemy 2, żeby podłoga nie była totalnie rozmyta, ale nie dławiła GPU.
        texture.anisotropy = 2;

        this.materials[blockType.texturePath] = new THREE.MeshLambertMaterial({ map: texture });
      }
    });
  }

  async enterBuildMode(size = 64, isNexusMode = false) {
    this.isActive = true;
    this.platformSize = size;
    this.isNexusMode = isNexusMode;
    
    this.blockTypes = this.blockManager.getOwnedBlockTypes();
    this.selectedBlockType = this.blockTypes[0] || null;
    this.currentBuildMode = 'block';
    this.currentTool = 'single';

    this.preloadTextures();
    document.getElementById('build-ui-container').style.display = 'block';
    
    const saveBtn = document.getElementById('build-save-button');
    if(saveBtn) saveBtn.textContent = isNexusMode ? "Zapisz Nexus" : "Zapisz";

    this.updateSaveButton();
    this.populateBlockSelectionPanel();
    this.setupToolButtons();
    
    this.scene.background = new THREE.Color(0x87CEEB);
    // Mgła pozwala ukryć brak renderowania w oddali i poprawia klimat
    this.scene.fog = new THREE.Fog(0x87CEEB, 40, 160);
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);
    
    // --- KRYTYCZNA OPTYMALIZACJA ---
    // Wyłączamy cienie w trybie budowania na mobile. 
    // To jest edytor, płynność jest ważniejsza niż cienie.
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(50, 80, 50);
    directionalLight.castShadow = false; // WYŁĄCZONE CIENIE DLA FPS
    
    this.scene.add(directionalLight);
    
    this.createBuildPlatform();
    this.createPreviewBlock();
    this.previewPrefab = new THREE.Group();
    this.scene.add(this.previewPrefab);
    
    this.cameraController = new BuildCameraController(this.game.camera, this.game.renderer.domElement);
    this.cameraController.setIsMobile(this.game.isMobile);

    if (this.game.isMobile) {
        const mobileControls = document.getElementById('mobile-game-controls');
        const jumpBtn = document.getElementById('jump-button');
        const joystickZone = document.getElementById('joystick-zone');
        const addBtn = document.getElementById('build-add-button');

        if (mobileControls) mobileControls.style.display = 'block';
        if (jumpBtn) jumpBtn.style.display = 'none'; 
        if (joystickZone) joystickZone.style.display = 'block';
        if (addBtn) addBtn.style.bottom = '150px';
    } else {
        const addBtn = document.getElementById('build-add-button');
        if (addBtn) addBtn.style.bottom = '20px';
    }

    this.setupBuildEventListeners();

    if (this.isNexusMode) {
        await this.loadExistingNexus();
    }
  }

  setupToolButtons() {
      const btnSingle = document.getElementById('tool-single');
      const btnLine = document.getElementById('tool-line');

      if(btnSingle && btnLine) {
          btnSingle.classList.add('active');
          btnLine.classList.remove('active');

          btnSingle.onclick = () => {
              this.currentTool = 'single';
              btnSingle.classList.add('active');
              btnLine.classList.remove('active');
          };

          btnLine.onclick = () => {
              this.currentTool = 'line';
              btnLine.classList.add('active');
              btnSingle.classList.remove('active');
          };
      }
  }

  getPointsOnLine(start, end) {
      const points = [];
      const dist = start.distanceTo(end);
      const steps = Math.ceil(dist); 
      
      for (let i = 0; i <= steps; i++) {
          const t = steps === 0 ? 0 : i / steps;
          const point = new THREE.Vector3().lerpVectors(start, end, t);
          point.floor().addScalar(0.5); 

          const exists = points.some(p => p.equals(point));
          if (!exists) points.push(point);
      }
      return points;
  }

  updateLinePreview(targetPos) {
      while(this.previewLineGroup.children.length > 0){ 
          this.previewLineGroup.remove(this.previewLineGroup.children[0]); 
      }

      if (!this.isDraggingLine || !this.dragStartPos || !this.selectedBlockType) return;

      const points = this.getPointsOnLine(this.dragStartPos, targetPos);
      const geo = this.sharedBoxGeometry;
      const mat = this.materials[this.selectedBlockType.texturePath].clone();
      mat.transparent = true;
      mat.opacity = 0.4;

      points.forEach(p => {
          const mesh = new THREE.Mesh(geo, mat);
          mesh.position.copy(p);
          this.previewLineGroup.add(mesh);
      });
  }

  placeLine() {
      this.previewLineGroup.children.forEach(ghost => {
          const geo = this.sharedBoxGeometry;
          const mat = this.materials[this.selectedBlockType.texturePath];
          const b = new THREE.Mesh(geo, mat);
          b.userData.texturePath = this.selectedBlockType.texturePath;
          b.position.copy(ghost.position);
          // Wyłączone cienie dla wydajności
          b.castShadow = false; 
          b.receiveShadow = false; 
          
          this.scene.add(b);
          this.placedBlocks.push(b);
          this.collidableBuildObjects.push(b);
      });
      
      while(this.previewLineGroup.children.length > 0){ 
          this.previewLineGroup.remove(this.previewLineGroup.children[0]); 
      }
      this.updateSaveButton();
  }

  async loadExistingNexus() {
      try {
          const response = await fetch(`${API_BASE_URL}/api/nexus`);
          if (response.ok) {
              const blocksData = await response.json();
              if (Array.isArray(blocksData)) {
                  const batchSize = 200; // Większy batch bo bloki są lżejsze (bez cieni)
                  for (let i = 0; i < blocksData.length; i += batchSize) {
                      const batch = blocksData.slice(i, i + batchSize);
                      batch.forEach(blockData => {
                          const geometry = this.sharedBoxGeometry;
                          let material = this.materials[blockData.texturePath];
                          if (!material) {
                              const texture = this.textureLoader.load(blockData.texturePath);
                              
                              texture.magFilter = THREE.NearestFilter;
                              texture.minFilter = THREE.NearestMipmapNearestFilter;
                              texture.anisotropy = 2;

                              material = new THREE.MeshLambertMaterial({ map: texture });
                              this.materials[blockData.texturePath] = material;
                          }

                          const mesh = new THREE.Mesh(geometry, material);
                          mesh.position.set(blockData.x, blockData.y, blockData.z);
                          mesh.userData.texturePath = blockData.texturePath;
                          
                          // WYŁĄCZONE CIENIE DLA KAŻDEGO BLOKU
                          mesh.castShadow = false;
                          mesh.receiveShadow = false;

                          this.scene.add(mesh);
                          this.placedBlocks.push(mesh);
                          this.collidableBuildObjects.push(mesh);
                      });
                      if (i % 500 === 0) await new Promise(r => setTimeout(r, 0));
                  }
                  this.updateSaveButton();
              }
          }
      } catch (e) {
          console.warn("Błąd pobierania Nexusa (może być pusty):", e);
      }
  }

  createBuildPlatform() {
    const geometry = new THREE.BoxGeometry(this.platformSize, 1, this.platformSize);
    const material = new THREE.MeshLambertMaterial({ color: 0x559022 });
    this.platform = new THREE.Mesh(geometry, material);
    this.platform.position.y = -0.5;
    this.platform.receiveShadow = false; // Wyłączone cienie
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
    window.addEventListener('mouseup', this.onMouseUp);
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
    
    document.getElementById('build-save-button').onclick = () => {
        if (this.isNexusMode) {
            this.saveNexus();
        } else {
            this.saveWorld();
        }
    };

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

  showPrefabSelectionPanel() {
      const panel = document.getElementById('prefab-selection-panel');
      panel.innerHTML = '';
      const prefabNames = PrefabStorage.getSavedPrefabsList();
      if (prefabNames.length === 0) {
          panel.innerHTML = '<div class="panel-item text-outline">Brak prefabrykatów</div>';
      } else {
          prefabNames.forEach(name => {
              const item = document.createElement('div');
              item.className = 'panel-item text-outline prefab-item';
              item.textContent = name;
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
          const geo = this.sharedBoxGeometry;
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
    window.removeEventListener('mouseup', this.onMouseUp);
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
  
  onMouseMove(e) {
    this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    
    if(this.isDraggingLine) {
        this.updateRaycast();
        if(this.previewBlock.visible) this.updateLinePreview(this.previewBlock.position);
    }
  }
  
  onMouseDown(e) {
    if (!this.isActive || this.game.isMobile || e.target.closest('.build-ui-button') || e.target.closest('.panel-list') || e.target.closest('#build-tools-right')) return;
    
    if (e.button === 0) {
        if (this.currentBuildMode === 'block' && this.previewBlock.visible) {
            if (this.currentTool === 'line') {
                this.isDraggingLine = true;
                this.dragStartPos = this.previewBlock.position.clone();
                this.previewBlock.visible = false; 
            } else {
                this.placeBlock();
            }
        } else if (this.currentBuildMode === 'prefab' && this.previewPrefab.visible) {
            this.placePrefab();
        }
    } else if (e.button === 2) {
        this.removeBlock();
    }
  }

  onMouseUp(e) {
      if (this.isDraggingLine) {
          this.isDraggingLine = false;
          this.placeLine();
          this.previewBlock.visible = true;
      }
  }

  onTouchStart(event) {
    if (!this.isActive || !this.game.isMobile || event.target.closest('.build-ui-button') || event.target.closest('.panel-list') || event.target.closest('#build-tools-right') || event.target.closest('#joystick-zone')) return;
    
    const touch = event.touches[0];
    if (event.touches.length > 1) return;

    event.preventDefault();
    this.isLongPress = false;
    
    this.mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
    this.touchStartPosition.x = touch.clientX;
    this.touchStartPosition.y = touch.clientY;

    this.updateRaycast();

    if (this.currentTool === 'line' && this.previewBlock.visible) {
        this.isDraggingLine = true;
        this.dragStartPos = this.previewBlock.position.clone();
        this.previewBlock.visible = false;
        this.isLongPress = false;
    } else {
        this.isLongPress = false;
        clearTimeout(this.longPressTimer);
        this.longPressTimer = setTimeout(() => { this.isLongPress = true; this.removeBlock(); }, 500);
    }
  }

  onTouchMove(event) {
    if (!this.isActive || !this.game.isMobile) return;
    const touch = event.touches[0];
    
    if (this.isDraggingLine) {
        this.mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
        this.updateRaycast();
        if(this.previewBlock.visible) {
            this.updateLinePreview(this.previewBlock.position);
        }
    } else {
        const deltaX = touch.clientX - this.touchStartPosition.x;
        const deltaY = touch.clientY - this.touchStartPosition.y;
        if (Math.sqrt(deltaX*deltaX + deltaY*deltaY) > 10) clearTimeout(this.longPressTimer);
    }
  }

  onTouchEnd(event) {
    if (!this.isActive || !this.game.isMobile) return;
    if (event.target.closest('.build-ui-button') || event.target.closest('#build-tools-right')) return;

    clearTimeout(this.longPressTimer);
    
    if (this.isDraggingLine) {
        this.isDraggingLine = false;
        this.placeLine();
        this.previewBlock.visible = true;
    } else if (!this.isLongPress) {
        if (this.currentBuildMode === 'block' && this.previewBlock.visible && this.currentTool === 'single') this.placeBlock();
        else if (this.currentBuildMode === 'prefab' && this.previewPrefab.visible) this.placePrefab();
    }
  }

  updateRaycast() {
      this.raycaster.setFromCamera(this.mouse, this.game.camera);
      const intersects = this.raycaster.intersectObjects(this.collidableBuildObjects);
      if (intersects.length > 0) {
          const intersect = intersects[0];
          const normal = intersect.face.normal.clone();
          const snappedPosition = new THREE.Vector3().copy(intersect.point).add(normal.multiplyScalar(0.5)).floor().addScalar(0.5);
          
          const limit = this.platformSize / 2;
          if (Math.abs(snappedPosition.x) < limit && Math.abs(snappedPosition.z) < limit && snappedPosition.y >= 0) {
              this.previewBlock.position.copy(snappedPosition);
              this.previewBlock.visible = true;
          } else {
              this.previewBlock.visible = false;
          }
      } else {
          this.previewBlock.visible = false;
      }
  }

  update(deltaTime) {
    if (!this.isActive) return;
    this.cameraController.update(deltaTime);
    
    if (!this.isDraggingLine) {
        this.updateRaycast();
        if (this.currentBuildMode === 'prefab' && this.previewBlock.visible) {
             this.previewPrefab.position.copy(this.previewBlock.position);
             this.previewPrefab.visible = true;
             this.previewBlock.visible = false;
        }
    }
  }

  placeBlock() {
    if (!this.selectedBlockType) return;
    const g = this.sharedBoxGeometry;
    const m = this.materials[this.selectedBlockType.texturePath];
    const b = new THREE.Mesh(g, m);
    b.userData.texturePath = this.selectedBlockType.texturePath;
    b.position.copy(this.previewBlock.position);
    b.castShadow = false;
    b.receiveShadow = false;
    this.scene.add(b);
    this.placedBlocks.push(b);
    this.collidableBuildObjects.push(b);
    this.updateSaveButton();
  }
  
  placePrefab() {
    if (!this.selectedPrefabData) return;
    const l = this.platformSize / 2;
    this.selectedPrefabData.forEach(d => {
        const p = new THREE.Vector3(d.x, d.y, d.z).add(this.previewPrefab.position);
        if (Math.abs(p.x) < l && Math.abs(p.z) < l && p.y >= 0) {
            const g = this.sharedBoxGeometry;
            const m = this.materials[d.texturePath];
            const b = new THREE.Mesh(g, m);
            b.userData.texturePath = d.texturePath;
            b.position.copy(p);
            b.castShadow = false;
            b.receiveShadow = false;
            this.scene.add(b);
            this.placedBlocks.push(b);
            this.collidableBuildObjects.push(b);
        }
    });
    this.updateSaveButton();
  }
  
  removeBlock() {
    this.raycaster.setFromCamera(this.mouse, this.game.camera);
    const i = this.raycaster.intersectObjects(this.placedBlocks);
    if (i.length > 0) {
      const o = i[0].object;
      this.scene.remove(o);
      this.placedBlocks = this.placedBlocks.filter(b => b !== o);
      this.collidableBuildObjects = this.collidableBuildObjects.filter(b => b !== o);
      this.updateSaveButton();
    }
  }
  
  updateSaveButton() {
    const b = document.getElementById('build-save-button');
    if (this.placedBlocks.length > 0) {
      b.style.opacity = '1';
      b.style.cursor = 'pointer';
    } else {
      if (this.isNexusMode && this.placedBlocks.length === 0) {
          b.style.opacity = '1';
          b.style.cursor = 'pointer';
      } else {
          b.style.opacity = '0.5';
          b.style.cursor = 'not-allowed';
      }
    }
  }

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

  async saveNexus() {
      const token = localStorage.getItem(JWT_TOKEN_KEY);
      if (!token) { alert("Błąd autoryzacji!"); return; }

      const blocksData = this.placedBlocks.map(block => ({
        x: block.position.x,
        y: block.position.y,
        z: block.position.z,
        texturePath: block.userData.texturePath
      }));

      const saveBtn = document.getElementById('build-save-button');
      saveBtn.textContent = "Zapisywanie...";
      saveBtn.style.cursor = 'wait';

      try {
          const response = await fetch(`${API_BASE_URL}/api/nexus`, {
              method: 'POST',
              headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ blocks: blocksData })
          });

          const result = await response.json();
          
          if (response.ok) {
              alert("Nexus zaktualizowany!");
              this.game.switchToMainMenu();
          } else {
              alert(`Błąd: ${result.message}`);
          }
      } catch (e) {
          alert("Błąd sieci.");
          console.error(e);
      } finally {
          saveBtn.textContent = "Zapisz Nexus";
          saveBtn.style.cursor = 'pointer';
      }
  }

  async saveWorld() {
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
      
      const success = await WorldStorage.saveWorld(worldName, worldData);
      
      if (success) {
        alert(`Świat "${worldName}" został pomyślnie zapisany na serwerze!`);
        this.game.switchToMainMenu();
      }
    }
  }

  exitBuildMode() {
    this.isActive = false;
    this.isNexusMode = false;
    
    this.removeBuildEventListeners();
    this.collidableBuildObjects = [];
    this.placedBlocks = [];
    while(this.scene.children.length > 0){ this.scene.remove(this.scene.children[0]); }
    document.getElementById('build-ui-container').style.display = 'none';
    
    const saveBtn = document.getElementById('build-save-button');
    if(saveBtn) saveBtn.textContent = "Zapisz";

    const addBtn = document.getElementById('build-add-button');
    if (addBtn) addBtn.style.bottom = '20px';

    if (this.game.isMobile) {
        document.getElementById('jump-button').style.display = 'block';
        document.getElementById('joystick-zone').style.display = 'none';
    }
  }
}