import * as THREE from 'three';

export class SceneManager {
  constructor(scene) {
    this.scene = scene;
    this.collidableObjects = [];
    this.MAP_SIZE = 64;
    this.BLOCK_SIZE = 1;
    this.BARRIER_HEIGHT = 100; 
    this.BARRIER_THICKNESS = 1;
    this.FLOOR_TOP_Y = 0.1;
    this.isInitialized = false;
  }
  
  // POPRAWKA KRYTYCZNA: Przywrócenie słowa kluczowego 'async'.
  // To zapewnia, że w main.js 'await this.sceneManager.initialize()'
  // faktycznie poczeka na wykonanie tej funkcji, zanim przejdzie dalej.
  // Bez tego, multiplayer i postacie były tworzone w pustej scenie,
  // co powodowało niebieski/czarny ekran.
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    this.setupLighting();
    this.createEnvironment();
    this.setupFog();

    this.isInitialized = true;
    console.log("SceneManager zainicjalizowany pomyślnie.");
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
    directionalLight.shadow.camera.far = this.MAP_SIZE * 0.8;
    
    const shadowCameraSize = this.MAP_SIZE / 2 + this.BARRIER_THICKNESS + 5; 
    directionalLight.shadow.camera.left = -shadowCameraSize;
    directionalLight.shadow.camera.right = shadowCameraSize;
    directionalLight.shadow.camera.top = shadowCameraSize;
    directionalLight.shadow.camera.bottom = -shadowCameraSize;
    
    this.scene.add(directionalLight);
  }
  
  setupFog() {
    this.scene.fog = new THREE.Fog(0x87CEEB, this.MAP_SIZE * 0.5, this.MAP_SIZE * 1.5);
  }
  
  createEnvironment() {
    this.createCheckerboardFloor();
    this.createBarrierBlocks();
    this.createDecorations();
  }
  
  createCheckerboardFloor() {
    const floorSize = this.MAP_SIZE;
    const floorGeometry = new THREE.PlaneGeometry(floorSize, floorSize);
    floorGeometry.rotateX(-Math.PI / 2);

    // Tekstura szachownicy jest generowana programistycznie dla wydajności
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 2;
    const context = canvas.getContext('2d');
    context.fillStyle = '#c0c0c0'; // Jaśniejszy kolor dla lepszego wyglądu
    context.fillRect(0, 0, 2, 2);
    context.fillStyle = '#a0a0a0'; // Ciemniejszy, ale nie czarny
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
    floorMesh.position.y = this.FLOOR_TOP_Y - 0.01;
    
    this.scene.add(floorMesh);

    // Krawędzie dookoła mapy dla lepszej widoczności granic
    const borderGeometry = new THREE.BoxGeometry(this.MAP_SIZE, 1, this.MAP_SIZE);
    const edges = new THREE.EdgesGeometry(borderGeometry);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x8A2BE2, linewidth: 2 });
    const line = new THREE.LineSegments(edges, lineMaterial);
    line.position.y = this.FLOOR_TOP_Y - 0.5;
    this.scene.add(line);
  }
  
  createBarrierBlocks() {
    const halfMapSize = this.MAP_SIZE / 2;
    const barrierY = this.BARRIER_HEIGHT / 2 + this.FLOOR_TOP_Y; 
    // Niewidzialny materiał dla barier
    const barrierMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
    
    // Bariery wzdłuż osi Z
    for (let i = 0; i < 2; i++) {
      const zPos = (i === 0 ? halfMapSize : -halfMapSize);
      const adjustedZPos = zPos + (i === 0 ? this.BARRIER_THICKNESS / 2 : -this.BARRIER_THICKNESS / 2);
      const geometry = new THREE.BoxGeometry(this.MAP_SIZE + 2 * this.BARRIER_THICKNESS, this.BARRIER_HEIGHT, this.BARRIER_THICKNESS);
      const barrierMesh = new THREE.Mesh(geometry, barrierMaterial);
      
      barrierMesh.castShadow = false;
      barrierMesh.position.set(0, barrierY, adjustedZPos);
      this.scene.add(barrierMesh);
      this.collidableObjects.push(barrierMesh);
    }
    
    // Bariery wzdłuż osi X
    for (let i = 0; i < 2; i++) {
      const xPos = (i === 0 ? halfMapSize : -halfMapSize);
      const adjustedXPos = xPos + (i === 0 ? this.BARRIER_THICKNESS / 2 : -this.BARRIER_THICKNESS / 2);
      const geometry = new THREE.BoxGeometry(this.BARRIER_THICKNESS, this.BARRIER_HEIGHT, this.MAP_SIZE); // Poprawiono rozmiar
      const barrierMesh = new THREE.Mesh(geometry, barrierMaterial);
      
      barrierMesh.castShadow = false;
      barrierMesh.position.set(adjustedXPos, barrierY, 0);
      this.scene.add(barrierMesh);
      this.collidableObjects.push(barrierMesh);
    }
  }
  
  createDecorations() {
    const decorativeColors = [0xff4757, 0x3742fa, 0x2ed573, 0xffa502];
    for (let i = 0; i < 25; i++) {
      const size = Math.random() * 2 + 0.5;
      const geometry = new THREE.BoxGeometry(size, size, size); // Równe boki dla estetyki
      const color = decorativeColors[Math.floor(Math.random() * decorativeColors.length)];
      const material = new THREE.MeshLambertMaterial({ color });
      const block = new THREE.Mesh(geometry, material);
      block.position.set(
        (Math.random() - 0.5) * (this.MAP_SIZE - 5),
        geometry.parameters.height / 2 + this.FLOOR_TOP_Y,
        (Math.random() - 0.5) * (this.MAP_SIZE - 5)
      );
      block.rotation.y = Math.random() * Math.PI; // Losowa rotacja
      block.castShadow = true;
      block.receiveShadow = true;
      this.scene.add(block);
      this.collidableObjects.push(block);
    }
  }
}
