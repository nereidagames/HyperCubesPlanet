import * as THREE from 'three';

export class CoinManager {
  constructor(scene, uiManager, player, initialCoins = 0) {
    this.scene = scene;
    this.uiManager = uiManager;
    this.player = player;
    
    this.coins = initialCoins;
    this.spawnedCoin = null;
    this.onCollect = null; 

    this.uiManager.updateCoinCounter(this.coins);
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
    // Anuluj ewentualne ukrycie z poprzedniej monety
    this.spawnedCoin.visible = true; 
    console.log(`Moneta w: x=${position.x.toFixed(1)}, z=${position.z.toFixed(1)}`);
  }
  
  removeCoinGlobally() {
      if (this.spawnedCoin) {
          this.scene.remove(this.spawnedCoin);
          this.spawnedCoin = null;
      }
  }

  updateBalance(newBalance) {
      this.coins = newBalance;
      this.uiManager.updateCoinCounter(this.coins);
      this.uiManager.showMessage('+200 monet!', 'success');
  }

  update(deltaTime) {
    if (this.spawnedCoin && this.spawnedCoin.visible) {
      this.spawnedCoin.rotation.z += 2 * deltaTime;
      
      if (this.player && this.onCollect) {
          const distance = this.player.position.distanceTo(this.spawnedCoin.position);
          
          // Próg 2.0 jednostek (nieco większy dla pewności)
          if (distance < 2.0) {
            // 1. Ukryj natychmiast wizualnie (dla gracza)
            this.spawnedCoin.visible = false;
            
            // 2. Wyślij info do serwera
            this.onCollect(); 
          }
      }
    }
  }

  async spendCoins(amount) {
    if (this.coins < amount) {
        this.uiManager.showMessage('Masz za mało monet!', 'error');
        return false;
    }
    
    const token = localStorage.getItem('bsp_clone_jwt_token');
    if (!token) return false;

    try {
        const response = await fetch('https://hypercubes-nexus-server.onrender.com/api/coins/update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ amount: -amount })
        });
        if (!response.ok) {
            const data = await response.json();
            this.uiManager.showMessage(data.message || "Błąd zakupu", "error");
            return false;
        }
        const data = await response.json();
        this.coins = data.newBalance;
        this.uiManager.updateCoinCounter(this.coins);
        return true;
    } catch (error) {
        console.error("Błąd sieci:", error);
        return false;
    }
  }
}