import * as THREE from 'three';

const API_BASE_URL = 'https://hypercubes-nexus-server.onrender.com';

export class ParkourManager {
    constructor(game, uiManager) {
        this.game = game;
        this.uiManager = uiManager;
        this.isRunning = false;
        this.startTime = 0;
        this.elapsedTime = 0;
        
        this.startPositions = [];
        this.metaPositions = [];
        
        this.lastStartTrigger = 0;
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
        } else {
            this.uiManager.setParkourTimerVisible(false);
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
            this.resetRun();
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
    
    resetRun() {
        if (this.elapsedTime > 0 || this.isRunning) {
            this.isRunning = false;
            this.elapsedTime = 0;
            this.uiManager.updateParkourTimer("00:00.00");
        }
    }
    
    async finishRun() {
        this.isRunning = false;
        const finalTime = this.formatTime(this.elapsedTime);
        this.uiManager.showVictory(finalTime);

        // --- NAGRODA ---
        const token = localStorage.getItem('bsp_clone_jwt_token');
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
                    this.uiManager.showMessage(data.message, 'success');
                }
            } catch (e) {
                console.error("Błąd nagrody parkour:", e);
            }
        }
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