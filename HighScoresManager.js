/* PLIK: HighScoresManager.js */
import { API_BASE_URL, STORAGE_KEYS } from './Config.js';

const TEMPLATE = `
    <style>
        #highscores-panel .panel-content {
            background: transparent !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            width: 95vw !important;
            height: 90vh !important;
            max-width: 900px !important;
            display: flex;
            flex-direction: column;
            pointer-events: auto;
            position: relative;
        }

        .hs-container {
            width: 100%; height: 100%;
            background-color: #3498db;
            border: 4px solid white;
            border-radius: 15px;
            display: flex; flex-direction: column;
            overflow: hidden;
            font-family: 'Titan One', cursive;
            position: relative;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }

        /* PRZYCISK ZAMKNIĘCIA */
        .hs-btn-close-fixed {
            position: absolute;
            top: 10px; left: 10px;
            width: 45px; height: 45px;
            background: #e74c3c url('icons/icon-back.png') center/60% no-repeat;
            border: 3px solid white;
            border-radius: 10px;
            cursor: pointer;
            z-index: 100;
            box-shadow: 0 4px 0 #c0392b;
            transition: transform 0.1s;
        }
        .hs-btn-close-fixed:active { transform: scale(0.95); box-shadow: 0 2px 0 #c0392b; }

        /* ZAKŁADKI */
        .hs-tabs {
            height: 65px;
            background: linear-gradient(to bottom, #2980b9, #3498db);
            display: flex; justify-content: center; align-items: flex-end;
            gap: 10px; padding-bottom: 5px;
            border-bottom: 4px solid #fff;
            padding-left: 60px;
        }

        .hs-tab {
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            width: 80px; height: 55px; opacity: 0.7; cursor: pointer;
            transition: transform 0.1s;
            position: relative;
        }
        .hs-tab.active { opacity: 1.0; transform: scale(1.1); z-index: 2; }
        .hs-tab.active::after {
            content: ''; position: absolute; bottom: -9px; left: 50%; transform: translateX(-50%);
            border-left: 8px solid transparent; border-right: 8px solid transparent;
            border-top: 8px solid white;
        }

        .hs-tab-icon { width: 30px; height: 30px; background-size: contain; background-repeat: no-repeat; background-position: center; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.5)); }
        .hs-tab-label { font-size: 10px; color: white; text-shadow: 1px 1px 0 #000; margin-top: 2px; }

        /* NAGŁÓWEK TABELI */
        .hs-header-bar {
            background-color: #f1c40f;
            color: white; text-align: center; font-size: 18px; padding: 8px;
            text-shadow: 1.5px 1.5px 0 #000;
            border-bottom: 2px solid white;
            position: relative;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            z-index: 1;
        }
        .hs-star-deco { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); width: 24px; height: 24px; background: url('icons/icon-level.png') center/contain no-repeat; }

        /* LISTA */
        .hs-list-area {
            flex: 1; overflow-y: auto;
            background-color: #3498db;
            padding: 0;
            display: flex; flex-direction: column;
        }

        /* WIERSZ */
        .hs-row {
            display: flex; align-items: center; height: 55px;
            background-color: #2980b9; 
            border-bottom: 2px solid #5dade2;
            color: white; font-size: 16px;
            padding: 0 10px;
            cursor: pointer;
            transition: background-color 0.1s;
        }
        .hs-row:hover { background-color: #4facfe; }
        .hs-row:nth-child(even) { background-color: #3498db; }
        .hs-row:nth-child(even):hover { background-color: #4facfe; }
        .hs-row.me { background-color: #2ecc71 !important; border: 2px solid #fff; position: relative; z-index: 1; }

        .hs-col-rank { width: 45px; font-size: 20px; font-weight: bold; text-shadow: 2px 2px 0 #000; text-align: center; color: #f1c40f; }
        .hs-col-level { width: 45px; display: flex; align-items: center; justify-content: center; }
        .hs-level-star { 
            width: 32px; height: 32px; 
            background: url('icons/icon-level.png') center/contain no-repeat; 
            display: flex; justify-content: center; align-items: center;
            font-size: 11px; font-weight: bold; text-shadow: 1px 1px 0 #000; padding-top: 2px;
        }
        .hs-col-avatar { width: 50px; display: flex; justify-content: center; align-items: center; }
        .hs-avatar-img { width: 40px; height: 40px; background-color: #000; border: 2px solid white; border-radius: 6px; background-size: cover; background-position: center; }
        .hs-col-name { flex: 1; padding-left: 10px; font-size: 16px; text-shadow: 1px 1px 0 #000; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: flex; align-items: center; gap: 5px; }
        .hs-col-score { width: 110px; text-align: right; font-size: 16px; text-shadow: 1px 1px 0 #000; font-family: monospace; font-weight: bold; padding-right: 5px; }

        /* BOCZNE PRZYCISKI */
        .hs-right-buttons {
            position: absolute; 
            top: 50%; transform: translateY(-50%);
            right: 10px; 
            display: flex; flex-direction: column; gap: 10px;
            z-index: 50;
        }
        
        .hs-btn-toggle {
            width: 50px; height: 80px;
            background-color: #fff; border: 3px solid #3498db; border-radius: 10px;
            display: flex; justify-content: center; align-items: center; cursor: pointer;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        }
        .hs-btn-toggle:active { transform: scale(0.95); }
        .hs-arrow-icon { font-size: 30px; color: #3498db; font-weight: bold; }

        .hs-btn-info {
            width: 50px; height: 50px;
            background: #3498db; border: 3px solid white; border-radius: 10px;
            display: flex; justify-content: center; align-items: center; cursor: pointer;
            font-size: 30px; color: white; font-weight: bold;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        }
        .hs-btn-info:active { transform: scale(0.95); }

        /* INFO MODAL */
        #hs-info-modal {
            position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
            width: 80%; background: rgba(0,0,0,0.95); border: 2px solid white; border-radius: 10px;
            padding: 20px; display: none; z-index: 200; text-align: center;
            box-shadow: 0 0 20px rgba(0,0,0,0.8);
        }
    </style>

    <div id="highscores-panel" class="panel-modal" style="display:none;">
        <div class="panel-content">
            
            <div class="hs-container">
                <div id="btn-hs-close" class="hs-btn-close-fixed"></div>

                <div class="hs-tabs">
                    <div class="hs-tab active">
                        <div class="hs-tab-icon" style="background-image: url('icons/icon-level.png');"></div>
                        <div class="hs-tab-label">BlockStars</div>
                    </div>
                    <div class="hs-tab" style="filter: grayscale(1); opacity: 0.5;">
                        <div class="hs-tab-icon" style="background-image: url('icons/icon-build.png');"></div>
                        <div class="hs-tab-label">Budownicz.</div>
                    </div>
                    <div class="hs-tab" style="filter: grayscale(1); opacity: 0.5;">
                        <div class="hs-tab-icon" style="background-image: url('icons/icon-parkour.png');"></div>
                        <div class="hs-tab-label">Parkour</div>
                    </div>
                    <div class="hs-tab" style="filter: grayscale(1); opacity: 0.5;">
                        <div class="hs-tab-icon" style="background-image: url('icons/icon-shop.png');"></div>
                        <div class="hs-tab-label">Bogacze</div>
                    </div>
                </div>

                <div class="hs-header-bar">
                    <span id="hs-title-text">Najlepsze BlockStars wszech czasów</span>
                    <div class="hs-star-deco"></div>
                </div>

                <div id="hs-list" class="hs-list-area"></div>
            </div>

            <div class="hs-right-buttons">
                <div id="btn-hs-toggle" class="hs-btn-toggle">
                    <div id="hs-arrow-icon" class="hs-arrow-icon">➤</div>
                </div>
                <div id="btn-hs-info" class="hs-btn-info">?</div>
            </div>

            <div id="hs-info-modal">
                <h3 style="color: #f1c40f; margin-bottom: 15px; text-shadow: 2px 2px 0 #000;">Jak to działa?</h3>
                <p style="color: white; margin: 10px 0; font-size: 14px; line-height: 1.5;">
                    <img src="icons/icon-level.png" width="20" style="vertical-align: middle;"> <b>BlockStars:</b><br>
                    Ranking graczy według całkowitego zdobytego XP od początku gry.<br><br>
                    Ranking aktualizuje się na żywo!
                </p>
                <button id="btn-hs-info-close" style="padding: 10px 20px; background: #e74c3c; color: white; border: 2px solid white; border-radius: 8px; font-weight: bold; cursor: pointer; margin-top: 15px;">Zamknij</button>
            </div>

        </div>
    </div>
`;

