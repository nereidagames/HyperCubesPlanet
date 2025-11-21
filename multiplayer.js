import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { createBaseCharacter } from './character.js';
import { SkinStorage } from './SkinStorage.js';

export class MultiplayerManager {
  // Dodano coinManager do konstruktora
  constructor(scene, uiManager, sceneManager, materialsCache, coinManager) {
    this.scene = scene;
    this.uiManager = uiManager;
    this.sceneManager = sceneManager;
    this.materialsCache = materialsCache;
    this.coinManager = coinManager; // Zapisujemy referencję
    this.textureLoader = new THREE.TextureLoader();
    this.otherPlayers = new Map();
    this.ws = null;
    this.myId = null;
  }

  initialize(token) {
    if (!token) {
        console.error("Brak tokenu JWT, nie można połączyć z multiplayerem.");
        return;
    }
    const serverUrl = `wss://hypercubes-nexus-server.onrender.com?token=${token}`;

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
        const skinName = SkinStorage.getLastUsedSkin();
        const skinData = skinName ? SkinStorage.loadSkin(skinName) : null;
        this.sendMessage({ type: 'playerReady', skinData: skinData });
        break;

      case 'playerList':
        message.players.forEach(player => {
          if (player.id !== this.myId && !this.otherPlayers.has(player.id)) {
            this.addOtherPlayer(player.id, player);
          }
        });
        break;

      case 'playerJoined':
        if (message.id !== this.myId) {
          this.addOtherPlayer(message.id, message);
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
        const senderName = message.nickname;
        if (message.id === this.myId) {
            this.uiManager.addChatMessage(`Ty: ${message.text}`);
        } else {
            this.uiManager.addChatMessage(`${senderName}: ${message.text}`);
            this.displayChatBubble(message.id, message.text);
        }
        break;
        
      case 'privateMessageReceived':
        console.log("Otrzymano nową prywatną wiadomość od", message.sender.nickname);
        this.uiManager.showMessage(`Masz nową wiadomość od ${message.sender.nickname}`, 'info');
        break;
        
      case 'privateMessageError':
        alert(`Błąd wiadomości: ${message.message}`);
        break;

      // --- NOWE OBSŁUGI MONET ---
      case 'coinSpawned':
        if (this.coinManager) {
            this.coinManager.spawnCoinAt(message.position);
        }
        break;

      case 'coinCollected':
        if (this.coinManager) {
            this.coinManager.removeCoinGlobally();
        }
        break;

      case 'updateBalance':
        if (this.coinManager) {
            this.coinManager.updateBalance(message.newBalance);
        }
        break;
    }
  }

  sendMessage(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  sendPrivateMessage(recipient, text) {
      this.sendMessage({
          type: 'sendPrivateMessage',
          recipient: recipient,
          text: text
      });
  }

  addOtherPlayer(id, data) {
    if (this.otherPlayers.has(id)) return;

    const playerContainer = new THREE.Group();
    const baseCharacter = createBaseCharacter(playerContainer); // Przekazano kontener

    const skinContainer = new THREE.Group();
    skinContainer.scale.setScalar(0.125);
    // Dopasowanie pozycji skina u innych graczy (tak samo jak w character.js)
    skinContainer.position.y = 1.2; 
    playerContainer.add(skinContainer);
    
    if (data.skinData) {
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
    playerContainer.quaternion.set(data.quaternion._x, data.quaternion._y, data.quaternion._z, data.quaternion._w);
    this.scene.add(playerContainer);
    
    playerContainer.traverse((child) => {
        if (child.isMesh) {
            if (this.sceneManager && this.sceneManager.collidableObjects) {
                this.sceneManager.collidableObjects.push(child);
            }
        }
    });
    
    const playerData = {
      mesh: playerContainer,
      nickname: data.nickname,
      targetPosition: new THREE.Vector3().copy(playerContainer.position),
      targetQuaternion: new THREE.Quaternion().copy(playerContainer.quaternion),
    };

    this.otherPlayers.set(id, playerData);
    console.log(`Stworzono postać dla gracza: ${data.nickname}`);
  }

  removeOtherPlayer(id) {
    if (this.otherPlayers.has(id)) {
      const playerData = this.otherPlayers.get(id);
      
      if (this.sceneManager && this.sceneManager.collidableObjects) {
          this.sceneManager.collidableObjects = this.sceneManager.collidableObjects.filter(obj => {
              let keep = true;
              playerData.mesh.traverse(child => {
                  if (child === obj) {
                      keep = false;
                  }
              });
              return keep;
          });
      }

      this.scene.remove(playerData.mesh);
      this.otherPlayers.delete(id);
      console.log(`Usunięto postać gracza ${id}`);
    }
  }

  displayChatBubble(id, message) {
    if (!this.otherPlayers.has(id)) return;
    const playerData = this.otherPlayers.get(id);
    
    if (playerData.chatBubble) playerData.mesh.remove(playerData.chatBubble);
    
    const div = document.createElement('div');
    div.className = 'chat-bubble';
    div.textContent = message;
    div.style.cssText = `background-color: rgba(255, 255, 255, 0.8); color: #333; padding: 8px 12px; border-radius: 15px; font-size: 12px; max-width: 150px; text-align: center; pointer-events: none;`;
    
    const chatBubble = new CSS2DObject(div);
    // Podniesiono dymek wyżej, żeby był nad głową (spójnie z character.js)
    chatBubble.position.set(0, 2.2, 0);
    
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
      playerData.mesh.position.lerp(playerData.targetPosition, deltaTime * 15);
      playerData.mesh.quaternion.slerp(playerData.targetQuaternion, deltaTime * 15);
    });
  }
}