export class ToolManager {
  constructor(sceneManager) {
    this.sceneManager = sceneManager;
    this.currentTool = 'select';
  }

  selectTool(toolElement) {
    // Remove active class from all tools
    document.querySelectorAll('.tool-button').forEach(t => t.classList.remove('active'));
    
    // Add active class to selected tool
    toolElement.classList.add('active');
    this.currentTool = toolElement.dataset.tool;
    console.log(`Selected tool: ${this.currentTool}`);

    // TODO: Implement specific tool behaviors
    switch(this.currentTool) {
      case 'move':
        this.setupMoveTool();
        break;
      case 'rotate':
        this.setupRotateTool();
        break;
      case 'scale':
        this.setupScaleTool();
        break;
    }
  }

  setupMoveTool() {
    // Placeholder for move tool implementation
    console.log('Move tool selected');
  }

  setupRotateTool() {
    // Placeholder for rotate tool implementation
    console.log('Rotate tool selected');
  }

  setupScaleTool() {
    // Placeholder for scale tool implementation
    console.log('Scale tool selected');
  }
}