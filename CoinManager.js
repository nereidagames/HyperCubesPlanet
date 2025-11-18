import * as THREE from 'three';

const API_BASE_URL = 'https://hypercubes-nexus-server.onrender.com';
const JWT_TOKEN_KEY = 'bsp_clone_jwt_token';

export class CoinManager {
  constructor(scene, uiManager, player, initialCoins = 0) {
    this.scene = scene;
    this.uiManager = uiManager;
    this.player = player;
    
    this.coins = initialCoins;
    this.spawnedCoin = null;

    this.spawnInterval = 20000; // 20 sekund
    this.spawnTimer = this.spawnInterval;
    this.mapBounds = 30;

    this.uiManager.updateCoinCounter(this.coins);
  }

  // Prywatna, asynchroniczna metoda do komunikacji z serwerem
  async #updateCoinsOnServer(amount) {
      const token = localStorage.getItem(JWT_TOKEN_KEY);
      if (!token) {
          console.error("Brak tokenu, nie można zaktualizować monet.");
          return false;
      }

      try {
          const response = await fetch(`${API_BASE_URL}/api/coins/update`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ amount })
          });

          if (!response.ok) {
              const data = await response.json();
              console.error('Błąd aktualizacji monet na serwerze:', data.message);
              this.uiManager.showMessage(data.message || 'Błąd serwera', 'error');
              return false;
          }

          const data = await response.json();
          this.coins = data.newBalance; // Zaktualizuj saldo na podstawie odpowiedzi serwera
          this.uiManager.updateCoinCounter(this.coins);
          return true;

      } catch (error) {
          console.error('Błąd sieci podczas aktualizacji monet:', error);
          this.uiManager.showMessage('Błąd połączenia z serwerem', 'error');
          return false;
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

  spawnCoin() {
    if (this.spawnedCoin) return;

    const coin = this.createCoinMesh();
    
    const x = (Math.random() - 0.5) * 2 * this.mapBounds;
    const z = (Math.random() - 0.5) * 2 * this.mapBounds;
    coin.position.set(x, 1, z);

    this.scene.add(coin);
    this.spawnedCoin = coin;
    console.log(`Moneta pojawiła się w: x=${x.toFixed(1)}, z=${z.toFixed(1)}`);
  }

  update(deltaTime) {
    this.spawnTimer -= deltaTime * 1000;

    if (this.spawnTimer <= 0) {
      this.spawnCoin();
      this.spawnTimer = this.spawnInterval;
    }

    if (this.spawnedCoin) {
      this.spawnedCoin.rotation.z += 2 * deltaTime;
      if (this.player) {
          const distance = this.player.position.distanceTo(this.spawnedCoin.position);
          if (distance < 1.5) {
            this.collectCoin();
          }
      }
    }
  }

  async collectCoin() {
    if (!this.spawnedCoin) return; // Zapobiegaj podwójnemu zebraniu
    
    const collectedCoin = this.spawnedCoin;
    this.spawnedCoin = null; // Natychmiast oznacz jako zebrany
    
    console.log("Moneta zebrana!");
    
    this.scene.remove(collectedCoin);

    const success = await this.#updateCoinsOnServer(200);
    if(success) {
        this.uiManager.showMessage('+200 monet!', 'success');
    }

    this.spawnTimer = 5000; // Resetuj timer szybciej po zebraniu
  }

  async spendCoins(amount) {
    if (this.coins < amount) {
        this.uiManager.showMessage('Masz za mało monet!', 'error');
        return false; // Szybkie sprawdzenie po stronie klienta
    }
    
    return await this.#updateCoinsOnServer(-amount);
  }
      }
