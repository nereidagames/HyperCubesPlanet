import * as THREE from 'three';

export class GameStateManager {
    constructor(gameCore, uiManager) {
        this.core = gameCore;
        this.ui = uiManager;
        
        this.currentState = 'Loading';
        
        this.managers = {
            playerController: null,
            cameraController: null,
            character: null,
            multiplayer: null,
            coin: null,
            build: null,
            skinBuild: null,
            prefabBuild: null,
            partBuild: null,
            parkour: null
        };

        this.exploreScene = null;
    }

    setManagers(managers) {
        this.managers = { ...this.managers, ...managers };
    }

    update(deltaTime) {
        if (this.currentState === 'Loading') return;

        if (this.currentState === 'MainMenu' || this.currentState === 'ExploreMode') {
            const { playerController, cameraController, character, multiplayer, coin, parkour } = this.managers;

            if (playerController && cameraController && cameraController.update) {
                const rot = cameraController.update(deltaTime);
                if (playerController.update) playerController.update(deltaTime, rot);
            }
            
            if (character && character.update) character.update(deltaTime);
            if (multiplayer && multiplayer.update) multiplayer.update(deltaTime);
            if (coin && coin.update) coin.update(deltaTime);
            
            if (parkour && this.currentState === 'ExploreMode' && parkour.update) {
                parkour.update(deltaTime);
            }

            const targetScene = (this.currentState === 'ExploreMode' && this.exploreScene) ? this.exploreScene : this.core.scene;
            this.core.render(targetScene);
        }
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

    switchToExploreMode(scene) {
        if (this.ui) this.ui.clearChat();
        this.exploreScene = scene;
        this.currentState = 'ExploreMode';
        document.querySelector('.ui-overlay').style.display = 'block';
        const buttons = document.querySelector('.game-buttons');
        if (buttons) buttons.style.display = 'none';
        this.ui.toggleMobileControls(true);
        const joystickZone = document.getElementById('joystick-zone');
        if(joystickZone) joystickZone.style.display = 'block'; 
    }

    // FIX: Dodano parametr isNexusMode i przekazano go dalej
    switchToBuildMode(size, isNexusMode = false) {
        if (this.currentState !== 'MainMenu') return;
        this.currentState = 'BuildMode';
        this.toggleGameControls(false);
        if (this.managers.build) this.managers.build.enterBuildMode(size, isNexusMode);
    }

    switchToSkinBuilder() { if (this.currentState !== 'MainMenu') return; this.currentState = 'SkinBuilderMode'; this.toggleGameControls(false); if (this.managers.skinBuild) this.managers.skinBuild.enterBuildMode(); }
    switchToPrefabBuilder() { if (this.currentState !== 'MainMenu') return; this.currentState = 'PrefabBuilderMode'; this.toggleGameControls(false); if (this.managers.prefabBuild) this.managers.prefabBuild.enterBuildMode(); }
    switchToPartBuilder() { if (this.currentState !== 'MainMenu') return; this.currentState = 'PartBuilderMode'; this.toggleGameControls(false); if (this.managers.partBuild) this.managers.partBuild.enterBuildMode(); }

    switchToMainMenu() {
        if (this.currentState === 'MainMenu') return;

        if (this.currentState === 'ExploreMode') {
            if (this.ui) this.ui.clearChat();
            if (this.managers.multiplayer) {
                this.managers.multiplayer.joinWorld('nexus');
                this.managers.multiplayer.setScene(this.core.scene);
            }
            if (this.managers.parkour) {
                this.managers.parkour.cleanup();
            }

            if (this.managers.character && this.managers.character.character) {
                this.core.scene.add(this.managers.character.character);
                if (this.managers.character.shadow) {
                    this.core.scene.add(this.managers.character.shadow);
                }
            }

            const exitBtn = document.getElementById('explore-exit-button');
            if (exitBtn) exitBtn.style.display = 'none';
            
            this.currentState = 'MainMenu';
            this.toggleGameControls(true);
            this.exploreScene = null; 

            if (this.onRecreateController) {
                this.onRecreateController(null);
            }
        } 
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
        if (this.managers.cameraController) this.managers.cameraController.enabled = visible;
        this.ui.toggleMobileControls(visible);
    }
}
