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
    } catch (error) {
        console.error("Błąd UI:", error);
    }
  }

  bringToFront(element) {
      if (element) {
          this.activeZIndex++;
          element.style.zIndex = this.activeZIndex;
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
      if (modalsLayer) modalsLayer.innerHTML = MODALS_HTML + SKIN_DETAILS_HTML + SKIN_COMMENTS_HTML + DISCOVER_CHOICE_HTML + PLAYER_PROFILE_HTML + OTHER_PLAYER_PROFILE_HTML + VICTORY_HTML + REWARD_HTML;
  }

  initSharedRenderer() {
      this.sharedPreviewRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
      this.sharedPreviewRenderer.setSize(300, 300);
      this.sharedPreviewRenderer.setPixelRatio(window.devicePixelRatio);
      this.previewScene = new THREE.Scene();
      this.previewCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
      this.previewCamera.position.set(0, 1, 6);
      this.previewCamera.lookAt(0, 0.5, 0);
      this.previewScene.add(new THREE.AmbientLight(0xffffff, 0.9));
      const dir = new THREE.DirectionalLight(0xffffff, 0.6); dir.position.set(2, 5, 3); this.previewScene.add(dir);
      this.previewCharacter = new THREE.Group();
      if (typeof createBaseCharacter !== 'undefined') createBaseCharacter(this.previewCharacter);
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
      for (let i = this.previewCharacter.children.length - 1; i >= 0; i--) {
          const child = this.previewCharacter.children[i];
          if (child.type === 'Group') this.previewCharacter.remove(child);
      }
  }

  applySkinToPreview(blocksData) {
      for (let i = this.previewCharacter.children.length - 1; i >= 0; i--) {
          const child = this.previewCharacter.children[i];
          if (child.type === 'Group') this.previewCharacter.remove(child);
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

  disposeCurrentPreview() {}

  updatePlayerName(name) { const n = document.getElementById('player-name-display'); if(n) n.textContent = name; if(!this.myProfileData) this.myProfileData={}; this.myProfileData.username = name; }
  
  updatePlayerAvatar(thumbnail) { 
      const el = document.querySelector('#player-avatar-button .player-avatar'); 
      if (!el) return; 
      if (!this.myProfileData) this.myProfileData = {};
      this.myProfileData.thumbnail = thumbnail;
      if (thumbnail) { el.textContent=''; el.style.backgroundImage=`url(${thumbnail})`; el.style.backgroundSize='cover'; el.style.backgroundColor='transparent'; } 
      else { el.style.backgroundImage='none'; el.textContent='👤'; el.style.backgroundColor='rgba(255,255,255,0.1)'; } 
  }

  updateLevelInfo(level, xp, maxXp) {
      const v = document.getElementById('level-value'); if(v) v.textContent=level;
      const t = document.getElementById('level-text'); if(t) t.textContent=`${xp}/${maxXp}`;
      const f = document.getElementById('level-bar-fill'); if(f) f.style.width=`${Math.min(100, Math.max(0, (xp/maxXp)*100))}%`;
      if(!this.myProfileData) this.myProfileData={}; this.myProfileData.level=level;
  }

  updateCoinCounter(val) { const e = document.getElementById('coin-value'); if(e) e.textContent = val; }
  updateFPSToggleText(e) { const f = document.getElementById('fps-status'); if(f) f.textContent = e ? 'Włączony' : 'Wyłączony'; }
  toggleMobileControls(s) { const m = document.getElementById('mobile-game-controls'); if(m) m.style.display = s ? 'block' : 'none'; }
  updatePendingRewards(count) { 
      if(this.newsManager) { 
          this.pendingNewsCount=parseInt(count)||0; 
          const b=document.getElementById('rewards-badge'); 
          if(b) b.style.display=this.pendingNewsCount>0?'flex':'none'; 
          if(b) b.textContent=this.pendingNewsCount; 
      } 
  }

  checkAdminPermissions(username) {
      const admins = ['nixox2', 'admin'];
      if (admins.includes(username)) {
          const i = setInterval(() => {
              const g = document.querySelector('#more-options-panel .nav-grid-container');
              if (g) { clearInterval(i); 
                  if(!document.getElementById('admin-edit-nexus-btn')){ const d=document.createElement('div'); d.className='nav-item'; d.id='admin-edit-nexus-btn'; d.innerHTML=`<div class="nav-btn-box" style="filter: hue-rotate(180deg) drop-shadow(0 4px 4px rgba(0,0,0,0.3));"><img src="icons/tworzenie.png" class="nav-icon"><span class="nav-label">Edytuj Nexus</span></div>`; d.onclick=()=>{ this.navigationManager.closePanel('more-options-panel'); if(this.onEditNexusClick)this.onEditNexusClick(); }; g.insertBefore(d, g.firstChild); }
                  if(!document.getElementById('admin-edit-login-map-btn')){ const d=document.createElement('div'); d.className='nav-item'; d.id='admin-edit-login-map-btn'; d.innerHTML=`<div class="nav-btn-box" style="filter: hue-rotate(280deg) drop-shadow(0 4px 4px rgba(0,0,0,0.3));"><img src="icons/tworzenie.png" class="nav-icon"><span class="nav-label">Login Map</span></div>`; d.onclick=()=>{ this.navigationManager.closePanel('more-options-panel'); if(this.onEditLoginMapClick)this.onEditLoginMapClick(); }; g.insertBefore(d, g.firstChild); }
                  if(!document.getElementById('admin-add-starter-skin-btn')){ const d=document.createElement('div'); d.className='nav-item'; d.id='admin-add-starter-skin-btn'; d.innerHTML=`<div class="nav-btn-box" style="filter: hue-rotate(90deg) drop-shadow(0 4px 4px rgba(0,0,0,0.3));"><img src="icons/tworzenie.png" class="nav-icon"><span class="nav-label">Starter Skin</span></div>`; d.onclick=()=>{ this.navigationManager.closePanel('more-options-panel'); if(this.onAddStarterSkinClick)this.onAddStarterSkinClick(); }; g.insertBefore(d, g.firstChild); }
              }
          }, 500);
      }
  }

  async openOtherPlayerProfile(username) {
      const myName = localStorage.getItem(STORAGE_KEYS.PLAYER_NAME);
      if (username === myName) { this.openPlayerProfile(); return; }
      this.closeAllPanels();
      const p = document.getElementById('other-player-profile-panel'); if(!p) return;
      this.bringToFront(p); p.style.display='flex';
      this.attachRendererTo('other-player-preview-canvas', -1.2, 1.5);
      document.getElementById('other-profile-username').textContent = username;
      const t = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
      try {
          const r = await fetch(`${API_BASE_URL}/api/user/profile/${username}`, { headers: { 'Authorization': `Bearer ${t}` } });
          if (r.ok) {
              const u = await r.json();
              document.getElementById('other-profile-level').textContent = u.level||1;
              document.getElementById('other-profile-date').textContent = this.formatMemberSince(u.created_at);
              this.updateFriendStatusUI(u.id);
              this.setupOtherProfileButtons(u.id, username);
              this.loadSkinForPreview(u.id);
          }
      } catch(e) {}
  }

  updateFriendStatusUI(userId) {
      const s = this.friendsManager.getFriendStatus(userId);
      const dot = document.getElementById('other-profile-status');
      const btn = document.getElementById('btn-other-friend-action');
      if (s.isFriend) {
          dot.style.display='block'; if(s.isOnline) dot.classList.remove('offline'); else dot.classList.add('offline');
          btn.style.background='linear-gradient(to bottom, #e74c3c, #c0392b)'; btn.innerHTML='<div style="font-size:30px;">🗑️</div>';
          btn.onclick=()=>{ if(confirm("Usunąć?")) this.friendsManager.removeFriend(userId).then(ok=>{ if(ok) this.updateFriendStatusUI(userId); }); };
      } else {
          dot.style.display='none';
          btn.style.background='linear-gradient(to bottom, #2ecc71, #27ae60)'; btn.innerHTML='<div style="font-size:30px; font-weight:bold; color:white;">+</div>';
          btn.onclick=()=>{ this.friendsManager.sendFriendRequest(userId); btn.style.opacity='0.5'; };
      }
  }

  async loadSkinForPreview(userId) {
      try {
          const t = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
          const r = await fetch(`${API_BASE_URL}/api/user/${userId}/wall`, { headers: { 'Authorization': `Bearer ${t}` } });
          if(r.ok) {
              const d = await r.json();
              if(d.skins.length>0) this.applySkinToPreview(await SkinStorage.loadSkinData(d.skins[0].id));
          }
      } catch(e) {}
  }

  setupOtherProfileButtons(userId, username) {
      const wall = document.getElementById('btn-other-wall'); if(wall) wall.onclick=()=>{ document.getElementById('other-player-profile-panel').style.display='none'; this.disposeCurrentPreview(); this.wallManager.open(userId, username); };
      const chat = document.getElementById('btn-other-chat'); if(chat) chat.onclick=()=>{ document.getElementById('other-player-profile-panel').style.display='none'; this.disposeCurrentPreview(); this.mailManager.open(); this.mailManager.openConversation(username); };
      const cls = document.getElementById('btn-other-profile-close'); if(cls) cls.onclick=()=>{ document.getElementById('other-player-profile-panel').style.display='none'; this.disposeCurrentPreview(); };
      const sml = document.getElementById('btn-other-smile'); if(sml) sml.onclick=async()=>{
          const t = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
          try { const r = await fetch(`${API_BASE_URL}/api/user/${userId}/smile`, { method: 'POST', headers: { 'Authorization': `Bearer ${t}` } });
          if(r.ok) this.showMessage("Wysłano uśmiech!", "success"); else this.showMessage("Błąd", "error"); } catch(e){ this.showMessage("Błąd sieci", "error"); }
      };
  }

  async openPlayerProfile() {
      const p = document.getElementById('player-profile-panel'); if(!p) return;
      this.bringToFront(p); p.style.display='flex';
      this.attachRendererTo('profile-preview-canvas', -1, 1.5);
      if(this.myProfileData) { document.getElementById('profile-username').textContent=this.myProfileData.username; document.getElementById('profile-level-val').textContent=this.myProfileData.level; }
      const sid = SkinStorage.getLastUsedSkinId(); if(sid) this.applySkinToPreview(await SkinStorage.loadSkinData(sid));
  }

  async showItemDetails(item, type, keepOpen=false) { 
      const m=document.getElementById('skin-details-modal'); if(!m)return;
      this.bringToFront(m); if(!keepOpen) this.closeAllPanels(); m.style.display='flex';
      m.querySelector('.skin-name-header').textContent=item.name;
      m.querySelector('.skin-creator-name').textContent=item.creator||"Nieznany";
      m.querySelector('.skin-creator-level-val').textContent=item.creatorLevel||"?";
      m.querySelector('.skin-likes-count').textContent=item.likes||0;
      const btnU=document.getElementById('skin-btn-use');
      const isOwner = item.owner_id === parseInt(localStorage.getItem(STORAGE_KEYS.USER_ID));
      if(btnU) {
          btnU.style.display='flex';
          if(type==='skin') { if(isOwner) btnU.onclick=()=>{ this.closeAllPanels(); if(this.onSkinSelect) this.onSkinSelect(item.id, item.name, item.thumbnail, item.owner_id); }; else btnU.style.display='none'; }
          else if(type==='part') btnU.onclick=()=>{ this.closeAllPanels(); if(this.onUsePart) this.onUsePart(item); };
          else if(type==='prefab') btnU.onclick=()=>{ this.closeAllPanels(); if(this.onUsePrefab) this.onUsePrefab(item); };
      }
      this.attachRendererTo('skin-preview-canvas', type==='skin'?-0.8:0, 1.5);
      let d=null;
      if(type==='skin') d=await SkinStorage.loadSkinData(item.id);
      else if(type==='prefab') d=await PrefabStorage.loadPrefab(item.id);
      else if(type==='part') d=await HyperCubePartStorage.loadPart(item.id);
      this.applySkinToPreview(d);
  }

  setupChatSystem() { this.setupChatInput(); }
  addChatMessage(m, s=null) { const c=document.querySelector('.chat-area'); if(c) { const e=document.createElement('div'); e.className='chat-message text-outline'; e.textContent=m; c.appendChild(e); c.scrollTop=c.scrollHeight; } }
  clearChat() { const c=document.querySelector('.chat-area'); if(c) c.innerHTML=''; }
  handleChatClick() { const f=document.getElementById('chat-form'); if(f) f.style.display='flex'; document.getElementById('chat-input-field').focus(); }
  setupChatInput() { const f=document.getElementById('chat-form'); if(f) f.onsubmit=e=>{ e.preventDefault(); const i=document.getElementById('chat-input-field'); const v=i.value.trim(); if(v&&this.onSendMessage) this.onSendMessage(v); i.value=''; f.style.display='none'; }; }

  setParkourTimerVisible(v) { document.getElementById('parkour-timer').style.display=v?'block':'none'; }
  updateParkourTimer(s) { document.getElementById('parkour-timer').textContent=s; }
  
  handleParkourCompletion(timeStr, rewardData) {
      if(this.onVictoryScreenOpen) this.onVictoryScreenOpen();
      const v = document.getElementById('bsp-victory-screen');
      if(v) {
          this.bringToFront(v); v.style.display='flex';
          if(rewardData && rewardData.records) {
              document.getElementById('bsp-run-time').textContent = rewardData.records.formattedTime;
              document.getElementById('bsp-rec-all').textContent = rewardData.records.allTime;
              document.getElementById('bsp-rec-day').textContent = rewardData.records.daily;
              document.getElementById('bsp-rec-personal').textContent = rewardData.records.personal;
              const bdg = document.getElementById('bsp-new-record-badge'); if(bdg) bdg.style.display = rewardData.records.isNewPb ? 'block' : 'none';
          } else { document.getElementById('bsp-run-time').textContent = timeStr; }
          if(rewardData && rewardData.map) {
               document.getElementById('bsp-map-name').textContent = rewardData.map.name;
               if(rewardData.map.thumbnail) document.getElementById('bsp-map-thumb').style.backgroundImage = `url(${rewardData.map.thumbnail})`;
          }
          const c = document.getElementById('bsp-continue-btn');
          c.onclick = () => { v.style.display='none'; this.showRewardScreen(rewardData); };
      }
      this.pendingRewardData = rewardData;
  }

  showRewardScreen(rewardData) {
      const r = document.getElementById('bsp-reward-screen'); if(!r) return;
      this.bringToFront(r); r.style.display='flex';
      if(rewardData) {
          document.getElementById('bsp-rew-xp').textContent = rewardData.rewards.standard.xp;
          document.getElementById('bsp-rew-coins').textContent = rewardData.rewards.standard.coins;
          document.getElementById('bsp-vip-xp').textContent = rewardData.rewards.vip.xp;
          document.getElementById('bsp-vip-coins').textContent = rewardData.rewards.vip.coins;
          
          const lvl = rewardData.newLevel; const xp = rewardData.newXp; const max = rewardData.maxXp;
          document.getElementById('bsp-lvl-cur').textContent = lvl;
          document.getElementById('bsp-lvl-next').textContent = lvl+1;
          document.getElementById('bsp-xp-text').textContent = `${xp}/${max}`;
          setTimeout(() => { document.getElementById('bsp-xp-fill').style.width = `${Math.min(100, (xp/max)*100)}%`; }, 100);
          this.updateCoinCounter(rewardData.newCoins);
          this.updateLevelInfo(lvl, xp, max);
      }
      document.getElementById('bsp-btn-home').onclick = () => { r.style.display='none'; if(this.onExitParkour) this.onExitParkour(); };
      document.getElementById('bsp-btn-replay').onclick = () => { r.style.display='none'; if(this.onReplayParkour) this.onReplayParkour(); };
      document.getElementById('bsp-btn-next').onclick = () => { r.style.display='none'; if(this.onExitParkour) this.onExitParkour(); };
  }
  
  hideVictory() { 
      ['bsp-victory-screen','bsp-reward-screen','victory-panel','reward-panel'].forEach(id=>{ const e=document.getElementById(id); if(e)e.style.display='none'; }); 
      this.pendingRewardData=null; 
  }

  // --- PRZYWRÓCONE METODY ODKRYWANIA ---

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
              if (category) { filteredWorlds = allWorlds.filter(w => { const wType = w.type || 'creative'; return wType === category; }); } 
              this.populateDiscoverPanel('worlds', filteredWorlds, (worldItem)=>{ if(this.onWorldSelect) this.onWorldSelect(worldItem); }); 
          } catch(e) { list.innerHTML='<p class="text-outline" style="text-align:center">Błąd pobierania.</p>'; } 
      } else if (type === 'discovery') { 
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
          this.populateDiscoverPanel(type, items, (item) => { this.showItemDetails(item, type, true); }); 
      } catch(e) { console.error(e); if(list) list.innerHTML='<p class="text-outline" style="text-align:center">Błąd połączenia.</p>'; } 
  }

  populateDiscoverPanel(type, items, onSelect) { 
      const list=document.getElementById('discover-list'); 
      if(!list) return; 
      list.innerHTML=''; 
      if(!items || items.length===0){ list.innerHTML='<p class="text-outline" style="text-align:center">Brak elementów.</p>'; return; } 
      items.forEach(item => { 
          const div=document.createElement('div'); div.className='panel-item skin-list-item'; div.style.display='flex'; div.style.alignItems='center'; div.style.padding='10px'; 
          const thumbContainer=document.createElement('div'); thumbContainer.style.width='64px'; thumbContainer.style.height='64px'; thumbContainer.style.backgroundColor='#000'; thumbContainer.style.borderRadius='8px'; thumbContainer.style.marginRight='15px'; thumbContainer.style.overflow='hidden'; thumbContainer.style.flexShrink='0'; thumbContainer.style.border='2px solid white'; 
          let thumbSrc = item.thumbnail; let label = item.name; 
          if (type === 'worlds' && typeof item === 'object') { if(item.creator) label += ` (od ${item.creator})`; } else if (item.creator) { label += ` (od ${item.creator})`; } 
          if(thumbSrc){ const img=document.createElement('img'); img.src=thumbSrc; img.style.width='100%'; img.style.height='100%'; img.style.objectFit='cover'; thumbContainer.appendChild(img); } else { thumbContainer.textContent='?'; thumbContainer.style.display='flex'; thumbContainer.style.alignItems='center'; thumbContainer.style.justifyContent='center'; thumbContainer.style.color='white'; } 
          const nameSpan=document.createElement('span'); nameSpan.textContent=label; nameSpan.className='text-outline'; nameSpan.style.fontSize='18px'; 
          div.appendChild(thumbContainer); div.appendChild(nameSpan); 
          div.onclick=()=>{ if (type === 'worlds') { this.closeAllPanels(); onSelect(item); } else { onSelect(item); } }; 
          list.appendChild(div); 
      }); 
  }

  formatMemberSince(dateString) { const date = dateString ? new Date(dateString) : new Date(); const monthNames = ["sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"]; return `Członek od ${monthNames[date.getMonth()]}, ${date.getFullYear()}`; }

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
      const pBtn = document.getElementById('player-avatar-button'); if (pBtn) pBtn.onclick = () => { this.openPlayerProfile(); };
      const friendsBtn = document.getElementById('btn-friends-open'); if (friendsBtn) friendsBtn.onclick = () => { this.friendsManager.open(); }; 
      const topBarItems = document.querySelectorAll('.top-bar-item'); topBarItems.forEach(item => { if (item.textContent.includes('Poczta')) { item.onclick = () => { this.mailManager.open(); }; } });
      const chatToggle = document.getElementById('chat-toggle-button'); if (chatToggle) chatToggle.onclick = () => this.handleChatClick();
      const btnDiscSkin = document.getElementById('discover-choice-skin'); if(btnDiscSkin) btnDiscSkin.onclick = () => { this.closePanel('discover-choice-panel'); this.showDiscoverPanel('discovery', 'skin'); };
      const btnDiscPart = document.getElementById('discover-choice-part'); if(btnDiscPart) btnDiscPart.onclick = () => { this.closePanel('discover-choice-panel'); this.showDiscoverPanel('discovery', 'part'); };
      const btnDiscPrefab = document.getElementById('discover-choice-prefab'); if(btnDiscPrefab) btnDiscPrefab.onclick = () => { this.closePanel('discover-choice-panel'); this.showDiscoverPanel('discovery', 'prefab'); };
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
}
