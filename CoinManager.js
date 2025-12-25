/* PLIK: CoinManager.js */
import * as THREE from 'three';

export class CoinManager {
  constructor(scene, uiManager, player, initialCoins = 0) {
    this.scene = scene;
    this.uiManager = uiManager;
    this.player = player;
    
    this.coins = initialCoins;
    this.spawnedCoin = null;
    this.onCollect = null; 

    // Bezpieczna inicjalizacja licznika
    if (this.uiManager && typeof this.uiManager.updateCoinCounter === 'function') {
        this.uiManager.updateCoinCounter(this.coins);
    }
  }

  createCoinMesh() {
    const geometry = new THREE.CylinderGeometry(0.5, 0.5, 0.2, 16);
    const material = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.8,
      roughness: 0.4
    });
    const coin = new THREE.Mesh(geometry, material);
    coin.rotation.x = Math.PI / 2;
    coin.castShadow = true;
    return coin;
  }

  spawnCoinAt(position) {
    if (this.spawnedCoin) {
        this.scene.remove(this.spawnedCoin);
    }

    const coin = this.createCoinMesh();
    coin.position.set(position.x, position.y, position.z);

    this.scene.add(coin);
    this.spawnedCoin = coin;
    this.spawnedCoin.visible = true; 
  }
  
  removeCoinGlobally() {
      if (this.spawnedCoin) {
          this.scene.remove(this.spawnedCoin);
          this.spawnedCoin = null;
      }
  }

  // --- NAPRAWIONA METODA AKTUALIZACJI SALDA ---
  updateBalance(newBalance) {
      const oldBalance = this.coins;
      this.coins = newBalance;
      
      // 1. Aktualizuj licznik w UI (bezpiecznie)
      if (this.uiManager && typeof this.uiManager.updateCoinCounter === 'function') {
          this.uiManager.updateCoinCounter(this.coins);
      }

      // 2. Pokaż powiadomienie TYLKO jeśli przybyło monet (np. zebrano monetę lub nagrodę)
      // Dzięki temu przy kupowaniu (gdy monety ubywają) nie wywali błędu ani dziwnego komunikatu.
      const diff = newBalance - oldBalance;
      if (diff > 0) {
          if (this.uiManager && typeof this.uiManager.showMessage === 'function') {
              this.uiManager.showMessage(`+${diff} monet!`, 'success');
          }
      }
  }

  update(deltaTime) {
    if (this.spawnedCoin && this.spawnedCoin.visible) {
      this.spawnedCoin.rotation.z += 2 * deltaTime;
      
      if (this.player && this.onCollect) {
          const distance = this.player.position.distanceTo(this.spawnedCoin.position);
          
          if (distance < 2.0) {
            this.spawnedCoin.visible = false;
            this.onCollect(); 
          }
      }
    }
  }

  // Metoda pomocnicza (nieużywana w nowym systemie server-side, ale zostawiona dla kompatybilności)
  async spendCoins(amount) {
      // Logika przeniesiona do BlockManager/Server
      return true;
  }
}
