/* PLIK: ui.js */
import * as THREE from 'three';
import { createBaseCharacter } from './character.js';
import { SkinStorage } from './SkinStorage.js';
import { WorldStorage } from './WorldStorage.js';
import { PrefabStorage } from './PrefabStorage.js';
import { HyperCubePartStorage } from './HyperCubePartStorage.js';

import { 
    AUTH_HTML, HUD_HTML, BUILD_UI_HTML, MODALS_HTML, 
    SKIN_DETAILS_HTML, SKIN_COMMENTS_HTML, DISCOVER_CHOICE_HTML, 
    PLAYER_PROFILE_HTML, OTHER_PLAYER_PROFILE_HTML,
    VICTORY_HTML, REWARD_HTML 
} from './UITemplates.js';

import { STORAGE_KEYS } from './Config.js';

import { FriendsManager } from './FriendsManager.js';
import { MailManager } from './MailManager.js';
import { NewsManager } from './NewsManager.js';
import { HighScoresManager } from './HighScoresManager.js';
import { WallManager } from './WallManager.js'; 
import { NavigationManager } from './NavigationManager.js';
import { ShopManager } from './ShopManager.js';

const API_BASE_URL = 'https://hypercubes-nexus-server.onrender.com';

export class UIManager {
  constructor(onSendMessage) {
    this.onSendMessage = onSendMessage;
    this.isMobile = false;
    
    // Callbacki
    this.onWorldSizeSelected = null;
    this.onSkinBuilderClick = null;
    this.onPrefabBuilderClick = null;
    this.onPartBuilderClick = null;
    this.onDiscoverClick = null;
    this.onPlayClick = null;
    this.onPlayerAvatarClick = null;
    this.onToggleFPS = null;
    this.onShopOpen = null;
    this.onBuyBlock = null;
    this.onNameSubmit = null;
    this.onSkinSelect = null; 
    this.onWorldSelect = null; 
    this.onSendPrivateMessage = null;
    this.onMessageSent = null;
    this.onMessageReceived = null;
    this.onEditNexusClick = null;
    this.onEditLoginMapClick = null;
    this.onAddStarterSkinClick = null;
    this.onUsePrefab = null;
    this.onUsePart = null;
    this.onExitParkour = null;
    this.onReplayParkour = null;
    this.onOpenOtherProfile = null;
    this.onVictoryScreenOpen = null;
    
    // Menedżery
    this.friendsManager = new FriendsManager(this);
    this.mailManager = new MailManager(this);
    this.newsManager = new NewsManager(this);
    this.highScoresManager = new HighScoresManager(this);
    this.wallManager = new WallManager(this); 
    this.navigationManager = new NavigationManager(this);
    this.shopManager = new ShopManager(this); 

    this.pendingRewardData = null;
    this.pendingNewsCount = 0;
    this.activeZIndex = 20000; 
    this.myProfileData = null;

    // Renderer
    this.sharedPreviewRenderer = null;
    this.previewScene = null;
    this.previewCamera = null;
    this.previewCharacter = null;
    this.previewAnimId = null;

    this.setupOtherProfileButtons = this.setupOtherProfileButtons.bind(this);
  }
  
  initialize(isMobile) {
    this.isMobile = isMobile;
    try {
        this.renderUI();
        this.initSharedRenderer();

        if (this.friendsManager.initialize) this.friendsManager.initialize();
        if (this.mailManager.initialize) this.mailManager.initialize();
        if (this.newsManager.initialize) this.newsManager.initialize();
        if (this.highScoresManager.init) this.highScoresManager.init();
        if (this.wallManager.initialize) this.wallManager.initialize(); 
        if (this.navigationManager.initialize) this.navigationManager.initialize();
        if (this.shopManager.initialize) this.shopManager.initialize();

        this.setupButtonHandlers();
        this.setupChatSystem(); 
        this.loadFriendsData(); 
        console.log("UI Inicjalizacja zakończona sukcesem.");
    } catch (error) {
        console.error("Błąd UI:", error);
    }
  }

  // --- HELPERY UI ---
  
