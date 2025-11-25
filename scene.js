import * as THREE from 'three';

const API_BASE_URL = 'https://hypercubes-nexus-server.onrender.com';

export class SceneManager {
  constructor(scene, loadingManager) {
    this.scene = scene;
    this.loadingManager = loadingManager; // Potrzebny do ładowania tekstur
    this.collidableObjects = [];
    this.MAP_SIZE = 64;
    this.BLOCK_SIZE = 1;
    this.BARRIER_HEIGHT = 100; 
    this.BARRIER_THICKNESS = 1;
    this.FLOOR_TOP_Y = 0.1; // Ważne dla fizyki
    this.isInitialized = false;
    
    this.textureLoader = new THREE.TextureLoader(this.loadingManager);
    this.materials = {};
  }
  
  async initialize() {
    if (this.isInitialized) return;

    this.setupLighting();
    this.setupFog();

    // Próba załadowania Nexusa z bazy danych
    const nexusLoaded = await this.loadNexusFromDB();

    // Jeśli nie ma Nexusa w bazie (np. pierwszy start), stwórz domyślną szachownicę
    if (!nexusLoaded) {
        console.log("Brak mapy Nexusa w bazie, generowanie domyślnej...");
        this.createCheckerboardFloor();
    }

    this.createBarrierBlocks();

    this.isInitialized = true;
    console.log("SceneManager zainicjalizowany.");
  }
  
  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0); 
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(this.MAP_SIZE / 4, 15, this.MAP_SIZE / 4); 
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = this.MAP_SIZE * 2;
    
    const shadowCameraSize = this.MAP_SIZE; 
    directionalLight.shadow.camera.left = -shadowCameraSize;
    directionalLight.shadow.camera.right = shadowCameraSize;
    directionalLight.shadow.camera.top = shadowCameraSize;
    directionalLight.shadow.camera.bottom = -shadowCameraSize;
    
    this.scene.add(directionalLight);
  }
  
  setupFog() {
    this.scene.fog = new THREE.Fog(0x87CEEB, 20, 150);
  }

  // --- NOWA FUNKCJA: ŁADOWANIE NEXUSA Z SERWERA ---
  async loadNexusFromDB() {
      try {
          const response = await fetch(`${API_BASE_URL}/api/nexus`);
          if (!response.ok) return false; // 404 lub błąd

          const blocksData = await response.json();
          if (!Array.isArray(blocksData) || blocksData.length === 0) return false;

          console.log(`Wczytywanie Nexusa: ${blocksData.length} bloków.`);

          const geometry = new THREE.BoxGeometry(1, 1, 1);

          blocksData.forEach(blockData => {
              let material = this.materials[blockData.texturePath];
              if (!material) {
                  const texture = this.textureLoader.load(blockData.texturePath);
                  texture.magFilter = THREE.NearestFilter;
                  texture.minFilter = THREE.NearestFilter;
                  material = new THREE.MeshLambertMaterial({ map: texture });
                  this.materials[blockData.texturePath] = material;
              }

              const mesh = new THREE.Mesh(geometry, material);
              mesh.position.set(blockData.x, blockData.y, blockData.z);
              mesh.castShadow = true;
              mesh.receiveShadow = true;
              
              this.scene.add(mesh);
              this.collidableObjects.push(mesh);
          });

          // Dodajemy niewidzialną podłogę na poziomie 0, żeby postać nie spadała
          // jeśli mapa ma dziury, albo żeby resetowała skok
          const floorGeo = new THREE.PlaneGeometry(200, 200);
          floorGeo.rotateX(-Math.PI / 2);
          const floorMat = new THREE.MeshBasicMaterial({ visible: false });
          const invisibleFloor = new THREE.Mesh(floorGeo, floorMat);
          invisibleFloor.position.y = -0.5; // Tuż pod klockami
          this.scene.add(invisibleFloor);
          this.collidableObjects.push(invisibleFloor);

          return true;
      } catch (error) {
          console.error("Błąd ładowania Nexusa:", error);
          return false;
      }
  }
  
  // --- STARA FUNKCJA (FALLBACK) ---
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
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(floorSize / 2, floorSize / 2);

    const floorMaterial = new THREE.MeshLambertMaterial({ map: texture });
    const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
    floorMesh.receiveShadow = true;
    floorMesh.position.y = -0.5; // Ustawiamy na -0.5 żeby wierzch był na 0
    
    this.scene.add(floorMesh);
    this.collidableObjects.push(floorMesh); // Dodajemy do kolizji

    const borderGeometry = new THREE.BoxGeometry(this.MAP_SIZE, 1, this.MAP_SIZE);
    const edges = new THREE.EdgesGeometry(borderGeometry);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x8A2BE2, linewidth: 2 });
    const line = new THREE.LineSegments(edges, lineMaterial);
    line.position.y = -0.5;
    this.scene.add(line);
  }
  
  createBarrierBlocks() {
    const halfMapSize = this.MAP_SIZE / 2;
    const barrierY = this.BARRIER_HEIGHT / 2; 
    const barrierMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
    
    // Poprawione pozycjonowanie barier względem środka 0,0
    const thickness = this.BARRIER_THICKNESS;

    // Ściany Z
    const wallZ1 = new THREE.Mesh(new THREE.BoxGeometry(this.MAP_SIZE, this.BARRIER_HEIGHT, thickness), barrierMaterial);
    wallZ1.position.set(0, barrierY, halfMapSize);
    this.scene.add(wallZ1);
    this.collidableObjects.push(wallZ1);

    const wallZ2 = new THREE.Mesh(new THREE.BoxGeometry(this.MAP_SIZE, this.BARRIER_HEIGHT, thickness), barrierMaterial);
    wallZ2.position.set(0, barrierY, -halfMapSize);
    this.scene.add(wallZ2);
    this.collidableObjects.push(wallZ2);
    
    // Ściany X
    const wallX1 = new THREE.Mesh(new THREE.BoxGeometry(thickness, this.BARRIER_HEIGHT, this.MAP_SIZE), barrierMaterial);
    wallX1.position.set(halfMapSize, barrierY, 0);
    this.scene.add(wallX1);
    this.collidableObjects.push(wallX1);
    
    const wallX2 = new THREE.Mesh(new THREE.BoxGeometry(thickness, this.BARRIER_HEIGHT, this.MAP_SIZE), barrierMaterial);
    wallX2.position.set(-halfMapSize, barrierY, 0);
    this.scene.add(wallX2);
    this.collidableObjects.push(wallX2);
  }
}