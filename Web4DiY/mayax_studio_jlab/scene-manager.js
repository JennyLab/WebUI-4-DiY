import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.158.0/examples/jsm/controls/OrbitControls.js';

export class SceneManager {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error(`Container with id ${containerId} not found`);
      return;
    }

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x2c2c2c);
    
    this.camera = new THREE.PerspectiveCamera(75, this.container.clientWidth / this.container.clientHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.selectedObject = null;

    this.setupRenderer();
    this.setupCamera();
    this.setupControls();
    this.setupLights();
    this.setupAdvancedGrid();
    this.setupEventListeners();
    this.animate();
  }

  setupRenderer() {
    if (!this.container) return;
    
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.container.appendChild(this.renderer.domElement);
  }

  setupCamera() {
    this.camera.position.set(5, 5, 5);
    this.camera.lookAt(0, 0, 0);
  }

  setupControls() {
    if (!this.container) return;
    
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
  }

  setupLights() {
    const ambientLight = new THREE.AmbientLight(0x404040, 1);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    
    this.scene.add(ambientLight);
    this.scene.add(directionalLight);
  }

  setupAdvancedGrid() {
    const gridSize = 20;
    const gridDivisions = 40;
    
    const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0x555555, 0x333333);
    this.scene.add(gridHelper);

    const axesHelper = new THREE.AxesHelper(gridSize / 2);
    this.scene.add(axesHelper);

    const groundGeometry = new THREE.PlaneGeometry(gridSize, gridSize);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x222222, 
      transparent: true, 
      opacity: 0.1 
    });
    const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
    groundMesh.rotation.x = -Math.PI / 2;
    this.scene.add(groundMesh);
  }

  setupEventListeners() {
    window.addEventListener('resize', () => this.onWindowResize(), false);
  }

  onWindowResize() {
    if (!this.container) return;
    
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    if (this.controls) {
      this.controls.update();
    }
    this.renderer.render(this.scene, this.camera);
  }

  createObject(type = 'box', options = {}) {
    let geometry, material, mesh;
    const defaultColor = 0x00ff00;
    const uniqueName = `${type}_${Date.now()}`;

    // Default positioning
    const position = new THREE.Vector3(
      options.x ?? 0, 
      options.y ?? 1, 
      options.z ?? 0
    );

    // Create geometry based on type
    switch(type) {
      case 'box':
        geometry = new THREE.BoxGeometry(
          options.width ?? 1, 
          options.height ?? 1, 
          options.depth ?? 1
        );
        break;
      case 'sphere':
        geometry = new THREE.SphereGeometry(
          options.radius ?? 0.5, 
          options.widthSegments ?? 32, 
          options.heightSegments ?? 32
        );
        break;
      case 'cylinder':
        geometry = new THREE.CylinderGeometry(
          options.radiusTop ?? 0.5, 
          options.radiusBottom ?? 0.5, 
          options.height ?? 1, 
          options.radialSegments ?? 32
        );
        break;
      default:
        console.error(`Unsupported object type: ${type}`);
        return null;
    }

    // Create material
    material = new THREE.MeshStandardMaterial({ 
      color: options.color ?? defaultColor,
      metalness: 0.2,
      roughness: 0.7
    });
    
    // Create mesh
    mesh = new THREE.Mesh(geometry, material);
    mesh.name = uniqueName;
    mesh.position.copy(position);
    
    // Enable shadows
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    // Add to scene
    this.scene.add(mesh);
    console.log(`Created ${type} at ${position.toArray()}`);

    return mesh;
  }

  addObject(object) {
    // Ensure object has shadow properties
    object.castShadow = true;
    object.receiveShadow = true;

    // If object doesn't have a name, generate a unique one
    if (!object.name) {
      object.name = `Object_${this.scene.children.filter(child => child.type === object.type).length + 1}`;
    }

    // Add object to the scene
    this.scene.add(object);

    // Log for debugging
    console.log(`Added object: ${object.name}`);

    return object;
  }

  selectObject(object) {
    // Deselect previous object
    if (this.selectedObject) {
      this.selectedObject.material.color.set(0x00ff00);
    }

    // Select new object
    this.selectedObject = object;
    if (object.material) {
      object.material.color.set(0xff0000);
    }

    console.log(`Selected object: ${object.name}`);
  }

  getSelectedObject() {
    return this.selectedObject;
  }

  switchView(viewType) {
    switch(viewType) {
      case 'perspective':
        this.camera.position.set(5, 5, 5);
        break;
      case 'top':
        this.camera.position.set(0, 10, 0);
        break;
      case 'front':
        this.camera.position.set(0, 0, 10);
        break;
      case 'side':
        this.camera.position.set(10, 0, 0);
        break;
    }
    this.camera.lookAt(this.scene.position);
  }

  clearScene() {
    while(this.scene.children.length > 0) { 
      const child = this.scene.children[0];
      if (!(child instanceof THREE.Light || child instanceof THREE.GridHelper || child instanceof THREE.AxesHelper)) {
        this.scene.remove(child);
      }
    }
    this.selectedObject = null;
  }
}