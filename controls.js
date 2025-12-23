import * as THREE from 'three';
import nipplejs from 'nipplejs';

export class PlayerController {
  /**
   * @param {THREE.Object3D} player - Model gracza
   * @param {Array} collidableObjects - Tablica dużych/globalnych obiektów (podłoga, bariery)
   * @param {Map} collisionMap - Mapa bloków (Grid Partitioning) dla szybkiego wyszukiwania
   * @param {Object} options - Opcje fizyki
   */
  constructor(player, collidableObjects, collisionMap, options = {}) {
    this.player = player;
    this.collidableObjects = collidableObjects; // Tablica dla dużych obiektów
    this.collisionMap = collisionMap;           // Mapa dla małych bloków (Grid)
    
    this.moveSpeed = options.moveSpeed || 8;
    this.jumpForce = options.jumpForce || 18;
    this.gravity = options.gravity || 50;
    this.groundRestingY = options.groundRestingY || 0.1;

    // Wymiary gracza (hitbox)
    this.playerDimensions = new THREE.Vector3(0.6, 1.0, 0.6);

    this.velocity = new THREE.Vector3();
    this.isOnGround = true;
    
    this.maxJumps = 2;
    this.jumpsRemaining = this.maxJumps;
    
    this.keys = {};
    this.isMobile = false;
    this.canJump = true;
    this.joystickDirection = new THREE.Vector2();
    this.joystick = null;

    // Cache dla obiektów fizycznych (aby nie tworzyć ich w pętli)
    this.playerBox = new THREE.Box3();
    this.objectBox = new THREE.Box3();
  }

  setIsMobile(isMobile) {
    this.isMobile = isMobile;
    
    const mobileControls = document.getElementById('mobile-game-controls');
    const joystickZone = document.getElementById('joystick-zone');
    if (mobileControls) mobileControls.style.display = isMobile ? 'block' : 'none';
    if (joystickZone) joystickZone.style.display = isMobile ? 'block' : 'none';

    this.setupInput();
  }

  setupInput() {
    this.cleanupInput();

    this.handleKeyDown = (e) => {
      this.keys[e.code] = true;
      if (e.code === 'Space' && this.canJump) {
        this.jump();
        this.canJump = false; 
      }
    };

    this.handleKeyUp = (e) => {
      this.keys[e.code] = false;
      if (e.code === 'Space') {
        this.canJump = true;
      }
    };

    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    
    if (this.isMobile) {
      this.setupMobileControls();
    }
  }
  
