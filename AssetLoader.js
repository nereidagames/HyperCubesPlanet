import * as THREE from 'three';
import { LOADING_TEXTS } from './Config.js';

export class AssetLoader {
    constructor(blockManager, onLoadComplete) {
        this.blockManager = blockManager;
        this.onLoadComplete = onLoadComplete; // Callback wywoływany po załadowaniu wszystkiego

        this.loadingManager = new THREE.LoadingManager();
        this.textureLoader = new THREE.TextureLoader(this.loadingManager);
        
        // Elementy UI
        this.ui = {
            screen: document.getElementById('loading-screen'),
            bar: document.getElementById('progress-bar-fill'),
            text: document.getElementById('loading-text')
        };

        this.textInterval = null;
        this.setupManager();
    }

    setupManager() {
        // Obsługa paska postępu
        this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
            const progress = (itemsLoaded / itemsTotal) * 100;
            if (this.ui.bar) this.ui.bar.style.width = `${progress}%`;
        };

        // Obsługa zakończenia ładowania
        this.loadingManager.onLoad = () => {
            clearInterval(this.textInterval);
            if (this.ui.text) this.ui.text.textContent = "Gotowe!";
            
            // Ukrywanie ekranu z opóźnieniem dla płynności
            setTimeout(() => {
                if (this.ui.screen) {
                    this.ui.screen.style.opacity = '0';
                    setTimeout(() => {
                        this.ui.screen.style.display = 'none';
                        // Wywołaj funkcję startu gry z main.js
                        if (this.onLoadComplete) this.onLoadComplete();
                    }, 500);
                }
            }, 500);
        };

        this.startLoadingTextAnimation();
    }

    startLoadingTextAnimation() {
        // Zmieniające się śmieszne teksty
        if (this.ui.text) {
            this.textInterval = setInterval(() => {
                const randomIndex = Math.floor(Math.random() * LOADING_TEXTS.length);
                this.ui.text.textContent = LOADING_TEXTS[randomIndex];
            }, 2000);
        }
    }

    // Główna metoda wywoływana z main.js
    preload() {
        const allBlocks = this.blockManager.getAllBlockDefinitions();
        allBlocks.forEach(block => {
            if (block.texturePath) {
                this.textureLoader.load(block.texturePath);
            }
        });
    }
    
    getTextureLoader() {
        return this.textureLoader;
    }
    
    getLoadingManager() {
        return this.loadingManager;
    }
}