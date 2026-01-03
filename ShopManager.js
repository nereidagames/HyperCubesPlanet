/* PLIK: ShopManager.js */
import { STORAGE_KEYS } from './Config.js';

const TEMPLATE = `
    <style>
        /* GŁÓWNY KONTENER SKLEPU */
        #shop-panel .panel-content {
            background: rgba(0,0,0,0.6) !important;
            border: none !important;
            box-shadow: none !important;
            width: 95vw !important;
            max-width: 900px !important;
            display: flex;
            flex-direction: column;
            align-items: center;
            pointer-events: auto;
        }

        /* TYTUŁ */
        .shop-header-title {
            font-family: 'Titan One', cursive;
            color: white;
            font-size: 48px;
            text-shadow: 3px 3px 0 #000;
            margin-bottom: 20px;
            text-align: center;
        }

        /* GRID MENU GŁÓWNEGO (KATEGORIE) */
        .shop-grid-container {
            display: grid;
            grid-template-columns: repeat(5, 1fr); 
            gap: 15px;
            justify-content: center;
            width: 100%;
            padding: 10px;
        }

        /* STYL PRZYCISKU KATEGORII */
        .shop-nav-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            cursor: url('icons/cursor.png'), auto;
            transition: transform 0.1s;
            position: relative;
        }
        .shop-nav-item:active { transform: scale(0.95); }

        .shop-btn-box {
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

        .shop-btn-box.blue-style {
            filter: hue-rotate(10deg) brightness(1.1) drop-shadow(0 4px 4px rgba(0,0,0,0.3));
        }

        .shop-icon {
            width: 60%; height: 60%;
            object-fit: contain;
            filter: drop-shadow(0 2px 2px rgba(0,0,0,0.3));
            z-index: 1;
        }

        .shop-label {
            position: absolute;
            bottom: 12px;
            left: 0;
            width: 100%;
            color: white;
            font-size: 10px;
            font-family: 'Titan One', cursive;
            text-shadow: -1.5px -1.5px 0 #000, 1.5px -1.5px 0 #000;
            text-align: center;
            z-index: 2;
            pointer-events: none;
            line-height: 1.1;
            padding: 0 5px;
        }

        /* WIDOK LISTY PRZEDMIOTÓW */
        #shop-items-view {
            display: none; 
            width: 100%;
            max-width: 600px;
            background: rgba(0, 0, 0, 0.85);
            border: 3px solid white;
            border-radius: 15px;
            padding: 20px;
            flex-direction: column;
            align-items: center;
            max-height: 70vh;
        }

        #shop-list-container {
            width: 100%;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 10px;
            padding-right: 5px;
        }

        .shop-list-item {
            background-color: #2c75ff;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            border-radius: 8px;
            border: 2px solid white;
        }
        
        .shop-item-info { display: flex; align-items: center; gap: 15px; }
        .shop-item-thumb { width: 50px; height: 50px; background-size: cover; border: 2px solid white; border-radius: 5px; background-color: #000; }
        .shop-item-name { font-size: 18px; color: white; text-shadow: 1px 1px 0 #000; }
        
        .shop-buy-btn {
            background: #2ecc71; border: 2px solid white; border-radius: 8px;
            padding: 5px 15px; color: white; font-family: inherit; cursor: url('icons/cursor.png'), auto;
            display: flex; align-items: center; gap: 5px; font-size: 16px;
            box-shadow: 0 4px 0 #27ae60;
        }
        .shop-buy-btn:active { transform: translateY(2px); box-shadow: 0 0 0 #27ae60; }
        .owned-label { color: #f1c40f; font-weight: bold; text-shadow: 1px 1px 0 #000; }

        @media (max-width: 900px) {
            .shop-grid-container {
                grid-template-columns: repeat(3, 1fr); 
            }
            .shop-btn-box { width: 90px; height: 90px; }
            .shop-label { font-size: 9px; }
            .shop-header-title { font-size: 32px; }
        }
    </style>

    <div id="shop-panel" class="panel-modal" style="display:none;">
        <div class="panel-content">
            
            <div id="shop-main-menu">
                <h1 class="shop-header-title">Kup</h1>
                <div class="shop-grid-container">
                    
                    <!-- RZĄD 1 -->
                    <div class="shop-nav-item" id="btn-shop-blocks">
                        <div class="shop-btn-box blue-style">
                            <img src="icons/Blocks.png" class="shop-icon" onerror="this.onerror=null; this.src='icons/icon-build.png'">
                            <span class="shop-label">Klocki</span>
                        </div>
                    </div>
                    
                    <div class="shop-nav-item" id="btn-shop-weapon">
                        <div class="shop-btn-box blue-style">
                            <img src="icons/Weapons.png" class="shop-icon" onerror="this.onerror=null; this.src='icons/icon-more.png'">
                            <span class="shop-label">Broń</span>
                        </div>
                    </div>

                    <div class="shop-nav-item" id="btn-shop-legs">
                        <div class="shop-btn-box blue-style">
                            <img src="icons/Legs.png" class="shop-icon" onerror="this.onerror=null; this.src='icons/icon-jump.png'">
                            <span class="shop-label">Przedmioty dolne</span>
                        </div>
                    </div>

                    <div class="shop-nav-item" id="btn-shop-vip">
                        <div class="shop-btn-box blue-style">
                            <img src="icons/vip.png" class="shop-icon" onerror="this.onerror=null; this.src='icons/vip_badge.png'">
                            <span class="shop-label">VIP</span>
                        </div>
                    </div>

                    <div class="shop-nav-item" id="btn-shop-pets">
                        <div class="shop-btn-box blue-style">
                            <img src="icons/Pets.png" class="shop-icon" onerror="this.onerror=null; this.src='icons/icon-friends.png'">
                            <span class="shop-label">Zwierzaki</span>
                        </div>
                    </div>

                    <!-- RZĄD 2 -->
                    <div class="shop-nav-item" id="btn-shop-addons">
                        <div class="shop-btn-box blue-style">
                            <img src="icons/WorldSpecials.png" class="shop-icon" onerror="this.onerror=null; this.src='icons/icon-newworld.png'">
                            <span class="shop-label">Dodatki Do Światów</span>
                        </div>
                    </div>

                    <div class="shop-nav-item" id="btn-shop-skybox">
                        <div class="shop-btn-box blue-style">
                            <img src="icons/Skydomes.png" class="shop-icon" onerror="this.onerror=null; this.src='icons/icon-discover.png'">
                            <span class="shop-label">Panorama nieba</span>
                        </div>
                    </div>

                    <div class="shop-nav-item" id="btn-shop-bg">
                        <div class="shop-btn-box blue-style">
                            <img src="icons/Backgrounds.png" class="shop-icon" onerror="this.onerror=null; this.src='icons/icon-build.png'">
                            <span class="shop-label">Tła</span>
                        </div>
                    </div>

                    <div class="shop-nav-item" id="btn-shop-music">
                        <div class="shop-btn-box blue-style">
                            <img src="icons/Music.png" class="shop-icon" onerror="this.onerror=null; this.src='icons/icon-play.png'">
                            <span class="shop-label">Muzyka</span>
                        </div>
                    </div>

                </div>
            </div>

            <div id="shop-items-view">
                <h2 id="shop-category-title" class="text-outline" style="margin-bottom:15px; font-size:24px;">Kategoria</h2>
                <div id="shop-list-container"></div>
                <button class="panel-close-button" id="btn-shop-back">Wróć</button>
            </div>

        </div>
    </div>
`;

