import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

// POPRAWKA: Wspólna, eksportowana funkcja do tworzenia modeli, aby uniknąć duplikacji kodu.
export function createPlayerModel(type) {
    const group = new THREE.Group();

    switch (type) {
        case 'cube':
            const bodyGeometry = new THREE.BoxGeometry(1, 1.5, 0.5);
            const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x4a90e2 });
            const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
            body.position.set(0, 0.75, 0);
            group.add(body);
            const headGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
            const headMaterial = new THREE.MeshLambertMaterial({ color: 0xffdbac });
            const head = new THREE.Mesh(headGeometry, headMaterial);
            head.position.set(0, 1.9, 0);
            group.add(head);
            const faceGeometry = new THREE.PlaneGeometry(0.6, 0.6);
            const faceTexture = createFaceTexture();
            const faceMaterial = new THREE.MeshBasicMaterial({ map: faceTexture, transparent: true });
            const face = new THREE.Mesh(faceGeometry, faceMaterial);
            face.position.set(0, 1.9, 0.41);
            group.add(face);
            const armGeometry = new THREE.BoxGeometry(0.3, 1, 0.3);
            const armMaterial = new THREE.MeshLambertMaterial({ color: 0xffdbac });
            const leftArm = new THREE.Mesh(armGeometry, armMaterial);
            leftArm.position.set(-0.65, 1, 0);
            group.add(leftArm);
            const rightArm = new THREE.Mesh(armGeometry, armMaterial);
            rightArm.position.set(0.65, 1, 0);
            group.add(rightArm);
            const legGeometry = new THREE.BoxGeometry(0.3, 1, 0.3);
            const legMaterial = new THREE.MeshLambertMaterial({ color: 0x2c3e50 });
            const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
            leftLeg.position.set(-0.3, -0.5, 0);
            group.add(leftLeg);
            const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
            rightLeg.position.set(0.3, -0.5, 0);
            group.add(rightLeg);
            return group;
        case 'astronaut':
            const astroGroup = new THREE.Group();
            const astroBodyGeometry = new THREE.CylinderGeometry(0.4, 0.6, 1.5, 8);
            const astroBodyMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
            const astroBody = new THREE.Mesh(astroBodyGeometry, astroBodyMaterial);
            astroBody.position.set(0, 0.75, 0);
            astroGroup.add(astroBody);
            const astroHelmetGeometry = new THREE.SphereGeometry(0.5, 16, 16);
            const astroHelmetMaterial = new THREE.MeshLambertMaterial({ color: 0x87ceeb, transparent: true, opacity: 0.8 });
            const astroHelmet = new THREE.Mesh(astroHelmetGeometry, astroHelmetMaterial);
            astroHelmet.position.set(0, 2, 0);
            astroGroup.add(astroHelmet);
            const astroFaceGeometry = new THREE.SphereGeometry(0.35, 16, 16);
            const astroFaceMaterial = new THREE.MeshLambertMaterial({ color: 0xffdbac });
            const astroFace = new THREE.Mesh(astroFaceGeometry, astroFaceMaterial);
            astroFace.position.set(0, 2, 0);
            astroGroup.add(astroFace);
            const astroPanelGeometry = new THREE.BoxGeometry(0.3, 0.4, 0.1);
            const astroPanelMaterial = new THREE.MeshLambertMaterial({ color: 0x34495e });
            const astroPanel = new THREE.Mesh(astroPanelGeometry, astroPanelMaterial);
            astroPanel.position.set(0, 1, 0.35);
            astroGroup.add(astroPanel);
            const astroArmGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1, 8);
            const astroArmMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
            const astroLeftArm = new THREE.Mesh(astroArmGeometry, astroArmMaterial);
            astroLeftArm.position.set(-0.6, 1, 0);
            astroLeftArm.rotation.z = Math.PI / 6;
            astroGroup.add(astroLeftArm);
            const astroRightArm = new THREE.Mesh(astroArmGeometry, astroArmMaterial);
            astroRightArm.position.set(0.6, 1, 0);
            astroRightArm.rotation.z = -Math.PI / 6;
            astroGroup.add(astroRightArm);
            const astroLegGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1, 8);
            const astroLegMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
            const astroLeftLeg = new THREE.Mesh(astroLegGeometry, astroLegMaterial);
            astroLeftLeg.position.set(-0.25, -0.5, 0);
            astroGroup.add(astroLeftLeg);
            const astroRightLeg = new THREE.Mesh(astroLegGeometry, astroLegMaterial);
            astroRightLeg.position.set(0.25, -0.5, 0);
            astroGroup.add(astroRightLeg);
            const astroBootGeometry = new THREE.BoxGeometry(0.3, 0.2, 0.4);
            const astroBootMaterial = new THREE.MeshLambertMaterial({ color: 0x2c3e50 });
            const astroLeftBoot = new THREE.Mesh(astroBootGeometry, astroBootMaterial);
            astroLeftBoot.position.set(-0.25, -1, 0);
            astroGroup.add(astroLeftBoot);
            const astroRightBoot = new THREE.Mesh(astroBootGeometry, astroBootMaterial);
            astroRightBoot.position.set(0.25, -1, 0);
            astroGroup.add(astroRightBoot);
            return astroGroup;
        case 'swat':
            const swatGroup = new THREE.Group();
            const swatBodyGeometry = new THREE.BoxGeometry(1, 1.5, 0.6);
            const swatBodyMaterial = new THREE.MeshLambertMaterial({ color: 0x2c3e50 });
            const swatBody = new THREE.Mesh(swatBodyGeometry, swatBodyMaterial);
            swatBody.position.set(0, 0.75, 0);
            swatGroup.add(swatBody);
            const swatHeadGeometry = new THREE.BoxGeometry(0.7, 0.7, 0.7);
            const swatHeadMaterial = new THREE.MeshLambertMaterial({ color: 0xffdbac });
            const swatHead = new THREE.Mesh(swatHeadGeometry, swatHeadMaterial);
            swatHead.position.set(0, 1.85, 0);
            swatGroup.add(swatHead);
            const swatHelmetGeometry = new THREE.BoxGeometry(0.8, 0.4, 0.8);
            const swatHelmetMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
            const swatHelmet = new THREE.Mesh(swatHelmetGeometry, swatHelmetMaterial);
            swatHelmet.position.set(0, 2.1, 0);
            swatGroup.add(swatHelmet);
            const swatVestGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.1);
            const swatVestMaterial = new THREE.MeshLambertMaterial({ color: 0x34495e });
            const swatVest = new THREE.Mesh(swatVestGeometry, swatVestMaterial);
            swatVest.position.set(0, 1, 0.35);
            swatGroup.add(swatVest);
            const swatArmGeometry = new THREE.BoxGeometry(0.3, 1.2, 0.3);
            const swatArmMaterial = new THREE.MeshLambertMaterial({ color: 0x2c3e50 });
            const swatLeftArm = new THREE.Mesh(swatArmGeometry, swatArmMaterial);
            swatLeftArm.position.set(-0.65, 1, 0);
            swatGroup.add(swatLeftArm);
            const swatRightArm = new THREE.Mesh(swatArmGeometry, swatArmMaterial);
            swatRightArm.position.set(0.65, 1, 0);
            swatGroup.add(swatRightArm);
            const swatLegGeometry = new THREE.BoxGeometry(0.35, 1.2, 0.35);
            const swatLegMaterial = new THREE.MeshLambertMaterial({ color: 0x2c3e50 });
            const swatLeftLeg = new THREE.Mesh(swatLegGeometry, swatLegMaterial);
            swatLeftLeg.position.set(-0.3, -0.6, 0);
            swatGroup.add(swatLeftLeg);
            const swatRightLeg = new THREE.Mesh(swatLegGeometry, swatLegMaterial);
            swatRightLeg.position.set(0.3, -0.6, 0);
            swatGroup.add(swatRightLeg);
            const swatBootGeometry = new THREE.BoxGeometry(0.4, 0.3, 0.5);
            const swatBootMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
            const swatLeftBoot = new THREE.Mesh(swatBootGeometry, swatBootMaterial);
            swatLeftBoot.position.set(-0.3, -1.2, 0);
            swatGroup.add(swatLeftBoot);
            const swatRightBoot = new THREE.Mesh(swatBootGeometry, swatBootMaterial);
            swatRightBoot.position.set(0.3, -1.2, 0);
            swatGroup.add(swatRightBoot);
            return swatGroup;
        default:
            return createPlayerModel('cube');
    }
}

function createFaceTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext('2d');
    context.fillStyle = '#ffdbac';
    context.fillRect(0, 0, 64, 64);
    context.fillStyle = '#000000';
    context.fillRect(16, 20, 8, 8);
    context.fillRect(40, 20, 8, 8);
    context.fillStyle = '#8B4513';
    context.fillRect(24, 40, 16, 4);
    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    return texture;
}

export class CharacterManager {
  constructor(scene) {
    this.scene = scene;
    this.character = null;
    this.mixer = null;
    this.animations = {};
    this.currentAnimation = null;
    this.loader = new GLTFLoader();
    this.shadow = null;
    this.currentModel = 'cube';
    this.modelFootOffsets = {
      cube: -0.5,
      astronaut: -1.0,
      swat: -1.2
    };
    this.currentGroundRestingY = 0; 
  }
  
  async loadCharacter(modelType = 'cube') {
    try {
      this.currentModel = modelType;
      console.log(`Loading character: ${modelType}`);
      
      if (this.character) {
        this.scene.remove(this.character);
        if (this.character.chatBubble) this.character.remove(this.character.chatBubble);
      }
      if (this.shadow) this.scene.remove(this.shadow);

      this.character = null;
      this.mixer = null;
      this.animations = {};
      this.currentAnimation = null;
      
      this.character = createPlayerModel(modelType); // POPRAWKA: Użycie wspólnej funkcji
      
      const floorTopY = 0.1;
      this.currentGroundRestingY = floorTopY - this.modelFootOffsets[modelType];
      this.character.position.set(0, this.currentGroundRestingY, 0);
      this.character.scale.setScalar(1);
      
      this.character.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          if (child.material) child.material.needsUpdate = true;
        }
      });
      
      this.scene.add(this.character);
      this.setupShadow();
      
      console.log(`Character ${modelType} loaded successfully at Y=${this.currentGroundRestingY.toFixed(2)}`);
      
    } catch (error) {
      console.error('Error loading character:', error);
      this.character = createPlayerModel('cube');
      const floorTopY = 0.1;
      this.currentGroundRestingY = floorTopY - this.modelFootOffsets['cube'];
      this.character.position.set(0, this.currentGroundRestingY, 0);
      this.character.scale.setScalar(1);
      this.scene.add(this.character);
    }
  }

  setupShadow() {
      const shadowGeometry = new THREE.CircleGeometry(0.5, 32);
      const shadowMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.4 });
      this.shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
      this.shadow.rotation.x = -Math.PI / 2;
      this.shadow.position.y = 0.11;
      this.scene.add(this.shadow);
  }
  
  async changeCharacter(modelType) {
    if (!modelType || modelType === this.currentModel) return;
    await this.loadCharacter(modelType);
  }
  
  setAnimation(animationName) {
    if (!this.character) return;
    this.character.scale.y = 1; 
    switch (animationName) {
      case 'walk': break;
      case 'run': break;
      case 'jump': break;
      case 'idle': break;
    }
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