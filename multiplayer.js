import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js'; // Import do łączenia geometrii
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
    this.remotePlayers = {}; // { id: { mesh, targetPos, targetRot } }
    this.ws = null;
    this.myId = null;
    
    this.onMessageSent = null;
    this.onMessageReceived = null;

    this.lastSentPosition = new THREE.Vector3();
    this.lastSentQuaternion = new THREE.Quaternion();
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

    this.uiManager.addChatMessage('<Łączenie z serwerem...>');

    try {
      this.ws = new WebSocket(serverUrl);
      
      this.ws.onopen = () => {
        console.log('WS: Połączono!');
        this.uiManager.addChatMessage('<Połączono!>');

        const skinName = SkinStorage.getLastUsedSkinId(); // Poprawka: pobieramy ID, logika w SkinStorage
        const skinData = skinName ? SkinStorage.loadSkinData(skinName) : null; // To wymagałoby zmiany w SkinStorage by działało synchronicznie, 
        // ale w obecnej architekturze wysyłamy to co mamy w pamięci lub null, serwer i tak ogarnia.
        // UWAGA: W oryginalnym kodzie SkinStorage.loadSkinData jest async. 
        // Tutaj dla uproszczenia zakładamy, że skin zostanie dosłany później lub pobrany,
        // lub wysyłamy pusty, a gracz zaktualizuje go sam.
        // W idealnym świecie: await SkinStorage.loadSkinData(...) przed wysłaniem.
        
        this.ws.send(JSON.stringify({ 
            type: 'playerReady', 
            skinData: null // Skin wyślemy osobno lub po załadowaniu
        }));
        
        // Jeśli mamy zapisany skin, pobierz go i wyślij aktualizację
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

  joinWorld(worldId) {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          console.log(`Dołączanie do pokoju: ${worldId || 'nexus'}`);
          
          this.ws.send(JSON.stringify({
              type: 'joinWorld',
              worldId: worldId 
          }));

          // Czyścimy lokalnie od razu, żeby nie było duchów
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
        const name = msg.nickname || msg.username || "Gracz";
        this.uiManager.addChatMessage(`<${name} dołączył>`);
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
        this.displayChatBubble(msg.id, msg.text);
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

  sendMyPosition(position, quaternion) {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          if (position.distanceTo(this.lastSentPosition) > 0.01 || 
              Math.abs(quaternion.x - this.lastSentQuaternion.x) > 0.01) {
              
              this.ws.send(JSON.stringify({
                  type: 'playerMove', 
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

  // --- OPTYMALIZACJA: ŁĄCZENIE GEOMETRII SKINA ---
  createRemotePlayer(data) {
    if (data.id === this.myId) return; 

    // Usuń starego gracza (ducha), jeśli istnieje
    if (this.remotePlayers[data.id]) {
        this.removeRemotePlayer(data.id);
    }

    const group = new THREE.Group();
    
    // Dodaj nogi (baza)
    createBaseCharacter(group);

    // Renderowanie skina (klocków)
    if (data.skinData && Array.isArray(data.skinData) && data.skinData.length > 0) {
        const skinContainer = new THREE.Group();
        skinContainer.scale.setScalar(0.125);
        skinContainer.position.y = 0.5;

        // 1. Grupowanie geometrii według tekstury
        const geometriesByTexture = {};

        data.skinData.forEach(block => {
            if (!block.texturePath) return;

            if (!geometriesByTexture[block.texturePath]) {
                geometriesByTexture[block.texturePath] = [];
            }

            // Tworzymy geometrię dla pojedynczego klocka
            const geometry = new THREE.BoxGeometry(1, 1, 1);
            // Przesuwamy ją na odpowiednią pozycję
            geometry.translate(block.x, block.y, block.z);
            
            geometriesByTexture[block.texturePath].push(geometry);
        });

        // 2. Scalanie geometrii i tworzenie Meshów
        for (const [texturePath, geometries] of Object.entries(geometriesByTexture)) {
            if (geometries.length === 0) continue;

            // Scalamy wszystkie geometrie o tej samej teksturze w jedną
            const mergedGeometry = BufferGeometryUtils.mergeGeometries(geometries);
            
            // Pobieramy materiał z cache
            let material = this.materialsCache[texturePath];
            if (!material) {
                const tex = this.textureLoader.load(texturePath);
                tex.magFilter = THREE.NearestFilter;
                tex.minFilter = THREE.NearestFilter;
                material = new THREE.MeshLambertMaterial({ map: tex });
                this.materialsCache[texturePath] = material;
            }

            const mesh = new THREE.Mesh(mergedGeometry, material);
            mesh.castShadow = true;
            skinContainer.add(mesh);
            
            // Czyszczenie geometrii składowych nie jest konieczne, bo BufferGeometryUtils tworzy nową,
            // ale warto zadbać o pamięć jeśli to możliwe. Garbage Collector powinien to obsłużyć.
        }

        group.add(skinContainer);
    }

    // Ustawienie pozycji początkowej
    if (data.position) {
        group.position.set(data.position.x, data.position.y, data.position.z);
    } else if (data.x !== undefined) {
        group.position.set(data.x, data.y, data.z);
    }

    if (data.quaternion) {
        group.quaternion.set(data.quaternion._x, data.quaternion._y, data.quaternion._z, data.quaternion._w);
    } else if (data.qx !== undefined) {
        group.quaternion.set(data.qx, data.qy, data.qz, data.qw);
    }

    // Nickname nad głową
    const div = document.createElement('div');
    div.className = 'text-outline';
    div.textContent = data.nickname || data.username || "Gracz";
    div.style.color = 'white';
    div.style.fontSize = '14px';
    div.style.fontWeight = 'bold';
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
          
          // Czyszczenie pamięci
          p.mesh.traverse(child => {
              if (child.isMesh) {
                  if(child.geometry) child.geometry.dispose();
                  // Materiały zostawiamy w cache
              }
          });
          
          delete this.remotePlayers[id];
      }
  }
  
  removeAllRemotePlayers() {
      Object.keys(this.remotePlayers).forEach(id => {
          this.removeRemotePlayer(id);
      });
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
      // Interpolacja ruchu (wygładzanie)
      p.mesh.position.lerp(p.targetPos, deltaTime * 15);
      p.mesh.quaternion.slerp(p.targetRot, deltaTime * 15);
    }
  }
}