export class ShopManager {
    constructor(uiManager) {
        this.ui = uiManager;
        this.allItems = [];
        this.isOwnedCallback = null;
        this.currentCategory = null;
    }

    initialize() {
        if (document.getElementById('shop-panel')) {
            document.getElementById('shop-panel').remove();
        }
        const modalsLayer = document.getElementById('modals-layer');
        if (modalsLayer) {
            modalsLayer.insertAdjacentHTML('beforeend', TEMPLATE);
        }
        this.setupEventListeners();
    }

    setupEventListeners() {
        const panel = document.getElementById('shop-panel');
        if(panel) {
            panel.addEventListener('click', (e) => {
                if(e.target.id === 'shop-panel') this.close();
            });
        }

        const backBtn = document.getElementById('btn-shop-back');
        if(backBtn) {
            backBtn.onclick = () => {
                document.getElementById('shop-items-view').style.display = 'none';
                document.getElementById('shop-main-menu').style.display = 'block';
            };
        }

        // --- OBSŁUGA KATEGORII ---
        this.bindCategory('btn-shop-blocks', 'block', 'Klocki');
        this.bindCategory('btn-shop-addons', 'addon', 'Dodatki Do Światów');

        // Placeholdery
        const placeholders = [
            ['btn-shop-weapon', 'Broń'],
            ['btn-shop-legs', 'Przedmioty dolne'],
            ['btn-shop-vip', 'VIP'],
            ['btn-shop-pets', 'Zwierzaki'],
            ['btn-shop-skybox', 'Panorama nieba'],
            ['btn-shop-bg', 'Tła'],
            ['btn-shop-music', 'Muzyka']
        ];
        
        placeholders.forEach(([id, name]) => this.bindPlaceholder(id, name));
    }

