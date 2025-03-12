export class CommandParser {
  constructor(driveManager) {
    this.driveManager = driveManager;
    this.commands = {
      help: this.help.bind(this),
      store: this.store.bind(this),
      delete: this.delete.bind(this),
      list: this.list.bind(this),
      status: this.status.bind(this),
      rename: this.rename.bind(this),
      type: this.type.bind(this),
      run: this.run.bind(this),
      play: this.play.bind(this),
      model: this.model.bind(this),
      save: this.save.bind(this),
      load: this.load.bind(this)
    };
  }

  async execute(input) {
    const [command, ...args] = input.split(' ');
    
    if (this.commands[command]) {
      return await this.commands[command](args);
    }
    
    throw new Error('Unknown command. Type "help" for available commands.');
  }

  help() {
    const availableFeatures = this.driveManager.availableFeatures;
    let helpText = 'Available commands:\n\n';
    
    helpText += 'help - Show this help message\n';
    helpText += 'model [name] - Show or set AI model (creative/balanced/precise)\n';
    
    if (availableFeatures.includes('store')) {
      helpText += 'store <filename> <content> - Store content in a file\n';
    }
    
    if (availableFeatures.includes('delete')) {
      helpText += 'delete <filename> - Delete a file\n';
    }
    
    helpText += 'list - List all files\n';
    helpText += 'status - Show drive status\n';
    helpText += 'type <filename> - Display file contents\n';
    helpText += 'run <filename.exe> - Execute a program\n';
    helpText += 'play <filename.txtg> [command] - Play a text game\n';
    
    if (availableFeatures.includes('rename')) {
      helpText += 'rename <newname> - Rename the drive (unlocks at level 2)\n';
    }
    helpText += 'save - Save drive contents as .iso file\n';
    helpText += 'load <content> - Load drive from .iso contents\n';
    
    return { message: helpText };
  }

  async store(args) {
    if (args.length < 2) {
      throw new Error('Usage: store <filename> <content>');
    }

    const filename = args[0];
    const content = args.slice(1).join(' ');
    
    return await this.driveManager.store(filename, content);
  }

  delete(args) {
    if (args.length !== 1) {
      throw new Error('Usage: delete <filename>');
    }

    return this.driveManager.delete(args[0]);
  }

  list() {
    return this.driveManager.list();
  }

  status() {
    return this.driveManager.status();
  }

  rename(args) {
    if (args.length !== 1) {
      throw new Error('Usage: rename <newname>');
    }

    return this.driveManager.rename(args[0]);
  }

  type(args) {
    if (args.length !== 1) {
      throw new Error('Usage: type <filename>');
    }

    const filename = args[0];
    const file = this.driveManager.drive.contents.get(filename);
    
    if (!file) {
      throw new Error('File not found');
    }

    return { message: file.content };
  }

  async run(args) {
    if (args.length !== 1) {
      throw new Error('Usage: run <filename.exe>');
    }

    const filename = args[0];
    if (!filename.toLowerCase().endsWith('.exe')) {
      throw new Error('Can only run files with .exe extension');
    }

    return await this.driveManager.runExecutable(filename);
  }

  async play(args) {
    if (args.length < 1) {
      throw new Error('Usage: play <filename.txtg> [command]');
    }

    const filename = args[0];
    const command = args.slice(1).join(' ');
    
    return await this.driveManager.playTextGame(filename, command || null);
  }

  model(args) {
    if (args.length !== 1) {
      const current = this.driveManager.getActiveModel();
      return { 
        message: `Current AI model: ${current}\nAvailable models: creative, balanced, precise\nUse 'model <name>' to switch.`
      };
    }

    return this.driveManager.setActiveModel(args[0]);
  }

  async save() {
    return await this.driveManager.saveISO();
  }

  async load(args) {
    if (args.length < 1) {
      throw new Error('Usage: load <ISO contents>');
    }
    const content = args.join(' ');
    return await this.driveManager.loadISO(content);
  }
}