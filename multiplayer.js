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
    this.remotePlayers = {}; // Przechowuje innych graczy { id: { mesh, targetPos, targetRot } }
    this.ws = null;
    this.myId = null;
    
    // Callbacki UI
    this.onMessageSent = null;
    this.onMessageReceived = null;

    // Do optymalizacji wysyłania
    this.lastSentPosition = new THREE.Vector3();
    this.lastSentQuaternion = new THREE.Quaternion();
  }

  initialize(token) {
    if (!token) {
        console.error("Brak tokenu JWT.");
        return;
    }
    const serverUrl = `wss://hypercubes-nexus-server.onrender.com?token=${token}`;

    this.uiManager.addChatMessage('<Łączenie z serwerem...>');

    try {
      this.ws = new WebSocket(serverUrl);
      
      this.ws.onopen = () => {
        console.log('WS: Połączono!');
        this.uiManager.addChatMessage('<Połączono!>');

        // KROK 1: Wyślij swój skin do serwera, aby inni go widzieli
        const skinName = SkinStorage.getLastUsedSkin();
        const skinData = skinName ? SkinStorage.loadSkin(skinName) : null;
        
        this.ws.send(JSON.stringify({ 
            type: 'mySkin', 
            skinData: skinData 
        }));
      };

      this.ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      };

      this.ws.onclose = () => {
        console.log('WS: Rozłączono.');
        this.uiManager.addChatMessage('<Rozłączono z serwerem.>');
        this.removeAllRemotePlayers();
      };

      this.ws.onerror = (error) => {
        console.error('WS: Błąd', error);
        this.uiManager.addChatMessage('<Błąd połączenia.>');
      };

    } catch (error) {
        console.error("WS Exception:", error);
    }
  }

  handleMessage(msg) {
    switch (msg.type) {
      // 1. Inicjalizacja - dostajemy swoje ID i listę obecnych graczy
      case 'init':
        this.myId = msg.id;
        console.log("Otrzymano init. Moje ID:", this.myId);
        msg.players.forEach(p => this.createRemotePlayer(p));
        // Jeśli jest moneta na serwerze, zrespawnuj ją
        if (msg.coin && this.coinManager) {
            this.coinManager.spawnCoinAt(msg.coin);
        }
        break;

      // 2. Ktoś nowy wszedł
      case 'playerJoined':
        this.createRemotePlayer(msg);
        this.uiManager.addChatMessage(`<${msg.username} dołączył>`);
        break;

      // 3. Ktoś się rusza
      case 'updateMove':
        this.updateRemotePlayerTarget(msg);
        break;

      // 4. Ktoś wyszedł
      case 'playerLeft':
        this.removeRemotePlayer(msg.id);
        this.uiManager.addChatMessage(`<Gracz wyszedł>`);
        break;
        
      // 5. Czat
      case 'chat':
        this.uiManager.addChatMessage(`${msg.username}: ${msg.text}`);
        this.displayChatBubble(msg.id, msg.text);
        break;
        
      // 6. Poczta / Powiadomienia
      case 'friendRequestReceived':
        this.uiManager.showMessage(`Zaproszenie od ${msg.from}!`, 'info');
        // Odświeżamy listę w UI (jeśli UIManager ma dostęp do tej metody)
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

      // 7. Monety
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

  // --- WYSYŁANIE DANYCH ---

  // Wywoływane z main.js w pętli setInterval (np. co 50ms)
  sendMyPosition(position, quaternion) {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          // Optymalizacja: wyślij tylko jeśli pozycja się zmieniła
          if (position.distanceTo(this.lastSentPosition) > 0.01 || 
              Math.abs(quaternion.x - this.lastSentQuaternion.x) > 0.01) {
              
              this.ws.send(JSON.stringify({
                  type: 'move',
                  x: position.x, y: position.y, z: position.z,
                  qx: quaternion.x, qy: quaternion.y, qz: quaternion.z, qw: quaternion.w
              }));
              
              this.lastSentPosition.copy(position);
              this.lastSentQuaternion.copy(quaternion);
          }
      }
  }

  sendMessage(data) {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify(data));
      }
  }

  sendPrivateMessage(recipient, text) {
      this.sendMessage({ type: 'sendPrivateMessage', recipient, text });
  }

  // --- ZARZĄDZANIE INNYMI GRACZAMI ---

  createRemotePlayer(data) {
    if (this.remotePlayers[data.id]) return; // Już istnieje

    console.log(`Tworzenie gracza remote: ${data.username}`);

    const group = new THREE.Group();
    
    // 1. Dodaj nogi
    createBaseCharacter(group);

    // 2. Dodaj skin
    if (data.skinData) {
        const skinContainer = new THREE.Group();
        skinContainer.scale.setScalar(0.125);
        skinContainer.position.y = 0.5; // Dopasowanie do nóg
        
        data.skinData.forEach(block => {
            const geo = new THREE.BoxGeometry(1, 1, 1);
            
            // Cache materiałów
            let mat = this.materialsCache[block.texturePath];
            if (!mat) {
                const tex = this.textureLoader.load(block.texturePath);
                tex.magFilter = THREE.NearestFilter;
                mat = new THREE.MeshLambertMaterial({ map: tex });
                this.materialsCache[block.texturePath] = mat;
            }
            
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(block.x, block.y, block.z);
            mesh.castShadow = true;
            skinContainer.add(mesh);
        });
        group.add(skinContainer);
    }

    // 3. Pozycja początkowa
    group.position.set(data.x, data.y, data.z);
    group.quaternion.set(data.qx, data.qy, data.qz, data.qw);

    // 4. Nickname nad głową
    const div = document.createElement('div');
    div.className = 'text-outline';
    div.textContent = data.username;
    div.style.color = 'white';
    div.style.fontSize = '14px';
    div.style.fontWeight = 'bold';
    const label = new CSS2DObject(div);
    label.position.set(0, 2.2, 0);
    group.add(label);

    this.scene.add(group);

    // WAŻNE: Nie dodajemy do collidableObjects!
    
    this.remotePlayers[data.id] = {
        mesh: group,
        targetPos: new THREE.Vector3(data.x, data.y, data.z),
        targetRot: new THREE.Quaternion(data.qx, data.qy, data.qz, data.qw),
        chatBubble: null
    };
  }

  updateRemotePlayerTarget(data) {
      const p = this.remotePlayers[data.id];
      if (p) {
          p.targetPos.set(data.x, data.y, data.z);
          p.targetRot.set(data.qx, data.qy, data.qz, data.qw);
      }
  }

  removeRemotePlayer(id) {
      const p = this.remotePlayers[id];
      if (p) {
          this.scene.remove(p.mesh);
          delete this.remotePlayers[id];
      }
  }
  
  removeAllRemotePlayers() {
      for (const id in this.remotePlayers) {
          this.scene.remove(this.remotePlayers[id].mesh);
      }
      this.remotePlayers = {};
  }

  displayChatBubble(id, message) {
    const p = this.remotePlayers[id];
    if (!p) return;
    
    if (p.chatBubble) p.mesh.remove(p.chatBubble);
    
    const div = document.createElement('div');
    div.className = 'chat-bubble';
    div.textContent = message;
    div.style.cssText = `background-color: rgba(255, 255, 255, 0.9); color: #000; padding: 5px 10px; border-radius: 10px; font-size: 12px; max-width: 150px; text-align: center;`;
    
    const bubble = new CSS2DObject(div);
    bubble.position.set(0, 2.5, 0);
    p.mesh.add(bubble);
    p.chatBubble = bubble;
    
    setTimeout(() => {
      if (p.chatBubble === bubble) {
        p.mesh.remove(bubble);
        p.chatBubble = null;
      }
    }, 5000);
  }

  // Interpolacja ruchu w pętli gry
  update(deltaTime) {
    for (const id in this.remotePlayers) {
      const p = this.remotePlayers[id];
      // Lerp pozycji (wygładzanie)
      p.mesh.position.lerp(p.targetPos, deltaTime * 10);
      // Slerp rotacji
      p.mesh.quaternion.slerp(p.targetRot, deltaTime * 10);
    }
  }
}