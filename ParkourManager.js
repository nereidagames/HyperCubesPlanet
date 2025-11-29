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
                    // Dodajemy 1.0 do Y, bo punkt pivota bloku to środek, a gracz stoi NA nim
                    // Player pivot jest w środku nóg (y=2.5 -> y=5.0), więc stopy są niżej.
                    // Dostosujemy detekcję do pozycji gracza.
                    this.startPositions.push(new THREE.Vector3(block.x, block.y + 1.0, block.z));
                }
                if (block.name === 'Parkour Meta') {
                    this.metaPositions.push(new THREE.Vector3(block.x, block.y + 1.0, block.z));
                }
            });
        }
        
        if (this.startPositions.length > 0) {
            // Pokaż licznik (wyzerowany)
            this.uiManager.setParkourTimerVisible(true);
            this.uiManager.updateParkourTimer("00:00.00");
        } else {
            this.uiManager.setParkourTimerVisible(false);
        }
    }
    
    update(deltaTime) {
        // Jeśli nie ma startów, to nie jest parkour
        if (this.startPositions.length === 0) return;

        const playerPos = this.game.characterManager.character.position;
        
        // 1. Sprawdź czy gracz jest na starcie (RESET)
        let onStart = false;
        for (const startPos of this.startPositions) {
            // Sprawdzamy dystans w poziomie (X, Z) i pionie (Y)
            // Dystans < 1.0 oznacza że stoimy mniej więcej na środku bloku
            const dx = Math.abs(playerPos.x - startPos.x);
            const dz = Math.abs(playerPos.z - startPos.z);
            const dy = Math.abs(playerPos.y - startPos.y); // startPos jest +1.0 od środka bloku

            // Tolerancja: 0.8 kratki w bok, 1.5 kratki w górę/dół
            if (dx < 0.8 && dz < 0.8 && dy < 2.0) {
                onStart = true;
                break;
            }
        }

        if (onStart) {
            this.resetRun();
            return;
        }
        
        // 2. Jeśli nie jesteśmy na starcie, a licznik stoi -> START
        if (!this.isRunning && this.elapsedTime === 0) {
            // Właśnie zeszliśmy ze startu
            this.isRunning = true;
        }

        // 3. Logika biegu
        if (this.isRunning) {
            this.elapsedTime += deltaTime;
            this.uiManager.updateParkourTimer(this.formatTime(this.elapsedTime));
            
            // 4. Sprawdź metę
            for (const metaPos of this.metaPositions) {
                const distance = playerPos.distanceTo(metaPos);
                // Meta ma większy zasięg (dotknięcie = 1.5 metra)
                if (distance < 1.5) {
                    this.finishRun();
                    break;
                }
            }
        }
    }
    
    resetRun() {
        if (this.elapsedTime > 0 || this.isRunning) {
            this.isRunning = false;
            this.elapsedTime = 0;
            this.uiManager.updateParkourTimer("00:00.00");
        }
    }
    
    finishRun() {
        this.isRunning = false;
        const finalTime = this.formatTime(this.elapsedTime);
        this.uiManager.showVictory(finalTime);
    }
    
    cleanup() {
        this.isRunning = false;
        this.uiManager.setParkourTimerVisible(false);
        this.uiManager.hideVictory();
    }
    
    formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        const ms = Math.floor((seconds * 100) % 100);
        
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    }
}