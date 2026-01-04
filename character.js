/* PLIK: character.js */
import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

// Funkcja tworzy model nóg.
export function createBaseCharacter(parentContainer) {
    const legMaterial = new THREE.MeshLambertMaterial({ color: 0x2c3e50 });
    const bootMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });

    const legWidth = 0.25;
    const legHeight = 0.8;
    const legDepth = 0.25;
    const bootHeight = 0.2;
    const bootDepth = 0.3;
    const legSeparation = 0.15;
    
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

        // Klonujemy materiał dla lokalnego zanikania
        const localMaterial = material.clone();

        const block = new THREE.Mesh(geometry, localMaterial);
        block.position.set(blockData.x, blockData.y, blockData.z);
        block.castShadow = true;
        block.receiveShadow = true;
        this.skinContainer.add(block);
    });
  }

  // --- POPRAWIONA LOGIKA ZANIKANIA ---
  updateTransparency(camera) {
      if (!this.character) return;

      const charCenter = this.character.position.clone().add(new THREE.Vector3(0, 1.0, 0));
      const dist = camera.position.distanceTo(charCenter);

      // --- NOWE WARTOŚCI ---
      // Startuje dopiero gdy kamera jest bardzo blisko (1.3m)
      // Całkowicie znika przy 0.6m (tuż przed "wejściem" w model)
      const fadeStartDist = 1.3; 
      const fadeEndDist = 0.6;   

      let opacity = 1;
      let shouldBeVisible = true;

      if (dist < fadeEndDist) {
          opacity = 0;
          shouldBeVisible = false; // Wyłączamy renderowanie
      } else if (dist < fadeStartDist) {
          // Płynne przejście 0 -> 1
          opacity = (dist - fadeEndDist) / (fadeStartDist - fadeEndDist);
      }

      this.character.traverse((child) => {
          if (child.isMesh && child.material) {
              
              child.visible = shouldBeVisible;

              if (shouldBeVisible) {
                  // Jeśli opacity jest prawie 1, wyłączamy transparentność całkowicie
                  // To naprawia problem "półprzezroczystej" postaci w normalnym widoku
                  if (opacity >= 0.99) {
                      child.material.transparent = false;
                      child.material.opacity = 1.0;
                      child.material.depthWrite = true;
                  } else {
                      child.material.transparent = true;
                      child.material.opacity = opacity;
                      child.material.depthWrite = false;
                  }
              }
          }
      });
      
      if (this.shadow) {
          this.shadow.visible = opacity > 0.2;
      }
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
      this.shadow.position.y = 0.11;
    }
  }
  
  displayChatBubble(message) {
    if (!this.character) return;
    
    if (this.character.chatBubble) {
        this.character.remove(this.character.chatBubble);
        if (this.character.chatBubble.element && this.character.chatBubble.element.parentNode) {
            this.character.chatBubble.element.parentNode.removeChild(this.character.chatBubble.element);
        }
        this.character.chatBubble = null;
    }
    
    const div = document.createElement('div');
    div.className = 'chat-bubble-styled'; 
    div.textContent = message;
    
    const chatBubble = new CSS2DObject(div);
    chatBubble.position.set(0, 1.9, 0); 
    
    this.character.add(chatBubble);
    this.character.chatBubble = chatBubble;

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
