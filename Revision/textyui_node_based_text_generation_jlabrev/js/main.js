import { NodeFactory } from './nodeFactory.js';
import { FlowExecutor } from './flowExecutor.js';

class TextyUI {
  constructor() {
    this.jsPlumb = jsPlumb.getInstance();
    this.nodeFactory = new NodeFactory(this.jsPlumb);
    this.flowExecutor = new FlowExecutor();
    this.nodes = new Map();
    this.setupJsPlumb();
    this.setupEventListeners();
    this.setupLayoutButtons();
    this.setupToolbar();
    
    // Load default workflow after a short delay to ensure DOM is ready
    setTimeout(() => this.loadDefaultWorkflow(), 100);
  }

  setupJsPlumb() {
    this.jsPlumb.setContainer('canvas');
    this.jsPlumb.importDefaults({
      Connector: ['Flowchart', { 
        cornerRadius: 5,
        gap: 8,
        stub: 20,
      }],
      PaintStyle: { 
        stroke: getComputedStyle(document.documentElement).getPropertyValue('--connector-color'),
        strokeWidth: 3,
        outlineWidth: 2,
        outlineStroke: 'rgba(0,0,0,0.3)'
      },
      EndpointStyle: { 
        fill: 'transparent',
        stroke: getComputedStyle(document.documentElement).getPropertyValue('--connector-color'),
        strokeWidth: 2 
      },
      HoverPaintStyle: { 
        stroke: '#00ff9d', 
        strokeWidth: 4,
      },
      ConnectionsDetachable: true,
      ConnectionOverlays: [
        ['Arrow', {
          location: 1,
          width: 10,
          length: 10,
          foldback: 0.8,
        }]
      ]
    });

    // Enable grid snapping
    this.jsPlumb.importDefaults({
      DragOptions: {
        grid: [25, 25]
      }
    });
  }

