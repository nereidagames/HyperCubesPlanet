import * as THREE from 'three';

export class GameStateManager {
    constructor(gameCore, uiManager) {
        this.core = gameCore;
        this.ui = uiManager;
        
        this.currentState = 'Loading';
        
        // Referencje do managerów
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

    setManagers(managers) {
        this.managers = { ...this.managers, ...managers };
    }

    // Główna pętla (zamiast tej w main.js)
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

            // Renderowanie: Wybieramy albo scenę główną (Menu), albo scenę eksploracji
            const targetScene = (this.currentState === 'ExploreMode' && this.exploreScene) ? this.exploreScene : this.core.scene;
            this.core.render(targetScene);
        }
        
        // 2. Tryby BUDOWANIA (każdy ma swoją własną scenę wewnątrz managera)
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

    // Metoda wywoływana przez main.js PO stworzeniu świata
    switchToExploreMode(scene) {
        this.exploreScene = scene;
        this.currentState = 'ExploreMode';
        
        // UI: Pokaż overlay, schowaj menu główne
        document.querySelector('.ui-overlay').style.display = 'block';
        const buttons = document.querySelector('.game-buttons');
        if (buttons) buttons.style.display = 'none';
        
        this.ui.toggleMobileControls(true);
        const exitBtn = document.getElementById('explore-exit-button');
        if (exitBtn) exitBtn.style.display = 'flex';
    }

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

        // Wyjście z trybu eksploracji
        if (this.currentState === 'ExploreMode') {
            // Reset UI
            const exitBtn = document.getElementById('explore-exit-button');
            if (exitBtn) exitBtn.style.display = 'none';
            
            this.currentState = 'MainMenu';
            this.toggleGameControls(true);
            this.exploreScene = null; // Czyścimy referencję
        } 
        // Wyjście z trybów budowania
        else {
            if (this.currentState === 'BuildMode') this.managers.build.exitBuildMode();
            else if (this.currentState === 'SkinBuilderMode') this.managers.skinBuild.exitBuildMode();
            else if (this.currentState === 'PrefabBuilderMode') this.managers.prefabBuild.exitBuildMode();
            else if (this.currentState === 'PartBuilderMode') this.managers.partBuild.exitBuildMode();

            this.currentState = 'MainMenu';
            this.toggleGameControls(true);
        }
    }

    toggleGameControls(visible) {
        const overlay = document.querySelector('.ui-overlay');
        if(overlay) overlay.style.display = visible ? 'block' : 'none';
        
        const buttons = document.querySelector('.game-buttons');
        if (buttons) buttons.style.display = visible ? 'flex' : 'none';

        if (this.managers.cameraController) {
            this.managers.cameraController.enabled = visible;
        }
        
        this.ui.toggleMobileControls(visible);
    }
}