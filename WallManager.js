import { API_BASE_URL, STORAGE_KEYS } from './Config.js';

const TEMPLATE = `
    <style>
        #wall-panel .panel-content {
            background: transparent !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            max-width: none !important;
            pointer-events: auto;
        }

        .wall-container {
            width: 100%; height: 100%;
            background-color: #0c2461; /* Ciemne tło */
            display: flex; flex-direction: column;
            position: relative;
            padding-top: 60px; /* Miejsce na HUD */
            font-family: 'Titan One', cursive;
        }

        /* HEADER ŚCIANY */
        .wall-header-bar {
            height: 50px;
            background: linear-gradient(to bottom, #3498db, #2980b9);
            display: flex; align-items: center; padding: 0 10px;
            border-bottom: 3px solid rgba(0,0,0,0.3);
            position: relative;
        }

        .wall-back-btn {
            width: 45px; height: 45px;
            background: #e74c3c url('icons/icon-back.png') center/60% no-repeat;
            border: 2px solid white; border-radius: 8px;
            cursor: pointer; box-shadow: 0 3px 0 #c0392b;
            margin-right: 15px;
        }
        .wall-back-btn:active { transform: translateY(2px); box-shadow: none; }

        .wall-title {
            font-size: 18px; color: white; text-shadow: 2px 2px 0 #000;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }

        /* ZAKŁADKI GÓRNE */
        .wall-tabs {
            display: flex; justify-content: center; gap: 5px;
            position: absolute; left: 50%; transform: translateX(-50%); bottom: 0;
            height: 100%; align-items: flex-end;
        }
        
        .wall-tab {
            display: flex; flex-direction: column; align-items: center; justify-content: flex-end;
            width: 70px; height: 45px; cursor: pointer;
            opacity: 0.7; transition: 0.2s;
            padding-bottom: 2px;
        }
        .wall-tab.active { opacity: 1; background-color: rgba(255,255,255,0.2); border-radius: 8px 8px 0 0; }
        
        .wall-tab-icon { width: 24px; height: 24px; background-size: contain; background-repeat: no-repeat; background-position: center; filter: drop-shadow(1px 1px 0 #000); }
        .wall-tab-label { font-size: 10px; color: white; text-shadow: 1px 1px 0 #000; }

        /* OBSZAR TREŚCI */
        .wall-content {
            flex: 1; overflow-y: auto; overflow-x: hidden;
            background: #1e3799; /* Niebieskie tło treści */
            padding: 10px 0;
        }

        /* SEKCJA KATEGORII */
        .wall-section { margin-bottom: 20px; }
        
        .wall-section-title {
            color: #00cec9; /* Turkusowy tytuł */
            font-size: 18px; margin: 0 0 5px 15px;
            text-shadow: 2px 2px 0 #000;
        }

        /* LISTA POZIOMA (SCROLL) */
        .wall-horizontal-list {
            display: flex; gap: 10px;
            padding: 0 15px;
            overflow-x: auto;
            padding-bottom: 10px;
            scrollbar-width: thin;
        }
        .wall-horizontal-list::-webkit-scrollbar { height: 6px; }
        .wall-horizontal-list::-webkit-scrollbar-thumb { background: #3498db; border-radius: 3px; }

        /* KAFELEK ELEMENTU */
        .wall-card {
            width: 130px; height: 160px; flex-shrink: 0;
            background-color: #00d2d3; /* Turkusowe tło kafelka */
            border: 2px solid white; border-radius: 8px;
            display: flex; flex-direction: column;
            overflow: hidden; cursor: pointer;
            box-shadow: 0 4px 0 rgba(0,0,0,0.3);
            transition: transform 0.1s;
        }
        .wall-card:active { transform: scale(0.95); }

        .wall-card-header {
            background-color: #01a3a4;
            color: white; font-size: 10px; padding: 2px 4px;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
            text-shadow: 1px 1px 0 #000; font-weight: bold;
        }

        .wall-card-thumb {
            flex: 1; background-color: #fff;
            background-image: url('icons/avatar_placeholder.png');
            background-size: cover; background-position: center;
            position: relative;
        }
        
        /* FOOTER KAFELKA (Lajki i Komentarze) */
        .wall-card-footer {
            height: 25px; background-color: #01a3a4;
            display: flex; justify-content: space-around; align-items: center;
            color: white; font-size: 12px; text-shadow: 1px 1px 0 #000;
        }
        
        .stat-item { display: flex; align-items: center; gap: 3px; }
        .stat-icon { width: 14px; height: 14px; background-size: contain; background-repeat: no-repeat; }
        
        /* PLACEHOLDERY */
        .wall-placeholder-tab { display: none; text-align: center; color: white; margin-top: 50px; font-size: 18px; }
        .wall-placeholder-tab.active { display: block; }

    </style>

    <div id="wall-panel" class="panel-modal" style="display:none;">
        <div class="panel-content">
            <div class="wall-container">
                
                <div class="wall-header-bar">
                    <div id="btn-wall-close" class="wall-back-btn"></div>
                    <div id="wall-header-title" class="wall-title">Ściana użytkownika ...</div>
                    
                    <div class="wall-tabs">
                        <div class="wall-tab active" data-tab="wall-creations">
                            <div class="wall-tab-icon" style="background-image: url('icons/icon-like.png');"></div>
                            <span class="wall-tab-label">Dzieła</span>
                        </div>
                        <div class="wall-tab" data-tab="wall-crystals">
                            <div class="wall-tab-icon" style="background-image: url('icons/icon-shop.png');"></div> <!-- Placeholder icon -->
                            <span class="wall-tab-label">Kryształy</span>
                        </div>
                        <div class="wall-tab" data-tab="wall-pets">
                            <div class="wall-tab-icon" style="background-image: url('icons/icon-friends.png');"></div> <!-- Placeholder icon -->
                            <span class="wall-tab-label">Zwierzaki</span>
                        </div>
                        <div class="wall-tab" data-tab="wall-photos">
                            <div class="wall-tab-icon" style="background-image: url('icons/icon-build.png');"></div> <!-- Placeholder icon -->
                            <span class="wall-tab-label">Fotki</span>
                        </div>
                    </div>
                </div>

                <!-- ZAKŁADKA DZIEŁA -->
                <div id="wall-creations" class="wall-content active">
                    
                    <div class="wall-section">
                        <div class="wall-section-title">Najnowsze BlockStars</div>
                        <div id="wall-list-skins" class="wall-horizontal-list">
                            <!-- Kafelki JS -->
                        </div>
                    </div>

                    <div class="wall-section">
                        <div class="wall-section-title">Najnowsze Światy</div>
                        <div id="wall-list-worlds" class="wall-horizontal-list"></div>
                    </div>

                    <div class="wall-section">
                        <div class="wall-section-title">Najnowsze Prefabrykaty</div>
                        <div id="wall-list-prefabs" class="wall-horizontal-list"></div>
                    </div>

                    <div class="wall-section">
                        <div class="wall-section-title">Najnowsze Części</div>
                        <div id="wall-list-parts" class="wall-horizontal-list"></div>
                    </div>

                </div>

                <!-- PLACEHOLDERY DLA INNYCH ZAKŁADEK -->
                <div id="wall-crystals" class="wall-content wall-placeholder-tab">Brak kryształów</div>
                <div id="wall-pets" class="wall-content wall-placeholder-tab">Brak zwierzaków</div>
                <div id="wall-photos" class="wall-content wall-placeholder-tab">Brak fotek</div>

            </div>
        </div>
    </div>
`;

