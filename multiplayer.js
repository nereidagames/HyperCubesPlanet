import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { createBaseCharacter } from './character.js';

export class MultiplayerManager {
  constructor(scene, uiManager) {
    this.scene = scene;
    this.uiManager = uiManager;
    this.otherPlayers = new Map();
    this.ws = null;
    this.myId = null;
    this.PLAYER_RESTING_Y = 0.9;
  }

  initialize() {
    const serverUrl = 'wss://hypercubes-nexus-server.onrender.com'; // Upewnij się, że to Twój poprawny adres z Render

    this.uiManager.addChatMessage('<Łączenie z Nexusem...>');

    try {
      this.ws = new WebSocket(serverUrl);
      
      this.ws.onopen = () => {
        console.log('Połączono z serwerem WebSocket!');
        this.uiManager.addChatMessage('<Pomyślnie połączono z Nexusem! Witaj w grze.>');
      };

      this.ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        this.handleServerMessage(message);
      };

      this.ws.onclose = () => {
        console.log('Rozłączono z serwerem WebSocket.');
        this.uiManager.addChatMessage('<Rozłączono z Nexusem. Połączenie zostało przerwane.>');
        this.otherPlayers.forEach((playerData, id) => {
            this.removeOtherPlayer(id);
        });
      };

      this.ws.onerror = (error) => {
        console.error('Błąd WebSocket:', error);
        this.uiManager.addChatMessage('<Błąd połączenia z Nexusem. Serwer może być niedostępny. Spróbuj odświeżyć stronę.>');
      };

    } catch (error) {
        console.error("Nie udało się połączyć z serwerem WebSocket:", error);
        this.uiManager.addChatMessage('<Krytyczny błąd przy próbie połączenia z serwerem.>');
    }
  }

  handleServerMessage(message) {
    switch (message.type) {
      case 'welcome':
        this.myId = message.id;
        console.log(`Otrzymano ID od serwera: ${this.myId}`);
        const nickname = localStorage.getItem('bsp_clone_player_name') || `Player_${this.myId.substring(0, 4)}`;
        this.sendMessage({ type: 'setNickname', nickname: nickname });
        break;

      // --- NOWOŚĆ: Obsługa listy graczy, którzy już są na serwerze ---
      case 'playerList':
        message.players.forEach(player => {
          if (player.id !== this.myId && !this.otherPlayers.has(player.id)) {
            this.addOtherPlayer(player.id, player); // Przekazujemy cały obiekt gracza
          }
        });
        break;

      // --- ZMIANA: `playerJoined` teraz też otrzymuje pozycję ---
      case 'playerJoined':
        if (message.id !== this.myId) {
          this.addOtherPlayer(message.id, message); // Przekazujemy cały obiekt gracza
        }
        break;

      case 'playerLeft':
        this.removeOtherPlayer(message.id);
        break;

      case 'playerMove':
        if (message.id !== this.myId) {
          const playerData = this.otherPlayers.get(message.id);
          if (playerData) {
            playerData.targetPosition.set(message.position.x, message.position.y, message.position.z);
            playerData.targetQuaternion.set(message.quaternion._x, message.quaternion._y, message.quaternion._z, message.quaternion._w);
          }
        }
        break;
        
      case 'chatMessage':
        const senderName = message.nickname || message.id.substring(0, 8);
        if (message.id !== this.myId) {
            this.uiManager.addChatMessage(`${senderName}: ${message.text}`);
            this.displayChatBubble(message.id, message.text);
        }
        break;
    }
  }

  sendMessage(data) {
    if (this.ws && this.ws.readyState === this.ws.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  // --- ZMIANA: Funkcja przyjmuje teraz pełne dane gracza ---
  addOtherPlayer(id, data) {
    if (this.otherPlayers.has(id)) return;

    const playerMesh = createBaseCharacter();
    // Ustaw postać w jej ostatniej znanej pozycji
    playerMesh.position.set(data.position.x, data.position.y, data.position.z);
    playerMesh.quaternion.set(data.quaternion._x, data.quaternion._y, data.quaternion._z, data.quaternion._w);

    this.scene.add(playerMesh);
    
    const playerData = {
      mesh: playerMesh,
      nickname: data.nickname,
      targetPosition: new THREE.Vector3().copy(playerMesh.position),
      targetQuaternion: new THREE.Quaternion().copy(playerMesh.quaternion),
    };

    this.otherPlayers.set(id, playerData);
    console.log(`Dodano gracza: ${data.nickname} (${id})`);
  }

  removeOtherPlayer(id) {
    if (this.otherPlayers.has(id)) {
      const playerData = this.otherPlayers.get(id);
      this.scene.remove(playerData.mesh);
      this.otherPlayers.delete(id);
      console.log(`Usunięto gracza: ${id}`);
    }
  }

  displayChatBubble(id, message) {
    const playerData = this.otherPlayers.get(id);
    if (!playerData || !playerData.mesh) return;
    
    if (playerData.chatBubble) {
      playerData.mesh.remove(playerData.chatBubble);
    }
    
    const div = document.createElement('div');
    div.className = 'chat-bubble';
    div.textContent = message;
    div.style.cssText = `background-color: rgba(255, 255, 255, 0.8); color: #333; padding: 8px 12px; border-radius: 15px; font-size: 12px; max-width: 150px; text-align: center; pointer-events: none;`;
    
    const chatBubble = new CSS2DObject(div);
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

  update(deltaTime) {
    this.otherPlayers.forEach((playerData) => {
      // Płynne przejście do docelowej pozycji (interpolacja)
      playerData.mesh.position.lerp(playerData.targetPosition, deltaTime * 15);
      // Płynny obrót do docelowej rotacji (interpolacja sferyczna)
      playerData.mesh.quaternion.slerp(playerData.targetQuaternion, deltaTime * 15);
    });
  }
                                  }
