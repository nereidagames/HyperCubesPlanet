import * as THREE from 'three';

const API_BASE_URL = 'https://hypercubes-nexus-server.onrender.com';

export class ParkourManager {
    constructor(game, uiManager) {
        this.game = game;
        this.uiManager = uiManager;
        this.isRunning = false;
        this.elapsedTime = 0;
        
        this.startPositions = [];
        this.metaPositions = [];
    }
    
    init(worldData) {
        this.startPositions = [];
        this.metaPositions = [];
        this.isRunning = false;
        this.elapsedTime = 0;
        
        if (worldData && worldData.blocks) {
            worldData.blocks.forEach(block => {
                if (block.name === 'Parkour Start') {
                    this.startPositions.push(new THREE.Vector3(block.x, block.y + 1.0, block.z));
                }
                if (block.name === 'Parkour Meta') {
                    this.metaPositions.push(new THREE.Vector3(block.x, block.y + 1.0, block.z));
                }
            });
        }
        
        if (this.startPositions.length > 0) {
            this.uiManager.setParkourTimerVisible(true);
            this.uiManager.updateParkourTimer("00:00.00");
            
            // --- FIX: REJESTRACJA CALLBACKÓW DLA UI ---
            this.uiManager.onExitParkour = () => this.game.stateManager.switchToMainMenu();
            this.uiManager.onReplayParkour = () => this.restartParkour();
        } else {
            this.uiManager.setParkourTimerVisible(false);
        }
    }
    
    restartParkour() {
        this.isRunning = false;
        this.elapsedTime = 0;
        this.uiManager.updateParkourTimer("00:00.00");
        this.uiManager.hideVictory();
        
        if (this.startPositions.length > 0 && this.game.characterManager.character) {
            const start = this.startPositions[0];
            // Teleportuj gracza +0.5 wyżej żeby nie utknął
            this.game.characterManager.character.position.set(start.x, start.y + 0.5, start.z);
            // Reset prędkości w kontrolerze (jeśli dostępny)
            if (this.game.playerController) {
                this.game.playerController.velocity.set(0, 0, 0);
            }
        }
    }

    update(deltaTime) {
        if (this.startPositions.length === 0) return;

        const playerPos = this.game.characterManager.character.position;
        
        let onStart = false;
        for (const startPos of this.startPositions) {
            const dx = Math.abs(playerPos.x - startPos.x);
            const dz = Math.abs(playerPos.z - startPos.z);
            const dy = Math.abs(playerPos.y - startPos.y); 

            if (dx < 0.8 && dz < 0.8 && dy < 2.0) {
                onStart = true;
                break;
            }
        }

        if (onStart) {
            // Jeśli wróciliśmy na start, resetujemy czas
            if (this.isRunning || this.elapsedTime > 0) {
                this.isRunning = false;
                this.elapsedTime = 0;
                this.uiManager.updateParkourTimer("00:00.00");
            }
            return;
        }
        
        if (!this.isRunning && this.elapsedTime === 0) {
            this.isRunning = true;
        }

        if (this.isRunning) {
            this.elapsedTime += deltaTime;
            this.uiManager.updateParkourTimer(this.formatTime(this.elapsedTime));
            
            for (const metaPos of this.metaPositions) {
                const distance = playerPos.distanceTo(metaPos);
                if (distance < 1.5) {
                    this.finishRun();
                    break;
                }
            }
        }
    }
    
    async finishRun() {
        this.isRunning = false;
        const finalTime = this.formatTime(this.elapsedTime);
        
        // Najpierw pobierz nagrodę, potem pokaż UI
        const token = localStorage.getItem('bsp_clone_jwt_token');
        let rewardData = null;

        if (token) {
            try {
                const response = await fetch(`${API_BASE_URL}/api/parkour/complete`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                
                if (data.success) {
                    this.uiManager.updateCoinCounter(data.newCoins);
                    this.uiManager.updateLevelInfo(data.newLevel, data.newXp, data.maxXp);
                    rewardData = data;
                }
            } catch (e) {
                console.error("Błąd nagrody parkour:", e);
            }
        }

        // Przekazujemy dane do UI (czas + dane nagrody)
        this.uiManager.handleParkourCompletion(finalTime, rewardData);
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