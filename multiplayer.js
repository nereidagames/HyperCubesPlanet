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
    this.remotePlayers = {}; 
    this.ws = null;
    this.myId = null;
    
    this.onMessageSent = null;
    this.onMessageReceived = null;

    this.lastSentPosition = new THREE.Vector3();
    this.lastSentQuaternion = new THREE.Quaternion();
  }

  setScene(newScene) {
      this.scene = newScene;
      // Przy zmianie sceny (np. wejście do świata) musimy przenieść lub odtworzyć graczy
      // Najbezpieczniej wyczyścić i pozwolić serwerowi wysłać listę ponownie (co robi joinWorld)
      this.removeAllRemotePlayers(); 
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

        const skinName = SkinStorage.getLastUsedSkin();
        const skinData = skinName ? SkinStorage.loadSkin(skinName) : null;
        
        this.ws.send(JSON.stringify({ 
            type: 'playerReady', // Zmieniono na playerReady dla spójności z serwerem
            skinData: skinData 
        }));
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

  joinWorld(worldId) {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          console.log(`Dołączanie do pokoju: ${worldId || 'nexus'}`);
          
          this.ws.send(JSON.stringify({
              type: 'joinWorld',
              worldId: worldId 
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
      case 'welcome': // Obsługa obu typów powitań
        this.myId = msg.id;
        // Serwer może wysłać listę w 'init', ale zazwyczaj wysyła osobno 'playerList'
        if (msg.players) {
            this.removeAllRemotePlayers();
            msg.players.forEach(p => this.createRemotePlayer(p));
        }
        break;

      case 'playerList':
        this.removeAllRemotePlayers(); 
        msg.players.forEach(p => this.createRemotePlayer(p));
        break;

      case 'playerJoined':
        this.createRemotePlayer(msg);
        // POPRAWKA: Używamy msg.nickname (z serwera)
        const name = msg.nickname || msg.username || "Gracz";
        this.uiManager.addChatMessage(`<${name} dołączył>`);
        break;

      // Obsługa ruchu (nazwa z serwera to 'playerMove', ale dla pewności obsługujemy też stare 'updateMove')
      case 'playerMove':
      case 'updateMove':
        this.updateRemotePlayerTarget(msg);
        break;

      case 'playerLeft':
        this.removeRemotePlayer(msg.id);
        break;
        
      case 'chat':
      case 'chatMessage': // Serwer wysyła chatMessage
        this.uiManager.addChatMessage(`${msg.nickname}: ${msg.text}`);
        this.displayChatBubble(msg.id, msg.text);
        break;
        
      // Powiadomienia
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

      // Monety
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

  sendMyPosition(position, quaternion) {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          if (position.distanceTo(this.lastSentPosition) > 0.01 || 
              Math.abs(quaternion.x - this.lastSentQuaternion.x) > 0.01) {
              
              this.ws.send(JSON.stringify({
                  type: 'playerMove', // Zmieniono na playerMove (tak jak w serwerze)
                  position: { x: position.x, y: position.y, z: position.z },
                  quaternion: { _x: quaternion.x, _y: quaternion.y, _z: quaternion.z, _w: quaternion.w }
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

  createRemotePlayer(data) {
    if (this.remotePlayers[data.id]) return; 

    const group = new THREE.Group();
    createBaseCharacter(group);

    if (data.skinData) {
        const skinContainer = new THREE.Group();
        skinContainer.scale.setScalar(0.125);
        skinContainer.position.y = 0.5;
        
        data.skinData.forEach(block => {
            const geo = new THREE.BoxGeometry(1, 1, 1);
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

    // --- POPRAWKA POZYCJI ---
    // Serwer wysyła obiekt { position: {x,y,z}, quaternion: {_x,_y...} }
    // Musimy to poprawnie rozpakować
    if (data.position) {
        group.position.set(data.position.x, data.position.y, data.position.z);
    } else if (data.x !== undefined) { // Fallback dla starych wersji
        group.position.set(data.x, data.y, data.z);
    }

    if (data.quaternion) {
        group.quaternion.set(data.quaternion._x, data.quaternion._y, data.quaternion._z, data.quaternion._w);
    } else if (data.qx !== undefined) {
        group.quaternion.set(data.qx, data.qy, data.qz, data.qw);
    }

    const div = document.createElement('div');
    div.className = 'text-outline';
    div.textContent = data.nickname || data.username || "Gracz";
    div.style.color = 'white';
    div.style.fontSize = '14px';
    div.style.fontWeight = 'bold';
    const label = new CSS2DObject(div);
    label.position.set(0, 2.2, 0);
    group.add(label);

    // Dodajemy do AKTUALNEJ sceny (zmienia się dynamicznie przez setScene)
    this.scene.add(group);
    
    this.remotePlayers[data.id] = {
        mesh: group,
        // Inicjalizujemy cel interpolacji aktualną pozycją
        targetPos: group.position.clone(),
        targetRot: group.quaternion.clone(),
        chatBubble: null
    };
    
    console.log(`Utworzono gracza ${data.nickname} na pozycji`, group.position);
  }

  updateRemotePlayerTarget(data) {
      const p = this.remotePlayers[data.id];
      if (p) {
          // POPRAWKA: Rozpakowanie obiektu position/quaternion z serwera
          if (data.position) {
              p.targetPos.set(data.position.x, data.position.y, data.position.z);
          }
          if (data.quaternion) {
              p.targetRot.set(data.quaternion._x, data.quaternion._y, data.quaternion._z, data.quaternion._w);
          }
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

  update(deltaTime) {
    for (const id in this.remotePlayers) {
      const p = this.remotePlayers[id];
      // Płynna interpolacja do celu
      p.mesh.position.lerp(p.targetPos, deltaTime * 15);
      p.mesh.quaternion.slerp(p.targetRot, deltaTime * 15);
    }
  }
}