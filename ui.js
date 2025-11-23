import { SkinStorage } from './SkinStorage.js';
import { WorldStorage } from './WorldStorage.js';

const API_BASE_URL = 'https://hypercubes-nexus-server.onrender.com';

export class UIManager {
  constructor(onSendMessage) {
    this.onSendMessage = onSendMessage;
    this.isMobile = false;
    
    // Callbacki (przypisywane w main.js)
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
    this.onSkinSelect = null; // Nowy callback do wybierania skina z serwera
    this.onWorldSelect = null; // Nowy callback do wybierania świata
    
    // Dane wewnętrzne
    this.friendsList = [];
  }
  
  initialize(isMobile) {
    this.isMobile = isMobile;
    this.setupButtonHandlers();
    this.setupChatSystem();
    this.setupFriendsSystem();
    this.setupDiscoverTabs(); // Obsługa zakładek w panelu Odkryj
    console.log('UI Manager initialized');
  }

  // --- ZARZĄDZANIE AVATAREM I NAZWĄ ---

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

  updatePlayerName(name) {
    const nameDisplay = document.getElementById('player-name-display');
    if (nameDisplay) {
        nameDisplay.textContent = name;
    }
  }

  // --- ZARZĄDZANIE PANELAMI ---

  openPanel(panelId) {
    const panel = document.getElementById(panelId);
    if (panel) {
        panel.style.display = 'flex';
    }
  }

  closePanel(panelId) {
    const panel = document.getElementById(panelId);
    if (panel) {
        panel.style.display = 'none';
    }
  }

  closeAllPanels() {
    document.querySelectorAll('.panel-modal').forEach(panel => {
      panel.style.display = 'none';
    });
  }
  
  // --- UI GRY (FPS, MONETY, STEROWANIE) ---

  updateFPSToggleText(isEnabled) {
    const fpsStatus = document.getElementById('fps-status');
    if (fpsStatus) {
      fpsStatus.textContent = isEnabled ? 'Włączony' : 'Wyłączony';
    }
  }

  updateCoinCounter(amount) {
    const coinValueElement = document.getElementById('coin-value');
    if (coinValueElement) {
      coinValueElement.textContent = amount;
    }
  }

  toggleMobileControls(showMobile) {
    const mobileControlsDiv = document.getElementById('mobile-game-controls');
    if(mobileControlsDiv) mobileControlsDiv.style.display = showMobile ? 'block' : 'none';
  }

  // --- OBSŁUGA PRZYCISKÓW ---

