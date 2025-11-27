import * as THREE from 'three';

export class GameStateManager {
    constructor(gameCore, uiManager) {
        this.core = gameCore; // Dostęp do sceny i kamery
        this.ui = uiManager;
        
        this.currentState = 'Loading';
        
        // Referencje do managerów (przypiszemy je później w main.js)
        this.managers = {
            playerController: null,
            cameraController: null,
            character: null,
            multiplayer: null,
            coin: null,
            build: null,
            skinBuild: null,
            prefabBuild: null,
            partBuild: null
        };

        this.exploreScene = null;
    }

    // Ustawia managery po ich utworzeniu w main.js
    setManagers(managers) {
        this.managers = { ...this.managers, ...managers };
    }

    // --- GŁÓWNA PĘTLA LOGIKI (Zastępuje logikę w animate w main.js) ---
    update(deltaTime) {
        if (this.currentState === 'Loading') return;

        // 1. Tryb GRY (Menu lub Eksploracja)
        if (this.currentState === 'MainMenu' || this.currentState === 'ExploreMode') {
            const { playerController, cameraController, character, multiplayer, coin } = this.managers;

            // Fizyka i ruch
            if (playerController && cameraController && cameraController.update) {
                const rot = cameraController.update(deltaTime);
                if (playerController.update) playerController.update(deltaTime, rot);
            }
            
            // Inne systemy
            if (character && character.update) character.update(deltaTime);
            if (multiplayer && multiplayer.update) multiplayer.update(deltaTime);
            if (coin && coin.update) coin.update(deltaTime);

            // Renderowanie
            const targetScene = (this.currentState === 'ExploreMode' && this.exploreScene) ? this.exploreScene : this.core.scene;
            this.core.render(targetScene);
        }
        
        // 2. Tryby BUDOWANIA
        else if (this.currentState === 'BuildMode' && this.managers.build) {
            this.managers.build.update(deltaTime);
            this.core.render(this.managers.build.scene);
        } 
        else if (this.currentState === 'SkinBuilderMode' && this.managers.skinBuild) {
            this.managers.skinBuild.update(deltaTime);
            this.core.render(this.managers.skinBuild.scene);
        } 
        else if (this.currentState === 'PrefabBuilderMode' && this.managers.prefabBuild) {
            this.managers.prefabBuild.update(deltaTime);
            this.core.render(this.managers.prefabBuild.scene);
        } 
        else if (this.currentState === 'PartBuilderMode' && this.managers.partBuild) {
            this.managers.partBuild.update(deltaTime);
            this.core.render(this.managers.partBuild.scene);
        }
    }

    // --- PRZEŁĄCZANIE STANÓW ---

    switchToBuildMode(size) {
        if (this.currentState !== 'MainMenu') return;
        this.currentState = 'BuildMode';
        this.toggleGameControls(false);
        if (this.managers.build) this.managers.build.enterBuildMode(size);
    }

    switchToSkinBuilder() {
        if (this.currentState !== 'MainMenu') return;
        this.currentState = 'SkinBuilderMode';
        this.toggleGameControls(false);
        if (this.managers.skinBuild) this.managers.skinBuild.enterBuildMode();
    }
    
    switchToPrefabBuilder() {
        if (this.currentState !== 'MainMenu') return;
        this.currentState = 'PrefabBuilderMode';
        this.toggleGameControls(false);
        if (this.managers.prefabBuild) this.managers.prefabBuild.enterBuildMode();
    }
    
    switchToPartBuilder() {
        if (this.currentState !== 'MainMenu') return;
        this.currentState = 'PartBuilderMode';
        this.toggleGameControls(false);
        if (this.managers.partBuild) this.managers.partBuild.enterBuildMode();
    }

