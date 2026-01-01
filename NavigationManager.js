/* PLIK: NavigationManager.js */
import { STORAGE_KEYS } from './Config.js';

const TEMPLATE = `
    <style>
        /* STYLE DLA GRIDU NAWIGACYJNEGO (Wspólne dla Zagraj, Buduj, Więcej) */
        .nav-grid-container {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            grid-template-rows: auto;
            gap: 15px;
            justify-content: center;
            width: 100%;
            padding: 20px;
        }
        
        .nav-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            cursor: url('icons/cursor.png'), auto;
            transition: transform 0.1s;
            position: relative;
        }
        .nav-item:active { transform: scale(0.95); }
        
        .nav-btn-box {
            width: 110px; height: 110px;
            background-image: url('icons/NavigationButton.png');
            background-size: 100% 100%;
            background-repeat: no-repeat;
            background-position: center;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            align-items: center;
            position: relative;
            filter: drop-shadow(0 4px 4px rgba(0,0,0,0.3));
            padding-top: 15px;
        }

        .nav-btn-box-green {
            width: 110px; height: 110px;
            background-image: url('icons/NavigationButtonGreen.png');
            background-size: 100% 100%;
            background-repeat: no-repeat;
            background-position: center;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            align-items: center;
            position: relative;
            filter: drop-shadow(0 4px 4px rgba(0,0,0,0.3));
            padding-top: 15px;
        }
        
        .nav-icon {
            width: 55%; height: 55%;
            object-fit: contain;
            filter: drop-shadow(0 2px 2px rgba(0,0,0,0.3));
            z-index: 1;
        }
        
        .nav-label {
            position: absolute;
            bottom: 12px;
            left: 0;
            width: 100%;
            color: white;
            font-size: 11px;
            font-family: 'Titan One', cursive;
            text-shadow: -1.5px -1.5px 0 #000, 1.5px -1.5px 0 #000, -1.5px 1.5px 0 #000, 1.5px 1.5px 0 #000;
            text-align: center;
            z-index: 2;
            pointer-events: none;
            line-height: 1;
        }
        
        .nav-badge {
            position: absolute;
            top: -5px; right: -5px;
            background-color: #e74c3c;
            color: white;
            border: 2px solid white;
            border-radius: 50%;
            width: 28px; height: 28px;
            display: flex; justify-content: center; align-items: center;
            font-size: 14px; font-weight: bold;
            box-shadow: 0 2px 4px rgba(0,0,0,0.5);
            z-index: 10;
        }

        /* Konfiguracja Modali Nawigacyjnych */
        #more-options-panel .panel-content,
        #play-choice-panel .panel-content,
        #build-choice-panel .panel-content {
            background: rgba(0,0,0,0.6) !important;
            border: none !important;
            box-shadow: none !important;
            width: 95vw !important;
            max-width: 800px !important;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        @media (max-width: 600px) {
            .nav-grid-container {
                gap: 10px;
                grid-template-columns: repeat(3, 1fr);
            }
            .nav-btn-box, .nav-btn-box-green {
                width: 90px; height: 90px;
            }
            .nav-label {
                font-size: 9px;
                bottom: 10px;
            }
        }
    </style>

    <!-- PANEL "ZAGRAJ" -->
    <div id="play-choice-panel" class="panel-modal" style="display:none;">
        <div class="panel-content">
            <h1 class="text-outline" style="color: white; text-align: center; font-size: 32px; margin-bottom: 20px; width: 100%;">
                W co chcesz zagrać?
            </h1>
            <div class="nav-grid-container" style="justify-content: center; display: flex; gap: 30px;">
                <div class="nav-item" id="btn-play-parkour">
                    <div class="nav-btn-box">
                        <img src="icons/icon-parkour.png" class="nav-icon" onerror="this.src='icons/icon-jump.png'">
                        <span class="nav-label">Parkour</span>
                    </div>
                </div>
                <div class="nav-item" id="btn-play-chat">
                    <div class="nav-btn-box">
                        <img src="icons/icon-chat.png" class="nav-icon">
                        <span class="nav-label">Czat</span>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- PANEL "BUDUJ" -->
    <div id="build-choice-panel" class="panel-modal" style="display:none;">
        <div class="panel-content">
            <h1 class="text-outline" style="color: white; text-align: center; font-size: 32px; margin-bottom: 20px; width: 100%;">
                Co chcesz zbudować?
            </h1>
            <div class="nav-grid-container">
                <!-- GÓRNY RZĄD (ZIELONY - NOWE) -->
                <div class="nav-item" id="build-choice-new-skin">
                    <div class="nav-btn-box-green"><img src="icons/icon-newhypercube.png" class="nav-icon"><span class="nav-label">Nowa HyperCube</span></div>
                </div>
                <div class="nav-item" id="build-choice-new-part">
                    <div class="nav-btn-box-green"><img src="icons/icon-newhypercubepart.png" class="nav-icon"><span class="nav-label">Nowa Część</span></div>
                </div>
                <div class="nav-item" id="build-choice-new-world">
                    <div class="nav-btn-box-green"><img src="icons/icon-newworld.png" class="nav-icon"><span class="nav-label">Nowy Świat</span></div>
                </div>
                <div class="nav-item" id="build-choice-new-prefab">
                    <div class="nav-btn-box-green"><img src="icons/icon-newprefab.png" class="nav-icon"><span class="nav-label">Nowy Prefab</span></div>
                </div>

                <!-- DOLNY RZĄD (NIEBIESKI - EDYCJA) -->
                <div class="nav-item" id="build-choice-edit-skin">
                    <div class="nav-btn-box"><img src="icons/icon-newhypercube.png" class="nav-icon"><span class="nav-label">Edytuj HyperCube</span></div>
                </div>
                <div class="nav-item" id="build-choice-edit-part">
                    <div class="nav-btn-box"><img src="icons/icon-newhypercubepart.png" class="nav-icon"><span class="nav-label">Edytuj Część</span></div>
                </div>
                <div class="nav-item" id="build-choice-edit-world">
                    <div class="nav-btn-box"><img src="icons/icon-newworld.png" class="nav-icon"><span class="nav-label">Edytuj Świat</span></div>
                </div>
                <div class="nav-item" id="build-choice-edit-prefab">
                    <div class="nav-btn-box"><img src="icons/icon-newprefab.png" class="nav-icon"><span class="nav-label">Edytuj Prefab</span></div>
                </div>
            </div>
        </div>
    </div>

    <!-- PANEL "WIĘCEJ" -->
    <div id="more-options-panel" class="panel-modal" style="display:none;">
        <div class="nav-grid-container">
            <div class="nav-item"><div class="nav-btn-box"><img src="icons/misje.png" onerror="this.src='icons/icon-friends.png'" class="nav-icon"><span class="nav-label">Misje</span></div></div>
            <div class="nav-item" id="btn-open-news"><div class="nav-btn-box"><img src="icons/nagrody.png" onerror="this.src='icons/icon-shop.png'" class="nav-icon"><span class="nav-label">Nagrody</span><div id="rewards-badge" class="nav-badge" style="display:none;">0</div></div></div>
            <div class="nav-item" id="btn-open-highscores"><div class="nav-btn-box"><img src="icons/highscores.png" onerror="this.src='icons/icon-level.png'" class="nav-icon"><span class="nav-label">HighScores</span></div></div>
            <!-- Admin buttons will be injected here by UI -->
            <div class="nav-item"><div class="nav-btn-box"><img src="icons/tworzenie.png" onerror="this.src='icons/icon-build.png'" class="nav-icon"><span class="nav-label">Tworzenie</span></div></div>
            <div class="nav-item"><div class="nav-btn-box"><img src="icons/bezpieczenstwo.png" onerror="this.src='icons/icon-more.png'" class="nav-icon"><span class="nav-label">Bezpiecz.</span></div></div>
            <div class="nav-item" id="btn-nav-options"><div class="nav-btn-box"><img src="icons/opcje.png" onerror="this.src='icons/icon-more.png'" class="nav-icon"><span class="nav-label">Opcje</span></div></div>
            <div class="nav-item" id="logout-btn"><div class="nav-btn-box"><img src="icons/wyloguj.png" onerror="this.src='icons/icon-back.png'" class="nav-icon"><span class="nav-label">Wyloguj</span></div></div>
        </div>
    </div>
`;

