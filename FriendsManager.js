/* PLIK: FriendsManager.js */
import { API_BASE_URL, STORAGE_KEYS } from './Config.js';

export class FriendsManager {
    constructor(uiManager) {
        this.ui = uiManager;
        this.friendsList = [];
    }

    initialize() {
        this.setupEventListeners();
    }

    setupEventListeners() {
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

        const closeBtn = document.getElementById('btn-friends-close-main');
        if (closeBtn) closeBtn.onclick = () => this.close();

        const searchBtn = document.getElementById('friends-search-btn-new');
        const clearBtn = document.getElementById('friends-search-clear');
        
        if (searchBtn) searchBtn.onclick = () => this.handleFriendSearch();
        
        if (clearBtn) clearBtn.onclick = () => {
            const input = document.getElementById('friends-search-input-new');
            if(input) input.value = '';
            document.getElementById('search-results-grid-new').innerHTML = '';
        };
        
        const searchInput = document.getElementById('friends-search-input-new');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleFriendSearch();
            });
        }
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

    getFriendStatus(userId) {
        const friend = this.friendsList.find(f => f.id === userId);
        if (friend) {
            return { isFriend: true, isOnline: friend.isOnline };
        }
        return { isFriend: false, isOnline: false };
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
            }
        } catch (e) {
            console.error("Błąd pobierania przyjaciół:", e);
        }
    }

    async removeFriend(friendId) {
        const t = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
        if (!t) return;

        try {
            const r = await fetch(`${API_BASE_URL}/api/friends/${friendId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${t}` }
            });
            const d = await r.json();
            
            if (r.ok) {
                this.ui.showMessage('Usunięto ze znajomych.', 'info');
                await this.loadFriendsData(); 
                return true;
            } else {
                this.ui.showMessage(d.message || 'Błąd usuwania.', 'error');
                return false;
            }
        } catch (e) {
            this.ui.showMessage('Błąd sieci.', 'error');
            return false;
        }
    }

    renderFriendsUI(friends, requests) {
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

        const online = friends.filter(f => f.isOnline);
        const offline = friends.filter(f => !f.isOnline);

        const onlineCount = document.getElementById('online-count');
        if(onlineCount) onlineCount.textContent = online.length;
        
        const onlineGrid = document.getElementById('friends-online-grid');
        if(onlineGrid) {
            onlineGrid.innerHTML = '';
            online.forEach(f => onlineGrid.appendChild(this.createFriendCard(f, 'chat')));
        }

        const offlineCount = document.getElementById('offline-count');
        if(offlineCount) offlineCount.textContent = offline.length;
        
        const offlineGrid = document.getElementById('friends-offline-grid');
        if(offlineGrid) {
            offlineGrid.innerHTML = '';
            offline.forEach(f => offlineGrid.appendChild(this.createFriendCard(f, 'mail')));
        }
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
            actionBtn.onclick = (e) => {
                e.stopPropagation(); 
                this.sendFriendRequest(user.id);
            };
        } else if (actionType === 'accept') {
            actionBtn.style.backgroundImage = "url('icons/icon-check.png')"; 
            actionBtn.onclick = (e) => {
                e.stopPropagation();
                this.acceptFriendRequest(user.request_id);
            };
        } else if (actionType === 'chat' || actionType === 'mail') {
            actionBtn.style.backgroundImage = "url('icons/icon-chat.png')";
            actionBtn.onclick = (e) => {
                e.stopPropagation();
                // FIX: Otwieranie czatu zamiast tylko skrzynki
                if(this.ui.mailManager) {
                    this.ui.mailManager.open(); 
                    this.ui.mailManager.openConversation(user.username);
                }
            };
        }
        
        const body = div.querySelector('.friend-card-body');
        body.onclick = (e) => {
            if (e.target !== actionBtn) {
                if (this.ui.openOtherPlayerProfile) {
                    this.ui.openOtherPlayerProfile(user.username);
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