  cleanupInput() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    const jumpButton = document.getElementById('jump-button');
    if (jumpButton && this.handleMobileJumpStart) {
        jumpButton.removeEventListener('touchstart', this.handleMobileJumpStart);
        jumpButton.removeEventListener('touchend', this.handleMobileJumpEnd);
    }
    if (this.joystick) {
        this.joystick.destroy();
        this.joystick = null;
    }
  }
  
  jump() {
    if (this.jumpsRemaining > 0) {
        this.velocity.y = this.jumpForce;
        this.jumpsRemaining--;
        this.isOnGround = false;
    }
  }
  
  update(deltaTime, cameraRotation) {
    // Ograniczenie kroku czasowego dla stabilności fizyki przy lagach
    const timeStep = Math.min(deltaTime, 0.05);

    // Grawitacja
    if (!this.isOnGround) {
      this.velocity.y -= this.gravity * timeStep;
    }

    // Obliczanie wektora ruchu
    const moveDirection = new THREE.Vector3();
    if (!this.isMobile) {
        const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraRotation);
        const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraRotation);
        if (this.keys['KeyW']) moveDirection.add(forward);
        if (this.keys['KeyS']) moveDirection.sub(forward);
        if (this.keys['KeyA']) moveDirection.sub(right);
        if (this.keys['KeyD']) moveDirection.add(right);
    } else {
        moveDirection.set(this.joystickDirection.x, 0, -this.joystickDirection.y);
        moveDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraRotation);
    }

    if (moveDirection.length() > 0) {
      moveDirection.normalize();
      const angle = Math.atan2(moveDirection.x, moveDirection.z);
      this.player.rotation.y = angle;
    }
    this.velocity.x = moveDirection.x * this.moveSpeed;
    this.velocity.z = moveDirection.z * this.moveSpeed;

    this.applyMovementAndCollisions(timeStep);
  }

  // --- GRID PARTITIONING COLLISION LOGIC ---
  applyMovementAndCollisions(deltaTime) {
    const halfHeight = this.playerDimensions.y / 2;
    const halfWidth = this.playerDimensions.x / 2;
    const halfDepth = this.playerDimensions.z / 2;
    const epsilon = 0.001;

    // 1. Zbuduj listę kandydatów do kolizji (Broad Phase)
    const candidates = [];

    // A. Dodaj obiekty globalne (podłoga, bariery) - są zawsze sprawdzane
    for (let i = 0; i < this.collidableObjects.length; i++) {
        candidates.push(this.collidableObjects[i]);
    }

    // B. Dodaj bloki z Grid Mapy (tylko te blisko gracza)
    if (this.collisionMap && this.collisionMap.size > 0) {
        const playerX = Math.floor(this.player.position.x);
        const playerY = Math.floor(this.player.position.y);
        const playerZ = Math.floor(this.player.position.z);

        // Sprawdzamy grid 3x3x5 wokół gracza
        const rangeH = 1;      // Promień poziomy (1 blok w każdą stronę)
        const rangeV_Down = 1; // 1 blok w dół
        const rangeV_Up = 3;   // 3 bloki w górę (żeby nie skoczyć w sufit)

        for (let x = playerX - rangeH; x <= playerX + rangeH; x++) {
            for (let z = playerZ - rangeH; z <= playerZ + rangeH; z++) {
                for (let y = playerY - rangeV_Down; y <= playerY + rangeV_Up; y++) {
                    const key = `${x},${y},${z}`;
                    const block = this.collisionMap.get(key);
                    if (block) {
                        candidates.push(block);
                    }
                }
            }
        }
    }

    let landedOnBlock = false;

    // --- Faza 2: Dokładna kolizja (Narrow Phase) ---

    // === Kolizja pionowa (Y) ===
    const verticalMovement = this.velocity.y * deltaTime;
    this.player.position.y += verticalMovement;
    this.playerBox.setFromCenterAndSize(this.player.position, this.playerDimensions);

    for (const object of candidates) {
        // Optymalizacja: Używamy scachowanego Box3 dla bloków z gridu
        if (object.isBlock) {
            this.objectBox.copy(object.boundingBox);
        } else {
            // Dla globalnych obiektów (np. podłoga, ściana) obliczamy dynamicznie
            this.objectBox.setFromObject(object);
        }

        if (this.playerBox.intersectsBox(this.objectBox)) {
            if (verticalMovement < 0) { // Spadanie na blok
                this.player.position.y = this.objectBox.max.y + halfHeight;
                this.velocity.y = 0;
                this.isOnGround = true;
                this.jumpsRemaining = this.maxJumps;
                this.canJump = true;
                landedOnBlock = true;
            } else if (verticalMovement > 0) { // Skok w sufit
                this.player.position.y = this.objectBox.min.y - halfHeight - epsilon;
                this.velocity.y = 0;
            }
        }
    }
    
    // Aktualizujemy Box gracza po korekcie Y
    this.playerBox.setFromCenterAndSize(this.player.position, this.playerDimensions);

    // === Kolizja pozioma (X) ===
    const horizontalMovementX = this.velocity.x * deltaTime;
    this.player.position.x += horizontalMovementX;
    this.playerBox.setFromCenterAndSize(this.player.position, this.playerDimensions);

    for (const object of candidates) {
        if (object.isBlock) {
            this.objectBox.copy(object.boundingBox);
        } else {
            this.objectBox.setFromObject(object);
        }
        
        // Pomiń obiekty, na które gracz może wejść (schodki)
        // (Uproszczenie: jeśli góra bloku jest niżej niż stopy gracza + margines)
        if (this.objectBox.max.y < this.playerBox.min.y + epsilon) continue;

        if (this.playerBox.intersectsBox(this.objectBox)) {
            if (horizontalMovementX > 0) {
                this.player.position.x = this.objectBox.min.x - halfWidth - epsilon;
            } else if (horizontalMovementX < 0) {
                this.player.position.x = this.objectBox.max.x + halfWidth + epsilon;
            }
            this.velocity.x = 0;
            break; 
        }
    }

    // === Kolizja pozioma (Z) ===
    const horizontalMovementZ = this.velocity.z * deltaTime;
    this.player.position.z += horizontalMovementZ;
    this.playerBox.setFromCenterAndSize(this.player.position, this.playerDimensions);

    for (const object of candidates) {
        if (object.isBlock) {
            this.objectBox.copy(object.boundingBox);
        } else {
            this.objectBox.setFromObject(object);
        }

        if (this.objectBox.max.y < this.playerBox.min.y + epsilon) continue;

        if (this.playerBox.intersectsBox(this.objectBox)) {
            if (horizontalMovementZ > 0) {
                this.player.position.z = this.objectBox.min.z - halfDepth - epsilon;
            } else if (horizontalMovementZ < 0) {
                this.player.position.z = this.objectBox.max.z + halfDepth + epsilon;
            }
            this.velocity.z = 0;
            break;
        }
    }

    // Sprawdzenie "podłogi świata" (zabezpieczenie przed spadnięciem w nieskończoność)
    if (this.player.position.y <= this.groundRestingY + halfHeight) {
        if (!landedOnBlock) {
            this.player.position.y = this.groundRestingY + halfHeight;
            if (!this.isOnGround) {
                this.velocity.y = 0;
                this.isOnGround = true;
                this.jumpsRemaining = this.maxJumps;
                this.canJump = true;
            }
        }
    } else {
        if (!landedOnBlock) {
            this.isOnGround = false;
        }
    }
  }
  
  destroy() { this.cleanupInput(); }

  setupMobileControls() {
    const jumpButton = document.getElementById('jump-button');
    if (jumpButton) {
        this.handleMobileJumpStart = (e) => {
            e.preventDefault();
            if (this.canJump) {
                this.jump();
                this.canJump = false;
            }
        };
        this.handleMobileJumpEnd = (e) => {
            e.preventDefault();
            this.canJump = true;
        };
        jumpButton.addEventListener('touchstart', this.handleMobileJumpStart, { passive: false });
        jumpButton.addEventListener('touchend', this.handleMobileJumpEnd, { passive: false });
    }

    const joystickZone = document.getElementById('joystick-zone');
    if (joystickZone) {
        const options = {
            zone: joystickZone,
            mode: 'static',
            position: { left: '50%', top: '50%' },
            color: 'white',
            size: 100,
            dynamicPage: true 
        };
        this.joystick = nipplejs.create(options);

        this.joystick.on('move', (evt, data) => {
            if (data.vector) {
                this.joystickDirection.set(data.vector.x, data.vector.y);
            }
        });

        this.joystick.on('end', () => {
            this.joystickDirection.set(0, 0);
        });
    }
  }
}

