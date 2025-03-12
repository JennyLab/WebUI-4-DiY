export class UIManager {
  constructor(driveManager, commandParser) {
    this.driveManager = driveManager;
    this.commandParser = commandParser;
    this.modal = document.getElementById('modal');
    this.fileList = document.getElementById('fileList');
    this.outputDiv = document.getElementById('output');
    this.commandInput = document.getElementById('commandInput');
    this.driveStatus = document.getElementById('driveStatus');
    this.loadISOModal = document.getElementById('loadISOModal');
  }

  init() {
    this.setupEventListeners();
    this.showWelcomeMessage();
    this.updateFileList();
    this.updateDriveStatus();
  }

  setupEventListeners() {
    // Command input
    this.commandInput.addEventListener('keypress', this.handleCommand.bind(this));

    // New file button
    document.getElementById('newFileBtn').addEventListener('click', () => {
      this.modal.classList.add('show');
    });

    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', () => {
      this.updateFileList();
      this.updateDriveStatus();
    });

    // Modal buttons
    document.getElementById('generateBtn').addEventListener('click', this.handleGenerate.bind(this));
    document.getElementById('cancelBtn').addEventListener('click', () => {
      this.modal.classList.remove('show');
    });

    // Save ISO button
    document.getElementById('saveISOBtn').addEventListener('click', async () => {
      try {
        const result = await this.driveManager.saveISO();
        this.appendOutput(result.message, result.type);
      } catch (error) {
        this.appendOutput(error.message, 'error');
      }
    });

    // Load ISO button
    document.getElementById('loadISOBtn').addEventListener('click', () => {
      this.loadISOModal.classList.add('show');
    });

    // Load ISO confirmation
    document.getElementById('loadISOConfirmBtn').addEventListener('click', () => {
      const fileInput = document.getElementById('isoFileInput');
      const file = fileInput.files[0];
      
      if (file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const result = await this.driveManager.loadISO(e.target.result);
            this.appendOutput(result.message, result.type);
            this.updateFileList();
            this.updateDriveStatus();
            this.loadISOModal.classList.remove('show');
            fileInput.value = '';
          } catch (error) {
            this.appendOutput(error.message, 'error');
          }
        };
        reader.readAsText(file);
      }
    });

    // Load ISO cancel
    document.getElementById('loadISOCancelBtn').addEventListener('click', () => {
      this.loadISOModal.classList.remove('show');
      document.getElementById('isoFileInput').value = '';
    });
  }

  async handleCommand(e) {
    if (e.key === 'Enter') {
      const command = this.commandInput.value.trim();
      
      if (command) {
        this.appendOutput(`MD:\\> ${command}`);
        
        try {
          const result = await this.commandParser.execute(command);
          if (result) {
            this.appendOutput(result.message, result.type || '');
          }
          this.updateFileList();
          this.updateDriveStatus();
        } catch (error) {
          this.appendOutput(error.message, 'error');
        }
        
        this.appendOutput('');
      }
      
      this.commandInput.value = '';
    }
  }

  async handleGenerate() {
    const filename = document.getElementById('filename').value;
    const contentType = document.getElementById('contentType').value;

    if (!filename) {
      alert('Please enter a filename');
      return;
    }

    try {
      const content = await this.generateContent(contentType);
      await this.commandParser.execute(`store ${filename} ${content}`);
      this.updateFileList();
      this.updateDriveStatus();
      this.modal.classList.remove('show');
      document.getElementById('filename').value = '';
    } catch (error) {
      this.appendOutput(error.message, 'error');
    }
  }

  async generateContent(type) {
    try {
      const filename = document.getElementById('filename').value.toLowerCase();
      const isExe = filename.endsWith('.exe');
      const isTextGame = filename.endsWith('.txtg');
      
      const response = await fetch('/api/ai_completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `Generate creative content based on type "${type}". Keep it between 100-300 characters.
          
          ${isExe ? `For executables: Create a program-like format with initialization, processing and completion phases.` 
          : isTextGame ? `For text games (.txtg): Create an initial game state with a compelling start, including scene description and possible actions.
          Example: "You awaken in a mysterious digital realm. Streams of data flow around you like rivers of light. A holographic terminal pulses nearby.
          Available actions: examine surroundings, approach terminal, check inventory"` 
          : `For regular files: Create engaging content matching the type.`}

          Current AI Model: ${this.driveManager.getActiveModel()}

          interface Response {
            content: string;
          }`,
          data: {
            type,
            isExecutable: isExe,
            isTextGame: isTextGame,
            model: this.driveManager.getActiveModel()
          }
        })
      });

      const data = await response.json();
      return data.content;
    } catch (error) {
      console.error('Error generating content:', error);
      throw new Error('Failed to generate content. Please try again.');
    }
  }

  updateFileList() {
    const files = this.driveManager.drive.contents;
    this.fileList.innerHTML = '';

    for (const [name, file] of files) {
      const fileElement = document.createElement('div');
      fileElement.className = 'file-item';
      
      const isExe = name.toLowerCase().endsWith('.exe');
      
      fileElement.innerHTML = `
        <span class="file-name" ${isExe ? 'style="color: #28c940;"' : ''}>${name}</span>
        <span class="file-size">${file.size}MB</span>
      `;
      
      fileElement.addEventListener('click', () => {
        this.commandInput.value = isExe ? `run ${name}` : `type ${name}`;
        this.commandInput.focus();
      });
      
      this.fileList.appendChild(fileElement);
    }
  }

  updateDriveStatus() {
    const { capacity, used, level, exp } = this.driveManager.drive;
    this.driveStatus.textContent = `${used}MB / ${capacity}MB
Level ${level} (${exp}/100 EXP)`;
  }

  appendOutput(text, className = '') {
    const line = document.createElement('div');
    line.className = `output-line ${className}`;
    line.textContent = text;
    this.outputDiv.appendChild(line);
    this.outputDiv.scrollTop = this.outputDiv.scrollHeight;
  }

  showWelcomeMessage() {
    this.appendOutput('Welcome to MakeDrive Terminal v1.0');
    this.appendOutput('Type "help" for a list of available commands.');
    this.appendOutput('TIP: Files ending in .exe can be run using the "run" command');
    this.appendOutput('');
  }
}