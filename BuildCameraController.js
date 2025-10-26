import * as THREE from 'three';

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

    // Stan myszy
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    
    this.bindEvents();
    this.updateCameraPosition();
  }

  bindEvents() {
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);

    this.domElement.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }
  
  destroy() {
    this.domElement.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }

  onMouseDown(event) {
    if (event.target !== this.domElement) return;
    this.isDragging = true;
    this.previousMousePosition.x = event.clientX;
    this.previousMousePosition.y = event.clientY;
  }
  
  onMouseUp() {
    this.isDragging = false;
  }
  
  onMouseMove(event) {
    if (!this.isDragging) return;

    const deltaX = event.clientX - this.previousMousePosition.x;
    const deltaY = event.clientY - this.previousMousePosition.y;

    if (this.mode === 'orbital') {
      this.rotation.y -= deltaX * 0.005;
      this.rotation.x -= deltaY * 0.005;
      this.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.rotation.x));
    } else if (this.mode === 'free') {
      this.rotation.y -= deltaX * 0.002 * this.lookSpeed;
      this.rotation.x -= deltaY * 0.002 * this.lookSpeed;
      this.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.rotation.x));
    }

    this.previousMousePosition.x = event.clientX;
    this.previousMousePosition.y = event.clientY;
  }
  
  onKeyDown(event) { this.keys[event.code] = true; }
  onKeyUp(event) { this.keys[event.code] = false; }

  setMode(newMode) {
    this.mode = newMode;
    console.log(`Camera mode set to: ${this.mode}`);
  }

  updateCameraPosition() {
    if (this.mode === 'orbital') {
      const offset = new THREE.Vector3(0, 0, this.distance);
      offset.applyEuler(this.rotation);
      this.camera.position.copy(this.target).add(offset);
      this.camera.lookAt(this.target);
    } else if (this.mode === 'free') {
      // POPRAWKA: Użycie kwaternionu do ustawienia rotacji kamery jest bardziej stabilne.
      this.camera.quaternion.setFromEuler(this.rotation);
    }
  }

  update(deltaTime) {
    if (this.mode === 'free') {
      const moveDirection = new THREE.Vector3();
      if (this.keys['KeyW']) moveDirection.z = -1;
      if (this.keys['KeyS']) moveDirection.z = 1;
      if (this.keys['KeyA']) moveDirection.x = -1;
      if (this.keys['KeyD']) moveDirection.x = 1;

      moveDirection.normalize().applyEuler(this.camera.rotation);
      this.camera.position.add(moveDirection.multiplyScalar(this.moveSpeed * deltaTime));
      
      if (this.keys['Space']) this.camera.position.y += this.moveSpeed * deltaTime;
      if (this.keys['ShiftLeft']) this.camera.position.y -= this.moveSpeed * deltaTime;
    }
    
    this.updateCameraPosition();
  }
}