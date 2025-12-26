/* PLIK: GameCore.js */
import * as THREE from 'three';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';

export class GameCore {
    constructor(containerId = 'gameContainer') {
        this.container = document.getElementById(containerId);
        
        // Pobieramy wymiary
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.clock = new THREE.Clock();

        // SCENA
        this.scene = new THREE.Scene();
        // Opcjonalnie: kolor tła, żeby nie było czarno zanim załaduje się skybox/mapa
        this.scene.background = new THREE.Color(0x87CEEB); 

        // KAMERA
        this.camera = new THREE.PerspectiveCamera(70, this.width / this.height, 0.1, 1000);

        // --- RENDERER (MOCNA OPTYMALIZACJA) ---
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: false, // WYŁĄCZONE WYGŁADZANIE (Kluczowe dla FPS)
            powerPreference: "high-performance", // Prośba do przeglądarki o użycie GPU
            precision: "mediump", // Mniejsza precyzja obliczeń (szybsze na starych GPU)
            depth: true,
            stencil: false // Wyłączamy bufor szablonowy (oszczędność pamięci)
        });

        // OGRANICZENIE ROZDZIELCZOŚCI
        // 0.85 oznacza 85% jakości. Na Celeronie da to ogromnego kopa.
        // Jeśli nadal tnie, zmień na 0.75.
        const pixelRatio = Math.min(window.devicePixelRatio, 1.5); 
        this.renderer.setPixelRatio(pixelRatio * 0.85); 
        
        this.renderer.setSize(this.width, this.height);
        
        // CIENIE (NAJSZYBSZY TYP)
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.BasicShadowMap; // Najprostsze cienie (Minecraft style)
        this.renderer.shadowMap.autoUpdate = true;

        // CSS2D RENDERER (Nicki nad głowami)
        this.css2dRenderer = new CSS2DRenderer();
        this.css2dRenderer.setSize(this.width, this.height);
        this.css2dRenderer.domElement.style.position = 'absolute';
        this.css2dRenderer.domElement.style.top = '0px';
        this.css2dRenderer.domElement.style.pointerEvents = 'none';

        // Dodanie do DOM
        if (this.container) {
            this.container.appendChild(this.renderer.domElement);
            this.container.appendChild(this.css2dRenderer.domElement);
        }

        // Obsługa zmiany rozmiaru okna
        window.addEventListener('resize', () => this.onWindowResize());
    }

    onWindowResize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(this.width, this.height);
        this.css2dRenderer.setSize(this.width, this.height);
    }

    render(activeScene) {
        const sceneToRender = activeScene || this.scene;
        this.renderer.render(sceneToRender, this.camera);
        this.css2dRenderer.render(sceneToRender, this.camera);
    }
}