  setupButtonHandlers() {
    // Zamykanie paneli X
    document.querySelectorAll('.panel-close-button').forEach(btn => {
        const panel = btn.closest('.panel-modal');
        if (panel) {
            btn.onclick = () => { panel.style.display = 'none'; };
            panel.addEventListener('click', (e) => {
                if (e.target === panel) {
                    panel.style.display = 'none';
                }
            });
        }
    });
    // Zapobieganie zamykaniu przy kliknięciu w treść
    document.querySelectorAll('.panel-content').forEach(content => {
        content.addEventListener('click', e => e.stopPropagation());
    });

    // Główne przyciski menu
    document.querySelectorAll('.game-btn').forEach(button => {
      const buttonType = this.getButtonType(button);
      button.addEventListener('click', () => this.handleButtonClick(buttonType, button));
    });

    // Avatar gracza
    const playerBtn = document.getElementById('player-avatar-button');
    if (playerBtn) playerBtn.onclick = () => { this.openPanel('player-preview-panel'); if (this.onPlayerAvatarClick) this.onPlayerAvatarClick(); };

    // Czat toggle
    const chatToggle = document.getElementById('chat-toggle-button');
    if (chatToggle) chatToggle.addEventListener('click', () => this.handleChatClick());

    // Przyciski w panelu wyboru budowania
    const newWorldBtn = document.getElementById('build-choice-new-world');
    const newSkinBtn = document.getElementById('build-choice-new-skin');
    const newPrefabBtn = document.getElementById('build-choice-new-prefab');
    const newPartBtn = document.getElementById('build-choice-new-part');
    
    if (newWorldBtn) newWorldBtn.onclick = () => { 
        this.closePanel('build-choice-panel'); 
        this.openPanel('world-size-panel');
    };
    if (newSkinBtn) newSkinBtn.onclick = () => { 
        this.closePanel('build-choice-panel'); 
        if (this.onSkinBuilderClick) this.onSkinBuilderClick(); 
    };
    if (newPrefabBtn) newPrefabBtn.onclick = () => {
        this.closePanel('build-choice-panel');
        if (this.onPrefabBuilderClick) this.onPrefabBuilderClick();
    };
    if (newPartBtn) newPartBtn.onclick = () => {
        this.closePanel('build-choice-panel');
        if (this.onPartBuilderClick) this.onPartBuilderClick();
    };

    // Wybór rozmiaru świata
    const sizeNewSmallBtn = document.getElementById('size-choice-new-small');
    const sizeNewMediumBtn = document.getElementById('size-choice-new-medium');
    const sizeNewLargeBtn = document.getElementById('size-choice-new-large');

    if (sizeNewSmallBtn) sizeNewSmallBtn.onclick = () => { this.closePanel('world-size-panel'); if (this.onWorldSizeSelected) this.onWorldSizeSelected(64); };
    if (sizeNewMediumBtn) sizeNewMediumBtn.onclick = () => { this.closePanel('world-size-panel'); if (this.onWorldSizeSelected) this.onWorldSizeSelected(128); };
    if (sizeNewLargeBtn) sizeNewLargeBtn.onclick = () => { this.closePanel('world-size-panel'); if (this.onWorldSizeSelected) this.onWorldSizeSelected(256); };

    // Opcje
    const toggleFPSBtn = document.getElementById('toggle-fps-btn');
    if (toggleFPSBtn) toggleFPSBtn.onclick = () => { if(this.onToggleFPS) this.onToggleFPS(); };

    // Input nazwy
    const nameInputPanel = document.getElementById('name-input-panel');
    const nameInputField = document.getElementById('name-input-field');
    const nameSubmitBtn = document.getElementById('name-submit-btn');

    if (nameSubmitBtn) {
        nameSubmitBtn.onclick = () => {
            const name = nameInputField.value.trim();
            if (name && this.onNameSubmit) {
                this.onNameSubmit(name);
                nameInputPanel.style.display = 'none';
            } else {
                alert('Nazwa nie może być pusta!');
            }
        };
    }
  }

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

