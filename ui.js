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
    this.onSkinSelect = null; 
    this.onWorldSelect = null; 
    
    this.friendsList = [];
    this.mailState = { conversations: [], activeConversation: null };
  }
  
  initialize(isMobile) {
    this.isMobile = isMobile;
    this.setupButtonHandlers();
    this.setupChatSystem();
    this.setupFriendsSystem();
    this.setupDiscoverTabs();
    this.setupMailSystem();
    console.log('UI Manager initialized');
  }

  // --- AVATAR ---
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
    if (nameDisplay) nameDisplay.textContent = name;
  }

  openPanel(id) { const p = document.getElementById(id); if(p) p.style.display = 'flex'; }
  closePanel(id) { const p = document.getElementById(id); if(p) p.style.display = 'none'; }
  closeAllPanels() { document.querySelectorAll('.panel-modal').forEach(p => p.style.display='none'); }
  updateFPSToggleText(e) { const f=document.getElementById('fps-status'); if(f) f.textContent=e?'Włączony':'Wyłączony'; }
  updateCoinCounter(val) { const e=document.getElementById('coin-value'); if(e) e.textContent=val; }
  toggleMobileControls(s) { const m=document.getElementById('mobile-game-controls'); if(m) m.style.display=s?'block':'none'; }

  // --- BUTTONS ---
  setupButtonHandlers() {
    document.querySelectorAll('.panel-close-button').forEach(btn => {
        btn.onclick = () => { btn.closest('.panel-modal').style.display = 'none'; };
    });
    document.querySelectorAll('.panel-content').forEach(c => c.addEventListener('click', e => e.stopPropagation()));
    document.querySelectorAll('.game-btn').forEach(button => {
      const type = this.getButtonType(button);
      button.addEventListener('click', () => this.handleButtonClick(type, button));
    });

    const pBtn = document.getElementById('player-avatar-button');
    if (pBtn) pBtn.onclick = () => { this.openPanel('player-preview-panel'); if (this.onPlayerAvatarClick) this.onPlayerAvatarClick(); };
    
    const chatToggle = document.getElementById('chat-toggle-button');
    if (chatToggle) chatToggle.addEventListener('click', () => this.handleChatClick());

    const setClick = (id, fn) => { const el = document.getElementById(id); if(el) el.onclick = fn; };

    setClick('build-choice-new-world', () => { this.closePanel('build-choice-panel'); this.openPanel('world-size-panel'); });
    setClick('build-choice-new-skin', () => { this.closePanel('build-choice-panel'); if(this.onSkinBuilderClick) this.onSkinBuilderClick(); });
    setClick('build-choice-new-prefab', () => { this.closePanel('build-choice-panel'); if(this.onPrefabBuilderClick) this.onPrefabBuilderClick(); });
    setClick('build-choice-new-part', () => { this.closePanel('build-choice-panel'); if(this.onPartBuilderClick) this.onPartBuilderClick(); });

    setClick('size-choice-new-small', () => { this.closePanel('world-size-panel'); if(this.onWorldSizeSelected) this.onWorldSizeSelected(64); });
    setClick('size-choice-new-medium', () => { this.closePanel('world-size-panel'); if(this.onWorldSizeSelected) this.onWorldSizeSelected(128); });
    setClick('size-choice-new-large', () => { this.closePanel('world-size-panel'); if(this.onWorldSizeSelected) this.onWorldSizeSelected(256); });

    setClick('toggle-fps-btn', () => { if(this.onToggleFPS) this.onToggleFPS(); });
    setClick('name-submit-btn', () => {
        const i = document.getElementById('name-input-field');
        const v = i.value.trim();
        if(v && this.onNameSubmit) { this.onNameSubmit(v); document.getElementById('name-input-panel').style.display = 'none'; }
        else alert('Nazwa nie może być pusta!');
    });
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
        item.innerHTML = `<div class="shop-item-info"><div class="shop-item-icon" style="background-image: url('${block.texturePath}')"></div><span class="shop-item-name text-outline">${block.name}</span></div><div class="shop-item-action">${isOwned ? `<span class="owned-label text-outline">Posiadane</span>` : `<button class="buy-btn" data-block-name="${block.name}">${block.cost} 🪙</button>`}</div>`;
        shopList.appendChild(item);
    });
    shopList.querySelectorAll('.buy-btn').forEach(btn => {
        btn.onclick = () => { const b = allBlocks.find(x => x.name === btn.dataset.blockName); if (b && this.onBuyBlock) this.onBuyBlock(b); };
    });
  }

  setupChatSystem() { this.setupChatInput(); }
  addChatMessage(m) { const c=document.querySelector('.chat-area'); if(c) { const el=document.createElement('div'); el.className='chat-message text-outline'; el.textContent=m; c.appendChild(el); c.scrollTop=c.scrollHeight; } }
  handleChatClick() { const f=document.getElementById('chat-form'); if(f) f.style.display='flex'; const i=document.getElementById('chat-input-field'); if(i) i.focus(); }
  setupChatInput() { const f=document.getElementById('chat-form'); if(!f)return; f.addEventListener('submit', e=>{e.preventDefault(); const i=document.getElementById('chat-input-field'); const v=i.value.trim(); if(v&&this.onSendMessage) this.onSendMessage(v); i.value=''; f.style.display='none'; }); }
  showMessage(text,type='info'){ const m=document.createElement('div'); m.style.cssText=`position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:${type==='success'?'#27ae60':(type==='error'?'#e74c3c':'#3498db')};color:white;padding:15px 25px;border-radius:10px;font-weight:bold;z-index:10000;box-shadow:0 6px 12px rgba(0,0,0,0.4);opacity:0;transition:all 0.3s ease;`; m.classList.add('text-outline'); m.textContent=text; document.body.appendChild(m); setTimeout(()=>{m.style.opacity='1';m.style.transform='translate(-50%,-50%) translateY(-10px)';},10); setTimeout(()=>{m.style.opacity='0';setTimeout(()=>{if(m.parentNode)m.parentNode.removeChild(m);},300);},2500); }

  // --- ODKRYWANIE (ZABEZPIECZONE) ---

  setupDiscoverTabs() {
      // Zabezpieczenie: jeśli taby nie istnieją w DOM, nic nie rób
      if (!document.getElementById('discover-tabs')) return;
      
      const tabs = document.querySelectorAll('#discover-tabs .friends-tab');
      tabs.forEach(tab => {
          tab.onclick = () => {
              document.querySelectorAll('#discover-tabs .friends-tab').forEach(t => t.classList.remove('active'));
              tab.classList.add('active');
              const mode = tab.getAttribute('data-tab');
              this.refreshSkinList(mode);
          };
      });
      const closeBtn = document.getElementById('discover-close-button');
      if(closeBtn) closeBtn.onclick = () => this.closeAllPanels();
  }

  showDiscoverPanel(type) {
    const title = document.getElementById('discover-panel-title');
    const tabs = document.getElementById('discover-tabs');
    const list = document.getElementById('discover-list');
    if (!title || !list) return; // Safety check

    list.innerHTML = '<p class="text-outline" style="text-align:center">Ładowanie...</p>';
    this.openPanel('discover-panel');

    if (type === 'worlds') {
        title.textContent = 'Wybierz Świat';
        if(tabs) tabs.style.display = 'none';
        const savedWorlds = WorldStorage.getSavedWorldsList();
        this.renderDiscoverList('worlds', savedWorlds);
    } else if (type === 'skins') {
        title.textContent = 'Wybierz Skina';
        if(tabs) {
            tabs.style.display = 'flex';
            const defaultTab = document.querySelector('#discover-tabs .friends-tab[data-tab="all"]');
            if(defaultTab) defaultTab.click();
            else this.refreshSkinList('all'); // Fallback jeśli taby są zbugowane w HTML
        } else {
            // Fallback jeśli HTML jest stary
            this.refreshSkinList('all');
        }
    }
  }

  async refreshSkinList(mode) {
      const list = document.getElementById('discover-list');
      if(list) list.innerHTML = '<p class="text-outline" style="text-align:center">Pobieranie...</p>';
      
      let skins = [];
      if (mode === 'mine') skins = await SkinStorage.getMySkins();
      else skins = await SkinStorage.getAllSkins();
      
      this.renderDiscoverList('skins', skins);
  }

  renderDiscoverList(type, items) {
      const list = document.getElementById('discover-list');
      if (!list) return;
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
          
          const thumbContainer = document.createElement('div');
          thumbContainer.style.width = (type === 'worlds') ? '80px' : '64px';
          thumbContainer.style.height = '64px';
          thumbContainer.style.backgroundColor = '#000';
          thumbContainer.style.borderRadius = '8px';
          thumbContainer.style.marginRight = '15px';
          thumbContainer.style.overflow = 'hidden';
          thumbContainer.style.flexShrink = '0';
          thumbContainer.style.border = '2px solid white';
          
          let thumbSrc = null;
          let label = '';
          let creatorId = null;
          
          if (type === 'worlds') {
              label = item; 
              thumbSrc = WorldStorage.getThumbnail(item);
          } else {
              label = item.name;
              if (item.creator) label += ` (od ${item.creator})`;
              thumbSrc = item.thumbnail;
              creatorId = item.owner_id; 
          }
          
          if (thumbSrc) {
              const img = document.createElement('img');
              img.src = thumbSrc;
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
          nameSpan.textContent = label;
          nameSpan.className = 'text-outline';
          nameSpan.style.fontSize = '18px';
          
          div.appendChild(thumbContainer);
          div.appendChild(nameSpan);
          
          div.onclick = () => {
              this.closeAllPanels();
              if (type === 'worlds') {
                   if (this.onWorldSelect) this.onWorldSelect(item);
              } else {
                   if (this.onSkinSelect) this.onSkinSelect(item.id, item.name, item.thumbnail, creatorId);
              }
          };
          list.appendChild(div);
      });
  }

  // --- PRZYJACIELE ---
  setupFriendsSystem() {
      const btnOpen = document.getElementById('btn-friends-open');
      if (btnOpen) {
          btnOpen.onclick = () => { this.openPanel('friends-panel'); this.loadFriendsData(); };
      }
      const tabs = document.querySelectorAll('.friends-tab');
      tabs.forEach(tab => {
          tab.onclick = () => {
              if(tab.parentElement.id === 'discover-tabs') return; // Ignoruj taby odkrywania
              tabs.forEach(t => { if(t.parentElement.id !== 'discover-tabs') t.classList.remove('active'); });
              document.querySelectorAll('.friends-view').forEach(v => v.classList.remove('active'));
              tab.classList.add('active');
              const viewId = tab.getAttribute('data-tab');
              const view = document.getElementById(viewId);
              if(view) view.classList.add('active');
              if (viewId === 'friends-list' || viewId === 'friends-requests') this.loadFriendsData();
          };
      });
      const searchBtn = document.getElementById('friends-search-btn');
      if (searchBtn) searchBtn.onclick = () => this.handleFriendSearch();
  }

  async loadFriendsData() {
      const token = localStorage.getItem('bsp_clone_jwt_token');
      if (!token) return;
      const list = document.getElementById('friends-list');
      if (list) list.innerHTML = '<p class="text-outline" style="text-align:center; margin-top:20px;">Odświeżanie...</p>';
      try {
          const response = await fetch(`${API_BASE_URL}/api/friends`, { headers: { 'Authorization': `Bearer ${token}` } });
          if (response.ok) {
              const data = await response.json();
              this.friendsList = data.friends;
              this.renderFriendsList(data.friends);
              this.renderRequestsList(data.requests);
              this.updateTopBarFriends(data.friends);
          } else if(list) list.innerHTML = '<p class="text-outline" style="text-align:center; color:#e74c3c;">Błąd serwera.</p>';
      } catch (err) { if(list) list.innerHTML = '<p class="text-outline" style="text-align:center; color:#e74c3c;">Błąd sieci.</p>'; }
  }

  renderFriendsList(friends) {
      const list = document.getElementById('friends-list');
      if(!list) return;
      list.innerHTML = '';
      if (!friends || friends.length === 0) { list.innerHTML = '<p class="text-outline" style="text-align:center; margin-top:20px;">Brak przyjaciół.</p>'; return; }
      friends.forEach(f => {
          const item = document.createElement('div');
          item.className = 'friend-item';
          const avatar = document.createElement('div');
          avatar.className = 'friend-avatar';
          if (f.current_skin_thumbnail) avatar.style.backgroundImage = `url(${f.current_skin_thumbnail})`;
          else { avatar.style.display='flex'; avatar.style.justifyContent='center'; avatar.style.alignItems='center'; avatar.textContent='👤'; avatar.style.color='white'; avatar.style.fontSize='24px'; }
          if (f.isOnline) avatar.style.borderColor = '#2ed573'; else avatar.style.borderColor = '#7f8c8d';
          const info = document.createElement('div');
          info.className = 'friend-info';
          info.innerHTML = `<div class="text-outline" style="font-size: 16px;">${f.username}</div><div style="font-size: 12px; color: ${f.isOnline ? '#2ed573' : '#ccc'};">${f.isOnline ? 'Online' : 'Offline'}</div>`;
          item.appendChild(avatar); item.appendChild(info); list.appendChild(item);
      });
  }

  renderRequestsList(requests) {
      const list = document.getElementById('friends-requests');
      if(!list) return;
      list.innerHTML = '';
      if (!requests || requests.length === 0) { list.innerHTML = '<p class="text-outline" style="text-align:center; margin-top:20px;">Brak.</p>'; return; }
      requests.forEach(r => {
          const item = document.createElement('div');
          item.className = 'friend-item';
          item.innerHTML = `<div class="friend-info text-outline" style="font-size: 16px;">${r.username}</div><div class="friend-actions"><button class="action-btn btn-accept">Akceptuj</button></div>`;
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
      const container = document.getElementById('friends-search-results');
      container.innerHTML = '<p class="text-outline" style="text-align:center;">Szukanie...</p>';
      try {
          const r = await fetch(`${API_BASE_URL}/api/friends/search`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ query }) });
          const res = await r.json();
          container.innerHTML = '';
          if (res.length === 0) { container.innerHTML = '<p class="text-outline">Nikogo nie znaleziono.</p>'; return; }
          res.forEach(u => {
              const item = document.createElement('div'); item.className = 'friend-item';
              const avatar = document.createElement('div'); avatar.className = 'friend-avatar';
              if (u.current_skin_thumbnail) { avatar.style.backgroundImage = `url(${u.current_skin_thumbnail})`; avatar.style.cursor='pointer'; avatar.onclick=()=>this.showSkinPreviewFromUrl(u.current_skin_thumbnail); }
              else { avatar.style.display='flex'; avatar.style.justifyContent='center'; avatar.style.alignItems='center'; avatar.textContent='👤'; avatar.style.color='white'; avatar.style.fontSize='24px'; }
              const info = document.createElement('div'); info.className = 'friend-info text-outline'; info.textContent = u.username;
              const btn = document.createElement('button'); btn.className = 'action-btn btn-invite'; btn.textContent = 'Dodaj'; btn.onclick = () => this.sendFriendRequest(u.id);
              item.appendChild(avatar); item.appendChild(info); item.appendChild(btn); container.appendChild(item);
          });
      } catch (e) { container.innerHTML = '<p class="text-outline">Błąd.</p>'; }
  }

  async sendFriendRequest(targetId) {
      const token = localStorage.getItem('bsp_clone_jwt_token');
      try { const r = await fetch(`${API_BASE_URL}/api/friends/request`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ targetUserId: targetId }) }); const d = await r.json(); if(r.ok) this.showMessage(d.message, 'success'); else this.showMessage(d.message, 'error'); } catch(e) { this.showMessage('Błąd.', 'error'); }
  }

  async acceptFriendRequest(requestId) {
      const token = localStorage.getItem('bsp_clone_jwt_token');
      try { const r = await fetch(`${API_BASE_URL}/api/friends/accept`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ requestId }) }); const d = await r.json(); if(r.ok) { this.showMessage('Dodano!', 'success'); this.loadFriendsData(); } else this.showMessage(d.message, 'error'); } catch(e) { this.showMessage('Błąd.', 'error'); }
  }

  updateTopBarFriends(friends) {
      const container = document.getElementById('active-friends-container');
      if (!container) return;
      container.innerHTML = '';
      const onlineFriends = friends.filter(f => f.isOnline);
      onlineFriends.forEach(f => {
          const item = document.createElement('div'); item.className = 'active-friend-item';
          const avatar = document.createElement('div'); avatar.className = 'active-friend-avatar';
          if (f.current_skin_thumbnail) avatar.style.backgroundImage = `url(${f.current_skin_thumbnail})`;
          else { avatar.style.display='flex'; avatar.style.justifyContent='center'; avatar.style.alignItems='center'; avatar.textContent='👤'; avatar.style.color='white'; }
          avatar.onclick = () => this.showSkinPreviewFromUrl(f.current_skin_thumbnail);
          const name = document.createElement('div'); name.className = 'active-friend-name text-outline'; name.textContent = f.username;
          item.appendChild(avatar); item.appendChild(name); container.appendChild(item);
      });
  }

  showSkinPreviewFromUrl(url) {
      if (!url) return;
      const panel = document.getElementById('player-preview-panel');
      const container = document.getElementById('player-preview-renderer-container');
      if(container) {
          container.innerHTML = '';
          container.style.backgroundColor = '#333';
          const img = document.createElement('img');
          img.src = url;
          img.style.width = '100%'; img.style.height = '100%'; img.style.objectFit = 'contain';
          container.appendChild(img);
      }
      this.openPanel('player-preview-panel');
  }

  // --- POCZTA (Wsparcie) ---
  async setupMailSystem() {
    if (!document.getElementById('new-mail-btn')) return; // Czekaj aż panel się zbuduje lub otworzy
    const token = localStorage.getItem('bsp_clone_jwt_token');
    const newMailBtn = document.getElementById('new-mail-btn');
    const chatView = document.querySelector('.mail-chat-view');
    const newMailComposer = document.getElementById('new-mail-composer');
    const newMailForm = document.getElementById('new-mail-form');

    if (newMailBtn) {
        newMailBtn.onclick = () => {
            this.mailState.activeConversation = null;
            if(chatView) chatView.style.display = 'none';
            if(newMailComposer) newMailComposer.style.display = 'block';
            if(newMailForm) {
                newMailForm.style.display = 'flex';
                newMailForm.onsubmit = (e) => {
                    e.preventDefault();
                    const r = document.getElementById('new-mail-recipient').value.trim();
                    const t = document.getElementById('new-mail-text').value.trim();
                    if (r && t && this.onSendMessage) { 
                        // Hack: używamy onSendMessage globalnego jako triggera, ale logika jest w main.js
                        // W main.js: this.multiplayerManager.sendPrivateMessage(r, t);
                        // Ponieważ UI nie ma dostępu do MM, musimy to obsłużyć tam.
                        // Ale w poprzedniej wersji dałem onsubmit w main.js. Tutaj tylko pomocniczo.
                    }
                };
            }
        };
    }
  }
}