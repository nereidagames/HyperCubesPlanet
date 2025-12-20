import { API_BASE_URL, STORAGE_KEYS } from './Config.js';

const TEMPLATE = `
    <style>
        #friends-panel .panel-content {
            background: transparent !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            max-width: none !important;
        }

        .friends-full-container {
            width: 100%; height: 100%;
            background-color: #1e375a; 
            display: flex; flex-direction: column;
            position: relative;
            padding-top: 60px; 
        }

        .friends-nav-bar {
            background-color: #3498db;
            height: 60px;
            display: flex; align-items: center; justify-content: space-between;
            padding: 0 10px;
            border-bottom: 4px solid #2980b9;
        }
        
        .friends-back-btn {
            width: 50px; height: 50px;
            background: #e74c3c url('icons/icon-back.png') center/60% no-repeat;
            border: 2px solid white; border-radius: 10px;
            box-shadow: 0 4px 0 #c0392b; cursor: pointer;
            flex-shrink: 0; margin-right: 10px;
        }
        
        .friends-tabs-container {
            flex: 1; display: flex; gap: 5px; overflow-x: auto;
            align-items: center; height: 100%;
        }
        
        .friend-nav-tab {
            display: flex; flex-direction: column; align-items: center;
            justify-content: center;
            width: 80px; height: 50px;
            cursor: pointer; opacity: 0.7;
            transition: opacity 0.2s;
        }
        .friend-nav-tab.active { opacity: 1.0; border-bottom: 4px solid white; }
        
        .tab-icon { width: 30px; height: 30px; background-size: contain; background-position: center; background-repeat: no-repeat; }
        .tab-label { font-size: 10px; color: white; text-align: center; text-shadow: 1px 1px 0 #000; font-weight: bold; white-space: nowrap; }

        .friends-content-area {
            flex: 1; overflow-y: auto; overflow-x: hidden;
            background-color: #1e375a;
            padding: 10px;
            position: relative;
        }

        .friends-section-header {
            color: #00cec9;
            font-size: 18px; margin: 15px 0 5px 10px;
            text-shadow: 1.5px 1.5px 0 #000;
            display: flex; align-items: center; gap: 10px;
        }
        .status-dot { width: 12px; height: 12px; border-radius: 50%; border: 1px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5); }
        .status-dot.online { background: #2ecc71; }
        .status-dot.offline { background: #e74c3c; }

        .friends-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
            gap: 10px;
            padding: 0 5px;
        }
        
        .friend-card {
            background-color: #54a0ff;
            border-radius: 8px;
            overflow: hidden;
            display: flex; flex-direction: column;
            position: relative;
            box-shadow: 0 4px 0 #2e86de;
            height: 120px;
            border: 2px solid #2e86de;
        }
        
        .friend-card-header {
            background-color: #2e86de;
            color: white; font-size: 11px; text-align: center;
            padding: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
            font-weight: bold; text-shadow: 1px 1px 0 #000;
        }
        
        .friend-card-body {
            flex: 1; background-color: #54a0ff;
            background-image: url('icons/avatar_placeholder.png'); 
            background-size: cover; background-position: center;
            position: relative;
        }
        
        .vip-badge {
            position: absolute; top: 2px; right: 2px;
            width: 25px; height: 15px;
            background: url('icons/vip_badge.png') center/contain no-repeat; 
        }
        
        .add-friend-btn {
            position: absolute; bottom: 5px; right: 5px;
            width: 30px; height: 30px;
            background: #2ecc71 url('icons/icon-add-friend.png') center/60% no-repeat;
            border: 2px solid white; border-radius: 5px;
            box-shadow: 0 2px 0 #27ae60; cursor: pointer;
        }
        .add-friend-btn:active { transform: translateY(2px); box-shadow: none; }
        
        .search-bar-container {
            display: flex; gap: 5px; padding: 10px;
            background-color: #2e86de;
            align-items: center;
        }
        .search-input {
            flex: 1; height: 35px; border-radius: 5px; border: none; padding: 0 10px;
            font-family: inherit;
        }
        .search-btn {
            width: 40px; height: 35px; background: #3498db url('icons/szukaj.png') center/60% no-repeat;
            border-radius: 5px; border: 2px solid white; cursor: pointer;
        }
        .clear-btn {
            height: 35px; padding: 0 10px; background: #74b9ff; color: white;
            border-radius: 5px; border: 2px solid white; cursor: pointer; font-weight: bold; text-shadow: 1px 1px 0 #000;
        }
        
        .tab-content { display: none; }
        .tab-content.active { display: block; }
    </style>

    <div id="friends-panel" class="panel-modal" style="display:none;">
        <div class="panel-content">
            <div class="friends-full-container">
                <div class="friends-nav-bar">
                    <div id="btn-friends-close-main" class="friends-back-btn"></div>
                    <div class="friends-tabs-container">
                        <div class="friend-nav-tab active" data-target="tab-my-friends">
                            <div class="tab-icon" style="background-image: url('icons/icon-friends.png');"></div>
                            <span class="tab-label">Moi Przyjaciele</span>
                        </div>
                        <div class="friend-nav-tab" data-target="tab-world">
                            <div class="tab-icon" style="background-image: url('icons/wtymswiecie.png');"></div>
                            <span class="tab-label">W tym świecie</span>
                        </div>
                        <div class="friend-nav-tab" data-target="tab-games">
                            <div class="tab-icon" style="background-image: url('icons/grazinnymi.png');"></div>
                            <span class="tab-label">Gra z innymi</span>
                        </div>
                        <div class="friend-nav-tab" data-target="tab-search">
                            <div class="tab-icon" style="background-image: url('icons/szukaj.png');"></div>
                            <span class="tab-label">Szukaj</span>
                        </div>
                    </div>
                </div>

                <div class="friends-content-area">
                    <div id="tab-my-friends" class="tab-content active">
                        <div id="section-requests" style="display:none;">
                            <div class="friends-section-header">Prośby</div>
                            <div id="requests-grid" class="friends-grid"></div>
                        </div>
                        <div class="friends-section-header" style="opacity:0.5;">Wysłane</div>
                        <div class="friends-section-header">
                            <div class="status-dot online"></div>
                            Przyjaciele Online: <span id="online-count">0</span>
                        </div>
                        <div id="friends-online-grid" class="friends-grid"></div>
                        <div class="friends-section-header">
                            <div class="status-dot offline"></div>
                            Przyjaciele Offline: <span id="offline-count">0</span>
                        </div>
                        <div id="friends-offline-grid" class="friends-grid"></div>
                    </div>

                    <div id="tab-world" class="tab-content">
                        <p style="color:white; text-align:center; margin-top:50px;">Brak graczy w pobliżu.</p>
                    </div>
                    
                    <div id="tab-games" class="tab-content">
                        <p style="color:white; text-align:center; margin-top:50px;">Funkcja niedostępna.</p>
                    </div>

                    <div id="tab-search" class="tab-content">
                        <div class="search-bar-container">
                            <input id="friends-search-input-new" class="search-input" placeholder="gracz">
                            <div id="friends-search-btn-new" class="search-btn"></div>
                            <div id="friends-search-clear" class="clear-btn">Wyczyść</div>
                        </div>
                        <div id="search-results-grid-new" class="friends-grid" style="margin-top: 15px;"></div>
                    </div>

                </div>

            </div>
        </div>
    </div>
`;

