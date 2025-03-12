export class Terminal {
  constructor() {
    this.terminalOutput = document.getElementById('terminal-output');
    this.terminalInput = document.getElementById('terminal-input');
    this.setupEventListeners();
    this.commandHistory = [];
    this.historyIndex = -1;
    
    this.commands = {
      help: () => this.showHelp(),
      clear: () => this.clear(),
      jarvis: async (args) => this.askJarvis(args.join(' ')),
      status: () => this.showStatus(),
      version: () => this.print('JARVIS 2159 Terminal v1.0.0'),
      whoami: () => this.print('user@jarvis2159')
    };

    this.print('JARVIS 2159 Terminal [Version 1.0.0]');
    this.print('Type "help" for available commands.\n');
  }

  setupEventListeners() {
    this.terminalInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.handleCommand();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.navigateHistory('up');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.navigateHistory('down');
      }
    });
  }

  async handleCommand() {
    const input = this.terminalInput.value.trim();
    if (!input) return;

    this.commandHistory.push(input);
    this.historyIndex = this.commandHistory.length;

    this.print(`user@jarvis2159:~$ ${input}`, 'command');
    this.terminalInput.value = '';

    const [cmd, ...args] = input.split(' ');

    if (this.commands[cmd]) {
      await this.commands[cmd](args);
    } else {
      this.print(`Command not found: ${cmd}. Type "help" for available commands.`, 'error');
    }

    this.terminalOutput.scrollTop = this.terminalOutput.scrollHeight;
  }

  navigateHistory(direction) {
    if (direction === 'up' && this.historyIndex > 0) {
      this.historyIndex--;
      this.terminalInput.value = this.commandHistory[this.historyIndex];
    } else if (direction === 'down' && this.historyIndex < this.commandHistory.length - 1) {
      this.historyIndex++;
      this.terminalInput.value = this.commandHistory[this.historyIndex];
    } else if (direction === 'down') {
      this.historyIndex = this.commandHistory.length;
      this.terminalInput.value = '';
    }
  }

  print(text, type = 'output') {
    const line = document.createElement('div');
    line.className = type;
    line.textContent = text;
    this.terminalOutput.appendChild(line);
  }

  clear() {
    this.terminalOutput.innerHTML = '';
  }

  showHelp() {
    const help = `
Available commands:
  help     - Show this help message
  clear    - Clear the terminal
  jarvis   - Send a message to JARVIS 2159
  status   - Show JARVIS system status
  version  - Show terminal version
  whoami   - Show current user

Usage:
  jarvis <message>    - Example: jarvis what is the meaning of life?
`;
    this.print(help);
  }

  async askJarvis(message) {
    if (!message) {
      this.print('Usage: jarvis <message>', 'error');
      return;
    }

    try {
      const response = await fetch('/api/ai_completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          prompt: `You are JARVIS 2159 responding through a terminal interface. Keep responses concise and technical.
          
          <typescript-interface>
          interface Response {
            message: string;
          }
          </typescript-interface>
          
          <example>
          {
            "message": "Analysis complete. Processing power optimization achieved. Current efficiency: 98.7%"
          }
          </example>`,
          data: message
        }),
      });
      const data = await response.json();
      this.print(`JARVIS> ${data.message}`);
    } catch (error) {
      this.print('Error connecting to JARVIS neural network.', 'error');
    }
  }

  showStatus() {
    const status = `
JARVIS 2159 System Status
------------------------
Neural Network: Online
Response Time: 42ms
Memory Usage: 87.2%
Core Systems: Operational
Security: Active
------------------------
`;
    this.print(status);
  }
}