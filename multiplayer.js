import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { createBaseCharacter } from './character.js'; // POPRAWKA: Import nowej funkcji

export class MultiplayerManager {
  constructor(scene, uiManager) {
    this.scene = scene;
    this.uiManager = uiManager;
    this.otherPlayers = new Map();
    this.chatMessages = [
      'Co za wspaniały dzień!',
      'Ktoś chce pograć w minigry?',
      'Fajna miejscówka!',
      'Cześć wszystkim!',
      'Widzieliście nowy sklep?',
      'Zbieram na nowy strój.',
    ];
    // POPRAWKA: Używamy stałej wartości Y dla wszystkich botów, zgodnej z CharacterManager
    this.PLAYER_RESTING_Y = 0.8;
    this.MAP_SIZE = 64; 
  }

  async initialize() {
    console.log('Multiplayer Manager initialized');
    // POPRAWKA: Tworzymy boty z nową pozycją Y
    await this.addOtherPlayer('Player_One', { position: new THREE.Vector3(5, this.PLAYER_RESTING_Y, 5) });
    await this.addOtherPlayer('Player_Two', { position: new THREE.Vector3(-5, this.PLAYER_RESTING_Y, 5) });
    await this.addOtherPlayer('Player_Three', { position: new THREE.Vector3(5, this.PLAYER_RESTING_Y, -5) });
  }

  async addOtherPlayer(id, data) {
    if (this.otherPlayers.has(id)) return;

    try {
      // POPRAWKA: Używamy nowej funkcji do tworzenia bazy postaci
      const playerMesh = createBaseCharacter();
      
      playerMesh.userData.playerId = id;
      playerMesh.position.copy(data.position);
      playerMesh.scale.setScalar(1);
      
      playerMesh.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          child.userData.playerId = id;
        }
      });

      this.scene.add(playerMesh);

      const playerData = {
        id: id,
        mesh: playerMesh,
        targetPosition: new THREE.Vector3().copy(data.position),
        movementSpeed: 2 + Math.random() * 2,
        chatCooldown: 10 + Math.random() * 20,
        animationState: 'idle',
        originalY: data.position.y,
      };

      this.otherPlayers.set(id, playerData);
      console.log(`Added other player: ${id}`);
    } catch (error) {
      console.error(`Failed to create player ${id}:`, error);
    }
  }

  displayPlayerName(id) {
    const playerData = this.otherPlayers.get(id);
    if (!playerData || playerData.nameLabel) return;
    
    const div = document.createElement('div');
    div.className = 'player-nametag';
    div.textContent = id;
    div.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
    div.style.color = 'white';
    div.style.padding = '2px 8px';
    div.style.borderRadius = '4px';
    div.style.fontSize = '12px';
    div.style.pointerEvents = 'none';
    
    const nameLabel = new CSS2DObject(div);
    // POPRAWKA: Obniżamy etykietę, aby pasowała do niższej postaci
    nameLabel.position.set(0, 1.5, 0); 
    
    playerData.mesh.add(nameLabel);
    playerData.nameLabel = nameLabel;
    
    setTimeout(() => {
      if (playerData.nameLabel) {
        playerData.mesh.remove(playerData.nameLabel);
        playerData.nameLabel = null;
      }
    }, 3000);
  }

  displayChatBubble(id, message) {
    const playerData = this.otherPlayers.get(id);
    if (!playerData || !playerData.mesh) return;
    
    if (playerData.chatBubble) {
      playerData.mesh.remove(playerData.chatBubble);
      playerData.chatBubble = null;
    }
    
    const div = document.createElement('div');
    div.className = 'chat-bubble';
    div.textContent = message;
    div.style.cssText = `
      background-color: rgba(255, 255, 255, 0.8);
      color: #333;
      padding: 8px 12px;
      border-radius: 15px;
      font-size: 12px;
      max-width: 150px;
      text-align: center;
      pointer-events: none;
    `;
    
    const chatBubble = new CSS2DObject(div);
    // POPRAWKA: Obniżamy dymek czatu
    chatBubble.position.set(0, 1.8, 0);
    
    playerData.mesh.add(chatBubble);
    playerData.chatBubble = chatBubble;
    
    setTimeout(() => {
      if (playerData.chatBubble === chatBubble) {
        playerData.mesh.remove(chatBubble);
        playerData.chatBubble = null;
      }
    }, 5000);
  }

  removeOtherPlayer(id) {
    if (!this.otherPlayers.has(id)) return;
    
    const playerData = this.otherPlayers.get(id);
    this.scene.remove(playerData.mesh);
    this.otherPlayers.delete(id);
    console.log(`Removed other player: ${id}`);
  }

  update(deltaTime, localPlayer) {
    this.otherPlayers.forEach((playerData, id) => {
      const { mesh, targetPosition } = playerData;
      
      if (mesh.position.distanceTo(targetPosition) < 0.5) {
        targetPosition.set(
          (Math.random() - 0.5) * (this.MAP_SIZE - 5),
          this.PLAYER_RESTING_Y, // Utrzymuj na poziomie podłoża
          (Math.random() - 0.5) * (this.MAP_SIZE - 5)
        );
      }
      
      mesh.position.lerp(targetPosition, deltaTime * 0.5);
      
      const moveDistance = mesh.position.distanceTo(playerData.lastPosition || mesh.position);
      playerData.lastPosition = mesh.position.clone();
      
      if (moveDistance > 0.01) {
        const direction = new THREE.Vector3().subVectors(targetPosition, mesh.position).normalize();
        if (direction.lengthSq() > 0.001) {
          const targetRotation = Math.atan2(direction.x, direction.z);
          const qEnd = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, targetRotation, 0));
          mesh.quaternion.slerp(qEnd, 0.1);
        }
        playerData.animationState = 'walk';
      } else {
        playerData.animationState = 'idle';
      }
      
      this.animatePlayer(playerData, deltaTime);
      
      playerData.chatCooldown -= deltaTime;
      if (playerData.chatCooldown <= 0) {
        const message = this.chatMessages[Math.floor(Math.random() * this.chatMessages.length)];
        this.displayChatBubble(id, message);
        this.uiManager.addChatMessage(`${id}: ${message}`);
        playerData.chatCooldown = 15 + Math.random() * 25;
      }
    });
  }

  animatePlayer(playerData, deltaTime) {
    const { mesh, animationState } = playerData;
    mesh.scale.y = 1;
    mesh.position.y = this.PLAYER_RESTING_Y;
    
    switch (animationState) {
      case 'walk':
        break;
      case 'idle':
        break;
    }
  }
}