export class FriendsManager {
    constructor(uiManager) {
        this.ui = uiManager;
        this.friendsList = [];
    }

    initialize() {
        const modalsLayer = document.getElementById('modals-layer');
        if (modalsLayer) {
            modalsLayer.insertAdjacentHTML('beforeend', TEMPLATE);
        }
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Zakładki
        const tabs = document.querySelectorAll('.friend-nav-tab');
        tabs.forEach(tab => {
            tab.onclick = () => {
                tabs.forEach(t => t.classList.remove('active'));
                document.querySelectorAll('#friends-panel .tab-content').forEach(c => c.classList.remove('active'));

                tab.classList.add('active');
                const targetId = tab.getAttribute('data-target');
                const targetContent = document.getElementById(targetId);
                if (targetContent) targetContent.classList.add('active');
            };
        });

        // Zamknięcie
        const closeBtn = document.getElementById('btn-friends-close-main');
        if (closeBtn) closeBtn.onclick = () => this.close();

        // Wyszukiwanie
        const searchBtn = document.getElementById('friends-search-btn-new');
        const clearBtn = document.getElementById('friends-search-clear');
        if (searchBtn) searchBtn.onclick = () => this.handleFriendSearch();
        if (clearBtn) clearBtn.onclick = () => {
            const input = document.getElementById('friends-search-input-new');
            if(input) input.value = '';
            document.getElementById('search-results-grid-new').innerHTML = '';
        };
    }

