class NeoSyncOS {
  constructor() {
    // Feature detection
    this.checkBrowserCompatibility();

    // Performance and progressive enhancement
    requestAnimationFrame(() => {
      this.initializeCoreFeatures();
    });
  }

  checkBrowserCompatibility() {
    const incompatibleFeatures = [];

    if (!('requestAnimationFrame' in window)) incompatibleFeatures.push('Animations');
    if (!('fetch' in window)) incompatibleFeatures.push('Network Requests');
    if (!('WebSocket' in window)) incompatibleFeatures.push('Real-time Communication');

    if (incompatibleFeatures.length > 0) {
      this.showCompatibilityWarning(incompatibleFeatures);
    }
  }

  showCompatibilityWarning(missingFeatures) {
    const warningElement = document.createElement('div');
    warningElement.style.position = 'fixed';
    warningElement.style.top = '0';
    warningElement.style.left = '0';
    warningElement.style.width = '100%';
    warningElement.style.backgroundColor = 'var(--accent-highlight)';
    warningElement.style.color = 'var(--bg-primary)';
    warningElement.style.padding = '10px';
    warningElement.style.textAlign = 'center';
    warningElement.style.zIndex = '9999';

    warningElement.innerHTML = `
      <strong>Browser Compatibility Warning:</strong> 
      Your browser is missing support for: ${missingFeatures.join(', ')}. 
      Please update to the latest version for the best experience.
    `;

    document.body.appendChild(warningElement);
  }

  initializeCoreFeatures() {
    try {
      // Sequence critical initializations
      this.initClock();
      this.initStartMenu();
      this.initBatteryStatus();
      this.setUserBackground();
      this.createMatrixBackground();
      
      // Progressive, non-blocking initializations
      Promise.allSettled([
        this.updateUserInfo(),
        this.loadUserProjects(),
        this.loadProfileSettings()
      ]).then(() => {
        // Additional features after core load
        this.initExtraFeatures();
        this.removeLoadingScreen();
      }).catch(this.handleErrorGracefully);

    } catch (error) {
      this.handleErrorGracefully(error);
    }
  }

  removeLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.style.opacity = '0';
      setTimeout(() => loadingScreen.remove(), 500);
    }
  }

  createWindowTemplate(title, content, options = {}) {
    this.windowCounter++;
    const windowId = `window-${this.windowCounter}`;
    
    const windowElement = document.createElement('div');
    windowElement.id = windowId;
    windowElement.classList.add('app-window', 'pop-up');
    
    // More dynamic initial positioning with subtle rotation
    const randomX = Math.random() * (window.innerWidth - 400);
    const randomY = Math.random() * (window.innerHeight - 300);
    const randomRotation = (Math.random() * 10 - 5); // Random rotation between -5 and 5 degrees
    
    windowElement.style.left = `${randomX}px`;
    windowElement.style.top = `${randomY}px`;
    windowElement.style.transform = `rotate(${randomRotation}deg)`;

    windowElement.innerHTML = `
      <div class="window-header">
        <span>${title}</span>
        <div class="window-controls">
          <button class="minimize-btn">-</button>
          <button class="maximize-btn">□</button>
          <button class="close-btn">×</button>
        </div>
      </div>
      <div class="window-content">
        ${content}
      </div>
    `;

    // Add window controls functionality
    const closeBtn = windowElement.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
      this.animateWindowClose(windowElement);
    });

    const minimizeBtn = windowElement.querySelector('.minimize-btn');
    minimizeBtn.addEventListener('click', () => {
      windowElement.classList.toggle('minimized');
    });

    const maximizeBtn = windowElement.querySelector('.maximize-btn');
    maximizeBtn.addEventListener('click', () => {
      windowElement.classList.toggle('maximized');
    });

    // Make window draggable
    this.makeDraggable(windowElement);

    return windowElement;
  }

  animateWindowClose(windowElement) {
    windowElement.classList.add('closing');
    windowElement.addEventListener('animationend', () => {
      windowElement.remove();
    }, { once: true });
  }

  initClock() {
    const clockElement = document.getElementById('clock');
    setInterval(() => {
      const now = new Date();
      clockElement.textContent = now.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }, 1000);
  }

  initStartMenu() {
    const startMenuBtn = document.getElementById('start-menu-btn');
    const startMenu = document.getElementById('start-menu');

    startMenuBtn.addEventListener('click', () => {
      startMenu.classList.toggle('hidden');
    });

    // Close start menu when clicking outside
    document.addEventListener('click', (event) => {
      if (!startMenuBtn.contains(event.target) && !startMenu.contains(event.target)) {
        startMenu.classList.add('hidden');
      }
    });

    // App launch handling
    const appIcons = document.querySelectorAll('.app-icon');
    appIcons.forEach(icon => {
      icon.addEventListener('click', () => {
        const app = icon.dataset.app;
        this.launchApp(app);
      });
    });
  }

  initBatteryStatus() {
    if ('getBattery' in navigator) {
      navigator.getBattery().then(battery => {
        const batteryIcon = document.querySelector('.battery');
        const percentage = Math.round(battery.level * 100);
        batteryIcon.querySelector('.battery-percentage').textContent = `${percentage}%`;
      });
    }
  }

  async updateUserInfo() {
    try {
      const user = await window.websim.getUser();
      if (user && user.username) {
        const usernameElement = document.getElementById('username');
        usernameElement.textContent = `@${user.username}`;

        // Update user logo
        const userLogoElement = document.getElementById('user-logo');
        userLogoElement.src = `https://images.websim.ai/avatar/${user.username}`;
      }
    } catch (error) {
      console.error('Failed to fetch username:', error);
    }
  }

  launchApp(app) {
    const desktopArea = document.getElementById('desktop-area');
    
    switch(app) {
      case 'terminal':
        const terminalContent = `
          <pre class="terminal-output">NeoSync OS Terminal v1.0
Type 'help' for available commands.</pre>
          <div class="terminal-input-area">
            <span class="prompt">$</span>
            <input type="text" class="terminal-input" autocomplete="off">
          </div>
        `;
        const terminalWindow = this.createWindowTemplate('Terminal', terminalContent);
        
        // Handle terminal input
        const terminalInput = terminalWindow.querySelector('.terminal-input');
        const terminalOutput = terminalWindow.querySelector('.terminal-output');
        
        terminalInput.addEventListener('keypress', (event) => {
          if (event.key === 'Enter') {
            const command = terminalInput.value.trim();
            this.processTerminalCommand(command, terminalOutput);
            terminalInput.value = '';
          }
        });

        desktopArea.appendChild(terminalWindow);
        break;

      case 'files':
        const filesContent = `
          <div class="files-explorer">
            <ul>
              <li>📁 Documents</li>
              <li>📁 Downloads</li>
              <li>📁 Pictures</li>
            </ul>
          </div>
        `;
        const filesWindow = this.createWindowTemplate('File Explorer', filesContent);
        desktopArea.appendChild(filesWindow);
        break;

      case 'settings':
        const settingsContent = `
          <div class="settings-container">
            <div class="settings-sidebar">
              <button class="settings-tab active" data-tab="system">System</button>
              <button class="settings-tab" data-tab="appearance">Appearance</button>
              <button class="settings-tab" data-tab="notifications">Notifications</button>
              <button class="settings-tab" data-tab="privacy">Privacy</button>
              <button class="settings-tab" data-tab="network">Network</button>
            </div>
            <div class="settings-content">
              <div class="settings-section active" id="system-settings">
                <h3>System Settings</h3>
                <div class="setting">
                  <label>Language</label>
                  <select>
                    <option>English (US)</option>
                    <option>Spanish</option>
                    <option>French</option>
                    <option>German</option>
                  </select>
                </div>
                <div class="setting">
                  <label>Timezone</label>
                  <select>
                    <option>UTC</option>
                    <option>Pacific Time (PST)</option>
                    <option>Eastern Time (EST)</option>
                    <option>Greenwich Mean Time (GMT)</option>
                  </select>
                </div>
                <div class="setting">
                  <label>Power Management</label>
                  <div class="toggle-switch">
                    <input type="checkbox" id="power-saving-mode">
                    <label for="power-saving-mode">Power Saving Mode</label>
                  </div>
                </div>
              </div>

              <div class="settings-section" id="appearance-settings">
                <h3>Appearance</h3>
                <div class="setting">
                  <label>Theme</label>
                  <div class="theme-selector">
                    <button class="theme-option" data-theme="dark">Dark</button>
                    <button class="theme-option" data-theme="light">Light</button>
                    <button class="theme-option" data-theme="cyberpunk">Cyberpunk</button>
                  </div>
                </div>
                <div class="setting">
                  <label>Background</label>
                  <div class="background-selector">
                    <div class="bg-option" data-bg="gradient">Gradient</div>
                    <div class="bg-option" data-bg="blur">Blur Effect</div>
                    <div class="bg-option" data-bg="solid">Solid Color</div>
                  </div>
                </div>
                <div class="setting">
                  <label>Desktop Transparency</label>
                  <input type="range" min="0" max="100" value="70" class="transparency-slider">
                </div>
              </div>

              <div class="settings-section" id="notifications-settings">
                <h3>Notifications</h3>
                <div class="setting">
                  <label>Notification Center</label>
                  <div class="toggle-switch">
                    <input type="checkbox" id="notifications-enabled" checked>
                    <label for="notifications-enabled">Enable Notifications</label>
                  </div>
                </div>
                <div class="setting">
                  <label>Sound Notifications</label>
                  <div class="toggle-switch">
                    <input type="checkbox" id="sound-notifications" checked>
                    <label for="sound-notifications">Play Sound</label>
                  </div>
                </div>
                <div class="setting">
                  <label>Notification Volume</label>
                  <input type="range" min="0" max="100" value="50" class="volume-slider">
                </div>
              </div>

              <div class="settings-section" id="privacy-settings">
                <h3>Privacy</h3>
                <div class="setting">
                  <label>Data Collection</label>
                  <div class="toggle-switch">
                    <input type="checkbox" id="data-collection">
                    <label for="data-collection">Allow Anonymous Usage Data</label>
                  </div>
                </div>
                <div class="setting">
                  <label>Location Services</label>
                  <div class="toggle-switch">
                    <input type="checkbox" id="location-services">
                    <label for="location-services">Enable Location</label>
                  </div>
                </div>
                <div class="setting">
                  <button class="privacy-action">Clear Browsing Data</button>
                  <button class="privacy-action">Manage Permissions</button>
                </div>
              </div>

              <div class="settings-section" id="network-settings">
                <h3>Network</h3>
                <div class="setting">
                  <label>Connection Type</label>
                  <select>
                    <option>Ethernet</option>
                    <option>Wi-Fi</option>
                    <option>Mobile Data</option>
                  </select>
                </div>
                <div class="setting">
                  <label>Wi-Fi Networks</label>
                  <div class="wifi-list">
                    <div class="wifi-network">
                      <span>Network 1</span>
                      <button>Connect</button>
                    </div>
                    <div class="wifi-network">
                      <span>Network 2</span>
                      <button>Connect</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
        const settingsWindow = this.createWindowTemplate('System Settings', settingsContent);
        
        // Add settings tab switching functionality
        const settingsTabs = settingsWindow.querySelectorAll('.settings-tab');
        const settingsSections = settingsWindow.querySelectorAll('.settings-section');
        
        settingsTabs.forEach(tab => {
          tab.addEventListener('click', () => {
            const tabId = tab.dataset.tab;
            
            // Remove active class from all tabs and sections
            settingsTabs.forEach(t => t.classList.remove('active'));
            settingsSections.forEach(s => s.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding section
            tab.classList.add('active');
            settingsWindow.querySelector(`#${tabId}-settings`).classList.add('active');
          });
        });

        // Theme selector
        const themeOptions = settingsWindow.querySelectorAll('.theme-option');
        themeOptions.forEach(option => {
          option.addEventListener('click', () => {
            const theme = option.dataset.theme;
            this.applyTheme(theme);
          });
        });

        // Transparency slider
        const transparencySlider = settingsWindow.querySelector('.transparency-slider');
        transparencySlider.addEventListener('input', () => {
          const transparency = transparencySlider.value;
          document.getElementById('desktop').style.opacity = transparency / 100;
        });

        desktopArea.appendChild(settingsWindow);
        break;

      case 'browser':
        const browserContent = `
          <div class="browser-container">
            <div class="browser-toolbar">
              <button class="browser-back">←</button>
              <button class="browser-forward">→</button>
              <button class="browser-refresh">↻</button>
              <input type="text" class="browser-address" placeholder="Enter URL or search term">
              <button class="browser-go">Go</button>
            </div>
            <div class="browser-frame-container">
              <iframe class="browser-frame" src="" frameborder="0" sandbox="allow-scripts allow-same-origin allow-forms"></iframe>
              <div class="browser-error-overlay" style="display:none;">
                <h3>🚫 Unable to Load Page</h3>
                <p>Cross-origin restrictions or network issues prevent loading this site.</p>
              </div>
            </div>
          </div>
        `;
        const browserWindow = this.createWindowTemplate('NeoSync Browser', browserContent);
        
        // Browser functionality
        const addressInput = browserWindow.querySelector('.browser-address');
        const browserFrame = browserWindow.querySelector('.browser-frame');
        const errorOverlay = browserWindow.querySelector('.browser-error-overlay');
        const goButton = browserWindow.querySelector('.browser-go');
        const backButton = browserWindow.querySelector('.browser-back');
        const forwardButton = browserWindow.querySelector('.browser-forward');
        const refreshButton = browserWindow.querySelector('.browser-refresh');

        // Enhanced navigation handling
        function safeNavigate(url) {
          try {
            // Validate and sanitize URL
            const parsedUrl = new URL(url);
            
            // Only allow http and https
            if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
              throw new Error('Invalid protocol');
            }

            browserFrame.src = url;
            addressInput.value = url;
            errorOverlay.style.display = 'none';
          } catch (error) {
            console.error('Navigation error:', error);
            
            // If invalid URL, try searching
            const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(url)}`;
            browserFrame.src = searchUrl;
            addressInput.value = searchUrl;
          }
        }

        // Handle iframe load errors
        browserFrame.addEventListener('error', (event) => {
          console.error('Iframe load error:', event);
          errorOverlay.style.display = 'block';
        });

        // Open user's Websim profile by default
        const openUserProfile = async () => {
          try {
            const user = await window.websim.getUser();
            if (user && user.username) {
              const profileUrl = `https://websim.ai/@${user.username}`;
              safeNavigate(profileUrl);
            } else {
              safeNavigate('https://websim.ai');
            }
          } catch (error) {
            console.error('Failed to fetch user profile:', error);
            safeNavigate('https://websim.ai');
          }
        };

        // Initial profile load
        openUserProfile();

        goButton.addEventListener('click', () => {
          safeNavigate(addressInput.value);
        });

        addressInput.addEventListener('keypress', (event) => {
          if (event.key === 'Enter') {
            safeNavigate(addressInput.value);
          }
        });

        // Browser navigation buttons with error handling
        backButton.addEventListener('click', () => {
          try {
            browserFrame.contentWindow.history.back();
          } catch (error) {
            console.warn('Cannot access frame history:', error);
          }
        });

        forwardButton.addEventListener('click', () => {
          try {
            browserFrame.contentWindow.history.forward();
          } catch (error) {
            console.warn('Cannot access frame history:', error);
          }
        });

        refreshButton.addEventListener('click', () => {
          browserFrame.contentWindow.location.reload();
        });

        // Update address bar when possible
        browserFrame.addEventListener('load', () => {
          try {
            addressInput.value = browserFrame.contentWindow.location.href;
          } catch (error) {
            console.warn('Cannot read frame location:', error);
          }
        });

        desktopArea.appendChild(browserWindow);
        break;

      case 'app-store':
        const appStoreContent = `
          <div class="app-store-container">
            <div class="app-store-header">
              <h2>NeoSync App Store</h2>
              <input type="text" placeholder="Search apps..." class="app-store-search">
            </div>
            <div class="app-store-categories">
              <button class="category-btn active" data-category="productivity">Productivity</button>
              <button class="category-btn" data-category="utilities">Utilities</button>
              <button class="category-btn" data-category="entertainment">Entertainment</button>
            </div>
            <div class="app-store-grid"></div>
          </div>
        `;
        const appStoreWindow = this.createWindowTemplate('NeoSync App Store', appStoreContent);
        
        // Category switching
        const categoryButtons = appStoreWindow.querySelectorAll('.category-btn');
        categoryButtons.forEach(btn => {
          btn.addEventListener('click', () => {
            categoryButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            this.updateAppStoreContent(btn.dataset.category, appStoreWindow);
          });
        });

        // Initial category load
        this.updateAppStoreContent('productivity', appStoreWindow);

        desktopArea.appendChild(appStoreWindow);
        break;

      case 'system-monitor':
        const systemMonitorContent = `
          <div class="system-monitor">
            <div class="monitor-section">
              <h3>System Resources</h3>
              <div class="resource-bar">
                <label>CPU</label>
                <div class="progress-bar">
                  <div class="progress" id="cpu-usage"></div>
                </div>
              </div>
              <div class="resource-bar">
                <label>Memory</label>
                <div class="progress-bar">
                  <div class="progress" id="memory-usage"></div>
                </div>
              </div>
              <div class="resource-bar">
                <label>Disk</label>
                <div class="progress-bar">
                  <div class="progress" id="disk-usage"></div>
                </div>
              </div>
            </div>
            <div class="running-processes">
              <h3>Running Processes</h3>
              <table id="processes-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>PID</th>
                    <th>CPU</th>
                    <th>Memory</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody id="processes-list">
                  <!-- Dynamically populated -->
                </tbody>
              </table>
            </div>
          </div>
        `;
        const systemMonitorWindow = this.createWindowTemplate('System Monitor', systemMonitorContent);
        desktopArea.appendChild(systemMonitorWindow);
        this.initSystemMonitor();
        break;

      case 'games':
        const gamesContent = `
          <div class="games-container">
            <div class="games-grid">
              <div class="game-card" data-game="snake">
                <h3>Snake</h3>
                <div id="snake-game" class="game-canvas"></div>
              </div>
              <div class="game-card" data-game="tetris">
                <h3>Tetris</h3>
                <div id="tetris-game" class="game-canvas"></div>
              </div>
              <div class="game-card" data-game="pong">
                <h3>Pong</h3>
                <div id="pong-game" class="game-canvas"></div>
              </div>
            </div>
          </div>
        `;
        const gamesWindow = this.createWindowTemplate('NeoSync Games', gamesContent);
        desktopArea.appendChild(gamesWindow);

        // Initialize games
        this.initSnakeGame();
        this.initTetrisGame();
        this.initPongGame();
        break;

      case 'calculator':
        const calculatorContent = `
          <div id="calculator-app" class="calculator-window"></div>
        `;
        const calculatorWindow = this.createWindowTemplate('NeoSync Calculator', calculatorContent);
        desktopArea.appendChild(calculatorWindow);
        this.initCalculator();
        break;
    }
  }

  initSystemMonitor() {
    // Simulate system resource monitoring
    const cpuUsage = document.getElementById('cpu-usage');
    const memoryUsage = document.getElementById('memory-usage');
    const diskUsage = document.getElementById('disk-usage');
    const processesList = document.getElementById('processes-list');

    function updateResourceBars() {
      const randomCpu = Math.random() * 100;
      const randomMemory = Math.random() * 100;
      const randomDisk = Math.random() * 100;

      cpuUsage.style.width = `${randomCpu}%`;
      cpuUsage.textContent = `${randomCpu.toFixed(1)}%`;
      memoryUsage.style.width = `${randomMemory}%`;
      memoryUsage.textContent = `${randomMemory.toFixed(1)}%`;
      diskUsage.style.width = `${randomDisk}%`;
      diskUsage.textContent = `${randomDisk.toFixed(1)}%`;

      // Simulate running processes
      processesList.innerHTML = '';
      for (let i = 0; i < 5; i++) {
        const processRow = document.createElement('tr');
        processRow.innerHTML = `
          <td>Process ${i+1}</td>
          <td>${Math.floor(Math.random() * 10000)}</td>
          <td>${(Math.random() * 10).toFixed(1)}%</td>
          <td>${(Math.random() * 500).toFixed(1)} MB</td>
          <td><button class="end-process">End</button></td>
        `;
        processesList.appendChild(processRow);
      }
    }

    // Update every 2 seconds
    updateResourceBars();
    setInterval(updateResourceBars, 2000);
  }

  processTerminalCommand(command, outputElement) {
    let response = '';
    switch(command.toLowerCase()) {
      case 'help':
        response = `Available commands:
- help: Show this help menu
- clear: Clear the terminal
- whoami: Display current user
- version: Show OS version`;
        break;
      case 'clear':
        outputElement.textContent = '';
        return;
      case 'whoami':
        response = `User: ${localStorage.getItem('username') || 'Guest'}`;
        break;
      case 'version':
        response = 'NeoSync OS v1.0';
        break;
      case 'sysinfo':
        response = `
System Information:
- OS: NeoSync OS v1.0
- Kernel: WebSim Core
- Processor: Virtual WebKit
- Memory: Dynamic Allocation
- Storage: Cloud-based
        `;
        break;
      case 'netstat':
        response = `
Network Status:
- Connection: Active
- Protocol: WebSocket
- Latency: ${Math.random() * 100}ms
- Bandwidth: ${(Math.random() * 100).toFixed(2)} Mbps
        `;
        break;
      default:
        response = `Command not found: ${command}`;
    }
    
    outputElement.textContent += `\n$ ${command}\n${response}\n`;
    outputElement.scrollTop = outputElement.scrollHeight;
  }

  initTerminal() {
    // Create terminal window template
    this.terminalTemplate = document.createElement('template');
    this.terminalTemplate.innerHTML = `
      <div class="app-window terminal-window">
        <div class="window-header">
          <span>Terminal</span>
          <div class="window-controls">
            <button class="minimize-btn">-</button>
            <button class="maximize-btn">□</button>
            <button class="close-btn">×</button>
          </div>
        </div>
        <div class="terminal-content">
          <pre class="terminal-output">NeoSync OS Terminal v1.0
Type 'help' for available commands.</pre>
          <div class="terminal-input-area">
            <span class="prompt">$</span>
            <input type="text" class="terminal-input" autocomplete="off">
          </div>
        </div>
      </div>
    `;
  }

  makeDraggable(element) {
    const header = element.querySelector('.window-header');
    
    header.addEventListener('mousedown', startDragging);

    function startDragging(e) {
      e.preventDefault();
      
      const startX = e.clientX - element.offsetLeft;
      const startY = e.clientY - element.offsetTop;

      function dragWindow(e) {
        element.style.left = `${e.clientX - startX}px`;
        element.style.top = `${e.clientY - startY}px`;
      }

      function stopDragging() {
        document.removeEventListener('mousemove', dragWindow);
        document.removeEventListener('mouseup', stopDragging);
      }

      document.addEventListener('mousemove', dragWindow);
      document.addEventListener('mouseup', stopDragging);
    }
  }

  setUserBackground() {
    const userBackground = document.getElementById('user-background');
    const userId = this.getUserId();
    
    if (userId) {
      // Use the user ID as part of the background image URL
      userBackground.style.backgroundImage = `url('https://images.websim.ai/avatar/${this.getUserId()}')`;
    }
  }

  getUserId() {
    // In a real app, this would come from user authentication
    // For this example, we'll use a simple local storage approach
    let userId = localStorage.getItem('userId');
    if (!userId) {
      // Generate a random user ID if not exists
      userId = Math.random().toString(36).substring(2, 15);
      localStorage.setItem('userId', userId);
    }
    return userId;
  }

  async loadUserProjects() {
    try {
      const user = await window.websim.getUser();
      if (user && user.username) {
        const desktopArea = document.getElementById('desktop-area');
        
        // Create projects panel container
        const projectsPanelContainer = document.createElement('div');
        projectsPanelContainer.id = 'projects-panel-container';
        projectsPanelContainer.style.position = 'fixed';
        projectsPanelContainer.style.top = '20px';
        projectsPanelContainer.style.right = '20px';
        projectsPanelContainer.style.width = '300px';
        projectsPanelContainer.style.backgroundColor = 'rgba(17, 34, 64, 0.7)';
        projectsPanelContainer.style.borderRadius = '10px';
        projectsPanelContainer.style.backdropFilter = 'blur(15px)';
        projectsPanelContainer.style.border = '1px solid rgba(100, 255, 218, 0.2)';
        projectsPanelContainer.style.transition = 'all 0.3s ease';
        projectsPanelContainer.style.zIndex = '10';

        // Create panel header with toggle functionality
        const panelHeader = document.createElement('div');
        panelHeader.style.display = 'flex';
        panelHeader.style.justifyContent = 'space-between';
        panelHeader.style.alignItems = 'center';
        panelHeader.style.padding = '10px 15px';
        panelHeader.style.borderBottom = '1px solid rgba(100, 255, 218, 0.2)';
        panelHeader.style.cursor = 'pointer';

        const panelTitle = document.createElement('h3');
        panelTitle.textContent = 'My Projects';
        panelTitle.style.color = 'var(--accent-primary)';
        panelTitle.style.margin = '0';

        const toggleIcon = document.createElement('span');
        toggleIcon.textContent = '▼';
        toggleIcon.style.color = 'var(--accent-primary)';

        panelHeader.appendChild(panelTitle);
        panelHeader.appendChild(toggleIcon);

        // Create projects content area
        const projectsContent = document.createElement('div');
        projectsContent.id = 'projects-content';
        projectsContent.style.padding = '15px';
        projectsContent.style.maxHeight = '300px';
        projectsContent.style.overflowY = 'auto';

        // Fetch user projects
        const projectsResponse = await fetch(`/api/v1/users/${user.username}/projects?posted=true`);
        const projectsData = await projectsResponse.json();

        // Limit to first 3 projects
        const projectsToShow = projectsData.projects.data.slice(0, 3);

        projectsToShow.forEach(({project, project_revision, site}) => {
          const projectElement = this.createProjectCard(project, project_revision, site);
          projectsContent.appendChild(projectElement);
        });

        // Add toggle functionality
        let isExpanded = true;
        panelHeader.addEventListener('click', () => {
          isExpanded = !isExpanded;
          projectsContent.style.display = isExpanded ? 'block' : 'none';
          toggleIcon.textContent = isExpanded ? '▼' : '▶';
          projectsPanelContainer.style.height = isExpanded ? 'auto' : 'fit-content';
        });

        // Assemble panel
        projectsPanelContainer.appendChild(panelHeader);
        projectsPanelContainer.appendChild(projectsContent);

        // Add panel to desktop
        desktopArea.appendChild(projectsPanelContainer);
      }
    } catch (error) {
      console.error('Failed to load user projects:', error);
    }
  }

  createProjectCard(project, projectRevision, site) {
    const projectCard = document.createElement('div');
    projectCard.classList.add('project-card');
    projectCard.style.backgroundColor = 'rgba(17, 34, 64, 0.7)';
    projectCard.style.borderRadius = '10px';
    projectCard.style.padding = '15px';
    projectCard.style.width = '250px';
    projectCard.style.backdropFilter = 'blur(10px)';
    projectCard.style.border = '1px solid rgba(100, 255, 218, 0.2)';
    projectCard.style.cursor = 'pointer';
    projectCard.style.transition = 'all 0.3s ease';

    // Hover effects
    projectCard.addEventListener('mouseenter', () => {
      projectCard.style.transform = 'scale(1.05)';
      projectCard.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.3)';
    });
    projectCard.addEventListener('mouseleave', () => {
      projectCard.style.transform = 'scale(1)';
      projectCard.style.boxShadow = 'none';
    });

    // Open project when clicked
    projectCard.addEventListener('click', () => {
      if (site && site.link_url) {
        window.open(`https://websim.ai${site.link_url}`, '_blank');
      }
    });

    // Project title
    const titleElement = document.createElement('h3');
    titleElement.textContent = project.title || 'Untitled Project';
    titleElement.style.color = 'var(--accent-primary)';
    titleElement.style.marginBottom = '10px';

    // Project description
    const descElement = document.createElement('p');
    descElement.textContent = project.description || 'No description available';
    descElement.style.color = 'var(--text-primary)';
    descElement.style.fontSize = '0.9rem';
    descElement.style.opacity = '0.8';

    // Project stats
    const statsElement = document.createElement('div');
    statsElement.style.display = 'flex';
    statsElement.style.justifyContent = 'space-between';
    statsElement.style.marginTop = '15px';
    statsElement.style.fontSize = '0.8rem';
    statsElement.style.color = 'var(--accent-secondary)';

    const viewsSpan = document.createElement('span');
    viewsSpan.textContent = `👀 ${project.stats.views}`;

    const likesSpan = document.createElement('span');
    likesSpan.textContent = `❤️ ${project.stats.likes}`;

    statsElement.appendChild(viewsSpan);
    statsElement.appendChild(likesSpan);

    // Assemble project card
    projectCard.appendChild(titleElement);
    projectCard.appendChild(descElement);
    projectCard.appendChild(statsElement);

    return projectCard;
  }

  async loadProfileSettings() {
    try {
      const user = await window.websim.getUser();
      if (user && user.username) {
        const desktopArea = document.getElementById('desktop-area');
        
        // Create profile settings panel container
        const profileSettingsContainer = document.createElement('div');
        profileSettingsContainer.id = 'profile-settings-container';
        profileSettingsContainer.style.position = 'fixed';
        profileSettingsContainer.style.top = '20px';
        profileSettingsContainer.style.left = '50%'; // Center horizontally
        profileSettingsContainer.style.transform = 'translateX(-50%)'; // Adjust for true center
        profileSettingsContainer.style.width = '300px';
        profileSettingsContainer.style.backgroundColor = 'rgba(17, 34, 64, 0.7)';
        profileSettingsContainer.style.borderRadius = '10px';
        profileSettingsContainer.style.backdropFilter = 'blur(15px)';
        profileSettingsContainer.style.border = '1px solid rgba(100, 255, 218, 0.2)';
        profileSettingsContainer.style.transition = 'all 0.3s ease';
        profileSettingsContainer.style.zIndex = '10';

        // Create panel header with toggle functionality
        const panelHeader = document.createElement('div');
        panelHeader.style.display = 'flex';
        panelHeader.style.justifyContent = 'space-between';
        panelHeader.style.alignItems = 'center';
        panelHeader.style.padding = '10px 15px';
        panelHeader.style.borderBottom = '1px solid rgba(100, 255, 218, 0.2)';
        panelHeader.style.cursor = 'pointer';

        const panelTitle = document.createElement('h3');
        panelTitle.textContent = 'Profile Settings';
        panelTitle.style.color = 'var(--accent-primary)';
        panelTitle.style.margin = '0';

        const toggleIcon = document.createElement('span');
        toggleIcon.textContent = '▼';
        toggleIcon.style.color = 'var(--accent-primary)';

        panelHeader.appendChild(panelTitle);
        panelHeader.appendChild(toggleIcon);

        // Create profile settings content area
        const profileSettingsContent = document.createElement('div');
        profileSettingsContent.id = 'profile-settings-content';
        profileSettingsContent.style.padding = '15px';
        profileSettingsContent.style.maxHeight = '400px';
        profileSettingsContent.style.overflowY = 'auto';

        // Profile details section
        const profileDetailsSection = document.createElement('div');
        profileDetailsSection.innerHTML = `
          <h4 style="color: var(--accent-primary); margin-bottom: 15px;">User Profile</h4>
          <div style="display: flex; align-items: center; margin-bottom: 15px;">
            <img src="https://images.websim.ai/avatar/${user.username}" 
                 style="width: 80px; height: 80px; border-radius: 50%; margin-right: 15px; 
                        border: 3px solid var(--accent-primary);">
            <div>
              <p style="color: var(--text-primary); font-weight: bold;">@${user.username}</p>
              <p style="color: var(--accent-secondary);">${user.description || 'No description'}</p>
            </div>
          </div>
        `;

        // Social links section
        const socialLinksSection = document.createElement('div');
        socialLinksSection.innerHTML = `
          <h4 style="color: var(--accent-primary); margin-bottom: 15px;">Social Links</h4>
          <div style="display: flex; gap: 15px;">
            ${user.twitter ? `<a href="https://twitter.com/${user.twitter}" 
               style="color: var(--accent-primary); text-decoration: none;">Twitter</a>` : ''}
            ${user.discord_username ? `<a href="#" 
               style="color: var(--accent-primary); text-decoration: none;">Discord: ${user.discord_username}</a>` : ''}
          </div>
        `;

        // Account actions section
        const accountActionsSection = document.createElement('div');
        accountActionsSection.innerHTML = `
          <h4 style="color: var(--accent-primary); margin-top: 15px; margin-bottom: 15px;">Account Actions</h4>
          <div style="display: flex; gap: 15px;">
            <button style="background-color: rgba(100, 255, 218, 0.2); 
                           color: var(--accent-primary); 
                           border: none; 
                           padding: 8px 15px; 
                           border-radius: 5px; 
                           cursor: pointer;">Edit Profile</button>
            <button style="background-color: rgba(255, 110, 110, 0.2); 
                           color: var(--accent-highlight); 
                           border: none; 
                           padding: 8px 15px; 
                           border-radius: 5px; 
                           cursor: pointer;">Logout</button>
          </div>
        `;

        // Add advanced privacy and security options
        const privacySection = document.createElement('div');
        privacySection.innerHTML = `
          <h4 style="color: var(--accent-primary); margin-top: 15px; margin-bottom: 15px;">Advanced Settings</h4>
          <div style="display: flex; gap: 15px;">
            <div class="setting">
              <label>Advanced Privacy Controls</label>
              <div class="toggle-switch">
                <input type="checkbox" id="advanced-tracking">
                <label for="advanced-tracking">Block Advanced Tracking</label>
              </div>
              <div class="toggle-switch">
                <input type="checkbox" id="vpn-mode">
                <label for="vpn-mode">Enable VPN Mode</label>
              </div>
            </div>
            <div class="setting">
              <label>Security Audit</label>
              <button class="security-audit-btn">Run Security Scan</button>
            </div>
          </div>
        `;

        // Assemble profile settings content
        profileSettingsContent.appendChild(profileDetailsSection);
        profileSettingsContent.appendChild(socialLinksSection);
        profileSettingsContent.appendChild(accountActionsSection);
        profileSettingsContent.appendChild(privacySection);

        // Security audit button functionality
        const securityAuditBtn = profileSettingsContent.querySelector('.security-audit-btn');
        securityAuditBtn.addEventListener('click', () => {
          alert('Security Scan Complete: No threats detected! 🛡️');
        });

        // Add toggle functionality
        let isExpanded = true;
        panelHeader.addEventListener('click', () => {
          isExpanded = !isExpanded;
          profileSettingsContent.style.display = isExpanded ? 'block' : 'none';
          toggleIcon.textContent = isExpanded ? '▼' : '▶';
          profileSettingsContainer.style.height = isExpanded ? 'auto' : 'fit-content';
        });

        // Assemble panel
        profileSettingsContainer.appendChild(panelHeader);
        profileSettingsContainer.appendChild(profileSettingsContent);

        // Add panel to desktop
        desktopArea.appendChild(profileSettingsContainer);
      }
    } catch (error) {
      console.error('Failed to load profile settings:', error);
    }
  }

  applyTheme(theme) {
    const root = document.documentElement;
    switch(theme) {
      case 'dark':
        root.style.setProperty('--bg-primary', '#0a192f');
        root.style.setProperty('--bg-secondary', '#112240');
        root.style.setProperty('--text-primary', '#e6f1ff');
        root.style.setProperty('--accent-primary', '#64ffda');
        break;
      case 'light':
        root.style.setProperty('--bg-primary', '#f4f4f4');
        root.style.setProperty('--bg-secondary', '#ffffff');
        root.style.setProperty('--text-primary', '#333');
        root.style.setProperty('--accent-primary', '#007bff');
        break;
      case 'cyberpunk':
        root.style.setProperty('--bg-primary', '#000');
        root.style.setProperty('--bg-secondary', '#0f0');
        root.style.setProperty('--text-primary', '#0f0');
        root.style.setProperty('--accent-primary', '#f0f');
        break;
    }
  }

  createMatrixBackground() {
    const backgroundElement = document.getElementById('user-background');
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*()_+-=[]{}|;:,.<>?/'.split('');
    const numChars = 150; // Adjust for density

    for (let i = 0; i < numChars; i++) {
      const char = document.createElement('span');
      char.classList.add('matrix-char');
      
      // Randomize character
      char.textContent = chars[Math.floor(Math.random() * chars.length)];
      
      // Random positioning
      char.style.left = `${Math.random() * 100}%`;
      char.style.top = `${Math.random() * 100}%`;
      
      // Random animation duration and delay
      const duration = 5 + Math.random() * 10;
      const delay = Math.random() * 10;
      
      char.style.animationDuration = `${duration}s`;
      char.style.animationDelay = `-${delay}s`;
      
      // Random opacity and color variation
      char.style.opacity = `${0.3 + Math.random() * 0.7}`;
      char.style.color = `rgba(0, ${Math.floor(200 + Math.random() * 55)}, 0, ${0.5 + Math.random() * 0.5})`;
      
      backgroundElement.appendChild(char);
    }
  }

  initSnakeGame() {
    const canvas = document.getElementById('snake-game');
    canvas.innerHTML = `
      <canvas id="snake-canvas" width="300" height="300"></canvas>
      <div class="game-controls">
        <button id="snake-start">Start</button>
        <span id="snake-score">Score: 0</span>
      </div>
    `;

    const snakeCanvas = canvas.querySelector('#snake-canvas');
    const ctx = snakeCanvas.getContext('2d');
    const scoreElement = canvas.querySelector('#snake-score');
    const startButton = canvas.querySelector('#snake-start');

    const gridSize = 15;
    const tileCount = snakeCanvas.width / gridSize;

    let snake = [
      { x: 5 * gridSize, y: 5 * gridSize }
    ];
    let food = { x: 0, y: 0 };
    let dx = gridSize;
    let dy = 0;
    let score = 0;
    let gameLoop;

    function drawGame() {
      ctx.clearRect(0, 0, snakeCanvas.width, snakeCanvas.height);

      // Draw snake
      ctx.fillStyle = 'var(--accent-primary)';
      snake.forEach(segment => {
        ctx.fillRect(segment.x, segment.y, gridSize - 2, gridSize - 2);
      });

      // Draw food
      ctx.fillStyle = 'var(--accent-highlight)';
      ctx.fillRect(food.x, food.y, gridSize - 2, gridSize - 2);
    }

    function placeFood() {
      food.x = Math.floor(Math.random() * tileCount) * gridSize;
      food.y = Math.floor(Math.random() * tileCount) * gridSize;
    }

    function moveSnake() {
      const head = { x: snake[0].x + dx, y: snake[0].y + dy };
      snake.unshift(head);

      // Check food collision
      if (head.x === food.x && head.y === food.y) {
        score++;
        scoreElement.textContent = `Score: ${score}`;
        placeFood();
      } else {
        snake.pop();
      }

      // Check wall or self collision
      if (
        head.x < 0 || head.x >= snakeCanvas.width ||
        head.y < 0 || head.y >= snakeCanvas.height ||
        snake.slice(1).some(segment => 
          segment.x === head.x && segment.y === head.y)
      ) {
        clearInterval(gameLoop);
        alert(`Game Over! Score: ${score}`);
      }
    }

    function startGame() {
      snake = [{ x: 5 * gridSize, y: 5 * gridSize }];
      dx = gridSize;
      dy = 0;
      score = 0;
      scoreElement.textContent = 'Score: 0';
      placeFood();
      
      clearInterval(gameLoop);
      gameLoop = setInterval(() => {
        moveSnake();
        drawGame();
      }, 100);
    }

    startButton.addEventListener('click', startGame);

    // Keyboard controls
    document.addEventListener('keydown', (e) => {
      switch(e.key) {
        case 'w':
          if (dy === 0) { dx = 0; dy = -gridSize; }
          break;
        case 's':
          if (dy === 0) { dx = 0; dy = gridSize; }
          break;
        case 'a':
          if (dx === 0) { dx = -gridSize; dy = 0; }
          break;
        case 'd':
          if (dx === 0) { dx = gridSize; dy = 0; }
          break;
      }
    });
  }

  initTetrisGame() {
    const canvas = document.getElementById('tetris-game');
    canvas.innerHTML = `
      <canvas id="tetris-canvas" width="300" height="400"></canvas>
      <div class="game-controls">
        <button id="tetris-start">Start</button>
        <span id="tetris-score">Score: 0</span>
      </div>
    `;

    const tetrisCanvas = canvas.querySelector('#tetris-canvas');
    const ctx = tetrisCanvas.getContext('2d');
    const scoreElement = canvas.querySelector('#tetris-score');
    const startButton = canvas.querySelector('#tetris-start');

    const rows = 20;
    const cols = 10;
    const blockSize = 20;
    let board = Array(rows).fill().map(() => Array(cols).fill(0));
    let currentPiece;
    let currentPosition;
    let score = 0;
    let gameLoop;

    const pieces = [
      [[1,1,1,1]],
      [[1,1],[1,1]],
      [[1,1,1],[0,1,0]],
      [[1,1,1],[1,0,0]],
      [[1,1,1],[0,0,1]]
    ];

    function drawBoard() {
      ctx.clearRect(0, 0, tetrisCanvas.width, tetrisCanvas.height);

      // Draw board
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          if (board[row][col]) {
            ctx.fillStyle = 'var(--accent-primary)';
            ctx.fillRect(col * blockSize, row * blockSize, blockSize - 1, blockSize - 1);
          }
        }
      }

      // Draw current piece
      if (currentPiece) {
        currentPiece.forEach((row, dy) => {
          row.forEach((value, dx) => {
            if (value) {
              ctx.fillStyle = 'var(--accent-secondary)';
              ctx.fillRect(
                (currentPosition.x + dx) * blockSize, 
                (currentPosition.y + dy) * blockSize, 
                blockSize - 1, 
                blockSize - 1
              );
            }
          });
        });
      }
    }

    function checkCollision(piece, offsetX, offsetY) {
      for (let row = 0; row < piece.length; row++) {
        for (let col = 0; col < piece[row].length; col++) {
          if (piece[row][col]) {
            const newX = currentPosition.x + col + offsetX;
            const newY = currentPosition.y + row + offsetY;

            if (
              newX < 0 || newX >= cols || 
              newY >= rows ||
              (newY >= 0 && board[newY][newX])
            ) {
              return true;
            }
          }
        }
      }
      return false;
    }

    function mergePiece() {
      currentPiece.forEach((row, dy) => {
        row.forEach((value, dx) => {
          if (value) {
            board[currentPosition.y + dy][currentPosition.x + dx] = 1;
          }
        });
      });

      // Check for completed lines
      for (let row = rows - 1; row >= 0; row--) {
        if (board[row].every(cell => cell)) {
          board.splice(row, 1);
          board.unshift(Array(cols).fill(0));
          score += 10;
          scoreElement.textContent = `Score: ${score}`;
        }
      }
    }

    function spawnPiece() {
      currentPiece = pieces[Math.floor(Math.random() * pieces.length)];
      currentPosition = { x: Math.floor(cols / 2) - Math.floor(currentPiece[0].length / 2), y: 0 };

      if (checkCollision(currentPiece, 0, 0)) {
        clearInterval(gameLoop);
        alert(`Game Over! Score: ${score}`);
        board = Array(rows).fill().map(() => Array(cols).fill(0));
      }
    }

    function movePiece(dx, dy) {
      if (!checkCollision(currentPiece, dx, dy)) {
        currentPosition.x += dx;
        currentPosition.y += dy;
      } else if (dy > 0) {
        mergePiece();
        spawnPiece();
      }
    }

    function startGame() {
      board = Array(rows).fill().map(() => Array(cols).fill(0));
      score = 0;
      scoreElement.textContent = 'Score: 0';
      
      clearInterval(gameLoop);
      spawnPiece();
      gameLoop = setInterval(() => {
        movePiece(0, 1);
        drawBoard();
      }, 500);
    }

    startButton.addEventListener('click', startGame);

    // Keyboard controls
    document.addEventListener('keydown', (e) => {
      if (!currentPiece) return;

      switch(e.key) {
        case 'ArrowLeft': movePiece(-1, 0); break;
        case 'ArrowRight': movePiece(1, 0); break;
        case 'ArrowDown': movePiece(0, 1); break;
      }
    });
  }

  initPongGame() {
    const canvas = document.getElementById('pong-game');
    canvas.innerHTML = `
      <canvas id="pong-canvas" width="400" height="300"></canvas>
      <div class="game-controls">
        <button id="pong-start">Start</button>
        <span id="pong-score">Player 1: 0 | Player 2: 0</span>
      </div>
    `;

    const pongCanvas = canvas.querySelector('#pong-canvas');
    const ctx = pongCanvas.getContext('2d');
    const scoreElement = canvas.querySelector('#pong-score');
    const startButton = canvas.querySelector('#pong-start');

    const paddleWidth = 10;
    const paddleHeight = 100;
    let player1Score = 0;
    let player2Score = 0;

    const ball = {
      x: pongCanvas.width / 2,
      y: pongCanvas.height / 2,
      radius: 10,
      dx: 5,
      dy: 5
    };

    const player1 = {
      x: 0,
      y: pongCanvas.height / 2 - paddleHeight / 2,
      height: paddleHeight,
      width: paddleWidth
    };

    const player2 = {
      x: pongCanvas.width - paddleWidth,
      y: pongCanvas.height / 2 - paddleHeight / 2,
      height: paddleHeight,
      width: paddleWidth
    };

    let gameLoop;

    function drawGame() {
      ctx.clearRect(0, 0, pongCanvas.width, pongCanvas.height);

      // Draw paddles
      ctx.fillStyle = 'var(--accent-primary)';
      ctx.fillRect(player1.x, player1.y, player1.width, player1.height);
      ctx.fillRect(player2.x, player2.y, player2.width, player2.height);

      // Draw ball
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'var(--accent-secondary)';
      ctx.fill();
      ctx.closePath();
    }

    function moveBall() {
      ball.x += ball.dx;
      ball.y += ball.dy;

      // Collision with top and bottom
      if (ball.y - ball.radius < 0 || ball.y + ball.radius > pongCanvas.height) {
        ball.dy *= -1;
      }

      // Collision with paddles
      const isCollideWithPlayer1 = 
        ball.x - ball.radius < player1.x + player1.width &&
        ball.y > player1.y && 
        ball.y < player1.y + player1.height;

      const isCollideWithPlayer2 = 
        ball.x + ball.radius > player2.x &&
        ball.y > player2.y && 
        ball.y < player2.y + player2.height;

      if (isCollideWithPlayer1 || isCollideWithPlayer2) {
        ball.dx *= -1;
      }

      // Scoring
      if (ball.x - ball.radius < 0) {
        player2Score++;
        resetBall();
      } else if (ball.x + ball.radius > pongCanvas.width) {
        player1Score++;
        resetBall();
      }

      scoreElement.textContent = `Player 1: ${player1Score} | Player 2: ${player2Score}`;
    }

    function resetBall() {
      ball.x = pongCanvas.width / 2;
      ball.y = pongCanvas.height / 2;
      ball.dx = Math.random() > 0.5 ? 5 : -5;
      ball.dy = Math.random() > 0.5 ? 5 : -5;
    }

    function startGame() {
      player1Score = 0;
      player2Score = 0;
      scoreElement.textContent = 'Player 1: 0 | Player 2: 0';
      resetBall();

      clearInterval(gameLoop);
      gameLoop = setInterval(() => {
        moveBall();
        drawGame();
      }, 20);
    }

    // Player 1 paddle control (W and S keys)
    document.addEventListener('keydown', (e) => {
      switch(e.key) {
        case 'w':
          player1.y = Math.max(0, player1.y - 20);
          break;
        case 's':
          player1.y = Math.min(pongCanvas.height - player1.height, player1.y + 20);
          break;
        case 'ArrowUp':
          player2.y = Math.max(0, player2.y - 20);
          break;
        case 'ArrowDown':
          player2.y = Math.min(pongCanvas.height - player2.height, player2.y + 20);
          break;
      }
    });

    startButton.addEventListener('click', startGame);
  }

  initCalculator() {
    const canvas = document.getElementById('calculator-app');
    canvas.innerHTML = `
      <div class="calculator-container">
        <input type="text" class="calculator-display" readonly>
        <div class="calculator-buttons">
          <button class="calc-btn" data-value="7">7</button>
          <button class="calc-btn" data-value="8">8</button>
          <button class="calc-btn" data-value="9">9</button>
          <button class="calc-btn calc-operator" data-value="/">/</button>
          
          <button class="calc-btn" data-value="4">4</button>
          <button class="calc-btn" data-value="5">5</button>
          <button class="calc-btn" data-value="6">6</button>
          <button class="calc-btn calc-operator" data-value="*">*</button>
          
          <button class="calc-btn" data-value="1">1</button>
          <button class="calc-btn" data-value="2">2</button>
          <button class="calc-btn" data-value="3">3</button>
          <button class="calc-btn calc-operator" data-value="-">-</button>
          
          <button class="calc-btn" data-value="0">0</button>
          <button class="calc-btn" data-value=".">.</button>
          <button class="calc-btn calc-equals">=</button>
          <button class="calc-btn calc-operator" data-value="+">+</button>
          
          <button class="calc-btn calc-clear">C</button>
          <button class="calc-btn calc-backspace">⌫</button>
        </div>
      </div>
    `;

    const display = canvas.querySelector('.calculator-display');
    const buttons = canvas.querySelectorAll('.calc-btn');
    
    buttons.forEach(button => {
      button.addEventListener('click', () => {
        const value = button.dataset.value;
        
        if (button.classList.contains('calc-clear')) {
          display.value = '';
        } else if (button.classList.contains('calc-backspace')) {
          display.value = display.value.slice(0, -1);
        } else if (button.classList.contains('calc-equals')) {
          try {
            display.value = eval(display.value);
          } catch (error) {
            display.value = 'Error';
          }
        } else {
          display.value += value;
        }
      });
    });
  }

  async initSoundEffects() {
    try {
      const soundUrls = [
        'https://cdn.websim.ai/system-hover.mp3', 
        'https://cdn.websim.ai/system-click.mp3'
      ];

      // Use Promise.allSettled for robust loading
      const soundResults = await Promise.allSettled(
        soundUrls.map(url => this.createSafeAudio(url))
      );

      this.systemSounds = soundResults
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value);

    } catch (error) {
      this.handleErrorGracefully(error);
    }
  }

  createSafeAudio(src, defaultVolume = 0.5) {
    return new Promise((resolve, reject) => {
      const audio = new Audio(src);
      audio.volume = defaultVolume;
      
      audio.addEventListener('canplaythrough', () => resolve(audio));
      audio.addEventListener('error', (e) => {
        console.warn(`Failed to load audio: ${src}`, e);
        reject(e);
      });

      setTimeout(() => {
        if (audio.readyState < 2) {
          console.warn(`Audio loading timeout: ${src}`);
          reject(new Error('Audio loading timeout'));
        }
      }, 5000);
    });
  }

  playSoundSafely(audioElement) {
    if (audioElement && audioElement.readyState >= 2) {
      audioElement.play().catch(err => {
        console.warn('Audio playback prevented:', err);
      });
    }
  }

  initAmbientSounds() {
    const ambientTrack = new Audio('https://cdn.websim.ai/cyberpunk-ambient.mp3');
    ambientTrack.loop = true;
    ambientTrack.volume = 0.1;

    const toggleAmbientSound = document.createElement('button');
    toggleAmbientSound.textContent = '🎵';
    toggleAmbientSound.classList.add('ambient-sound-toggle');
    toggleAmbientSound.style.position = 'fixed';
    toggleAmbientSound.style.bottom = '60px';
    toggleAmbientSound.style.right = '20px';
    toggleAmbientSound.style.zIndex = '1000';

    let isMusicPlaying = false;
    toggleAmbientSound.addEventListener('click', () => {
      if (isMusicPlaying) {
        ambientTrack.pause();
        toggleAmbientSound.textContent = '🔇';
      } else {
        ambientTrack.play();
        toggleAmbientSound.textContent = '🎵';
      }
      isMusicPlaying = !isMusicPlaying;
    });

    document.body.appendChild(toggleAmbientSound);
  }

  initQuickAccessTooltips() {
    const tooltipElements = document.querySelectorAll('.app-icon, .system-tray-icon');
    tooltipElements.forEach(element => {
      element.addEventListener('mouseenter', (e) => {
        const tooltip = document.createElement('div');
        tooltip.textContent = element.getAttribute('data-tooltip') || element.querySelector('span')?.textContent;
        tooltip.classList.add('quick-tooltip');
        
        const rect = element.getBoundingClientRect();
        tooltip.style.top = `${rect.bottom + 5}px`;
        tooltip.style.left = `${rect.left}px`;
        
        document.body.appendChild(tooltip);
      });

      element.addEventListener('mouseleave', () => {
        const existingTooltip = document.querySelector('.quick-tooltip');
        if (existingTooltip) {
          existingTooltip.remove();
        }
      });
    });
  }

  initNotificationCenter() {
    const notificationCenter = document.createElement('div');
    notificationCenter.id = 'notification-center';
    notificationCenter.style.position = 'fixed';
    notificationCenter.style.top = '60px';
    notificationCenter.style.right = '20px';
    notificationCenter.style.width = '300px';
    notificationCenter.style.backgroundColor = 'rgba(17, 34, 64, 0.8)';
    notificationCenter.style.padding = '15px';
    notificationCenter.style.borderRadius = '10px';
    notificationCenter.style.backdropFilter = 'blur(10px)';
    notificationCenter.style.zIndex = '1000';

    const notificationToggle = document.createElement('button');
    notificationToggle.textContent = '🔔';
    notificationToggle.style.position = 'fixed';
    notificationToggle.style.top = '20px';
    notificationToggle.style.right = '20px';
    notificationToggle.style.zIndex = '1001';

    let isNotificationVisible = false;
    notificationToggle.addEventListener('click', () => {
      notificationCenter.style.display = isNotificationVisible ? 'none' : 'block';
      isNotificationVisible = !isNotificationVisible;
    });

    const notifications = [
      'Welcome to NeoSync OS!',
      'You have 3 unread messages',
      'System update available',
      'New project recommendation'
    ];

    notifications.forEach(message => {
      const notification = document.createElement('div');
      notification.textContent = message;
      notification.classList.add('notification');
      notification.style.marginBottom = '10px';
      notification.style.backgroundColor = 'rgba(100, 255, 218, 0.1)';
      notification.style.padding = '10px';
      notification.style.borderRadius = '5px';
      notificationCenter.appendChild(notification);
    });

    document.body.appendChild(notificationCenter);
    document.body.appendChild(notificationToggle);
    notificationCenter.style.display = 'none';
  }

  initContextualHints() {
    const hintContainer = document.createElement('div');
    hintContainer.id = 'contextual-hints';
    hintContainer.style.position = 'fixed';
    hintContainer.style.bottom = '70px';
    hintContainer.style.left = '20px';
    hintContainer.style.backgroundColor = 'rgba(17, 34, 64, 0.8)';
    hintContainer.style.borderRadius = '10px';
    hintContainer.style.padding = '15px';
    hintContainer.style.zIndex = '1000';
    hintContainer.style.backdropFilter = 'blur(10px)';
    hintContainer.style.maxWidth = '250px';

    const hints = [
      'Pro Tip: Double-click an app to launch quickly!',
      'Use Alt+Tab to switch between windows',
      'Customize your desktop in Settings'
    ];

    let currentHintIndex = 0;
    const hintText = document.createElement('p');
    hintText.style.margin = '0';
    hintText.style.color = 'var(--accent-primary)';
    hintText.textContent = hints[0];

    const cycleHints = () => {
      currentHintIndex = (currentHintIndex + 1) % hints.length;
      hintText.textContent = hints[currentHintIndex];
    };

    hintContainer.appendChild(hintText);
    document.body.appendChild(hintContainer);

    setInterval(cycleHints, 5000);
  }

  initAppStore() {
    const appCategories = {
      productivity: [
        { 
          name: 'Notepad Pro', 
          description: 'Advanced text editing',
          icon: 'notepad-icon.svg',
          price: 'Free'
        },
        { 
          name: 'Task Manager', 
          description: 'Project and task tracking',
          icon: 'task-manager-icon.svg',
          price: '$4.99'
        },
        { 
          name: 'Time Tracker', 
          description: 'Productivity analytics',
          icon: 'time-tracker-icon.svg',
          price: '$2.99'
        },
        { 
          name: 'AI Assistant', 
          description: 'Smart personal AI helper',
          icon: 'ai-assistant-icon.svg',
          price: 'Free'
        }
      ],
      utilities: [
        { 
          name: 'System Monitor', 
          description: 'Real-time system diagnostics',
          icon: 'system-monitor-icon.svg',
          price: 'Free'
        },
        { 
          name: 'File Encryption', 
          description: 'Secure file protection',
          icon: 'encryption-icon.svg',
          price: '$9.99'
        },
        { 
          name: 'Backup Manager', 
          description: 'Cloud and local backups',
          icon: 'backup-icon.svg',
          price: '$6.99'
        }
      ],
      entertainment: [
        { 
          name: 'Music Player', 
          description: 'Advanced audio playback',
          icon: 'music-player-icon.svg',
          price: 'Free'
        },
        { 
          name: 'Video Editor', 
          description: 'Multi-track video editing',
          icon: 'video-editor-icon.svg',
          price: '$14.99'
        },
        { 
          name: 'Game Launcher', 
          description: 'Centralized game management',
          icon: 'game-launcher-icon.svg',
          price: '$3.99'
        }
      ]
    };

    const launchApp = (app) => {
      alert(`Launching ${app.name}. Full version coming soon!`);
    };

    const createAppCard = (app) => {
      const card = document.createElement('div');
      card.classList.add('app-store-card');
      card.innerHTML = `
        <img src="${app.icon}" alt="${app.name}">
        <div class="app-store-card-details">
          <h3>${app.name}</h3>
          <p>${app.description}</p>
          <div class="app-store-card-footer">
            <span class="app-price">${app.price}</span>
            <button class="app-install-btn">Install</button>
          </div>
        </div>
      `;

      card.querySelector('.app-install-btn').addEventListener('click', () => launchApp(app));

      return card;
    };

    this.updateAppStoreContent = (category, appStoreWindow) => {
      const appGrid = appStoreWindow.querySelector('.app-store-grid');
      appGrid.innerHTML = '';
      
      appCategories[category].forEach(app => {
        const appCard = createAppCard(app);
        appGrid.appendChild(appCard);
      });
    };
  }

  createQuickLaunchDock() {
    const quickLaunchDock = document.createElement('div');
    quickLaunchDock.id = 'quick-launch-dock';
    quickLaunchDock.style.position = 'fixed';
    quickLaunchDock.style.bottom = '60px';
    quickLaunchDock.style.left = '50%';
    quickLaunchDock.style.transform = 'translateX(-50%)';
    quickLaunchDock.style.display = 'flex';
    quickLaunchDock.style.gap = '15px';
    quickLaunchDock.style.backgroundColor = 'rgba(17, 34, 64, 0.8)';
    quickLaunchDock.style.padding = '10px';
    quickLaunchDock.style.borderRadius = '20px';
    quickLaunchDock.style.backdropFilter = 'blur(10px)';
    quickLaunchDock.style.zIndex = '1000';

    const quickLaunchApps = [
      { app: 'terminal', icon: '🖥️' },
      { app: 'browser', icon: '🌐' },
      { app: 'calculator', icon: '🧮' },
      { app: 'settings', icon: '⚙️' }
    ];

    quickLaunchApps.forEach(({ app, icon }) => {
      const quickLaunchButton = document.createElement('button');
      quickLaunchButton.textContent = icon;
      quickLaunchButton.style.fontSize = '24px';
      quickLaunchButton.style.background = 'none';
      quickLaunchButton.style.border = 'none';
      quickLaunchButton.style.cursor = 'pointer';
      quickLaunchButton.style.transition = 'transform 0.2s';

      quickLaunchButton.addEventListener('click', () => this.launchApp(app));
      quickLaunchButton.addEventListener('mouseenter', () => {
        quickLaunchButton.style.transform = 'scale(1.2)';
      });
      quickLaunchButton.addEventListener('mouseleave', () => {
        quickLaunchButton.style.transform = 'scale(1)';
      });

      quickLaunchDock.appendChild(quickLaunchButton);
    });

    document.body.appendChild(quickLaunchDock);
  }

  initSystemWidgets() {
    const widgetsContainer = document.createElement('div');
    widgetsContainer.id = 'system-widgets';
    widgetsContainer.style.position = 'fixed';
    widgetsContainer.style.top = '20px';
    widgetsContainer.style.right = '20px';
    widgetsContainer.style.display = 'flex';
    widgetsContainer.style.gap = '15px';

    const weatherWidget = document.createElement('div');
    weatherWidget.textContent = '☁️ 22°C';
    weatherWidget.style.backgroundColor = 'rgba(17, 34, 64, 0.7)';
    weatherWidget.style.padding = '10px';
    weatherWidget.style.borderRadius = '10px';
    weatherWidget.style.backdropFilter = 'blur(10px)';
    weatherWidget.style.border = '1px solid rgba(100, 255, 218, 0.2)';

    const stockWidget = document.createElement('div');
    stockWidget.textContent = '📈 NASDAQ: +0.5%';
    stockWidget.style.backgroundColor = 'rgba(17, 34, 64, 0.7)';
    stockWidget.style.padding = '10px';
    stockWidget.style.borderRadius = '10px';
    stockWidget.style.backdropFilter = 'blur(10px)';
    stockWidget.style.border = '1px solid rgba(100, 255, 218, 0.2)';

    widgetsContainer.appendChild(weatherWidget);
    widgetsContainer.appendChild(stockWidget);

    document.body.appendChild(widgetsContainer);
  }

  initExtraFeatures() {
    this.initSoundEffects();
    this.initAmbientSounds();
    this.initQuickAccessTooltips();
    this.initNotificationCenter();
    this.initContextualHints();
    
    this.createQuickLaunchDock();
    this.initSystemWidgets();
    this.initCloudSyncWidget();
    this.initLanguageTranslator();
    this.initPomodoroTimer();
    this.initWorldClock();
  }

  initCloudSyncWidget() {
    const cloudSyncWidget = document.createElement('div');
    cloudSyncWidget.id = 'cloud-sync-widget';
    cloudSyncWidget.style.position = 'fixed';
    cloudSyncWidget.style.bottom = '120px';
    cloudSyncWidget.style.right = '20px';
    cloudSyncWidget.style.backgroundColor = 'rgba(17, 34, 64, 0.7)';
    cloudSyncWidget.style.padding = '15px';
    cloudSyncWidget.style.borderRadius = '10px';
    cloudSyncWidget.style.backdropFilter = 'blur(10px)';
    cloudSyncWidget.innerHTML = `
      <h4 style="color: var(--accent-primary);">Cloud Sync</h4>
      <div class="sync-status">
        <span>Last Synced: Just Now</span>
        <div class="progress-bar" style="width: 100%; height: 5px; background: var(--accent-primary);"></div>
      </div>
      <button style="
        background-color: rgba(100, 255, 218, 0.2);
        color: var(--accent-primary);
        border: none;
        padding: 8px 15px;
        border-radius: 5px;
        margin-top: 10px;
      ">Sync Now</button>
    `;

    document.body.appendChild(cloudSyncWidget);
  }

  initLanguageTranslator() {
    const translatorWidget = document.createElement('div');
    translatorWidget.id = 'language-translator';
    translatorWidget.style.position = 'fixed';
    translatorWidget.style.bottom = '250px';
    translatorWidget.style.right = '20px';
    translatorWidget.style.backgroundColor = 'rgba(17, 34, 64, 0.7)';
    translatorWidget.style.padding = '15px';
    translatorWidget.style.borderRadius = '10px';
    translatorWidget.style.backdropFilter = 'blur(10px)';
    translatorWidget.innerHTML = `
      <h4 style="color: var(--accent-primary);">Language Translator</h4>
      <select id="source-lang" style="width: 100%; margin-bottom: 10px;">
        <option>English</option>
        <option>Spanish</option>
        <option>French</option>
        <option>German</option>
      </select>
      <select id="target-lang" style="width: 100%; margin-bottom: 10px;">
        <option>Spanish</option>
        <option>English</option>
        <option>French</option>
        <option>German</option>
      </select>
      <textarea placeholder="Enter text to translate" style="
        width: 100%; 
        height: 100px; 
        background-color: rgba(255, 255, 255, 0.1);
        color: var(--text-primary);
        border: 1px solid rgba(100, 255, 218, 0.3);
        border-radius: 5px;
        padding: 10px;
      "></textarea>
      <button style="
        background-color: rgba(100, 255, 218, 0.2);
        color: var(--accent-primary);
        border: none;
        padding: 8px 15px;
        border-radius: 5px;
        margin-top: 10px;
        width: 100%;
      ">Translate</button>
    `;

    document.body.appendChild(translatorWidget);
  }

  initPomodoroTimer() {
    const pomodoroWidget = document.createElement('div');
    pomodoroWidget.id = 'pomodoro-timer';
    pomodoroWidget.style.position = 'fixed';
    pomodoroWidget.style.bottom = '380px';
    pomodoroWidget.style.right = '20px';
    pomodoroWidget.style.backgroundColor = 'rgba(17, 34, 64, 0.7)';
    pomodoroWidget.style.padding = '15px';
    pomodoroWidget.style.borderRadius = '10px';
    pomodoroWidget.style.backdropFilter = 'blur(10px)';
    pomodoroWidget.innerHTML = `
      <h4 style="color: var(--accent-primary);">Pomodoro Timer</h4>
      <div id="pomodoro-timer-display" style="
        font-size: 2rem;
        text-align: center;
        color: var(--accent-primary);
        margin-bottom: 15px;
      ">25:00</div>
      <div style="display: flex; justify-content: space-between;">
        <button id="start-pomodoro" style="
          background-color: rgba(100, 255, 218, 0.2);
          color: var(--accent-primary);
          border: none;
          padding: 8px 15px;
          border-radius: 5px;
        ">Start</button>
        <button id="reset-pomodoro" style="
          background-color: rgba(255, 110, 110, 0.2);
          color: var(--accent-highlight);
          border: none;
          padding: 8px 15px;
          border-radius: 5px;
        ">Reset</button>
      </div>
    `;

    document.body.appendChild(pomodoroWidget);

    const timerDisplay = pomodoroWidget.querySelector('#pomodoro-timer-display');
    const startButton = pomodoroWidget.querySelector('#start-pomodoro');
    const resetButton = pomodoroWidget.querySelector('#reset-pomodoro');

    let timer;
    let timeLeft = 25 * 60;
    let isRunning = false;

    function updateDisplay() {
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    startButton.addEventListener('click', () => {
      if (!isRunning) {
        isRunning = true;
        startButton.textContent = 'Pause';
        timer = setInterval(() => {
          timeLeft--;
          updateDisplay();

          if (timeLeft === 0) {
            clearInterval(timer);
            isRunning = false;
            startButton.textContent = 'Start';
            alert('Pomodoro session complete!');
          }
        }, 1000);
      } else {
        clearInterval(timer);
        isRunning = false;
        startButton.textContent = 'Resume';
      }
    });

    resetButton.addEventListener('click', () => {
      clearInterval(timer);
      isRunning = false;
      timeLeft = 25 * 60;
      updateDisplay();
      startButton.textContent = 'Start';
    });
  }

  initWorldClock() {
    const worldClockWidget = document.createElement('div');
    worldClockWidget.id = 'world-clock';
    worldClockWidget.style.position = 'fixed';
    worldClockWidget.style.bottom = '510px';
    worldClockWidget.style.right = '20px';
    worldClockWidget.style.backgroundColor = 'rgba(17, 34, 64, 0.7)';
    worldClockWidget.style.padding = '15px';
    worldClockWidget.style.borderRadius = '10px';
    worldClockWidget.style.backdropFilter = 'blur(10px)';
    
    const timezones = [
      { name: 'New York', timeZone: 'America/New_York' },
      { name: 'London', timeZone: 'Europe/London' },
      { name: 'Tokyo', timeZone: 'Asia/Tokyo' },
      { name: 'Sydney', timeZone: 'Australia/Sydney' }
    ];

    let clockContent = '<h4 style="color: var(--accent-primary);">World Clock</h4>';
    timezones.forEach(tz => {
      clockContent += `
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span style="color: var(--text-primary);">${tz.name}</span>
          <span id="clock-${tz.name.toLowerCase().replace(' ', '-')}" style="color: var(--accent-secondary);"></span>
        </div>
      `;
    });

    worldClockWidget.innerHTML = clockContent;
    document.body.appendChild(worldClockWidget);

    function updateWorldClocks() {
      const now = new Date();
      timezones.forEach(tz => {
        try {
          const tzTime = now.toLocaleString('en-US', { timeZone: tz.timeZone });
          const clockElement = document.getElementById(`clock-${tz.name.toLowerCase().replace(' ', '-')}`);
          if (clockElement) {
            clockElement.textContent = new Date(tzTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          }
        } catch (error) {
          console.error(`Error updating clock for ${tz.name}:`, error);
        }
      });
    }

    updateWorldClocks();
    setInterval(updateWorldClocks, 1000);
  }

  handleErrorGracefully(error) {
    console.warn('Soft error in NeoSync OS:', error);
    // Optionally: Show user-friendly notification
    this.showNotification('An unexpected error occurred', 'warning');
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.backgroundColor = type === 'warning' ? 'rgba(255, 110, 110, 0.8)' : 'rgba(100, 255, 218, 0.8)';
    notification.style.color = 'var(--bg-primary)';
    notification.style.padding = '10px';
    notification.style.borderRadius = '5px';
    notification.style.zIndex = '9999';
  
    document.body.appendChild(notification);
  
    setTimeout(() => {
      notification.style.transition = 'opacity 0.5s';
      notification.style.opacity = '0';
      setTimeout(() => document.body.removeChild(notification), 500);
    }, 3000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.websim) {
    new NeoSyncOS();
  } else {
    console.error('WebSim integration not available');
  }
});