export class HighScoresManager {
    constructor(uiManager) {
        this.ui = uiManager;
        this.mode = 'global'; 
        this.page = 1;
        this.isLoading = false;
        this.hasMore = true;
        this.myId = parseInt(localStorage.getItem(STORAGE_KEYS.USER_ID) || "0");
    }

    init() {
        // Wstrzyknięcie szablonu
        const modalsLayer = document.getElementById('modals-layer');
        if (modalsLayer) {
            modalsLayer.insertAdjacentHTML('beforeend', TEMPLATE);
        }
        this.setupEventListeners();
    }

    setupEventListeners() {
        const closeBtn = document.getElementById('btn-hs-close');
        if (closeBtn) closeBtn.onclick = () => this.close();

        const panel = document.getElementById('highscores-panel');
        if (panel) {
            panel.addEventListener('click', (e) => {
                if (e.target.id === 'highscores-panel') this.close();
            });
        }

        const toggleBtn = document.getElementById('btn-hs-toggle');
        if (toggleBtn) toggleBtn.onclick = () => this.toggleMode();

        const infoBtn = document.getElementById('btn-hs-info');
        const infoModal = document.getElementById('hs-info-modal');
        const infoClose = document.getElementById('btn-hs-info-close');
        
        if (infoBtn) infoBtn.onclick = () => { if(infoModal) infoModal.style.display = 'block'; };
        if (infoClose) infoClose.onclick = () => { if(infoModal) infoModal.style.display = 'none'; };

        const list = document.getElementById('hs-list');
        if (list) {
            list.addEventListener('scroll', () => {
                if (list.scrollTop + list.clientHeight >= list.scrollHeight - 50) {
                    this.loadMore();
                }
            });
        }
    }