export class ThirdPersonCameraController {
    constructor(camera, target, domElement, options = {}) {
        this.camera = camera;
        this.target = target;
        this.domElement = domElement;
        this.distance = options.distance || 5;
        this.height = options.height || 2;
        this.rotationSpeed = options.rotationSpeed || 0.005;
        this.rotation = 0;
        this.isDragging = false;
        this.mousePosition = { x: 0, y: 0 };
        this.enabled = true;
        this.pitch = 0.5;
        this.minPitch = -Math.PI / 2 + 0.001;
        this.maxPitch = Math.PI / 2 - 0.001;
        this.floorY = options.floorY || 0;
        this.isMobile = false;
        this.cameraTouchId = null;
        this.setupControls();
    }

    setIsMobile(isMobile) {
        this.isMobile = isMobile;
        this.cleanupControls();
        this.setupControls();
    }

    setupControls() {
        this.handleMouseDown = (e) => {
            if (!this.enabled || e.target.closest('.ui-element')) return;
            this.isDragging = true;
            this.mousePosition = { x: e.clientX, y: e.clientY };
        };

        this.handleMouseMove = (e) => {
            if (!this.enabled || !this.isDragging) return;
            const clientX = e.clientX;
            const clientY = e.clientY;
            const deltaX = clientX - this.mousePosition.x;
            const deltaY = clientY - this.mousePosition.y;
            const sensitivity = this.rotationSpeed;
            this.rotation -= deltaX * sensitivity;
            this.pitch += deltaY * sensitivity;
            this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.pitch));
            this.mousePosition = { x: clientX, y: clientY };
        };

        this.handleMouseUp = () => {
            this.isDragging = false;
        };

        this.handleTouchStart = (e) => {
            if (!this.enabled) return;
            for (const touch of e.changedTouches) {
                if (this.cameraTouchId === null && !touch.target.closest('#joystick-zone') && !touch.target.closest('#jump-button') && !touch.target.closest('.ui-element')) {
                    this.cameraTouchId = touch.identifier;
                    this.isDragging = true;
                    this.mousePosition = { x: touch.clientX, y: touch.clientY };
                    break;
                }
            }
        };

        this.handleTouchMove = (e) => {
            if (!this.enabled || !this.isDragging) return;
            for (const touch of e.changedTouches) {
                if (touch.identifier === this.cameraTouchId) {
                    const clientX = touch.clientX;
                    const clientY = touch.clientY;
                    const deltaX = clientX - this.mousePosition.x;
                    const deltaY = clientY - this.mousePosition.y;
                    const sensitivity = this.rotationSpeed * 2.5;
                    this.rotation -= deltaX * sensitivity;
                    this.pitch += deltaY * sensitivity;
                    this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.pitch));
                    this.mousePosition = { x: clientX, y: clientY };
                    break;
                }
            }
        };

        this.handleTouchEnd = (e) => {
            for (const touch of e.changedTouches) {
                if (touch.identifier === this.cameraTouchId) {
                    this.cameraTouchId = null;
                    this.isDragging = false;
                    break;
                }
            }
        };

        this.domElement.addEventListener('mousedown', this.handleMouseDown);
        document.addEventListener('mousemove', this.handleMouseMove);
        document.addEventListener('mouseup', this.handleMouseUp);
        this.domElement.addEventListener('touchstart', this.handleTouchStart, { passive: true });
        document.addEventListener('touchmove', this.handleTouchMove, { passive: true });
        document.addEventListener('touchend', this.handleTouchEnd, { passive: true });
    }

    cleanupControls() {
        this.domElement.removeEventListener('mousedown', this.handleMouseDown);
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mouseup', this.handleMouseUp);
        this.domElement.removeEventListener('touchstart', this.handleTouchStart);
        document.removeEventListener('touchmove', this.handleTouchMove);
        document.removeEventListener('touchend', this.handleTouchEnd);
    }

    update() {
        if (!this.enabled || !this.target) return 0;
        
        let currentDistance = this.distance;
        const targetPosition = new THREE.Vector3(this.target.position.x, this.target.position.y + 1, this.target.position.z);
        
        const horizontalDistance = currentDistance * Math.cos(this.pitch);
        const verticalDistance = currentDistance * Math.sin(this.pitch);
        
        const offset = new THREE.Vector3(
            Math.sin(this.rotation) * horizontalDistance, 
            verticalDistance, 
            Math.cos(this.rotation) * horizontalDistance
        );
        
        const idealCameraPosition = new THREE.Vector3().copy(targetPosition).add(offset);

        const cameraFloorClearance = 0.5;
        if (idealCameraPosition.y < this.floorY + cameraFloorClearance) {
            const newVerticalDistance = this.floorY + cameraFloorClearance - targetPosition.y;
            currentDistance = newVerticalDistance / Math.sin(this.pitch);
            currentDistance = Math.max(currentDistance, 1.5);
            
            const newHorizontalDistance = currentDistance * Math.cos(this.pitch);
            offset.set(
                Math.sin(this.rotation) * newHorizontalDistance, 
                newVerticalDistance, 
                Math.cos(this.rotation) * newHorizontalDistance
            );
        }
        
        this.camera.position.copy(targetPosition).add(offset);
        this.camera.lookAt(targetPosition);
        
        return this.rotation;
    }

    destroy() {
        this.cleanupControls();
    }
}