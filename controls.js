import * as THREE from 'three';

class PlayerController {
  constructor(player, collidableObjects, options = {}) {
    this.player = player;
    this.collidableObjects = collidableObjects;
    this.moveSpeed = options.moveSpeed || 8;
    this.jumpForce = options.jumpForce || 12;
    this.gravity = options.gravity || 25;
    this.groundRestingY = options.groundRestingY || 0.6;

    this.playerDimensions = new THREE.Vector3(0.8, 2.4, 0.8);

    this.velocity = new THREE.Vector3();
    this.isOnGround = true;
    
    this.maxJumps = 2;
    this.jumpsRemaining = this.maxJumps;
    
    this.keys = {};
    this.isMobile = false;
    this.canJump = true;
    this.joystickDirection = new THREE.Vector2();

    this.setupInput();
  }

  setIsMobile(isMobile) {
    this.isMobile = isMobile;
    this.setupInput();
    
    const mobileControls = document.getElementById('mobile-game-controls');
    if (mobileControls) {
        mobileControls.style.display = isMobile ? 'block' : 'none';
    }
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

  applyMovementAndCollisions(deltaTime) {
    const playerBox = new THREE.Box3();
    const objectBox = new THREE.Box3();
    const halfHeight = this.playerDimensions.y / 2;
    const halfWidth = this.playerDimensions.x / 2;
    const halfDepth = this.playerDimensions.z / 2;
    const epsilon = 0.001;

    const verticalMovement = this.velocity.y * deltaTime;
    this.player.position.y += verticalMovement;
    playerBox.setFromCenterAndSize(this.player.position, this.playerDimensions);
    
    let landedOnBlock = false;

    for (const object of this.collidableObjects) {
        objectBox.setFromObject(object);
        if (playerBox.intersectsBox(objectBox)) {
            if (verticalMovement < 0) {
                this.player.position.y = objectBox.max.y + halfHeight;
                this.velocity.y = 0;
                this.isOnGround = true;
                this.jumpsRemaining = this.maxJumps;
                this.canJump = true;
                landedOnBlock = true;
            } else if (verticalMovement > 0) {
                if (objectBox.min.y > this.player.position.y) {
                    this.player.position.y = objectBox.min.y - halfHeight - epsilon;
                    this.velocity.y = 0;
                }
            }
        }
    }
    
    const horizontalMovementX = this.velocity.x * deltaTime;
    this.player.position.x += horizontalMovementX;
    playerBox.setFromCenterAndSize(this.player.position, this.playerDimensions);

    for (const object of this.collidableObjects) {
        objectBox.setFromObject(object);
        if (playerBox.intersectsBox(objectBox)) {
            if (horizontalMovementX > 0) {
                this.player.position.x = objectBox.min.x - halfWidth - epsilon;
            } else if (horizontalMovementX < 0) {
                this.player.position.x = objectBox.max.x + halfWidth + epsilon;
            }
            this.velocity.x = 0;
            break;
        }
    }

    const horizontalMovementZ = this.velocity.z * deltaTime;
    this.player.position.z += horizontalMovementZ;
    playerBox.setFromCenterAndSize(this.player.position, this.playerDimensions);

    for (const object of this.collidableObjects) {
        objectBox.setFromObject(object);
        if (playerBox.intersectsBox(objectBox)) {
            if (horizontalMovementZ > 0) {
                this.player.position.z = objectBox.min.z - halfDepth - epsilon;
            } else if (horizontalMovementZ < 0) {
                this.player.position.z = objectBox.max.z + halfDepth + epsilon;
            }
            this.velocity.z = 0;
            break;
        }
    }

    if (this.player.position.y <= this.groundRestingY) {
        if (!landedOnBlock) {
            this.player.position.y = this.groundRestingY;
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
  }
}

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
        this.setupControls();
    }

    setIsMobile(isMobile) {
        this.isMobile = isMobile;
        this.cleanupControls();
        this.setupControls();
    }

    setupControls() {
        this.handleStart = (e) => {
            if (this.isMobile && e.target.closest('#mobile-game-controls')) return;
            if (!this.enabled) return;
            if (!this.isMobile && e.target.closest('.ui-element')) return;
            this.isDragging = true;
            this.mousePosition = { x: e.clientX || e.touches[0].clientX, y: e.clientY || e.touches[0].clientY };
            if (this.isMobile) e.preventDefault();
        };

        this.handleEnd = () => {
            this.isDragging = false;
        };

        this.handleMove = (e) => {
            if (!this.enabled || !this.isDragging) return;
            const clientX = e.clientX || e.touches[0].clientX;
            const clientY = e.clientY || e.touches[0].clientY;
            const deltaX = clientX - this.mousePosition.x;
            const deltaY = clientY - this.mousePosition.y;
            const sensitivity = this.isMobile ? this.rotationSpeed * 2.5 : this.rotationSpeed;
            this.rotation -= deltaX * sensitivity;
            this.pitch += deltaY * sensitivity;
            this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.pitch));
            this.mousePosition = { x: clientX, y: clientY };
            if (this.isMobile) e.preventDefault();
        };

        this.domElement.addEventListener('mousedown', this.handleStart);
        document.addEventListener('mouseup', this.handleEnd);
        document.addEventListener('mousemove', this.handleMove);
        this.domElement.addEventListener('touchstart', this.handleStart, { passive: false });
        document.addEventListener('touchend', this.handleEnd, { passive: false });
        document.addEventListener('touchmove', this.handleMove, { passive: false });
    }

    cleanupControls() {
        this.domElement.removeEventListener('mousedown', this.handleStart);
        document.removeEventListener('mouseup', this.handleEnd);
        document.removeEventListener('mousemove', this.handleMove);
        this.domElement.removeEventListener('touchstart', this.handleStart);
        document.removeEventListener('touchend', this.handleEnd);
        document.removeEventListener('touchmove', this.handleMove);
    }

    update() {
        if (!this.enabled || !this.target) return 0;
        const horizontalDistance = this.distance * Math.cos(this.pitch);
        const verticalDistance = this.distance * Math.sin(this.pitch);
        const offset = new THREE.Vector3(Math.sin(this.rotation) * horizontalDistance, verticalDistance, Math.cos(this.rotation) * horizontalDistance);
        this.camera.position.copy(this.target.position).add(offset);
        this.camera.lookAt(this.target.position.x, this.target.position.y + 1, this.target.position.z);
        return this.rotation;
    }

    destroy() {
        this.cleanupControls();
    }
}

class FirstPersonCameraController {}

export { PlayerController, ThirdPersonCameraController, FirstPersonCameraController };