    if (buttonType === 'zagraj') { this.openPanel('discover-panel'); if (this.onPlayClick) this.onPlayClick(); return; }
    if (buttonType === 'buduj') { this.openPanel('build-choice-panel'); return; }
    if (buttonType === 'odkryj') { this.openPanel('discover-panel'); if (this.onDiscoverClick) this.onDiscoverClick(); return; }
    if (buttonType === 'wiecej') { this.openPanel('more-options-panel'); return; }
    if (buttonType === 'kup') { this.openPanel('shop-panel'); if (this.onShopOpen) this.onShopOpen(); return; }
  }

  // --- SKLEP ---

  populateShop(allBlocks, isOwnedCallback) {
    const shopList = document.getElementById('shop-list');
    if (!shopList) return;
    shopList.innerHTML = '';

    allBlocks.forEach(block => {
        const item = document.createElement('div');
        item.className = 'shop-item';
        const isOwned = isOwnedCallback(block.name);

        item.innerHTML = `
            <div class="shop-item-info">
                <div class="shop-item-icon" style="background-image: url('${block.texturePath}')"></div>
                <span class="shop-item-name text-outline">${block.name}</span>
            </div>
            <div class="shop-item-action">
                ${isOwned 
                    ? `<span class="owned-label text-outline">Posiadane</span>` 
                    : `<button class="buy-btn" data-block-name="${block.name}">${block.cost} 🪙</button>`
                }
            </div>
        `;
        shopList.appendChild(item);
    });

    shopList.querySelectorAll('.buy-btn').forEach(btn => {
        btn.onclick = () => {
            const blockName = btn.dataset.blockName;
            const blockToBuy = allBlocks.find(b => b.name === blockName);
            if (blockToBuy && this.onBuyBlock) {
                this.onBuyBlock(blockToBuy);
            }
        };
    });
  }

  // --- CZAT ---

  setupChatSystem() { this.setupChatInput(); }
  
  addChatMessage(message) {
    const chatArea = document.querySelector('.chat-area');
    if (!chatArea) return;
    const messageElement = document.createElement('div');
    messageElement.className = 'chat-message text-outline';
    messageElement.textContent = message;
    chatArea.appendChild(messageElement);
    chatArea.scrollTop = chatArea.scrollHeight;
  }
  
  handleChatClick() {
    const chatForm = document.getElementById('chat-form');
    if(chatForm) chatForm.style.display = 'flex';
    const chatInput = document.getElementById('chat-input-field');
    if(chatInput) chatInput.focus();
  }
  
  setupChatInput() {
    const chatForm = document.getElementById('chat-form');
    if(!chatForm) return;
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const chatInput = document.getElementById('chat-input-field');
      const message = chatInput.value.trim();
      if (message && this.onSendMessage) {
        this.onSendMessage(message);
      }
      chatInput.value = '';
      chatForm.style.display = 'none';
    });
  }
  
  showMessage(text, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: ${type === 'success' ? '#27ae60' : (type === 'error' ? '#e74c3c' : '#3498db')}; color: white; padding: 15px 25px; border-radius: 10px; font-weight: bold; z-index: 10000; box-shadow: 0 6px 12px rgba(0,0,0,0.4); opacity: 0; transition: all 0.3s ease;`;
    messageDiv.classList.add('text-outline');
    messageDiv.textContent = text;
    document.body.appendChild(messageDiv);
    setTimeout(() => {
      messageDiv.style.opacity = '1';
      messageDiv.style.transform = 'translate(-50%, -50%) translateY(-10px)';
    }, 10);
    setTimeout(() => {
      messageDiv.style.opacity = '0';
      setTimeout(() => { if (messageDiv.parentNode) messageDiv.parentNode.removeChild(messageDiv); }, 300);
    }, 2500);
  }

  // --- PANEL ODKRYJ (Worlds & Skins z miniaturkami i zakładkami) ---

  setupDiscoverTabs() {
      const tabs = document.querySelectorAll('#discover-tabs .friends-tab');
      tabs.forEach(tab => {
          tab.onclick = () => {
              document.querySelectorAll('#discover-tabs .friends-tab').forEach(t => t.classList.remove('active'));
              tab.classList.add('active');
              const mode = tab.getAttribute('data-tab'); // 'all' lub 'mine'
              this.refreshSkinList(mode);
          };
      });
      
      // Zamknij
      const closeBtn = document.getElementById('discover-close-button');
      if(closeBtn) closeBtn.onclick = () => this.closeAllPanels();
  }

  showDiscoverPanel(type) {
    const title = document.getElementById('discover-panel-title');
    const tabs = document.getElementById('discover-tabs');
    const list = document.getElementById('discover-list');
    list.innerHTML = '<p class="text-outline" style="text-align:center">Ładowanie...</p>';
    
    this.openPanel('discover-panel');

    if (type === 'worlds') {
        title.textContent = 'Wybierz Świat';
        tabs.style.display = 'none';
        
        // Światy (na razie lokalnie)
        const savedWorlds = WorldStorage.getSavedWorldsList();
        this.renderDiscoverList('worlds', savedWorlds);
        
    } else if (type === 'skins') {
        title.textContent = 'Wybierz Skina';
        tabs.style.display = 'flex';
        // Domyślnie kliknij 'Wszystkie' by pobrać listę
        const defaultTab = document.querySelector('#discover-tabs .friends-tab[data-tab="all"]');
        if(defaultTab) defaultTab.click();
    }
  }

  async refreshSkinList(mode) {
      const list = document.getElementById('discover-list');
      list.innerHTML = '<p class="text-outline" style="text-align:center">Pobieranie skinów...</p>';
      
      let skins = [];
      if (mode === 'mine') {
          skins = await SkinStorage.getMySkins();
      } else {
          skins = await SkinStorage.getAllSkins();
      }
      
      this.renderDiscoverList('skins', skins);
  }

  renderDiscoverList(type, items) {
      const list = document.getElementById('discover-list');
      list.innerHTML = '';
      
      if (!items || items.length === 0) {
          list.innerHTML = '<p class="text-outline" style="text-align:center">Brak elementów.</p>';
          return;
      }

      items.forEach(item => {
          const div = document.createElement('div');
          div.className = 'panel-item skin-list-item';
          div.style.display = 'flex';
          div.style.alignItems = 'center';
          div.style.padding = '10px';
          
          // Kontener miniaturki
          const thumbContainer = document.createElement('div');
          thumbContainer.style.width = (type === 'worlds') ? '80px' : '64px';
          thumbContainer.style.height = '64px';
          thumbContainer.style.backgroundColor = (type === 'worlds') ? '#87CEEB' : '#000';
          thumbContainer.style.borderRadius = '8px';
          thumbContainer.style.marginRight = '15px';
          thumbContainer.style.overflow = 'hidden';
          thumbContainer.style.flexShrink = '0';
          thumbContainer.style.border = '2px solid white';
          
          let thumbSrc = null;
          let label = '';
          
          if (type === 'worlds') {
              label = item; // item to string (nazwa świata)
              thumbSrc = WorldStorage.getThumbnail(item);
          } else {
              // item to obiekt skina z DB { id, name, thumbnail, creator }
              label = item.name;
              if (item.creator) label += ` (od ${item.creator})`;
              thumbSrc = item.thumbnail;
          }
          
          if (thumbSrc) {
              const img = document.createElement('img');
              img.src = thumbSrc;
              img.style.width = '100%';
              img.style.height = '100%';
              img.style.objectFit = 'cover';
              thumbContainer.appendChild(img);
          } else {
              thumbContainer.textContent = (type === 'worlds') ? '🌍' : '?';
              thumbContainer.style.display = 'flex';
              thumbContainer.style.alignItems = 'center';
              thumbContainer.style.justifyContent = 'center';
              thumbContainer.style.color = 'white';
              thumbContainer.style.fontSize = '24px';
          }
          
          const nameSpan = document.createElement('span');
          nameSpan.textContent = label;
          nameSpan.className = 'text-outline';
          nameSpan.style.fontSize = '18px';
          
          div.appendChild(thumbContainer);
          div.appendChild(nameSpan);
          
          // Akcja kliknięcia
          div.onclick = () => {
              this.closeAllPanels();
              if (type === 'worlds') {
                   if (this.onWorldSelect) this.onWorldSelect(item);
              } else {
                   // Wybrano skina (przekazujemy ID, nazwę i miniaturkę)
                   if (this.onSkinSelect) this.onSkinSelect(item.id, item.name, item.thumbnail);
              }
          };
          list.appendChild(div);
      });
  }

  // --- POPULATE PANEL (dla kompatybilności wstecznej z main.js) ---
  populateDiscoverPanel(type, items, onSelect) {
      // Ta metoda była używana wcześniej, teraz logika jest w renderDiscoverList
      // Ale jeśli main.js wywołuje to bezpośrednio dla czegoś innego, zostawiam wrapper
      this.renderDiscoverList(type, items);
      // Musimy ręcznie podpiąć onSelect bo renderDiscoverList korzysta z this.onSkinSelect
      // W nowej architekturze to nie jest potrzebne, ale dla bezpieczeństwa:
      if(type === 'worlds') this.onWorldSelect = onSelect;
      // Dla skinów onSkinSelect jest już inny (z ID), więc ta metoda jest deprecated dla skinów z serwera
  }

  // --- SYSTEM PRZYJACIÓŁ ---

  setupFriendsSystem() {
      const btnOpen = document.getElementById('btn-friends-open');
      if (btnOpen) {
          btnOpen.onclick = () => {
              this.openPanel('friends-panel');
              this.loadFriendsData();
          };
      }

      const tabs = document.querySelectorAll('.friends-tab');
      tabs.forEach(tab => {
          tab.onclick = () => {
              // Ignoruj, jeśli to zakładki w panelu Discover
              if(tab.parentElement.id === 'discover-tabs') return;

              tabs.forEach(t => {
                  if(t.parentElement.id !== 'discover-tabs') t.classList.remove('active');
              });
              document.querySelectorAll('.friends-view').forEach(v => v.classList.remove('active'));
              
              tab.classList.add('active');
              const viewId = tab.getAttribute('data-tab');
              const view = document.getElementById(viewId);
              if(view) view.classList.add('active');
              
              if (viewId === 'friends-list' || viewId === 'friends-requests') {
                  this.loadFriendsData();
              }
          };
      });

      const searchBtn = document.getElementById('friends-search-btn');
      if (searchBtn) {
          searchBtn.onclick = () => this.handleFriendSearch();
      }
  }

  async loadFriendsData() {
      const token = localStorage.getItem('bsp_clone_jwt_token');
      if (!token) return;

      const list = document.getElementById('friends-list');
      const reqList = document.getElementById('friends-requests');

      if (list) list.innerHTML = '<p class="text-outline" style="text-align:center; margin-top:20px;">Odświeżanie...</p>';

      try {
          const response = await fetch(`${API_BASE_URL}/api/friends`, {
              headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (response.ok) {
              const data = await response.json();
              this.friendsList = data.friends;
              
              this.renderFriendsList(data.friends);
              this.renderRequestsList(data.requests);
              this.updateTopBarFriends(data.friends);
          } else {
              if(list) list.innerHTML = '<p class="text-outline" style="text-align:center; color:#e74c3c; margin-top:20px;">Błąd serwera.</p>';
          }
      } catch (err) {
          if(list) list.innerHTML = '<p class="text-outline" style="text-align:center; color:#e74c3c; margin-top:20px;">Błąd połączenia.</p>';
      }
  }

  renderFriendsList(friends) {
      const list = document.getElementById('friends-list');
      list.innerHTML = '';
      
      if (!friends || friends.length === 0) {
          list.innerHTML = '<p class="text-outline" style="text-align:center; margin-top:20px;">Brak przyjaciół.</p>';
          return;
      }

      friends.forEach(f => {
          const item = document.createElement('div');
          item.className = 'friend-item';
          
          const avatar = document.createElement('div');
          avatar.className = 'friend-avatar';
          if (f.current_skin_thumbnail) {
              avatar.style.backgroundImage = `url(${f.current_skin_thumbnail})`;
          } else {
              avatar.style.display = 'flex';
              avatar.style.justifyContent = 'center';
              avatar.style.alignItems = 'center';
              avatar.textContent = '👤';
              avatar.style.color = 'white';
              avatar.style.fontSize = '24px';
          }
          
          if (f.isOnline) avatar.style.borderColor = '#2ed573'; 
          else avatar.style.borderColor = '#7f8c8d';

          const info = document.createElement('div');
          info.className = 'friend-info';
          info.innerHTML = `
            <div class="text-outline" style="font-size: 16px;">${f.username}</div>
            <div style="font-size: 12px; color: ${f.isOnline ? '#2ed573' : '#ccc'};">
                ${f.isOnline ? 'Online' : 'Offline'}
            </div>
          `;

          item.appendChild(avatar);
          item.appendChild(info);
          list.appendChild(item);
      });
  }

  renderRequestsList(requests) {
      const list = document.getElementById('friends-requests');
      list.innerHTML = '';
      
      if (!requests || requests.length === 0) {
          list.innerHTML = '<p class="text-outline" style="text-align:center; margin-top:20px;">Brak nowych zaproszeń.</p>';
          return;
      }

      requests.forEach(r => {
          const item = document.createElement('div');
          item.className = 'friend-item';
          item.innerHTML = `
            <div class="friend-info text-outline" style="font-size: 16px;">${r.username}</div>
            <div class="friend-actions">
                <button class="action-btn btn-accept">Akceptuj</button>
            </div>
          `;
          
          const btn = item.querySelector('.btn-accept');
          btn.onclick = () => this.acceptFriendRequest(r.request_id);
          
          list.appendChild(item);
      });
  }

  async handleFriendSearch() {
      const input = document.getElementById('friends-search-input');
      const query = input.value.trim();
      if (!query) return;
      
      const token = localStorage.getItem('bsp_clone_jwt_token');
      if (!token) return;

      const container = document.getElementById('friends-search-results');
      container.innerHTML = '<p class="text-outline" style="text-align:center; margin-top:20px;">Szukanie...</p>';

      try {
          const response = await fetch(`${API_BASE_URL}/api/friends/search`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ query })
          });
          
          const results = await response.json();
          container.innerHTML = '';
          
          if (results.length === 0) {
              container.innerHTML = '<p class="text-outline" style="margin-top:10px;">Nikogo nie znaleziono.</p>';
              return;
          }

          results.forEach(u => {
              const item = document.createElement('div');
              item.className = 'friend-item';
              
              const avatar = document.createElement('div');
              avatar.className = 'friend-avatar';
              if (u.current_skin_thumbnail) {
                  avatar.style.backgroundImage = `url(${u.current_skin_thumbnail})`;
                  avatar.style.cursor = 'pointer';
                  avatar.onclick = () => this.showSkinPreviewFromUrl(u.current_skin_thumbnail);
              } else {
                  avatar.style.display = 'flex';
                  avatar.style.justifyContent = 'center';
                  avatar.style.alignItems = 'center';
                  avatar.textContent = '👤';
                  avatar.style.color = 'white';
                  avatar.style.fontSize = '24px';
              }

              const info = document.createElement('div');
              info.className = 'friend-info text-outline';
              info.textContent = u.username;

              const btn = document.createElement('button');
              btn.className = 'action-btn btn-invite';
              btn.textContent = 'Dodaj';
              btn.onclick = () => this.sendFriendRequest(u.id);

              item.appendChild(avatar);
              item.appendChild(info);
              item.appendChild(btn);
              container.appendChild(item);
          });

      } catch (e) {
          console.error("Błąd szukania:", e);
          container.innerHTML = '<p class="text-outline" style="text-align:center; color:#e74c3c;">Błąd wyszukiwania.</p>';
      }
  }

  async sendFriendRequest(targetId) {
      const token = localStorage.getItem('bsp_clone_jwt_token');
      try {
          const res = await fetch(`${API_BASE_URL}/api/friends/request`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ targetUserId: targetId })
          });
          const data = await res.json();
          if (res.ok) this.showMessage(data.message, 'success');
          else this.showMessage(data.message, 'error');
      } catch(e) {
          this.showMessage('Błąd sieci.', 'error');
      }
  }

  async acceptFriendRequest(requestId) {
      const token = localStorage.getItem('bsp_clone_jwt_token');
      try {
          const res = await fetch(`${API_BASE_URL}/api/friends/accept`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ requestId })
          });
          const data = await res.json();
          if (res.ok) {
              this.showMessage('Dodano do znajomych!', 'success');
              this.loadFriendsData(); 
          } else {
              this.showMessage(data.message, 'error');
          }
      } catch(e) {
          this.showMessage('Błąd sieci.', 'error');
      }
  }

  updateTopBarFriends(friends) {
      const container = document.getElementById('active-friends-container');
      if (!container) return;
      container.innerHTML = '';
      
      const onlineFriends = friends.filter(f => f.isOnline);
      
      onlineFriends.forEach(f => {
          const item = document.createElement('div');
          item.className = 'active-friend-item';
          
          const avatar = document.createElement('div');
          avatar.className = 'active-friend-avatar';
          if (f.current_skin_thumbnail) {
              avatar.style.backgroundImage = `url(${f.current_skin_thumbnail})`;
          } else {
              avatar.style.display = 'flex';
              avatar.style.justifyContent = 'center';
              avatar.style.alignItems = 'center';
              avatar.textContent = '👤';
              avatar.style.color = 'white';
          }
          
          avatar.onclick = () => this.showSkinPreviewFromUrl(f.current_skin_thumbnail);

          const name = document.createElement('div');
          name.className = 'active-friend-name text-outline';
          name.textContent = f.username;

          item.appendChild(avatar);
          item.appendChild(name);
          container.appendChild(item);
      });
  }

  showSkinPreviewFromUrl(url) {
      if (!url) return;
      
      const panel = document.getElementById('player-preview-panel');
      const container = document.getElementById('player-preview-renderer-container');
      
      container.innerHTML = '';
      container.style.backgroundColor = '#333';
      
      const img = document.createElement('img');
      img.src = url;
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'contain';
      
      container.appendChild(img);
      this.openPanel('player-preview-panel');
  }
}