export class WallManager {
    constructor(uiManager) {
        this.ui = uiManager;
        this.currentUserId = null;
    }

    initialize() {
        const modalsLayer = document.getElementById('modals-layer');
        if (modalsLayer) {
            modalsLayer.insertAdjacentHTML('beforeend', TEMPLATE);
        }
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Zamknięcie
        const closeBtn = document.getElementById('btn-wall-close');
        if (closeBtn) closeBtn.onclick = () => this.close();

        // Zakładki
        const tabs = document.querySelectorAll('.wall-tab');
        tabs.forEach(tab => {
            tab.onclick = () => {
                // Deaktywuj wszystkie
                tabs.forEach(t => t.classList.remove('active'));
                document.querySelectorAll('#wall-panel .wall-content').forEach(c => {
                    c.style.display = 'none';
                    c.classList.remove('active');
                });

                // Aktywuj klikniętą
                tab.classList.add('active');
                const targetId = tab.getAttribute('data-tab');
                const targetContent = document.getElementById(targetId);
                if (targetContent) {
                    targetContent.style.display = 'block';
                    targetContent.classList.add('active');
                }
            };
        });
    }

    open(userId, username) {
        const panel = document.getElementById('wall-panel');
        if (!panel) return;

        this.ui.bringToFront(panel);
        panel.style.display = 'flex';
        
        this.currentUserId = userId;
        document.getElementById('wall-header-title').textContent = `Ściana użytkownika ${username || 'Gracz'}`;
        
        // Reset widoku do pierwszej zakładki
        document.querySelector('.wall-tab[data-tab="wall-creations"]').click();

        this.loadWallData(userId);
    }

