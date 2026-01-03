/* PLIK: scene.js */

import * as THREE from 'three';

const API_BASE_URL = 'https://hypercubes-nexus-server.onrender.com';

export class SceneManager {
  constructor(scene, loadingManager, blockManager) { // Dodano blockManager
    this.scene = scene;
    this.loadingManager = loadingManager;
    this.blockManager = blockManager; // Zapisujemy referencję
    
    this.collidableObjects = []; 
    this.collisionMap = new Map();
    
    this.MAP_SIZE = 64;
    this.BLOCK_SIZE = 1;
    this.BARRIER_HEIGHT = 100; 
    this.BARRIER_THICKNESS = 1;
    this.FLOOR_TOP_Y = 0.1; 
    
    this.isInitialized = false;
    
    this.textureLoader = new THREE.TextureLoader(this.loadingManager);
    this.materials = {};
    
    this.sharedCollisionGeometry = new THREE.BoxGeometry(1, 1, 1);
    
    this.maxAnisotropy = 4; 
    
    this.environmentObjects = [];
  }
  
  async initialize() {
    if (this.isInitialized) return;

    const renderer = new THREE.WebGLRenderer();
    const maxAnisotropyCap = renderer.capabilities.getMaxAnisotropy();
    this.maxAnisotropy = Math.min(4, maxAnisotropyCap); 
    renderer.dispose();

    this.setupLighting();
    this.setupFog();

    const nexusLoaded = await this.loadNexusFromDB();

    if (!nexusLoaded) {
        console.log("Generowanie domyślnej podłogi...");
        this.createCheckerboardFloor();
    }

    this.createBarrierBlocks();

    this.isInitialized = true;
    console.log("SceneManager zainicjalizowany.");
  }