  showMessage(message, type = 'info') {
      const div = document.createElement('div');
      div.textContent = message;
      
      div.style.position = 'fixed';
      div.style.top = '15%'; 
      div.style.left = '50%';
      div.style.transform = 'translate(-50%, -50%) scale(0.8)';
      div.style.padding = '12px 24px';
      div.style.borderRadius = '12px';
      div.style.color = 'white';
      div.style.fontFamily = "'Titan One', cursive";
      div.style.fontSize = '18px';
      div.style.textShadow = '1.5px 1.5px 0 #000';
      div.style.zIndex = '100000'; 
      div.style.pointerEvents = 'none'; 
      div.style.boxShadow = '0 5px 15px rgba(0,0,0,0.4)';
      div.style.border = '3px solid white';
      div.style.opacity = '0';
      div.style.transition = 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';

      if (type === 'error') {
          div.style.backgroundColor = '#e74c3c'; 
          div.style.borderColor = '#c0392b';
      } else if (type === 'success') {
          div.style.backgroundColor = '#2ecc71'; 
          div.style.borderColor = '#27ae60';
      } else {
          div.style.backgroundColor = '#3498db'; 
          div.style.borderColor = '#2980b9';
      }

      document.body.appendChild(div);

      requestAnimationFrame(() => {
          div.style.opacity = '1';
          div.style.transform = 'translate(-50%, -50%) scale(1)';
          div.style.top = '20%'; 
      });

      setTimeout(() => {
          div.style.opacity = '0';
          div.style.top = '15%'; 
          div.style.transform = 'translate(-50%, -50%) scale(0.8)';
          
          setTimeout(() => {
              if (div.parentNode) div.parentNode.removeChild(div);
          }, 300);
      }, 2500);
  }

  bringToFront(element) {
      if (element) {
          this.activeZIndex++;
          element.style.zIndex = this.activeZIndex;
      }
  }

  // --- RENDEROWANIE HTML ---

  renderUI() {
      const authLayer = document.getElementById('auth-layer');
      const uiLayer = document.getElementById('ui-layer'); 
      const buildContainer = document.getElementById('build-ui-container');
      const modalsLayer = document.getElementById('modals-layer');

      if (authLayer) authLayer.innerHTML = AUTH_HTML;
      if (uiLayer) uiLayer.innerHTML = `<div class="ui-overlay">${HUD_HTML}</div>`;
      if (buildContainer) buildContainer.innerHTML = BUILD_UI_HTML;
      
      if (modalsLayer) {
          modalsLayer.innerHTML = MODALS_HTML + SKIN_DETAILS_HTML + SKIN_COMMENTS_HTML + DISCOVER_CHOICE_HTML + PLAYER_PROFILE_HTML + OTHER_PLAYER_PROFILE_HTML + VICTORY_HTML + REWARD_HTML;
      }
  }

  // --- RENDERER 3D (SINGLETON) ---
  initSharedRenderer() {
      this.sharedPreviewRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
      this.sharedPreviewRenderer.setSize(300, 300);
      this.sharedPreviewRenderer.setPixelRatio(window.devicePixelRatio);

      this.previewScene = new THREE.Scene();
      this.previewCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
      this.previewCamera.position.set(0, 1, 6);
      this.previewCamera.lookAt(0, 0.5, 0);

      const amb = new THREE.AmbientLight(0xffffff, 0.9);
      this.previewScene.add(amb);
      const dir = new THREE.DirectionalLight(0xffffff, 0.6);
      dir.position.set(2, 5, 3);
      this.previewScene.add(dir);

      this.previewCharacter = new THREE.Group();
      if (typeof createBaseCharacter !== 'undefined') {
          createBaseCharacter(this.previewCharacter);
      }
      this.previewScene.add(this.previewCharacter);

      const animate = () => {
          this.previewAnimId = requestAnimationFrame(animate);
          if (this.previewCharacter && this.sharedPreviewRenderer.domElement.parentNode) {
              this.previewCharacter.rotation.y += 0.01;
              this.sharedPreviewRenderer.render(this.previewScene, this.previewCamera);
          }
      };
      animate();
  }

  attachRendererTo(containerId, characterYOffset = 0, scale = 1) {
      const container = document.getElementById(containerId);
      if (!container || !this.sharedPreviewRenderer) return;

      container.innerHTML = '';
      
      const width = container.clientWidth || 300;
      const height = container.clientHeight || 300;
      this.sharedPreviewRenderer.setSize(width, height);
      this.previewCamera.aspect = width / height;
      this.previewCamera.updateProjectionMatrix();

      container.appendChild(this.sharedPreviewRenderer.domElement);

      this.previewCharacter.position.y = characterYOffset;
      this.previewCharacter.scale.setScalar(scale);
      this.previewCharacter.rotation.y = 0;
      
      const children = this.previewCharacter.children;
      for (let i = children.length - 1; i >= 0; i--) {
          const child = children[i];
          if (child.type === 'Group') {
              this.previewCharacter.remove(child);
          }
      }
  }

  applySkinToPreview(blocksData) {
      for (let i = this.previewCharacter.children.length - 1; i >= 0; i--) {
          const child = this.previewCharacter.children[i];
          if (child.type === 'Group') {
              this.previewCharacter.remove(child);
          }
      }

      if (!blocksData) return;

      const loader = new THREE.TextureLoader();
      const blockGroup = new THREE.Group();
      blockGroup.scale.setScalar(0.125);
      blockGroup.position.y = 0.5;

      blocksData.forEach(b => {
          const geo = new THREE.BoxGeometry(1, 1, 1);
          const mat = new THREE.MeshLambertMaterial({ map: loader.load(b.texturePath) });
          const mesh = new THREE.Mesh(geo, mat);
          mesh.position.set(b.x, b.y, b.z);
          blockGroup.add(mesh);
      });
      this.previewCharacter.add(blockGroup);
  }

