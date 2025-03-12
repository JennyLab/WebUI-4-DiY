export class DriveManager {
  constructor() {
    this.drive = {
      name: 'MakeDrive',
      level: 1,
      exp: 0,
      capacity: 512, // MB
      used: 0,
      features: ['store', 'delete'],
      contents: new Map(),
      activeAIModel: 'balanced' // New property for AI model
    };
    this.drive.features.push('save'); // Add save feature by default
  }

  get driveName() {
    return this.drive.name;
  }

  get driveLevel() {
    return this.drive.level;
  }

  get driveExp() {
    return this.drive.exp;
  }

  get availableFeatures() {
    return [...this.drive.features];
  }

  async store(filename, content) {
    if (!this.drive.features.includes('store')) {
      throw new Error('Store feature not unlocked');
    }

    const size = this.calculateSize(content);
    
    if (this.drive.used + size > this.drive.capacity) {
      throw new Error('Insufficient drive space');
    }

    this.drive.contents.set(filename, {
      content,
      size
    });
    
    this.drive.used += size;
    await this.gainExp(10);
    
    return { message: `Stored ${filename} (${size}MB)`, type: 'success' };
  }

  delete(filename) {
    if (!this.drive.features.includes('delete')) {
      throw new Error('Delete feature not unlocked');
    }

    if (!this.drive.contents.has(filename)) {
      throw new Error('File not found');
    }

    const file = this.drive.contents.get(filename);
    this.drive.contents.delete(filename);
    this.drive.used -= file.size;

    return { message: `Deleted ${filename}`, type: 'success' };
  }

  list() {
    if (this.drive.contents.size === 0) {
      return { message: 'Drive is empty' };
    }

    let output = 'Directory of MD:\\\n\n';
    for (const [name, file] of this.drive.contents) {
      output += `${name.padEnd(20)} ${file.size}MB\n`;
    }
    output += `\nTotal: ${this.drive.used}MB / ${this.drive.capacity}MB`;
    
    return { message: output };
  }

  status() {
    return {
      message: `Drive Status:
Name: ${this.drive.name}
Level: ${this.drive.level}
EXP: ${this.drive.exp}/100
Capacity: ${this.drive.capacity}MB
Used: ${this.drive.used}MB
Features: ${this.drive.features.join(', ')}`
    };
  }

  calculateSize(content) {
    // Simple size calculation (1MB per 100 characters)
    return Math.max(1, Math.ceil(content.length / 100));
  }

  async gainExp(amount) {
    this.drive.exp += amount;
    
    if (this.drive.exp >= 100) {
      await this.levelUp();
    }
  }

  async levelUp() {
    this.drive.level++;
    this.drive.exp = 0;
    this.drive.capacity *= 1.5;
    
    if (this.drive.level === 2) {
      this.drive.features.push('rename');
    }
    
    return {
      message: `Level Up! Now level ${this.drive.level}\nNew capacity: ${this.drive.capacity}MB`,
      type: 'success'
    };
  }

  rename(newName) {
    if (!this.drive.features.includes('rename')) {
      throw new Error('Rename feature not unlocked (Requires Level 2)');
    }

    this.drive.name = newName;
    return { message: `Drive renamed to ${newName}`, type: 'success' };
  }

  getActiveModel() {
    return this.drive.activeAIModel;
  }

  setActiveModel(model) {
    const validModels = ['creative', 'balanced', 'precise'];
    if (!validModels.includes(model)) {
      throw new Error('Invalid AI model. Choose from: creative, balanced, precise');
    }
    this.drive.activeAIModel = model;
    return { message: `Switched to ${model} AI model`, type: 'success' };
  }

  async runExecutable(filename) {
    if (!this.drive.contents.has(filename)) {
      throw new Error('Executable not found');
    }

    const file = this.drive.contents.get(filename);
    
    try {
      const response = await fetch('/api/ai_completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `You are a virtual computer executing a program. Based on the program's content, simulate its execution and return the output. Keep responses entertaining but concise.
          
          Current AI Model: ${this.drive.activeAIModel}
          - creative: more imaginative and playful responses
          - balanced: mix of creativity and precision
          - precise: focused on accuracy and efficiency
          
          interface Response {
            output: string;
            exitCode: number;
          }
          
          example: {
            "output": "Initializing virtual environment...\nGenerating random story...\nDone! Story saved to memory.",
            "exitCode": 0
          }`,
          data: {
            content: file.content,
            model: this.drive.activeAIModel
          }
        })
      });

      const result = await response.json();
      await this.gainExp(5);
      
      return {
        message: `Running ${filename}...\n\n${result.output}\n\nProgram exited with code ${result.exitCode}`,
        type: result.exitCode === 0 ? 'success' : 'error'
      };
    } catch (error) {
      throw new Error(`Failed to execute ${filename}: ${error.message}`);
    }
  }

  async playTextGame(filename, input = null) {
    if (!this.drive.contents.has(filename)) {
      throw new Error('Game file not found');
    }

    if (!filename.toLowerCase().endsWith('.txtg')) {
      throw new Error('Not a text game file (.txtg)');
    }

    const file = this.drive.contents.get(filename);
    
    try {
      const response = await fetch('/api/ai_completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `You are a text adventure game engine. Process the game content and player input to advance the story.
          If no input is provided, show the initial game state.
          Keep track of game state in the response to maintain continuity.
          
          Current AI Model: ${this.drive.activeAIModel}
          
          interface Response {
            display: string;
            gameState: {
              scene: string;
              inventory: string[];
              variables: Record<string, any>;
            };
            availableCommands: string[];
            isGameOver: boolean;
          }
          
          example: {
            "display": "You stand before an ancient terminal. The screen flickers with an eerie green glow.\nWhat would you like to do?",
            "gameState": {
              "scene": "terminal_room",
              "inventory": ["keycard"],
              "variables": {"security_level": 1}
            },
            "availableCommands": ["examine terminal", "use keycard", "go back"],
            "isGameOver": false
          }`,
          data: {
            content: file.content,
            playerInput: input,
            model: this.drive.activeAIModel
          }
        })
      });

      const result = await response.json();
      
      if (!input) {
        await this.gainExp(2); // Small exp for starting a game
      }
      
      return {
        message: `${result.display}\n\nAvailable commands: ${result.availableCommands.join(', ')}`,
        type: 'game',
        gameState: result.gameState,
        isGameOver: result.isGameOver
      };
    } catch (error) {
      throw new Error(`Failed to process game: ${error.message}`);
    }
  }

  async saveISO() {
    // Create ISO contents as JSON
    const isoContents = {
      driveInfo: {
        name: this.drive.name,
        level: this.drive.level,
        exp: this.drive.exp,
        capacity: this.drive.capacity,
        used: this.drive.used,
        features: this.drive.features,
        activeAIModel: this.drive.activeAIModel
      },
      files: Array.from(this.drive.contents.entries()).map(([name, data]) => ({
        name,
        content: data.content,
        size: data.size
      }))
    };

    // Convert to Blob
    const blob = new Blob([JSON.stringify(isoContents, null, 2)], {
      type: 'application/json'
    });

    // Create download URL
    const url = URL.createObjectURL(blob);
    
    // Create and trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.drive.name.replace(/\s+/g, '_')}.iso`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    await this.gainExp(15); // Gain exp for saving
    return { message: `Drive contents saved to ${this.drive.name}.iso`, type: 'success' };
  }

  async loadISO(fileContent) {
    try {
      const isoData = JSON.parse(fileContent);
      
      // Validate ISO format
      if (!isoData.driveInfo || !isoData.files) {
        throw new Error('Invalid ISO format');
      }

      // Restore drive info
      this.drive.name = isoData.driveInfo.name;
      this.drive.level = isoData.driveInfo.level;
      this.drive.exp = isoData.driveInfo.exp;
      this.drive.capacity = isoData.driveInfo.capacity;
      this.drive.features = isoData.driveInfo.features;
      this.drive.activeAIModel = isoData.driveInfo.activeAIModel || 'balanced';

      // Clear existing contents
      this.drive.contents.clear();
      this.drive.used = 0;

      // Restore files
      for (const file of isoData.files) {
        await this.store(file.name, file.content);
      }

      return { message: 'Drive restored from ISO successfully', type: 'success' };
    } catch (error) {
      throw new Error(`Failed to load ISO: ${error.message}`);
    }
  }
}