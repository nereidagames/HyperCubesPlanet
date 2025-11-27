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
    this.onSendPrivateMessage = null;
    this.onMessageSent = null;
    this.onMessageReceived = null;
    this.onEditNexusClick = null;
    
    this.friendsList = [];
    this.mailState = { conversations: [], activeConversation: null };

    // Sklep state
    this.shopCurrentCategory = 'block'; // 'block' lub 'addon'
    this.allShopItems = [];
    this.shopIsOwnedCallback = null;
  }
  
  initialize(isMobile) {
    this.isMobile = isMobile;
    console.log("Inicjalizacja UI...");
    try {
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

  // ... (Metody bez zmian: checkAdminPermissions, updatePlayerAvatar, updatePlayerName, openPanel, closePanel, closeAllPanels, updateFPSToggleText, updateCoinCounter, toggleMobileControls) ...

  checkAdminPermissions(username) { const admins=['nixox2','admin']; if(admins.includes(username)){ const l=document.querySelector('#more-options-panel .panel-list'); if(l&&!document.getElementById('admin-edit-nexus-btn')){ const b=document.createElement('div'); b.id='admin-edit-nexus-btn'; b.className='panel-item text-outline'; b.style.backgroundColor='#e67e22'; b.style.marginTop='10px'; b.textContent='🛠️ Edytuj Nexus'; b.onclick=()=>{ this.closeAllPanels(); if(this.onEditNexusClick) this.onEditNexusClick(); }; l.insertBefore(b,l.firstChild); } } }
  updatePlayerAvatar(thumbnail) { const a=document.querySelector('#player-avatar-button .player-avatar'); if(!a)return; if(thumbnail){ a.textContent=''; a.style.backgroundImage=`url(${thumbnail})`; a.style.backgroundSize='cover'; a.style.backgroundPosition='center'; a.style.backgroundColor='#4a90e2'; } else { a.style.backgroundImage='none'; a.textContent='👤'; } }
  updatePlayerName(name) { const n=document.getElementById('player-name-display'); if(n) n.textContent=name; }
  openPanel(id) { const p=document.getElementById(id); if(p) p.style.display='flex'; }
  closePanel(id) { const p=document.getElementById(id); if(p) p.style.display='none'; }
  closeAllPanels() { document.querySelectorAll('.panel-modal').forEach(p=>p.style.display='none'); }
  updateFPSToggleText(e) { const f=document.getElementById('fps-status'); if(f) f.textContent=e?'Włączony':'Wyłączony'; }
  updateCoinCounter(val) { const e=document.getElementById('coin-value'); if(e) e.textContent=val; }
  toggleMobileControls(s) { const m=document.getElementById('mobile-game-controls'); if(m) m.style.display=s?'block':'none'; }

  setupButtonHandlers() {
    document.querySelectorAll('.panel-close-button').forEach(btn => {
        btn.onclick = () => { const p = btn.closest('.panel-modal'); if(p) p.style.display = 'none'; };
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

    // Obsługa zakładek w sklepie
    const tabBlocks = document.getElementById('shop-tab-blocks');
    const tabAddons = document.getElementById('shop-tab-addons');
    if (tabBlocks && tabAddons) {
        tabBlocks.onclick = () => {
            tabBlocks.classList.add('active');
            tabAddons.classList.remove('active');
            this.shopCurrentCategory = 'block';
            this.refreshShopList();
        };
        tabAddons.onclick = () => {
            tabAddons.classList.add('active');
            tabBlocks.classList.remove('active');
            this.shopCurrentCategory = 'addon';
            this.refreshShopList();
        };
    }

    const nameSubmitBtn = document.getElementById('name-submit-btn');
    if (nameSubmitBtn) {
        nameSubmitBtn.onclick = () => {
            const i = document.getElementById('name-input-field');
            const v = i.value.trim();
            if(v && this.onNameSubmit) { this.onNameSubmit(v); document.getElementById('name-input-panel').style.display = 'none'; }
            else alert('Nazwa nie może być pusta!');
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

  // NOWA LOGIKA SKLEPU Z KATEGORIAMI
  populateShop(allBlocks, isOwnedCallback) {
      this.allShopItems = allBlocks;
      this.shopIsOwnedCallback = isOwnedCallback;
      this.refreshShopList();
  }

  refreshShopList() {
      const list = document.getElementById('shop-list');
      if (!list) return;
      list.innerHTML = '';

      // Filtrowanie po kategorii (domyślnie 'block')
      const filteredItems = this.allShopItems.filter(item => {
          const cat = item.category || 'block';
          return cat === this.shopCurrentCategory;
      });

      if (filteredItems.length === 0) {
          list.innerHTML = '<p class="text-outline" style="text-align:center; padding:20px;">Brak elementów w tej kategorii.</p>';
          return;
      }

      filteredItems.forEach(b => {
          const i = document.createElement('div'); 
          i.className = 'shop-item';
          const owned = this.shopIsOwnedCallback(b.name);
          
          i.innerHTML = `
              <div class="shop-item-info">
                  <div class="shop-item-icon" style="background-image: url('${b.texturePath}')"></div>
                  <span class="shop-item-name text-outline">${b.name}</span>
              </div>
              <div class="shop-item-action">
                  ${owned 
                      ? `<span class="owned-label text-outline">Posiadane</span>` 
                      : `<button class="buy-btn" data-block-name="${b.name}">${b.cost} <img src="icons/icon-coin.png" style="width:20px;height:20px;vertical-align:middle;margin-left:5px;"></button>`
                  }
              </div>`;
          list.appendChild(i);
      });

      list.querySelectorAll('.buy-btn').forEach(btn => { 
          btn.onclick = () => { 
              const b = this.allShopItems.find(x => x.name === btn.dataset.blockName); 
              if (b && this.onBuyBlock) this.onBuyBlock(b); 
          }; 
      });
  }

  // ... (Reszta metod bez zmian: chat, friends, discover, mail) ...
  setupChatSystem() { this.setupChatInput(); }
  addChatMessage(m) { const c=document.querySelector('.chat-area'); if(c) { const el=document.createElement('div'); el.className='chat-message text-outline'; el.textContent=m; c.appendChild(el); c.scrollTop=c.scrollHeight; } }
  clearChat() { const c = document.querySelector('.chat-area'); if(c) c.innerHTML = ''; }
  handleChatClick() { const f=document.getElementById('chat-form'); if(f) f.style.display='flex'; const i=document.getElementById('chat-input-field'); if(i) i.focus(); }
  setupChatInput() { const f=document.getElementById('chat-form'); if(!f)return; f.addEventListener('submit', e=>{ e.preventDefault(); const i=document.getElementById('chat-input-field'); const v=i.value.trim(); if(v&&this.onSendMessage) this.onSendMessage(v); i.value=''; f.style.display='none'; }); }
  showMessage(text,type='info'){ const m=document.createElement('div'); m.style.cssText=`position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:${type==='success'?'#27ae60':(type==='error'?'#e74c3c':'#3498db')};color:white;padding:15px 25px;border-radius:10px;font-weight:bold;z-index:10000;box-shadow:0 6px 12px rgba(0,0,0,0.4);opacity:0;transition:all 0.3s ease;`; m.classList.add('text-outline'); m.textContent=text; document.body.appendChild(m); setTimeout(()=>{m.style.opacity='1';m.style.transform='translate(-50%,-50%) translateY(-10px)';},10); setTimeout(()=>{m.style.opacity='0';setTimeout(()=>{if(m.parentNode)m.parentNode.removeChild(m);},300);},2500); }
  setupDiscoverTabs() { const tabs=document.querySelectorAll('#discover-tabs .friends-tab'); tabs.forEach(tab=>{ tab.onclick=()=>{ document.querySelectorAll('#discover-tabs .friends-tab').forEach(t=>t.classList.remove('active')); tab.classList.add('active'); const mode=tab.getAttribute('data-tab'); this.refreshSkinList(mode); }; }); const closeBtn=document.getElementById('discover-close-button'); if(closeBtn) closeBtn.onclick=()=>this.closeAllPanels(); }
  async showDiscoverPanel(type) { const title=document.getElementById('discover-panel-title'); const tabs=document.getElementById('discover-tabs'); const list=document.getElementById('discover-list'); if(!list)return; list.innerHTML='<p class="text-outline" style="text-align:center">Ładowanie...</p>'; this.openPanel('discover-panel'); if(type==='worlds'){ if(title) title.textContent='Wybierz Świat'; if(tabs) tabs.style.display='none'; const savedWorlds=await WorldStorage.getAllWorlds(); this.populateDiscoverPanel('worlds', savedWorlds, (worldItem)=>{ if(this.onWorldSelect) this.onWorldSelect(worldItem); }); } else if(type==='skins'){ if(title) title.textContent='Wybierz Skina'; if(tabs) { tabs.style.display='flex'; const defaultTab=document.querySelector('#discover-tabs .friends-tab[data-tab="all"]'); if(defaultTab) defaultTab.click(); else this.refreshSkinList('all'); } } }
  async refreshSkinList(mode) { const list=document.getElementById('discover-list'); if(list) list.innerHTML='<p class="text-outline" style="text-align:center">Pobieranie...</p>'; let skins=[]; if(mode==='mine') skins=await SkinStorage.getMySkins(); else skins=await SkinStorage.getAllSkins(); this.populateDiscoverPanel('skins', skins, (skinId, skinName, thumbnail, ownerId)=>{ if(this.onSkinSelect) this.onSkinSelect(skinId, skinName, thumbnail, ownerId); }); }
  populateDiscoverPanel(type, items, onSelect) { const list=document.getElementById('discover-list'); if(!list) return; list.innerHTML=''; if(!items||items.length===0){ list.innerHTML='<p class="text-outline" style="text-align:center">Brak elementów.</p>'; return; } items.forEach(item=>{ const div=document.createElement('div'); div.className='panel-item skin-list-item'; div.style.display='flex'; div.style.alignItems='center'; div.style.padding='10px'; const thumbContainer=document.createElement('div'); thumbContainer.style.width=(type==='worlds')?'80px':'64px'; thumbContainer.style.height='64px'; thumbContainer.style.backgroundColor='#000'; thumbContainer.style.borderRadius='8px'; thumbContainer.style.marginRight='15px'; thumbContainer.style.overflow='hidden'; thumbContainer.style.flexShrink='0'; thumbContainer.style.border='2px solid white'; let thumbSrc=null; let label=''; let skinId=null; let ownerId=null; if(type==='worlds'){ if(typeof item==='object'){ label=item.name; if(item.creator) label+=` (od ${item.creator})`; thumbSrc=item.thumbnail; } else { label=item; } } else { label=item.name; if(item.creator) label+=` (od ${item.creator})`; thumbSrc=item.thumbnail; skinId=item.id; ownerId=item.owner_id; } if(thumbSrc){ const img=document.createElement('img'); img.src=thumbSrc; img.style.width='100%'; img.style.height='100%'; img.style.objectFit='cover'; thumbContainer.appendChild(img); } else { thumbContainer.textContent=(type==='worlds')?'🌍':'?'; thumbContainer.style.display='flex'; thumbContainer.style.alignItems='center'; thumbContainer.style.justifyContent='center'; thumbContainer.style.color='white'; thumbContainer.style.fontSize='24px'; } const nameSpan=document.createElement('span'); nameSpan.textContent=label; nameSpan.className='text-outline'; nameSpan.style.fontSize='18px'; div.appendChild(thumbContainer); div.appendChild(nameSpan); div.onclick=()=>{ this.closeAllPanels(); if(type==='worlds') onSelect(item); else onSelect(skinId, item.name, item.thumbnail, ownerId); }; list.appendChild(div); }); }
  async loadFriendsData() { const t=localStorage.getItem('bsp_clone_jwt_token'); if(!t)return; const l=document.getElementById('friends-list'); if(l) l.innerHTML='<p class="text-outline" style="text-align:center;margin-top:20px;">Odświeżanie...</p>'; try{ const r=await fetch(`${API_BASE_URL}/api/friends`,{headers:{'Authorization':`Bearer ${t}`}}); if(r.ok){ const d=await r.json(); this.friendsList=d.friends; this.renderFriendsList(d.friends); this.renderRequestsList(d.requests); this.updateTopBarFriends(d.friends); } else if(l) l.innerHTML='<p class="text-outline" style="text-align:center;color:#e74c3c;">Błąd serwera.</p>'; } catch(e){ if(l) l.innerHTML='<p class="text-outline" style="text-align:center;color:#e74c3c;">Błąd sieci.</p>'; } }
  renderFriendsList(f){ const l=document.getElementById('friends-list'); if(!l)return; l.innerHTML=''; if(!f||f.length===0){ l.innerHTML='<p class="text-outline" style="text-align:center;margin-top:20px;">Brak przyjaciół.</p>'; return; } f.forEach(x=>{ const i=document.createElement('div'); i.className='friend-item'; const a=document.createElement('div'); a.className='friend-avatar'; if(x.current_skin_thumbnail) a.style.backgroundImage=`url(${x.current_skin_thumbnail})`; else { a.style.display='flex'; a.style.justifyContent='center'; a.style.alignItems='center'; a.textContent='👤'; a.style.color='white'; a.style.fontSize='24px'; } if(x.isOnline) a.style.borderColor='#2ed573'; else a.style.borderColor='#7f8c8d'; const n=document.createElement('div'); n.className='friend-info'; n.innerHTML=`<div class="text-outline" style="font-size:16px;">${x.username}</div><div style="font-size:12px;color:${x.isOnline?'#2ed573':'#ccc'}">${x.isOnline?'Online':'Offline'}</div>`; i.appendChild(a); i.appendChild(n); l.appendChild(i); }); }
  renderRequestsList(r){ const l=document.getElementById('friends-requests'); if(!l)return; l.innerHTML=''; if(!r||r.length===0){ l.innerHTML='<p class="text-outline" style="text-align:center;margin-top:20px;">Brak.</p>'; return; } r.forEach(x=>{ const i=document.createElement('div'); i.className='friend-item'; i.innerHTML=`<div class="friend-info text-outline" style="font-size:16px;">${x.username}</div><div class="friend-actions"><button class="action-btn btn-accept">Akceptuj</button></div>`; i.querySelector('.btn-accept').onclick=()=>this.acceptFriendRequest(x.request_id); l.appendChild(i); }); }
  async handleFriendSearch(){ const i=document.getElementById('friends-search-input'); const q=i.value.trim(); if(!q)return; const t=localStorage.getItem('bsp_clone_jwt_token'); const c=document.getElementById('friends-search-results'); c.innerHTML='<p class="text-outline" style="text-align:center;">Szukanie...</p>'; try{ const r=await fetch(`${API_BASE_URL}/api/friends/search`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${t}`},body:JSON.stringify({query:q})}); const d=await r.json(); c.innerHTML=''; if(d.length===0){ c.innerHTML='<p class="text-outline">Nikogo nie znaleziono.</p>'; return; } d.forEach(u=>{ const it=document.createElement('div'); it.className='friend-item'; const av=document.createElement('div'); av.className='friend-avatar'; if(u.current_skin_thumbnail){ av.style.backgroundImage=`url(${u.current_skin_thumbnail})`; av.style.cursor='pointer'; av.onclick=()=>this.showSkinPreviewFromUrl(u.current_skin_thumbnail); } else { av.style.display='flex'; av.style.justifyContent='center'; av.style.alignItems='center'; av.textContent='👤'; av.style.color='white'; av.style.fontSize='24px'; } const n=document.createElement('div'); n.className='friend-info text-outline'; n.textContent=u.username; const b=document.createElement('button'); b.className='action-btn btn-invite'; b.textContent='Dodaj'; b.onclick=()=>this.sendFriendRequest(u.id); it.appendChild(av); it.appendChild(n); it.appendChild(b); c.appendChild(it); }); } catch(e){ c.innerHTML='<p class="text-outline">Błąd.</p>'; } }
  async sendFriendRequest(tid){ const t=localStorage.getItem('bsp_clone_jwt_token'); try{ const r=await fetch(`${API_BASE_URL}/api/friends/request`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${t}`},body:JSON.stringify({targetUserId:tid})}); const d=await r.json(); if(r.ok) this.showMessage(d.message,'success'); else this.showMessage(d.message,'error'); } catch(e){ this.showMessage('Błąd sieci','error'); } }
  async acceptFriendRequest(rid){ const t=localStorage.getItem('bsp_clone_jwt_token'); try{ const r=await fetch(`${API_BASE_URL}/api/friends/accept`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${t}`},body:JSON.stringify({requestId:rid})}); const d=await r.json(); if(r.ok){ this.showMessage('Dodano!','success'); this.loadFriendsData(); } else this.showMessage(d.message,'error'); } catch(e){ this.showMessage('Błąd sieci','error'); } }
  updateTopBarFriends(f){ const c=document.getElementById('active-friends-container'); if(!c)return; c.innerHTML=''; const on=f.filter(x=>x.isOnline); on.forEach(fr=>{ const it=document.createElement('div'); it.className='active-friend-item'; const av=document.createElement('div'); av.className='active-friend-avatar'; if(fr.current_skin_thumbnail) av.style.backgroundImage=`url(${fr.current_skin_thumbnail})`; else { av.style.display='flex'; av.style.justifyContent='center'; av.style.alignItems='center'; av.textContent='👤'; av.style.color='white'; } av.onclick=()=>this.showSkinPreviewFromUrl(fr.current_skin_thumbnail); const nm=document.createElement('div'); nm.className='active-friend-name text-outline'; nm.textContent=fr.username; it.appendChild(av); it.appendChild(nm); c.appendChild(it); }); }
  showSkinPreviewFromUrl(url){ if(!url)return; const p=document.getElementById('player-preview-panel'); const c=document.getElementById('player-preview-renderer-container'); c.innerHTML=''; c.style.backgroundColor='#333'; const i=document.createElement('img'); i.src=url; i.style.width='100%'; i.style.height='100%'; i.style.objectFit='contain'; c.appendChild(i); this.openPanel('player-preview-panel'); }
  async setupMailSystem() { if(!document.getElementById('new-mail-btn')) return; const t=localStorage.getItem('bsp_clone_jwt_token'); if(!t)return; const btn=document.getElementById('new-mail-btn'); btn.onclick=()=>{ this.mailState.activeConversation=null; document.querySelector('.mail-chat-view').style.display='none'; document.getElementById('new-mail-composer').style.display='block'; if(document.getElementById('new-mail-form')) document.getElementById('new-mail-form').style.display='flex'; document.getElementById('new-mail-recipient').value=''; document.getElementById('new-mail-text').value=''; }; document.getElementById('new-mail-form').onsubmit=(e)=>{ e.preventDefault(); const r=document.getElementById('new-mail-recipient').value.trim(); const x=document.getElementById('new-mail-text').value.trim(); if(r&&x&&this.onSendPrivateMessage) this.onSendPrivateMessage(r,x); }; document.getElementById('mail-reply-form').onsubmit=(e)=>{ e.preventDefault(); const x=document.getElementById('mail-reply-input').value.trim(); if(x&&this.mailState.activeConversation&&this.onSendPrivateMessage){ this.onSendPrivateMessage(this.mailState.activeConversation,x); document.getElementById('mail-reply-input').value=''; const el=document.createElement('div'); el.className='mail-message sent'; el.textContent=x; document.querySelector('.mail-chat-messages').appendChild(el); } }; }
}