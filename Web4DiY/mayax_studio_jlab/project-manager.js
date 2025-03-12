export class ProjectManager {
  constructor(app) {
    this.app = app;
    localforage.config({
      name: "RobloxStudioProjects"
    });
  }

  async createNewProject(projectName) {
    try {
      const project = {
        name: projectName,
        createdAt: new Date().toISOString(),
        scenes: [],
        objects: []
      };

      await localforage.setItem(projectName, project);
      console.log(`Project ${projectName} created successfully`);
      this.loadProject(projectName);
    } catch (error) {
      console.error("Error creating project:", error);
    }
  }

  async loadProject(projectName) {
    try {
      const project = await localforage.getItem(projectName);
      if (project) {
        // Clear existing scene
        this.app.sceneManager.clearScene();

        // Restore objects
        project.objects.forEach(objectData => {
          this.app.modelExplorer.restoreObjectFromData(objectData);
        });

        console.log(`Loaded project: ${projectName}`);
      }
    } catch (error) {
      console.error("Error loading project:", error);
    }
  }

  async saveCurrentProject() {
    const projectName = this.getCurrentProjectName();
    if (!projectName) {
      return this.saveProjectAs();
    }

    try {
      const project = {
        name: projectName,
        updatedAt: new Date().toISOString(),
        objects: this.getCurrentSceneObjects()
      };

      await localforage.setItem(projectName, project);
      console.log(`Project ${projectName} saved successfully`);
    } catch (error) {
      console.error("Error saving project:", error);
    }
  }

  async saveProjectAs() {
    const projectName = prompt("Enter a name for the project:");
    if (projectName) {
      await this.createNewProject(projectName);
      await this.saveCurrentProject();
    }
  }

  async deleteProject(projectName) {
    try {
      await localforage.removeItem(projectName);
      console.log(`Project ${projectName} deleted`);
      this.populateProjectsList();
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  }

  async populateProjectsList() {
    const savedProjectsList = document.getElementById('saved-projects-list');
    savedProjectsList.innerHTML = '';

    try {
      const keys = await localforage.keys();
      keys.forEach(key => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = key;
        savedProjectsList.appendChild(option);
      });
    } catch (error) {
      console.error("Error populating projects list:", error);
    }
  }

  exitProject() {
    // Clear scene, reset UI
    this.app.sceneManager.clearScene();
    console.log("Exited current project");
  }

  getCurrentProjectName() {
    // Implement logic to get current project name
    return localStorage.getItem('currentProjectName');
  }

  getCurrentSceneObjects() {
    // Extract current scene objects' data
    return this.app.sceneManager.scene.children
      .filter(obj => obj.isObject3D && obj.type !== 'Scene')
      .map(obj => ({
        name: obj.name,
        type: obj.type,
        position: obj.position.toArray(),
        rotation: obj.rotation.toArray(),
        scale: obj.scale.toArray()
      }));
  }
}