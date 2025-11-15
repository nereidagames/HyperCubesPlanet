import * as THREE from 'three';
import nipplejs from 'nipplejs';

class PlayerController {
  constructor(player, collidableObjects, options = {}) {
    this.player = player;
    this.collidableObjects = collidableObjects;
    this.moveSpeed = options.moveSpeed || 8;
    this.jumpForce = options.jumpForce || 18;
    this.gravity = options.gravity || 50;
    
    // POPRAWKA: groundRestingY to teraz po prostu wysokość podłogi.
    this.groundRestingY = options.groundRestingY || 0.1;

    // POPRAWKA: Wymiary fizyczne postaci. Wysokość to 1.8.
    this.playerDimensions = new THREE.Vector3(0.6, 1.8, 0.6);

    this.velocity = new THREE.Vector3();
    this.isOnGround = true;
    
    this.maxJumps = 2;
    this.jumpsRemaining = this.maxJumps;
    
    this.keys = {};
    this.isMobile = false;
    this.canJump = true;
    this.joystickDirection = new THREE.Vector2();
    this.joystick = null;
  }

  // ... (funkcje setIsMobile, setupInput, cleanupInput, jump, destroy, setupMobileControls pozostają bez zmian)
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
    if (!this.isOnGround) {
      this.velocity.y -= this.gravity * deltaTime;
    }

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

    this.applyMovementAndCollisions(deltaTime);
  }

  // POPRAWKA KRYTYCZNA: Cała logika kolizji została uproszczona i poprawiona.
  applyMovementAndCollisions(deltaTime) {
    const playerBox = new THREE.Box3();
    const objectBox = new THREE.Box3();
    const epsilon = 0.001; // Mała wartość zapobiegająca problemom z precyzją
    
    // Bounding box gracza jest teraz wyśrodkowany względem jego wysokości.
    const playerCenter = this.player.position.clone().add(new THREE.Vector3(0, this.playerDimensions.y / 2, 0));
    
    // --- Kolizja pionowa (Y) ---
    this.player.position.y += this.velocity.y * deltaTime;
    playerCenter.y = this.player.position.y + this.playerDimensions.y / 2;
    playerBox.setFromCenterAndSize(playerCenter, this.playerDimensions);

    let onAnyObject = false;

    for (const object of this.collidableObjects) {
        objectBox.setFromObject(object);
        if (playerBox.intersectsBox(objectBox)) {
            if (this.velocity.y < 0) { // Spadanie
                this.player.position.y = objectBox.max.y + epsilon;
                this.velocity.y = 0;
                this.isOnGround = true;
                this.jumpsRemaining = this.maxJumps;
                this.canJump = true;
                onAnyObject = true;
            } else if (this.velocity.y > 0) { // Wznoszenie (uderzenie w sufit)
                this.player.position.y = objectBox.min.y - this.playerDimensions.y - epsilon;
                this.velocity.y = 0;
            }
        }
    }
    
    // --- Kolizja pozioma (X) ---
    this.player.position.x += this.velocity.x * deltaTime;
    playerCenter.x = this.player.position.x;
    playerCenter.y = this.player.position.y + this.playerDimensions.y / 2;
    playerBox.setFromCenterAndSize(playerCenter, this.playerDimensions);

    for (const object of this.collidableObjects) {
        objectBox.setFromObject(object);
        if (playerBox.intersectsBox(objectBox)) {
            if (this.velocity.x > 0) { // Ruch w prawo
                this.player.position.x = objectBox.min.x - this.playerDimensions.x / 2 - epsilon;
            } else if (this.velocity.x < 0) { // Ruch w lewo
                this.player.position.x = objectBox.max.x + this.playerDimensions.x / 2 + epsilon;
            }
            this.velocity.x = 0;
        }
    }

    // --- Kolizja pozioma (Z) ---
    this.player.position.z += this.velocity.z * deltaTime;
    playerCenter.z = this.player.position.z;
    playerCenter.x = this.player.position.x;
    playerBox.setFromCenterAndSize(playerCenter, this.playerDimensions);

    for (const object of this.collidableObjects) {
        objectBox.setFromObject(object);
        if (playerBox.intersectsBox(objectBox)) {
            if (this.velocity.z > 0) { // Ruch do przodu (w głąb sceny)
                this.player.position.z = objectBox.min.z - this.playerDimensions.z / 2 - epsilon;
            } else if (this.velocity.z < 0) { // Ruch do tyłu
                this.player.position.z = objectBox.max.z + this.playerDimensions.z / 2 + epsilon;
            }
            this.velocity.z = 0;
        }
    }

    // Sprawdzenie, czy gracz stoi na głównej podłodze
    if (this.player.position.y < this.groundRestingY) {
        this.player.position.y = this.groundRestingY;
        this.velocity.y = 0;
        this.isOnGround = true;
        this.jumpsRemaining = this.maxJumps;
        this.canJump = true;
    } else if (!onAnyObject && this.player.position.y > this.groundRestingY + epsilon) {
        this.isOnGround = false;
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
// Klasa ThirdPersonCameraController pozostaje bez zmian
class ThirdPersonCameraController {
    constructor(camera, target, domElement, options = {}) {
        this.camera = camera;
        this.target = target;
        this.domElement = domElement;
        this.distance = options.distance || 15;
        this.height = options.height || 7;
        this.rotationSpeed = options.rotationSpeed || 0.005;
        this.rotation = 0;
        this.isDragging = false;
        this.mousePosition = { x: 0, y: 0 };
        this.enabled = true;
        this.pitch = 0.5;
        this.minPitch = 0.1;
        this.maxPitch = Math.PI / 2 - 0.2;
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
        // Cel kamery jest teraz nieco wyżej (na wysokości głowy), bo target.position to stopy.
        const targetPosition = this.target.position.clone().add(new THREE.Vector3(0, 1.2, 0));
        const horizontalDistance = this.distance * Math.cos(this.pitch);
        const verticalDistance = this.distance * Math.sin(this.pitch);
        const offset = new THREE.Vector3(Math.sin(this.rotation) * horizontalDistance, verticalDistance, Math.cos(this.rotation) * horizontalDistance);
        this.camera.position.copy(targetPosition).add(offset);
        this.camera.lookAt(targetPosition);
        return this.rotation;
    }

    destroy() {
        this.cleanupControls();
    }
}
class FirstPersonCameraController {}
export { PlayerController, ThirdPersonCameraController, FirstPersonCameraController };
