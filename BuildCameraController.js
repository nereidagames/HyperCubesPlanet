import * as THREE from 'three';
import nipplejs from 'nipplejs';

export class BuildCameraController {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;
    
    this.mode = 'orbital'; // 'orbital' lub 'free'
    this.target = new THREE.Vector3(0, 0, 0);

    // Ustawienia
    this.distance = 40;
    this.rotation = new THREE.Euler(0, 0, 0, 'YXZ');
    this.rotation.x = -Math.PI / 4; 
    this.rotation.y = Math.PI / 4;
    this.moveSpeed = 25; 
    this.keys = {};

    // Stan
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    
    // Mobile
    this.isMobile = false;
    this.cameraTouchId = null; // ID dotyku używanego do OBRACANIA (prawa ręka)
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

      // Czyścimy stary joystick
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
          if (data && data.angle) {
              // Obliczamy wektor ręcznie z kąta i siły dla precyzji
              const force = Math.min(data.force, 2.0); // Limit siły
              const angle = data.angle.radian;
              
              // NippleJS: 0 rad to prawo (X+), PI/2 to góra (Y+)
              this.joystickData.x = Math.cos(angle) * force;
              this.joystickData.y = Math.sin(angle) * force;
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
        // Jeśli już obracamy kamerę jednym palcem, ignoruj inne
        if (this.cameraTouchId !== null) return;

        for (const touch of e.changedTouches) {
            const x = touch.clientX;
            const y = touch.clientY;
            const screenW = window.innerWidth;
            const screenH = window.innerHeight;

            // STREFA WYKLUCZENIA (JOYSTICKA)
            // Ignoruj dotyk w lewym dolnym rogu (tam jest joystick i przycisk +)
            // Obszar: 40% szerokości od lewej i 40% wysokości od dołu
            const isInJoystickZone = (x < screenW * 0.4) && (y > screenH * 0.6);

            // Ignoruj również elementy UI
            const isUI = touch.target.closest('.ui-element') || 
                         touch.target.closest('.build-ui-button') || 
                         touch.target.closest('#joystick-zone');

            if (!isInJoystickZone && !isUI) {
                this.cameraTouchId = touch.identifier;
                this.isDragging = true;
                this.previousMousePosition = { x: touch.clientX, y: touch.clientY };
                break; // Znaleźliśmy palec do kamery, przerywamy pętlę
            }
        }
    };

    this.handleTouchMove = (e) => {
        if (!this.isDragging) return;
        for (const touch of e.changedTouches) {
            if (touch.identifier === this.cameraTouchId) {
                const deltaX = touch.clientX - this.previousMousePosition.x;
                const deltaY = touch.clientY - this.previousMousePosition.y;
                
                // Mniejsza czułość na mobile
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
    
    // Używamy { passive: false } żeby móc zablokować scrollowanie strony
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
      
      // Ograniczenie góra/dół (żeby nie zrobić fikołka)
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

    // JOYSTICK (Mobile)
    // Sprawdzamy czy joystick jest wychylony (deadzone 0.1)
    if (this.isMobile && (Math.abs(this.joystickData.x) > 0.05 || Math.abs(this.joystickData.y) > 0.05)) {
        // Joystick Up (+Y) = Forward (-Z)
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
        // Normalizuj wektor (żeby skos nie był szybszy)
        if (moveDir.length() > 1) moveDir.normalize();

        // Obróć wektor ruchu zgodnie z obrotem kamery (tylko oś Y)
        // Dzięki temu "przód" joysticka to zawsze "w głąb ekranu"
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