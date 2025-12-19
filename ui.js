import * as THREE from 'three';
import { createBaseCharacter } from './character.js';
import { SkinStorage } from './SkinStorage.js';
import { WorldStorage } from './WorldStorage.js';
import { PrefabStorage } from './PrefabStorage.js';
import { HyperCubePartStorage } from './HyperCubePartStorage.js';
import { AUTH_HTML, HUD_HTML, BUILD_UI_HTML, MODALS_HTML, SKIN_DETAILS_HTML, SKIN_COMMENTS_HTML, DISCOVER_CHOICE_HTML, NEWS_MODAL_HTML, MAIL_MODAL_HTML, FRIENDS_MODAL_HTML } from './UITemplates.js';
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
    
    // Licznik warstw
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
      
      // Dodanie wszystkich szablonów do warstwy modali
      if (modalsLayer) {
          modalsLayer.innerHTML = MODALS_HTML + SKIN_DETAILS_HTML + SKIN_COMMENTS_HTML + DISCOVER_CHOICE_HTML + NEWS_MODAL_HTML + MAIL_MODAL_HTML + FRIENDS_MODAL_HTML;
      }
  }

  // Metoda do wyciągania okna na wierzch
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
      
      // Update badge w panelu Opcje
      if (badge) {
          if (this.pendingNewsCount > 0) {
              badge.textContent = this.pendingNewsCount;
              badge.style.display = 'flex'; 
          } else {
              badge.style.display = 'none';
          }
      }

      // Wizualny wskaźnik na przycisku "Więcej" (glow)
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
          this.bringToFront(panel);
          panel.style.display = 'flex';
      }
  }

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

  hideVictory() {
      document.getElementById('victory-panel').style.display = 'none';
      document.getElementById('reward-panel').style.display = 'none';
      this.pendingRewardData = null;
  }

  // --- FRIENDS SYSTEM REWORK ---
  setupFriendsSystem() {
      // 1. Obsługa zakładek (Moi przyjaciele, W tym świecie itd.)
      const tabs = document.querySelectorAll('.friend-nav-tab');
      tabs.forEach(tab => {
          tab.onclick = () => {
              // Deaktywuj wszystkie
              tabs.forEach(t => t.classList.remove('active'));
              document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

              // Aktywuj kliknięty
              tab.classList.add('active');
              const targetId = tab.getAttribute('data-target');
              const targetContent = document.getElementById(targetId);
              if (targetContent) targetContent.classList.add('active');
          };
      });

      // 2. Obsługa przycisku zamknięcia
      const closeBtn = document.getElementById('btn-friends-close-main');
      if (closeBtn) {
          closeBtn.onclick = () => {
              document.getElementById('friends-panel').style.display = 'none';
          };
      }

      // 3. Obsługa wyszukiwania w nowym panelu
      const searchBtn = document.getElementById('friends-search-btn-new');
      const searchInput = document.getElementById('friends-search-input-new');
      const clearBtn = document.getElementById('friends-search-clear');
      
      if (searchBtn) searchBtn.onclick = () => this.handleFriendSearch();
      if (clearBtn) clearBtn.onclick = () => {
          if(searchInput) searchInput.value = '';
          document.getElementById('search-results-grid-new').innerHTML = '';
      };
  }

  async loadFriendsData() {
      const t = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
      if (!t) return;
      
      try {
          const r = await fetch(`${API_BASE_URL}/api/friends`, { headers: { 'Authorization': `Bearer ${t}` } });
          if (r.ok) {
              const d = await r.json();
              this.friendsList = d.friends;
              this.renderFriendsUI(d.friends, d.requests);
              this.updateTopBarFriends(d.friends);
          }
      } catch (e) {
          console.error(e);
      }
  }

  renderFriendsUI(friends, requests) {
      // 1. Prośby
      const requestsSection = document.getElementById('section-requests');
      const requestsGrid = document.getElementById('requests-grid');
      
      if (requests && requests.length > 0) {
          requestsSection.style.display = 'block';
          requestsGrid.innerHTML = '';
          requests.forEach(req => {
              requestsGrid.appendChild(this.createFriendCard(req, 'accept'));
          });
      } else {
          requestsSection.style.display = 'none';
      }

      // 2. Podział Online/Offline
      const online = friends.filter(f => f.isOnline);
      const offline = friends.filter(f => !f.isOnline);

      // 3. Renderowanie Online
      document.getElementById('online-count').textContent = online.length;
      const onlineGrid = document.getElementById('friends-online-grid');
      onlineGrid.innerHTML = '';
      online.forEach(f => onlineGrid.appendChild(this.createFriendCard(f, 'chat')));

      // 4. Renderowanie Offline
      document.getElementById('offline-count').textContent = offline.length;
      const offlineGrid = document.getElementById('friends-offline-grid');
      offlineGrid.innerHTML = '';
      offline.forEach(f => offlineGrid.appendChild(this.createFriendCard(f, 'mail')));
  }

  createFriendCard(user, actionType) {
      const div = document.createElement('div');
      div.className = 'friend-card';
      
      let avatarUrl = user.current_skin_thumbnail ? `url('${user.current_skin_thumbnail}')` : "url('icons/avatar_placeholder.png')";
      
      // HTML KARTY
      div.innerHTML = `
          <div class="friend-card-header">${user.username}</div>
          <div class="friend-card-body" style="background-image: ${avatarUrl};">
              <div class="vip-badge"></div> <!-- Placeholder -->
          </div>
      `;
      
      // Przycisk akcji (zielony plus / dymek)
      const actionBtn = document.createElement('div');
      actionBtn.className = 'add-friend-btn';
      
      if (actionType === 'add') {
          // Ikona dodawania (domyślna w CSS)
          actionBtn.onclick = () => this.sendFriendRequest(user.id);
      } else if (actionType === 'accept') {
          // Zmień ikonę na "ptaszek"
          actionBtn.style.backgroundImage = "url('icons/icon-check.png')"; 
          actionBtn.onclick = () => this.acceptFriendRequest(user.request_id);
      } else if (actionType === 'chat' || actionType === 'mail') {
          // Ikona wiadomości
          actionBtn.style.backgroundImage = "url('icons/icon-chat.png')";
          actionBtn.onclick = () => {
              // Otwórz pocztę i czat z tym graczem
              this.openPanel('mail-panel');
              document.getElementById('mail-inbox-view').classList.add('hidden');
              document.getElementById('mail-conversation-view').classList.remove('hidden');
              document.getElementById('mail-conversation-view').style.display = 'flex';
              this.openConversation(user.username);
          };
      }
      
      // Kliknięcie w awatar -> Podgląd
      const body = div.querySelector('.friend-card-body');
      body.onclick = (e) => {
          if (e.target !== actionBtn) {
              this.showSkinPreviewFromUrl(user.current_skin_thumbnail);
          }
      };

      div.querySelector('.friend-card-body').appendChild(actionBtn);
      
      return div;
  }

  async handleFriendSearch() {
      const input = document.getElementById('friends-search-input-new');
      const query = input.value.trim();
      const grid = document.getElementById('search-results-grid-new');
      
      if (!query) return;
      
      grid.innerHTML = '<p style="color:white; grid-column: 1/-1; text-align:center;">Szukanie...</p>';
      
      const t = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
      try {
          const r = await fetch(`${API_BASE_URL}/api/friends/search`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t}` },
              body: JSON.stringify({ query })
          });
          const results = await r.json();
          
          grid.innerHTML = '';
          if (results.length === 0) {
              grid.innerHTML = '<p style="color:white; grid-column: 1/-1; text-align:center;">Nikogo nie znaleziono.</p>';
          } else {
              results.forEach(u => {
                  grid.appendChild(this.createFriendCard(u, 'add'));
              });
          }
      } catch (e) {
          grid.innerHTML = '<p style="color:red; grid-column: 1/-1; text-align:center;">Błąd sieci.</p>';
      }
  }

  // --- MAIL SYSTEM ---
  async loadMailData() {
      const t = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
      if (!t) return;
      
      const inboxList = document.getElementById('mail-inbox-list');
      if (inboxList) inboxList.innerHTML = '<p class="text-outline" style="text-align:center; padding:20px;">Ładowanie...</p>';
      
      try {
          const r = await fetch(`${API_BASE_URL}/api/messages`, { headers: { 'Authorization': `Bearer ${t}` } });
          const messages = await r.json();
          this.renderMailList(messages);
      } catch (e) {
          console.error(e);
          if (inboxList) inboxList.innerHTML = '<p class="text-outline" style="text-align:center; color:red;">Błąd.</p>';
      }
  }

  renderMailList(messages) {
      const list = document.getElementById('mail-inbox-list');
      if (!list) return;
      list.innerHTML = '';
      
      if (!messages || messages.length === 0) {
          list.innerHTML = '<p class="text-outline" style="text-align:center; padding:20px; color:#fff;">Skrzynka pusta.</p>';
          return;
      }
      
      messages.forEach(msg => {
          const div = document.createElement('div');
          div.className = 'mail-inbox-item';
          
          const date = new Date(msg.created_at);
          const now = new Date();
          const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
          let timeStr = diffDays < 1 ? "dzisiaj" : `${diffDays} dni temu`;
          if (diffDays > 30) timeStr = `${Math.floor(diffDays/30)} mies. temu`;

          div.innerHTML = `
            <div class="mail-item-avatar" style="background-image: url('icons/avatar_placeholder.png');"></div>
            <div class="mail-item-content">
                <div class="mail-item-user text-outline">${msg.other_username}</div>
                <div class="mail-item-preview">${msg.message_text}</div>
            </div>
            <div class="mail-item-time text-outline">${timeStr}</div>
          `;
          
          div.onclick = () => { this.openConversation(msg.other_username); };
          list.appendChild(div);
      });
  }

  async openConversation(username) {
      this.mailState.activeConversation = username;
      
      const inboxView = document.getElementById('mail-inbox-view');
      const chatView = document.getElementById('mail-conversation-view');
      const composer = document.getElementById('new-mail-composer');
      
      if(inboxView) inboxView.classList.add('hidden');
      if(composer) composer.classList.add('hidden');
      if(chatView) {
          chatView.classList.remove('hidden');
          chatView.style.display = 'flex';
      }

      const headerName = document.getElementById('mail-chat-username');
      if(headerName) headerName.textContent = username;

      const msgsContainer = document.getElementById('mail-chat-messages');
      if(msgsContainer) msgsContainer.innerHTML = '<p style="text-align:center; padding:20px;">Pobieranie...</p>';

      const t = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
      try {
          const r = await fetch(`${API_BASE_URL}/api/messages/${username}`, { headers: { 'Authorization': `Bearer ${t}` } });
          const history = await r.json();
          this.renderChatHistory(history, username);
      } catch (e) { console.error(e); }
  }

  renderChatHistory(history, otherUser) {
      const container = document.getElementById('mail-chat-messages');
      if (!container) return;
      container.innerHTML = '';
      
      const myName = localStorage.getItem(STORAGE_KEYS.PLAYER_NAME);
      
      history.forEach(msg => {
          const isMine = msg.sender_username === myName;
          
          const row = document.createElement('div');
          row.className = `chat-msg-row ${isMine ? 'sent' : 'received'}`;
          
          const avatar = `<div class="chat-avatar-small" style="background-image: url('icons/avatar_placeholder.png');"></div>`;
          const bubble = `<div class="chat-bubble">${msg.message_text}</div>`;
          
          if(isMine) {
              row.innerHTML = bubble + avatar;
          } else {
              row.innerHTML = avatar + bubble;
          }
          
          container.appendChild(row);
      });
      container.scrollTop = container.scrollHeight;
  }

  async setupMailSystem() {
      const topBarItems = document.querySelectorAll('.top-bar-item');
      topBarItems.forEach(item => { 
        if (item.textContent.includes('Poczta')) { 
            item.onclick = () => { 
                this.openPanel('mail-panel'); 
                document.getElementById('mail-inbox-view').classList.remove('hidden');
                document.getElementById('mail-conversation-view').classList.add('hidden');
                document.getElementById('new-mail-composer').classList.add('hidden');
                this.loadMailData(); 
            }; 
        } 
      });

      const btnCompose = document.getElementById('btn-mail-compose');
      if(btnCompose) {
          btnCompose.onclick = () => {
              document.getElementById('mail-inbox-view').classList.add('hidden');
              document.getElementById('mail-conversation-view').classList.add('hidden');
              const composer = document.getElementById('new-mail-composer');
              if(composer) {
                  composer.classList.remove('hidden');
                  composer.style.display = 'flex';
              }
          };
      }

      const btnBack = document.getElementById('btn-mail-back');
      if(btnBack) {
          btnBack.onclick = () => {
              document.getElementById('mail-conversation-view').classList.add('hidden');
              document.getElementById('mail-inbox-view').classList.remove('hidden');
              this.loadMailData(); 
          };
      }
      
      const btnCancel = document.getElementById('btn-cancel-new');
      if(btnCancel) {
          btnCancel.onclick = () => {
              document.getElementById('new-mail-composer').classList.add('hidden');
              document.getElementById('mail-inbox-view').classList.remove('hidden');
          };
      }

      const btnSendNew = document.getElementById('btn-send-new');
      if(btnSendNew) {
          btnSendNew.onclick = async () => {
              const recipient = document.getElementById('new-mail-recipient').value.trim();
              const text = document.getElementById('new-mail-text').value.trim();
              if(recipient && text && this.onSendPrivateMessage) {
                  this.onSendPrivateMessage(recipient, text);
                  document.getElementById('new-mail-composer').classList.add('hidden');
                  document.getElementById('mail-inbox-view').classList.remove('hidden');
                  this.loadMailData();
                  document.getElementById('new-mail-recipient').value = '';
                  document.getElementById('new-mail-text').value = '';
              }
          };
      }

      const btnReply = document.getElementById('mail-reply-btn');
      if(btnReply) {
          btnReply.onclick = async () => {
              const input = document.getElementById('mail-reply-input');
              const text = input.value.trim();
              if(text && this.mailState.activeConversation && this.onSendPrivateMessage) {
                  this.onSendPrivateMessage(this.mailState.activeConversation, text);
                  input.value = '';
                  
                  const container = document.getElementById('mail-chat-messages');
                  const row = document.createElement('div');
                  row.className = 'chat-msg-row sent';
                  row.innerHTML = `<div class="chat-bubble">${text}</div><div class="chat-avatar-small" style="background-image: url('icons/avatar_placeholder.png');"></div>`;
                  container.appendChild(row);
                  container.scrollTop = container.scrollHeight;
              }
          };
      }
  }

  // --- NEWS SYSTEM ---
  async openNewsPanel() {
      const panel = document.getElementById('news-modal');
      const list = document.getElementById('news-list');
      if(!panel || !list) return;
      
      this.bringToFront(panel); 
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
                  this.openNewsPanel(); 
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

  // --- GENERAL SETUP ---
  async refreshSkinList(mode) {
      await this.refreshDiscoveryList('skin', mode);
  }

  setupChatSystem() { this.setupChatInput(); }
  addChatMessage(m) { const c=document.querySelector('.chat-area'); if(c) { const el=document.createElement('div'); el.className='chat-message text-outline'; el.textContent=m; c.appendChild(el); c.scrollTop=c.scrollHeight; } }
  clearChat() { const c = document.querySelector('.chat-area'); if(c) c.innerHTML = ''; }
  handleChatClick() { const f=document.getElementById('chat-form'); if(f) f.style.display='flex'; const i=document.getElementById('chat-input-field'); if(i) i.focus(); }
  setupChatInput() { const f=document.getElementById('chat-form'); if(!f)return; f.addEventListener('submit', e=>{ e.preventDefault(); const i=document.getElementById('chat-input-field'); const v=i.value.trim(); if(v&&this.onSendMessage) this.onSendMessage(v); i.value=''; f.style.display='none'; }); }
  showMessage(text,type='info'){ const m=document.createElement('div'); m.style.cssText=`position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:${type==='success'?'#27ae60':(type==='error'?'#e74c3c':'#3498db')};color:white;padding:15px 25px;border-radius:10px;font-weight:bold;z-index:99999;box-shadow:0 6px 12px rgba(0,0,0,0.4);opacity:0;transition:all 0.3s ease;`; m.classList.add('text-outline'); m.textContent=text; document.body.appendChild(m); setTimeout(()=>{m.style.opacity='1';m.style.transform='translate(-50%,-50%) translateY(-10px)';},10); setTimeout(()=>{m.style.opacity='0';setTimeout(()=>{if(m.parentNode)m.parentNode.removeChild(m);},300);},2500); }
  setupDiscoverTabs() { const tabAll = document.querySelector('#discover-tabs .friends-tab[data-tab="all"]'); const tabMine = document.querySelector('#discover-tabs .friends-tab[data-tab="mine"]'); const closeBtn = document.getElementById('discover-close-button'); if(tabAll) { tabAll.onclick = () => { if(tabMine) tabMine.classList.remove('active'); tabAll.classList.add('active'); this.refreshSkinList('all'); }; } if(tabMine) { tabMine.onclick = () => { if(tabAll) tabAll.classList.remove('active'); tabMine.classList.add('active'); this.refreshSkinList('mine'); }; } if(closeBtn) closeBtn.onclick = () => this.closeAllPanels(); }
  
  async sendFriendRequest(tid){ const t=localStorage.getItem('bsp_clone_jwt_token'); try{ const r=await fetch(`${API_BASE_URL}/api/friends/request`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${t}`},body:JSON.stringify({targetUserId:tid})}); const d=await r.json(); if(r.ok) this.showMessage(d.message,'success'); else this.showMessage(d.message,'error'); } catch(e){ this.showMessage('Błąd sieci','error'); } }
  async acceptFriendRequest(rid){ const t=localStorage.getItem('bsp_clone_jwt_token'); try{ const r=await fetch(`${API_BASE_URL}/api/friends/accept`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${t}`},body:JSON.stringify({requestId:rid})}); const d=await r.json(); if(r.ok){ this.showMessage('Dodano!','success'); this.loadFriendsData(); } else this.showMessage(d.message,'error'); } catch(e){ this.showMessage('Błąd sieci','error'); } }
  updateTopBarFriends(f){ const c=document.getElementById('active-friends-container'); if(!c)return; c.innerHTML=''; const on=f.filter(x=>x.isOnline); on.forEach(fr=>{ const it=document.createElement('div'); it.className='active-friend-item'; const av=document.createElement('div'); av.className='active-friend-avatar'; if(fr.current_skin_thumbnail) av.style.backgroundImage=`url(${fr.current_skin_thumbnail})`; else { av.style.display='flex'; av.style.justifyContent='center'; av.style.alignItems='center'; av.textContent='👤'; av.style.color='white'; } av.onclick=()=>this.showSkinPreviewFromUrl(fr.current_skin_thumbnail); const nm=document.createElement('div'); nm.className='active-friend-name text-outline'; nm.textContent=fr.username; it.appendChild(av); it.appendChild(nm); c.appendChild(it); }); }
  showSkinPreviewFromUrl(url){ if(!url)return; const p=document.getElementById('player-preview-panel'); const c=document.getElementById('player-preview-renderer-container'); c.innerHTML=''; c.style.backgroundColor='#333'; const i=document.createElement('img'); i.src=url; i.style.width='100%'; i.style.height='100%'; i.style.objectFit='contain'; c.appendChild(i); this.openPanel('player-preview-panel'); }

  // FIX: Użycie bringToFront w openPanel
  openPanel(id) { 
      const p = document.getElementById(id); 
      if(p) {
          this.bringToFront(p);
          p.style.display = 'flex'; 
          
          if(id === 'friends-panel') this.loadFriendsData();
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
    const friendsBtn = document.getElementById('btn-friends-open'); if (friendsBtn) { friendsBtn.onclick = () => { this.openPanel('friends-panel'); }; }
    
    const topBarItems = document.querySelectorAll('.top-bar-item'); 
    // Fix: Poczta otwiera się przez setupMailSystem, ale tu można dodać fallback
    
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

  // --- MISSING METHODS ADDED ---
  updatePlayerName(name) {
      const nameDisplay = document.getElementById('player-name-display');
      if (nameDisplay) nameDisplay.textContent = name;
  }

  updatePlayerAvatar(thumbnail) {
      const avatarEl = document.querySelector('#player-avatar-button .player-avatar');
      if (!avatarEl) return;
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
                   this.closeAllPanels();
                   if (this.onEditNexusClick) this.onEditNexusClick();
               };
               grid.insertBefore(adminDiv, grid.firstChild);
          }
      }
  }
}
