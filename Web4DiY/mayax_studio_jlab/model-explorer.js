import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';

export class ModelExplorer {
  constructor(sceneManager) {
    this.sceneManager = sceneManager;
    this.hierarchy = document.getElementById('project-hierarchy');
    
    // Safely setup raycasting only if scene and container exist
    if (this.sceneManager && this.sceneManager.container) {
      this.setupRaycasting();
    }
  }

  setupRaycasting() {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    this.sceneManager.container.addEventListener('click', (event) => {
      // Ensure scene, camera, and container exist
      if (!this.sceneManager.scene || !this.sceneManager.camera || !this.sceneManager.container) return;

      mouse.x = (event.clientX / this.sceneManager.container.clientWidth) * 2 - 1;
      mouse.y = -(event.clientY / this.sceneManager.container.clientHeight) * 2 + 1;
      
      raycaster.setFromCamera(mouse, this.sceneManager.camera);
      const intersects = raycaster.intersectObjects(this.sceneManager.scene.children);
      
      if (intersects.length > 0) {
        this.sceneManager.selectObject(intersects[0].object);
        this.updatePropertiesPanel(intersects[0].object);
      }
    });
  }

  addPart(type) {
    if (!this.sceneManager) {
      console.error('Scene manager not initialized');
      return null;
    }

    // Use the SceneManager's createObject method
    const newObject = this.sceneManager.createObject(type);
    
    if (newObject) {
      this.updateHierarchy(newObject);
      return newObject;
    }

    return null;
  }

  updateHierarchy(object) {
    const listItem = document.createElement('li');
    listItem.textContent = object.name;
    listItem.dataset.objectId = object.id;
    
    const workspaceChildren = document.getElementById('workspace-children');
    if (workspaceChildren) {
      workspaceChildren.appendChild(listItem);
    }
  }

  updatePropertiesPanel(object) {
    const positionInput = document.getElementById('position-input');
    const rotationInput = document.getElementById('rotation-input');
    const sizeInput = document.getElementById('size-input');

    positionInput.value = `${object.position.x.toFixed(2)}, ${object.position.y.toFixed(2)}, ${object.position.z.toFixed(2)}`;
    rotationInput.value = `${object.rotation.x.toFixed(2)}, ${object.rotation.y.toFixed(2)}, ${object.rotation.z.toFixed(2)}`;
    
    if (object.geometry) {
      const size = object.geometry.parameters;
      sizeInput.value = `${size.width || 1}, ${size.height || 1}, ${size.depth || 1}`;
    }
  }

  importModel() {
    console.log('Import model functionality coming soon');
  }

  exportModel() {
    console.log('Export model functionality coming soon');
  }
}