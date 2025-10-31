import * as THREE from 'three';

const COINS_STORAGE_KEY = 'bsp_clone_coins'; // Klucz do zapisu w pamięci przeglądarki

export class CoinManager {
  constructor(scene, uiManager, player) {
    this.scene = scene;
    this.uiManager = uiManager;
    this.player = player;
    
    this.coins = 0; // Domyślna wartość
    this.spawnedCoin = null;

    this.spawnInterval = 20000; // 20 sekund
    this.spawnTimer = this.spawnInterval;
    this.mapBounds = 30;

    // --- POPRAWKA: Ładowanie monet przy starcie ---
    const savedCoins = localStorage.getItem(COINS_STORAGE_KEY);
    if (savedCoins !== null) {
        // Upewniamy się, że wczytana wartość jest liczbą
        const parsedCoins = parseInt(savedCoins, 10);
        if (!isNaN(parsedCoins)) {
            this.coins = parsedCoins;
        }
    }

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

  spawnCoin() {
    if (this.spawnedCoin) return;

    const coin = this.createCoinMesh();
    
    const x = (Math.random() - 0.5) * 2 * this.mapBounds;
    const z = (Math.random() - 0.5) * 2 * this.mapBounds;
    coin.position.set(x, 1, z);

    this.scene.add(coin);
    this.spawnedCoin = coin;
    console.log(`Coin spawned at: x=${x.toFixed(1)}, z=${z.toFixed(1)}`);
  }

  update(deltaTime) {
    // Przeliczamy deltaTime z sekund na milisekundy
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

  collectCoin() {
    console.log("Coin collected!");
    
    this.scene.remove(this.spawnedCoin);
    this.spawnedCoin = null;

    this.addCoins(200);

    this.spawnTimer = 5000; // Szybsze odrodzenie po zebraniu monety
  }

  addCoins(amount) {
    this.coins += amount;
    this.uiManager.updateCoinCounter(this.coins);

    // --- POPRAWKA: Zapisywanie monet po każdej zmianie ---
    try {
        localStorage.setItem(COINS_STORAGE_KEY, this.coins.toString());
    } catch (error) {
        console.error('Nie udało się zapisać monet. Pamięć przeglądarki może być pełna.', error);
    }
  }
}
