import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { createBaseCharacter } from './character.js';
import { SkinStorage } from './SkinStorage.js';

export class MultiplayerManager {
  constructor(scene, uiManager, sceneManager, materialsCache, coinManager) {
    this.scene = scene;
    this.uiManager = uiManager;
    this.sceneManager = sceneManager;
    this.materialsCache = materialsCache;
    this.coinManager = coinManager;
    this.textureLoader = new THREE.TextureLoader();
    this.otherPlayers = new Map();
    this.ws = null;
    this.myId = null;
    this.onMessageSent = null;
    this.onMessageReceived = null;
  }

  initialize(token) {
    if (!token) { console.error("Brak tokenu."); return; }
    const serverUrl = `wss://hypercubes-nexus-server.onrender.com?token=${token}`;
    this.uiManager.addChatMessage('<Łączenie...>');

    try {
      this.ws = new WebSocket(serverUrl);
      this.ws.onopen = () => { console.log('WS Connected'); this.uiManager.addChatMessage('<Połączono!>'); };
      this.ws.onmessage = (event) => { const message = JSON.parse(event.data); this.handleServerMessage(message); };
      this.ws.onclose = () => { console.log('WS Closed'); this.uiManager.addChatMessage('<Rozłączono.>'); this.otherPlayers.forEach((pd, id) => this.removeOtherPlayer(id)); };
      this.ws.onerror = (err) => { console.error('WS Error', err); this.uiManager.addChatMessage('<Błąd połączenia.>'); };
    } catch (error) { console.error("WS Error:", error); }
  }

  handleServerMessage(message) {
    switch (message.type) {
      case 'welcome':
        this.myId = message.id;
        const skinName = SkinStorage.getLastUsedSkin();
        // Wczytaj dane skina z serwera jeśli trzeba, tutaj uproszczone ładowanie z localStorage
        // W idealnym świecie skinData byłoby ID, ale tutaj przekazujemy bloki
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
          this.uiManager.addChatMessage(`<${message.nickname} dołączył>`);
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
        if (message.id === this.myId) this.uiManager.addChatMessage(`Ty: ${message.text}`);
        else { this.uiManager.addChatMessage(`${senderName}: ${message.text}`); this.displayChatBubble(message.id, message.text); }
        break;
        
      case 'privateMessageReceived':
        this.uiManager.showMessage(`Wiadomość od ${message.sender.nickname}`, 'info');
        if (this.onMessageReceived) this.onMessageReceived(message);
        break;

      case 'privateMessageSent':
        if (this.onMessageSent) this.onMessageSent(message);
        break;

      case 'coinSpawned': if (this.coinManager) this.coinManager.spawnCoinAt(message.position); break;
      case 'coinCollected': if (this.coinManager) this.coinManager.removeCoinGlobally(); break;
      case 'updateBalance': if (this.coinManager) this.coinManager.updateBalance(message.newBalance); break;
    }
  }

  sendMessage(data) { if (this.ws && this.ws.readyState === 1) this.ws.send(JSON.stringify(data)); }
  sendPrivateMessage(recipient, text) { this.sendMessage({ type: 'sendPrivateMessage', recipient: recipient, text: text }); }

  addOtherPlayer(id, data) {
    if (this.otherPlayers.has(id)) return;

    const playerContainer = new THREE.Group();
    createBaseCharacter(playerContainer); // Używamy funkcji z character.js

    const skinContainer = new THREE.Group();
    skinContainer.scale.setScalar(0.125);
    // WAŻNA ZMIANA: Ustawiamy Y na 0.5, aby pasowało do nowego modelu nóg w character.js
    skinContainer.position.y = 0.5; 
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
    
    // UWAGA: USUNIĘTO dodawanie do collidableObjects, aby gracze się nie zderzali
    
    const playerData = {
      mesh: playerContainer,
      nickname: data.nickname,
      targetPosition: new THREE.Vector3().copy(playerContainer.position),
      targetQuaternion: new THREE.Quaternion().copy(playerContainer.quaternion),
    };

    this.otherPlayers.set(id, playerData);
  }

  removeOtherPlayer(id) {
    if (this.otherPlayers.has(id)) {
      const playerData = this.otherPlayers.get(id);
      this.scene.remove(playerData.mesh);
      this.otherPlayers.delete(id);
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
    chatBubble.position.set(0, 1.8, 0); // Nad głową
    playerData.mesh.add(chatBubble);
    playerData.chatBubble = chatBubble;
    setTimeout(() => { if (playerData.chatBubble === chatBubble) { playerData.mesh.remove(chatBubble); playerData.chatBubble = null; } }, 5000);
  }

  update(deltaTime) {
    this.otherPlayers.forEach((playerData) => {
      playerData.mesh.position.lerp(playerData.targetPosition, deltaTime * 10);
      playerData.mesh.quaternion.slerp(playerData.targetQuaternion, deltaTime * 10);
    });
  }
}