    open() {
        const panel = document.getElementById('highscores-panel');
        if (panel) {
            if (this.ui.bringToFront) this.ui.bringToFront(panel);
            panel.style.display = 'flex';
            this.resetAndLoad();
        }
    }

    close() {
        const panel = document.getElementById('highscores-panel');
        if (panel) panel.style.display = 'none';
        const info = document.getElementById('hs-info-modal');
        if(info) info.style.display = 'none';
    }

    toggleMode() {
        const arrow = document.getElementById('hs-arrow-icon');
        const title = document.getElementById('hs-title-text');
        
        if (this.mode === 'global') {
            this.mode = 'friends';
            if (arrow) {
                arrow.textContent = '◀'; 
                arrow.style.transform = 'scaleX(1)';
            }
            if (title) title.textContent = "Ja i Przyjaciele";
        } else {
            this.mode = 'global';
            if (arrow) {
                arrow.textContent = '➤'; 
                arrow.style.transform = 'scaleX(1)';
            }
            if (title) title.textContent = "Najlepsze BlockStars wszech czasów";
        }
        this.resetAndLoad();
    }

    resetAndLoad() {
        this.page = 1;
        this.hasMore = true;
        const list = document.getElementById('hs-list');
        if (list) {
            list.innerHTML = '';
            list.scrollTop = 0;
        }
        this.fetchData();
    }

    async loadMore() {
        if (this.isLoading || !this.hasMore || this.mode === 'friends') return; 
        this.page++;
        await this.fetchData();
    }

    async fetchData() {
        if (this.isLoading) return;
        this.isLoading = true;

        const list = document.getElementById('hs-list');
        if (this.page === 1 && list.children.length === 0) {
            list.innerHTML = '<p style="text-align:center; color: white; margin-top: 50px;">Ładowanie...</p>';
        }

        const t = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
        let url = '';
        
        if (this.mode === 'global') {
            url = `${API_BASE_URL}/api/highscores/global?page=${this.page}`;
        } else {
            url = `${API_BASE_URL}/api/highscores/friends`;
        }

        try {
            const r = await fetch(url, {
                headers: t ? { 'Authorization': `Bearer ${t}` } : {}
            });
            
            if (!r.ok) throw new Error("Błąd serwera");
            
            const data = await r.json();
            
            if (this.page === 1) list.innerHTML = ''; 

            if (data.length === 0) {
                this.hasMore = false;
                if (this.page === 1) list.innerHTML = '<p style="text-align:center; color: white; margin-top: 50px;">Brak wyników.</p>';
            } else {
                this.renderRows(data);
                if (data.length < 50) this.hasMore = false;
            }

        } catch (e) {
            console.error(e);
            if (this.page === 1) list.innerHTML = '<p style="text-align:center; color: #e74c3c; margin-top: 50px; text-shadow: 1px 1px 0 #000;">Błąd pobierania danych.</p>';
        } finally {
            this.isLoading = false;
        }
    }

    renderRows(users) {
        const list = document.getElementById('hs-list');
        const startRank = (this.page - 1) * 50 + 1;

        users.forEach((user, index) => {
            const rank = startRank + index;
            const isMe = user.id === this.myId;
            const score = parseInt(user.total_xp || 0).toLocaleString();
            const avatarUrl = user.current_skin_thumbnail ? `url('${user.current_skin_thumbnail}')` : "url('icons/avatar_placeholder.png')";
            const level = user.level || 1;

            const row = document.createElement('div');
            row.className = `hs-row ${isMe ? 'me' : ''}`;
            
            row.innerHTML = `
                <div class="hs-col-rank">#${rank}</div>
                <div class="hs-col-level">
                    <div class="hs-level-star">${level}</div>
                </div>
                <div class="hs-col-avatar">
                    <div class="hs-avatar-img" style="background-image: ${avatarUrl};"></div>
                </div>
                <div class="hs-col-name">
                    ${user.username}
                    ${isMe ? '<span style="font-size:10px; opacity:0.8; margin-left:5px;">(Ty)</span>' : ''}
                </div>
                <div class="hs-col-score">${score}</div>
            `;
            
            // OBSŁUGA KLIKNIĘCIA - Otwiera profil
            row.onclick = () => {
                if (isMe) {
                    this.ui.openPlayerProfile();
                } else {
                    if(this.ui.openOtherPlayerProfile) {
                        this.ui.openOtherPlayerProfile(user.username);
                    }
                }
            };

            list.appendChild(row);
        });
    }
}
