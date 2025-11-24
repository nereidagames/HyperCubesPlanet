import { SkinStorage } from './SkinStorage.js';
import { WorldStorage } from './WorldStorage.js';

const API_BASE_URL = 'https://hypercubes-nexus-server.onrender.com';

export class UIManager {
  constructor(onSendMessage) {
    this.onSendMessage = onSendMessage; // To jest do czatu globalnego
    this.isMobile = false;
    
    // Callbacki do main.js
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
    
    // NOWY CALLBACK DO WIADOMOŚCI PRYWATNYCH
    this.onSendPrivateMessage = null; 
    
    // Dane wewnętrzne
    this.friendsList = [];
    this.mailState = {
        conversations: [],
        activeConversation: null
    };
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

  // --- AVATAR I NAZWA ---
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

  // --- PANELE ---
  openPanel(id) { const p = document.getElementById(id); if(p) p.style.display = 'flex'; }
  closePanel(id) { const p = document.getElementById(id); if(p) p.style.display = 'none'; }
  closeAllPanels() { document.querySelectorAll('.panel-modal').forEach(p => p.style.display='none'); }
  
  // --- UI GRY ---
  updateFPSToggleText(e) { const f=document.getElementById('fps-status'); if(f) f.textContent=e?'Włączony':'Wyłączony'; }
  updateCoinCounter(val) { const e=document.getElementById('coin-value'); if(e) e.textContent=val; }
  toggleMobileControls(s) { const m=document.getElementById('mobile-game-controls'); if(m) m.style.display=s?'block':'none'; }

  // --- PRZYCISKI ---
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

  // --- CZAT ---
  setupChatSystem() { this.setupChatInput(); }
  addChatMessage(m) { const c=document.querySelector('.chat-area'); if(c) { const el=document.createElement('div'); el.className='chat-message text-outline'; el.textContent=m; c.appendChild(el); c.scrollTop=c.scrollHeight; } }
  handleChatClick() { const f=document.getElementById('chat-form'); if(f) f.style.display='flex'; const i=document.getElementById('chat-input-field'); if(i) i.focus(); }
  setupChatInput() { const f=document.getElementById('chat-form'); if(!f)return; f.addEventListener('submit', e=>{e.preventDefault(); const i=document.getElementById('chat-input-field'); const v=i.value.trim(); if(v&&this.onSendMessage) this.onSendMessage(v); i.value=''; f.style.display='none'; }); }
  showMessage(text,type='info'){ const m=document.createElement('div'); m.style.cssText=`position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:${type==='success'?'#27ae60':(type==='error'?'#e74c3c':'#3498db')};color:white;padding:15px 25px;border-radius:10px;font-weight:bold;z-index:10000;box-shadow:0 6px 12px rgba(0,0,0,0.4);opacity:0;transition:all 0.3s ease;`; m.classList.add('text-outline'); m.textContent=text; document.body.appendChild(m); setTimeout(()=>{m.style.opacity='1';m.style.transform='translate(-50%,-50%) translateY(-10px)';},10); setTimeout(()=>{m.style.opacity='0';setTimeout(()=>{if(m.parentNode)m.parentNode.removeChild(m);},300);},2500); }

  // --- POCZTA (NAPRAWIONA) ---
  async setupMailSystem() {
    if (!document.getElementById('new-mail-btn')) return;
    const token = localStorage.getItem('bsp_clone_jwt_token');
    if (!token) return;

    const conversationsList = document.querySelector('.mail-conversations');
    const chatView = document.querySelector('.mail-chat-view');
    const chatUsername = document.getElementById('mail-chat-username');
    const chatMessages = document.querySelector('.mail-chat-messages');
    const replyForm = document.getElementById('mail-reply-form');
    const replyInput = document.getElementById('mail-reply-input');
    const newMailBtn = document.getElementById('new-mail-btn');
    const newMailComposer = document.getElementById('new-mail-composer');
    const newMailForm = document.getElementById('new-mail-form');

    const renderConversations = () => {
        conversationsList.innerHTML = '';
        this.mailState.conversations.forEach(convo => {
            const convoItem = document.createElement('div');
            convoItem.className = 'conversation-item';
            convoItem.textContent = convo.username;
            if (this.mailState.activeConversation === convo.username) convoItem.classList.add('active');
            convoItem.onclick = () => openConversation(convo.username);
            conversationsList.appendChild(convoItem);
        });
    };

    const openConversation = async (username) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/messages/${username}`, { headers: { 'Authorization': `Bearer ${token}` } });
            const messages = await response.json();
            
            chatUsername.textContent = username;
            chatMessages.innerHTML = '';
            const myUsername = localStorage.getItem('bsp_clone_player_name'); // Używamy klucza z local storage
            
            messages.forEach(msg => {
                const messageEl = document.createElement('div');
                messageEl.className = 'mail-message';
                messageEl.classList.add(msg.sender_username === myUsername ? 'sent' : 'received');
                messageEl.textContent = msg.message_text;
                chatMessages.appendChild(messageEl);
            });
            
            this.mailState.activeConversation = username;
            renderConversations();
            
            chatView.style.display = 'flex';
            newMailComposer.style.display = 'none';
            replyForm.style.display = 'flex';
            chatMessages.scrollTop = chatMessages.scrollHeight;
        } catch (error) { console.error(error); }
    };
    
    newMailBtn.onclick = () => {
        this.mailState.activeConversation = null;
        renderConversations();
        chatView.style.display = 'none';
        newMailComposer.style.display = 'block';
        if(newMailForm) newMailForm.style.display = 'flex';
        document.getElementById('new-mail-recipient').value = '';
        document.getElementById('new-mail-text').value = '';
    };

    // POPRAWKA: Używamy callbacka onSendPrivateMessage
    newMailForm.onsubmit = (e) => {
        e.preventDefault();
        const recipient = document.getElementById('new-mail-recipient').value.trim();
        const text = document.getElementById('new-mail-text').value.trim();
        
        if (recipient && text && this.onSendPrivateMessage) {
            this.onSendPrivateMessage(recipient, text);
        }
    };

    replyForm.onsubmit = (e) => {
        e.preventDefault();
        const text = replyInput.value.trim();
        
        if (text && this.mailState.activeConversation && this.onSendPrivateMessage) {
            this.onSendPrivateMessage(this.mailState.activeConversation, text);
            replyInput.value = '';
            
            // Optymistyczny update UI
            const messageEl = document.createElement('div');
            messageEl.className = 'mail-message sent';
            messageEl.textContent = text;
            chatMessages.appendChild(messageEl);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    };

    // Load conversations
    try {
        const response = await fetch(`${API_BASE_URL}/api/messages`, { headers: { 'Authorization': `Bearer ${token}` } });
        if(response.ok) {
            this.mailState.conversations = await response.json();
            renderConversations();
            chatView.style.display = 'flex';
            chatUsername.textContent = "Wybierz konwersację";
            chatMessages.innerHTML = '';
            newMailComposer.style.display = 'none';
            replyForm.style.display = 'none';
        }
    } catch (error) { console.error(error); }
  }

  // --- PRZYJACIELE ---
  setupFriendsSystem() { /* Skopiuj z poprzedniego ui.js - te sekcje się nie zmieniają */
    const btnOpen = document.getElementById('btn-friends-open');
    if (btnOpen) { btnOpen.onclick = () => { this.openPanel('friends-panel'); this.loadFriendsData(); }; }
    const tabs = document.querySelectorAll('.friends-tab');
    tabs.forEach(tab => { tab.onclick = () => { if(tab.parentElement.id === 'discover-tabs') return; tabs.forEach(t => { if(t.parentElement.id !== 'discover-tabs') t.classList.remove('active'); }); document.querySelectorAll('.friends-view').forEach(v => v.classList.remove('active')); tab.classList.add('active'); const viewId = tab.getAttribute('data-tab'); document.getElementById(viewId).classList.add('active'); if (viewId === 'friends-list' || viewId === 'friends-requests') this.loadFriendsData(); }; });
    const searchBtn = document.getElementById('friends-search-btn');
    if (searchBtn) searchBtn.onclick = () => this.handleFriendSearch();
  }
  async loadFriendsData() { const token=localStorage.getItem('bsp_clone_jwt_token'); if(!token)return; const list=document.getElementById('friends-list'); if(list) list.innerHTML='<p class="text-outline" style="text-align:center;margin-top:20px;">Odświeżanie...</p>'; try{ const res=await fetch(`${API_BASE_URL}/api/friends`,{headers:{'Authorization':`Bearer ${token}`}}); if(res.ok){ const data=await res.json(); this.friendsList=data.friends; this.renderFriendsList(data.friends); this.renderRequestsList(data.requests); this.updateTopBarFriends(data.friends); } else if(list) list.innerHTML='<p class="text-outline" style="text-align:center;color:#e74c3c;">Błąd serwera.</p>'; } catch(e){ if(list) list.innerHTML='<p class="text-outline" style="text-align:center;color:#e74c3c;">Błąd sieci.</p>'; } }
  renderFriendsList(f){ const l=document.getElementById('friends-list'); if(!l)return; l.innerHTML=''; if(!f||f.length===0){ l.innerHTML='<p class="text-outline" style="text-align:center;margin-top:20px;">Brak przyjaciół.</p>'; return; } f.forEach(x=>{ const i=document.createElement('div'); i.className='friend-item'; const a=document.createElement('div'); a.className='friend-avatar'; if(x.current_skin_thumbnail) a.style.backgroundImage=`url(${x.current_skin_thumbnail})`; else { a.style.display='flex'; a.style.justifyContent='center'; a.style.alignItems='center'; a.textContent='👤'; a.style.color='white'; a.style.fontSize='24px'; } if(x.isOnline) a.style.borderColor='#2ed573'; else a.style.borderColor='#7f8c8d'; const n=document.createElement('div'); n.className='friend-info'; n.innerHTML=`<div class="text-outline" style="font-size:16px;">${x.username}</div><div style="font-size:12px;color:${x.isOnline?'#2ed573':'#ccc'}">${x.isOnline?'Online':'Offline'}</div>`; i.appendChild(a); i.appendChild(n); l.appendChild(i); }); }
  renderRequestsList(r){ const l=document.getElementById('friends-requests'); if(!l)return; l.innerHTML=''; if(!r||r.length===0){ l.innerHTML='<p class="text-outline" style="text-align:center;margin-top:20px;">Brak.</p>'; return; } r.forEach(x=>{ const i=document.createElement('div'); i.className='friend-item'; i.innerHTML=`<div class="friend-info text-outline" style="font-size:16px;">${x.username}</div><div class="friend-actions"><button class="action-btn btn-accept">Akceptuj</button></div>`; i.querySelector('.btn-accept').onclick=()=>this.acceptFriendRequest(x.request_id); l.appendChild(i); }); }
  async handleFriendSearch(){ const i=document.getElementById('friends-search-input'); const q=i.value.trim(); if(!q)return; const t=localStorage.getItem('bsp_clone_jwt_token'); const c=document.getElementById('friends-search-results'); c.innerHTML='<p class="text-outline" style="text-align:center;">Szukanie...</p>'; try{ const r=await fetch(`${API_BASE_URL}/api/friends/search`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${t}`},body:JSON.stringify({query:q})}); const d=await r.json(); c.innerHTML=''; if(d.length===0){ c.innerHTML='<p class="text-outline">Nikogo nie znaleziono.</p>'; return; } d.forEach(u=>{ const it=document.createElement('div'); it.className='friend-item'; const av=document.createElement('div'); av.className='friend-avatar'; if(u.current_skin_thumbnail){ av.style.backgroundImage=`url(${u.current_skin_thumbnail})`; av.style.cursor='pointer'; av.onclick=()=>this.showSkinPreviewFromUrl(u.current_skin_thumbnail); } else { av.style.display='flex'; av.style.justifyContent='center'; av.style.alignItems='center'; av.textContent='👤'; av.style.color='white'; av.style.fontSize='24px'; } const n=document.createElement('div'); n.className='friend-info text-outline'; n.textContent=u.username; const b=document.createElement('button'); b.className='action-btn btn-invite'; b.textContent='Dodaj'; b.onclick=()=>this.sendFriendRequest(u.id); it.appendChild(av); it.appendChild(n); it.appendChild(b); c.appendChild(it); }); } catch(e){ c.innerHTML='<p class="text-outline">Błąd.</p>'; } }
  async sendFriendRequest(tid){ const t=localStorage.getItem('bsp_clone_jwt_token'); try{ const r=await fetch(`${API_BASE_URL}/api/friends/request`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${t}`},body:JSON.stringify({targetUserId:tid})}); const d=await r.json(); if(r.ok) this.showMessage(d.message,'success'); else this.showMessage(d.message,'error'); } catch(e){ this.showMessage('Błąd sieci','error'); } }
  async acceptFriendRequest(rid){ const t=localStorage.getItem('bsp_clone_jwt_token'); try{ const r=await fetch(`${API_BASE_URL}/api/friends/accept`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${t}`},body:JSON.stringify({requestId:rid})}); const d=await r.json(); if(r.ok){ this.showMessage('Dodano!','success'); this.loadFriendsData(); } else this.showMessage(d.message,'error'); } catch(e){ this.showMessage('Błąd sieci','error'); } }
  updateTopBarFriends(f){ const c=document.getElementById('active-friends-container'); if(!c)return; c.innerHTML=''; const on=f.filter(x=>x.isOnline); on.forEach(fr=>{ const it=document.createElement('div'); it.className='active-friend-item'; const av=document.createElement('div'); av.className='active-friend-avatar'; if(fr.current_skin_thumbnail) av.style.backgroundImage=`url(${fr.current_skin_thumbnail})`; else { av.style.display='flex'; av.style.justifyContent='center'; av.style.alignItems='center'; av.textContent='👤'; av.style.color='white'; } av.onclick=()=>this.showSkinPreviewFromUrl(fr.current_skin_thumbnail); const nm=document.createElement('div'); nm.className='active-friend-name text-outline'; nm.textContent=fr.username; it.appendChild(av); it.appendChild(nm); c.appendChild(it); }); }
  showSkinPreviewFromUrl(url){ if(!url)return; const p=document.getElementById('player-preview-panel'); const c=document.getElementById('player-preview-renderer-container'); c.innerHTML=''; c.style.backgroundColor='#333'; const i=document.createElement('img'); i.src=url; i.style.width='100%'; i.style.height='100%'; i.style.objectFit='contain'; c.appendChild(i); this.openPanel('player-preview-panel'); }

  // --- ODKRYWANIE (ZAKŁADKI) ---
  setupDiscoverTabs(){ const t=document.querySelectorAll('#discover-tabs .friends-tab'); t.forEach(x=>{ x.onclick=()=>{ document.querySelectorAll('#discover-tabs .friends-tab').forEach(y=>y.classList.remove('active')); x.classList.add('active'); const m=x.getAttribute('data-tab'); this.refreshSkinList(m); }; }); const c=document.getElementById('discover-close-button'); if(c) c.onclick=()=>this.closeAllPanels(); }
  async refreshSkinList(mode){ const l=document.getElementById('discover-list'); l.innerHTML='<p class="text-outline" style="text-align:center">Pobieranie...</p>'; let s=[]; if(mode==='mine') s=await SkinStorage.getMySkins(); else s=await SkinStorage.getAllSkins(); this.renderDiscoverList('skins',s); }
  renderDiscoverList(type,items){ const l=document.getElementById('discover-list'); if(!l)return; l.innerHTML=''; if(!items||items.length===0){ l.innerHTML='<p class="text-outline" style="text-align:center">Brak elementów.</p>'; return; } items.forEach(i=>{ const d=document.createElement('div'); d.className='panel-item skin-list-item'; d.style.display='flex'; d.style.alignItems='center'; d.style.padding='10px'; const tc=document.createElement('div'); tc.style.width=(type==='worlds')?'80px':'64px'; tc.style.height='64px'; tc.style.backgroundColor='#000'; tc.style.borderRadius='8px'; tc.style.marginRight='15px'; tc.style.overflow='hidden'; tc.style.flexShrink='0'; tc.style.border='2px solid white'; let src=null; let lbl=''; let cid=null; if(type==='worlds'){ lbl=i; src=WorldStorage.getThumbnail(i); } else { lbl=i.name; if(i.creator) lbl+=` (od ${i.creator})`; src=i.thumbnail; cid=i.owner_id; } if(src){ const img=document.createElement('img'); img.src=src; img.style.width='100%'; img.style.height='100%'; img.style.objectFit='cover'; tc.appendChild(img); } else { tc.textContent='?'; tc.style.display='flex'; tc.style.alignItems='center'; tc.style.justifyContent='center'; tc.style.color='white'; tc.style.fontSize='24px'; } const ns=document.createElement('span'); ns.textContent=lbl; ns.className='text-outline'; ns.style.fontSize='18px'; d.appendChild(tc); d.appendChild(ns); d.onclick=()=>{ this.closeAllPanels(); if(type==='worlds'){ if(this.onWorldSelect) this.onWorldSelect(i); } else { if(this.onSkinSelect) this.onSkinSelect(i.id,i.name,i.thumbnail,cid); } }; l.appendChild(d); }); }
}