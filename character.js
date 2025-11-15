import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

// Uproszczona funkcja tworząca bazowy model postaci
export function createBaseCharacter(parentContainer) {
    const legMaterial = new THREE.MeshLambertMaterial({ color: 0x2c3e50 });
    const bootMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });

    const legWidth = 0.25;
    const legHeight = 0.8;
    const legDepth = 0.25;
    const bootHeight = 0.2;
    const bootDepth = 0.3;
    const legSeparation = 0.15;
    
    // Pozycja Y jest liczona względem środka kontenera (y=0),
    // aby stopy znalazły się poniżej tego punktu.
    const legBaseY = -0.5;

    // Lewa noga i but
    const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(legWidth, legHeight, legDepth), legMaterial);
    leftLeg.position.set(-legSeparation, legBaseY, 0);
    parentContainer.add(leftLeg);

    const leftBoot = new THREE.Mesh(new THREE.BoxGeometry(legWidth, bootHeight, bootDepth), bootMaterial);
    leftBoot.position.set(-legSeparation, legBaseY - (legHeight/2) - (bootHeight/2), 0.025);
    parentContainer.add(leftBoot);

    // Prawa noga i but
    const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(legWidth, legHeight, legDepth), legMaterial);
    rightLeg.position.set(legSeparation, legBaseY, 0);
    parentContainer.add(rightLeg);

    const rightBoot = new THREE.Mesh(new THREE.BoxGeometry(legWidth, bootHeight, bootDepth), bootMaterial);
    rightBoot.position.set(legSeparation, legBaseY - (legHeight/2) - (bootHeight/2), 0.025);
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
    this.skinContainer.position.y = 0.6; 
    
    this.character.add(this.skinContainer);
    
    this.character.position.set(0, 5, 0); 
    this.scene.add(this.character);
    this.setupShadow();
    console.log("Bazowa postać gracza załadowana z uproszczoną strukturą.");
  }
  
  applySkin(skinData) {
    while(this.skinContainer.children.length > 0){ 
        this.skinContainer.remove(this.skinContainer.children[0]); 
    }
    if (!skinData || !Array.isArray(skinData) || skinData.length === 0) {
        // Gdy nie ma skina, bazowy model nóg będzie widoczny
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
    console.log(`Nałożono skin składający się z ${skinData.length} bloków.`);
  }

  setupShadow() {
      if (this.shadow) this.scene.remove(this.shadow);
      const shadowGeometry = new THREE.CircleGeometry(0.5, 32);
      const shadowMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3 });
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
    div.style.cssText = `background-color: rgba(255, 255, 255, 0.9); color: black; padding: 8px 12px; border-radius: 15px; font-size: 13px; max-width: 150px; text-align: center; pointer-events: none;`;
    const chatBubble = new CSS2DObject(div);
    chatBubble.position.set(0, 1.8, 0); 
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
