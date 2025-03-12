import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { HexEditor } from './hex-editor.js';
import { NetworkViewer } from './network-viewer.js';

document.addEventListener('DOMContentLoaded', () => {
  // Window Management
  const addWindowMenu = document.getElementById('add-window-menu');
  const desktop = document.querySelector('.desktop');
  let zIndexCounter = 10; // Initialize a counter for z-index

  // Function to make windows draggable
  function dragElement(elmnt) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    const header = elmnt.querySelector('.window-header');

    function dragMouseDown(e) {
      e = e || window.event;
      e.preventDefault();
      // Get the mouse cursor position at startup:
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      // Call a function whenever the cursor moves:
      document.onmousemove = elementDrag;

      // Bring the window to the front
      elmnt.style.zIndex = ++zIndexCounter;
    }

    function elementDrag(e) {
      e = e || window.event;
      e.preventDefault();
      // Calculate the new cursor position:
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      // Set the element's new position:
      elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
      elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
      // Stop moving when mouse button is released:
      document.onmouseup = null;
      document.onmousemove = null;
    }

    if (header) {
      header.onmousedown = dragMouseDown;
    } else {
      elmnt.onmousedown = dragMouseDown;
    }
  }

  // Function to handle window controls (minimize, maximize, close)
  function setupWindowControls(windowElement) {
    const minimizeButton = windowElement.querySelector('.minimize');
    const maximizeButton = windowElement.querySelector('.maximize');
    const closeButton = windowElement.querySelector('.close');

    minimizeButton.addEventListener('click', () => {
      windowElement.style.display = 'none';
    });

    maximizeButton.addEventListener('click', () => {
      if (windowElement.style.width === '100%') {
        // Restore original size and position
        windowElement.style.width = windowElement.dataset.originalWidth || '600px';
        windowElement.style.height = windowElement.dataset.originalHeight || '400px';
        windowElement.style.top = windowElement.dataset.originalTop || '50px';
        windowElement.style.left = windowElement.dataset.originalLeft || '50px';
        windowElement.style.zIndex = 'auto';
        windowElement.style.overflow = 'auto'; // Restore scrollbars

      } else {
        // Maximize the window
        // Store original size and position
        windowElement.dataset.originalWidth = windowElement.style.width;
        windowElement.dataset.originalHeight = windowElement.style.height;
        windowElement.dataset.originalTop = windowElement.style.top;
        windowElement.dataset.originalLeft = windowElement.style.left;

        windowElement.style.width = '100%';
        windowElement.style.height = '100%';
        windowElement.style.top = '0';
        windowElement.style.left = '0';
        windowElement.style.zIndex = ++zIndexCounter;
        windowElement.style.overflow = 'auto'; // Hide scrollbars
      }
    });

    closeButton.addEventListener('click', () => {
      windowElement.remove();
    });
  }

  // Add new window functionality
  addWindowMenu.addEventListener('click', (event) => {
    if (event.target.tagName === 'BUTTON') {
      const windowType = event.target.dataset.windowType;
      createNewWindow(windowType);
    }
  });

  function createNewWindow(windowType) {
    let windowContent = '';
    let windowHeader = '';

    switch (windowType) {
      case 'hex-editor':
        windowHeader = 'Hex Editor';
        windowContent = '<div id="hex-editor-container"></div>';
        break;
      case 'code-editor':
        windowHeader = 'Code Editor';
        windowContent = '<textarea id="code-editor"></textarea>';
        break;
      case 'terminal':
        windowHeader = 'Advanced Terminal';
        windowContent = '<div id="terminal"></div>';
        break;
      case 'network-viewer':
        windowHeader = 'Network Package Viewer';
        windowContent = '<div id="network-viewer-container"></div>';
        break;
      case 'http-analyzer':
        windowHeader = 'HTTP Analyzer';
        windowContent = `
          <div class="panel">
            <h3>Request</h3>
            <textarea id="http-request"></textarea>
          </div>
          <div class="panel">
            <h3>Response</h3>
            <textarea id="http-response"></textarea>
          </div>
        `;
        break;
    }

    const newWindow = document.createElement('div');
    newWindow.classList.add('window');
    newWindow.dataset.windowType = windowType;
    newWindow.style.top = '100px'; // Randomize initial position
    newWindow.style.left = '100px'; // Randomize initial position
    newWindow.style.zIndex = ++zIndexCounter; // Set z-index to bring to front
    newWindow.innerHTML = `
      <div class="window-header">
        ${windowHeader}
        <div class="window-controls">
          <span class="minimize"><i class="fas fa-window-minimize"></i></span>
          <span class="maximize"><i class="fas fa-window-maximize"></i></span>
          <span class="close"><i class="fas fa-times"></i></span>
        </div>
      </div>
      <div class="window-content">
        ${windowContent}
      </div>
    `;

    desktop.appendChild(newWindow);
    dragElement(newWindow);
    setupWindowControls(newWindow);

    // Initialize terminal if it's a terminal window
    if (windowType === 'terminal') {
      initializeTerminal(newWindow.querySelector('#terminal'));
    }

    if (windowType === 'hex-editor') {
      const hexEditorContainer = newWindow.querySelector('#hex-editor-container');
      const hexEditor = new HexEditor(hexEditorContainer);
      hexEditor.initialize(); // Call initialize method

    }

    if (windowType === 'network-viewer') {
      const networkViewerContainer = newWindow.querySelector('#network-viewer-container');
      const networkViewer = new NetworkViewer(networkViewerContainer);
      networkViewer.initialize(); // Call initialize method
    }
  }

  function initializeTerminal(terminalContainer) {
    const term = new Terminal();
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalContainer);
    fitAddon.fit();

    term.write('Welcome to the terminal!\r\n');
    term.write('>');

    // You can implement command handling and more here
  }

  // Initialize existing windows
  const existingWindows = document.querySelectorAll('.window');
  existingWindows.forEach(windowElement => {
    dragElement(windowElement);
    setupWindowControls(windowElement);

    if (windowElement.dataset.windowType === 'terminal') {
      initializeTerminal(windowElement.querySelector('#terminal'));
    }
    if (windowElement.dataset.windowType === 'hex-editor') {
      const hexEditorContainer = windowElement.querySelector('#hex-editor-container');
      const hexEditor = new HexEditor(hexEditorContainer);
      hexEditor.initialize();
    }

    if (windowElement.dataset.windowType === 'network-viewer') {
      const networkViewerContainer = windowElement.querySelector('#network-viewer-container');
      const networkViewer = new NetworkViewer(networkViewerContainer);
      networkViewer.initialize();
    }
  });
});