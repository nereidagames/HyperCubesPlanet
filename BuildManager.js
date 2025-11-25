import * as THREE from 'three';
import { BuildCameraController } from './BuildCameraController.js';
import { WorldStorage } from './WorldStorage.js';
import { PrefabStorage } from './PrefabStorage.js';

const API_BASE_URL = 'https://hypercubes-nexus-server.onrender.com';

export class BuildManager {
  // ... (konstruktor, onContextMenu, preloadTextures bez zmian)
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
    this.isNexusMode = false;
    this.baseCharacterVisuals = null;
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

  async enterBuildMode(size = 64, isNexusMode = false) {
    this.isActive = true;
    this.platformSize = size;
    this.isNexusMode = isNexusMode;
    
    this.blockTypes = this.blockManager.getOwnedBlockTypes();
    this.selectedBlockType = this.blockTypes[0] || null;
    this.currentBuildMode = 'block';

    this.preloadTextures();
    document.getElementById('build-ui-container').style.display = 'block';
    
    const saveBtn = document.getElementById('build-save-button');
    if(saveBtn) saveBtn.textContent = isNexusMode ? "Zapisz Nexus" : "Zapisz";

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

    // --- KONFIGURACJA UI MOBILNEGO DLA BUDOWANIA ---
    if (this.game.isMobile) {
        const mobileControls = document.getElementById('mobile-game-controls');
        const jumpBtn = document.getElementById('jump-button');
        const joystickZone = document.getElementById('joystick-zone');

        if (mobileControls) mobileControls.style.display = 'block'; // Pokaż kontener
        if (jumpBtn) jumpBtn.style.display = 'none'; // Ukryj skok (niepotrzebny w budowaniu)
        if (joystickZone) joystickZone.style.display = 'block'; // Pokaż strefę joysticka
        
        // Ważne: CameraController sam utworzy nipplejs wewnątrz joystickZone
    }

    this.setupBuildEventListeners();

    if (this.isNexusMode) {
        await this.loadExistingNexus();
    }
  }
  
  // ... (loadExistingNexus, createBuildPlatform, createPreviewBlock, setupBuildEventListeners, populateBlockSelectionPanel, showPrefabSelectionPanel, selectBlockType, selectPrefab, toggleCameraMode, removeBuildEventListeners - BEZ ZMIAN - użyj z poprzedniej wersji)
  
