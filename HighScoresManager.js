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
        }

        .hs-container {
            width: 100%; height: 100%;
            background-color: #3498db; /* Główny niebieski */
            border: 4px solid white;
            border-radius: 15px;
            display: flex; flex-direction: column;
            overflow: hidden;
            font-family: 'Titan One', cursive;
            position: relative;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }

        /* GÓRNE ZAKŁADKI (Placeholdery) */
        .hs-tabs {
            height: 60px;
            background: linear-gradient(to bottom, #2980b9, #3498db);
            display: flex; justify-content: center; align-items: flex-end;
            gap: 5px; padding-bottom: 5px;
            border-bottom: 4px solid #fff;
        }

        .hs-tab {
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            width: 80px; height: 50px; opacity: 0.6; cursor: pointer;
            transition: transform 0.1s;
        }
        .hs-tab.active { opacity: 1.0; transform: scale(1.1) translateY(-2px); }
        .hs-tab-icon { width: 30px; height: 30px; background-size: contain; background-repeat: no-repeat; background-position: center; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.5)); }
        .hs-tab-label { font-size: 10px; color: white; text-shadow: 1px 1px 0 #000; margin-top: 2px; }

        /* NAGŁÓWEK TABELI */
        .hs-header-bar {
            background-color: #f1c40f; /* Złoty pasek */
            color: white; text-align: center; font-size: 18px; padding: 5px;
            text-shadow: 1.5px 1.5px 0 #000;
            border-bottom: 2px solid white;
            position: relative;
        }
        .hs-star-deco { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); width: 20px; height: 20px; background: url('icons/icon-level.png') center/contain no-repeat; }

        /* LISTA WYNIKÓW */
        .hs-list-area {
            flex: 1; overflow-y: auto;
            background-color: #3498db;
            padding: 0;
            display: flex; flex-direction: column;
        }

        /* POJEDYNCZY WIERSZ */
        .hs-row {
            display: flex; align-items: center; height: 50px;
            background-color: #2980b9; /* Ciemniejszy niebieski */
            border-bottom: 2px solid #5dade2;
            color: white; font-size: 16px;
            padding: 0 10px;
        }
        .hs-row:nth-child(even) { background-color: #3498db; } /* Jaśniejszy */
        .hs-row.me { background-color: #2ecc71 !important; border: 2px solid #fff; } /* Wyróżnienie gracza */

        .hs-col-rank { width: 50px; font-size: 20px; font-weight: bold; text-shadow: 2px 2px 0 #000; text-align: center; }
        
        .hs-col-level { 
            width: 50px; display: flex; align-items: center; justify-content: center; 
            position: relative; 
        }
        .hs-level-star { 
            width: 35px; height: 35px; 
            background: url('icons/icon-level.png') center/contain no-repeat; 
            display: flex; justify-content: center; align-items: center;
            font-size: 12px; font-weight: bold; text-shadow: 1px 1px 0 #000; padding-top: 3px;
        }

        .hs-col-avatar { width: 50px; display: flex; justify-content: center; }
        .hs-avatar-img { width: 35px; height: 35px; background-color: #000; border: 2px solid white; border-radius: 5px; background-size: cover; background-position: center; }

        .hs-col-name { flex: 1; padding-left: 10px; font-size: 16px; text-shadow: 1px 1px 0 #000; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: flex; align-items: center; gap: 5px; }
        .vip-badge-small { width: 30px; height: 15px; background: url('icons/vip.png') center/contain no-repeat; display: inline-block; }

        .hs-col-score { width: 120px; text-align: right; font-size: 18px; text-shadow: 1px 1px 0 #000; font-family: monospace; font-weight: bold; }

        /* BOCZNE PRZYCISKI */
        .hs-side-buttons {
            position: absolute; top: 70px; 
            left: -60px; /* Poza kontenerem z lewej strony */
            display: flex; flex-direction: column; gap: 10px;
        }
        .hs-btn-back {
            width: 50px; height: 50px; 
            background: #e74c3c url('icons/icon-back.png') center/60% no-repeat;
            border: 3px solid white; border-radius: 10px; cursor: pointer;
            box-shadow: 0 4px 0 #c0392b;
        }
        
        .hs-right-buttons {
            position: absolute; top: 50%; transform: translateY(-50%);
            right: -50px; /* Poza kontenerem z prawej */
            display: flex; flex-direction: column; gap: 10px;
        }
        
        .hs-btn-toggle {
            width: 50px; height: 80px;
            background-color: #fff; border: 3px solid #3498db; border-radius: 10px;
            display: flex; justify-content: center; align-items: center; cursor: pointer;
            box-shadow: 0 4px 0 #ccc;
        }
        .hs-arrow-icon { font-size: 30px; color: #3498db; font-weight: bold; }

        .hs-btn-info {
            width: 50px; height: 50px;
            background: #3498db; border: 3px solid white; border-radius: 10px;
            display: flex; justify-content: center; align-items: center; cursor: pointer;
            font-size: 30px; color: white; font-weight: bold;
            box-shadow: 0 4px 0 #2980b9;
        }

        /* INFO MODAL */
        #hs-info-modal {
            position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
            width: 80%; background: rgba(0,0,0,0.9); border: 2px solid white; border-radius: 10px;
            padding: 20px; display: none; z-index: 10; text-align: center;
        }
    </style>

    <div id="highscores-panel" class="panel-modal" style="display:none;">
        <div class="panel-content">
            
            <div class="hs-side-buttons">
                <div id="btn-hs-close" class="hs-btn-back"></div>
            </div>

            <div class="hs-container">
                <!-- ZAKŁADKI (Placeholdery z ikonami) -->
                <div class="hs-tabs">
                    <div class="hs-tab active">
                        <div class="hs-tab-icon" style="background-image: url('icons/icon-level.png');"></div>
                        <div class="hs-tab-label">BlockStars</div>
                    </div>
                    <div class="hs-tab" style="filter: grayscale(1);">
                        <div class="hs-tab-icon" style="background-image: url('icons/icon-build.png');"></div>
                        <div class="hs-tab-label">Konstruktorzy</div>
                    </div>
                    <div class="hs-tab" style="filter: grayscale(1);">
                        <div class="hs-tab-icon" style="background-image: url('icons/icon-parkour.png');"></div>
                        <div class="hs-tab-label">Parkour</div>
                    </div>
                    <!-- Więcej placeholderów -->
                </div>

                <!-- TYTUŁ -->
                <div class="hs-header-bar">
                    <span id="hs-title-text">Najlepsze BlockStars wszech czasów</span>
                    <div class="hs-star-deco"></div>
                </div>

                <!-- LISTA -->
                <div id="hs-list" class="hs-list-area">
                    <!-- Wiersze generowane przez JS -->
                    <p style="text-align:center; color: white; margin-top: 50px;">Ładowanie...</p>
                </div>
            </div>

            <div class="hs-right-buttons">
                <!-- Strzałka do zmiany trybu -->
                <div id="btn-hs-toggle" class="hs-btn-toggle">
                    <div id="hs-arrow-icon" class="hs-arrow-icon">➤</div>
                </div>
                <!-- Pytajnik -->
                <div id="btn-hs-info" class="hs-btn-info">?</div>
            </div>

            <!-- MODAL POMOCY (UKRYTY) -->
            <div id="hs-info-modal">
                <h3 style="color: #f1c40f;">Jak to działa?</h3>
                <p style="color: white; margin: 10px 0;">
                    <b>BlockStars:</b> Najlepsi gracze wg punktów doświadczenia (XP) zebranych łącznie.<br><br>
                    Ranking aktualizuje się na żywo!
                </p>
                <button id="btn-hs-info-close" style="padding: 5px 10px;">Zamknij</button>
            </div>

        </div>
    </div>
`;

export class HighScoresManager {
    constructor(uiManager) {
        this.ui = uiManager;
        this.mode = 'global'; // 'global' lub 'friends'
        this.page = 1;
        this.isLoading = false;
        this.hasMore = true;
        this.myId = parseInt(localStorage.getItem(STORAGE_KEYS.USER_ID) || "0");
    }

    init() {
        const modalsLayer = document.getElementById('modals-layer');
        if (modalsLayer) {
            modalsLayer.insertAdjacentHTML('beforeend', TEMPLATE);
        }
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Zamknięcie
        const closeBtn = document.getElementById('btn-hs-close');
        if (closeBtn) closeBtn.onclick = () => this.close();

        // Przełącznik trybu (Strzałka)
        const toggleBtn = document.getElementById('btn-hs-toggle');
        if (toggleBtn) toggleBtn.onclick = () => this.toggleMode();

        // Info (?)
        const infoBtn = document.getElementById('btn-hs-info');
        const infoModal = document.getElementById('hs-info-modal');
        const infoClose = document.getElementById('btn-hs-info-close');
        
        if (infoBtn) infoBtn.onclick = () => { infoModal.style.display = 'block'; };
        if (infoClose) infoClose.onclick = () => { infoModal.style.display = 'none'; };

        // Infinite Scroll
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
            this.ui.bringToFront(panel);
            panel.style.display = 'flex';
            this.resetAndLoad();
        }
    }

    close() {
        const panel = document.getElementById('highscores-panel');
        if (panel) panel.style.display = 'none';
    }

    toggleMode() {
        const arrow = document.getElementById('hs-arrow-icon');
        const title = document.getElementById('hs-title-text');
        
        if (this.mode === 'global') {
            this.mode = 'friends';
            if (arrow) {
                arrow.textContent = '◀'; // Strzałka w lewo
                arrow.style.transform = 'scaleX(1)';
            }
            if (title) title.textContent = "Ja i Przyjaciele";
        } else {
            this.mode = 'global';
            if (arrow) {
                arrow.textContent = '➤'; // Strzałka w prawo
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
        if (this.isLoading || !this.hasMore || this.mode === 'friends') return; // Friends usually fetches all at once
        this.page++;
        await this.fetchData();
    }

    async fetchData() {
        if (this.isLoading) return;
        this.isLoading = true;

        const list = document.getElementById('hs-list');
        // Jeśli lista pusta, pokaż ładowanie
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
            
            if (this.page === 1) list.innerHTML = ''; // Wyczyść loading text

            if (data.length === 0) {
                this.hasMore = false;
                if (this.page === 1) list.innerHTML = '<p style="text-align:center; color: white; margin-top: 50px;">Brak wyników.</p>';
            } else {
                this.renderRows(data);
                // Jeśli dostaliśmy mniej niż limit (np. 50), to koniec danych
                if (data.length < 50) this.hasMore = false;
            }

        } catch (e) {
            console.error(e);
            if (this.page === 1) list.innerHTML = '<p style="text-align:center; color: red; margin-top: 50px;">Błąd pobierania danych.</p>';
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
            
            // Formatowanie liczb (np. 30,993,456)
            const score = parseInt(user.total_xp || 0).toLocaleString();
            
            // Avatar fallback
            const avatarUrl = user.current_skin_thumbnail ? `url('${user.current_skin_thumbnail}')` : "url('icons/avatar_placeholder.png')";

            // Level (gwiazdka)
            const level = user.level || 1;

            // HTML Wiersza
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
                    ${isMe ? '<span style="font-size:10px; opacity:0.8;">(Ty)</span>' : ''}
                </div>
                <div class="hs-col-score">${score}</div>
            `;
            
            // Kliknięcie w wiersz -> Podgląd skina (jeśli istnieje)
            row.onclick = () => {
                if(this.ui && this.ui.showSkinPreviewFromUrl && user.current_skin_thumbnail) {
                    this.ui.showSkinPreviewFromUrl(user.current_skin_thumbnail);
                }
            };

            list.appendChild(row);
        });
    }
}