export class NavigationManager {
    constructor(uiManager) {
        this.ui = uiManager;
    }

    initialize() {
        if (!document.getElementById('more-options-panel')) {
            const modalsLayer = document.getElementById('modals-layer');
            if (modalsLayer) {
                modalsLayer.insertAdjacentHTML('beforeend', TEMPLATE);
            }
        }
        this.setupEventListeners();
    }

    setupEventListeners() {
        // --- ZAMYKANIE NA TŁO ---
        const panels = ['play-choice-panel', 'build-choice-panel', 'more-options-panel'];
        panels.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.onclick = (e) => { if (e.target.id === id) this.closePanel(id); };
        });

        // --- PANEL ZAGRAJ ---
        this.bindClick('btn-play-parkour', () => {
            this.closePanel('play-choice-panel');
            this.ui.showDiscoverPanel('worlds', 'parkour');
        });
        this.bindClick('btn-play-chat', () => {
            this.closePanel('play-choice-panel');
            this.ui.showDiscoverPanel('worlds', 'creative');
        });

        // --- PANEL BUDUJ (NOWE) ---
        this.bindClick('build-choice-new-world', () => {
            this.closePanel('build-choice-panel');
            this.ui.openPanel('world-size-panel');
        });
        this.bindClick('build-choice-new-skin', () => {
            this.closePanel('build-choice-panel');
            if(this.ui.onSkinBuilderClick) this.ui.onSkinBuilderClick();
        });
        this.bindClick('build-choice-new-prefab', () => {
            this.closePanel('build-choice-panel');
            if(this.ui.onPrefabBuilderClick) this.ui.onPrefabBuilderClick();
        });
        this.bindClick('build-choice-new-part', () => {
            this.closePanel('build-choice-panel');
            if(this.ui.onPartBuilderClick) this.ui.onPartBuilderClick();
        });

        // --- PANEL BUDUJ (EDYCJA - PLACEHOLDERY) ---
        this.bindClick('build-choice-edit-skin', () => this.ui.showMessage("Funkcja edycji HyperCube wkrótce!", "info"));
        this.bindClick('build-choice-edit-part', () => this.ui.showMessage("Funkcja edycji Części wkrótce!", "info"));
        this.bindClick('build-choice-edit-world', () => this.ui.showMessage("Funkcja edycji Świata wkrótce!", "info"));
        this.bindClick('build-choice-edit-prefab', () => this.ui.showMessage("Funkcja edycji Prefabrykatu wkrótce!", "info"));

        // --- PANEL WIĘCEJ ---
        this.bindClick('btn-open-news', () => this.ui.newsManager.open());
        this.bindClick('btn-open-highscores', () => this.ui.highScoresManager.open());
        
        this.bindClick('btn-nav-options', () => {
            if(this.ui.onToggleFPS) {
                this.ui.onToggleFPS();
                this.ui.showMessage("Przełączono licznik FPS", "info");
            }
        });

        this.bindClick('logout-btn', () => {
            if(confirm("Czy na pewno chcesz się wylogować?")) {
                localStorage.removeItem(STORAGE_KEYS.JWT_TOKEN);
                localStorage.removeItem(STORAGE_KEYS.PLAYER_NAME);
                localStorage.removeItem(STORAGE_KEYS.USER_ID);
                window.location.reload();
            }
        });
    }

    bindClick(id, callback) {
        const el = document.getElementById(id);
        if (el) {
            el.onclick = () => {
                // Efekt kliknięcia
                el.style.transform = 'scale(0.95)';
                setTimeout(() => el.style.transform = 'scale(1)', 100);
                callback();
            };
        }
    }

    openPanel(id) {
        const p = document.getElementById(id);
        if (p) {
            this.ui.bringToFront(p);
            p.style.display = 'flex';
        }
    }

    closePanel(id) {
        const p = document.getElementById(id);
        if (p) p.style.display = 'none';
    }
}