  clearEnvironment() {
      this.environmentObjects.forEach(obj => {
          this.scene.remove(obj);
          if (obj.geometry) obj.geometry.dispose();
      });
      this.environmentObjects = [];
      this.collidableObjects = [];
      this.collisionMap.clear();
      this.isInitialized = false;
  }
  
  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7); 
    this.scene.add(ambientLight);
    this.environmentObjects.push(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(30, 60, 40); 
    directionalLight.castShadow = true;
    
    directionalLight.shadow.mapSize.width = 512; 
    directionalLight.shadow.mapSize.height = 512;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 100;
    
    const shadowSize = 35;
    directionalLight.shadow.camera.left = -shadowSize;
    directionalLight.shadow.camera.right = shadowSize;
    directionalLight.shadow.camera.top = shadowSize;
    directionalLight.shadow.camera.bottom = -shadowSize;
    directionalLight.shadow.bias = -0.0005;
    
    this.scene.add(directionalLight);
    this.environmentObjects.push(directionalLight);
  }
  
  setupFog() {
    this.scene.fog = new THREE.Fog(0x87CEEB, 15, 80);
  }

  getMapKey(x, y, z) {
      return `${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`;
  }

  async loadNexusFromDB() {
      try {
          const response = await fetch(`${API_BASE_URL}/api/nexus`);
          if (!response.ok) return false; 

          const blocksData = await response.json();
          if (!Array.isArray(blocksData) || blocksData.length === 0) return false;

          const blocksByTexture = {};
          this.collisionMap.clear(); 

          blocksData.forEach(block => {
              // --- FIX: OBSŁUGA ID i KONWERSJA NA TEKSTURĘ ---
              // Jeśli blok ma ID zamiast texturePath (nowy format), odzyskujemy ścieżkę
              if (block.id !== undefined && !block.texturePath) {
                  if (this.blockManager) {
                      block.texturePath = this.blockManager.getTextureById(block.id);
                  } else {
                      console.warn("BlockManager not linked in SceneManager!");
                      block.texturePath = 'textures/ziemia.png'; // Fallback
                  }
              }

              // Jeśli nadal nie ma tekstury, pomiń
              if (!block.texturePath) return;

              if (!blocksByTexture[block.texturePath]) {
                  blocksByTexture[block.texturePath] = [];
              }
              blocksByTexture[block.texturePath].push(block);
          });

          const dummy = new THREE.Object3D();

          for (const [texturePath, blocks] of Object.entries(blocksByTexture)) {
              
              let material = this.materials[texturePath];
              if (!material) {
                  const texture = this.textureLoader.load(texturePath);
                  texture.magFilter = THREE.NearestFilter;
                  texture.minFilter = THREE.NearestFilter;
                  material = new THREE.MeshLambertMaterial({ map: texture });
                  this.materials[texturePath] = material;
              }

              const instancedMesh = new THREE.InstancedMesh(this.sharedCollisionGeometry, material, blocks.length);
              instancedMesh.castShadow = true;
              instancedMesh.receiveShadow = true;

              blocks.forEach((block, index) => {
                  dummy.position.set(block.x, block.y, block.z);
                  dummy.updateMatrix();
                  instancedMesh.setMatrixAt(index, dummy.matrix);

                  const key = this.getMapKey(block.x, block.y, block.z);
                  const collisionData = {
                      isBlock: true,
                      position: new THREE.Vector3(block.x, block.y, block.z),
                      boundingBox: new THREE.Box3().setFromCenterAndSize(
                          new THREE.Vector3(block.x, block.y, block.z), 
                          new THREE.Vector3(1, 1, 1)
                      )
                  };
                  this.collisionMap.set(key, collisionData);
              });

              instancedMesh.instanceMatrix.needsUpdate = true;
              this.scene.add(instancedMesh);
              this.environmentObjects.push(instancedMesh);
          }

          const floorGeo = new THREE.PlaneGeometry(300, 300);
          floorGeo.rotateX(-Math.PI / 2);
          const floorMat = new THREE.MeshBasicMaterial({ visible: false });
          const invisibleFloor = new THREE.Mesh(floorGeo, floorMat);
          invisibleFloor.position.y = -0.5;
          this.scene.add(invisibleFloor);
          this.collidableObjects.push(invisibleFloor);
          this.environmentObjects.push(invisibleFloor);

          return true;
      } catch (error) {
          console.error("Błąd ładowania Nexusa:", error);
          return false;
      }
  }
  
  createCheckerboardFloor() {
    const floorSize = this.MAP_SIZE;
    const floorGeometry = new THREE.PlaneGeometry(floorSize, floorSize);
    floorGeometry.rotateX(-Math.PI / 2);

    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 2;
    const context = canvas.getContext('2d');
    context.fillStyle = '#c0c0c0';
    context.fillRect(0, 0, 2, 2);
    context.fillStyle = '#a0a0a0';
    context.fillRect(0, 0, 1, 1);
    context.fillRect(1, 1, 1, 1);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.repeat.set(floorSize / 2, floorSize / 2);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    const floorMaterial = new THREE.MeshLambertMaterial({ map: texture });
    const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
    floorMesh.receiveShadow = true;
    floorMesh.position.y = -0.5;
    
    this.scene.add(floorMesh);
    this.collidableObjects.push(floorMesh);
    this.environmentObjects.push(floorMesh);

    const borderGeometry = new THREE.BoxGeometry(this.MAP_SIZE, 1, this.MAP_SIZE);
    const edges = new THREE.EdgesGeometry(borderGeometry);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x8A2BE2, linewidth: 2 });
    const line = new THREE.LineSegments(edges, lineMaterial);
    line.position.y = -0.5;
    this.scene.add(line);
    this.environmentObjects.push(line);
  }
  
  createBarrierBlocks() {
    const halfMapSize = this.MAP_SIZE / 2;
    const barrierY = this.BARRIER_HEIGHT / 2; 
    const barrierMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
    const thickness = this.BARRIER_THICKNESS;

    const walls = [];
    const wallZ1 = new THREE.Mesh(new THREE.BoxGeometry(this.MAP_SIZE, this.BARRIER_HEIGHT, thickness), barrierMaterial);
    wallZ1.position.set(0, barrierY, halfMapSize);
    walls.push(wallZ1);

    const wallZ2 = new THREE.Mesh(new THREE.BoxGeometry(this.MAP_SIZE, this.BARRIER_HEIGHT, thickness), barrierMaterial);
    wallZ2.position.set(0, barrierY, -halfMapSize);
    walls.push(wallZ2);
    
    const wallX1 = new THREE.Mesh(new THREE.BoxGeometry(thickness, this.BARRIER_HEIGHT, this.MAP_SIZE), barrierMaterial);
    wallX1.position.set(halfMapSize, barrierY, 0);
    walls.push(wallX1);
    
    const wallX2 = new THREE.Mesh(new THREE.BoxGeometry(thickness, this.BARRIER_HEIGHT, this.MAP_SIZE), barrierMaterial);
    wallX2.position.set(-halfMapSize, barrierY, 0);
    walls.push(wallX2);

    walls.forEach(w => {
        this.scene.add(w);
        this.collidableObjects.push(w);
        this.environmentObjects.push(w);
    });
  }

  getSafeY(targetX, targetZ) {
      const startY = 32; 
      const keyX = Math.floor(targetX);
      const keyZ = Math.floor(targetZ);

      for (let y = startY; y >= 0; y--) {
          const key = this.getMapKey(keyX, y, keyZ);
          if (this.collisionMap.has(key)) {
              return y + 1.5; 
          }
      }
      return 1.0; 
  }
}