  disposeCurrentPreview() {
      // Singleton, nie niszczymy renderera, tylko odpinamy
  }

  // --- HUD METHODS ---
  updatePlayerName(name) { 
      const nameDisplay = document.getElementById('player-name-display'); 
      if (nameDisplay) nameDisplay.textContent = name;
      
      if (!this.myProfileData) this.myProfileData = {};
      this.myProfileData.username = name;
  }
  
  updatePlayerAvatar(thumbnail) { 
      const avatarEl = document.querySelector('#player-avatar-button .player-avatar'); 
      if (!avatarEl) return; 
      
      if (!this.myProfileData) this.myProfileData = {};
      this.myProfileData.thumbnail = thumbnail;

      if (thumbnail) { 
          avatarEl.textContent = ''; 
          avatarEl.style.backgroundImage = `url(${thumbnail})`; 
          avatarEl.style.backgroundSize = 'cover'; 
          avatarEl.style.backgroundPosition = 'center'; 
          avatarEl.style.backgroundColor = 'transparent'; 
      } else { 
          avatarEl.style.backgroundImage = 'none'; 
          avatarEl.textContent = '👤'; 
          avatarEl.style.backgroundColor = 'rgba(255,255,255,0.1)'; 
      } 
  }

  updateLevelInfo(level, xp, maxXp) {
      const lvlVal = document.getElementById('level-value');
      const lvlText = document.getElementById('level-text');
      const lvlFill = document.getElementById('level-bar-fill');
      
      if (!this.myProfileData) this.myProfileData = {};
      this.myProfileData.level = level;
      
      if (lvlVal) lvlVal.textContent = level;
      if (lvlText) lvlText.textContent = `${xp}/${maxXp}`;
      if (lvlFill) { 
          const percent = Math.min(100, Math.max(0, (xp / maxXp) * 100)); 
          lvlFill.style.width = `${percent}%`; 
      }
  }

  updateCoinCounter(val) { 
      const e = document.getElementById('coin-value'); 
      if(e) e.textContent = val; 
  }
  
  updateFPSToggleText(e) { 
      const f = document.getElementById('fps-status'); 
      if(f) f.textContent = e ? 'Włączony' : 'Wyłączony'; 
  }

  toggleMobileControls(s) { 
      const m = document.getElementById('mobile-game-controls'); 
      if(m) m.style.display = s ? 'block' : 'none'; 
  }

  updatePendingRewards(count) {
      if (this.newsManager) {
          this.pendingNewsCount = parseInt(count) || 0;
          const badge = document.getElementById('rewards-badge');
          if (badge) {
              if (this.pendingNewsCount > 0) {
                  badge.textContent = this.pendingNewsCount;
                  badge.style.display = 'flex'; 
              } else {
                  badge.style.display = 'none';
              }
          }
      }
  }

  checkAdminPermissions(username) {
      const admins = ['nixox2', 'admin'];
      if (admins.includes(username)) {
          const checkExist = setInterval(() => {
              const grid = document.querySelector('#more-options-panel .nav-grid-container');
              if (grid) {
                  clearInterval(checkExist);
                  
                  if (!document.getElementById('admin-edit-nexus-btn')) {
                       const adminDiv = document.createElement('div');
                       adminDiv.className = 'nav-item';
                       adminDiv.id = 'admin-edit-nexus-btn';
                       adminDiv.innerHTML = `<div class="nav-btn-box" style="filter: hue-rotate(180deg) drop-shadow(0 4px 4px rgba(0,0,0,0.3));"><img src="icons/tworzenie.png" onerror="this.src='icons/icon-build.png'" class="nav-icon"><span class="nav-label">Edytuj Nexus</span></div>`;
                       adminDiv.onclick = () => {
                           this.navigationManager.closePanel('more-options-panel');
                           if (this.onEditNexusClick) this.onEditNexusClick();
                       };
                       grid.insertBefore(adminDiv, grid.firstChild);
                  }

                  if (!document.getElementById('admin-edit-login-map-btn')) {
                      const loginEditDiv = document.createElement('div');
                      loginEditDiv.className = 'nav-item';
                      loginEditDiv.id = 'admin-edit-login-map-btn';
                      loginEditDiv.innerHTML = `<div class="nav-btn-box" style="filter: hue-rotate(280deg) drop-shadow(0 4px 4px rgba(0,0,0,0.3));"><img src="icons/tworzenie.png" onerror="this.src='icons/icon-build.png'" class="nav-icon"><span class="nav-label">Login Map</span></div>`;
                      loginEditDiv.onclick = () => {
                          this.navigationManager.closePanel('more-options-panel');
                          if (this.onEditLoginMapClick) this.onEditLoginMapClick();
                      };
                      grid.insertBefore(loginEditDiv, grid.firstChild);
                 }
        
                 if (!document.getElementById('admin-add-starter-skin-btn')) {
                    const starterSkinDiv = document.createElement('div');
                    starterSkinDiv.className = 'nav-item';
                    starterSkinDiv.id = 'admin-add-starter-skin-btn';
                    starterSkinDiv.innerHTML = `<div class="nav-btn-box" style="filter: hue-rotate(90deg) drop-shadow(0 4px 4px rgba(0,0,0,0.3));"><img src="icons/tworzenie.png" class="nav-icon"><span class="nav-label">Starter Skin</span></div>`;
                    starterSkinDiv.onclick = () => {
                        this.navigationManager.closePanel('more-options-panel');
                        if (this.onAddStarterSkinClick) this.onAddStarterSkinClick();
                    };
                    grid.insertBefore(starterSkinDiv, grid.firstChild);
                }
              }
          }, 500);
      }
  }

