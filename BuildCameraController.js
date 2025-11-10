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

    // POPRAWKA: Bindowanie funkcji do właściwości klasy, aby zapewnić tę samą referencję
    this.boundOnKeyDown = this.onKeyDown.bind(this);
    this.boundOnKeyUp = this.onKeyUp.bind(this);

    this.bindEvents();
    this.updateCameraPosition();
  }

  setIsMobile(isMobile) {
      this.isMobile = isMobile;
      // Inicjalizujemy tryb, aby poprawnie ustawić UI (joystick)
      this.setMode(this.mode); 
  }

  bindEvents() {
    this.handleMouseDown = (e) => {
        if (!e.target.closest('.ui-element')) {
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
        for (const touch of e.changedTouches) {
            if (this.cameraTouchId === null && !touch.target.closest('.ui-element') && !touch.target.closest('#joystick-zone')) {
                this.cameraTouchId = touch.identifier;
                this.isDragging = true;
                this.previousMousePosition = { x: touch.clientX, y: touch.clientY };
                break;
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

    // POPRAWKA: Użycie wcześniej zbindowanych funkcji
    window.addEventListener('keydown', this.boundOnKeyDown);
    window.addEventListener('keyup', this.boundOnKeyUp);
  }

  applyRotation(deltaX, deltaY, sensitivityMultiplier) {
      if (this.mode === 'free' && this.isMobile) return; // W trybie free na mobile obracamy kamerą w update()
      
      const lookSpeed = this.mode === 'free' ? this.lookSpeed : 1;
      this.rotation.y -= deltaX * 0.0025 * sensitivityMultiplier * lookSpeed;
      this.rotation.x -= deltaY * 0.0025 * sensitivityMultiplier * lookSpeed;
      this.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.rotation.x));
  }
  
  destroy() {
    this.domElement.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('mouseup', this.handleMouseUp);
    this.domElement.removeEventListener('touchstart', this.handleTouchStart);
    window.removeEventListener('touchmove', this.handleTouchMove);
    window.removeEventListener('touchend', this.handleTouchEnd);

    // POPRAWKA: Usunięcie listenerów przy użyciu tych samych referencji
    window.removeEventListener('keydown', this.boundOnKeyDown);
    window.removeEventListener('keyup', this.boundOnKeyUp);
    
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
        joystickZone.style.display = 'block'; // Zawsze pokazuj joystick na mobile
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
    const moveDirection = new THREE.Vector3();
    let hasMovementInput = false;

    if (this.isMobile) {
        if (this.joystickDirection.length() > 0.1) {
             // W trybie zaawansowanym joystick służy do obracania kamery
            if (this.mode === 'free') {
                this.rotation.y -= this.joystickDirection.x * 0.03;
                this.rotation.x += this.joystickDirection.y * 0.03;
                this.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.rotation.x));
            } else { // W trybie łatwym do poruszania się
                moveDirection.set(this.joystickDirection.x, 0, -this.joystickDirection.y);
                hasMovementInput = true;
            }
        }
    } else { // Sterowanie na PC
        if (this.keys['KeyW']) moveDirection.z = -1;
        if (this.keys['KeyS']) moveDirection.z = 1;
        if (this.keys['KeyA']) moveDirection.x = -1;
        if (this.keys['KeyD']) moveDirection.x = 1;
        if(moveDirection.lengthSq() > 0) hasMovementInput = true;
    }

    if (hasMovementInput) {
        // Używamy rotacji Y kamery, aby ruch był zawsze zgodny z kierunkiem patrzenia
        moveDirection.normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation.y);
        const moveAmount = moveDirection.multiplyScalar(this.moveSpeed * deltaTime);

        if (this.mode === 'free') {
            this.camera.position.add(moveAmount);
        } else { // orbital
            this.target.add(moveAmount);
        }
    }
    
    // Ruch góra/dół tylko na PC w trybie free
    if (this.mode === 'free' && !this.isMobile) {
      if (this.keys['Space']) this.camera.position.y += this.moveSpeed * deltaTime;
      if (this.keys['ShiftLeft']) this.camera.position.y -= this.moveSpeed * deltaTime;
    }
    
    this.updateCameraPosition();
  }
}
