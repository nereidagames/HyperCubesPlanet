import * as THREE from 'three';
import { createBaseCharacter } from './character.js';
import { SkinStorage } from './SkinStorage.js';
import { WorldStorage } from './WorldStorage.js';
import { PrefabStorage } from './PrefabStorage.js';
import { HyperCubePartStorage } from './HyperCubePartStorage.js';

// Import szablonów
import { AUTH_HTML, HUD_HTML, BUILD_UI_HTML, MODALS_HTML, SKIN_DETAILS_HTML, SKIN_COMMENTS_HTML, DISCOVER_CHOICE_HTML, NEWS_MODAL_HTML, MAIL_MODAL_HTML, FRIENDS_MODAL_HTML, PLAYER_PROFILE_HTML } from './UITemplates.js';
import { STORAGE_KEYS } from './Config.js';

// Import Menedżerów
import { FriendsManager } from './FriendsManager.js';
import { MailManager } from './MailManager.js';
import { NewsManager } from './NewsManager.js';
import { HighScoresManager } from './HighScoresManager.js';

const API_BASE_URL = 'https://hypercubes-nexus-server.onrender.com';

export class UIManager {
  constructor(onSendMessage) {
    this.onSendMessage = onSendMessage;
    this.isMobile = false;
    
    // Callbacki Główne
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
    this.onUsePrefab = null;
    this.onUsePart = null;
    this.onExitParkour = null;
    this.onReplayParkour = null;
    
    // Inicjalizacja Pod-Menedżerów
    this.friendsManager = new FriendsManager(this);
    this.mailManager = new MailManager(this);
    this.newsManager = new NewsManager(this);
    this.highScoresManager = new HighScoresManager(this);

    // Stan lokalny
    this.shopCurrentCategory = 'block'; 
    this.allShopItems = [];
    this.shopIsOwnedCallback = null;
    
    this.pendingRewardData = null;
    this.pendingNewsCount = 0;

    this.skinPreviewRenderer = null;
    this.skinPreviewScene = null;
    this.skinPreviewCamera = null;
    this.skinPreviewCharacter = null;
    this.skinPreviewAnimId = null;
    
    this.currentDetailsId = null;
    this.currentDetailsType = 'skin';
    
    this.activeZIndex = 20000; 
    
    // Cache danych gracza (do profilu)
    this.myProfileData = null;
  }
  
  initialize(isMobile) {
    this.isMobile = isMobile;
    console.log("Inicjalizacja UI...");
    try {
        this.renderUI();
        
        // Inicjalizacja menedżerów
        if (this.friendsManager.initialize) this.friendsManager.initialize();
        if (this.mailManager.initialize) this.mailManager.initialize();
        if (this.newsManager.initialize) this.newsManager.initialize();
        if (this.highScoresManager.init) this.highScoresManager.init();

        this.setupButtonHandlers();
        this.setupChatSystem(); 
        this.loadFriendsData(); 
        
        console.log('UI Manager zainicjalizowany pomyślnie.');
    } catch (error) {
        console.error("Błąd podczas inicjalizacji UI:", error);
    }
  }

  renderUI() {
      const authLayer = document.getElementById('auth-layer');
      const uiLayer = document.getElementById('ui-layer'); 
      const buildContainer = document.getElementById('build-ui-container');
      const modalsLayer = document.getElementById('modals-layer');

      if (authLayer) authLayer.innerHTML = AUTH_HTML;
      if (uiLayer) uiLayer.innerHTML = `<div class="ui-overlay">${HUD_HTML}</div>`;
      if (buildContainer) buildContainer.innerHTML = BUILD_UI_HTML;
      
      if (modalsLayer) {
          modalsLayer.innerHTML = MODALS_HTML + SKIN_DETAILS_HTML + SKIN_COMMENTS_HTML + DISCOVER_CHOICE_HTML + NEWS_MODAL_HTML + MAIL_MODAL_HTML + FRIENDS_MODAL_HTML + PLAYER_PROFILE_HTML;
      }
  }

  // --- HELPERS ---
  bringToFront(element) {
      if (element) {
          this.activeZIndex++;
          element.style.zIndex = this.activeZIndex;
      }
  }

