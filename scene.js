import * as THREE from 'three';

export class SceneManager {
  // --- POPRAWKA: Konstruktor przyjmuje teraz poziom jakości ---
  constructor(scene, quality = 'high') {
    this.scene = scene;
    this.quality = quality; // 'high' lub 'low'
    this.collidableObjects = [];
    this.MAP_SIZE = 64;
    this.BLOCK_SIZE = 1;
    this.BARRIER_HEIGHT = 100; 
    this.BARRIER_THICKNESS = 1;
    this.FLOOR_TOP_Y = 0.1;
    this.isInitialized = false;
  }
  
  initialize() {
    if (this.isInitialized) {
      return;
    }

    this.setupLighting();
    this.createEnvironment();
    this.setupFog();

    this.isInitialized = true;
  }
  
  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0); 
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(this.MAP_SIZE / 4, 15, this.MAP_SIZE / 4); 
    
    // --- POPRAWKA: Cienie są konfigurowane w zależności od jakości ---
    if (this.quality === 'high') {
        directionalLight.castShadow = true;
        // Zmniejszamy trochę rozmiar mapy cieni dla lepszej wydajności nawet na PC
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = this.MAP_SIZE * 0.8;
        
        const shadowCameraSize = this.MAP_SIZE / 2 + this.BARRIER_THICKNESS + 5; 
        directionalLight.shadow.camera.left = -shadowCameraSize;
        directionalLight.shadow.camera.right = shadowCameraSize;
        directionalLight.shadow.camera.top = shadowCameraSize;
        directionalLight.shadow.camera.bottom = -shadowCameraSize;
    }
    
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

    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 2;
    const context = canvas.getContext('2d');
    context.fillStyle = 'white';
    context.fillRect(0, 0, 2, 2);
    context.fillStyle = 'black';
    context.fillRect(0, 0, 1, 1);
    context.fillRect(1, 1, 1, 1);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(floorSize / 2, floorSize / 2);

    const floorMaterial = new THREE.MeshLambertMaterial({ map: texture });
    const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
    
    // --- POPRAWKA: Podłoga przyjmuje cienie tylko na wysokiej jakości ---
    if (this.quality === 'high') {
        floorMesh.receiveShadow = true;
    }
    
    floorMesh.position.y = this.FLOOR_TOP_Y - 0.01;
    
    this.scene.add(floorMesh);

    const borderGeometry = new THREE.BoxGeometry(this.MAP_SIZE, 1, this.MAP_SIZE);
    const edges = new THREE.EdgesGeometry(borderGeometry);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x8A2BE2, linewidth: 2 });
    const line = new THREE.LineSegments(edges, lineMaterial);
    line.position.y = this.FLOOR_TOP_Y - 0.5;
    this.scene.add(line);
  }
  
  createBarrierBlocks() {
    // ... (bez zmian)
  }
  
  createDecorations() {
    // --- POPRAWKA: Mniejsza liczba dekoracji na niskiej jakości ---
    const decorationCount = this.quality === 'high' ? 25 : 5;
    const decorativeColors = [0xff4757, 0x3742fa, 0x2ed573, 0xffa502];
    
    // --- POPRAWKA: Optymalizacja przez ponowne użycie geometrii i materiałów ---
    const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
    const materials = decorativeColors.map(color => new THREE.MeshLambertMaterial({ color }));

    for (let i = 0; i < decorationCount; i++) {
      const material = materials[Math.floor(Math.random() * materials.length)];
      const block = new THREE.Mesh(boxGeometry, material);
      
      const scaleX = Math.random() * 2 + 0.5;
      const scaleY = Math.random() * 3 + 0.5;
      const scaleZ = Math.random() * 2 + 0.5;
      block.scale.set(scaleX, scaleY, scaleZ);

      block.position.set(
        (Math.random() - 0.5) * (this.MAP_SIZE - 5),
        scaleY / 2 + this.FLOOR_TOP_Y,
        (Math.random() - 0.5) * (this.MAP_SIZE - 5)
      );

      // --- POPRAWKA: Cienie tylko na wysokiej jakości ---
      if (this.quality === 'high') {
        block.castShadow = true;
        block.receiveShadow = true;
      }

      this.scene.add(block);
      this.collidableObjects.push(block);
    }
  }
      }
