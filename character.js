import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

export function createBaseCharacter() {
    const baseGroup = new THREE.Group();
    const legMaterial = new THREE.MeshLambertMaterial({ color: 0x2c3e50 });
    const bootMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });

    const leftLegGeo = new THREE.BoxGeometry(0.4, 0.8, 0.4);
    const leftLeg = new THREE.Mesh(leftLegGeo, legMaterial);
    leftLeg.position.set(-0.25, 0.4, 0);
    baseGroup.add(leftLeg);

    const leftBootGeo = new THREE.BoxGeometry(0.4, 0.2, 0.5);
    const leftBoot = new THREE.Mesh(leftBootGeo, bootMaterial);
    leftBoot.position.set(-0.25, -0.1, 0.05);
    baseGroup.add(leftBoot);

    const rightLegGeo = new THREE.BoxGeometry(0.4, 0.8, 0.4);
    const rightLeg = new THREE.Mesh(rightLegGeo, legMaterial);
    rightLeg.position.set(0.25, 0.4, 0);
    baseGroup.add(rightLeg);

    const rightBootGeo = new THREE.BoxGeometry(0.4, 0.2, 0.5);
    const rightBoot = new THREE.Mesh(rightBootGeo, bootMaterial);
    rightBoot.position.set(0.25, -0.1, 0.05);
    baseGroup.add(rightBoot);

    return baseGroup;
}

export class CharacterManager {
  constructor(scene) {
    this.scene = scene;
    this.character = null;
    this.shadow = null;
    this.skinContainer = new THREE.Group();
    this.textureLoader = new THREE.TextureLoader();
    this.materialsCache = {};
    this.currentGroundRestingY = 0.8;
  }
  
  loadCharacter() {
    if (this.character) {
        this.scene.remove(this.character);
    }
    this.character = new THREE.Group();
    const baseModel = createBaseCharacter();
    this.character.add(baseModel);

    // --- KLUCZOWA POPRAWKA ---
    // 1. Zmniejszamy cały kontener na skin, aby zbudowana postać była proporcjonalna.
    this.skinContainer.scale.setScalar(0.25);
    // 2. Ustawiamy pozycję, aby skin znajdował się na "biodrach" nóg.
    this.skinContainer.position.y = 0.8; 
    
    this.character.add(this.skinContainer);
    this.character.position.set(0, this.currentGroundRestingY, 0);
    this.scene.add(this.character);
    this.setupShadow();
    console.log("Base character loaded.");
  }
  
  applySkin(skinData) {
    while(this.skinContainer.children.length > 0){ 
        this.skinContainer.remove(this.skinContainer.children[0]); 
    }
    if (!skinData) {
        console.log("Applying default skin (empty).");
        return;
    }
    
    skinData.forEach(blockData => {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        let material;
        if (this.materialsCache[blockData.texturePath]) {
            material = this.materialsCache[blockData.texturePath];
        } else {
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
    console.log(`Applied skin with ${skinData.length} blocks.`);
  }

  setupShadow() {
      if (this.shadow) this.scene.remove(this.shadow);
      const shadowGeometry = new THREE.CircleGeometry(0.8, 32);
      const shadowMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.4 });
      this.shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
      this.shadow.rotation.x = -Math.PI / 2;
      this.shadow.position.y = 0.11;
      this.scene.add(this.shadow);
  }

  update(deltaTime) {
    if (this.character && this.shadow) {
      this.shadow.position.x = this.character.position.x;
      this.shadow.position.z = this.character.position.z;
    }
  }
  
  displayChatBubble(message) {
    if (!this.character) return;
    if (this.character.chatBubble) {
      this.character.remove(this.character.chatBubble);
      this.character.chatBubble = null;
    }
    const div = document.createElement('div');
    div.className = 'chat-bubble';
    div.textContent = message;
    div.style.cssText = `background-color: rgba(255, 255, 255, 0.8); color: #333; padding: 8px 12px; border-radius: 15px; font-size: 12px; max-width: 150px; text-align: center; pointer-events: none;`;
    const chatBubble = new CSS2DObject(div);
    
    // POPRAWKA: Obniżamy pozycję dymka, aby pasowała do mniejszej postaci
    chatBubble.position.set(0, 2.5, 0); 
    
    this.character.add(chatBubble);
    this.character.chatBubble = chatBubble;
    setTimeout(() => {
      if (this.character.chatBubble === chatBubble) {
        this.character.remove(chatBubble);
        this.character.chatBubble = null;
      }
    }, 5000);
  }
}