  // --- PROFIL INNEGO GRACZA ---
  async openOtherPlayerProfile(username) {
      const myName = localStorage.getItem(STORAGE_KEYS.PLAYER_NAME);
      if (username === myName) {
          this.openPlayerProfile();
          return;
      }

      this.closeAllPanels();
      
      const panel = document.getElementById('other-player-profile-panel');
      if (!panel) return;

      this.bringToFront(panel);
      panel.style.display = 'flex';

      this.attachRendererTo('other-player-preview-canvas', -1.2, 1.5);

      document.getElementById('other-profile-username').textContent = username;
      document.getElementById('other-profile-level').textContent = "...";
      document.getElementById('other-profile-date').textContent = "Ładowanie...";
      const statusDot = document.getElementById('other-profile-status');
      if(statusDot) statusDot.classList.remove('offline'); 

      const t = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
      try {
          const r = await fetch(`${API_BASE_URL}/api/user/profile/${username}`, {
              headers: { 'Authorization': `Bearer ${t}` }
          });
          
          if (r.ok) {
              const user = await r.json();
              const userId = user.id;

              document.getElementById('other-profile-level').textContent = user.level || 1;
              document.getElementById('other-profile-date').textContent = this.formatMemberSince(user.created_at);

              this.updateFriendStatusUI(userId);
              this.setupOtherProfileButtons(userId, username);
              this.loadSkinForPreview(userId);
          } else {
              document.getElementById('other-profile-date').textContent = "Nie znaleziono gracza";
              document.getElementById('other-profile-status').style.display = 'none';
          }
      } catch (e) {
          console.error("Błąd profilu:", e);
          document.getElementById('other-profile-date').textContent = "Błąd sieci";
      }
  }

  updateFriendStatusUI(userId) {
      const { isFriend, isOnline } = this.friendsManager.getFriendStatus(userId);
      const statusDot = document.getElementById('other-profile-status');
      const actionBtn = document.getElementById('btn-other-friend-action');

      if (isFriend) {
          statusDot.style.display = 'block';
          if (isOnline) {
              statusDot.classList.remove('offline'); 
          } else {
              statusDot.classList.add('offline'); 
          }
          
          actionBtn.style.background = 'linear-gradient(to bottom, #e74c3c, #c0392b)';
          actionBtn.innerHTML = '<div style="font-size:30px;">🗑️</div>';
          
          actionBtn.onclick = () => {
              if (confirm("Czy na pewno chcesz usunąć tego gracza ze znajomych?")) {
                  this.friendsManager.removeFriend(userId).then(success => {
                      if (success) {
                          this.updateFriendStatusUI(userId);
                      }
                  });
              }
          };

      } else {
          statusDot.style.display = 'none'; 
          
          actionBtn.style.background = 'linear-gradient(to bottom, #2ecc71, #27ae60)'; 
          actionBtn.innerHTML = '<div style="font-size:30px; font-weight:bold; color:white;">+</div>';
          
          actionBtn.onclick = () => {
              this.friendsManager.sendFriendRequest(userId);
              actionBtn.style.opacity = '0.5';
          };
      }
  }

  async loadSkinForPreview(userId) {
      try {
          const t = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
          const r = await fetch(`${API_BASE_URL}/api/user/${userId}/wall`, { headers: { 'Authorization': `Bearer ${t}` } });
          if (r.ok) {
              const wallData = await r.json();
              if (wallData.skins && wallData.skins.length > 0) {
                  const skinId = wallData.skins[0].id;
                  const blocks = await SkinStorage.loadSkinData(skinId);
                  this.applySkinToPreview(blocks);
              }
          }
      } catch (e) { console.error(e); }
  }

