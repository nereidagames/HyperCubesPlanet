import * as THREE from 'three';

const API_BASE_URL = 'https://hypercubes-nexus-server.onrender.com';

export class SceneManager {
  constructor(scene, loadingManager) {
    this.scene = scene;
    this.loadingManager = loadingManager;
    
    // Tablica dla obiektów "globalnych" (podłoga, bariery, ściany mapy)
    // Tych obiektów jest mało, więc trzymamy je w tablicy.
    this.collidableObjects = []; 
    
    // NOWOŚĆ: MAPA KOLIZJI DLA BLOKÓW (Grid Partitioning / Spatial Hashing)
    // Zamiast sprawdzać tysiące bloków w pętli, sprawdzamy konkretny klucz w mapie.
    // Klucz: "x,y,z" (np. "10,5,-3"), Wartość: Obiekt z danymi kolizji
    this.collisionMap = new Map();
    
    // Ustawienia mapy
    this.MAP_SIZE = 64;
    this.BLOCK_SIZE = 1;
    this.BARRIER_HEIGHT = 100; 
    this.BARRIER_THICKNESS = 1;
    this.FLOOR_TOP_Y = 0.1; // Poziom podłogi (ważne dla fizyki)
    
    this.isInitialized = false;
    
    this.textureLoader = new THREE.TextureLoader(this.loadingManager);
    this.materials = {};
    
    // Współdzielona geometria (Optymalizacja RAM - jedna geometria dla wszystkich bloków kolizji)
    this.sharedCollisionGeometry = new THREE.BoxGeometry(1, 1, 1);
    
    this.maxAnisotropy = 4; 
  }
  