  showMessage(text, type='info') {
      const m = document.createElement('div');
      m.style.cssText = `position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:${type==='success'?'#27ae60':(type==='error'?'#e74c3c':'#3498db')};color:white;padding:15px 25px;border-radius:10px;font-weight:bold;z-index:99999;box-shadow:0 6px 12px rgba(0,0,0,0.4);opacity:0;transition:all 0.3s ease; text-align:center; min-width: 200px; pointer-events: none;`;
      m.classList.add('text-outline');
      m.textContent = text;
      document.body.appendChild(m);
      setTimeout(() => { m.style.opacity = '1'; m.style.transform = 'translate(-50%, -50%) translateY(-10px)'; }, 10);
      setTimeout(() => { m.style.opacity = '0'; setTimeout(() => { if(m.parentNode) m.parentNode.removeChild(m); }, 300); }, 2500);
  }

  // --- HUD UPDATES ---
  updateLevelInfo(level, xp, maxXp) {
      const lvlVal = document.getElementById('level-value');
      const lvlText = document.getElementById('level-text');
      const lvlFill = document.getElementById('level-bar-fill');
      
      if (!this.myProfileData) this.myProfileData = {};
      this.myProfileData.level = level;
      
      if (lvlVal) lvlVal.textContent = level;
      if (lvlText) lvlText.textContent = `${xp}/${maxXp}`;
      if (lvlFill) { const percent = Math.min(100, Math.max(0, (xp / maxXp) * 100)); lvlFill.style.width = `${percent}%`; }
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

  // --- PLAYER & ADMIN ---
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
          avatarEl.style.backgroundColor = '#4a90e2'; 
      } else { 
          avatarEl.style.backgroundImage = 'none'; 
          avatarEl.textContent = '👤'; 
      } 
  }

  formatMemberSince(dateString) {
      const date = dateString ? new Date(dateString) : new Date();
      const monthNames = ["sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"];
      return `Członek od ${monthNames[date.getMonth()]}, ${date.getFullYear()}`;
  }

  async openPlayerProfile() {
      const panel = document.getElementById('player-profile-panel');
      if (!panel) return;
      
      this.bringToFront(panel);
      panel.style.display = 'flex';

      const nameEl = document.getElementById('profile-username');
      const lvlEl = document.getElementById('profile-level-val');
      const dateEl = document.getElementById('profile-joined-date');
      const canvasContainer = document.getElementById('profile-preview-canvas');

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

      this.init3DPreviewForProfile(canvasContainer);
  }

  async init3DPreviewForProfile(container) {
      if (!container) return;
      if (this.skinPreviewAnimId) cancelAnimationFrame(this.skinPreviewAnimId);
      container.innerHTML = '';
      
      const width = container.clientWidth;
      const height = container.clientHeight;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
      camera.position.set(0, 1, 5);
      camera.lookAt(0, 0, 0);

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(width, height);
      container.appendChild(renderer.domElement);

      const amb = new THREE.AmbientLight(0xffffff, 0.9);
      scene.add(amb);
      const dir = new THREE.DirectionalLight(0xffffff, 0.5);
      dir.position.set(2, 5, 3);
      scene.add(dir);

      const character = new THREE.Group();
      createBaseCharacter(character);
      character.position.y = -1; 
      scene.add(character);

      const skinId = SkinStorage.getLastUsedSkinId();
      if (skinId) {
          const blocks = await SkinStorage.loadSkinData(skinId);
          if (blocks) {
             const loader = new THREE.TextureLoader();
             const blockGroup = new THREE.Group();
             blockGroup.scale.setScalar(0.125);
             blockGroup.position.y = 0.5;
             
             blocks.forEach(b => {
                 const geo = new THREE.BoxGeometry(1, 1, 1);
                 const mat = new THREE.MeshLambertMaterial({ map: loader.load(b.texturePath) });
                 const mesh = new THREE.Mesh(geo, mat);
                 mesh.position.set(b.x, b.y, b.z);
                 blockGroup.add(mesh);
             });
             character.add(blockGroup);
          }
      }
      
      const animate = () => {
          this.skinPreviewAnimId = requestAnimationFrame(animate);
          character.rotation.y += 0.01;
          renderer.render(scene, camera);
      };
      animate();
  }
  
  checkAdminPermissions(username) {
      const admins = ['nixox2', 'admin'];
      if (admins.includes(username)) {
          const grid = document.querySelector('#more-options-panel .nav-grid-container');
          if (grid && !document.getElementById('admin-edit-nexus-btn')) {
               const adminDiv = document.createElement('div');
               adminDiv.className = 'nav-item';
               adminDiv.id = 'admin-edit-nexus-btn';
               adminDiv.innerHTML = `
                  <div class="nav-btn-box" style="filter: hue-rotate(180deg) drop-shadow(0 4px 4px rgba(0,0,0,0.3));">
                      <img src="icons/tworzenie.png" onerror="this.src='icons/icon-build.png'" class="nav-icon">
                      <span class="nav-label">Admin</span>
                  </div>
               `;
               adminDiv.onclick = () => {
                   this.closePanel('more-options-panel');
                   if (this.onEditNexusClick) this.onEditNexusClick();
               };
               grid.insertBefore(adminDiv, grid.firstChild);
          }
      }
  }

  // --- GLOBAL CHAT (HUD) ---
  setupChatSystem() { this.setupChatInput(); }
  addChatMessage(m) { const c=document.querySelector('.chat-area'); if(c) { const el=document.createElement('div'); el.className='chat-message text-outline'; el.textContent=m; c.appendChild(el); c.scrollTop=c.scrollHeight; } }
  clearChat() { const c = document.querySelector('.chat-area'); if(c) c.innerHTML = ''; }
  handleChatClick() { const f=document.getElementById('chat-form'); if(f) f.style.display='flex'; const i=document.getElementById('chat-input-field'); if(i) i.focus(); }
  setupChatInput() { const f=document.getElementById('chat-form'); if(!f)return; f.addEventListener('submit', e=>{ e.preventDefault(); const i=document.getElementById('chat-input-field'); const v=i.value.trim(); if(v&&this.onSendMessage) this.onSendMessage(v); i.value=''; f.style.display='none'; }); }

  // --- BUTTON HANDLERS ---
  setupButtonHandlers() {
    // Zamknięcie paneli (w tym nowego profilu)
    document.querySelectorAll('.panel-close-button').forEach(btn => {
        btn.onclick = () => { 
            const p = btn.closest('.panel-modal') || btn.closest('#skin-comments-panel'); 
            if(p) p.style.display = 'none'; 
            if(p && p.id === 'skin-details-modal' && this.skinPreviewAnimId) cancelAnimationFrame(this.skinPreviewAnimId);
            if(p && p.id === 'player-profile-panel' && this.skinPreviewAnimId) cancelAnimationFrame(this.skinPreviewAnimId);
        };
    });
    
    // Kliknięcie w tło zamyka panel "Więcej"
    const moreOptions = document.getElementById('more-options-panel');
    if (moreOptions) {
        moreOptions.addEventListener('click', (e) => {
            if (e.target.id === 'more-options-panel') {
                e.target.style.display = 'none';
            }
        });
    }

    // FIX: Kliknięcie w tło zamyka "Profil Gracza"
    const profilePanel = document.getElementById('player-profile-panel');
    if (profilePanel) {
        profilePanel.addEventListener('click', (e) => {
            // Zamknij tylko jeśli kliknięto w ciemne tło, a nie w samą kartę profilu
            if (e.target.id === 'player-profile-panel') {
                profilePanel.style.display = 'none';
                if (this.skinPreviewAnimId) cancelAnimationFrame(this.skinPreviewAnimId);
            }
        });
    }
    
    // Główne przyciski gry
    document.querySelectorAll('.game-btn').forEach(button => {
      const type = this.getButtonType(button);
      button.addEventListener('click', () => this.handleButtonClick(type, button));
    });

    // Avatar -> Nowy Profil
    const pBtn = document.getElementById('player-avatar-button'); 
    if (pBtn) pBtn.onclick = () => { 
        this.openPlayerProfile(); 
    };
    
    // Przyjaciele
    const friendsBtn = document.getElementById('btn-friends-open'); 
    if (friendsBtn) friendsBtn.onclick = () => { this.friendsManager.open(); }; 
    
    // Poczta
    const topBarItems = document.querySelectorAll('.top-bar-item'); 
    topBarItems.forEach(item => { 
        if (item.textContent.includes('Poczta')) { 
            item.onclick = () => { this.mailManager.open(); }; 
        } 
    });
    
    const chatToggle = document.getElementById('chat-toggle-button'); 
    if (chatToggle) chatToggle.addEventListener('click', () => this.handleChatClick());
    
    const superBtn = document.getElementById('victory-super-btn'); 
    if (superBtn) superBtn.onclick = () => { 
        document.getElementById('victory-panel').style.display = 'none'; 
        if (this.pendingRewardData) this.showRewardPanel(); 
        else if (this.onExitParkour) this.onExitParkour(); 
    };
    
    const homeBtn = document.getElementById('reward-btn-home'); 
    if (homeBtn) homeBtn.onclick = () => { this.hideVictory(); if (this.onExitParkour) this.onExitParkour(); };
    
    const replayBtn = document.getElementById('reward-btn-replay'); 
    if (replayBtn) replayBtn.onclick = () => { this.hideVictory(); if (this.onReplayParkour) this.onReplayParkour(); };

    const btnPlayParkour = document.getElementById('play-choice-parkour'); 
    const btnPlayChat = document.getElementById('play-choice-chat'); 
    if (btnPlayParkour) btnPlayParkour.onclick = () => { this.closePanel('play-choice-panel'); this.showDiscoverPanel('worlds', 'parkour'); }; 
    if (btnPlayChat) btnPlayChat.onclick = () => { this.closePanel('play-choice-panel'); this.showDiscoverPanel('worlds', 'creative'); };
    
    const btnDiscSkin = document.getElementById('discover-choice-skin');
    const btnDiscPart = document.getElementById('discover-choice-part');
    const btnDiscPrefab = document.getElementById('discover-choice-prefab');
    if(btnDiscSkin) btnDiscSkin.onclick = () => { this.closePanel('discover-choice-panel'); this.showDiscoverPanel('discovery', 'skin'); };
    if(btnDiscPart) btnDiscPart.onclick = () => { this.closePanel('discover-choice-panel'); this.showDiscoverPanel('discovery', 'part'); };
    if(btnDiscPrefab) btnDiscPrefab.onclick = () => { this.closePanel('discover-choice-panel'); this.showDiscoverPanel('discovery', 'prefab'); };

    const setClick = (id, fn) => { const el = document.getElementById(id); if(el) el.onclick = fn; };
    setClick('build-choice-new-world', () => { this.closePanel('build-choice-panel'); this.openPanel('world-size-panel'); });
    setClick('build-choice-new-skin', () => { this.closePanel('build-choice-panel'); if(this.onSkinBuilderClick) this.onSkinBuilderClick(); });
    setClick('build-choice-new-prefab', () => { this.closePanel('build-choice-panel'); if(this.onPrefabBuilderClick) this.onPrefabBuilderClick(); });
    setClick('build-choice-new-part', () => { this.closePanel('build-choice-panel'); if(this.onPartBuilderClick) this.onPartBuilderClick(); });
    setClick('size-choice-new-small', () => { this.closePanel('world-size-panel'); if(this.onWorldSizeSelected) this.onWorldSizeSelected(64); });
    setClick('size-choice-new-medium', () => { this.closePanel('world-size-panel'); if(this.onWorldSizeSelected) this.onWorldSizeSelected(128); });
    setClick('size-choice-new-large', () => { this.closePanel('world-size-panel'); if(this.onWorldSizeSelected) this.onWorldSizeSelected(256); });
    
    const tabBlocks = document.getElementById('shop-tab-blocks'); 
    const tabAddons = document.getElementById('shop-tab-addons'); 
    if (tabBlocks && tabAddons) { 
        tabBlocks.onclick = () => { tabBlocks.classList.add('active'); tabAddons.classList.remove('active'); this.shopCurrentCategory = 'block'; this.refreshShopList(); }; 
        tabAddons.onclick = () => { tabAddons.classList.add('active'); tabBlocks.classList.remove('active'); this.shopCurrentCategory = 'addon'; this.refreshShopList(); }; 
    }
    
    const nameSubmitBtn = document.getElementById('name-submit-btn'); 
    if (nameSubmitBtn) { 
        nameSubmitBtn.onclick = () => { 
            const i = document.getElementById('name-input-field'); 
            const v = i.value.trim(); 
            if(v && this.onNameSubmit) { this.onNameSubmit(v); document.getElementById('name-input-panel').style.display = 'none'; } else alert('Nazwa nie może być pusta!'); 
        }; 
    }
    
    setClick('btn-open-news', () => { this.newsManager.open(); });
    
    setClick('btn-open-highscores', () => { 
        if (this.highScoresManager) this.highScoresManager.open(); 
    });
    
    setClick('btn-nav-options', () => { 
        if(this.onToggleFPS) {
            this.onToggleFPS(); 
            this.showMessage("Przełączono licznik FPS", "info");
        }
    });
    
    setClick('logout-btn', () => {
        localStorage.removeItem(STORAGE_KEYS.JWT_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.PLAYER_NAME);
        localStorage.removeItem(STORAGE_KEYS.USER_ID);
        window.location.reload();
    });
  }

  // --- HELPERS ---
  getButtonType(button) { 
      if (button.classList.contains('btn-zagraj')) return 'zagraj'; 
      if (button.classList.contains('btn-buduj')) return 'buduj'; 
      if (button.classList.contains('btn-kup')) return 'kup'; 
      if (button.classList.contains('btn-odkryj')) return 'odkryj'; 
      if (button.classList.contains('btn-wiecej')) return 'wiecej'; 
      return 'unknown'; 
  }
  
  handleButtonClick(buttonType, buttonElement) {
    buttonElement.style.transform = 'translateY(-1px) scale(0.95)';
    setTimeout(() => { buttonElement.style.transform = ''; }, 150);
    
    if (buttonType === 'zagraj') { this.openPanel('play-choice-panel'); return; }
    if (buttonType === 'buduj') { this.openPanel('build-choice-panel'); return; }
    if (buttonType === 'odkryj') { this.openPanel('discover-choice-panel'); return; }
    if (buttonType === 'wiecej') { this.openPanel('more-options-panel'); return; }
    if (buttonType === 'kup') { this.openPanel('shop-panel'); if (this.onShopOpen) this.onShopOpen(); return; }
  }

  // --- DELEGACJA ---
  loadFriendsData() { this.friendsManager.loadFriendsData(); }
  refreshSkinList(mode) { this.refreshDiscoveryList('skin', mode); }

  // --- PARKOUR & REWARDS ---
  hideVictory() { document.getElementById('victory-panel').style.display = 'none'; document.getElementById('reward-panel').style.display = 'none'; this.pendingRewardData = null; }
  showRewardPanel(customData = null) { 
      const panel = document.getElementById('reward-panel'); 
      const data = customData || this.pendingRewardData; 
      if (!panel) return; 
      this.bringToFront(panel); 
      if (data) { 
          const title = document.getElementById('reward-title-text'); 
          if(title) title.textContent = data.message || (customData ? "Odebrano Nagrody!" : "Ukończono!"); 
          const xpVal = document.getElementById('reward-xp-val'); 
          const coinVal = document.getElementById('reward-coins-val'); 
          const gainedXp = data.totalXp !== undefined ? data.totalXp : (data.newXp && data.oldXp ? data.newXp - data.oldXp : 500); 
          const gainedCoins = data.totalCoins !== undefined ? data.totalCoins : 100; 
          if (xpVal) xpVal.textContent = `+${gainedXp}`; 
          if (coinVal) coinVal.textContent = `+${gainedCoins}`; 
          document.getElementById('reward-lvl-cur').textContent = data.newLevel; 
          document.getElementById('reward-lvl-next').textContent = data.newLevel + 1; 
          const fill = document.getElementById('reward-bar-fill'); 
          const text = document.getElementById('reward-bar-text'); 
          if (fill && text) { 
              const max = data.maxXp || 100; 
              const percent = Math.min(100, Math.max(0, (data.newXp / max) * 100)); 
              fill.style.width = `${percent}%`; 
              text.textContent = `${data.newXp}/${max}`; 
          } 
      } 
      panel.style.display = 'flex'; 
  }

  // --- DISCOVER / SHOP / SKINS ---
  openPanel(id) { 
      const p = document.getElementById(id); 
      if(p) {
          this.bringToFront(p);
          p.style.display = 'flex'; 
          if(id === 'friends-panel') this.friendsManager.loadFriendsData();
      }
  }
  
  closePanel(id) { const p = document.getElementById(id); if(p) p.style.display = 'none'; }
  closeAllPanels() {
      if (this.skinPreviewAnimId) {
          cancelAnimationFrame(this.skinPreviewAnimId);
          this.skinPreviewAnimId = null;
      }
      document.querySelectorAll('.panel-modal').forEach(p => p.style.display='none');
      this.newsManager.close();
      this.mailManager.close();
      this.friendsManager.close();
      this.highScoresManager.close();
  }

  populateShop(allBlocks, isOwnedCallback) { this.allShopItems = allBlocks; this.shopIsOwnedCallback = isOwnedCallback; this.refreshShopList(); }
  refreshShopList() { 
      const list = document.getElementById('shop-list'); 
      if (!list) return; 
      list.innerHTML = ''; 
      const filteredItems = this.allShopItems.filter(item => { const cat = item.category || 'block'; return cat === this.shopCurrentCategory; }); 
      if (filteredItems.length === 0) { list.innerHTML = '<p class="text-outline" style="text-align:center; padding:20px;">Brak elementów w tej kategorii.</p>'; return; } 
      filteredItems.forEach(b => { 
          const i = document.createElement('div'); i.className = 'shop-item'; 
          const owned = this.shopIsOwnedCallback ? this.shopIsOwnedCallback(b.name) : false; 
          i.innerHTML = `<div class="shop-item-info"><div class="shop-item-icon" style="background-image: url('${b.texturePath}')"></div><span class="shop-item-name text-outline">${b.name}</span></div><div class="shop-item-action">${owned ? `<span class="owned-label text-outline">Posiadane</span>` : `<button class="buy-btn" data-block-name="${b.name}">${b.cost} <img src="icons/icon-coin.png" style="width:20px;height:20px;vertical-align:middle;margin-left:5px;"></button>`}</div>`; 
          list.appendChild(i); 
      }); 
      list.querySelectorAll('.buy-btn').forEach(btn => { 
          btn.onclick = () => { 
              const b = this.allShopItems.find(x => x.name === btn.dataset.blockName); 
              if (b && this.onBuyBlock) this.onBuyBlock(b); 
          }; 
      }); 
  }

  async showDiscoverPanel(type, category = null) {
      const title=document.getElementById('discover-panel-title'); 
      const tabs=document.getElementById('discover-tabs'); 
      const list=document.getElementById('discover-list'); 
      if(!list) return; 
      
      this.openPanel('discover-panel'); 
      list.innerHTML='<p class="text-outline" style="text-align:center">Ładowanie...</p>'; 
      
      if(type === 'worlds') {
          if(title) title.textContent = category === 'parkour' ? 'Wybierz Parkour' : 'Wybierz Świat'; 
          if(tabs) tabs.style.display='none'; 
          try {
              const allWorlds = await WorldStorage.getAllWorlds(); 
              let filteredWorlds = allWorlds;
              if (category) {
                  filteredWorlds = allWorlds.filter(w => {
                      const wType = w.type || 'creative';
                      return wType === category;
                  });
              }
              this.populateDiscoverPanel('worlds', filteredWorlds, (worldItem)=>{ if(this.onWorldSelect) this.onWorldSelect(worldItem); }); 
          } catch(e) { list.innerHTML='<p class="text-outline" style="text-align:center">Błąd pobierania.</p>'; }
      }
      else if (type === 'discovery') {
          const labels = { skin: 'Skiny', part: 'Części', prefab: 'Prefabrykaty' };
          if(title) title.textContent = `Wybierz ${labels[category] || 'Element'}`;
          if(tabs) {
              tabs.style.display = 'flex';
              const tabAll = document.querySelector('#discover-tabs .friends-tab[data-tab="all"]');
              const tabMine = document.querySelector('#discover-tabs .friends-tab[data-tab="mine"]');
              if(tabMine) tabMine.classList.remove('active');
              if(tabAll) { tabAll.classList.add('active'); tabAll.onclick = () => { tabMine.classList.remove('active'); tabAll.classList.add('active'); this.refreshDiscoveryList(category, 'all'); }; }
              if(tabMine) { tabMine.onclick = () => { if(tabAll) tabAll.classList.remove('active'); tabMine.classList.add('active'); this.refreshDiscoveryList(category, 'mine'); }; }
          }
          this.refreshDiscoveryList(category, 'all');
      }
  }

  async refreshDiscoveryList(type, mode) {
      const list=document.getElementById('discover-list'); 
      if(list) list.innerHTML='<p class="text-outline" style="text-align:center">Pobieranie...</p>'; 
      let items = [];
      try {
          if (type === 'skin') { items = mode === 'mine' ? await SkinStorage.getMySkins() : await SkinStorage.getAllSkins(); } 
          else if (type === 'prefab') { items = mode === 'mine' ? await PrefabStorage.getSavedPrefabsList() : await PrefabStorage.getAllPrefabs(); } 
          else if (type === 'part') { items = mode === 'mine' ? await HyperCubePartStorage.getSavedPartsList() : await HyperCubePartStorage.getAllParts(); }
          this.populateDiscoverPanel(type, items, (item) => { this.showItemDetails(item, type); });
      } catch(e) { console.error(e); if(list) list.innerHTML='<p class="text-outline" style="text-align:center">Błąd połączenia.</p>'; }
  }

  populateDiscoverPanel(type, items, onSelect) { const list=document.getElementById('discover-list'); if(!list) return; list.innerHTML=''; if(!items || items.length===0){ list.innerHTML='<p class="text-outline" style="text-align:center">Brak elementów.</p>'; return; } items.forEach(item => { const div=document.createElement('div'); div.className='panel-item skin-list-item'; div.style.display='flex'; div.style.alignItems='center'; div.style.padding='10px'; const thumbContainer=document.createElement('div'); thumbContainer.style.width='64px'; thumbContainer.style.height='64px'; thumbContainer.style.backgroundColor='#000'; thumbContainer.style.borderRadius='8px'; thumbContainer.style.marginRight='15px'; thumbContainer.style.overflow='hidden'; thumbContainer.style.flexShrink='0'; thumbContainer.style.border='2px solid white'; let thumbSrc = item.thumbnail; let label = item.name; if (type === 'worlds' && typeof item === 'object') { if(item.creator) label += ` (od ${item.creator})`; } else if (item.creator) { label += ` (od ${item.creator})`; } if(thumbSrc){ const img=document.createElement('img'); img.src=thumbSrc; img.style.width='100%'; img.style.height='100%'; img.style.objectFit='cover'; thumbContainer.appendChild(img); } else { thumbContainer.textContent='?'; thumbContainer.style.display='flex'; thumbContainer.style.alignItems='center'; thumbContainer.style.justifyContent='center'; thumbContainer.style.color='white'; } const nameSpan=document.createElement('span'); nameSpan.textContent=label; nameSpan.className='text-outline'; nameSpan.style.fontSize='18px'; div.appendChild(thumbContainer); div.appendChild(nameSpan); div.onclick=()=>{ if (type === 'worlds') { this.closeAllPanels(); onSelect(item); } else { onSelect(item); } }; list.appendChild(div); }); }

  async showItemDetails(item, type) { 
      const modal = document.getElementById('skin-details-modal'); 
      if (!modal) return; 
      this.currentDetailsId = item.id; 
      this.currentDetailsType = type; 
      this.bringToFront(modal); 
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
      const myId = parseInt(localStorage.getItem(STORAGE_KEYS.USER_ID) || "0"); const isOwner = item.owner_id === myId; 
      if (btnUse) { btnUse.style.display = 'flex'; if (type === 'skin') { if (isOwner) { btnUse.onclick = () => { this.closeAllPanels(); if (this.onSkinSelect) this.onSkinSelect(item.id, item.name, item.thumbnail, item.owner_id); }; } else { btnUse.style.display = 'none'; } } else if (type === 'part') { btnUse.onclick = () => { this.closeAllPanels(); if (this.onUsePart) this.onUsePart(item); }; } else if (type === 'prefab') { btnUse.onclick = () => { this.closeAllPanels(); if (this.onUsePrefab) this.onUsePrefab(item); }; } } 
      if (btnLike) { btnLike.onclick = null; btnLike.onclick = async () => { const t = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN); if(!t) return; try { const endpointType = type === 'skin' ? 'skins' : (type === 'part' ? 'parts' : 'prefabs'); const r = await fetch(`${API_BASE_URL}/api/${endpointType}/${item.id}/like`, { method: 'POST', headers: { 'Authorization': `Bearer ${t}` } }); const d = await r.json(); if (d.success) { if(likesCount) likesCount.textContent = d.likes; } } catch(e) { console.error(e); } }; } 
      this.init3DPreview(item.id, type); 
      this.closeAllPanels(); 
      modal.style.display = 'flex'; 
  }

  async openItemComments(itemId, type) { const panel = document.getElementById('skin-comments-panel'); if (!panel) return; this.bringToFront(panel); panel.style.display = 'flex'; const closeBtn = document.getElementById('close-comments-btn'); if(closeBtn) closeBtn.onclick = () => { panel.style.display = 'none'; }; this.loadItemComments(itemId, type); const submitBtn = document.getElementById('comment-submit-btn'); const input = document.getElementById('comment-input'); if(submitBtn) { submitBtn.onclick = null; submitBtn.onclick = async () => { const text = input.value.trim(); if(!text) return; const t = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN); const endpointType = type === 'skin' ? 'skins' : (type === 'part' ? 'parts' : 'prefabs'); try { const r = await fetch(`${API_BASE_URL}/api/${endpointType}/${itemId}/comments`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t}` }, body: JSON.stringify({ text }) }); if(r.ok) { input.value = ''; this.loadItemComments(itemId, type); } } catch(e) { console.error(e); } }; } }
  async loadItemComments(itemId, type) { const container = document.querySelector('.comments-list-container'); if(!container) return; container.innerHTML = '<p style="text-align:center; padding:10px;">Ładowanie...</p>'; const t = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN); const endpointType = type === 'skin' ? 'skins' : (type === 'part' ? 'parts' : 'prefabs'); const likeEndpoint = type === 'skin' ? 'skins' : (type === 'part' ? 'parts' : 'prefabs'); try { const r = await fetch(`${API_BASE_URL}/api/${endpointType}/${itemId}/comments`, { headers: { 'Authorization': `Bearer ${t}` } }); const comments = await r.json(); container.innerHTML = ''; if(comments.length === 0) { container.innerHTML = '<p style="text-align:center; padding:10px; color:#666;">Brak komentarzy.</p>'; return; } comments.forEach(c => { const div = document.createElement('div'); div.className = 'comment-item'; const date = new Date(c.created_at); const now = new Date(); const diffHours = Math.floor((now - date) / (1000 * 60 * 60)); const timeStr = diffHours < 24 ? (diffHours === 0 ? "teraz" : `${diffHours}h temu`) : `${Math.floor(diffHours/24)}d temu`; div.innerHTML = `<div class="comment-avatar" style="background-image: url('${c.current_skin_thumbnail || ''}')"></div><div class="comment-content"><div class="comment-author">${c.username}</div><div class="comment-text">${c.text}</div><div class="comment-time">${timeStr}</div></div><div class="comment-actions"><div class="comment-like-count">${c.likes || 0}</div><div class="comment-like-btn">❤</div></div>`; const likeBtn = div.querySelector('.comment-like-btn'); likeBtn.onclick = async () => { try { const lr = await fetch(`${API_BASE_URL}/api/${likeEndpoint}/comments/${c.id}/like`, { method: 'POST', headers: { 'Authorization': `Bearer ${t}` } }); const ld = await lr.json(); if(ld.success) { div.querySelector('.comment-like-count').textContent = ld.likes; } } catch(e) {} }; container.appendChild(div); }); } catch(e) { container.innerHTML = '<p style="text-align:center;">Błąd.</p>'; } }
  async init3DPreview(itemId, type) { const container = document.getElementById('skin-preview-canvas'); if (!container) return; if (this.skinPreviewAnimId) cancelAnimationFrame(this.skinPreviewAnimId); container.innerHTML = ''; const width = container.clientWidth || 300; const height = container.clientHeight || 300; this.skinPreviewScene = new THREE.Scene(); this.skinPreviewCamera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100); this.skinPreviewCamera.position.set(0, 2, 6); this.skinPreviewCamera.lookAt(0, 0.5, 0); this.skinPreviewRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true }); this.skinPreviewRenderer.setSize(width, height); container.appendChild(this.skinPreviewRenderer.domElement); const amb = new THREE.AmbientLight(0xffffff, 0.8); this.skinPreviewScene.add(amb); const dir = new THREE.DirectionalLight(0xffffff, 0.6); dir.position.set(5, 10, 7); this.skinPreviewScene.add(dir); this.skinPreviewCharacter = new THREE.Group(); if (type === 'skin' && typeof createBaseCharacter !== 'undefined') { createBaseCharacter(this.skinPreviewCharacter); this.skinPreviewCharacter.position.y = -0.8; } else { this.skinPreviewCharacter.position.y = 0; } this.skinPreviewScene.add(this.skinPreviewCharacter); let blocksData = null; if (type === 'skin') blocksData = await SkinStorage.loadSkinData(itemId); else if (type === 'prefab') blocksData = await PrefabStorage.loadPrefab(itemId); else if (type === 'part') blocksData = await HyperCubePartStorage.loadPart(itemId); if (blocksData) { const loader = new THREE.TextureLoader(); const blockGroup = new THREE.Group(); if (type === 'skin') { blockGroup.scale.setScalar(0.125); blockGroup.position.y = 0.5; } else { blockGroup.scale.setScalar(0.125); } blocksData.forEach(b => { const geo = new THREE.BoxGeometry(1, 1, 1); const mat = new THREE.MeshLambertMaterial({ map: loader.load(b.texturePath) }); const mesh = new THREE.Mesh(geo, mat); mesh.position.set(b.x, b.y, b.z); blockGroup.add(mesh); }); this.skinPreviewCharacter.add(blockGroup); } this.skinPreviewCharacter.scale.setScalar(1.5); const animate = () => { this.skinPreviewAnimId = requestAnimationFrame(animate); if (this.skinPreviewCharacter) { this.skinPreviewCharacter.rotation.y += 0.01; } this.skinPreviewRenderer.render(this.skinPreviewScene, this.skinPreviewCamera); }; animate(); }
}