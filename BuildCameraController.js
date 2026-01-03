/* PLIK: BuildCameraController.js */
import * as THREE from 'three';
import nipplejs from 'nipplejs';

export class BuildCameraController {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;
    
    this.mode = 'orbital'; // 'orbital' lub 'free'
    this.target = new THREE.Vector3(0, 0, 0);

    // Ustawienia kamery
    this.distance = 40;
    this.rotation = new THREE.Euler(0, 0, 0, 'YXZ');
    this.rotation.x = -Math.PI / 4; 
    this.rotation.y = Math.PI / 4;
    this.moveSpeed = 25; 
    this.keys = {};

    // Stan myszy/dotyku
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    
    // Mobile
    this.isMobile = false;
    this.cameraTouchId = null;
    this.joystickManager = null;
    this.joystickData = { x: 0, y: 0 };

    this.boundOnKeyDown = this.onKeyDown.bind(this);
    this.boundOnKeyUp = this.onKeyUp.bind(this);

    // Opóźnienie, aby DOM zdążył się załadować (np. joystick-zone)
    setTimeout(() => this.bindEvents(), 100);
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

      if (this.joystickManager) {
          this.joystickManager.destroy();
          this.joystickManager = null;
      }

      this.joystickManager = nipplejs.create({
          zone: zone,
          mode: 'static',
          position: { left: '50%', top: '50%' },
          color: 'white',
          size: 100,
          dynamicPage: true
      });

      this.joystickManager.on('move', (evt, data) => {
          if (data && data.vector) {
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
    const rotateZone = document.getElementById('build-rotate-zone');

    // --- PC MOUSE ---
    this.handleMouseDown = (e) => {
        // Sprawdzamy czy kliknięto w strefę obrotu LUB prawym przyciskiem w tło
        const isZone = e.target.closest('#build-rotate-zone');
        // Czy to element UI? (Przyciski, listy) - ale NIE strefa obrotu
        const isUI = e.target.closest('.build-ui-button') || 
                     e.target.closest('.panel-list') || 
                     e.target.closest('.build-sidebar-right') || 
                     e.target.closest('.build-top-left') || 
                     e.target.closest('.build-bottom-bar') ||
                     e.target.closest('#tools-modal') ||
                     e.target.closest('#joystick-zone');

        if (isZone) {
            // Kliknięcie w sferę obrotu zawsze obraca
            this.isDragging = true;
            this.previousMousePosition = { x: e.clientX, y: e.clientY };
            e.preventDefault(); // Zapobiega zaznaczaniu tekstu
        } else if (!isUI) {
            // Kliknięcie w świat gry:
            // Lewy przycisk (0) -> Stawia blok (ignorujemy tutaj, BuildManager to robi)
            // Środkowy (1) lub Prawy (2) -> Obraca kamerę
            if (e.button === 1 || e.button === 2) {
                this.isDragging = true;
                this.previousMousePosition = { x: e.clientX, y: e.clientY };
            }
        }
    };

    this.handleMouseMove = (e) => {
        if (!this.isDragging) return;
        const deltaX = e.clientX - this.previousMousePosition.x;
        const deltaY = e.clientY - this.previousMousePosition.y;
        this.applyRotation(deltaX, deltaY, 1);
        this.previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    this.handleMouseUp = () => { this.isDragging = false; };

    // --- MOBILE TOUCH ---
    this.handleTouchStart = (e) => {
        if (this.cameraTouchId !== null) return; 

        for (const touch of e.changedTouches) {
            const target = touch.target;
            
            // Na mobile obracamy TYLKO jeśli dotkniemy strefy obrotu (#build-rotate-zone)
            if (target.closest('#build-rotate-zone')) {
                this.cameraTouchId = touch.identifier;
                this.isDragging = true;
                this.previousMousePosition = { x: touch.clientX, y: touch.clientY };
                if(e.cancelable) e.preventDefault();
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
                // Zwiększamy czułość na mobile (x2.0) dla wygody
                this.applyRotation(deltaX, deltaY, 2.0); 
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

    // Nasłuchujemy na całym oknie (żeby złapać ruch myszką poza sferą po kliknięciu)
    // Ale używamy passive: false dla touch, żeby móc zablokować scrollowanie w strefie
    document.addEventListener('mousedown', this.handleMouseDown);
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mouseup', this.handleMouseUp);
    
    document.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    document.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    document.addEventListener('touchend', this.handleTouchEnd, { passive: false });

    window.addEventListener('keydown', this.boundOnKeyDown);
    window.addEventListener('keyup', this.boundOnKeyUp);
  }

  applyRotation(deltaX, deltaY, sensitivityMultiplier) {
      const sens = 0.003 * sensitivityMultiplier;
      this.rotation.y -= deltaX * sens;
      this.rotation.x -= deltaY * sens;
      const limit = Math.PI / 2 - 0.05;
      this.rotation.x = Math.max(-limit, Math.min(limit, this.rotation.x));
  }
  
  destroy() {
    document.removeEventListener('mousedown', this.handleMouseDown);
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
    document.removeEventListener('touchstart', this.handleTouchStart);
    document.removeEventListener('touchmove', this.handleTouchMove);
    document.removeEventListener('touchend', this.handleTouchEnd);
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
    const moveDir = new THREE.Vector3(0, 0, 0);
    let hasInput = false;

    // JOYSTICK (Mobilne) - Ruch kamery (targetu)
    if (this.isMobile && (Math.abs(this.joystickData.x) > 0.01 || Math.abs(this.joystickData.y) > 0.01)) {
        moveDir.z = -this.joystickData.y; 
        moveDir.x = this.joystickData.x;
        hasInput = true;
    }

    // KLAWIATURA (PC)
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

    if (hasInput) {
        if (moveDir.lengthSq() > 1) moveDir.normalize();

        const yRotation = this.rotation.y;
        moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), yRotation);

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