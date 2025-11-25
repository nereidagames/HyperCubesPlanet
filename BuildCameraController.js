import * as THREE from 'three';
import nipplejs from 'nipplejs';

export class BuildCameraController {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;
    
    this.mode = 'orbital'; // 'orbital' lub 'free'
    this.target = new THREE.Vector3(0, 0, 0);

    // Ustawienia orbitalne
    this.distance = 40;
    this.rotation = new THREE.Euler(0, 0, 0, 'YXZ');
    this.rotation.x = -Math.PI / 4; // Kąt 45 stopni
    this.rotation.y = Math.PI / 4;
    
    // Ustawienia sterowania
    this.moveSpeed = 25; // Prędkość przesuwania
    this.keys = {};

    // Stan myszy/dotyku (do obracania)
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    
    // Ustawienia mobilne (Joystick)
    this.isMobile = false;
    this.cameraTouchId = null;
    this.joystickManager = null;
    this.joystickData = { x: 0, y: 0 };

    this.boundOnKeyDown = this.onKeyDown.bind(this);
    this.boundOnKeyUp = this.onKeyUp.bind(this);

    this.bindEvents();
    this.updateCameraPosition();
  }

  setIsMobile(isMobile) {
      this.isMobile = isMobile;
      if (this.isMobile) {
          this.setupJoystick();
      }
  }

  setupJoystick() {
      const zone = document.getElementById('joystick-zone');
      if (!zone) return;

      // Upewnij się, że strefa jest czysta przed utworzeniem nowego
      if (this.joystickManager) {
          this.joystickManager.destroy();
      }

      this.joystickManager = nipplejs.create({
          zone: zone,
          mode: 'static',
          position: { left: '50%', top: '50%' },
          color: 'white',
          size: 100
      });

      this.joystickManager.on('move', (evt, data) => {
          if (data.vector) {
              // NippleJS zwraca vector {x, y} znormalizowany
              this.joystickData.x = data.vector.x;
              this.joystickData.y = data.vector.y;
          }
      });

      this.joystickManager.on('end', () => {
          this.joystickData.x = 0;
          this.joystickData.y = 0;
      });
  }

  bindEvents() {
    // Obsługa MYSZY (PC)
    this.handleMouseDown = (e) => {
        // Ignoruj kliknięcia w UI
        if (e.target.closest('.ui-element') || e.target.closest('.build-ui-button') || e.target.closest('.panel-modal')) return;
        this.isDragging = true;
        this.previousMousePosition = { x: e.clientX, y: e.clientY };
    };
    this.handleMouseMove = (e) => {
        if (!this.isDragging) return;
        const deltaX = e.clientX - this.previousMousePosition.x;
        const deltaY = e.clientY - this.previousMousePosition.y;
        this.applyRotation(deltaX, deltaY, 1);
        this.previousMousePosition = { x: e.clientX, y: e.clientY };
    };
    this.handleMouseUp = () => { this.isDragging = false; };

    // Obsługa DOTYKU (Mobile - tylko obracanie prawą ręką)
    // Lewa ręka obsługuje Joystick (nipplejs)
    this.handleTouchStart = (e) => {
        for (const touch of e.changedTouches) {
            // Ignoruj strefę joysticka i UI
            if (this.cameraTouchId === null && 
                !touch.target.closest('.ui-element') && 
                !touch.target.closest('#joystick-zone') && 
                !touch.target.closest('.build-ui-button')) {
                
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
    this.domElement.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    window.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    window.addEventListener('touchend', this.handleTouchEnd, { passive: false });

    window.addEventListener('keydown', this.boundOnKeyDown);
    window.addEventListener('keyup', this.boundOnKeyUp);
  }

  applyRotation(deltaX, deltaY, sensitivityMultiplier) {
      const sens = 0.003 * sensitivityMultiplier;
      this.rotation.y -= deltaX * sens;
      this.rotation.x -= deltaY * sens;
      // Limit góra/dół
      this.rotation.x = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.rotation.x));
  }
  
  destroy() {
    this.domElement.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('mouseup', this.handleMouseUp);
    this.domElement.removeEventListener('touchstart', this.handleTouchStart);
    window.removeEventListener('touchmove', this.handleTouchMove);
    window.removeEventListener('touchend', this.handleTouchEnd);

    window.removeEventListener('keydown', this.boundOnKeyDown);
    window.removeEventListener('keyup', this.boundOnKeyUp);
    
    if (this.joystickManager) {
        this.joystickManager.destroy();
        this.joystickManager = null;
    }
  }
  
  onKeyDown(event) { this.keys[event.code] = true; }
  onKeyUp(event) { this.keys[event.code] = false; }

  setMode(newMode) {
    this.mode = newMode;
    // W trybie free resetujemy rotację X, żeby nie patrzeć w ziemię od razu
    if(newMode === 'free') this.rotation.x = 0; 
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
    // Oblicz wektor ruchu (Move Direction)
    const moveDir = new THREE.Vector3(0, 0, 0);
    let hasInput = false;

    // 1. Obsługa Joysticka (Mobile)
    if (this.isMobile && (Math.abs(this.joystickData.x) > 0.1 || Math.abs(this.joystickData.y) > 0.1)) {
        // Joystick Y = Przód/Tył (Z), Joystick X = Lewo/Prawo (X)
        moveDir.z = -this.joystickData.y; // Przód to ujemne Z
        moveDir.x = this.joystickData.x;
        hasInput = true;
    }

    // 2. Obsługa Klawiatury (PC)
    if (!this.isMobile) {
        if (this.keys['KeyW']) { moveDir.z = -1; hasInput = true; }
        if (this.keys['KeyS']) { moveDir.z = 1; hasInput = true; }
        if (this.keys['KeyA']) { moveDir.x = -1; hasInput = true; }
        if (this.keys['KeyD']) { moveDir.x = 1; hasInput = true; }
        if (this.mode === 'free') {
            if (this.keys['Space']) this.camera.position.y += this.moveSpeed * deltaTime;
            if (this.keys['ShiftLeft']) this.camera.position.y -= this.moveSpeed * deltaTime;
        }
    }

    // Aplikowanie ruchu
    if (hasInput) {
        // Normalizuj wektor wejściowy
        moveDir.normalize();

        // Obróć wektor ruchu o kąt Y kamery (żeby "przód" był tam gdzie patrzymy)
        const yRotation = this.rotation.y;
        moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), yRotation);

        // Przesuń
        const moveAmount = moveDir.multiplyScalar(this.moveSpeed * deltaTime);

        if (this.mode === 'free') {
            this.camera.position.add(moveAmount);
        } else {
            this.target.add(moveAmount);
        }
    }
    
    this.updateCameraPosition();
  }
}