    open() {
        const panel = document.getElementById('friends-panel');
        if (panel) {
            this.ui.bringToFront(panel);
            panel.style.display = 'flex';
            this.loadFriendsData();
        }
    }

    close() {
        const panel = document.getElementById('friends-panel');
        if (panel) panel.style.display = 'none';
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
                // Opcjonalnie: aktualizuj też małą listę w HUD
                if (this.ui.updateTopBarFriends) this.ui.updateTopBarFriends(d.friends);
            }
        } catch (e) {
            console.error("Błąd pobierania przyjaciół:", e);
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

        // 3. Renderowanie
        document.getElementById('online-count').textContent = online.length;
        const onlineGrid = document.getElementById('friends-online-grid');
        onlineGrid.innerHTML = '';
        online.forEach(f => onlineGrid.appendChild(this.createFriendCard(f, 'chat')));

        document.getElementById('offline-count').textContent = offline.length;
        const offlineGrid = document.getElementById('friends-offline-grid');
        offlineGrid.innerHTML = '';
        offline.forEach(f => offlineGrid.appendChild(this.createFriendCard(f, 'mail')));
    }

    createFriendCard(user, actionType) {
        const div = document.createElement('div');
        div.className = 'friend-card';
        
        let avatarUrl = user.current_skin_thumbnail ? `url('${user.current_skin_thumbnail}')` : "url('icons/avatar_placeholder.png')";
        
        div.innerHTML = `
            <div class="friend-card-header">${user.username}</div>
            <div class="friend-card-body" style="background-image: ${avatarUrl};">
                <div class="vip-badge"></div>
            </div>
        `;
        
        const actionBtn = document.createElement('div');
        actionBtn.className = 'add-friend-btn';
        
        if (actionType === 'add') {
            actionBtn.onclick = () => this.sendFriendRequest(user.id);
        } else if (actionType === 'accept') {
            actionBtn.style.backgroundImage = "url('icons/icon-check.png')"; 
            actionBtn.onclick = () => this.acceptFriendRequest(user.request_id);
        } else if (actionType === 'chat' || actionType === 'mail') {
            actionBtn.style.backgroundImage = "url('icons/icon-chat.png')";
            actionBtn.onclick = () => {
                if(this.ui.mailManager) {
                    this.ui.mailManager.openConversation(user.username);
                } else if (this.ui.openConversation) {
                    // Fallback dla starego UI.js
                    this.ui.openConversation(user.username);
                }
            };
        }
        
        const body = div.querySelector('.friend-card-body');
        body.onclick = (e) => {
            if (e.target !== actionBtn) {
                if (this.ui.showSkinPreviewFromUrl) {
                    this.ui.showSkinPreviewFromUrl(user.current_skin_thumbnail);
                }
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

    async sendFriendRequest(tid){
        const t = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
        try {
            const r = await fetch(`${API_BASE_URL}/api/friends/request`, {
                method: 'POST',
                headers: {'Content-Type':'application/json', 'Authorization':`Bearer ${t}`},
                body: JSON.stringify({targetUserId: tid})
            });
            const d = await r.json();
            if(r.ok) this.ui.showMessage(d.message,'success');
            else this.ui.showMessage(d.message,'error');
        } catch(e) {
            this.ui.showMessage('Błąd sieci','error');
        }
    }

    async acceptFriendRequest(rid){
        const t = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
        try {
            const r = await fetch(`${API_BASE_URL}/api/friends/accept`, {
                method: 'POST',
                headers: {'Content-Type':'application/json', 'Authorization':`Bearer ${t}`},
                body: JSON.stringify({requestId: rid})
            });
            const d = await r.json();
            if(r.ok){
                this.ui.showMessage('Dodano!','success');
                this.loadFriendsData();
            } else this.ui.showMessage(d.message,'error');
        } catch(e) {
            this.ui.showMessage('Błąd sieci','error');
        }
    }
}