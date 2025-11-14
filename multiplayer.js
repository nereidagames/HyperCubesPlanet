import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { createBaseCharacter } from './character.js';
import { SkinStorage } from './SkinStorage.js'; // Importujemy, aby mieć spójny dostęp

export class MultiplayerManager {
  constructor(scene, uiManager, sceneManager, materialsCache) {
    this.scene = scene;
    this.uiManager = uiManager;
    this.sceneManager = sceneManager;
    this.materialsCache = materialsCache;
    this.textureLoader = new THREE.TextureLoader();
    this.otherPlayers = new Map();
    this.ws = null;
    this.myId = null;
    this.PLAYER_RESTING_Y = 0.9;
  }

  initialize() {
    const serverUrl = 'wss://hypercubes-nexus-server.onrender.com';

    this.uiManager.addChatMessage('<Łączenie z Nexusem...>');

    try {
      this.ws = new WebSocket(serverUrl);
      
      this.ws.onopen = () => {
        console.log('Połączono z serwerem WebSocket!');
        this.uiManager.addChatMessage('<Pomyślnie połączono z Nexusem! Witaj w grze.>');
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleServerMessage(message);
        } catch (e) {
          console.error("Błąd parsowania wiadomości od serwera:", e);
        }
      };

      this.ws.onclose = () => {
        console.log('Rozłączono z serwerem WebSocket.');
        this.uiManager.addChatMessage('<Rozłączono z Nexusem. Połączenie zostało przerwane.>');
        // Usuń wszystkich graczy, gdy połączenie jest zerwane
        this.otherPlayers.forEach((playerData, id) => {
            this.removeOtherPlayer(id);
        });
        this.otherPlayers.clear();
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
    const currentPlayer = this.otherPlayers.get(message.id);

    switch (message.type) {
      case 'welcome':
        this.myId = message.id;
        const nickname = localStorage.getItem('bsp_clone_player_name');
        if (nickname) {
            // POPRAWKA: Używamy SkinStorage dla spójności
            const skinName = SkinStorage.getLastUsedSkin();
            const skinData = skinName ? SkinStorage.loadSkin(skinName) : null;
            this.sendMessage({ type: 'playerReady', nickname: nickname, skinData: skinData });
        }
        break;

      case 'playerList':
        message.players.forEach(player => {
          if (player.id !== this.myId && !this.otherPlayers.has(player.id)) {
            this.addOtherPlayer(player.id, player);
          }
        });
        break;

      case 'playerJoined':
        if (message.id !== this.myId && !this.otherPlayers.has(message.id)) {
          this.addOtherPlayer(message.id, message);
        }
        break;

      case 'playerLeft':
        this.removeOtherPlayer(message.id);
        break;

      case 'playerMove':
        if (message.id !== this.myId && currentPlayer) {
            currentPlayer.targetPosition.set(message.position.x, message.position.y, message.position.z);
            currentPlayer.targetQuaternion.set(message.quaternion._x, message.quaternion._y, message.quaternion._z, message.quaternion._w);
        }
        break;
        
      case 'chatMessage':
        const senderName = message.nickname || 'Gracz';
        if (message.id === this.myId) {
            // Wiadomości własne są już dodawane przez UIManager, więc pomijamy
        } else {
            this.uiManager.addChatMessage(`${senderName}: ${message.text}`);
            this.displayChatBubble(message.id, message.text);
        }
        break;
    }
  }

  sendMessage(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  addOtherPlayer(id, data) {
    if (this.otherPlayers.has(id) || !data.nickname) return;

    const playerContainer = new THREE.Group();
    const baseCharacter = createBaseCharacter();
    playerContainer.add(baseCharacter);

    const skinContainer = new THREE.Group();
    skinContainer.scale.setScalar(0.125);
    skinContainer.position.y = 0.2;
    playerContainer.add(skinContainer);
    
    // Nakładamy skin na postać innego gracza
    if (data.skinData && Array.isArray(data.skinData)) {
        data.skinData.forEach(blockData => {
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
            skinContainer.add(block);
        });
    }

    playerContainer.position.set(data.position.x, data.position.y, data.position.z);
    if (data.quaternion) {
        playerContainer.quaternion.set(data.quaternion._x, data.quaternion._y, data.quaternion._z, data.quaternion._w);
    }
    this.scene.add(playerContainer);
    
    // OPTYMALIZACJA: Nie dodajemy obiektów innych graczy do tablicy kolizji,
    // aby uniknąć problemów z fizyką i "przepychaniem się".
    
    const playerData = {
      mesh: playerContainer,
      nickname: data.nickname,
      targetPosition: new THREE.Vector3().copy(playerContainer.position),
      targetQuaternion: new THREE.Quaternion().copy(playerContainer.quaternion),
    };

    this.otherPlayers.set(id, playerData);
    console.log(`Stworzono postać dla gracza: ${data.nickname} (${id})`);
  }

  removeOtherPlayer(id) {
    if (this.otherPlayers.has(id)) {
      const playerData = this.otherPlayers.get(id);
      
      // POPRAWKA: Ulepszona logika usuwania gracza
      // 1. Przechodzimy przez wszystkie obiekty w kontenerze gracza
      playerData.mesh.traverse(object => {
          // 2. Jeśli obiekt ma geometrię lub materiał, zwalniamy pamięć
          if (object.geometry) {
              object.geometry.dispose();
          }
          if (object.material) {
              // Materiały mogą być w tablicy
              if (Array.isArray(object.material)) {
                  object.material.forEach(material => material.dispose());
              } else {
                  object.material.dispose();
              }
          }
      });
      
      // 3. Usuwamy główny kontener gracza ze sceny
      this.scene.remove(playerData.mesh);
      
      // 4. Usuwamy gracza z naszej mapy
      this.otherPlayers.delete(id);
      console.log(`Usunięto postać i zasoby gracza ${id}`);
    }
  }

  displayChatBubble(id, message) {
    const playerData = this.otherPlayers.get(id);
    if (!playerData) return;
    
    if (playerData.chatBubble) playerData.mesh.remove(playerData.chatBubble);
    
    const div = document.createElement('div');
    div.className = 'chat-bubble text-outline'; // Dodano text-outline dla spójności
    div.textContent = message;
    div.style.cssText = `background-color: rgba(255, 255, 255, 0.9); color: black; padding: 8px 12px; border-radius: 15px; font-size: 13px; max-width: 150px; text-align: center; pointer-events: none;`;
    
    const chatBubble = new CSS2DObject(div);
    // Pozycja dymka nad modelem postaci
    chatBubble.position.set(0, 2.2, 0);
    
    playerData.mesh.add(chatBubble);
    playerData.chatBubble = chatBubble;
    
    // Usunięcie dymka po 5 sekundach
    setTimeout(() => {
      if (playerData.chatBubble === chatBubble) {
        playerData.mesh.remove(chatBubble);
        playerData.chatBubble = null;
      }
    }, 5000);
  }

  update(deltaTime) {
    // Płynne przesuwanie (interpolacja) modeli innych graczy do ich docelowych pozycji
    this.otherPlayers.forEach((playerData) => {
      playerData.mesh.position.lerp(playerData.targetPosition, deltaTime * 15);
      playerData.mesh.quaternion.slerp(playerData.targetQuaternion, deltaTime * 15);
    });
  }
}