  async loadExistingNexus() { try { const r = await fetch(`${API_BASE_URL}/api/nexus`); if (r.ok) { const d = await r.json(); if (Array.isArray(d)) { d.forEach(b => { const g = new THREE.BoxGeometry(1, 1, 1); let m = this.materials[b.texturePath]; if (!m) { const t = this.textureLoader.load(b.texturePath); t.magFilter = THREE.NearestFilter; m = new THREE.MeshLambertMaterial({ map: t }); this.materials[b.texturePath] = m; } const mesh = new THREE.Mesh(g, m); mesh.position.set(b.x, b.y, b.z); mesh.userData.texturePath = b.texturePath; mesh.castShadow = true; mesh.receiveShadow = true; this.scene.add(mesh); this.placedBlocks.push(mesh); this.collidableBuildObjects.push(mesh); }); this.updateSaveButton(); } } } catch (e) {} }
  createBuildPlatform() { const g = new THREE.BoxGeometry(this.platformSize, 1, this.platformSize); const m = new THREE.MeshLambertMaterial({ color: 0x559022 }); this.platform = new THREE.Mesh(g, m); this.platform.position.y = -0.5; this.platform.receiveShadow = true; this.scene.add(this.platform); this.collidableBuildObjects.push(this.platform); const e = new THREE.EdgesGeometry(g); const l = new THREE.LineSegments(e, new THREE.LineBasicMaterial({ color: 0x8A2BE2, linewidth: 4 })); l.position.y = -0.5; this.scene.add(l); }
  createPreviewBlock() { if (!this.selectedBlockType) return; const g = new THREE.BoxGeometry(1.01, 1.01, 1.01); const m = this.materials[this.selectedBlockType.texturePath].clone(); m.transparent = true; m.opacity = 0.5; this.previewBlock = new THREE.Mesh(g, m); this.previewBlock.visible = false; this.scene.add(this.previewBlock); }
  setupBuildEventListeners() { window.addEventListener('mousemove', this.onMouseMove); window.addEventListener('mousedown', this.onMouseDown); window.addEventListener('contextmenu', this.onContextMenu); window.addEventListener('touchstart', this.onTouchStart, { passive: false }); window.addEventListener('touchend', this.onTouchEnd); window.addEventListener('touchmove', this.onTouchMove); document.getElementById('build-exit-button').onclick = () => this.game.switchToMainMenu(); document.getElementById('build-mode-button').onclick = () => this.toggleCameraMode(); document.getElementById('build-add-button').onclick = () => { document.getElementById('add-choice-panel').style.display = 'flex'; document.getElementById('add-choice-parts').style.display = 'none'; document.getElementById('add-choice-prefabs').style.display = 'block'; }; document.getElementById('build-save-button').onclick = () => { if (this.isNexusMode) this.saveNexus(); else this.saveWorld(); }; document.getElementById('add-choice-blocks').onclick = () => { document.getElementById('add-choice-panel').style.display = 'none'; document.getElementById('block-selection-panel').style.display = 'flex'; }; document.getElementById('add-choice-prefabs').onclick = () => { document.getElementById('add-choice-panel').style.display = 'none'; this.showPrefabSelectionPanel(); }; document.getElementById('add-choice-close').onclick = () => { document.getElementById('add-choice-panel').style.display = 'none'; }; }
  populateBlockSelectionPanel() { const p = document.getElementById('block-selection-panel'); p.innerHTML = ''; this.blockTypes.forEach(b => { const i = document.createElement('div'); i.className = 'block-item'; i.style.backgroundImage = `url(${b.texturePath})`; i.style.backgroundSize = 'cover'; i.onclick = () => { this.selectBlockType(b); p.style.display = 'none'; }; p.appendChild(i); }); }
  showPrefabSelectionPanel() { const p = document.getElementById('prefab-selection-panel'); p.innerHTML = ''; const n = PrefabStorage.getSavedPrefabsList(); if (n.length === 0) p.innerHTML = '<div class="panel-item text-outline">Brak prefabrykatów</div>'; else n.forEach(x => { const i = document.createElement('div'); i.className = 'panel-item text-outline prefab-item'; i.textContent = x; i.onclick = () => { this.selectPrefab(x); p.style.display = 'none'; }; p.appendChild(i); }); p.style.display = 'flex'; }
  selectBlockType(t) { this.currentBuildMode = 'block'; this.selectedBlockType = t; if (this.previewBlock) { this.previewBlock.material = this.materials[t.texturePath].clone(); this.previewBlock.material.transparent = true; this.previewBlock.material.opacity = 0.5; } this.previewPrefab.visible = false; this.previewBlock.visible = true; }
  selectPrefab(n) { this.currentBuildMode = 'prefab'; this.selectedPrefabData = PrefabStorage.loadPrefab(n); if (!this.selectedPrefabData) return; while(this.previewPrefab.children.length) this.previewPrefab.remove(this.previewPrefab.children[0]); this.selectedPrefabData.forEach(b => { const g = new THREE.BoxGeometry(1, 1, 1); const m = this.materials[b.texturePath].clone(); m.transparent = true; m.opacity = 0.5; const mesh = new THREE.Mesh(g, m); mesh.position.set(b.x, b.y, b.z); this.previewPrefab.add(mesh); }); this.previewBlock.visible = false; this.previewPrefab.visible = true; }
  toggleCameraMode() { const b = document.getElementById('build-mode-button'); if (this.cameraController.mode === 'orbital') { this.cameraController.setMode('free'); b.textContent = 'Zaawansowany'; } else { this.cameraController.setMode('orbital'); b.textContent = 'Łatwy'; } }
  removeBuildEventListeners() { window.removeEventListener('mousemove', this.onMouseMove); window.removeEventListener('mousedown', this.onMouseDown); window.removeEventListener('contextmenu', this.onContextMenu); window.removeEventListener('touchstart', this.onTouchStart); window.removeEventListener('touchend', this.onTouchEnd); window.removeEventListener('touchmove', this.onTouchMove); document.getElementById('build-exit-button').onclick = null; document.getElementById('build-mode-button').onclick = null; document.getElementById('build-add-button').onclick = null; document.getElementById('build-save-button').onclick = null; if (this.cameraController) this.cameraController.destroy(); }
  onMouseMove(e) { this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1; this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1; }
  onMouseDown(e) { if (!this.isActive || this.game.isMobile || e.target.closest('.build-ui-button') || e.target.closest('#block-selection-panel') || e.target.closest('#prefab-selection-panel') || e.target.closest('#add-choice-panel') || e.target.closest('#joystick-zone')) return; if (e.button === 0) { if (this.currentBuildMode === 'block' && this.previewBlock.visible) this.placeBlock(); else if (this.currentBuildMode === 'prefab' && this.previewPrefab.visible) this.placePrefab(); } else if (e.button === 2) this.removeBlock(); }
  placeBlock() { if (!this.selectedBlockType) return; const g = new THREE.BoxGeometry(1, 1, 1); const m = this.materials[this.selectedBlockType.texturePath]; const b = new THREE.Mesh(g, m); b.userData.texturePath = this.selectedBlockType.texturePath; b.position.copy(this.previewBlock.position); b.castShadow = true; b.receiveShadow = true; this.scene.add(b); this.placedBlocks.push(b); this.collidableBuildObjects.push(b); this.updateSaveButton(); }
  placePrefab() { if (!this.selectedPrefabData) return; const l = this.platformSize / 2; this.selectedPrefabData.forEach(d => { const p = new THREE.Vector3(d.x, d.y, d.z).add(this.previewPrefab.position); if (Math.abs(p.x) < l && Math.abs(p.z) < l && p.y >= 0) { const g = new THREE.BoxGeometry(1, 1, 1); const m = this.materials[d.texturePath]; const b = new THREE.Mesh(g, m); b.userData.texturePath = d.texturePath; b.position.copy(p); b.castShadow = true; b.receiveShadow = true; this.scene.add(b); this.placedBlocks.push(b); this.collidableBuildObjects.push(b); } }); this.updateSaveButton(); }
  removeBlock() { this.raycaster.setFromCamera(this.mouse, this.game.camera); const i = this.raycaster.intersectObjects(this.placedBlocks); if (i.length > 0) { const o = i[0].object; this.scene.remove(o); this.placedBlocks = this.placedBlocks.filter(b => b !== o); this.collidableBuildObjects = this.collidableBuildObjects.filter(b => b !== o); this.updateSaveButton(); } }
  updateSaveButton() { const b = document.getElementById('build-save-button'); if (this.placedBlocks.length > 0) { b.style.opacity = '1'; b.style.cursor = 'pointer'; } else { if (this.isNexusMode && this.placedBlocks.length === 0) { b.style.opacity = '1'; b.style.cursor = 'pointer'; } else { b.style.opacity = '0.5'; b.style.cursor = 'not-allowed'; } } }

