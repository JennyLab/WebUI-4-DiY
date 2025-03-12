import { FileSystem } from './filesystem.js';
import { Commands } from './commands.js';

class Terminal {
  constructor() {
    this.input = document.getElementById('terminal-input');
    this.output = document.getElementById('terminal-output');
    this.fs = new FileSystem();
    this.commands = new Commands(this.fs);
    this.history = [];
    this.historyIndex = -1;
    
    this.setupEventListeners();
    this.printWelcomeMessage();
    this.updatePrompt();
  }

  setupEventListeners() {
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const command = this.input.value;
        this.handleCommand();
        // Clear input and hide it for password prompts
        if (this.commands.sudoPrompt || this.commands.passwordPrompt) {
          this.input.value = '';
          this.input.type = 'password';
        } else {
          this.input.type = 'text';
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (!this.commands.sudoPrompt && !this.commands.passwordPrompt) {
          this.navigateHistory(-1);
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (!this.commands.sudoPrompt && !this.commands.passwordPrompt) {
          this.navigateHistory(1);
        }
      }
    });
  }

  printWelcomeMessage() {
    this.print(`
Welcome to Arch Linux Simulator
Type 'help' for a list of available commands.
`, 'info');
  }

  print(text, className = '') {
    const line = document.createElement('div');
    line.innerHTML = text;
    if (className) line.className = className;
    this.output.appendChild(line);
    this.output.scrollTop = this.output.scrollHeight;
  }

  async handleCommand() {
    const command = this.input.value.trim();
    if (command) {
      this.history.push(command);
      this.historyIndex = this.history.length;
      
      // Don't echo password input
      if (!this.commands.sudoPrompt && !this.commands.passwordPrompt) {
        this.print(`${this.fs.currentUser}@arch:${this.fs.currentPath}$ ${command}`);
      }
      
      try {
        const output = await this.commands.handleInput(command);
        if (output) {
          this.print(output);
        }
      } catch (error) {
        this.print(error.message, 'error');
      }
    }
    
    this.input.value = '';
    // Only show prompt if not in password entry mode
    if (!this.commands.sudoPrompt && !this.commands.passwordPrompt) {
      this.updatePrompt();
    }
  }

  navigateHistory(direction) {
    this.historyIndex += direction;
    
    if (this.historyIndex < 0) {
      this.historyIndex = 0;
    } else if (this.historyIndex > this.history.length) {
      this.historyIndex = this.history.length;
    }
    
    this.input.value = this.history[this.historyIndex] || '';
  }

  updatePrompt() {
    const prompt = document.querySelector('.prompt');
    if (prompt) {
      prompt.textContent = `user@arch:${this.fs.currentPath}$ `;
    }
  }
}

new Terminal();