export class WindowManager {
  constructor() {
    this.windows = new Map();
    this.activeWindow = null;
    this.zIndex = 1000;
    
    document.addEventListener('mousedown', this.handleGlobalClick.bind(this));
  }

  createWindow(options = {}) {
    const {
      title = 'Window',
      type = 'terminal',
      x = 50,
      y = 50,
      width = 600,
      height = 400
    } = options;

    const windowId = `window-${Date.now()}`;
    const windowEl = document.createElement('div');
    windowEl.className = `window ${type}-window`;
    windowEl.id = windowId;
    windowEl.style.left = `${x}px`;
    windowEl.style.top = `${y}px`;
    windowEl.style.width = `${width}px`;
    windowEl.style.height = `${height}px`;

    windowEl.innerHTML = `
      <div class="window-titlebar">
        <div class="window-title">${title}</div>
        <div class="window-controls">
          <button class="window-button minimize"></button>
          <button class="window-button maximize"></button>
          <button class="window-button close"></button>
        </div>
      </div>
      <div class="window-content"></div>
    `;

    document.querySelector('.desktop-shell:not(.hidden)').appendChild(windowEl);

    this.setupWindowControls(windowEl);
    this.makeDraggable(windowEl);
    this.windows.set(windowId, { element: windowEl, type, title });
    this.activateWindow(windowId);
    this.updateTaskbar();

    return windowId;
  }

  setupWindowControls(windowEl) {
    const minimize = windowEl.querySelector('.minimize');
    const maximize = windowEl.querySelector('.maximize');
    const close = windowEl.querySelector('.close');

    minimize.onclick = () => this.minimizeWindow(windowEl.id);
    maximize.onclick = () => this.maximizeWindow(windowEl.id);
    close.onclick = () => this.closeWindow(windowEl.id);
  }

  makeDraggable(windowEl) {
    const titlebar = windowEl.querySelector('.window-titlebar');
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;

    titlebar.onmousedown = (e) => {
      if (e.target.classList.contains('window-button')) return;
      
      isDragging = true;
      windowEl.style.transition = 'none';
      
      initialX = e.clientX - windowEl.offsetLeft;
      initialY = e.clientY - windowEl.offsetTop;
      
      this.activateWindow(windowEl.id);
    };

    document.onmousemove = (e) => {
      if (!isDragging) return;

      e.preventDefault();
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;
      
      windowEl.style.left = `${currentX}px`;
      windowEl.style.top = `${currentY}px`;
    };

    document.onmouseup = () => {
      isDragging = false;
      windowEl.style.transition = '';
    };
  }

  minimizeWindow(windowId) {
    const window = this.windows.get(windowId);
    if (!window) return;
    
    window.element.classList.toggle('minimized');
    this.updateTaskbar();
  }

  maximizeWindow(windowId) {
    const window = this.windows.get(windowId);
    if (!window) return;
    
    window.element.classList.toggle('maximized');
  }

  closeWindow(windowId) {
    const window = this.windows.get(windowId);
    if (!window) return;
    
    window.element.remove();
    this.windows.delete(windowId);
    this.updateTaskbar();
  }

  activateWindow(windowId) {
    this.windows.forEach((window, id) => {
      window.element.style.zIndex = id === windowId ? ++this.zIndex : window.element.style.zIndex;
    });
    this.activeWindow = windowId;
  }

  handleGlobalClick(e) {
    const windowEl = e.target.closest('.window');
    if (windowEl) {
      this.activateWindow(windowEl.id);
    }
  }

  updateTaskbar() {
    const taskbar = document.querySelector('.task-bar');
    if (!taskbar) return;

    taskbar.innerHTML = '';
    this.windows.forEach((window, id) => {
      const item = document.createElement('div');
      item.className = 'taskbar-item';
      item.textContent = window.title;
      item.onclick = () => {
        if (window.element.classList.contains('minimized')) {
          window.element.classList.remove('minimized');
        }
        this.activateWindow(id);
      };
      taskbar.appendChild(item);
    });
  }
}