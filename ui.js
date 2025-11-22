import { SkinStorage } from './SkinStorage.js';
import { WorldStorage } from './WorldStorage.js';

const API_BASE_URL = 'https://hypercubes-nexus-server.onrender.com';

export class UIManager {
  constructor(onSendMessage) {
    this.onSendMessage = onSendMessage;
    this.isMobile = false;
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
    
    // Dane przyjaciół
    this.friendsList = [];
  }
  
  initialize(isMobile) {
    this.isMobile = isMobile;
    this.setupButtonHandlers();
    this.setupChatSystem();
    this.setupFriendsSystem();
    console.log('UI Manager initialized');
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

  updatePlayerName(name) {
    const nameDisplay = document.getElementById('player-name-display');
    if (nameDisplay) {
        nameDisplay.textContent = name;
    }
  }

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

  setupButtonHandlers() {
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
    document.querySelectorAll('.panel-content').forEach(content => {
        content.addEventListener('click', e => e.stopPropagation());
    });

    document.querySelectorAll('.game-btn').forEach(button => {
      const buttonType = this.getButtonType(button);
      button.addEventListener('click', () => this.handleButtonClick(buttonType, button));
    });

    const playerBtn = document.getElementById('player-avatar-button');
    if (playerBtn) playerBtn.onclick = () => { this.openPanel('player-preview-panel'); if (this.onPlayerAvatarClick) this.onPlayerAvatarClick(); };

    const chatToggle = document.getElementById('chat-toggle-button');
    if (chatToggle) chatToggle.addEventListener('click', () => this.handleChatClick());

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

    const sizeNewSmallBtn = document.getElementById('size-choice-new-small');
    const sizeNewMediumBtn = document.getElementById('size-choice-new-medium');
    const sizeNewLargeBtn = document.getElementById('size-choice-new-large');

    if (sizeNewSmallBtn) sizeNewSmallBtn.onclick = () => { this.closePanel('world-size-panel'); if (this.onWorldSizeSelected) this.onWorldSizeSelected(64); };
    if (sizeNewMediumBtn) sizeNewMediumBtn.onclick = () => { this.closePanel('world-size-panel'); if (this.onWorldSizeSelected) this.onWorldSizeSelected(128); };
    if (sizeNewLargeBtn) sizeNewLargeBtn.onclick = () => { this.closePanel('world-size-panel'); if (this.onWorldSizeSelected) this.onWorldSizeSelected(256); };

    const toggleFPSBtn = document.getElementById('toggle-fps-btn');
    if (toggleFPSBtn) toggleFPSBtn.onclick = () => { if(this.onToggleFPS) this.onToggleFPS(); };

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

  populateDiscoverPanel(type, items, onSelect) {
      const list = document.getElementById('discover-list');
      const title = document.getElementById('discover-panel-title');
      list.innerHTML = '';
      
      if (type === 'worlds') {
          title.textContent = 'Wybierz Świat';
          if (items.length === 0) {
              list.innerHTML = '<p style="text-align: center;">Brak zapisanych światów.</p>';
          }
          items.forEach(worldName => {
              const item = document.createElement('div');
              item.className = 'panel-item';
              item.textContent = worldName;
              item.onclick = () => { this.closeAllPanels(); onSelect(worldName); };
              list.appendChild(item);
          });
      } else if (type === 'skins') {
          title.textContent = 'Wybierz Skina';
          if (items.length === 0) {
              list.innerHTML = '<p style="text-align: center;">Brak zapisanych skinów.</p>';
          }
          items.forEach(skinName => {
              const item = document.createElement('div');
              item.className = 'panel-item skin-list-item';
              item.style.display = 'flex';
              item.style.alignItems = 'center';
              item.style.padding = '10px';
              
              const thumbContainer = document.createElement('div');
              thumbContainer.style.width = '64px';
              thumbContainer.style.height = '64px';
              thumbContainer.style.backgroundColor = '#000';
              thumbContainer.style.borderRadius = '8px';
              thumbContainer.style.marginRight = '15px';
              thumbContainer.style.overflow = 'hidden';
              thumbContainer.style.flexShrink = '0';
              thumbContainer.style.border = '2px solid white';
              
              const thumbData = SkinStorage.getThumbnail(skinName);
              if (thumbData) {
                  const img = document.createElement('img');
                  img.src = thumbData;
                  img.style.width = '100%';
                  img.style.height = '100%';
                  img.style.objectFit = 'cover';
                  thumbContainer.appendChild(img);
              } else {
                  thumbContainer.textContent = '?';
                  thumbContainer.style.display = 'flex';
                  thumbContainer.style.alignItems = 'center';
                  thumbContainer.style.justifyContent = 'center';
                  thumbContainer.style.color = 'white';
                  thumbContainer.style.fontSize = '24px';
              }
              
              const nameSpan = document.createElement('span');
              nameSpan.textContent = skinName;
              nameSpan.className = 'text-outline';
              nameSpan.style.fontSize = '18px';
              
              item.appendChild(thumbContainer);
              item.appendChild(nameSpan);
              
              item.onclick = () => { 
                  this.closeAllPanels(); 
                  onSelect(skinName); 
              };
              list.appendChild(item);
          });
      }
      this.openPanel('discover-panel');
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

      // Zakładki
      const tabs = document.querySelectorAll('.friends-tab');
      tabs.forEach(tab => {
          tab.onclick = () => {
              tabs.forEach(t => t.classList.remove('active'));
              document.querySelectorAll('.friends-view').forEach(v => v.classList.remove('active'));
              
              tab.classList.add('active');
              const viewId = tab.getAttribute('data-tab');
              document.getElementById(viewId).classList.add('active');
          };
      });

      // Szukaj
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
              // OBSŁUGA BŁĘDU SERWERA
              list.innerHTML = '<p class="text-outline" style="text-align:center; color:#e74c3c; margin-top:20px;">Błąd serwera. Spróbuj później.</p>';
              reqList.innerHTML = '';
          }
      } catch (err) {
          // OBSŁUGA BŁĘDU SIECI
          console.error("Błąd pobierania przyjaciół:", err);
          list.innerHTML = '<p class="text-outline" style="text-align:center; color:#e74c3c; margin-top:20px;">Błąd połączenia.</p>';
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
          
          if (!response.ok) throw new Error('Search failed');

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
              this.loadFriendsData(); // Odśwież wszystko
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