  // --- PODPIĘCIE PRZYCISKÓW W PROFILU ---
  setupOtherProfileButtons(userId, username) {
      const btnWall = document.getElementById('btn-other-wall');
      if (btnWall) {
          btnWall.onclick = () => {
              document.getElementById('other-player-profile-panel').style.display = 'none';
              this.disposeCurrentPreview();
              this.wallManager.open(userId, username);
          };
      }

      const btnChat = document.getElementById('btn-other-chat');
      if (btnChat) {
          btnChat.onclick = () => {
              document.getElementById('other-player-profile-panel').style.display = 'none';
              this.disposeCurrentPreview();
              this.mailManager.open();
              this.mailManager.openConversation(username);
          };
      }
      
      const btnClose = document.getElementById('btn-other-profile-close');
      if(btnClose) {
          btnClose.onclick = () => {
              document.getElementById('other-player-profile-panel').style.display = 'none';
              this.disposeCurrentPreview();
          };
      }

      const btnSmile = document.getElementById('btn-other-smile');
      if (btnSmile) {
          btnSmile.onclick = async () => {
              const t = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
              if (!t) return;
              
              btnSmile.style.transform = 'scale(0.95)';
              setTimeout(() => btnSmile.style.transform = 'scale(1)', 100);

              try {
                  const r = await fetch(`${API_BASE_URL}/api/user/${userId}/smile`, {
                      method: 'POST',
                      headers: { 'Authorization': `Bearer ${t}` }
                  });
                  const d = await r.json();
                  
                  if (r.ok) {
                      this.showMessage("Wysłano uśmiech!", "success");
                  } else {
                      this.showMessage(d.message || "Błąd wysyłania.", "error");
                  }
              } catch (e) {
                  this.showMessage("Błąd sieci.", "error");
              }
          };
      }
  }

  // --- WŁASNY PROFIL ---
  async openPlayerProfile() {
      const panel = document.getElementById('player-profile-panel');
      if (!panel) return;
      
      this.bringToFront(panel);
      panel.style.display = 'flex';

      this.attachRendererTo('profile-preview-canvas', -1, 1.5);

      const nameEl = document.getElementById('profile-username');
      const lvlEl = document.getElementById('profile-level-val');
      const dateEl = document.getElementById('profile-joined-date');

      if (this.myProfileData) {
          if(nameEl) nameEl.textContent = this.myProfileData.username || "PLAYER";
          if(lvlEl) lvlEl.textContent = this.myProfileData.level || 1;
      }
      
      const t = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
      if(t) {
          try {
              const r = await fetch(`${API_BASE_URL}/api/user/me`, { headers: { 'Authorization': `Bearer ${t}` } });
              const d = await r.json();
              if (d && d.user && d.user.created_at && dateEl) {
                  dateEl.textContent = this.formatMemberSince(d.user.created_at);
              }
          } catch(e) { console.error(e); }
      }

      const skinId = SkinStorage.getLastUsedSkinId();
      if (skinId) {
          const blocks = await SkinStorage.loadSkinData(skinId);
          this.applySkinToPreview(blocks);
      }
  }