    bindCategory(btnId, categoryKey, title) {
        const btn = document.getElementById(btnId);
        if(btn) {
            btn.onclick = () => {
                this.openCategory(categoryKey, title);
            };
        }
    }

    bindPlaceholder(btnId, name) {
        const btn = document.getElementById(btnId);
        if(btn) {
            btn.onclick = () => {
                this.ui.showMessage(`Sekcja "${name}" dostępna wkrótce!`, 'info');
            };
        }
    }

    open(allBlocks, isOwnedCallback) {
        console.log("Otwieranie sklepu. Liczba przekazanych bloków:", allBlocks.length);
        this.allItems = allBlocks;
        this.isOwnedCallback = isOwnedCallback;

        const panel = document.getElementById('shop-panel');
        if (panel) {
            this.ui.bringToFront(panel);
            panel.style.display = 'flex';
            document.getElementById('shop-main-menu').style.display = 'block';
            document.getElementById('shop-items-view').style.display = 'none';
        }
    }

    close() {
        const panel = document.getElementById('shop-panel');
        if (panel) panel.style.display = 'none';
    }

    openCategory(category, title) {
        document.getElementById('shop-main-menu').style.display = 'none';
        const itemView = document.getElementById('shop-items-view');
        itemView.style.display = 'flex';
        
        document.getElementById('shop-category-title').textContent = title;
        
        this.renderItems(category);
    }

    renderItems(category) {
        const list = document.getElementById('shop-list-container');
        list.innerHTML = '';

        // --- DEBUGOWANIE ---
        console.log("=== SHOP DEBUG ===");
        console.log("Szukana kategoria:", category);
        console.log("Wszystkie elementy w pamięci Managera:", this.allItems.length);
        if (this.allItems.length > 0) {
            // Wypisz strukturę pierwszego obiektu, żeby sprawdzić czy ma pole 'category'
            console.log("Przykładowy przedmiot (pierwszy z listy):", JSON.stringify(this.allItems[0], null, 2));
        }

        const filteredItems = this.allItems.filter(item => {
            const cat = item.category || 'block'; 
            return cat === category;
        });

        console.log("Znaleziono pasujących po filtracji:", filteredItems.length);

        if (filteredItems.length === 0) {
            list.innerHTML = '<p style="color:white; text-align:center;">Brak elementów w tej kategorii.</p>';
            return;
        }

        filteredItems.forEach(item => {
            const isOwned = this.isOwnedCallback ? this.isOwnedCallback(item.name) : false;
            
            const div = document.createElement('div');
            div.className = 'shop-list-item';
            
            div.innerHTML = `
                <div class="shop-item-info">
                    <div class="shop-item-thumb" style="background-image: url('${item.texturePath}')"></div>
                    <span class="shop-item-name text-outline">${item.name}</span>
                </div>
                <div class="shop-item-action">
                    ${isOwned 
                        ? `<span class="owned-label text-outline">Posiadane</span>` 
                        : `<button class="shop-buy-btn text-outline">${item.cost} <img src="icons/icon-coin.png" width="20"></button>`
                    }
                </div>
            `;
            
            if (!isOwned) {
                const buyBtn = div.querySelector('.shop-buy-btn');
                buyBtn.onclick = () => {
                    if (this.ui.onBuyBlock) {
                        this.ui.onBuyBlock(item).then(() => {
                             this.renderItems(category); // Odśwież po zakupie
                        });
                    }
                };
            }

            list.appendChild(div);
        });
    }
}
