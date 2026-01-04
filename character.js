/* PLIK: character.js */
import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

// Funkcja tworzy model nóg.
// Przesuwamy elementy w dół o 0.5 (połowa wysokości postaci), 
// aby środek modelu (pivot) pokrywał się ze środkiem fizycznego hitboxa.
export function createBaseCharacter(parentContainer) {
    const legMaterial = new THREE.MeshLambertMaterial({ color: 0x2c3e50 });
    const bootMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });

    const legWidth = 0.25;
    const legHeight = 0.8;
    const legDepth = 0.25;
    const bootHeight = 0.2;
    const bootDepth = 0.3;
    const legSeparation = 0.15;
    
    // Całkowita wysokość wizualna to ok 1.0. Przesuwamy wszystko w dół o 0.5.
    const verticalOffset = -0.5; 

    const bootCenterY = (bootHeight / 2) + verticalOffset;
    const legCenterY = (bootHeight + legHeight / 2) + verticalOffset;

    // Lewa noga i but
    const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(legWidth, legHeight, legDepth), legMaterial);
    leftLeg.position.set(-legSeparation, legCenterY, 0);
    parentContainer.add(leftLeg);

    const leftBoot = new THREE.Mesh(new THREE.BoxGeometry(legWidth, bootHeight, bootDepth), bootMaterial);
    leftBoot.position.set(-legSeparation, bootCenterY, 0.025);
    parentContainer.add(leftBoot);

    // Prawa noga i but
    const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(legWidth, legHeight, legDepth), legMaterial);
    rightLeg.position.set(legSeparation, legCenterY, 0);
    parentContainer.add(rightLeg);

    const rightBoot = new THREE.Mesh(new THREE.BoxGeometry(legWidth, bootHeight, bootDepth), bootMaterial);
    rightBoot.position.set(legSeparation, bootCenterY, 0.025);
    parentContainer.add(rightBoot);
}

export class CharacterManager {
  constructor(scene) {
    this.scene = scene;
    this.character = null;
    this.shadow = null;
    this.skinContainer = new THREE.Group();
    this.textureLoader = new THREE.TextureLoader();
    this.materialsCache = {};
  }
  
  loadCharacter() {
    if (this.character) {
        this.scene.remove(this.character);
    }
    this.character = new THREE.Group();
    
    createBaseCharacter(this.character);
    
    this.skinContainer.scale.setScalar(0.125);
    
    // Skin musi być niżej, bo cały model został obniżony.
    // Nogi kończą się na Y = 0.5 (względem środka), więc skin zaczyna się tam.
    this.skinContainer.position.y = 0.5; 
    
    this.character.add(this.skinContainer);
    
    this.character.position.set(0, 5, 0); 
    this.scene.add(this.character);
    this.setupShadow();
    console.log("Postać gracza załadowana.");
  }
  
  applySkin(skinData) {
    while(this.skinContainer.children.length > 0){ 
        this.skinContainer.remove(this.skinContainer.children[0]); 
    }
    if (!skinData || !Array.isArray(skinData) || skinData.length === 0) {
        return;
    }
    
    skinData.forEach(blockData => {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        let material = this.materialsCache[blockData.texturePath];
        if (!material) {
            const texture = this.textureLoader.load(blockData.texturePath);
            texture.magFilter = THREE.NearestFilter;
            texture.minFilter = THREE.NearestFilter;
            material = new THREE.MeshLambertMaterial({ map: texture });
            this.materialsCache[blockData.texturePath] = material;
        }
        const block = new THREE.Mesh(geometry, material);
        block.position.set(blockData.x, blockData.y, blockData.z);
        block.castShadow = true;
        block.receiveShadow = true;
        this.skinContainer.add(block);
    });
  }

  setupShadow() {
      if (this.shadow) this.scene.remove(this.shadow);
      const shadowGeometry = new THREE.CircleGeometry(0.4, 32);
      const shadowMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3 });
      this.shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
      this.shadow.rotation.x = -Math.PI / 2;
      this.shadow.position.y = 0.01; 
      this.scene.add(this.shadow);
  }

  update(deltaTime) {
    if (this.character && this.shadow) {
      this.shadow.position.x = this.character.position.x;
      this.shadow.position.z = this.character.position.z;
      // Cień zawsze na poziomie podłogi, niezależnie od skoku
      this.shadow.position.y = 0.11;
    }
  }
  
  displayChatBubble(message) {
    if (!this.character) return;
    
    // 1. Usuń stary dymek, jeśli istnieje
    if (this.character.chatBubble) {
        this.character.remove(this.character.chatBubble);
        if (this.character.chatBubble.element && this.character.chatBubble.element.parentNode) {
            this.character.chatBubble.element.parentNode.removeChild(this.character.chatBubble.element);
        }
        this.character.chatBubble = null;
    }
    
    // 2. Stwórz element HTML z nową klasą CSS
    const div = document.createElement('div');
    div.className = 'chat-bubble-styled'; // Styl zdefiniowany w style.css
    div.textContent = message;
    
    // 3. Stwórz obiekt 3D (CSS2D)
    const chatBubble = new CSS2DObject(div);
    // ZMIANA: Obniżono do 1.9 (tuż nad nickiem)
    chatBubble.position.set(0, 1.9, 0); 
    
    this.character.add(chatBubble);
    this.character.chatBubble = chatBubble;

    // 4. Usuń automatycznie po 6 sekundach
    setTimeout(() => {
      if (this.character && this.character.chatBubble === chatBubble) {
        this.character.remove(chatBubble);
        if (chatBubble.element.parentNode) {
            chatBubble.element.parentNode.removeChild(chatBubble.element);
        }
        this.character.chatBubble = null;
      }
    }, 6000);
  }
}