  async initialize() {
    if (this.isInitialized) return;

    this.maxAnisotropy = 16; // Poprawa jakości tekstur pod kątem

    this.setupLighting();
    this.setupFog();

    // Próba załadowania Nexusa z bazy danych
    const nexusLoaded = await this.loadNexusFromDB();

    // Jeśli baza jest pusta lub błąd, generuj domyślną szachownicę
    if (!nexusLoaded) {
        console.log("Brak mapy Nexusa w bazie, generowanie domyślnej...");
        this.createCheckerboardFloor();
    }

    // Zawsze dodajemy niewidzialne ściany dookoła mapy
    this.createBarrierBlocks();

    this.isInitialized = true;
    console.log("SceneManager zainicjalizowany (Tryb: Instanced Rendering + Spatial Hashing).");
  }
  
  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7); 
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(30, 60, 40); 
    directionalLight.castShadow = true;
    
    // Konfiguracja cieni dla dużej mapy
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 100;
    
    const shadowSize = 40;
    directionalLight.shadow.camera.left = -shadowSize;
    directionalLight.shadow.camera.right = shadowSize;
    directionalLight.shadow.camera.top = shadowSize;
    directionalLight.shadow.camera.bottom = -shadowSize;
    directionalLight.shadow.bias = -0.0005;
    
    this.scene.add(directionalLight);
  }
  
  setupFog() {
    // Mgła ukrywająca koniec świata
    this.scene.fog = new THREE.Fog(0x87CEEB, 15, 90);
  }

  // --- KLUCZOWA FUNKCJA DLA GRID PARTITIONING ---
  // Zamienia koordynaty świata na unikalny klucz stringowy
  getMapKey(x, y, z) {
      // Math.floor jest ważny, bo bloki mogą być na pozycjach np. 10.5, 5.5
      // Chcemy jednoznaczny identyfikator kratki gridu
      return `${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`;
  }

  async loadNexusFromDB() {
      try {
          const response = await fetch(`${API_BASE_URL}/api/nexus`);
          if (!response.ok) return false; 

          const blocksData = await response.json();
          if (!Array.isArray(blocksData) || blocksData.length === 0) return false;

          console.log(`Wczytywanie Nexusa: ${blocksData.length} bloków.`);

          // Grupowanie bloków po teksturze (dla InstancedMesh)
          const blocksByTexture = {};
          
          // Czyścimy mapę kolizji przed załadowaniem nowej
          this.collisionMap.clear(); 

          blocksData.forEach(block => {
              if (!blocksByTexture[block.texturePath]) {
                  blocksByTexture[block.texturePath] = [];
              }
              blocksByTexture[block.texturePath].push(block);
          });

          const dummy = new THREE.Object3D();

          // Iterujemy po grupach tekstur
          for (const [texturePath, blocks] of Object.entries(blocksByTexture)) {
              
              // Tworzenie lub pobranie materiału
              let material = this.materials[texturePath];
              if (!material) {
                  const texture = this.textureLoader.load(texturePath);
                  texture.magFilter = THREE.NearestFilter;
                  texture.minFilter = THREE.NearestMipmapLinearFilter;
                  texture.anisotropy = this.maxAnisotropy;
                  texture.wrapS = THREE.RepeatWrapping;
                  texture.wrapT = THREE.RepeatWrapping;

                  material = new THREE.MeshLambertMaterial({ map: texture });
                  this.materials[texturePath] = material;
              }

              // Tworzenie InstancedMesh (Wydajne renderowanie GPU)
              const instancedMesh = new THREE.InstancedMesh(this.sharedCollisionGeometry, material, blocks.length);
              instancedMesh.castShadow = true;
              instancedMesh.receiveShadow = true;

              blocks.forEach((block, index) => {
                  // 1. Ustawienie macierzy dla renderowania
                  dummy.position.set(block.x, block.y, block.z);
                  dummy.updateMatrix();
                  instancedMesh.setMatrixAt(index, dummy.matrix);

                  // 2. WYPEŁNIANIE MAPY KOLIZJI (Grid Partitioning)
                  // Zamiast tworzyć fizyczny Mesh dla każdego bloku, tworzymy lekki obiekt danych.
                  // PlayerController pobierze go błyskawicznie używając klucza.
                  const key = this.getMapKey(block.x, block.y, block.z);
                  
                  const collisionData = {
                      isBlock: true, // Flaga dla kontrolera
                      position: new THREE.Vector3(block.x, block.y, block.z),
                      // Cache'ujemy BoundingBox, żeby nie liczyć go w kółko w update()
                      boundingBox: new THREE.Box3().setFromCenterAndSize(
                          new THREE.Vector3(block.x, block.y, block.z), 
                          new THREE.Vector3(1, 1, 1)
                      )
                  };
                  
                  this.collisionMap.set(key, collisionData);
              });

              instancedMesh.instanceMatrix.needsUpdate = true;
              this.scene.add(instancedMesh);
          }

          // Dodanie niewidzialnej podłogi (zabezpieczenie przed spadnięciem)
          const floorGeo = new THREE.PlaneGeometry(300, 300);
          floorGeo.rotateX(-Math.PI / 2);
          const floorMat = new THREE.MeshBasicMaterial({ visible: false });
          const invisibleFloor = new THREE.Mesh(floorGeo, floorMat);
          invisibleFloor.position.y = -0.5;
          this.scene.add(invisibleFloor);
          this.collidableObjects.push(invisibleFloor);

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
    texture.minFilter = THREE.NearestMipmapLinearFilter;
    texture.anisotropy = this.maxAnisotropy;
    texture.repeat.set(floorSize / 2, floorSize / 2);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    const floorMaterial = new THREE.MeshLambertMaterial({ map: texture });
    const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
    floorMesh.receiveShadow = true;
    floorMesh.position.y = -0.5;
    
    this.scene.add(floorMesh);
    this.collidableObjects.push(floorMesh);

    // Krawędzie mapy (fioletowe linie)
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
    const thickness = this.BARRIER_THICKNESS;

    // Tworzenie 4 ścian niewidzialnych barier
    const wallZ1 = new THREE.Mesh(new THREE.BoxGeometry(this.MAP_SIZE, this.BARRIER_HEIGHT, thickness), barrierMaterial);
    wallZ1.position.set(0, barrierY, halfMapSize);
    this.scene.add(wallZ1);
    this.collidableObjects.push(wallZ1);

    const wallZ2 = new THREE.Mesh(new THREE.BoxGeometry(this.MAP_SIZE, this.BARRIER_HEIGHT, thickness), barrierMaterial);
    wallZ2.position.set(0, barrierY, -halfMapSize);
    this.scene.add(wallZ2);
    this.collidableObjects.push(wallZ2);
    
    const wallX1 = new THREE.Mesh(new THREE.BoxGeometry(thickness, this.BARRIER_HEIGHT, this.MAP_SIZE), barrierMaterial);
    wallX1.position.set(halfMapSize, barrierY, 0);
    this.scene.add(wallX1);
    this.collidableObjects.push(wallX1);
    
    const wallX2 = new THREE.Mesh(new THREE.BoxGeometry(thickness, this.BARRIER_HEIGHT, this.MAP_SIZE), barrierMaterial);
    wallX2.position.set(-halfMapSize, barrierY, 0);
    this.scene.add(wallX2);
    this.collidableObjects.push(wallX2);
  }

  // Funkcja obliczająca bezpieczną wysokość dla spawnu (używana przy teleportacji)
  // Zaktualizowana o użycie collisionMap dla wydajności
  getSafeY(targetX, targetZ) {
      const startY = 32; // Maksymalna wysokość budowania w Nexusie
      const keyX = Math.floor(targetX);
      const keyZ = Math.floor(targetZ);

      // Sprawdzamy w dół, czy jest jakiś blok w tym miejscu gridu
      for (let y = startY; y >= 0; y--) {
          const key = this.getMapKey(keyX, y, keyZ);
          if (this.collisionMap.has(key)) {
              return y + 1.5; // Blok znaleziony, zwróć pozycję bezpiecznie nad nim
          }
      }

      return 1.0; // Domyślnie poziom podłogi, jeśli brak bloków
  }
}