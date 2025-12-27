/* PLIK: NewsManager.js */
import { API_BASE_URL, STORAGE_KEYS } from './Config.js';

const TEMPLATE = `
    <style>
        .news-container {
            width: 85vw; max-width: 600px; height: 70vh;
            background-color: #e0e0e0; border-radius: 15px;
            display: flex; flex-direction: column; overflow: hidden;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            border: 4px solid white; font-family: 'Titan One', cursive;
        }
        .news-header {
            background: linear-gradient(to bottom, #4facfe, #00f2fe);
            color: white; padding: 10px 15px;
            display: flex; justify-content: space-between; align-items: center;
            border-bottom: 2px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .news-header-title { font-size: 20px; text-shadow: 2px 2px 0 #000; }
        .btn-claim-all {
            background: linear-gradient(to bottom, #2ecc71, #27ae60);
            border: 2px solid white; border-radius: 10px;
            padding: 8px 15px; color: white; cursor: pointer; font-family: inherit;
            box-shadow: 0 4px 0 #1e8449; font-size: 14px; text-shadow: 1px 1px 0 #000;
            transition: transform 0.1s;
        }
        .btn-claim-all:active { transform: translateY(3px); box-shadow: 0 1px 0 #1e8449; }
        #news-list {
            flex: 1; overflow-y: auto; padding: 15px;
            background-color: #bdc3c7; display: flex; flex-direction: column; gap: 12px;
        }
        .news-item {
            background-color: #fff;
            border-radius: 12px;
            display: flex; height: 90px;
            box-shadow: 0 4px 0 rgba(0,0,0,0.1); 
            border: 2px solid white;
            position: relative; overflow: hidden;
        }
        .news-icon-area { 
            width: 70px; display: flex; justify-content: center; align-items: center; 
            background: transparent; 
        }
        .news-type-icon { 
            width: 50px; height: 50px; 
            background-size: contain; background-repeat: no-repeat; background-position: center;
            filter: drop-shadow(2px 2px 0 rgba(0,0,0,0.2));
        }
        .news-content-area { 
            flex: 1; padding: 10px; display: flex; flex-direction: column; justify-content: center; 
            color: #333;
            text-shadow: none;
        }
        .news-title { font-size: 16px; font-weight: bold; margin-bottom: 5px; }
        .news-desc { font-size: 12px; color: #666; display: flex; align-items: center; gap: 5px; }
        .news-desc b { color: #e91e63; }
        
        .news-action-area { 
            width: 110px; display: flex; flex-direction: column; 
            justify-content: center; align-items: center; gap: 5px; 
            padding: 5px; background: transparent; 
        }
        .news-reward-val { 
            color: #333; font-size: 14px; font-weight:bold; display: flex; align-items: center; gap: 4px; 
        }
        .btn-claim-one {
            background: linear-gradient(to bottom, #8ede13, #5ba806);
            border: 2px solid white; border-radius: 8px;
            padding: 8px 15px; color: white; cursor: pointer; font-family: inherit; font-size: 14px;
            box-shadow: 0 4px 0 #3e7504; text-shadow: 1px 1px 0 #000; font-weight: bold;
        }
        .btn-claim-one:active { transform: translateY(3px); box-shadow: none; }
        
        .news-footer { height: 70px; background: linear-gradient(to bottom, #3498db, #2980b9); color: white; display: flex; align-items: center; padding: 0 15px; gap: 15px; border-top: 3px solid white; }
        .footer-chest { width: 50px; height: 50px; background: url('icons/icon-shop.png') center/contain no-repeat; filter: drop-shadow(0 4px 4px rgba(0,0,0,0.3)); }
    </style>

    <div id="news-modal" class="panel-modal" style="display:none;">
        <div class="news-container">
            <div class="news-header">
                <span class="news-header-title">Twoje aktualności (<span id="news-count-header">0</span>)</span>
                <button id="btn-news-claim-all" class="btn-claim-all">Odbierz wszystkie!</button>
            </div>
            <div id="news-list"></div>
            <div class="news-footer">
                <div class="footer-chest"></div>
                <span class="text-outline" style="font-size: 13px; text-align: left; flex: 1; line-height: 1.2;">Odbieraj nagrody i uśmiechy!</span>
                <button id="btn-news-close-main" class="panel-close-button" style="margin: 0; padding: 8px 15px; background: #e74c3c; border: 2px solid white; box-shadow: 0 4px 0 #c0392b;">X</button>
            </div>
        </div>
    </div>
`;

export class NewsManager {
    constructor(uiManager) {
        this.ui = uiManager;
        this.pendingNewsCount = 0;
    }