  // --- GENEROWANIE MINIATURKI (DLA ŚWIATA) ---
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
      const token = localStorage.getItem('bsp_clone_jwt_token');
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

    // PRZYWRACANIE UI GŁÓWNEGO
    if (this.game.isMobile) {
        // Przywróć przycisk skoku, ale ukryj strefę joysticka (bo w main menu jest inna logika lub ukryte)
        // W main.js toggleMobileControls(true) powinno przywrócić właściwy stan.
        // Tutaj ważne, żeby ukryć ten z budowania.
        document.getElementById('joystick-zone').style.display = 'none'; // Ukryj joystick budowania
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
    this.longPressTimer = setTimeout(() => { this.isLongPress = true; this.removeBlock(); }, 500);
  }

  onTouchEnd(event) {
    if (!this.isActive || !this.game.isMobile || event.target.closest('.build-ui-button') || event.target.closest('#block-selection-panel') || event.target.closest('#prefab-selection-panel') || event.target.closest('#add-choice-panel') || event.target.closest('#joystick-zone')) return;
    clearTimeout(this.longPressTimer);
    if (!this.isLongPress) {
        if (this.currentBuildMode === 'block' && this.previewBlock.visible) this.placeBlock();
        else if (this.currentBuildMode === 'prefab' && this.previewPrefab.visible) this.placePrefab();
    }
  }

  onTouchMove(event) {
    if (!this.isActive || !this.game.isMobile) return;
    const touch = event.touches[0];
    const deltaX = touch.clientX - this.touchStartPosition.x;
    const deltaY = touch.clientY - this.touchStartPosition.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    if (distance > 10) clearTimeout(this.longPressTimer);
    this.mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
  }
}