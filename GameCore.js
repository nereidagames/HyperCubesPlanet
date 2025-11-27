import * as THREE from 'three';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';

export class GameCore {
    constructor(containerId = 'gameContainer') {
        this.container = document.getElementById(containerId);
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        // Zegar do delta time
        this.clock = new THREE.Clock();

        // Scena i Kamera
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, this.width / this.height, 0.1, 1000);

        // Renderer WebGL (Główny)
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setClearColor(0x87CEEB, 1);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Renderer CSS2D (Do nicków nad głowami)
        this.css2dRenderer = new CSS2DRenderer();
        this.css2dRenderer.setSize(this.width, this.height);
        this.css2dRenderer.domElement.style.position = 'absolute';
        this.css2dRenderer.domElement.style.top = '0px';
        this.css2dRenderer.domElement.style.pointerEvents = 'none'; // Ważne: przepuszcza kliki do canvasu

        // Dodanie do DOM
        if (this.container) {
            this.container.appendChild(this.renderer.domElement);
            this.container.appendChild(this.css2dRenderer.domElement);
        } else {
            console.error(`Game container #${containerId} not found!`);
        }

        // Automatyczna obsługa resize
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

    // Metoda pomocnicza do renderowania aktywnej sceny
    render(activeScene) {
        const sceneToRender = activeScene || this.scene;
        this.renderer.render(sceneToRender, this.camera);
        this.css2dRenderer.render(sceneToRender, this.camera);
    }

    getDelta() {
        return this.clock.getDelta();
    }
}