    initialize() {
        const modalsLayer = document.getElementById('modals-layer');
        if (modalsLayer) {
            modalsLayer.insertAdjacentHTML('beforeend', TEMPLATE);
        }
        this.setupEventListeners();
    }

    setupEventListeners() {
        const closeBtn = document.getElementById('btn-news-close-main');
        if (closeBtn) {
            closeBtn.onclick = () => this.close();
        }

        const claimAllBtn = document.getElementById('btn-news-claim-all');
        if (claimAllBtn) {
            claimAllBtn.onclick = () => this.claimReward(null); // null = all
        }
    }

    open() {
        const panel = document.getElementById('news-modal');
        if (panel) {
            this.ui.bringToFront(panel);
            panel.style.display = 'flex';
            this.loadNewsData();
        }
    }

    close() {
        const panel = document.getElementById('news-modal');
        if (panel) panel.style.display = 'none';
    }

    async loadNewsData() {
        const list = document.getElementById('news-list');
        list.innerHTML = '<p class="text-outline" style="text-align:center; padding:20px;">Ładowanie...</p>';

        try {
            const t = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
            const r = await fetch(`${API_BASE_URL}/api/news`, {
                headers: { 'Authorization': `Bearer ${t}` }
            });
            const newsItems = await r.json();
            this.renderNewsList(newsItems);
            
            this.pendingNewsCount = newsItems.length;
            const headerCount = document.getElementById('news-count-header');
            if (headerCount) headerCount.textContent = this.pendingNewsCount;
            
            this.ui.updatePendingRewards(this.pendingNewsCount);

        } catch (e) {
            list.innerHTML = '<p class="text-outline" style="text-align:center;">Błąd pobierania.</p>';
        }
    }

    renderNewsList(items) {
        const list = document.getElementById('news-list');
        if (!list) return;
        list.innerHTML = '';

        if (items.length === 0) {
            list.innerHTML = '<p class="text-outline" style="text-align:center; padding:20px; color:#555;">Brak nowych wiadomości.</p>';
            return;
        }

        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'news-item';

            let iconUrl = '';
            let titleText = "";
            let descHtml = "";

            if (item.type === 'smile') {
                // --- UŚMIECH (NOWOŚĆ) ---
                iconUrl = "url('icons/usmiech.png')"; 
                titleText = "Uśmiech";
                // source_user_skin pochodzi z JOIN-a w server.js
                const senderAvatar = item.source_user_skin || 'icons/avatar_placeholder.png';
                // source_username też pochodzi z server.js
                const senderName = item.source_username || 'Ktoś';
                
                descHtml = `
                    <div style="display:flex; align-items:center; gap:5px;">
                        <div style="width:24px; height:24px; background-image:url('${senderAvatar}'); background-size:cover; border-radius:4px; border:1px solid #ccc;"></div>
                        <span><b>${senderName}</b> wysyła Ci uśmiech</span>
                    </div>
                `;
            } 
            else if (item.type.includes('like')) {
                iconUrl = "url('icons/icon-like.png')";
                titleText = "Polubienie";
                descHtml = `<span>Inny gracz polubił Twój element</span>`;
            } 
            else {
                iconUrl = "url('icons/icon-shop.png')";
                titleText = "Nagroda";
                descHtml = `<span>Otrzymałeś nagrodę systemową</span>`;
            }

            const rewardText = `+${item.reward_xp}`;

            div.innerHTML = `
              <div class="news-icon-area">
                  <div class="news-type-icon" style="background-image: ${iconUrl};"></div>
              </div>
              <div class="news-content-area">
                  <div class="news-title">${titleText}</div>
                  <div class="news-desc">${descHtml}</div>
              </div>
              <div class="news-action-area">
                  <div class="news-reward-val">${rewardText} <img src="icons/icon-level.png" width="16"></div>
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
                this.ui.updateCoinCounter(d.newCoins);
                this.ui.updateLevelInfo(d.newLevel, d.newXp, d.maxXp);

                if (newsId) {
                    this.loadNewsData(); 
                    this.ui.showMessage("Odebrano nagrodę!", "success");
                } else {
                    this.pendingNewsCount = 0;
                    this.ui.updatePendingRewards(0);
                    this.close();
                    
                    d.message = "Odebrano wszystkie nagrody!";
                    this.ui.showRewardPanel(d);
                }
            } else {
                this.ui.showMessage(d.message || "Błąd", "error");
            }
        } catch (e) {
            console.error(e);
            this.ui.showMessage("Błąd sieci.", "error");
        }
    }
}