  setupEventListeners() {
    document.getElementById('addNodeBtn').addEventListener('click', (e) => {
      this.showNodeMenu(e.clientX, e.clientY);
    });

    document.getElementById('executeBtn').addEventListener('click', () => {
      this.executeFlow();
    });

    document.getElementById('clearBtn').addEventListener('click', () => {
      this.clearCanvas();
    });

    document.getElementById('node-menu').addEventListener('click', (e) => {
      if (e.target.classList.contains('menu-item')) {
        const nodeType = e.target.dataset.type;
        this.addNode(nodeType, this.menuX, this.menuY);
        this.hideNodeMenu();
      }
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#node-menu') && 
          !e.target.matches('#addNodeBtn')) {
        this.hideNodeMenu();
      }
    });
  }

  setupLayoutButtons() {
    const toolbar = document.getElementById('toolbar');
    
    const autoLayoutBtn = document.createElement('button');
    autoLayoutBtn.textContent = 'Auto Layout';
    autoLayoutBtn.className = 'layout-btn';
    autoLayoutBtn.addEventListener('click', () => this.autoLayout());
    
    const straightenBtn = document.createElement('button');
    straightenBtn.textContent = 'Straighten';
    straightenBtn.className = 'layout-btn';
    straightenBtn.addEventListener('click', () => this.straightenConnections());
    
    toolbar.appendChild(autoLayoutBtn);
    toolbar.appendChild(straightenBtn);
  }

  setupToolbar() {
    const exportBtn = document.createElement('button');
    exportBtn.textContent = 'Export';
    exportBtn.addEventListener('click', () => this.exportWorkflow());
    
    const importBtn = document.createElement('button');
    importBtn.textContent = 'Import';
    const importInput = document.createElement('input');
    importInput.type = 'file';
    importInput.accept = '.json';
    importInput.style.display = 'none';
    importInput.addEventListener('change', (e) => {
      if (e.target.files.length) {
        this.importWorkflow(e.target.files[0]);
      }
    });
    importBtn.addEventListener('click', () => importInput.click());
    
    document.getElementById('toolbar').appendChild(exportBtn);
    document.getElementById('toolbar').appendChild(importBtn);
    document.getElementById('toolbar').appendChild(importInput);
  }

  showNodeMenu(x, y) {
    const menu = document.getElementById('node-menu');
    this.menuX = x;
    this.menuY = y;
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    menu.classList.remove('hidden');
  }

  hideNodeMenu() {
    document.getElementById('node-menu').classList.add('hidden');
  }

  addNode(type, x, y) {
    const node = this.nodeFactory.createNode(type);
    node.element.style.left = `${x - 100}px`;
    node.element.style.top = `${y - 25}px`;
    document.getElementById('canvas').appendChild(node.element);
    this.nodes.set(node.id, node);
    
    // Make node draggable
    this.jsPlumb.draggable(node.element, {
      grid: [10, 10]
    });
    
    // Add endpoints
    if (node.inputs) {
      node.inputs.forEach(input => {
        this.jsPlumb.addEndpoint(node.element, {
          anchor: 'Left',
          isTarget: true,
          endpoint: 'Dot',
          maxConnections: -1
        });
      });
    }
    
    if (node.outputs) {
      node.outputs.forEach(output => {
        this.jsPlumb.addEndpoint(node.element, {
          anchor: 'Right',
          isSource: true,
          endpoint: 'Dot',
          maxConnections: -1
        });
      });
    }
  }

  async executeFlow() {
    const connections = this.jsPlumb.getAllConnections();
    const flow = this.buildFlowGraph(connections);
    
    // Add visual feedback
    this.nodes.forEach(node => {
      node.element.classList.add('executing');
      const content = node.element.querySelector('.node-content');
      const spinner = document.createElement('div');
      spinner.className = 'loading';
      content.appendChild(spinner);
    });

    try {
      const result = await this.flowExecutor.execute(flow);
      
      // Update output nodes
      const outputNodes = Array.from(this.nodes.values())
        .filter(node => node.type === 'output');
      
      outputNodes.forEach((node, index) => {
        const outputElement = node.element.querySelector('.output-text');
        outputElement.textContent = result[index] || 'No output received';
      });
    } catch (error) {
      console.error('Flow execution error:', error);
      alert('Error executing flow: ' + error.message);
    } finally {
      // Remove visual feedback
      this.nodes.forEach(node => {
        node.element.classList.remove('executing');
        const spinner = node.element.querySelector('.loading');
        if (spinner) spinner.remove();
      });
    }
  }

  buildFlowGraph(connections) {
    const graph = new Map();
    
    // Initialize graph with all nodes
    this.nodes.forEach((node, id) => {
      graph.set(id, {
        node,
        inputs: [],
        outputs: []
      });
    });
    
    // Add connections
    connections.forEach(conn => {
      const sourceId = conn.source.id;
      const targetId = conn.target.id;
      
      graph.get(sourceId).outputs.push(targetId);
      graph.get(targetId).inputs.push(sourceId);
    });
    
    return graph;
  }

  clearCanvas() {
    this.jsPlumb.reset();
    document.getElementById('canvas').innerHTML = '';
    this.nodes.clear();
  }

  autoLayout() {
    const nodes = Array.from(this.nodes.values());
    const levelMap = new Map();
    
    // Calculate node levels
    nodes.forEach(node => {
      const level = this.calculateNodeLevel(node);
      if (!levelMap.has(level)) {
        levelMap.set(level, []);
      }
      levelMap.get(level).push(node);
    });

    // Position nodes by level
    const levels = Array.from(levelMap.keys()).sort((a, b) => a - b);
    const spacing = {
      x: 300,
      y: 150
    };

    levels.forEach((level, levelIndex) => {
      const nodesInLevel = levelMap.get(level);
      nodesInLevel.forEach((node, nodeIndex) => {
        const x = 100 + (level * spacing.x);
        const y = 100 + (nodeIndex * spacing.y);
        
        node.element.style.left = `${x}px`;
        node.element.style.top = `${y}px`;
      });
    });

    this.jsPlumb.repaintEverything();
  }

  calculateNodeLevel(node) {
    const connections = this.jsPlumb.getAllConnections();
    let level = 0;
    
    const findInputs = (nodeId) => {
      return connections.filter(conn => conn.target.id === nodeId);
    };

    let currentNode = node;
    while (findInputs(currentNode.element.id).length > 0) {
      level++;
      currentNode = this.nodes.get(findInputs(currentNode.element.id)[0].source.id);
    }
    
    return level;
  }

  straightenConnections() {
    const canvas = document.getElementById('canvas');
    const rect = canvas.getBoundingClientRect();
    
    this.jsPlumb.getAllConnections().forEach(conn => {
      const sourcePos = conn.source.getBoundingClientRect();
      const targetPos = conn.target.getBoundingClientRect();
      
      // Align vertically if possible by adjusting target position
      if (Math.abs(sourcePos.top - targetPos.top) < 100) {
        const newTop = sourcePos.top - rect.top + canvas.scrollTop;
        conn.target.style.top = `${newTop}px`;
      }
    });
    
    this.jsPlumb.repaintEverything();
  }

  loadDefaultWorkflow() {
    // Create nodes
    const systemPromptNode = this.nodeFactory.createNode('system-prompt');
    systemPromptNode.element.style.left = '100px';
    systemPromptNode.element.style.top = '150px';
    document.getElementById('canvas').appendChild(systemPromptNode.element);
    this.nodes.set(systemPromptNode.id, systemPromptNode);

    const userPromptNode = this.nodeFactory.createNode('user-prompt');
    userPromptNode.element.style.left = '400px';
    userPromptNode.element.style.top = '150px';
    userPromptNode.element.querySelector('textarea').value = 'Write a story about a magical coding adventure';
    document.getElementById('canvas').appendChild(userPromptNode.element);
    this.nodes.set(userPromptNode.id, userPromptNode);

    const modelNode = this.nodeFactory.createNode('model-select');
    modelNode.element.style.left = '700px';
    modelNode.element.style.top = '150px';
    document.getElementById('canvas').appendChild(modelNode.element);
    this.nodes.set(modelNode.id, modelNode);

    const styleNode = this.nodeFactory.createNode('style');
    styleNode.element.style.left = '1000px';
    styleNode.element.style.top = '150px';
    document.getElementById('canvas').appendChild(styleNode.element);
    this.nodes.set(styleNode.id, styleNode);

    const outputNode = this.nodeFactory.createNode('output');
    outputNode.element.style.left = '1300px';
    outputNode.element.style.top = '150px';
    document.getElementById('canvas').appendChild(outputNode.element);
    this.nodes.set(outputNode.id, outputNode);

    // Make nodes draggable and add endpoints
    [systemPromptNode, userPromptNode, modelNode, styleNode, outputNode].forEach(node => {
      this.jsPlumb.draggable(node.element, {
        grid: [10, 10]
      });
      
      if (node.inputs) {
        node.inputs.forEach(() => {
          this.jsPlumb.addEndpoint(node.element, {
            anchor: 'Left',
            isTarget: true,
            endpoint: 'Dot',
            maxConnections: -1
          });
        });
      }
      
      if (node.outputs) {
        node.outputs.forEach(() => {
          this.jsPlumb.addEndpoint(node.element, {
            anchor: 'Right',
            isSource: true,
            endpoint: 'Dot',
            maxConnections: -1
          });
        });
      }
    });

    // Connect nodes
    setTimeout(() => {
      this.jsPlumb.connect({
        source: systemPromptNode.element,
        target: userPromptNode.element
      });
      this.jsPlumb.connect({
        source: userPromptNode.element,
        target: modelNode.element
      });
      this.jsPlumb.connect({
        source: modelNode.element,
        target: styleNode.element
      });
      this.jsPlumb.connect({
        source: styleNode.element,
        target: outputNode.element
      });
    }, 100);

    // Auto layout after a delay
    setTimeout(() => this.autoLayout(), 200);
  }

  exportWorkflow() {
    const workflow = {
      nodes: Array.from(this.nodes.entries()).map(([id, node]) => ({
        id,
        type: node.type,
        position: {
          x: parseInt(node.element.style.left),
          y: parseInt(node.element.style.top)
        },
        data: {
          // Save node-specific data like textarea values
          text: node.element.querySelector('textarea')?.value,
          select: node.element.querySelector('select')?.value
        }
      })),
      connections: this.jsPlumb.getAllConnections().map(conn => ({
        source: conn.source.id,
        target: conn.target.id
      }))
    };

    const blob = new Blob([JSON.stringify(workflow, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workflow.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  async importWorkflow(file) {
    try {
      const text = await file.text();
      const workflow = JSON.parse(text);
      
      // Clear existing workflow
      this.clearCanvas();
      
      // Create nodes
      workflow.nodes.forEach(nodeData => {
        const node = this.nodeFactory.createNode(nodeData.type);
        node.element.style.left = `${nodeData.position.x}px`;
        node.element.style.top = `${nodeData.position.y}px`;
        
        // Restore node data
        if (nodeData.data.text) {
          node.element.querySelector('textarea').value = nodeData.data.text;
        }
        if (nodeData.data.select) {
          node.element.querySelector('select').value = nodeData.data.select;
        }
        
        document.getElementById('canvas').appendChild(node.element);
        this.nodes.set(nodeData.id, node);
        
        // Make node draggable and add endpoints
        this.jsPlumb.draggable(node.element, {
          grid: [10, 10]
        });
        
        if (node.inputs) {
          node.inputs.forEach(() => {
            this.jsPlumb.addEndpoint(node.element, {
              anchor: 'Left',
              isTarget: true,
              endpoint: 'Dot',
              maxConnections: -1
            });
          });
        }
        
        if (node.outputs) {
          node.outputs.forEach(() => {
            this.jsPlumb.addEndpoint(node.element, {
              anchor: 'Right',
              isSource: true,
              endpoint: 'Dot',
              maxConnections: -1
            });
          });
        }
      });
      
      // Restore connections
      workflow.connections.forEach(conn => {
        setTimeout(() => {
          this.jsPlumb.connect({
            source: this.nodes.get(conn.source).element,
            target: this.nodes.get(conn.target).element
          });
        }, 100);
      });

    } catch (error) {
      console.error('Error importing workflow:', error);
      alert('Error importing workflow: ' + error.message);
    }
  }
}

// Initialize app
window.addEventListener('load', () => {
  window.app = new TextyUI();
});