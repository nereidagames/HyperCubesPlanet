/* PLIK: ParkourManager.js */
import * as THREE from 'three';
import { API_BASE_URL, STORAGE_KEYS } from './Config.js';

export class ParkourManager {
    constructor(game, uiManager) {
        this.game = game;
        this.uiManager = uiManager;
        this.isRunning = false;
        this.elapsedTime = 0;
        
        this.startPositions = [];
        this.metaPositions = [];
        this.currentWorldId = null;
    }
    
    init(worldData) {
        this.startPositions = [];
        this.metaPositions = [];
        this.isRunning = false;
        this.elapsedTime = 0;
        
        // Zapisujemy ID świata, aby wiedzieć, do której mapy przypisać rekord
        this.currentWorldId = worldData.id || null;
        
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
            
            // Rejestracja callbacków dla UI
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
            // Teleportuj gracza +0.5 wyżej żeby nie utknął w bloku
            this.game.characterManager.character.position.set(start.x, start.y + 0.5, start.z);
            
            // Reset prędkości w kontrolerze
            if (this.game.playerController) {
                this.game.playerController.velocity.set(0, 0, 0);
            }
        }
    }

    update(deltaTime) {
        if (this.startPositions.length === 0) return;

        const playerPos = this.game.characterManager.character.position;
        
        // Sprawdź czy gracz jest na STARCIE (reset czasu)
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
            if (this.isRunning || this.elapsedTime > 0) {
                this.isRunning = false;
                this.elapsedTime = 0;
                this.uiManager.updateParkourTimer("00:00.00");
            }
            return;
        }
        
        // Jeśli zszedł ze startu, zacznij liczyć
        if (!this.isRunning && this.elapsedTime === 0) {
            this.isRunning = true;
        }

        if (this.isRunning) {
            this.elapsedTime += deltaTime;
            this.uiManager.updateParkourTimer(this.formatTime(this.elapsedTime));
            
            // Sprawdź czy gracz jest na MECIE
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
        const timeMs = Math.floor(this.elapsedTime * 1000); // Czas w milisekundach dla bazy danych
        
        const token = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
        let rewardData = null;

        // Jeśli mamy token i ID świata, wysyłamy wynik na serwer
        if (token && this.currentWorldId) {
            try {
                const response = await fetch(`${API_BASE_URL}/api/parkour/complete`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}` 
                    },
                    body: JSON.stringify({ 
                        timeMs: timeMs,
                        worldId: this.currentWorldId 
                    })
                });
                // Serwer zwraca obiekt z rekordami (allTime, daily, personal), nagrodami i danymi mapy
                rewardData = await response.json();
            } catch (e) {
                console.error("Błąd nagrody parkour:", e);
            }
        }

        // Przekazujemy dane do UI (czas sformatowany + dane z serwera)
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
