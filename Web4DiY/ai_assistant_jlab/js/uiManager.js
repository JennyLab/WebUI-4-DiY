import { ChatManager } from './chatManager.js';

export class UIManager {
  constructor(chatManager) {
    this.chatManager = chatManager;
    this.messageContainer = document.getElementById('messages');
    this.chatForm = document.getElementById('chatForm');
    this.userInput = document.getElementById('userInput');
    this.chatHistory = document.getElementById('chatHistory');
    this.newChatBtn = document.getElementById('newChatBtn');
    this.modelOptions = document.querySelectorAll('.model-option');
    this.debugPanel = null;
    this.ownerConsole = null;
    this.setupDebugPanel();
    this.setupKeyboardShortcuts();
  }

  init() {
    this.setupEventListeners();
    this.adjustTextareaHeight();
    this.updateChatHistory();
    this.setupModelSelection();
    this.setupImageUpload();
    this.checkIfOwnerAndShowFeatures();
  }

  setupEventListeners() {
    this.chatForm.addEventListener('submit', (e) => this.handleSubmit(e));
    this.userInput.addEventListener('input', () => this.adjustTextareaHeight());
    this.newChatBtn.addEventListener('click', () => this.startNewChat());
    
    // Handle enter key for submit (shift+enter for new line)
    this.userInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.chatForm.dispatchEvent(new Event('submit'));
      }
    });

    // Add search shortcut (Ctrl + K)
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.userInput.value = 'search for ';
        this.userInput.focus();
      }
    });
    
    // Add quick search button to input area
    const searchButton = document.createElement('button');
    searchButton.type = 'button';
    searchButton.className = 'quick-search-btn';
    searchButton.innerHTML = '<i class="fas fa-search"></i>';
    searchButton.title = 'Quick Search (Ctrl + K)';
    
    searchButton.addEventListener('click', () => {
      this.userInput.value = 'search for ';
      this.userInput.focus();
    });
    
    const inputWrapper = document.querySelector('.input-wrapper');
    inputWrapper.insertBefore(searchButton, inputWrapper.lastChild);
  }

  async handleSubmit(e) {
    e.preventDefault();
    const message = this.userInput.value.trim();
    if (!message) return;

    try {
      this.userInput.value = '';
      this.adjustTextareaHeight();
      this.addMessageToUI('user', message);
      
      const typingIndicator = this.addTypingIndicator();
      const { response, title, error } = await this.chatManager.sendMessage(message);
      
      typingIndicator.remove();
      this.addMessageToUI('assistant', response);

      if (error) {
        this.logDebugMessage('error', 'Error processing message', error);
      } else {
        this.logDebugMessage('success', 'Message processed successfully');
      }

      this.updateChatHistory();
      this.scrollToBottom();
    } catch (error) {
      this.logDebugMessage('error', 'Fatal error in message handling', {
        error: error.message,
        stack: error.stack
      });
    }
  }

  addMessageToUI(role, content) {
    if (!content) return;
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    
    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.innerHTML = role === 'user' 
      ? '<i class="fas fa-user"></i>'
      : '<i class="fas fa-robot"></i>';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'content';

    // Check if the content contains code blocks
    const formattedContent = this.formatMessageContent(content);
    contentDiv.innerHTML = formattedContent;

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);
    this.messageContainer.appendChild(messageDiv);

    // Initialize syntax highlighting for new code blocks
    if (messageDiv.querySelectorAll('pre code').length > 0) {
      Prism.highlightAllUnder(messageDiv);
      this.addCopyButtons(messageDiv);
    }

    this.scrollToBottom();
  }

  formatMessageContent(content) {
    // First escape HTML in the content
    let escapedContent = this.escapeHtml(content);
    
    // Replace markdown bold text with styled spans
    escapedContent = escapedContent.replace(/\*\*(.*?)\*\*/g, '<span class="emphasis-text">$1</span>');
    
    // Replace code blocks with properly formatted ones
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    escapedContent = escapedContent.replace(codeBlockRegex, (match, language, code) => {
      language = language || 'plaintext';
      return `
        <div class="code-block">
          <pre><code class="language-${language}">${code.trim()}</code></pre>
          <button class="copy-btn" data-code="${this.escapeHtml(code.trim())}">
            <i class="fas fa-copy"></i> Copy code
          </button>
        </div>
      `;
    });

    // Replace normal text with paragraphs
    const paragraphs = escapedContent.split('\n\n');
    let formattedContent = paragraphs.map(p => {
      if (p.includes('class="code-block"')) {
        return p;
      }
      return `<p>${p.replace(/\n/g, '<br>')}</p>`;
    }).join('');

    // Add source link formatting
    formattedContent = formattedContent.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, 
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="source-link">$1 <i class="fas fa-external-link-alt"></i></a>'
    );

    return formattedContent;
  }

  addCopyButtons(container) {
    container.querySelectorAll('.copy-btn').forEach(button => {
      button.addEventListener('click', async () => {
        const code = button.dataset.code;
        await navigator.clipboard.writeText(code);
        
        // Button animation
        button.innerHTML = '<i class="fas fa-check"></i> Copied!';
        button.classList.add('copied');
        
        // Show toast
        this.showCopiedToast();

        // Reset button after 2 seconds
        setTimeout(() => {
          button.innerHTML = '<i class="fas fa-copy"></i> Copy code';
          button.classList.remove('copied');
        }, 2000);
      });
    });
  }

  showCopiedToast() {
    const toast = document.createElement('div');
    toast.className = 'copied-toast';
    toast.textContent = 'Code copied to clipboard!';
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 2000);
  }

  addTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'message assistant';
    indicator.innerHTML = `
      <div class="avatar">
        <i class="fas fa-robot"></i>
      </div>
      <div class="content">
        <div class="typing-indicator">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      </div>
    `;
    this.messageContainer.appendChild(indicator);
    this.scrollToBottom();
    return indicator;
  }

  updateChatHistory() {
    const conversations = this.chatManager.getAllConversations();
    this.chatHistory.innerHTML = '';

    conversations.forEach(conversation => {
      const title = conversation.title || 'New Chat'; 
      const chatItem = document.createElement('div');
      chatItem.className = 'chat-item';
      chatItem.innerHTML = `
        <i class="fas fa-message"></i>
        <span>${this.escapeHtml(title)}</span>
      `;
      this.chatHistory.appendChild(chatItem);
    });
  }

  startNewChat() {
    this.chatManager.initializeNewChat();
    this.messageContainer.innerHTML = `
      <div class="message assistant">
        <div class="avatar">
          <i class="fas fa-robot"></i>
        </div>
        <div class="content">
          <p>Hello! I'm ${this.chatManager.aiName}, your AI assistant. How can I help you today?</p>
        </div>
      </div>
    `;
    this.updateChatHistory();
  }

  setupModelSelection() {
    this.modelOptions.forEach(option => {
      option.addEventListener('click', () => {
        // Remove selected class from all options
        this.modelOptions.forEach(opt => opt.classList.remove('selected'));
        // Add selected class to clicked option
        option.classList.add('selected');
        // Update the model in chat manager
        this.chatManager.setModel(option.dataset.model);
        
        // Add selection animation
        const ripple = document.createElement('div');
        ripple.className = 'ripple';
        option.appendChild(ripple);
        setTimeout(() => ripple.remove(), 1000);

        // trigger the "impressive" animation if special model
        if (option.dataset.model === 'AetheriaSpecial') {
          this.impressiveOpeningAnimation();
        }
      });
    });
  }

  triggerModelOpeningMessage(model) {
    let message = '';
    switch (model) {
      case 'CodeVirtuoso':
        message = "Greetings! I'm CodeVirtuoso. Ready to dive deep into the world of programming? Let's build something amazing!";
        break;
      case 'DataSage':
        message = "Hello! I'm DataSage. Prepare for advanced reasoning and insights. What data mysteries shall we unravel today?";
        break;
      case 'DeepVision':
        message = "Greetings! I'm DeepVision. Get ready for detailed analysis and comprehensive explanations. What shall we analyze?";
        break;
      case 'NovaBase':
        message = "Hello! I'm NovaBase. How can I help you today?";
        break;
      default:
        message = "Model activated. Ready for your command.";
    }
    this.addMessageToUI('assistant', message);
  }

  impressiveOpeningAnimation() {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'special-activation';
    
    const content = document.createElement('div');
    content.className = 'activation-content';
    
    // ASCII art animation
    const asciiArt = document.createElement('div');
    asciiArt.className = 'ascii-art';
    asciiArt.innerHTML = `
       ▄▄▄       ▓█████▄▄▄█████▓ ██░ ██ ▓█████  ██▀███   ██▓ ▄▄▄      
      ▒████▄     ▓█   ▀▓  ██▒ ▓▒▓██░ ██▒▓█   ▀ ▓██ ▒ ██▒▓██▒▒████▄    
      ▒██  ▀█▄   ▒███  ▒ ▓██░ ▒░▒██▀▀██░▒███   ▓██ ░▄█ ▒▒██▒▒██  ▀█▄  
      ░██▄▄▄▄██  ▒▓█  ▄░ ▓██▓ ░ ░▓█ ░██ ▒▓█  ▄ ▒██▀▀█▄  ░██░░██▄▄▄▄██ 
       ▓█   ▓██▒▒░▒████  ▒██▒ ░ ░▓█▒░██▓░▒████▒░██▓ ▒██▒░██░ ▓█   ▓██▒
       ▒▒   ▓▒█░░░ ▒░   ▒ ░░    ▒ ░░▒░▒░░ ▒░ ░░ ▒▓ ░▒▓░░▓   ▒▒   ▓▒█░
        ░   ▒▒ ░ ░ ░     ░       ▒ ░▒░ ░ ░ ░    ░▒ ░ ▒░ ▒ ░  ░   ▒▒ ░
        ░   ▒      ░   ░ ░       ░  ░░ ░   ░     ░░   ░  ▒ ░  ░   ▒   
            ░  ░    ░             ░  ░  ░   ░     ░      ░        ░  ░
    `;
    
    // Progress bar
    const progress = document.createElement('div');
    progress.className = 'activation-progress';
    progress.innerHTML = '<div class="progress-bar"></div>';
    
    // Status text
    const status = document.createElement('div');
    status.className = 'activation-status';
    status.innerHTML = 'SYSTEM ACCESS GRANTED - AETHERIA SPECIAL ONLINE';
    
    content.appendChild(asciiArt);
    content.appendChild(progress);
    content.appendChild(status);
    overlay.appendChild(content);
    document.body.appendChild(overlay);
    
    // Simulated initialization steps with typed effect
    const steps = [
      'Initializing neural networks...',
      'Calibrating quantum processors...',
      'Loading enhanced capabilities...',
      'Establishing secure connection...',
      'AetheriaSpecial activation complete.'
    ];
    
    let currentStep = 0;
    const statusElement = document.createElement('div');
    statusElement.style.color = '#00ff00';
    statusElement.style.marginTop = '20px';
    content.appendChild(statusElement);
    
    const typeStep = (step) => {
      let i = 0;
      statusElement.textContent = '';
      const interval = setInterval(() => {
        if (i < step.length) {
          statusElement.textContent += step[i];
          i++;
        } else {
          clearInterval(interval);
          currentStep++;
          if (currentStep < steps.length) {
            setTimeout(() => typeStep(steps[currentStep]), 500);
          } else {
            // Finish animation
            setTimeout(() => {
              overlay.style.animation = 'overlay-out 0.5s ease forwards';
              setTimeout(() => overlay.remove(), 500);
            }, 1000);
          }
        }
      }, 50);
    };
    
    // Start typing animation
    setTimeout(() => typeStep(steps[0]), 1000);
    
    // Add cyberpunk-style glitch effect
    const glitchText = () => {
      const glitch = document.createElement('div');
      glitch.style.position = 'absolute';
      glitch.style.top = `${Math.random() * 100}%`;
      glitch.style.left = `${Math.random() * 100}%`;
      glitch.style.transform = 'translate(-50%, -50%)';
      glitch.style.color = '#0f0';
      glitch.style.textShadow = '2px 2px #f0f';
      glitch.textContent = 'AETHERIA';
      overlay.appendChild(glitch);
      
      setTimeout(() => glitch.remove(), 200);
    };
    
    const glitchInterval = setInterval(glitchText, 300);
    setTimeout(() => clearInterval(glitchInterval), 3000);
  }

  warnAboutDefaultModel() {
    // Removed warning functionality
  }

  setupDebugPanel() {
    const debugPanel = document.createElement('div');
    debugPanel.className = 'debug-panel';
    debugPanel.innerHTML = `
      <div class="debug-header">
        <h3><i class="fas fa-bug"></i> Debug Console</h3>
        <div class="debug-controls">
          <button class="debug-toggle" title="Toggle Debug Mode">
            <i class="fas fa-code"></i>
          </button>
          <button class="debug-clear" title="Clear Console">
            <i class="fas fa-trash"></i>
          </button>
          <button class="debug-analytics" title="Show Analytics">
          <i class="fas fa-chart-bar"></i>
        </button>
          <button class="debug-network" title="Network Monitor">
          <i class="fas fa-network-wired"></i>
          </button>
          <button class="debug-memory" title="Memory Usage">
            <i class="fas fa-memory"></i>
          </button>
          <button class="debug-minimize" title="Minimize">
            <i class="fas fa-minus"></i>
          </button>
        </div>
      </div>
      <div class="debug-content">
        <div class="debug-logs"></div>
      </div>
    `;
    document.body.appendChild(debugPanel);
    this.debugPanel = debugPanel;

    // Setup debug controls
    this.setupDebugControls();
  }

  setupDebugControls() {
    const toggleBtn = this.debugPanel.querySelector('.debug-toggle');
    const clearBtn = this.debugPanel.querySelector('.debug-clear');
    const minimizeBtn = this.debugPanel.querySelector('.debug-minimize');
    const analyticsBtn = this.debugPanel.querySelector('.debug-analytics');
    const networkBtn = this.debugPanel.querySelector('.debug-network');
    const memoryBtn = this.debugPanel.querySelector('.debug-memory');

    toggleBtn.addEventListener('click', () => {
      const isDebug = this.chatManager.toggleDebugMode();
      toggleBtn.classList.toggle('active', isDebug);
      this.showNotification(isDebug ? 'Debug mode enabled' : 'Debug mode disabled');
    });

    clearBtn.addEventListener('click', () => {
      this.debugPanel.querySelector('.debug-logs').innerHTML = '';
      this.showNotification('Debug console cleared');
    });

    minimizeBtn.addEventListener('click', () => {
      this.debugPanel.classList.toggle('minimized');
      minimizeBtn.innerHTML = this.debugPanel.classList.contains('minimized') 
        ? '<i class="fas fa-plus"></i>' 
        : '<i class="fas fa-minus"></i>';
    });

    analyticsBtn.addEventListener('click', () => {
      this.displayAnalytics();
    });

    networkBtn.addEventListener('click', () => {
      this.monitorNetworkRequests();
    });

    memoryBtn.addEventListener('click', () => {
      this.displayMemoryUsage();
    });

    // Add new controls
    const profilerBtn = document.createElement('button');
    profilerBtn.innerHTML = '<i class="fas fa-microchip"></i>';
    profilerBtn.title = 'CPU Profiler';
    profilerBtn.addEventListener('click', () => this.startCPUProfiling());

    const storageBtn = document.createElement('button');
    storageBtn.innerHTML = '<i class="fas fa-database"></i>';
    storageBtn.title = 'Storage Inspector';
    storageBtn.addEventListener('click', () => this.inspectStorage());

    this.debugPanel.querySelector('.debug-controls').appendChild(profilerBtn);
    this.debugPanel.querySelector('.debug-controls').appendChild(storageBtn);
  }

  setupDebugConsole() {
    // Create performance monitoring tab
    const performanceTab = document.createElement('div');
    performanceTab.className = 'debug-tab performance-tab';
    performanceTab.innerHTML = `
      <h4>Performance Metrics</h4>
      <div class="performance-chart">
        <div class="chart-container" id="responseTimeChart"></div>
      </div>
      <div class="metric-card">
        <span class="label">Average Response Time</span>
        <span class="value">0.7s</span>
      </div>
      <div class="metric-card">
        <span class="label">Memory Usage</span>
        <span class="value">128MB</span>
      </div>
      <div class="system-health">
        <div class="health-indicator good">
          <i class="fas fa-server"></i>
          <div class="status">API</div>
        </div>
        <div class="health-indicator good">
          <i class="fas fa-database"></i>
          <div class="status">DB</div>
        </div>
        <div class="health-indicator warning">
          <i class="fas fa-memory"></i>
          <div class="status">Cache</div>
        </div>
      </div>
    `;

    // Add real-time monitoring
    setInterval(() => {
      this.updateSystemHealth();
      this.updatePerformanceMetrics();
    }, 5000);

    // Add network request tracking
    this.setupNetworkMonitoring();
    
    // Add error tracking
    this.setupErrorTracking();
    
    // Add memory profiling
    this.setupMemoryProfiling();
  }

  updateSystemHealth() {
    const indicators = document.querySelectorAll('.health-indicator');
    indicators.forEach(indicator => {
      const status = Math.random() > 0.8 ? 'warning' : 'good';
      indicator.className = `health-indicator ${status}`;
    });
  }

  updatePerformanceMetrics() {
    const memoryUsage = window.performance?.memory?.usedJSHeapSize || 0;
    const memoryCard = document.querySelector('.metric-card .value');
    if (memoryCard) {
      memoryCard.textContent = `${(memoryUsage / (1024 * 1024)).toFixed(1)}MB`;
    }
  }

  setupErrorTracking() {
    window.onerror = (msg, url, lineNo, columnNo, error) => {
      this.logDebugMessage('error', 'JavaScript Error', {
        message: msg,
        location: `${url}:${lineNo}:${columnNo}`,
        stack: error?.stack
      });
      return false;
    };

    window.addEventListener('unhandledrejection', (event) => {
      this.logDebugMessage('error', 'Unhandled Promise Rejection', {
        reason: event.reason
      });
    });
  }

  setupMemoryProfiling() {
    if (window.performance && window.performance.memory) {
      setInterval(() => {
        const memory = window.performance.memory;
        this.logDebugMessage('info', 'Memory Usage', {
          usedHeap: `${(memory.usedJSHeapSize / (1024 * 1024)).toFixed(2)}MB`,
          totalHeap: `${(memory.totalJSHeapSize / (1024 * 1024)).toFixed(2)}MB`,
          limit: `${(memory.jsHeapSizeLimit / (1024 * 1024)).toFixed(2)}MB`
        });
      }, 30000);
    }
  }

  startCPUProfiling() {
    console.profile('Performance Profile');
    setTimeout(() => {
      console.profileEnd();
      this.logDebugMessage('info', 'CPU Profile completed', {
        duration: '5s'
      });
    }, 5000);
  }

  inspectStorage() {
    const storageInfo = {
      localStorage: Object.keys(localStorage).length,
      sessionStorage: Object.keys(sessionStorage).length,
      cookies: document.cookie.split(';').length
    };

    this.logDebugMessage('info', 'Storage Inspector', storageInfo);
  }

  displayMemoryUsage() {
    if (window.performance && window.performance.memory) {
      const memory = window.performance.memory;
      const memoryLog = document.createElement('div');
      memoryLog.className = 'debug-log info';
      memoryLog.innerHTML = `
        <i class="fas fa-memory"></i>
        <span>Memory Usage:</span>
        <div class="debug-data">
          Used JS Heap: ${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB<br>
          Total JS Heap: ${(memory.totalJSHeapSize / 1048576).toFixed(2)} MB<br>
          Heap Limit: ${(memory.jsHeapSizeLimit / 1048576).toFixed(2)} MB
        </div>
      `;
      const logsContainer = this.debugPanel.querySelector('.debug-logs');
      logsContainer.appendChild(memoryLog);
      logsContainer.scrollTop = logsContainer.scrollHeight;
      this.showNotification('Memory usage displayed in debug console');
    } else {
      this.logDebugMessage('warning', 'Memory usage data not available.');
      this.showNotification('Memory usage data not available.');
    }
  }

  monitorNetworkRequests() {
    const originalFetch = window.fetch;
    let requestCount = 0;
    let errorCount = 0;
    let totalBytes = 0;

    window.fetch = async (...args) => {
      requestCount++;
      const startTime = performance.now();
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        const duration = (endTime - startTime).toFixed(2);
        const contentLength = response.headers.get('content-length') || 0;
        totalBytes += parseInt(contentLength, 10);

        const networkLog = document.createElement('div');
        networkLog.className = 'debug-log info';
        networkLog.innerHTML = `
          <i class="fas fa-network-wired"></i>
          <span>Network Request: ${args[0]}</span>
          <div class="debug-data">
            Status: ${response.status} ${response.statusText}<br>
            Duration: ${duration} ms<br>
            Content Length: ${contentLength} bytes
          </div>
        `;
        const logsContainer = this.debugPanel.querySelector('.debug-logs');
        logsContainer.appendChild(networkLog);
        logsContainer.scrollTop = logsContainer.scrollHeight;
        
        return response;
      } catch (error) {
        errorCount++;
        this.logDebugMessage('error', `Network Request Failed: ${args[0]}`, error);
        throw error;
      } finally {
        const summaryLog = document.createElement('div');
        summaryLog.className = 'debug-log info';
        summaryLog.innerHTML = `
          <i class="fas fa-signal"></i>
          <span>Network Summary:</span>
          <div class="debug-data">
            Total Requests: ${requestCount}<br>
            Errors: ${errorCount}<br>
            Total Data Received: ${(totalBytes / 1024).toFixed(2)} KB
          </div>
        `;
        const logsContainer = this.debugPanel.querySelector('.debug-logs');
        logsContainer.appendChild(summaryLog);
        logsContainer.scrollTop = logsContainer.scrollHeight;
      }
    };
    this.showNotification('Network monitoring enabled. Reload to start monitoring.');
  }

  displayAnalytics() {
    // Simulate fetching analytics data
    const analyticsData = {
      totalMessages: 42,
      averageResponseTime: '0.7s',
      mostUsedModel: 'CodeVirtuoso',
      peakHours: '6 PM - 9 PM',
      errorCount: this.chatManager.errorLogs.length,
      lastError: this.chatManager.errorLogs[this.chatManager.errorLogs.length - 1] || null
    };

    const analyticsLog = document.createElement('div');
    analyticsLog.className = 'debug-log info';
    analyticsLog.innerHTML = `
      <i class="fas fa-chart-bar"></i>
      <span>Analytics:</span>
      <div class="debug-data">
        Total Messages: ${analyticsData.totalMessages}<br>
        Avg. Response Time: ${analyticsData.averageResponseTime}<br>
        Most Used Model: ${analyticsData.mostUsedModel}<br>
        Peak Hours: ${analyticsData.peakHours}<br>
        Error Count: ${analyticsData.errorCount}
        ${analyticsData.lastError ? `<br>Last Error: ${analyticsData.lastError.error} <br> ${analyticsData.lastError.stack}` : ''}
      </div>
    `;
    const logsContainer = this.debugPanel.querySelector('.debug-logs');
    logsContainer.appendChild(analyticsLog);
    logsContainer.scrollTop = logsContainer.scrollHeight;
    this.showNotification('Analytics displayed in debug console');
  }

  setupKeyboardShortcuts() {
    let isCtrlPressed = false;
    let is8Pressed = false;

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Control') isCtrlPressed = true;
      if (e.key === '8') is8Pressed = true;
      
      if (isCtrlPressed && is8Pressed && e.key.toLowerCase() === 'x') {
        this.toggleDebugFeatures();
        // Show animation for shortcut activation
        this.showShortcutActivation();
      }

      // Owner-only console trigger (Ctrl+Shift+O)
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'o') {
        this.checkIfOwner(async (isOwner) => {
          if (isOwner) {
            this.toggleOwnerConsole();
          } else {
            this.showNotification('Unauthorized access to owner console.');
          }
        });
      }

      // Special model trigger (Ctrl+8+9)
      if (isCtrlPressed && is8Pressed && e.key === '9') {
        this.checkIfOwner(async (isOwner) => {
          if (isOwner) {
            this.activateSpecialModel();
          } else {
            this.showNotification('Unauthorized access to special model.');
          }
        });
      }
    });

    document.addEventListener('keyup', (e) => {
      if (e.key === 'Control') isCtrlPressed = false;
      if (e.key === '8') is8Pressed = false;
    });
  }

  async checkIfOwnerAndShowFeatures() {
    this.checkIfOwner(async (isOwner) => {
      if (!isOwner) {
        // If not the owner, hide the "special" model option
        const specialModelOption = document.querySelector('[data-model="AetheriaSpecial"]'); 
        if (specialModelOption) {
          specialModelOption.style.display = 'none';
        }
      }
    });
  }

  async checkIfOwner(callback) {
    try {
      const user = await window.websim.getUser();
      const isOwner = user && user.username === 'magicalsunset77771817';
      callback(isOwner);
    } catch (error) {
      console.error('Error fetching user info:', error);
      callback(false); // Assume not owner in case of error
    }
  }

  async activateSpecialModel() {
    this.checkIfOwner(async (isOwner) => {
      if (!isOwner) {
        this.showNotification('Unauthorized access to special model.');
        return;
      }
      
      // You can select or highlight the special model option in the UI
      const specialModelOption = document.querySelector('[data-model="AetheriaSpecial"]'); 
      if (specialModelOption) {
        this.modelOptions.forEach(opt => opt.classList.remove('selected'));
        specialModelOption.classList.add('selected');
        this.chatManager.setModel('AetheriaSpecial'); 
        this.showNotification('AetheriaSpecial model activated.'); 

        // Add selection animation
        const ripple = document.createElement('div');
        ripple.className = 'ripple';
        specialModelOption.appendChild(ripple);
        setTimeout(() => ripple.remove(), 1000);
      } else {
        this.showNotification('AetheriaSpecial model option not found.'); 
      }
    });
  }

  toggleDebugFeatures() {
    const isDebug = this.chatManager.toggleDebugMode();
    this.debugPanel.classList.toggle('visible');
    this.showNotification(`Debug mode ${isDebug ? 'enabled' : 'disabled'}`);
  }

  showShortcutActivation() {
    const overlay = document.createElement('div');
    overlay.className = 'shortcut-overlay';
    overlay.innerHTML = `
      <div class="shortcut-activation">
        <i class="fas fa-terminal"></i>
        <h3>${this.chatManager.aiName} Debug Mode</h3>
        <div class="shortcut-keys">
          <span class="key">Ctrl</span> +
          <span class="key">8</span> +
          <span class="key">X</span>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    
    setTimeout(() => {
      overlay.classList.add('fade-out');
      setTimeout(() => overlay.remove(), 500);
    }, 1500);
  }

  logDebugMessage(type, message, data = null) {
    const logElement = document.createElement('div');
    logElement.className = `debug-log ${type}`;
    
    const timestamp = new Date().toLocaleTimeString();
    const icon = {
      error: 'exclamation-circle',
      warning: 'exclamation-triangle',
      info: 'info-circle',
      success: 'check-circle'
    }[type] || 'info-circle';

    logElement.innerHTML = `
      <span class="debug-time">${timestamp}</span>
      <i class="fas fa-${icon}"></i>
      <span class="debug-msg">${message}</span>
      ${data ? `<pre class="debug-data">${JSON.stringify(data, null, 2)}</pre>` : ''}
    `;

    const logsContainer = this.debugPanel.querySelector('.debug-logs');
    logsContainer.appendChild(logElement);
    logsContainer.scrollTop = logsContainer.scrollHeight;

    // Auto-expand panel for errors
    if (type === 'error') {
      this.debugPanel.classList.remove('minimized');
    }
  }

  adjustTextareaHeight() {
    const textarea = this.userInput;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
  }

  scrollToBottom() {
    this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
  }

  escapeHtml(unsafe) {
    if (!unsafe) return ''; 
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  toggleOwnerConsole() {
    this.checkIfOwner(async (isOwner) => {
      if (!isOwner) {
        this.showNotification('Unauthorized access.');
        return;
      }

      if (!this.ownerConsole) {
        this.createOwnerConsole();
      }

      this.ownerConsole.classList.toggle('visible');
      this.showNotification('Owner console toggled.');
    });
  }

  createOwnerConsole() {
    this.ownerConsole = document.createElement('div');
    this.ownerConsole.className = 'owner-console';
    this.ownerConsole.innerHTML = `
      <div class="owner-console-header">
        <h3>Owner Console</h3>
        <button class="owner-console-close">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="owner-console-content">
        <textarea class="owner-console-input" placeholder="Enter command..."></textarea>
        <button class="owner-console-execute">Execute</button>
        <div class="owner-console-output"></div>
      </div>
    `;

    document.body.appendChild(this.ownerConsole);

    // Event listeners
    const closeButton = this.ownerConsole.querySelector('.owner-console-close');
    const executeButton = this.ownerConsole.querySelector('.owner-console-execute');
    const inputArea = this.ownerConsole.querySelector('.owner-console-input');
    const outputArea = this.ownerConsole.querySelector('.owner-console-output');

    closeButton.addEventListener('click', () => {
      this.ownerConsole.classList.remove('visible');
    });

    executeButton.addEventListener('click', async () => {
      const command = inputArea.value.trim();
      outputArea.textContent = 'Executing...'; // Provide feedback

      try {
        // Execute the command using AI (adjust prompt as needed)
        const response = await fetch('/api/ai_completion', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            prompt: `You are the owner console for the ${this.chatManager.aiName} AI. Execute the following command and return ONLY the output:\n${command}\n`, 
            data: {},
            model: 'default' // Specify a fast model
          }),
        });

        const data = await response.json();
        outputArea.textContent = data.reply;

        this.logDebugMessage('info', `Owner Console: ${command}`, data.reply); // Log to debug panel

      } catch (error) {
        outputArea.textContent = `Error: ${error.message}`;
        this.logDebugMessage('error', `Owner Console Error: ${command}`, error);
      }
    });
  }

  setupImageUpload() {
    const imageUploadBtn = document.createElement('button');
    imageUploadBtn.className = 'image-upload-btn';
    imageUploadBtn.innerHTML = '<i class="fas fa-image"></i>';
    imageUploadBtn.title = 'Upload image for analysis';
    
    const imageInput = document.createElement('input');
    imageInput.type = 'file';
    imageInput.accept = 'image/*';
    imageInput.className = 'hidden';
    
    imageUploadBtn.addEventListener('click', () => {
      imageInput.click();
    });
    
    imageInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        this.handleImageUpload(file);
      }
    });
    
    const inputWrapper = document.querySelector('.input-wrapper');
    inputWrapper.insertBefore(imageUploadBtn, inputWrapper.lastChild);
    document.body.appendChild(imageInput);
  }

  async handleImageUpload(file) {
    try {
      // Create image preview wrapper
      const imagePreview = document.createElement('div');
      imagePreview.className = 'uploaded-image-preview';
      
      // Show uploaded image with loading overlay
      const message = document.createElement('div');
      message.className = 'message user';
      message.innerHTML = `
        <div class="avatar">
          <i class="fas fa-user"></i>
        </div>
        <div class="content">
          <div class="uploaded-image-container">
            <img src="${URL.createObjectURL(file)}" alt="Uploaded image" />
            <div class="image-overlay">
              <div class="loading-spinner"></div>
              <span>Analyzing image...</span>
            </div>
          </div>
        </div>
      `;
      
      this.messageContainer.appendChild(message);
      this.scrollToBottom();
      
      const typingIndicator = this.addTypingIndicator();
      
      // Get analysis from ChatManager
      const analysis = await this.chatManager.analyzeImage(file);
      
      typingIndicator.remove();
      this.addMessageToUI('assistant', analysis);
      
    } catch (error) {
      this.showNotification('Failed to analyze image', 'error');
    }
  }
}