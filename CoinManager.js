import * as THREE from 'three';

export class CoinManager {
  constructor(scene, uiManager, player, initialCoins = 0) {
    this.scene = scene;
    this.uiManager = uiManager;
    this.player = player;
    
    this.coins = initialCoins;
    this.spawnedCoin = null;
    this.onCollect = null; // Callback, który zostanie ustawiony w main.js

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

  // Ta metoda jest teraz wywoływana przez MultiplayerManager, gdy serwer każe stworzyć monetę
  spawnCoinAt(position) {
    if (this.spawnedCoin) {
        this.scene.remove(this.spawnedCoin);
    }

    const coin = this.createCoinMesh();
    coin.position.set(position.x, position.y, position.z);

    this.scene.add(coin);
    this.spawnedCoin = coin;
    console.log(`Wyświetlono monetę w: x=${position.x.toFixed(1)}, z=${position.z.toFixed(1)}`);
  }
  
  // Ta metoda jest wywoływana, gdy ktokolwiek (my lub inny gracz) zbierze monetę
  removeCoinGlobally() {
      if (this.spawnedCoin) {
          this.scene.remove(this.spawnedCoin);
          this.spawnedCoin = null;
          console.log("Moneta usunięta ze sceny.");
      }
  }

  // Ta metoda jest wywoływana, gdy serwer potwierdzi zebranie monety przez nas
  updateBalance(newBalance) {
      this.coins = newBalance;
      this.uiManager.updateCoinCounter(this.coins);
      this.uiManager.showMessage('+200 monet!', 'success');
  }

  update(deltaTime) {
    if (this.spawnedCoin) {
      this.spawnedCoin.rotation.z += 2 * deltaTime;
      // Sprawdzamy kolizję tylko dla lokalnego gracza
      if (this.player && this.onCollect) {
          const distance = this.player.position.distanceTo(this.spawnedCoin.position);
          if (distance < 1.5) {
            // Zamiast logiki, wywołujemy callback, który poinformuje main.js
            this.onCollect(); 
            // Natychmiast usuwamy monetę lokalnie dla płynności,
            // serwer roześle potwierdzenie do wszystkich.
            this.removeCoinGlobally();
          }
      }
    }
  }

  // Ta metoda jest wywoływana przy zakupach w sklepie
  async spendCoins(amount) {
    if (this.coins < amount) {
        this.uiManager.showMessage('Masz za mało monet!', 'error');
        return false;
    }
    
    // Ta logika musi pozostać, ponieważ zakupy to bezpośrednia interakcja z API,
    // a nie zdarzenie w świecie gry.
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
        console.error("Błąd sieci podczas wydawania monet:", error);
        return false;
    }
  }
      }
