import * as THREE from 'three';
import nipplejs from 'nipplejs';

export class BuildCameraController {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;
    
    this.mode = 'orbital'; // 'orbital' lub 'free' (God Mode)
    this.target = new THREE.Vector3(0, 0, 0);

    // Ustawienia orbitalne
    this.distance = 40;
    this.rotation = new THREE.Euler(0, 0, 0, 'YXZ');
    this.rotation.x = -Math.PI / 6;
    this.rotation.y = Math.PI / 4;
    
    // Ustawienia swobodnego lotu
    this.moveSpeed = 15;
    this.lookSpeed = 2;
    this.keys = {};

    // Stan myszy/dotyku
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    
    // Ustawienia mobilne
    this.isMobile = false;
    this.cameraTouchId = null;
    this.joystick = null;
    this.joystickDirection = new THREE.Vector2();

    this.bindEvents();
    this.updateCameraPosition();
  }

  setIsMobile(isMobile) {
      this.isMobile = isMobile;
  }

  bindEvents() {
    this.handleMouseDown = (e) => {
        if (this.mode === 'orbital' && !e.target.closest('.ui-element')) {
            this.isDragging = true;
            this.previousMousePosition = { x: e.clientX, y: e.clientY };
        }
    };
    this.handleMouseMove = (e) => {
        if (!this.isDragging) return;
        const deltaX = e.clientX - this.previousMousePosition.x;
        const deltaY = e.clientY - this.previousMousePosition.y;
        this.applyRotation(deltaX, deltaY, 1);
        this.previousMousePosition = { x: e.clientX, y: e.clientY };
    };
    this.handleMouseUp = () => {
        this.isDragging = false;
    };

    this.handleTouchStart = (e) => {
        if (this.mode === 'orbital') {
            for (const touch of e.changedTouches) {
                if (this.cameraTouchId === null && !touch.target.closest('.ui-element') && !touch.target.closest('#joystick-zone')) {
                    this.cameraTouchId = touch.identifier;
                    this.isDragging = true;
                    this.previousMousePosition = { x: touch.clientX, y: touch.clientY };
                    break;
                }
            }
        }
    };
    this.handleTouchMove = (e) => {
        if (!this.isDragging) return;
        for (const touch of e.changedTouches) {
            if (touch.identifier === this.cameraTouchId) {
                const deltaX = touch.clientX - this.previousMousePosition.x;
                const deltaY = touch.clientY - this.previousMousePosition.y;
                this.applyRotation(deltaX, deltaY, 2.5);
                this.previousMousePosition = { x: touch.clientX, y: touch.clientY };
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
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('mouseup', this.handleMouseUp);
    this.domElement.addEventListener('touchstart', this.handleTouchStart, { passive: true });
    window.addEventListener('touchmove', this.handleTouchMove, { passive: true });
    window.addEventListener('touchend', this.handleTouchEnd, { passive: true });

    window.addEventListener('keydown', this.onKeyDown.bind(this));
    window.addEventListener('keyup', this.onKeyUp.bind(this));
  }

  applyRotation(deltaX, deltaY, sensitivityMultiplier) {
      this.rotation.y -= deltaX * 0.005 * sensitivityMultiplier;
      this.rotation.x -= deltaY * 0.005 * sensitivityMultiplier;
      this.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.rotation.x));
  }
  
  destroy() {
    this.domElement.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('mouseup', this.handleMouseUp);
    this.domElement.removeEventListener('touchstart', this.handleTouchStart);
    window.removeEventListener('touchmove', this.handleTouchMove);
    window.removeEventListener('touchend', this.handleTouchEnd);

    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    
    if (this.joystick) {
        this.joystick.destroy();
        this.joystick = null;
        if(this.isMobile) document.getElementById('joystick-zone').style.display = 'none';
    }
  }
  
  onKeyDown(event) { this.keys[event.code] = true; }
  onKeyUp(event) { this.keys[event.code] = false; }

  setMode(newMode) {
    this.mode = newMode;
    
    if (this.isMobile) {
        const joystickZone = document.getElementById('joystick-zone');
        if (this.mode === 'free') {
            joystickZone.style.display = 'block';
            if (!this.joystick) {
                this.joystick = nipplejs.create({
                    zone: joystickZone,
                    mode: 'static',
                    position: { left: '50%', top: '50%' },
                    color: 'white',
                    size: 100,
                });
                this.joystick.on('move', (evt, data) => {
                    if (data.vector) this.joystickDirection.set(data.vector.x, data.vector.y);
                });
                this.joystick.on('end', () => {
                    this.joystickDirection.set(0, 0);
                });
            }
        } else { // tryb 'orbital'
            joystickZone.style.display = 'none';
            if (this.joystick) {
                this.joystick.destroy();
                this.joystick = null;
            }
        }
    }
  }

  updateCameraPosition() {
    if (this.mode === 'orbital') {
      const offset = new THREE.Vector3(0, 0, this.distance);
      offset.applyEuler(this.rotation);
      this.camera.position.copy(this.target).add(offset);
      this.camera.lookAt(this.target);
    } else if (this.mode === 'free') {
      this.camera.quaternion.setFromEuler(this.rotation);
    }
  }

  update(deltaTime) {
    if (this.mode === 'free') {
      const moveDirection = new THREE.Vector3();
      
      if (this.isMobile) {
          if (this.joystickDirection.length() > 0) {
              moveDirection.set(this.joystickDirection.x, 0, -this.joystickDirection.y);
          }
      } else {
          if (this.keys['KeyW']) moveDirection.z = -1;
          if (this.keys['KeyS']) moveDirection.z = 1;
          if (this.keys['KeyA']) moveDirection.x = -1;
          if (this.keys['KeyD']) moveDirection.x = 1;
      }
      
      if (moveDirection.lengthSq() > 0) {
        moveDirection.normalize().applyEuler(this.camera.rotation);
        this.camera.position.add(moveDirection.multiplyScalar(this.moveSpeed * deltaTime));
      }
      
      if (!this.isMobile) {
          if (this.keys['Space']) this.camera.position.y += this.moveSpeed * deltaTime;
          if (this.keys['ShiftLeft']) this.camera.position.y -= this.moveSpeed * deltaTime;
      }
    }
    
    this.updateCameraPosition();
  }
      }