    close() {
        const panel = document.getElementById('wall-panel');
        if (panel) panel.style.display = 'none';
    }

    async loadWallData(userId) {
        // Wyczyść listy i pokaż loading (opcjonalnie)
        ['skins', 'worlds', 'prefabs', 'parts'].forEach(type => {
            document.getElementById(`wall-list-${type}`).innerHTML = '<p style="color:white; padding:10px;">Ładowanie...</p>';
        });

        const t = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
        
        try {
            const r = await fetch(`${API_BASE_URL}/api/user/${userId}/wall`, {
                headers: t ? { 'Authorization': `Bearer ${t}` } : {}
            });
            
            if (r.ok) {
                const data = await r.json();
                this.renderSection('wall-list-skins', data.skins, 'skin');
                this.renderSection('wall-list-worlds', data.worlds, 'world');
                this.renderSection('wall-list-prefabs', data.prefabs, 'prefab');
                this.renderSection('wall-list-parts', data.parts, 'part');
            } else {
                throw new Error("Błąd serwera");
            }
        } catch (e) {
            console.error(e);
            ['skins', 'worlds', 'prefabs', 'parts'].forEach(type => {
                document.getElementById(`wall-list-${type}`).innerHTML = '<p style="color:white; padding:10px;">Błąd pobierania.</p>';
            });
        }
    }

    renderSection(containerId, items, type) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';

        if (!items || items.length === 0) {
            container.innerHTML = '<div style="color:rgba(255,255,255,0.5); padding:20px; font-size:12px;">Pusto :(</div>';
            return;
        }

        items.forEach(item => {
            const card = this.createCard(item, type);
            container.appendChild(card);
        });
    }

    createCard(item, type) {
        const div = document.createElement('div');
        div.className = 'wall-card';

        // Thumb
        let thumbUrl = item.thumbnail || 'icons/avatar_placeholder.png';
        
        // Likes & Comments (domyślnie 0 jeśli brak w danych)
        const likes = item.likes || 0;
        const comments = item.comments || 0;

        div.innerHTML = `
            <div class="wall-card-header">${item.name}</div>
            <div class="wall-card-thumb" style="background-image: url('${thumbUrl}');"></div>
            <div class="wall-card-footer">
                <div class="stat-item">
                    <div class="stat-icon" style="background-image: url('icons/icon-like.png');"></div>
                    <span>${likes}</span>
                </div>
                <div class="stat-item">
                    <div class="stat-icon" style="background-image: url('icons/icon-chat.png');"></div>
                    <span>${comments}</span>
                </div>
            </div>
        `;

        div.onclick = () => this.handleItemClick(item, type);

        return div;
    }

    handleItemClick(item, type) {
        // Wykorzystujemy istniejącą metodę z UIManager, która otwiera szczegóły i podgląd 3D
        if (type === 'world') {
            // Dla światów logika jest inna (od razu wejście lub modal wyboru)
            // Na razie możemy wywołać onWorldSelect z ui.js jeśli dostępny, lub alert
            if (this.ui.onWorldSelect) {
                // Potrzebujemy potwierdzenia, bo to wyjście z obecnego świata
                if (confirm(`Chcesz wejść do świata "${item.name}"?`)) {
                    this.ui.closeAllPanels();
                    this.ui.onWorldSelect(item);
                }
            }
        } else {
            // Skin, Prefab, Part -> Szczegóły 3D
            if (this.ui.showItemDetails) {
                this.ui.showItemDetails(item, type);
            }
        }
    }
}
