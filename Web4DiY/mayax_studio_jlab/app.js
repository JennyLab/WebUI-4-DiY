import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.158.0/examples/jsm/controls/OrbitControls.js';

import { SceneManager } from './scene-manager.js';
import { ModelExplorer } from './model-explorer.js';
import { ToolManager } from './tool-manager.js';
import { ProjectManager } from './project-manager.js';

class RobloxStudioApp {
  constructor() {
    this.sceneManager = new SceneManager('3d-scene');
    this.modelExplorer = new ModelExplorer(this.sceneManager);
    this.toolManager = new ToolManager(this.sceneManager);
    this.projectManager = new ProjectManager(this);
    
    this.initializeEventListeners();
    this.setupConsoleLogging();
    this.setupProjectModals();
  }

  initializeEventListeners() {
    this.setupMenuListeners();
    this.setupToolListeners();
    this.setupPartAddListeners();
    this.setupPropertyListeners();
    this.setupPlayControls();
    this.setupViewportTabListeners();
  }

  setupMenuListeners() {
    document.querySelectorAll('.menu-section').forEach(menu => {
      menu.addEventListener('click', () => this.handleMenuClick(menu));
    });

    document.querySelectorAll('.dropdown-item').forEach(item => {
      item.addEventListener('click', () => this.handleDropdownItemClick(item));
    });
  }

  setupToolListeners() {
    document.querySelectorAll('.tool-button').forEach(tool => {
      tool.addEventListener('click', () => this.toolManager.selectTool(tool));
    });
  }

  setupPartAddListeners() {
    const addPartModal = document.getElementById('add-part-modal');
    const addPartBtn = document.getElementById('add-part');
    const closeModal = document.querySelector('.close-modal');
    const partOptions = document.querySelectorAll('.part-options button');

    addPartBtn.addEventListener('click', () => {
      addPartModal.style.display = 'block';
    });

    closeModal.addEventListener('click', () => {
      addPartModal.style.display = 'none';
    });

    partOptions.forEach(option => {
      option.addEventListener('click', () => {
        const partType = option.dataset.partType;
        this.modelExplorer.addPart(partType);
        addPartModal.style.display = 'none';
      });
    });
  }

  setupPropertyListeners() {
    const positionInput = document.getElementById('position-input');
    const rotationInput = document.getElementById('rotation-input');
    const sizeInput = document.getElementById('size-input');

    positionInput.addEventListener('change', () => {
      const selectedObject = this.sceneManager.getSelectedObject();
      if (selectedObject) {
        const [x, y, z] = positionInput.value.split(',').map(Number);
        selectedObject.position.set(x, y, z);
      }
    });

    rotationInput.addEventListener('change', () => {
      const selectedObject = this.sceneManager.getSelectedObject();
      if (selectedObject) {
        const [x, y, z] = rotationInput.value.split(',').map(Number);
        selectedObject.rotation.set(x, y, z);
      }
    });

    sizeInput.addEventListener('change', () => {
      const selectedObject = this.sceneManager.getSelectedObject();
      if (selectedObject && selectedObject.geometry) {
        const [width, height, depth] = sizeInput.value.split(',').map(Number);
        selectedObject.geometry.dispose();
        selectedObject.geometry = new THREE.BoxGeometry(width, height, depth);
      }
    });
  }

  setupPlayControls() {
    document.getElementById('play-btn').addEventListener('click', () => this.playScene());
    document.getElementById('stop-btn').addEventListener('click', () => this.stopScene());
  }

  setupViewportTabListeners() {
    document.querySelectorAll('.viewport-tabs .tab').forEach(tab => {
      tab.addEventListener('click', () => this.switchViewportTab(tab));
    });
  }

  setupProjectModals() {
    const newProjectModal = document.getElementById('new-project-modal');
    const createProjectBtn = document.getElementById('create-project-btn');
    const cancelProjectBtn = document.getElementById('cancel-project-btn');
    const projectNameInput = document.getElementById('project-name-input');

    createProjectBtn.addEventListener('click', () => {
      const projectName = projectNameInput.value.trim();
      if (projectName) {
        this.projectManager.createNewProject(projectName);
        newProjectModal.style.display = 'none';
      }
    });

    cancelProjectBtn.addEventListener('click', () => {
      newProjectModal.style.display = 'none';
    });

    const openProjectModal = document.getElementById('open-project-modal');
    const savedProjectsList = document.getElementById('saved-projects-list');
    const loadProjectBtn = document.getElementById('load-project-btn');
    const deleteProjectBtn = document.getElementById('delete-project-btn');

    loadProjectBtn.addEventListener('click', () => {
      const selectedProject = savedProjectsList.value;
      if (selectedProject) {
        this.projectManager.loadProject(selectedProject);
        openProjectModal.style.display = 'none';
      }
    });

    deleteProjectBtn.addEventListener('click', () => {
      const selectedProject = savedProjectsList.value;
      if (selectedProject) {
        this.projectManager.deleteProject(selectedProject);
      }
    });
  }

  handleMenuClick(menu) {
    console.log(`Clicked menu: ${menu.textContent}`);
  }

  handleDropdownItemClick(item) {
    switch(item.id) {
      case 'new-project':
        document.getElementById('new-project-modal').style.display = 'block';
        break;
      case 'open-project':
        this.projectManager.populateProjectsList();
        document.getElementById('open-project-modal').style.display = 'block';
        break;
      case 'save-project':
        this.projectManager.saveCurrentProject();
        break;
      case 'save-as-project':
        this.projectManager.saveProjectAs();
        break;
      case 'exit-project':
        this.projectManager.exitProject();
        break;
      case 'add-part':
        break;
      case 'add-model':
        this.modelExplorer.importModel();
        break;
      case 'export-model':
        this.modelExplorer.exportModel();
        break;
    }
  }

  switchViewportTab(tab) {
    document.querySelectorAll('.viewport-tabs .tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    this.sceneManager.switchView(tab.dataset.view);
  }

  playScene() {
    console.log('Playing scene');
  }

  stopScene() {
    console.log('Stopping scene');
  }

  setupConsoleLogging() {
    const consoleLog = document.getElementById('console-log');
    const originalLog = console.log;
    console.log = (message) => {
      const logEntry = document.createElement('div');
      logEntry.textContent = message;
      consoleLog.appendChild(logEntry);
      originalLog.apply(console, arguments);
    };
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.RobloxStudioApp = new RobloxStudioApp();
});

export default RobloxStudioApp;