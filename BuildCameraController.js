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

      // Usuń stary joystick
      if (this.joystickManager) {
          this.joystickManager.destroy();
          this.joystickManager = null;
      }

      // Konfiguracja identyczna jak w PlayerController (bo tam działa)
      this.joystickManager = nipplejs.create({
          zone: zone,
          mode: 'static',
          position: { left: '50%', top: '50%' },
          color: 'white',
          size: 100,
          dynamicPage: true
      });

      // Używamy data.vector zamiast data.angle
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
    // --- PC MOUSE ---
    this.handleMouseDown = (e) => {
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

    // --- MOBILE TOUCH ---
    this.handleTouchStart = (e) => {
        if (this.cameraTouchId !== null) return; // Już obracamy

        for (const touch of e.changedTouches) {
            const target = touch.target;
            
            // BARDZO WAŻNE: Ignoruj elementy joysticka (klasy nipplejs)
            // oraz strefę w lewym dolnym rogu
            const isJoystickElement = target.closest('.nipple') || target.closest('.back') || target.closest('.front') || target.closest('#joystick-zone');
            const isUI = target.closest('.ui-element') || target.closest('.build-ui-button');
            
            // Strefa bezpieczna (ignoruj lewy dolny róg ekranu)
            const x = touch.clientX;
            const y = touch.clientY;
            const isBottomLeft = x < window.innerWidth * 0.4 && y > window.innerHeight * 0.6;

            if (!isJoystickElement && !isUI && !isBottomLeft) {
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
                this.applyRotation(deltaX, deltaY, 1.5); 
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
      const limit = Math.PI / 2 - 0.05;
      this.rotation.x = Math.max(-limit, Math.min(limit, this.rotation.x));
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

    // JOYSTICK (FIX)
    // Używamy data.vector.x i y bezpośrednio
    if (this.isMobile && (Math.abs(this.joystickData.x) > 0.01 || Math.abs(this.joystickData.y) > 0.01)) {
        // Y+ na joysticku to Przód (czyli -Z w 3D)
        moveDir.z = -this.joystickData.y; 
        // X+ na joysticku to Prawo (czyli +X w 3D)
        moveDir.x = this.joystickData.x;
        hasInput = true;
    }

    // KLAWIATURA
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
        // Normalizuj tylko jeśli długość > 1 (aby zachować analogową kontrolę prędkości na joysticku)
        if (moveDir.lengthSq() > 1) moveDir.normalize();

        // Obrót zgodnie z osią Y kamery
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