  // --- SKIN DETAILS ---
  async showItemDetails(item, type, keepOpen = false) { 
      const modal = document.getElementById('skin-details-modal'); 
      if (!modal) return; 
      
      this.currentDetailsId = item.id; 
      this.currentDetailsType = type; 
      
      this.bringToFront(modal); 
      if (!keepOpen) this.closeAllPanels();
      modal.style.display = 'flex';

      const headerName = modal.querySelector('.skin-name-header'); 
      const creatorName = modal.querySelector('.skin-creator-name'); 
      const creatorLevel = modal.querySelector('.skin-creator-level-val'); 
      const likesCount = modal.querySelector('.skin-likes-count'); 
      const timeInfo = modal.querySelector('.skin-time-info'); 
      const btnUse = document.getElementById('skin-btn-use'); 
      const btnLike = document.getElementById('skin-btn-like'); 
      const btnComment = document.getElementById('skin-btn-comment'); 
      
      if(headerName) headerName.textContent = item.name; 
      if(creatorName) creatorName.textContent = item.creator || "Nieznany"; 
      if(creatorLevel) creatorLevel.textContent = item.creatorLevel || "?"; 
      if(likesCount) likesCount.textContent = item.likes || "0"; 
      if(timeInfo) { let dateStr = "niedawno"; if (item.created_at) { const date = new Date(item.created_at); if (!isNaN(date.getTime())) { const now = new Date(); const diffDays = Math.floor(Math.abs(now - date) / (1000 * 60 * 60 * 24)); dateStr = diffDays === 0 ? "dzisiaj" : `${diffDays} dni temu`; } } timeInfo.textContent = dateStr; } 
      if (btnComment) { const countSpan = btnComment.querySelector('.skin-btn-label'); if(countSpan) countSpan.textContent = item.comments || "0"; btnComment.onclick = () => { this.openItemComments(item.id, type); }; } 
      
      const myId = parseInt(localStorage.getItem(STORAGE_KEYS.USER_ID) || "0"); 
      const isOwner = item.owner_id === myId; 
      
      if (btnUse) { 
          btnUse.style.display = 'flex'; 
          if (type === 'skin') { 
              if (isOwner) { 
                  btnUse.onclick = () => { 
                      this.closeAllPanels(); 
                      if (this.onSkinSelect) this.onSkinSelect(item.id, item.name, item.thumbnail, item.owner_id); 
                  }; 
              } else { btnUse.style.display = 'none'; } 
          } else if (type === 'part') { 
              btnUse.onclick = () => { this.closeAllPanels(); if (this.onUsePart) this.onUsePart(item); }; 
          } else if (type === 'prefab') { 
              btnUse.onclick = () => { this.closeAllPanels(); if (this.onUsePrefab) this.onUsePrefab(item); }; 
          } 
      }
      
      if (btnLike) { 
          btnLike.onclick = null; 
          btnLike.onclick = async () => { 
              const t = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN); 
              if(!t) return; 
              try { 
                  const endpointType = type === 'skin' ? 'skins' : (type === 'part' ? 'parts' : 'prefabs'); 
                  const r = await fetch(`${API_BASE_URL}/api/${endpointType}/${item.id}/like`, { 
                      method: 'POST', headers: { 'Authorization': `Bearer ${t}` } 
                  }); 
                  const d = await r.json(); 
                  if (d.success && likesCount) likesCount.textContent = d.likes; 
              } catch(e) { console.error(e); } 
          }; 
      } 

      this.attachRendererTo('skin-preview-canvas', type === 'skin' ? -0.8 : 0, 1.5);

      let blocksData = null; 
      if (type === 'skin') blocksData = await SkinStorage.loadSkinData(item.id); 
      else if (type === 'prefab') blocksData = await PrefabStorage.loadPrefab(item.id); 
      else if (type === 'part') blocksData = await HyperCubePartStorage.loadPart(item.id); 
      
