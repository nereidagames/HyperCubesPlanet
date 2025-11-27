import * as THREE from 'three';

export class ParkourManager {
    constructor(game, uiManager) {
        this.game = game;
        this.uiManager = uiManager;
        this.isRunning = false;
        this.startTime = 0;
        this.elapsedTime = 0;
        
        this.startPositions = [];
        this.metaPositions = [];
        
        // Zabezpieczenie przed "spamowaniem" startu
        this.lastStartTrigger = 0;
    }
    
    init(worldData) {
        this.startPositions = [];
        this.metaPositions = [];
        this.isRunning = false;
        this.elapsedTime = 0;
        
        // Przeszukujemy bloki świata, by znaleźć Start i Metę
        if (worldData && worldData.blocks) {
            worldData.blocks.forEach(block => {
                if (block.name === 'Parkour Start') {
                    // Dodajemy 0.5 do Y, bo punkt pivota bloku to środek, a gracz stoi na górze
                    this.startPositions.push(new THREE.Vector3(block.x, block.y + 1.5, block.z));
                }
                if (block.name === 'Parkour Meta') {
                    this.metaPositions.push(new THREE.Vector3(block.x, block.y + 1.0, block.z));
                }
            });
        }
        
        // Pokaż licznik (wyzerowany)
        this.uiManager.setParkourTimerVisible(true);
        this.uiManager.updateParkourTimer("00:00.00");
    }
    
    update(deltaTime) {
        const playerPos = this.game.characterManager.character.position;
        
        // 1. Sprawdź czy gracz jest na starcie
        // Jeśli tak: zresetuj licznik i ustaw stan gotowości
        for (const startPos of this.startPositions) {
            const dist = playerPos.distanceTo(startPos);
            // Dystans < 1.0 oznacza że stoimy na bloku
            if (dist < 1.2) {
                this.resetRun();
            }
        }
        
        // 2. Jeśli biegniemy - licz czas
        if (this.isRunning) {
            this.elapsedTime += deltaTime;
            this.uiManager.updateParkourTimer(this.formatTime(this.elapsedTime));
            
            // 3. Sprawdź metę
            for (const metaPos of this.metaPositions) {
                // Meta ma większy zasięg (dotknięcie)
                if (playerPos.distanceTo(metaPos) < 1.5) {
                    this.finishRun();
                    break;
                }
            }
        } else {
            // Jeśli NIE biegniemy, a nie jesteśmy na starcie (czyli ruszyliśmy) -> START
            // Ale musimy upewnić się, że "byliśmy" na starcie przed chwilą (resetRun ustawia lastStartTrigger)
            if (this.elapsedTime === 0 && Date.now() - this.lastStartTrigger < 2000) {
                // Sprawdź czy oddaliliśmy się od startu
                let awayFromStart = true;
                for (const startPos of this.startPositions) {
                    if (playerPos.distanceTo(startPos) < 1.3) {
                        awayFromStart = false; 
                        break;
                    }
                }
                
                if (awayFromStart) {
                    this.isRunning = true;
                }
            }
        }
    }
    
    resetRun() {
        this.isRunning = false;
        this.elapsedTime = 0;
        this.uiManager.updateParkourTimer("00:00.00");
        this.lastStartTrigger = Date.now();
    }
    
    finishRun() {
        this.isRunning = false;
        const finalTime = this.formatTime(this.elapsedTime);
        this.uiManager.showVictory(finalTime);
        
        // Opcjonalnie: Teleport na start po zamknięciu okna (logika w UI)
    }
    
    cleanup() {
        this.isRunning = false;
        this.uiManager.setParkourTimerVisible(false);
    }
    
    formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        const ms = Math.floor((seconds * 100) % 100);
        
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    }
}