/* PLIK: multiplayer.js */

import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js'; 
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
    this.remotePlayers = {}; 
    this.ws = null;
    this.myId = null;
    
    this.localCharacter = null; // Referencja do lokalnego gracza

    this.onMessageSent = null;
    this.onMessageReceived = null;

    this.lastSentPosition = new THREE.Vector3();
    this.lastSentQuaternion = new THREE.Quaternion();
  }

  setLocalCharacter(character) {
      this.localCharacter = character;
  }

  setScene(newScene) {
      this.scene = newScene;
      this.removeAllRemotePlayers(); 
  }

  initialize(token) {
    if (!token) {
        console.error("Brak tokenu JWT.");
        return;
    }
    const serverUrl = `wss://hypercubes-nexus-server.onrender.com?token=${token}`;

    this.uiManager.addChatMessage('<Łączenie z Nexusem...>');

    try {
      this.ws = new WebSocket(serverUrl);
      
      this.ws.onopen = () => {
        console.log('WS: Połączono!');
        this.uiManager.addChatMessage('<Udało się dołączyć do Nexusa!>');

        const skinName = SkinStorage.getLastUsedSkinId(); 
        
        this.ws.send(JSON.stringify({ 
            type: 'playerReady', 
            skinData: null 
        }));
        
        if (skinName) {
            SkinStorage.loadSkinData(skinName).then(data => {
                if (data && this.ws.readyState === WebSocket.OPEN) {
                     this.ws.send(JSON.stringify({ type: 'playerReady', skinData: data }));
                }
            });
        }
      };

      this.ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      };

      this.ws.onclose = () => {
        this.uiManager.addChatMessage('<Rozłączono z serwerem.>');
        this.removeAllRemotePlayers();
      };

      this.ws.onerror = (error) => {
        console.error('WS: Błąd', error);
      };

    } catch (error) {
        console.error("WS Exception:", error);
    }
  }

  joinWorld(worldId, spawnPoint = null) {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          console.log(`Dołączanie do pokoju: ${worldId || 'nexus'}`);
          
          if(this.uiManager) {
              this.uiManager.clearChat();
              this.uiManager.addChatMessage(`<Dołączanie do: ${worldId ? 'Świata' : 'Nexusa'}...>`);
          }

          this.ws.send(JSON.stringify({
              type: 'joinWorld',
              worldId: worldId,
              spawnPoint: spawnPoint
          }));

          this.removeAllRemotePlayers();
          
          if (this.coinManager) {
              this.coinManager.removeCoinGlobally();
          }
      }
  }

  handleMessage(msg) {
    switch (msg.type) {
      case 'init':
      case 'welcome':
        this.myId = msg.id;
        if (msg.type === 'init') this.removeAllRemotePlayers();
        if (msg.position && this.localCharacter) {
             this.localCharacter.position.set(msg.position.x, msg.position.y, msg.position.z);
        }
        if (msg.players) this.updatePlayersList(msg.players);
        break;

      case 'teleport':
        if (this.localCharacter && msg.position) {
            this.localCharacter.position.set(msg.position.x, msg.position.y, msg.position.z);
        }
        break;

      case 'playerList':
        this.updatePlayersList(msg.players);
        break;

      case 'playerJoined':
        if (!this.remotePlayers[msg.id]) {
            this.createRemotePlayer(msg);
            const name = msg.nickname || msg.username || "Gracz";
            this.uiManager.addChatMessage(`<${name} dołączył>`);
        }
        break;

      case 'playerMove':
      case 'updateMove':
        this.updateRemotePlayerTarget(msg);
        break;

      case 'playerLeft':
        this.removeRemotePlayer(msg.id);
        break;
        
      case 'chat':
      case 'chatMessage':
        this.uiManager.addChatMessage(`${msg.nickname}: ${msg.text}`);
        
        if (msg.id === this.myId) {
            this.displayLocalChatBubble(msg.text);
        } else {
            this.displayChatBubble(msg.id, msg.text);
        }
        break;
        
      case 'friendRequestReceived':
        this.uiManager.showMessage(`Zaproszenie od ${msg.from}!`, 'info');
        if(this.uiManager.loadFriendsData) this.uiManager.loadFriendsData();
        break;
      case 'friendRequestAccepted':
        this.uiManager.showMessage(`${msg.by} przyjął zaproszenie!`, 'success');
        if(this.uiManager.loadFriendsData) this.uiManager.loadFriendsData();
        break;
      case 'friendStatusChange':
        if(this.uiManager.loadFriendsData) this.uiManager.loadFriendsData();
        break;
      case 'privateMessageReceived':
        this.uiManager.showMessage(`Wiadomość od ${msg.sender.nickname}`, 'info');
        if (this.onMessageReceived) this.onMessageReceived(msg);
        break;
      case 'privateMessageSent':
        if (this.onMessageSent) this.onMessageSent(msg);
        break;
      case 'coinSpawned':
        if (this.coinManager) this.coinManager.spawnCoinAt(msg.position);
        break;
      case 'coinCollected':
        if (this.coinManager) this.coinManager.removeCoinGlobally();
        break;
      case 'updateBalance':
        if (this.coinManager) this.coinManager.updateBalance(msg.newBalance);
        break;
    }
  }

  // --- Helper dla lokalnego gracza ---
  displayLocalChatBubble(message) {
      if (!this.localCharacter) return;

      if (this.localCharacter.chatBubble) {
          this.localCharacter.remove(this.localCharacter.chatBubble);
          if (this.localCharacter.chatBubble.element && this.localCharacter.chatBubble.element.parentNode) {
              this.localCharacter.chatBubble.element.parentNode.removeChild(this.localCharacter.chatBubble.element);
          }
          this.localCharacter.chatBubble = null;
      }

      const div = document.createElement('div');
      div.className = 'chat-bubble-styled';
      div.textContent = message;

      const bubble = new CSS2DObject(div);
      // ZMIANA: Obniżono do 1.9
      bubble.position.set(0, 1.9, 0); 
      this.localCharacter.add(bubble);
      this.localCharacter.chatBubble = bubble;

      setTimeout(() => {
          if (this.localCharacter && this.localCharacter.chatBubble === bubble) {
              this.localCharacter.remove(bubble);
              if (bubble.element.parentNode) {
                  bubble.element.parentNode.removeChild(bubble.element);
              }
              this.localCharacter.chatBubble = null;
          }
      }, 6000);
  }

  updatePlayersList(playersData) {
      const currentIds = Object.keys(this.remotePlayers).map(Number);
      const newIds = new Set(playersData.map(p => p.id));
      currentIds.forEach(id => { if (!newIds.has(id)) this.removeRemotePlayer(id); });
      playersData.forEach(pData => {
          if (pData.id === this.myId) return;
          if (this.remotePlayers[pData.id]) this.updateRemotePlayerTarget(pData);
          else this.createRemotePlayer(pData);
      });
  }

  sendMyPosition(position, quaternion) {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          if (position.distanceTo(this.lastSentPosition) > 0.01 || Math.abs(quaternion.x - this.lastSentQuaternion.x) > 0.01) {
              this.ws.send(JSON.stringify({
                  type: 'playerMove', position: { x: position.x, y: position.y, z: position.z },
                  quaternion: { _x: quaternion.x, _y: quaternion.y, _z: quaternion.z, _w: quaternion.w }
              }));
              this.lastSentPosition.copy(position);
              this.lastSentQuaternion.copy(quaternion);
          }
      }
  }

  sendMessage(data) { if (this.ws && this.ws.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(data)); }
  sendPrivateMessage(recipient, text) { this.sendMessage({ type: 'sendPrivateMessage', recipient, text }); }

  createRemotePlayer(data) {
    if (data.id === this.myId || this.remotePlayers[data.id]) return;
    const group = new THREE.Group();
    createBaseCharacter(group);

    if (data.skinData && Array.isArray(data.skinData) && data.skinData.length > 0) {
        const skinContainer = new THREE.Group();
        skinContainer.scale.setScalar(0.125);
        skinContainer.position.y = 0.5;
        const geometriesByTexture = {};
        data.skinData.forEach(block => {
            if (!block.texturePath) return;
            if (!geometriesByTexture[block.texturePath]) geometriesByTexture[block.texturePath] = [];
            const geometry = new THREE.BoxGeometry(1, 1, 1);
            geometry.translate(block.x, block.y, block.z);
            geometriesByTexture[block.texturePath].push(geometry);
        });
        for (const [texturePath, geometries] of Object.entries(geometriesByTexture)) {
            if (geometries.length === 0) continue;
            const mergedGeometry = BufferGeometryUtils.mergeGeometries(geometries);
            let material = this.materialsCache[texturePath];
            if (!material) {
                const tex = this.textureLoader.load(texturePath);
                tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter;
                material = new THREE.MeshLambertMaterial({ map: tex });
                this.materialsCache[texturePath] = material;
            }
            const mesh = new THREE.Mesh(mergedGeometry, material);
            mesh.castShadow = true;
            skinContainer.add(mesh);
        }
        group.add(skinContainer);
    }

    if (data.position) group.position.set(data.position.x, data.position.y, data.position.z);
    else if (data.x !== undefined) group.position.set(data.x, data.y, data.z);

    if (data.quaternion) group.quaternion.set(data.quaternion._x, data.quaternion._y, data.quaternion._z, data.quaternion._w);
    else if (data.qx !== undefined) group.quaternion.set(data.qx, data.qy, data.qz, data.qw);

    const div = document.createElement('div');
    div.className = 'text-outline';
    div.textContent = data.nickname || data.username || "Gracz";
    div.style.color = 'white'; div.style.fontSize = '14px'; div.style.fontWeight = 'bold';
    const label = new CSS2DObject(div);
    label.position.set(0, 2.2, 0);
    group.add(label);

    this.scene.add(group);
    
    this.remotePlayers[data.id] = {
        mesh: group,
        targetPos: group.position.clone(),
        targetRot: group.quaternion.clone(),
        chatBubble: null
    };
  }

  updateRemotePlayerTarget(data) {
      const p = this.remotePlayers[data.id];
      if (p) {
          if (data.position) p.targetPos.set(data.position.x, data.position.y, data.position.z);
          if (data.quaternion) p.targetRot.set(data.quaternion._x, data.quaternion._y, data.quaternion._z, data.quaternion._w);
      }
  }

  removeRemotePlayer(id) {
      const p = this.remotePlayers[id];
      if (p) {
          this.scene.remove(p.mesh);
          p.mesh.traverse(child => {
              if (child.isMesh && child.geometry) child.geometry.dispose();
              if (child.isCSS2DObject && child.element && child.element.parentNode) child.element.parentNode.removeChild(child.element);
          });
          delete this.remotePlayers[id];
      }
  }
  
  removeAllRemotePlayers() { Object.keys(this.remotePlayers).forEach(id => this.removeRemotePlayer(id)); this.remotePlayers = {}; }

  // --- ZMODYFIKOWANA METODA DLA INNYCH GRACZY ---
  displayChatBubble(id, message) {
    const p = this.remotePlayers[id];
    if (!p) return;
    
    if (p.chatBubble) {
        if(p.chatBubble.element && p.chatBubble.element.parentNode) {
            p.chatBubble.element.parentNode.removeChild(p.chatBubble.element);
        }
        p.mesh.remove(p.chatBubble);
    }
    
    const div = document.createElement('div');
    div.className = 'chat-bubble-styled';
    div.textContent = message;
    
    const bubble = new CSS2DObject(div);
    // ZMIANA: Obniżono do 1.9
    bubble.position.set(0, 1.9, 0); 
    p.mesh.add(bubble);
    p.chatBubble = bubble;
    
    setTimeout(() => {
      if (p.chatBubble === bubble) {
        if(bubble.element && bubble.element.parentNode) {
             bubble.element.parentNode.removeChild(bubble.element);
        }
        p.mesh.remove(bubble);
        p.chatBubble = null;
      }
    }, 6000);
  }

  update(deltaTime) {
    for (const id in this.remotePlayers) {
      const p = this.remotePlayers[id];
      p.mesh.position.lerp(p.targetPos, deltaTime * 15);
      p.mesh.quaternion.slerp(p.targetRot, deltaTime * 15);
    }
  }
}