      this.applySkinToPreview(blocksData);
  }

  // --- CZAT ---
  setupChatSystem() { this.setupChatInput(); }
  
  addChatMessage(m, senderName = null) { 
      const c = document.querySelector('.chat-area'); 
      if(c) { 
          const el = document.createElement('div'); 
          el.className = 'chat-message text-outline'; 
          if (senderName && m.startsWith(senderName)) {
               const parts = m.split(':');
               const nick = parts[0];
               const rest = parts.slice(1).join(':');
               const nickSpan = document.createElement('span');
               nickSpan.textContent = nick;
               nickSpan.style.cursor = 'pointer';
               nickSpan.style.color = '#f1c40f'; 
               nickSpan.style.textDecoration = 'underline';
               nickSpan.onclick = () => this.openOtherPlayerProfile(nick);
               el.appendChild(nickSpan);
               el.appendChild(document.createTextNode(':' + rest));
          } else { el.textContent = m; }
          c.appendChild(el); c.scrollTop = c.scrollHeight; 
      } 
  }

  clearChat() { const c = document.querySelector('.chat-area'); if(c) c.innerHTML = ''; }
  handleChatClick() { const f=document.getElementById('chat-form'); if(f) f.style.display='flex'; document.getElementById('chat-input-field').focus(); }
  setupChatInput() { const f=document.getElementById('chat-form'); if(!f)return; f.addEventListener('submit', e=>{ e.preventDefault(); const i=document.getElementById('chat-input-field'); const v=i.value.trim(); if(v&&this.onSendMessage) this.onSendMessage(v); i.value=''; f.style.display='none'; }); }

  // --- PARKOUR LOGIC ---
  
  setParkourTimerVisible(visible) {
      const timer = document.getElementById('parkour-timer');
      if (timer) timer.style.display = visible ? 'block' : 'none';
  }
  
  updateParkourTimer(timeString) {
      const timer = document.getElementById('parkour-timer');
      if (timer) timer.textContent = timeString;
  }

  handleParkourCompletion(timeStr, rewardData) {
      if (this.onVictoryScreenOpen) this.onVictoryScreenOpen();

      const victoryScreen = document.getElementById('bsp-victory-screen');
      if (victoryScreen) {
          this.bringToFront(victoryScreen);
          victoryScreen.style.display = 'flex';

          if (rewardData && rewardData.records) {
              document.getElementById('bsp-run-time').textContent = rewardData.records.formattedTime;
              document.getElementById('bsp-rec-all').textContent = rewardData.records.allTime;
              document.getElementById('bsp-rec-day').textContent = rewardData.records.daily;
              document.getElementById('bsp-rec-personal').textContent = rewardData.records.personal;
              
              const badge = document.getElementById('bsp-new-record-badge');
              if (badge) badge.style.display = rewardData.records.isNewPb ? 'block' : 'none';
          } else {
              document.getElementById('bsp-run-time').textContent = timeStr;
          }
          
          if (rewardData && rewardData.map) {
               document.getElementById('bsp-map-name').textContent = rewardData.map.name;
               if (rewardData.map.thumbnail) {
                   document.getElementById('bsp-map-thumb').style.backgroundImage = `url(${rewardData.map.thumbnail})`;
               }
          }

          const contBtn = document.getElementById('bsp-continue-btn');
          contBtn.onclick = () => {
              victoryScreen.style.display = 'none';
              this.showRewardScreen(rewardData);
          };
      }
      
      this.pendingRewardData = rewardData;
  }

  showRewardScreen(rewardData) {
      const rewardScreen = document.getElementById('bsp-reward-screen');
      if (!rewardScreen) return;

      this.bringToFront(rewardScreen);
      rewardScreen.style.display = 'flex';

      if (rewardData) {
          document.getElementById('bsp-rew-xp').textContent = rewardData.rewards.standard.xp;
          document.getElementById('bsp-rew-coins').textContent = rewardData.rewards.standard.coins;
          document.getElementById('bsp-vip-xp').textContent = rewardData.rewards.vip.xp;
          document.getElementById('bsp-vip-coins').textContent = rewardData.rewards.vip.coins;

          const lvl = rewardData.newLevel;
          const xp = rewardData.newXp;
          const max = rewardData.maxXp;
          
          document.getElementById('bsp-lvl-cur').textContent = lvl;
          document.getElementById('bsp-lvl-next').textContent = lvl + 1;
          document.getElementById('bsp-xp-text').textContent = `${xp}/${max}`;
          
          setTimeout(() => {
              const percent = Math.min(100, Math.max(0, (xp / max) * 100));
              document.getElementById('bsp-xp-fill').style.width = `${percent}%`;
          }, 100);
          
          this.updateCoinCounter(rewardData.newCoins);
          this.updateLevelInfo(lvl, xp, max);
      }
      
      document.getElementById('bsp-btn-home').onclick = () => {
          rewardScreen.style.display = 'none';
          if (this.onExitParkour) this.onExitParkour();
      };
      
      document.getElementById('bsp-btn-replay').onclick = () => {
          rewardScreen.style.display = 'none';
          if (this.onReplayParkour) this.onReplayParkour();
      };
      
      document.getElementById('bsp-btn-next').onclick = () => {
          rewardScreen.style.display = 'none';
          if (this.onExitParkour) this.onExitParkour();
      };
  }

  hideVictory() { 
      ['bsp-victory-screen','bsp-reward-screen','victory-panel','reward-panel'].forEach(id=>{ const e=document.getElementById(id); if(e)e.style.display='none'; }); 
      this.pendingRewardData=null; 
  }

  // --- ODKRYJ (HELPERY) ---
  bindDiscoverButton(id, type) {
      const btn = document.getElementById(id);
      if(btn) {
           btn.onclick = () => {
               btn.style.transform = 'scale(0.95)';
               setTimeout(() => btn.style.transform = 'scale(1)', 100);
               this.closePanel('discover-choice-panel');
               
               if (type === 'skin') this.showDiscoverPanel('discovery', 'skin');
               else if (type === 'world') this.showDiscoverPanel('worlds');
               else if (type === 'part') this.showDiscoverPanel('discovery', 'part');
               else if (type === 'prefab') this.showDiscoverPanel('discovery', 'prefab');
               else this.showMessage("Ta sekcja pojawi się wkrótce!", "info");
           };
       }
  }

  setupButtonHandlers() {
      document.querySelectorAll('.panel-close-button').forEach(btn => {
          btn.onclick = () => { 
              const p = btn.closest('.panel-modal') || btn.closest('#skin-comments-panel'); 
              if(p) p.style.display = 'none'; 
              if(p && (p.id === 'skin-details-modal' || p.id === 'player-profile-panel' || p.id === 'other-player-profile-panel')) this.disposeCurrentPreview();
          };
      });
      ['more-options-panel','player-profile-panel','play-choice-panel','build-choice-panel','other-player-profile-panel'].forEach(id=>{
          const e=document.getElementById(id); if(e) e.addEventListener('click', ev=>{ if(ev.target.id===id){ e.style.display='none'; if(id.includes('profile')) this.disposeCurrentPreview(); } });
      });
      document.querySelectorAll('.game-btn').forEach(btn => { const t=this.getButtonType(btn); btn.onclick=()=>this.handleButtonClick(t, btn); });
      
      // Bindowanie przycisków ODKRYJ
      this.bindDiscoverButton('btn-disc-blockstars', 'skin');
      this.bindDiscoverButton('btn-disc-worlds', 'world');
      this.bindDiscoverButton('btn-disc-parts', 'part');
      this.bindDiscoverButton('btn-disc-prefabs', 'prefab');
      this.bindDiscoverButton('btn-disc-photos', 'photo');
      this.bindDiscoverButton('btn-disc-homes', 'home');

      const pBtn = document.getElementById('player-avatar-button'); if (pBtn) pBtn.onclick = () => { this.openPlayerProfile(); };
      const friendsBtn = document.getElementById('btn-friends-open'); if (friendsBtn) friendsBtn.onclick = () => { this.friendsManager.open(); }; 
      const topBarItems = document.querySelectorAll('.top-bar-item'); topBarItems.forEach(item => { if (item.textContent.includes('Poczta')) { item.onclick = () => { this.mailManager.open(); }; } });
      const chatToggle = document.getElementById('chat-toggle-button'); if (chatToggle) chatToggle.addEventListener('click', () => this.handleChatClick());
      
      const setClick = (id, fn) => { const el = document.getElementById(id); if(el) el.onclick = fn; }; 
      setClick('size-choice-new-small', () => { this.closePanel('world-size-panel'); if(this.onWorldSizeSelected) this.onWorldSizeSelected(64); }); 
      setClick('size-choice-new-medium', () => { this.closePanel('world-size-panel'); if(this.onWorldSizeSelected) this.onWorldSizeSelected(128); }); 
      setClick('size-choice-new-large', () => { this.closePanel('world-size-panel'); if(this.onWorldSizeSelected) this.onWorldSizeSelected(256); });
      setClick('name-submit-btn', () => { const i=document.getElementById('name-input-field'); const v=i.value.trim(); if(v&&this.onNameSubmit){ this.onNameSubmit(v); document.getElementById('name-input-panel').style.display='none'; } else alert('Nazwa!'); });
      setClick('btn-open-news', () => { this.newsManager.open(); });
      setClick('btn-open-highscores', () => { this.highScoresManager.open(); });
      setClick('btn-nav-options', () => { if(this.onToggleFPS) { this.onToggleFPS(); this.showMessage("Przełączono FPS", "info"); } });
      setClick('logout-btn', () => { localStorage.removeItem(STORAGE_KEYS.JWT_TOKEN); window.location.reload(); });
      setClick('btn-news-claim-all', () => { this.claimReward(null); });
  }

  getButtonType(b) { if(b.classList.contains('btn-zagraj')) return 'zagraj'; if(b.classList.contains('btn-buduj')) return 'buduj'; if(b.classList.contains('btn-kup')) return 'kup'; if(b.classList.contains('btn-odkryj')) return 'odkryj'; if(b.classList.contains('btn-wiecej')) return 'wiecej'; return 'unknown'; }
  handleButtonClick(t, b) { 
      b.style.transform='translateY(-1px) scale(0.95)'; setTimeout(()=>b.style.transform='', 150);
      if(t==='zagraj') this.navigationManager.openPanel('play-choice-panel');
      if(t==='buduj') this.navigationManager.openPanel('build-choice-panel');
      if(t==='odkryj') this.openPanel('discover-choice-panel');
      if(t==='wiecej') this.navigationManager.openPanel('more-options-panel');
      if(t==='kup' && this.onShopOpen) this.onShopOpen();
  }

  loadFriendsData() { this.friendsManager.loadFriendsData(); }
  refreshSkinList(m) { this.refreshDiscoveryList('skin', m); }
  openPanel(id) { const p=document.getElementById(id); if(p){ this.bringToFront(p); p.style.display='flex'; if(id==='friends-panel') this.friendsManager.loadFriendsData(); } }
  closePanel(id) { const p=document.getElementById(id); if(p) p.style.display='none'; }
  closeAllPanels() { this.disposeCurrentPreview(); document.querySelectorAll('.panel-modal').forEach(p=>p.style.display='none'); this.newsManager.close(); this.mailManager.close(); this.friendsManager.close(); this.highScoresManager.close(); this.wallManager.close(); this.shopManager.close(); }
  populateShop(b, c) { this.shopManager.open(b, c); }
  formatMemberSince(dateString) { const date = dateString ? new Date(dateString) : new Date(); const monthNames = ["sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"]; return `Członek od ${monthNames[date.getMonth()]}, ${date.getFullYear()}`; }
  showRewardPanel(data = null) { this.showRewardScreen(data); }
}