    switchToMainMenu() {
        if (this.currentState === 'MainMenu') return;

        // Wyjście z trybu eksploracji (powrót do Nexusa)
        if (this.currentState === 'ExploreMode') {
            if (this.managers.multiplayer) {
                this.managers.multiplayer.joinWorld('nexus');
                this.managers.multiplayer.setScene(this.core.scene);
            }
            
            const char = this.managers.character.character;
            this.core.scene.add(char);
            char.position.set(0, 5, 0);
            
            document.getElementById('explore-exit-button').style.display = 'none';
            this.currentState = 'MainMenu';
            this.toggleGameControls(true);
            
            // Musimy zrebootować kontroler dla sceny Nexusa
            // (W main.js przekażemy funkcję do tego, bo wymaga dostępu do sceneManager)
            if(this.onRecreateController) this.onRecreateController(null); // null = użyj domyślnych
            
            if(this.managers.cameraController) {
                this.managers.cameraController.target = char;
            }
        } 
        // Wyjście z trybów budowania
        else {
            if (this.currentState === 'BuildMode') this.managers.build.exitBuildMode();
            else if (this.currentState === 'SkinBuilderMode') this.managers.skinBuild.exitBuildMode();
            else if (this.currentState === 'PrefabBuilderMode') this.managers.prefabBuild.exitBuildMode();
            else if (this.currentState === 'PartBuilderMode') this.managers.partBuild.exitBuildMode();

            this.currentState = 'MainMenu';
            this.toggleGameControls(true);
            
            // Reboot kontrolera
            if(this.onRecreateController) this.onRecreateController(null);
            
            const char = this.managers.character.character;
            if(this.managers.cameraController) {
                this.managers.cameraController.target = char;
            }
        }
    }

    loadAndExploreWorld(worldData, sceneManager) {
        if (!worldData) return;
        
        let worldBlocksData = Array.isArray(worldData) ? worldData : (worldData.blocks || []);
        let worldSize = Array.isArray(worldData) ? 64 : (worldData.size || 64);

        if (this.managers.multiplayer && worldData.id) {
            this.managers.multiplayer.joinWorld(worldData.id);
        }

        this.currentState = 'ExploreMode';
        
        // UI: Pokaż overlay, schowaj menu
        document.querySelector('.ui-overlay').style.display = 'block';
        const buttons = document.querySelector('.game-buttons');
        if (buttons) buttons.style.display = 'none';
        
        this.ui.toggleMobileControls(true);
        document.getElementById('explore-exit-button').style.display = 'flex';

        // Tworzenie sceny eksploracji
        this.exploreScene = new THREE.Scene();
        this.exploreScene.background = new THREE.Color(0x87CEEB);
        
        // ... (Tu normalnie była logika tworzenia sceny, ale żeby nie duplikować kodu,
        // najlepiej zlecić to SceneManagerowi, jeśli go przerobimy, ale na razie
        // zostawmy uproszczoną wersję tutaj lub w main.js. 
        // DLA CZYSTOŚCI: Przekażmy to z powrotem do main.js lub SceneManagera w przyszłości.
        // Na ten moment GameStateManager przygotowuje grunt).
        
        // Aby nie komplikować teraz przenoszenia logiki renderowania mapy, 
        // założymy, że main.js lub SceneManager to zrobi. 
        // ALE: GameStateManager zarządza stanem.
        
        // Wróćmy do strategii: GameStateManager zarządza przełączaniem.
        // Logika tworzenia sceny eksploracji jest długa. 
        // Sugeruję zostawić `loadAndExploreWorld` w SceneManagerze lub Main.js i tylko
        // informować GameStateManager o zmianie stanu.
        
        // **KOREKTA:** Aby ten plik działał, musi albo zawierać kod tworzenia świata,
        // albo wywoływać funkcję zewnętrzną.
        // Zrobimy tak: `main.js` wywoła metodę pomocniczą, a GameStateManager tylko ustawi flagi.
    }

    // Pomocnicza metoda do UI
    toggleGameControls(visible) {
        const overlay = document.querySelector('.ui-overlay');
        if(overlay) overlay.style.display = visible ? 'block' : 'none';
        
        // Pokaż/ukryj przyciski menu głównego
        const buttons = document.querySelector('.game-buttons');
        if (buttons) buttons.style.display = visible ? 'flex' : 'none';

        if (this.managers.playerController) {
            this.managers.playerController.destroy();
            this.managers.playerController = null; // Zostanie odtworzony
        }
        if (this.managers.cameraController) {
            this.managers.cameraController.enabled = visible;
        }
        
        this.ui.toggleMobileControls(visible);
    }
}