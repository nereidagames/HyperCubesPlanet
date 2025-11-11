import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { createBaseCharacter } from './character.js';

export class MultiplayerManager {
  constructor(scene, uiManager) {
    this.scene = scene;
    this.uiManager = uiManager;
    this.otherPlayers = new Map(); // Mapa będzie teraz przechowywać prawdziwych graczy
    this.ws = null; // Obiekt WebSocket
    this.myId = null; // Nasze unikalne ID otrzymane od serwera
    this.PLAYER_RESTING_Y = 0.9;
  }

  initialize() {
    // Logika łączenia z serwerem WebSocket
    const serverUrl = 'ws://localhost:8080'; // Adres naszego lokalnego serwera

    try {
      this.ws = new WebSocket(serverUrl);
      
      this.ws.onopen = () => {
        console.log('Połączono z serwerem WebSocket!');
        this.uiManager.addChatMessage('<Połączono z Nexusem!>');
      };

      this.ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        this.handleServerMessage(message);
      };

      this.ws.onclose = () => {
        console.log('Rozłączono z serwerem WebSocket.');
        this.uiManager.addChatMessage('<Rozłączono z Nexusem>');
        // Opcjonalnie: wyczyść listę graczy po rozłączeniu
        this.otherPlayers.forEach((playerData, id) => {
            this.removeOtherPlayer(id);
        });
      };

      this.ws.onerror = (error) => {
        console.error('Błąd WebSocket:', error);
        this.uiManager.addChatMessage('<Błąd połączenia z Nexusem>');
      };

    } catch (error) {
        console.error("Nie udało się połączyć z serwerem WebSocket:", error);
    }
  }

  handleServerMessage(message) {
    switch (message.type) {
      case 'welcome':
        // Serwer przywitał nas i dał nam nasze ID
        this.myId = message.id;
        console.log(`Otrzymano ID od serwera: ${this.myId}`);
        break;

      case 'playerList':
        // Serwer przysłał listę już obecnych graczy
        message.players.forEach(playerId => {
            if (playerId !== this.myId && !this.otherPlayers.has(playerId)) {
                this.addOtherPlayer(playerId, { position: new THREE.Vector3(0, this.PLAYER_RESTING_Y, 0) });
            }
        });
        break;

      case 'playerJoined':
        // Nowy gracz dołączył, stwórzmy jego postać (jeśli to nie my)
        if (message.id !== this.myId) {
          this.addOtherPlayer(message.id, { position: new THREE.Vector3(0, this.PLAYER_RESTING_Y, 0) });
        }
        break;

      case 'playerLeft':
        // Gracz wyszedł, usuńmy jego postać
        this.removeOtherPlayer(message.id);
        break;

      case 'playerMove':
        // Gracz się poruszył, zaktualizujmy jego pozycję (jeśli to nie my)
        if (message.id !== this.myId) {
          const playerData = this.otherPlayers.get(message.id);
          if (playerData) {
            playerData.targetPosition.set(message.position.x, message.position.y, message.position.z);
            playerData.targetQuaternion.set(message.quaternion._x, message.quaternion._y, message.quaternion._z, message.quaternion._w);
          }
        }
        break;
        
      case 'chatMessage':
        // Ktoś wysłał wiadomość na czacie
        if (message.id !== this.myId) {
            const senderName = message.id.substring(0, 8); // Użyjmy skróconego ID jako nazwy
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

  addOtherPlayer(id, data) {
    if (this.otherPlayers.has(id)) return;

    const playerMesh = createBaseCharacter();
    playerMesh.position.copy(data.position);

    this.scene.add(playerMesh);
    
    const playerData = {
      mesh: playerMesh,
      targetPosition: new THREE.Vector3().copy(data.position),
      targetQuaternion: new THREE.Quaternion(), // Będziemy też synchronizować rotację
    };

    this.otherPlayers.set(id, playerData);
    console.log(`Dodano gracza: ${id}`);
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
