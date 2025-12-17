import * as THREE from 'three';
import { createBaseCharacter } from './character.js';
import { SkinStorage } from './SkinStorage.js';
import { WorldStorage } from './WorldStorage.js';
import { PrefabStorage } from './PrefabStorage.js';
import { HyperCubePartStorage } from './HyperCubePartStorage.js';
import { AUTH_HTML, HUD_HTML, BUILD_UI_HTML, MODALS_HTML, SKIN_DETAILS_HTML, SKIN_COMMENTS_HTML, DISCOVER_CHOICE_HTML } from './UITemplates.js';
import { STORAGE_KEYS } from './Config.js';

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
    this.onUsePrefab = null;
    this.onUsePart = null;
    this.onExitParkour = null;
    this.onReplayParkour = null;
    this.onClaimRewards = null; 

    this.friendsList = [];
    this.mailState = { conversations: [], activeConversation: null };
    
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
    
    // FIX: Licznik warstw, aby nowe okna były zawsze na wierzchu
    this.activeZIndex = 20000; 
  }
  
  initialize(isMobile) {
    this.isMobile = isMobile;
    console.log("Inicjalizacja UI...");
    try {
        this.renderUI();
        this.setupButtonHandlers();
        this.setupChatSystem();
        this.setupFriendsSystem();
        this.setupDiscoverTabs();
        this.setupMailSystem();
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
      if (modalsLayer) modalsLayer.innerHTML = MODALS_HTML + SKIN_DETAILS_HTML + SKIN_COMMENTS_HTML + DISCOVER_CHOICE_HTML;
  }

  // FIX: Metoda do wyciągania okna na wierzch
  bringToFront(element) {
      if (element) {
          this.activeZIndex++;
          element.style.zIndex = this.activeZIndex;
      }
  }

  updateLevelInfo(level, xp, maxXp) {
      const lvlVal = document.getElementById('level-value');
      const lvlText = document.getElementById('level-text');
      const lvlFill = document.getElementById('level-bar-fill');
      if (lvlVal) lvlVal.textContent = level;
      if (lvlText) lvlText.textContent = `${xp}/${maxXp}`;
      if (lvlFill) { const percent = Math.min(100, Math.max(0, (xp / maxXp) * 100)); lvlFill.style.width = `${percent}%`; }
  }

  updatePendingRewards(count) {
      this.pendingNewsCount = parseInt(count) || 0;
      const btnMore = document.querySelector('.btn-wiecej');
      const badge = document.getElementById('rewards-badge');
      
      if (badge) {
          if (this.pendingNewsCount > 0) {
              badge.textContent = this.pendingNewsCount;
              badge.style.display = 'flex'; // Centered thanks to flex in CSS
          } else {
              badge.style.display = 'none';
          }
      }

      if (btnMore) {
          if (this.pendingNewsCount > 0) {
              btnMore.style.filter = "drop-shadow(0 0 5px #f1c40f)";
          } else {
              btnMore.style.filter = "none";
          }
      }
  }

  setParkourTimerVisible(visible) { const timer = document.getElementById('parkour-timer'); if (timer) timer.style.display = visible ? 'block' : 'none'; }
  updateParkourTimer(timeString) { const timer = document.getElementById('parkour-timer'); if (timer) timer.textContent = timeString; }
  
  handleParkourCompletion(timeString, data) {
      this.pendingRewardData = data;
      this.showVictory(timeString);
  }

  showVictory(timeString) {
      const panel = document.getElementById('victory-panel');
      const timeDisplay = document.getElementById('victory-time-display');
      if (panel && timeDisplay) {
          timeDisplay.textContent = timeString;
          this.bringToFront(panel); // FIX: Na wierzch
          panel.style.display = 'flex';
      }
  }

  showRewardPanel(customData = null) {
      const panel = document.getElementById('reward-panel');
      const data = customData || this.pendingRewardData;
      if (!panel) return;
      
      this.bringToFront(panel); // FIX: Na wierzch
      
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

  hideVictory() {
      document.getElementById('victory-panel').style.display = 'none';
      document.getElementById('reward-panel').style.display = 'none';
      this.pendingRewardData = null;
  }

  async openNewsPanel() {
      const panel = document.getElementById('news-modal');
      const list = document.getElementById('news-list');
      if(!panel || !list) return;
      
      this.bringToFront(panel); // FIX: Na wierzch (nad panel Opcje)
      panel.style.display = 'flex';
      list.innerHTML = '<p class="text-outline" style="text-align:center; padding:20px;">Ładowanie...</p>';
      
      try {
          const t = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
          const r = await fetch(`${API_BASE_URL}/api/news`, {
              headers: { 'Authorization': `Bearer ${t}` }
          });
          const newsItems = await r.json();
          this.renderNewsList(newsItems);
          
          const headerCount = document.getElementById('news-count-header');
          if(headerCount) headerCount.textContent = newsItems.length;
          
      } catch(e) {
          list.innerHTML = '<p class="text-outline" style="text-align:center;">Błąd pobierania.</p>';
      }
  }

  renderNewsList(items) {
      const list = document.getElementById('news-list');
      if(!list) return;
      list.innerHTML = '';
      
      if(items.length === 0) {
          list.innerHTML = '<p class="text-outline" style="text-align:center; padding:20px; color:#555;">Brak nowych wiadomości.</p>';
          return;
      }

      items.forEach(item => {
          const div = document.createElement('div');
          div.className = 'news-item';
          
          let iconClass = 'thumb-icon'; 
          let titleText = "System";
          let userAvatar = item.source_user_skin || '';
          
          if (item.type.includes('like_skin') || item.type.includes('like_prefab') || item.type.includes('like_part')) {
              titleText = "Inny gracz polubił Twojego BlockStar";
          } else if (item.type.includes('like_comment')) {
              titleText = "Inny gracz polubił Twój komentarz";
          } else {
              titleText = "Wiadomość systemowa";
          }
          
          div.innerHTML = `
              <div class="news-item-left">
                  <div class="${iconClass}"></div>
              </div>
              <div class="news-item-content">
                  <div class="news-item-title">${titleText}</div>
                  <div class="news-item-desc">
                      ${userAvatar ? `<div class="news-user-avatar" style="background-image: url('${userAvatar}')"></div>` : ''}
                      <span><b>${item.source_username || 'Gracz'}</b> i inni gracze</span>
                  </div>
              </div>
              <div class="news-item-right">
                  <div class="news-reward-info">
                      <img src="icons/icon-level.png" width="16"> ${item.reward_xp}
                  </div>
                  <button class="btn-claim-one text-outline">Odbierz!</button>
              </div>
          `;
          
          const btn = div.querySelector('.btn-claim-one');
          btn.onclick = () => this.claimReward(item.id);
          
          list.appendChild(div);
      });
  }

  async claimReward(newsId = null) {
      try {
          const t = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
          const r = await fetch(`${API_BASE_URL}/api/news/claim`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t}` },
              body: JSON.stringify({ newsId })
          });
          const d = await r.json();
          if (d.success) {
              this.updateCoinCounter(d.newCoins);
              this.updateLevelInfo(d.newLevel, d.newXp, d.maxXp);
              
              if(newsId) {
                  this.openNewsPanel(); // Odśwież listę
                  this.updatePendingRewards(Math.max(0, this.pendingNewsCount - 1));
                  this.showMessage("Odebrano nagrodę!", "success");
              } else {
                  this.updatePendingRewards(0);
                  document.getElementById('news-modal').style.display = 'none';
                  d.message = "Odebrano wszystkie nagrody!";
                  this.showRewardPanel(d);
              }
          } else {
              this.showMessage(d.message || "Błąd", "error");
          }
      } catch(e) { 
          console.error(e); 
          this.showMessage("Błąd sieci.", "error");
      }
  }

  async showItemDetails(item, type) {
      const modal = document.getElementById('skin-details-modal');
      if (!modal) return;
      
      this.currentDetailsId = item.id;
      this.currentDetailsType = type; 
      
      this.bringToFront(modal); // FIX: Na wierzch
      
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
      
      if(timeInfo) {
          let dateStr = "niedawno";
          if (item.created_at) {
              const date = new Date(item.created_at);
              if (!isNaN(date.getTime())) {
                  const now = new Date();
                  const diffDays = Math.floor(Math.abs(now - date) / (1000 * 60 * 60 * 24));
                  dateStr = diffDays === 0 ? "dzisiaj" : `${diffDays} dni temu`;
              }
          }
          timeInfo.textContent = dateStr;
      }

      if (btnComment) {
          const countSpan = btnComment.querySelector('.skin-btn-label');
          if(countSpan) countSpan.textContent = item.comments || "0";
          btnComment.onclick = () => {
              this.openItemComments(item.id, type);
          };
      }

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
              } else {
                  btnUse.style.display = 'none'; 
              }
          } 
          else if (type === 'part') {
              btnUse.onclick = () => {
                  this.closeAllPanels();
                  if (this.onUsePart) this.onUsePart(item);
              };
          }
          else if (type === 'prefab') {
              btnUse.onclick = () => {
                  this.closeAllPanels();
                  if (this.onUsePrefab) this.onUsePrefab(item);
              };
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
                      method: 'POST',
                      headers: { 'Authorization': `Bearer ${t}` }
                  });
                  const d = await r.json();
                  if (d.success) {
                      if(likesCount) likesCount.textContent = d.likes;
                  }
              } catch(e) { console.error(e); }
          };
      }

      this.init3DPreview(item.id, type);
      this.closeAllPanels(); 
      modal.style.display = 'flex';
  }

  async openItemComments(itemId, type) {
      const panel = document.getElementById('skin-comments-panel');
      if (!panel) return;
      
      this.bringToFront(panel); // FIX: Na wierzch
      panel.style.display = 'flex';
      const closeBtn = document.getElementById('close-comments-btn');
      if(closeBtn) closeBtn.onclick = () => { panel.style.display = 'none'; };

      this.loadItemComments(itemId, type);
      
      const submitBtn = document.getElementById('comment-submit-btn');
      const input = document.getElementById('comment-input');
      
      if(submitBtn) {
          submitBtn.onclick = null; 
          submitBtn.onclick = async () => {
              const text = input.value.trim();
              if(!text) return;
              const t = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
              const endpointType = type === 'skin' ? 'skins' : (type === 'part' ? 'parts' : 'prefabs');
              try {
                  const r = await fetch(`${API_BASE_URL}/api/${endpointType}/${itemId}/comments`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t}` },
                      body: JSON.stringify({ text })
                  });
                  if(r.ok) {
                      input.value = '';
                      this.loadItemComments(itemId, type);
                  }
              } catch(e) { console.error(e); }
          };
      }
  }

  async loadItemComments(itemId, type) {
      const container = document.querySelector('.comments-list-container');
      if(!container) return;
      container.innerHTML = '<p style="text-align:center; padding:10px;">Ładowanie...</p>';
      const t = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
      const endpointType = type === 'skin' ? 'skins' : (type === 'part' ? 'parts' : 'prefabs');
      const likeEndpoint = type === 'skin' ? 'skins' : (type === 'part' ? 'parts' : 'prefabs');

      try {
          const r = await fetch(`${API_BASE_URL}/api/${endpointType}/${itemId}/comments`, {
              headers: { 'Authorization': `Bearer ${t}` }
          });
          const comments = await r.json();
          container.innerHTML = '';
          if(comments.length === 0) {
              container.innerHTML = '<p style="text-align:center; padding:10px; color:#666;">Brak komentarzy.</p>';
              return;
          }
          comments.forEach(c => {
              const div = document.createElement('div');
              div.className = 'comment-item';
              const date = new Date(c.created_at);
              const now = new Date();
              const diffHours = Math.floor((now - date) / (1000 * 60 * 60));
              const timeStr = diffHours < 24 ? (diffHours === 0 ? "teraz" : `${diffHours}h temu`) : `${Math.floor(diffHours/24)}d temu`;
              div.innerHTML = `
                  <div class="comment-avatar" style="background-image: url('${c.current_skin_thumbnail || ''}')"></div>
                  <div class="comment-content">
                      <div class="comment-author">${c.username}</div>
                      <div class="comment-text">${c.text}</div>
                      <div class="comment-time">${timeStr}</div>
                  </div>
                  <div class="comment-actions">
                      <div class="comment-like-count">${c.likes || 0}</div>
                      <div class="comment-like-btn">❤</div>
                  </div>
              `;
              const likeBtn = div.querySelector('.comment-like-btn');
              likeBtn.onclick = async () => {
                  try {
                      const lr = await fetch(`${API_BASE_URL}/api/${likeEndpoint}/comments/${c.id}/like`, {
                          method: 'POST',
                          headers: { 'Authorization': `Bearer ${t}` }
                      });
                      const ld = await lr.json();
                      if(ld.success) {
                          div.querySelector('.comment-like-count').textContent = ld.likes;
                      }
                  } catch(e) {}
              };
              container.appendChild(div);
          });
      } catch(e) { container.innerHTML = '<p style="text-align:center;">Błąd.</p>'; }
  }

  async init3DPreview(itemId, type) {
      const container = document.getElementById('skin-preview-canvas');
      if (!container) return;
      if (this.skinPreviewAnimId) cancelAnimationFrame(this.skinPreviewAnimId);
      container.innerHTML = '';
      
      const width = container.clientWidth || 300;
      const height = container.clientHeight || 300;

      this.skinPreviewScene = new THREE.Scene();
      this.skinPreviewCamera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
      this.skinPreviewCamera.position.set(0, 2, 6); 
      this.skinPreviewCamera.lookAt(0, 0.5, 0);

      this.skinPreviewRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      this.skinPreviewRenderer.setSize(width, height);
      container.appendChild(this.skinPreviewRenderer.domElement);

      const amb = new THREE.AmbientLight(0xffffff, 0.8);
      this.skinPreviewScene.add(amb);
      const dir = new THREE.DirectionalLight(0xffffff, 0.6);
      dir.position.set(5, 10, 7);
      this.skinPreviewScene.add(dir);

      this.skinPreviewCharacter = new THREE.Group();
      
      if (type === 'skin' && typeof createBaseCharacter !== 'undefined') {
           createBaseCharacter(this.skinPreviewCharacter);
           this.skinPreviewCharacter.position.y = -0.8; 
      } else {
           this.skinPreviewCharacter.position.y = 0; 
      }
      
      this.skinPreviewScene.add(this.skinPreviewCharacter);

      let blocksData = null;
      if (type === 'skin') blocksData = await SkinStorage.loadSkinData(itemId);
      else if (type === 'prefab') blocksData = await PrefabStorage.loadPrefab(itemId);
      else if (type === 'part') blocksData = await HyperCubePartStorage.loadPart(itemId);

      if (blocksData) {
          const loader = new THREE.TextureLoader();
          const blockGroup = new THREE.Group();
          
          if (type === 'skin') {
              blockGroup.scale.setScalar(0.125); 
              blockGroup.position.y = 0.5; 
          } else {
              blockGroup.scale.setScalar(0.125); 
          }

          blocksData.forEach(b => {
              const geo = new THREE.BoxGeometry(1, 1, 1);
              const mat = new THREE.MeshLambertMaterial({ map: loader.load(b.texturePath) });
              const mesh = new THREE.Mesh(geo, mat);
              mesh.position.set(b.x, b.y, b.z);
              blockGroup.add(mesh);
          });
          
          this.skinPreviewCharacter.add(blockGroup);
      }
      
      this.skinPreviewCharacter.scale.setScalar(1.5);

      const animate = () => {
          this.skinPreviewAnimId = requestAnimationFrame(animate);
          if (this.skinPreviewCharacter) {
              this.skinPreviewCharacter.rotation.y += 0.01;
          }
          this.skinPreviewRenderer.render(this.skinPreviewScene, this.skinPreviewCamera);
      };
      animate();
  }

  async showDiscoverPanel(type, category = null) {
      const title=document.getElementById('discover-panel-title'); 
      const tabs=document.getElementById('discover-tabs'); 
      const list=document.getElementById('discover-list'); 
      if(!list) return; 
      
      this.openPanel('discover-panel'); // FIX: Używa teraz z-index boost
      
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
              if(tabAll) {
                  tabAll.classList.add('active');
                  tabAll.onclick = () => { tabMine.classList.remove('active'); tabAll.classList.add('active'); this.refreshDiscoveryList(category, 'all'); };
              }
              if(tabMine) {
                  tabMine.onclick = () => { tabAll.classList.remove('active'); tabMine.classList.add('active'); this.refreshDiscoveryList(category, 'mine'); };
              }
          }
          this.refreshDiscoveryList(category, 'all');
      }
  }

  async refreshDiscoveryList(type, mode) {
      const list=document.getElementById('discover-list'); 
      if(list) list.innerHTML='<p class="text-outline" style="text-align:center">Pobieranie...</p>'; 
      
      let items = [];
      try {
          if (type === 'skin') {
              items = mode === 'mine' ? await SkinStorage.getMySkins() : await SkinStorage.getAllSkins();
          } else if (type === 'prefab') {
              items = mode === 'mine' ? await PrefabStorage.getSavedPrefabsList() : await PrefabStorage.getAllPrefabs(); 
          } else if (type === 'part') {
              items = mode === 'mine' ? await HyperCubePartStorage.getSavedPartsList() : await HyperCubePartStorage.getAllParts();
          }

          this.populateDiscoverPanel(type, items, (item) => {
              this.showItemDetails(item, type);
          });
      } catch(e) {
          console.error(e);
          if(list) list.innerHTML='<p class="text-outline" style="text-align:center">Błąd połączenia.</p>';
      }
  }

  populateDiscoverPanel(type, items, onSelect) {
      const list=document.getElementById('discover-list'); 
      if(!list) return; 
      list.innerHTML=''; 
      
      if(!items || items.length===0){ 
          list.innerHTML='<p class="text-outline" style="text-align:center">Brak elementów.</p>'; 
          return; 
      } 
      
      items.forEach(item => { 
          const div=document.createElement('div'); 
          div.className='panel-item skin-list-item'; 
          div.style.display='flex'; 
          div.style.alignItems='center'; 
          div.style.padding='10px'; 
          
          const thumbContainer=document.createElement('div'); 
          thumbContainer.style.width='64px'; thumbContainer.style.height='64px'; 
          thumbContainer.style.backgroundColor='#000'; thumbContainer.style.borderRadius='8px'; 
          thumbContainer.style.marginRight='15px'; thumbContainer.style.overflow='hidden'; 
          thumbContainer.style.flexShrink='0'; thumbContainer.style.border='2px solid white'; 
          
          let thumbSrc = item.thumbnail;
          let label = item.name;
          if (type === 'worlds' && typeof item === 'object') {
               if(item.creator) label += ` (od ${item.creator})`;
          } else if (item.creator) {
               label += ` (od ${item.creator})`;
          }

          if(thumbSrc){ 
              const img=document.createElement('img'); img.src=thumbSrc; 
              img.style.width='100%'; img.style.height='100%'; img.style.objectFit='cover'; 
              thumbContainer.appendChild(img); 
          } else { 
              thumbContainer.textContent='?'; 
              thumbContainer.style.display='flex'; thumbContainer.style.alignItems='center'; 
              thumbContainer.style.justifyContent='center'; thumbContainer.style.color='white'; 
          } 
          
          const nameSpan=document.createElement('span'); 
          nameSpan.textContent=label; 
          nameSpan.className='text-outline'; 
          nameSpan.style.fontSize='18px'; 
          
          div.appendChild(thumbContainer); 
          div.appendChild(nameSpan); 
          
          div.onclick=()=>{ 
              if (type === 'worlds') {
                  this.closeAllPanels(); 
                  onSelect(item); 
              } else {
                  onSelect(item); 
              }
          }; 
          list.appendChild(div); 
      }); 
  }

  closeAllPanels() {
      if (this.skinPreviewAnimId) {
          cancelAnimationFrame(this.skinPreviewAnimId);
          this.skinPreviewAnimId = null;
      }
      document.querySelectorAll('.panel-modal').forEach(p => p.style.display='none');
      const skinModal = document.getElementById('skin-details-modal');
      if(skinModal) skinModal.style.display = 'none';
      const commentPanel = document.getElementById('skin-comments-panel');
      if(commentPanel) commentPanel.style.display = 'none';
  }

  // FIX: Użycie bringToFront w openPanel
  openPanel(id) { 
      const p = document.getElementById(id); 
      if(p) {
          this.bringToFront(p);
          p.style.display = 'flex'; 
      }
  }
  
  closePanel(id) { const p = document.getElementById(id); if(p) p.style.display = 'none'; }
  updateFPSToggleText(e) { const f=document.getElementById('fps-status'); if(f) f.textContent=e?'Włączony':'Wyłączony'; }
  updateCoinCounter(val) { const e=document.getElementById('coin-value'); if(e) e.textContent=val; }
  toggleMobileControls(s) { const m=document.getElementById('mobile-game-controls'); if(m) m.style.display=s?'block':'none'; }
  getButtonType(button) { if (button.classList.contains('btn-zagraj')) return 'zagraj'; if (button.classList.contains('btn-buduj')) return 'buduj'; if (button.classList.contains('btn-kup')) return 'kup'; if (button.classList.contains('btn-odkryj')) return 'odkryj'; if (button.classList.contains('btn-wiecej')) return 'wiecej'; return 'unknown'; }
  
  handleButtonClick(buttonType, buttonElement) {
    buttonElement.style.transform = 'translateY(-1px) scale(0.95)';
    setTimeout(() => { buttonElement.style.transform = ''; }, 150);
    if (buttonType === 'zagraj') { this.openPanel('play-choice-panel'); return; }
    if (buttonType === 'buduj') { this.openPanel('build-choice-panel'); return; }
    if (buttonType === 'odkryj') { this.openPanel('discover-choice-panel'); return; }
    if (buttonType === 'wiecej') { this.openPanel('more-options-panel'); return; }
    if (buttonType === 'kup') { this.openPanel('shop-panel'); if (this.onShopOpen) this.onShopOpen(); return; }
  }

  setupButtonHandlers() {
    document.querySelectorAll('.panel-close-button').forEach(btn => {
        btn.onclick = () => { 
            const p = btn.closest('.panel-modal') || btn.closest('#skin-comments-panel'); 
            if(p) p.style.display = 'none'; 
            if(p && p.id === 'skin-details-modal') {
                 if (this.skinPreviewAnimId) cancelAnimationFrame(this.skinPreviewAnimId);
            }
        };
    });
    
    // Obsługa zamknięcia panelu Więcej przez kliknięcie w tło
    document.getElementById('more-options-panel').addEventListener('click', (e) => {
        if (e.target.id === 'more-options-panel') {
            e.target.style.display = 'none';
        }
    });
    
    document.querySelectorAll('.panel-content').forEach(c => c.addEventListener('click', e => e.stopPropagation()));
    document.querySelectorAll('.game-btn').forEach(button => {
      const type = this.getButtonType(button);
      button.addEventListener('click', () => this.handleButtonClick(type, button));
    });

    const pBtn = document.getElementById('player-avatar-button'); if (pBtn) pBtn.onclick = () => { this.openPanel('player-preview-panel'); if (this.onPlayerAvatarClick) this.onPlayerAvatarClick(); };
    const friendsBtn = document.getElementById('btn-friends-open'); if (friendsBtn) { friendsBtn.onclick = () => { this.openPanel('friends-panel'); this.loadFriendsData(); }; }
    const topBarItems = document.querySelectorAll('.top-bar-item'); topBarItems.forEach(item => { if (item.textContent.includes('Poczta')) { item.onclick = () => { this.openPanel('mail-panel'); this.loadMailData(); }; } });
    const chatToggle = document.getElementById('chat-toggle-button'); if (chatToggle) chatToggle.addEventListener('click', () => this.handleChatClick());
    const superBtn = document.getElementById('victory-super-btn'); if (superBtn) { superBtn.onclick = () => { document.getElementById('victory-panel').style.display = 'none'; if (this.pendingRewardData) this.showRewardPanel(); else if (this.onExitParkour) this.onExitParkour(); }; }
    const homeBtn = document.getElementById('reward-btn-home'); if (homeBtn) { homeBtn.onclick = () => { this.hideVictory(); if (this.onExitParkour) this.onExitParkour(); }; }
    const replayBtn = document.getElementById('reward-btn-replay'); if (replayBtn) { replayBtn.onclick = () => { this.hideVictory(); if (this.onReplayParkour) this.onReplayParkour(); }; }
    const btnPlayParkour = document.getElementById('play-choice-parkour'); const btnPlayChat = document.getElementById('play-choice-chat'); if (btnPlayParkour) { btnPlayParkour.onclick = () => { this.closePanel('play-choice-panel'); this.showDiscoverPanel('worlds', 'parkour'); }; } if (btnPlayChat) { btnPlayChat.onclick = () => { this.closePanel('play-choice-panel'); this.showDiscoverPanel('worlds', 'creative'); }; }
    
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
    
    const tabBlocks = document.getElementById('shop-tab-blocks'); const tabAddons = document.getElementById('shop-tab-addons'); if (tabBlocks && tabAddons) { tabBlocks.onclick = () => { tabBlocks.classList.add('active'); tabAddons.classList.remove('active'); this.shopCurrentCategory = 'block'; this.refreshShopList(); }; tabAddons.onclick = () => { tabAddons.classList.add('active'); tabBlocks.classList.remove('active'); this.shopCurrentCategory = 'addon'; this.refreshShopList(); }; }
    const nameSubmitBtn = document.getElementById('name-submit-btn'); if (nameSubmitBtn) { nameSubmitBtn.onclick = () => { const i = document.getElementById('name-input-field'); const v = i.value.trim(); if(v && this.onNameSubmit) { this.onNameSubmit(v); document.getElementById('name-input-panel').style.display = 'none'; } else alert('Nazwa nie może być pusta!'); }; }
    
    // NEW GRID BUTTONS HANDLERS
    setClick('btn-open-news', () => { this.openNewsPanel(); });
    
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

    setClick('btn-news-claim-all', () => { this.claimReward(null); });
  }

  populateShop(allBlocks, isOwnedCallback) { this.allShopItems = allBlocks; this.shopIsOwnedCallback = isOwnedCallback; this.refreshShopList(); }
  refreshShopList() { const list = document.getElementById('shop-list'); if (!list) return; list.innerHTML = ''; const filteredItems = this.allShopItems.filter(item => { const cat = item.category || 'block'; return cat === this.shopCurrentCategory; }); if (filteredItems.length === 0) { list.innerHTML = '<p class="text-outline" style="text-align:center; padding:20px;">Brak elementów w tej kategorii.</p>'; return; } filteredItems.forEach(b => { const i = document.createElement('div'); i.className = 'shop-item'; const owned = this.shopIsOwnedCallback ? this.shopIsOwnedCallback(b.name) : false; i.innerHTML = `<div class="shop-item-info"><div class="shop-item-icon" style="background-image: url('${b.texturePath}')"></div><span class="shop-item-name text-outline">${b.name}</span></div><div class="shop-item-action">${owned ? `<span class="owned-label text-outline">Posiadane</span>` : `<button class="buy-btn" data-block-name="${b.name}">${b.cost} <img src="icons/icon-coin.png" style="width:20px;height:20px;vertical-align:middle;margin-left:5px;"></button>`}</div>`; list.appendChild(i); }); list.querySelectorAll('.buy-btn').forEach(btn => { btn.onclick = () => { const b = this.allShopItems.find(x => x.name === btn.dataset.blockName); if (b && this.onBuyBlock) this.onBuyBlock(b); }; }); }
  setupChatSystem() { this.setupChatInput(); }
  addChatMessage(m) { const c=document.querySelector('.chat-area'); if(c) { const el=document.createElement('div'); el.className='chat-message text-outline'; el.textContent=m; c.appendChild(el); c.scrollTop=c.scrollHeight; } }
  clearChat() { const c = document.querySelector('.chat-area'); if(c) c.innerHTML = ''; }
  handleChatClick() { const f=document.getElementById('chat-form'); if(f) f.style.display='flex'; const i=document.getElementById('chat-input-field'); if(i) i.focus(); }
  setupChatInput() { const f=document.getElementById('chat-form'); if(!f)return; f.addEventListener('submit', e=>{ e.preventDefault(); const i=document.getElementById('chat-input-field'); const v=i.value.trim(); if(v&&this.onSendMessage) this.onSendMessage(v); i.value=''; f.style.display='none'; }); }
  showMessage(text,type='info'){ const m=document.createElement('div'); m.style.cssText=`position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:${type==='success'?'#27ae60':(type==='error'?'#e74c3c':'#3498db')};color:white;padding:15px 25px;border-radius:10px;font-weight:bold;z-index:99999;box-shadow:0 6px 12px rgba(0,0,0,0.4);opacity:0;transition:all 0.3s ease;`; m.classList.add('text-outline'); m.textContent=text; document.body.appendChild(m); setTimeout(()=>{m.style.opacity='1';m.style.transform='translate(-50%,-50%) translateY(-10px)';},10); setTimeout(()=>{m.style.opacity='0';setTimeout(()=>{if(m.parentNode)m.parentNode.removeChild(m);},300);},2500); }
  setupFriendsSystem() { const tabs = document.querySelectorAll('#friends-panel .friends-tab'); tabs.forEach(tab => { tab.onclick = () => { tabs.forEach(t => t.classList.remove('active')); tab.classList.add('active'); const targetId = tab.getAttribute('data-tab'); const views = document.querySelectorAll('#friends-panel .friends-view'); views.forEach(view => { view.style.display = 'none'; view.classList.remove('active'); }); const targetView = document.getElementById(targetId); if (targetView) { targetView.style.display = 'flex'; targetView.classList.add('active'); } }; }); const searchBtn = document.getElementById('friends-search-btn'); if (searchBtn) { searchBtn.onclick = () => this.handleFriendSearch(); } }
  setupDiscoverTabs() { const tabAll = document.querySelector('#discover-tabs .friends-tab[data-tab="all"]'); const tabMine = document.querySelector('#discover-tabs .friends-tab[data-tab="mine"]'); const closeBtn = document.getElementById('discover-close-button'); if(tabAll) { tabAll.onclick = () => { if(tabMine) tabMine.classList.remove('active'); tabAll.classList.add('active'); this.refreshSkinList('all'); }; } if(tabMine) { tabMine.onclick = () => { if(tabAll) tabAll.classList.remove('active'); tabMine.classList.add('active'); this.refreshSkinList('mine'); }; } if(closeBtn) closeBtn.onclick = () => this.closeAllPanels(); }
  
  async loadFriendsData() { const t=localStorage.getItem('bsp_clone_jwt_token'); if(!t)return; const l=document.getElementById('friends-list'); if(l) l.innerHTML='<p class="text-outline" style="text-align:center;margin-top:20px;">Odświeżanie...</p>'; try{ const r=await fetch(`${API_BASE_URL}/api/friends`,{headers:{'Authorization':`Bearer ${t}`}}); if(r.ok){ const d=await r.json(); this.friendsList=d.friends; this.renderFriendsList(d.friends); this.renderRequestsList(d.requests); this.updateTopBarFriends(d.friends); } else if(l) l.innerHTML='<p class="text-outline" style="text-align:center;color:#e74c3c;">Błąd serwera.</p>'; } catch(e){ if(l) l.innerHTML='<p class="text-outline" style="text-align:center;color:#e74c3c;">Błąd sieci.</p>'; } }
  renderFriendsList(f){ const l=document.getElementById('friends-list'); if(!l)return; l.innerHTML=''; if(!f||f.length===0){ l.innerHTML='<p class="text-outline" style="text-align:center;margin-top:20px;">Brak przyjaciół.</p>'; return; } f.forEach(x=>{ const i=document.createElement('div'); i.className='friend-item'; const a=document.createElement('div'); a.className='friend-avatar'; if(x.current_skin_thumbnail) a.style.backgroundImage=`url(${x.current_skin_thumbnail})`; else { a.style.display='flex'; a.style.justifyContent='center'; a.style.alignItems='center'; a.textContent='👤'; a.style.color='white'; a.style.fontSize='24px'; } if(x.isOnline) a.style.borderColor='#2ed573'; else a.style.borderColor='#7f8c8d'; const n=document.createElement('div'); n.className='friend-info'; n.innerHTML=`<div class="text-outline" style="font-size:16px;">${x.username}</div><div style="font-size:12px;color:${x.isOnline?'#2ed573':'#ccc'}">${x.isOnline?'Online':'Offline'}</div>`; i.appendChild(a); i.appendChild(n); l.appendChild(i); }); }
  renderRequestsList(r){ const l=document.getElementById('friends-requests'); if(!l)return; l.innerHTML=''; if(!r||r.length===0){ l.innerHTML='<p class="text-outline" style="text-align:center;margin-top:20px;">Brak.</p>'; return; } r.forEach(x=>{ const i=document.createElement('div'); i.className='friend-item'; i.innerHTML=`<div class="friend-info text-outline" style="font-size:16px;">${x.username}</div><div class="friend-actions"><button class="action-btn btn-accept">Akceptuj</button></div>`; i.querySelector('.btn-accept').onclick=()=>this.acceptFriendRequest(x.request_id); l.appendChild(i); }); }
  async handleFriendSearch(){ const i=document.getElementById('friends-search-input'); const q=i.value.trim(); if(!q)return; const t=localStorage.getItem('bsp_clone_jwt_token'); const c=document.getElementById('friends-search-results'); c.innerHTML='<p class="text-outline" style="text-align:center;">Szukanie...</p>'; try{ const r=await fetch(`${API_BASE_URL}/api/friends/search`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${t}`},body:JSON.stringify({query:q})}); const d=await r.json(); c.innerHTML=''; if(d.length===0){ c.innerHTML='<p class="text-outline">Nikogo nie znaleziono.</p>'; return; } d.forEach(u=>{ const it=document.createElement('div'); it.className='friend-item'; const av=document.createElement('div'); av.className='friend-avatar'; if(u.current_skin_thumbnail){ av.style.backgroundImage=`url(${u.current_skin_thumbnail})`; av.style.cursor='pointer'; av.onclick=()=>this.showSkinPreviewFromUrl(u.current_skin_thumbnail); } else { av.style.display='flex'; av.style.justifyContent='center'; av.style.alignItems='center'; av.textContent='👤'; av.style.color='white'; av.style.fontSize='24px'; } const n=document.createElement('div'); n.className='friend-info text-outline'; n.textContent=u.username; const b=document.createElement('button'); b.className='action-btn btn-invite'; b.textContent='Dodaj'; b.onclick=()=>this.sendFriendRequest(u.id); it.appendChild(av); it.appendChild(n); it.appendChild(b); c.appendChild(it); }); } catch(e){ c.innerHTML='<p class="text-outline">Błąd.</p>'; } }
  async sendFriendRequest(tid){ const t=localStorage.getItem('bsp_clone_jwt_token'); try{ const r=await fetch(`${API_BASE_URL}/api/friends/request`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${t}`},body:JSON.stringify({targetUserId:tid})}); const d=await r.json(); if(r.ok) this.showMessage(d.message,'success'); else this.showMessage(d.message,'error'); } catch(e){ this.showMessage('Błąd sieci','error'); } }
  async acceptFriendRequest(rid){ const t=localStorage.getItem('bsp_clone_jwt_token'); try{ const r=await fetch(`${API_BASE_URL}/api/friends/accept`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${t}`},body:JSON.stringify({requestId:rid})}); const d=await r.json(); if(r.ok){ this.showMessage('Dodano!','success'); this.loadFriendsData(); } else this.showMessage(d.message,'error'); } catch(e){ this.showMessage('Błąd sieci','error'); } }
  updateTopBarFriends(f){ const c=document.getElementById('active-friends-container'); if(!c)return; c.innerHTML=''; const on=f.filter(x=>x.isOnline); on.forEach(fr=>{ const it=document.createElement('div'); it.className='active-friend-item'; const av=document.createElement('div'); av.className='active-friend-avatar'; if(fr.current_skin_thumbnail) av.style.backgroundImage=`url(${fr.current_skin_thumbnail})`; else { av.style.display='flex'; av.style.justifyContent='center'; av.style.alignItems='center'; av.textContent='👤'; av.style.color='white'; } av.onclick=()=>this.showSkinPreviewFromUrl(fr.current_skin_thumbnail); const nm=document.createElement('div'); nm.className='active-friend-name text-outline'; nm.textContent=fr.username; it.appendChild(av); it.appendChild(nm); c.appendChild(it); }); }
  showSkinPreviewFromUrl(url){ if(!url)return; const p=document.getElementById('player-preview-panel'); const c=document.getElementById('player-preview-renderer-container'); c.innerHTML=''; c.style.backgroundColor='#333'; const i=document.createElement('img'); i.src=url; i.style.width='100%'; i.style.height='100%'; i.style.objectFit='contain'; c.appendChild(i); this.openPanel('player-preview-panel'); }
  async loadMailData() { const t = localStorage.getItem('bsp_clone_jwt_token'); if (!t) return; const container = document.querySelector('.mail-conversations'); if (container) container.innerHTML = '<p class="text-outline" style="text-align:center;">Ładowanie...</p>'; try { const r = await fetch(`${API_BASE_URL}/api/messages`, { headers: { 'Authorization': `Bearer ${t}` } }); const messages = await r.json(); this.renderMailList(messages); } catch (e) { console.error(e); if (container) container.innerHTML = '<p class="text-outline" style="text-align:center;">Błąd.</p>'; } }
  renderMailList(messages) { const container = document.querySelector('.mail-conversations'); if (!container) return; container.innerHTML = ''; if (!messages || messages.length === 0) { container.innerHTML = '<p class="text-outline" style="text-align:center;">Brak wiadomości.</p>'; return; } messages.forEach(msg => { const div = document.createElement('div'); div.className = 'mail-item'; div.innerHTML = `<div class="text-outline" style="font-weight:bold;"></div><div class="msg-content" style="font-size:12px; color:#ddd; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"></div>`; div.querySelector('.text-outline').textContent = msg.other_username; div.querySelector('.msg-content').textContent = msg.message_text; div.onclick = () => { this.openConversation(msg.other_username); }; container.appendChild(div); }); }
  async openConversation(username) { const t = localStorage.getItem('bsp_clone_jwt_token'); if (!t) return; this.mailState.activeConversation = username; const panel = document.getElementById('mail-panel'); if (panel) panel.classList.add('view-chat'); const chatHeader = document.getElementById('mail-chat-username'); if (chatHeader) chatHeader.textContent = username; const msgsContainer = document.querySelector('.mail-chat-messages'); if (msgsContainer) msgsContainer.innerHTML = '<p style="text-align:center">Pobieranie...</p>'; try { const r = await fetch(`${API_BASE_URL}/api/messages/${username}`, { headers: { 'Authorization': `Bearer ${t}` } }); const history = await r.json(); this.renderChatHistory(history, username); } catch (e) { console.error(e); } }
  renderChatHistory(history, otherUser) { const container = document.querySelector('.mail-chat-messages'); if (!container) return; container.innerHTML = ''; const myName = localStorage.getItem('bsp_clone_player_name'); history.forEach(msg => { const div = document.createElement('div'); const isMine = msg.sender_username === myName; div.className = `mail-message ${isMine ? 'sent' : 'received'}`; div.textContent = msg.message_text; container.appendChild(div); }); container.scrollTop = container.scrollHeight; }
  async setupMailSystem() { const closeBtn = document.querySelector('#mail-panel .panel-close-button'); if (closeBtn) { closeBtn.onclick = () => { const panel = document.getElementById('mail-panel'); if (panel) { panel.style.display = 'none'; panel.classList.remove('view-chat'); } }; } if(!document.getElementById('new-mail-btn')) return; const t=localStorage.getItem('bsp_clone_jwt_token'); if(!t)return; const btn=document.getElementById('new-mail-btn'); btn.onclick=()=>{ this.mailState.activeConversation=null; const panel = document.getElementById('mail-panel'); if(panel) panel.classList.remove('view-chat'); const composer = document.getElementById('new-mail-composer'); if(composer) composer.style.display='flex'; const recipientInput = document.getElementById('new-mail-recipient'); if(recipientInput) recipientInput.value = ''; const textInput = document.getElementById('new-mail-text'); if(textInput) textInput.value = ''; }; const mailForm = document.getElementById('new-mail-form'); if(mailForm) { mailForm.onsubmit=(e)=>{ e.preventDefault(); const r=document.getElementById('new-mail-recipient').value.trim(); const x=document.getElementById('new-mail-text').value.trim(); if(r&&x&&this.onSendPrivateMessage) { this.onSendPrivateMessage(r,x); document.getElementById('new-mail-composer').style.display = 'none'; this.loadMailData(); } }; } const replyForm = document.getElementById('mail-reply-form'); if(replyForm) { replyForm.onsubmit=(e)=>{ e.preventDefault(); const input = document.getElementById('mail-reply-input'); const x=input.value.trim(); if(x && this.mailState.activeConversation && this.onSendPrivateMessage){ this.onSendPrivateMessage(this.mailState.activeConversation,x); input.value=''; const el=document.createElement('div'); el.className='mail-message sent'; el.textContent=x; const msgs = document.querySelector('.mail-chat-messages'); if(msgs) { msgs.appendChild(el); msgs.scrollTop = msgs.scrollHeight; } } }; } }
}