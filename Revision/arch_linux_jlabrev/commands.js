export class Commands {
  constructor(fs) {
    this.fs = fs;
    this.packages = {
      gnome: { installed: false, size: '2.1GB' },
      kde: { installed: false, size: '3.2GB' },
      xfce: { installed: false, size: '1.5GB' },
      firefox: { installed: false, size: '200MB' }
    };
    this.scriptRunner = new ScriptRunner(this);
    this.websimBaseUrl = 'https://websim.ai';
    this.networkStatus = {
      connected: true,
      latency: () => Math.floor(Math.random() * 20 + 10), // Random latency between 10-30ms
      packetLoss: () => Math.random() < 0.02 // 2% packet loss chance
    };
    this.sudoPrompt = null;
    this.pendingSudoCommand = null;
    this.passwordPrompt = null;
  }

  help() {
    return `
Available commands:
  ls      - List directory contents
  cd      - Change directory
  pwd     - Print working directory
  cat     - Display file contents
  mkdir   - Create directory
  touch   - Create empty file
  echo    - Display a line of text
  clear   - Clear terminal screen
  pacman  - Package manager
  ping    - Send ICMP ECHO_REQUEST to network hosts
  help    - Display this help message
  run     - Run a script
  share   - Share a script on websim.ai
  load    - Load a shared script from websim.ai
  passwd  - Change password
  sudo    - Run a command with superuser privileges
  rm      - Remove a file or directory
  nano    - Edit a file
  htop    - Display system resource usage
`.trim();
  }

  ls(args) {
    try {
      const targetDir = args.length ? this.fs.resolvePath(args[0]) : this.fs.currentDir;
      if (targetDir.type !== 'dir') {
        throw new Error(`ls: ${args[0]}: Not a directory`);
      }
      
      const entries = Object.values(targetDir.children);
      const output = entries.map(entry => {
        const isDir = entry.type === 'dir';
        const color = isDir ? 'info' : '';
        const permissions = isDir ? 'drwxr-xr-x' : '-rw-r--r--';
        const size = isDir ? '-' : (entry.content?.length || 0);
        const date = new Date().toLocaleString('en-US', { 
          month: 'short', 
          day: '2-digit', 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        
        return `<span class="${color}">${permissions} user user ${size.toString().padStart(8)} ${date} ${entry.name}${isDir ? '/' : ''}</span>`;
      });
      
      return output.join('\n');
    } catch (error) {
      throw new Error(`ls: ${error.message}`);
    }
  }

  cd(args) {
    try {
      this.fs.navigateToPath(args[0] || '/home/user');
    } catch (error) {
      throw new Error(`cd: ${error.message}`);
    }
  }

  pwd() {
    return this.fs.currentPath || '/';
  }

  cat(args) {
    if (!args.length) {
      throw new Error('cat: missing file operand');
    }
    try {
      const file = this.fs.resolvePath(args[0]);
      if (file.type !== 'file') {
        throw new Error(`cat: ${args[0]}: Is a directory`);
      }
      return file.content;
    } catch (error) {
      throw new Error(`cat: ${error.message}`);
    }
  }

  mkdir(args) {
    if (!args.length) {
      throw new Error('mkdir: missing operand');
    }
    try {
      this.fs.createDir(args[0]);
    } catch (error) {
      throw new Error(`mkdir: ${error.message}`);
    }
  }

  touch(args) {
    if (!args.length) {
      throw new Error('touch: missing file operand');
    }
    try {
      this.fs.createFile(args[0]);
    } catch (error) {
      throw new Error(`touch: ${error.message}`);
    }
  }

  echo(args) {
    return args.join(' ');
  }

  clear() {
    document.getElementById('terminal-output').innerHTML = '';
  }

  pacman(args) {
    if (['-S', '--sync', '-R', '--remove'].includes(args[0])) {
      const needsSudo = !this.fs.authenticated && !this.fs.hasSudoAccess(this.fs.currentUser);
      if (needsSudo) {
        this.pendingSudoCommand = ['pacman', ...args];
        return this.sudo(['pacman', ...args]);
      }
    }

    if (!args.length) {
      throw new Error('pacman: no operation specified (use -h for help)');
    }

    const flag = args[0];
    const package_name = args[1];

    switch (flag) {
      case '-h':
      case '--help':
        return `
pacman package manager
Usage: pacman <operation> [...]
Operations:
    -S, --sync       - install package
    -R, --remove     - remove package
    -Q, --query      - query installed packages
    -h, --help       - display this help message
        `.trim();

      case '-S':
      case '--sync':
        if (!package_name) {
          throw new Error('pacman: no target specified');
        }
        return this.installPackage(package_name);

      case '-R':
      case '--remove':
        if (!package_name) {
          throw new Error('pacman: no target specified');
        }
        return this.removePackage(package_name);

      case '-Q':
      case '--query':
        return this.queryPackages();

      default:
        throw new Error(`pacman: invalid option '${flag}'`);
    }
  }

  async installPackage(name) {
    if (!this.packages[name]) {
      throw new Error(`pacman: target not found: ${name}`);
    }
    
    if (this.packages[name].installed) {
      return `warning: ${name} is already installed`;
    }

    // Disable input during installation
    const terminal = document.getElementById('terminal-input');
    terminal.disabled = true;

    // Show initial package resolution
    let output = `
resolving dependencies...
looking for conflicting packages...

Packages (1) ${name}-latest

Total Download Size: ${this.packages[name].size}
Total Installed Size: ${this.packages[name].size}

:: Proceed with installation? [Y/n] `;

    // Wait for simulated user input
    await new Promise(resolve => setTimeout(resolve, 1500));
    output += 'y\n\n';

    // Simulate repository sync
    output += `:: Synchronizing package databases...
 core           684.5 KiB   989K/s 00:01 [##################] 100%
 extra         1643.8 KiB  1124K/s 00:01 [##################] 100%
 community     5.7   MiB   2.1M/s 00:03 [##################] 100%\n\n`;

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulate package download with progress bar
    output += `:: Starting download...\n`;
    const totalSize = parseInt(this.packages[name].size.replace('MB', '').replace('GB', '000'));
    const chunks = 20;
    
    for (let i = 1; i <= chunks; i++) {
      const progress = Math.floor((i / chunks) * 100);
      const downloadedSize = ((totalSize * i) / chunks).toFixed(1);
      const speed = Math.floor(Math.random() * 1000 + 500);
      const timeLeft = Math.floor((chunks - i) / 2);
      
      output += `\r${name}-latest  ${downloadedSize}MB  ${speed}K/s ${timeLeft.toString().padStart(2, '0')}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')} [`;
      output += '#'.repeat(Math.floor(progress / 5)).padEnd(20, ' ');
      output += `] ${progress}%`;
      
      // Print current progress
      document.getElementById('terminal-output').lastChild.innerHTML = output;
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Show dependencies being installed
    const dependencies = {
      gnome: [
        'gdm-4.0.1', 'gnome-shell-45.1', 'gnome-control-center-45.1', 
        'gnome-terminal-3.50.1', 'nautilus-45.1', 'gnome-system-monitor-45.0.2', 
        'gnome-tweaks-45.0'
      ],
      kde: [
        'sddm-0.20.0', 'plasma-desktop-5.27.9', 'dolphin-23.08.3', 
        'konsole-23.08.3', 'systemsettings-5.27.9', 'plasma-nm-5.27.9', 
        'plasma-pa-5.27.9'
      ],
      xfce: [
        'xfce4-session-4.18.3', 'xfwm4-4.18.0', 'xfce4-panel-4.18.4', 
        'thunar-4.18.8', 'xfce4-terminal-1.1.1', 'xfce4-settings-4.18.3', 
        'xfce4-power-manager-4.18.2'
      ],
      firefox: [
        'gtk3-3.24.38', 'libdbus-1.15.6', 'ffmpeg-6.0', 'sqlite-3.43.2',
        'firefox-119.0.1', 'firefox-ublock-origin-1.54.0'
      ]
    };

    if (dependencies[name]) {
      output += '\n\n:: Installing dependencies...\n';
      for (const dep of dependencies[name]) {
        output += `\n(${dependencies[name].indexOf(dep) + 1}/${dependencies[name].length}) installing ${dep}`;
        document.getElementById('terminal-output').lastChild.innerHTML = output;
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Show package verification
        output += '\n    Verifying package integrity...';
        output += '\n    Checking SHA256 sums...';
        output += '\n    Processing package changes...';
        document.getElementById('terminal-output').lastChild.innerHTML = output;
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    // Post-installation steps
    output += '\n\n:: Running post-installation hooks...\n';
    const postInstallSteps = [
      '(1/7) Updating icon theme caches...',
      '(2/7) Updating desktop database...',
      '(3/7) Updating mime database...',
      '(4/7) Updating module dependencies...',
      '(5/7) Updating system configurations...',
      '(6/7) Updating desktop environment settings...',
      '(7/7) Reloading system services...'
    ];

    for (const step of postInstallSteps) {
      output += step + '\n';
      document.getElementById('terminal-output').lastChild.innerHTML = output;
      await new Promise(resolve => setTimeout(resolve, 400));
    }

    this.packages[name].installed = true;
    
    // Apply desktop environment if applicable
    if (['gnome', 'kde', 'xfce'].includes(name)) {
      this.applyDesktopEnvironment(name);
      if (!window.windowManager) {
        window.windowManager = new WindowManager();
        window.browser = new Browser(window.windowManager);
      }
    } else if (name === 'firefox') {
      if (!window.browser) {
        throw new Error('pacman: desktop environment must be installed first');
      }
      window.browser.createBrowserWindow();
    }

    // Re-enable input and reset terminal state after installation
    terminal.disabled = false;
    terminal.focus();

    // Simulate quick system reboot after package installation
    output += '\n:: Package installed. System needs to reboot to apply changes.\n';
    output += 'Rebooting system...\n\n';

    // Show reboot sequence
    const rebootSteps = [
      'Stopping system services...',
      'Unmounting filesystems...',
      'Syncing disks...',
      'Rebooting...'
    ];

    for (const step of rebootSteps) {
      output += step + '\n';
      document.getElementById('terminal-output').lastChild.innerHTML = output;
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Clear terminal but preserve installation output
    const savedOutput = document.getElementById('terminal-output').innerHTML;
    document.getElementById('terminal-output').innerHTML = '';

    // Show boot sequence
    const bootSteps = [
      '[  OK  ] Started Show Plymouth Boot Screen',
      '[  OK  ] Reached target Local File Systems',
      '[  OK  ] Started udev Kernel Device Manager',
      '[  OK  ] Reached target Sound Card',
      '[  OK  ] Started Network Manager',
      `[  OK  ] Started ${name.toUpperCase()} Desktop Environment`,
      '[  OK  ] Reached target Graphical Interface',
      'Starting Arch Linux...\n'
    ];

    for (const step of bootSteps) {
      document.getElementById('terminal-output').innerHTML += step + '\n';
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Restore previous output with installation logs
    document.getElementById('terminal-output').innerHTML += 
      '<div class="info">Previous session logs:</div>\n' +
      '<div class="previous-logs" style="opacity: 0.8">' + savedOutput + '</div>\n' +
      '<div class="info">System rebooted successfully. All services started.</div>\n';

    // Apply desktop environment if applicable
    if (['gnome', 'kde', 'xfce'].includes(name)) {
      this.applyDesktopEnvironment(name);
      if (!window.windowManager) {
        window.windowManager = new WindowManager();
        window.browser = new Browser(window.windowManager);
      }
    } else if (name === 'firefox') {
      if (!window.browser) {
        throw new Error('pacman: desktop environment must be installed first');
      }
      window.browser.createBrowserWindow();
    }

    // Re-focus terminal
    terminal.focus();

    return output;
  }

  getPackageDescription(name) {
    const descriptions = {
      gnome: 'A free and open-source desktop environment for Unix-like operating systems',
      kde: 'A powerful and highly customizable desktop environment',
      xfce: 'A lightweight desktop environment for UNIX-like operating systems',
      firefox: 'Standalone web browser from mozilla.org'
    };
    return descriptions[name] || 'No description available';
  }

  removePackage(name) {
    if (!this.packages[name]) {
      throw new Error(`pacman: target not found: ${name}`);
    }

    if (!this.packages[name].installed) {
      throw new Error(`pacman: package '${name}' is not installed`);
    }

    this.packages[name].installed = false;
    return `
checking dependencies...
:: Remove ${name}? [Y/n] y
removing ${name}...
`.trim();
  }

  queryPackages() {
    const installed = Object.entries(this.packages)
      .filter(([, pkg]) => pkg.installed)
      .map(([name]) => name);
    
    if (installed.length === 0) {
      return 'no packages installed';
    }
    
    return installed.join('  ');
  }

  async ping(args) {
    if (!args.length) {
      throw new Error('ping: missing host operand');
    }

    const host = args[0];
    const packets = args.includes('-c') ? 
      parseInt(args[args.indexOf('-c') + 1]) : 
      4; // Default to 4 packets if -c not specified

    if (isNaN(packets) || packets < 1) {
      throw new Error('ping: invalid packet count');
    }

    // Initial message
    let output = `PING ${host} (${this.generateRandomIP()}): 56 data bytes\n`;
    
    let successfulPings = 0;
    let totalLatency = 0;
    
    // Simulate ping process
    for (let i = 0; i < packets; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between pings
      
      if (!this.networkStatus.connected) {
        output += `Request timeout for icmp_seq ${i + 1}\n`;
        continue;
      }

      if (this.networkStatus.packetLoss()) {
        output += `Request timeout for icmp_seq ${i + 1}\n`;
        continue;
      }

      const latency = this.networkStatus.latency();
      totalLatency += latency;
      successfulPings++;
      
      output += `64 bytes from ${host} (${this.generateRandomIP()}): icmp_seq=${i + 1} ttl=64 time=${latency}.${Math.floor(Math.random() * 1000)} ms\n`;
    }

    // Add statistics
    const packetLoss = ((packets - successfulPings) / packets * 100).toFixed(1);
    const avgLatency = (totalLatency / successfulPings).toFixed(3);
    
    output += `\n--- ${host} ping statistics ---\n`;
    output += `${packets} packets transmitted, ${successfulPings} packets received, ${packetLoss}% packet loss\n`;
    if (successfulPings > 0) {
      output += `round-trip min/avg/max = ${Math.min(totalLatency, avgLatency)}/${avgLatency}/${Math.max(totalLatency, avgLatency)} ms`;
    }

    return output;
  }

  generateRandomIP() {
    return Array(4).fill(0).map(() => Math.floor(Math.random() * 256)).join('.');
  }

  async run(args) {
    if (!args.length) {
      throw new Error('run: missing file operand');
    }
    
    try {
      const file = this.fs.resolvePath(args[0]);
      if (file.type !== 'file') {
        throw new Error(`run: ${args[0]}: Is a directory`);
      }
      
      const extension = file.name.split('.').pop();
      if (extension !== 'js') {
        throw new Error('run: only .js files are supported');
      }
      
      return await this.scriptRunner.execute(file.content);
    } catch (error) {
      throw new Error(`run: ${error.message}`);
    }
  }

  async share(args) {
    if (!args.length) {
      throw new Error('share: missing file operand');
    }
    
    try {
      const file = this.fs.resolvePath(args[0]);
      if (file.type !== 'file') {
        throw new Error(`share: ${args[0]}: Is a directory`);
      }
      
      const response = await fetch(`${this.websimBaseUrl}/api/scripts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: file.name,
          content: file.content
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to share script');
      }
      
      const data = await response.json();
      return `Script shared successfully! Access it at: ${this.websimBaseUrl}/s/${data.id}`;
    } catch (error) {
      throw new Error(`share: ${error.message}`);
    }
  }

  async load(args) {
    if (!args.length) {
      throw new Error('load: missing script ID');
    }
    
    try {
      const scriptId = args[0];
      const response = await fetch(`${this.websimBaseUrl}/api/scripts/${scriptId}`);
      
      if (!response.ok) {
        throw new Error('Script not found');
      }
      
      const data = await response.json();
      await this.fs.createFile(data.name, data.content);
      return `Script '${data.name}' loaded successfully!`;
    } catch (error) {
      throw new Error(`load: ${error.message}`);
    }
  }

  applyDesktopEnvironment(name) {
    document.querySelectorAll('.desktop-shell').forEach(shell => {
      shell.classList.add('hidden');
    });
    
    const shell = document.getElementById(`${name}-shell`);
    if (shell) {
      shell.classList.remove('hidden');
    }
  }

  sudo(args) {
    if (!args.length) {
      throw new Error('sudo: no command specified');
    }

    if (!this.fs.users[this.fs.currentUser].password) {
      throw new Error('sudo: password not set. Please set password using passwd command');
    }

    this.sudoPrompt = {
      command: args,
      attempts: 0
    };
    
    return '[sudo] password for ' + this.fs.currentUser + ':';
  }

  handleInput(input) {
    if (this.sudoPrompt) {
      this.sudoPrompt.attempts++;
      
      if (!this.fs.validatePassword(this.fs.currentUser, input)) {
        if (this.sudoPrompt.attempts >= 3) {
          this.sudoPrompt = null;
          throw new Error('sudo: 3 incorrect password attempts');
        }
        return '[sudo] password for ' + this.fs.currentUser + ':';
      }

      // Store authentication state
      this.fs.authenticated = true;
      
      // Get the stored command
      const command = this.sudoPrompt.command;
      this.sudoPrompt = null;

      // Execute the command
      const result = this.execute(command);
      
      // Clear authentication after command execution
      this.fs.authenticated = false;
      
      return result;
    }

    if (this.passwordPrompt) {
      return this.passwd([input]);
    }

    // Normal command execution
    const [cmd, ...args] = input.split(' ');
    return this.execute([cmd, ...args]);
  }

  execute(args) {
    const [cmd, ...cmdArgs] = args;
    if (this[cmd]) {
      return this[cmd](cmdArgs);
    }
    throw new Error(`Command not found: ${cmd}`);
  }

  passwd(args) {
    if (this.passwordPrompt) {
      // Handle password change flow
      if (this.passwordPrompt.stage === 'current') {
        if (!this.fs.validatePassword(this.fs.currentUser, args[0])) {
          throw new Error('passwd: Authentication failure');
        }
        this.passwordPrompt.stage = 'new';
        return 'Enter new password:';
      } else if (this.passwordPrompt.stage === 'new') {
        this.passwordPrompt.newPassword = args[0];
        this.passwordPrompt.stage = 'confirm';
        return 'Confirm new password:';
      } else if (this.passwordPrompt.stage === 'confirm') {
        if (args[0] !== this.passwordPrompt.newPassword) {
          throw new Error('passwd: Password unchanged - passwords do not match');
        }
        this.fs.setPassword(this.fs.currentUser, args[0]);
        this.passwordPrompt = null;
        return 'passwd: password updated successfully';
      }
    } else {
      // Start password change flow
      if (this.fs.users[this.fs.currentUser].password) {
        this.passwordPrompt = { stage: 'current' };
        return 'Current password:';
      } else {
        this.passwordPrompt = { stage: 'new' };
        return 'Enter new password:';
      }
    }
  }

  nano(args) {
    if (!args.length) {
      throw new Error('nano: no file specified');
    }

    const filename = args[0];
    let file;

    try {
      file = this.fs.resolvePath(filename);
    } catch (error) {
      // If file doesn't exist, create it
      file = { type: 'file', name: filename, content: '' };
      this.fs.currentDir.children[filename] = file;
    }

    if (file.type !== 'file') {
      throw new Error('nano: cannot edit directory');
    }

    // Create nano editor interface
    const terminal = document.getElementById('terminal');
    const nanoEditor = document.createElement('div');
    nanoEditor.className = 'nano-editor';
    nanoEditor.innerHTML = `
      <div class="nano-content" contenteditable="true">${file.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
      <div class="nano-status-bar">
        <div class="nano-filename">File: ${filename}</div>
        <div class="nano-shortcuts">
          ^G Get Help    ^O WriteOut    ^W Where Is    ^K Cut Text    ^J Justify     ^C Cur Pos     ^Y Prev Page
          ^X Exit        ^R Read File   ^\ Replace     ^U Paste Text  ^T To Spell    ^_ Go To Line  ^V Next Page
        </div>
      </div>
    `;

    // Hide terminal input and store original content
    const terminalContent = terminal.querySelector('.window-content').innerHTML;
    terminal.querySelector('.window-content').innerHTML = '';
    terminal.querySelector('.window-content').appendChild(nanoEditor);

    // Focus editor
    const editor = nanoEditor.querySelector('.nano-content');
    editor.focus();

    // Handle keyboard shortcuts
    const handleNanoKeyboard = (e) => {
      if (e.ctrlKey) {
        switch (e.key.toLowerCase()) {
          case 'x': // Exit
            e.preventDefault();
            // Save changes
            file.content = editor.innerText;
            // Restore terminal
            terminal.querySelector('.window-content').innerHTML = terminalContent;
            document.removeEventListener('keydown', handleNanoKeyboard);
            // Focus terminal input
            document.getElementById('terminal-input').focus();
            break;
          
          case 'o': // Write Out
            e.preventDefault();
            file.content = editor.innerText;
            const saveMsg = document.createElement('div');
            saveMsg.className = 'nano-message';
            saveMsg.textContent = `Saved ${filename}`;
            nanoEditor.appendChild(saveMsg);
            setTimeout(() => saveMsg.remove(), 1500);
            break;

          case 'g': // Help
            e.preventDefault();
            const helpContent = `
              Nano Help Text

              The nano editor is a small and friendly text editor. Here are the basic commands:

              ^G (F1)          - Display this help text
              ^O (F3)          - Write the current file to disk
              ^X (F2)          - Exit from nano
              ^K               - Cut the current line into the cutbuffer
              ^U               - Paste the cutbuffer into the current line
              Arrow keys       - Move around in the file
              Delete/Backspace - Delete characters

              Press ^X to exit help.
            `;
            const currentContent = editor.innerHTML;
            editor.innerHTML = helpContent;
            const exitHelp = (e) => {
              if (e.ctrlKey && e.key.toLowerCase() === 'x') {
                editor.innerHTML = currentContent;
                editor.removeEventListener('keydown', exitHelp);
              }
            };
            editor.addEventListener('keydown', exitHelp);
            break;
        }
      }
    };

    document.addEventListener('keydown', handleNanoKeyboard);
  }

  rm(args) {
    if (!args.length) {
      throw new Error('rm: missing operand');
    }

    const path = args[0];
    const target = this.fs.resolvePath(path);

    // Check if target is a critical system file
    const criticalFiles = [
      '/bin/bash',
      '/bin/ls',
      '/bin/cd',
      '/sbin/init',
      '/etc/passwd',
      '/etc/fstab'
    ];

    const absolutePath = path.startsWith('/') ? path : this.fs.currentPath + '/' + path;
    if (criticalFiles.includes(absolutePath)) {
      // Simulate system crash
      document.body.innerHTML = `
        <div style="background: black; color: white; height: 100vh; padding: 20px; font-family: monospace;">
          <pre>
Kernel panic - not syncing: Attempted to kill system process
CPU: 0 PID: 1 Comm: systemd Not tainted 5.15.0-arch1
Hardware name: System Product Name
Call Trace:
 dump_stack_lvl+0x34/0x44
 panic+0x102/0x26b
 do_exit+0x8b5/0x8c0
 reboot_init+0x0/0x170
 kernel_init+0x14/0x16f
 ret_from_fork+0x22/0x30

System halted.
          </pre>
        </div>
      `;
      throw new Error('FATAL: System halted');
    }

    // Normal file removal logic
    try {
      delete this.fs.currentDir.children[target.name];
      return '';
    } catch (error) {
      throw new Error(`rm: cannot remove '${path}': No such file or directory`);
    }
  }

  htop() {
    // Create htop interface
    const terminal = document.getElementById('terminal');
    const htopInterface = document.createElement('div');
    htopInterface.className = 'htop-interface';
    
    // Store current terminal content
    const terminalContent = terminal.querySelector('.window-content').innerHTML;
    
    // Get actual CPU core count
    const cpuCount = navigator.hardwareConcurrency || 4;
    
    // Initial process data
    const processes = [
      { pid: 1, user: 'root', priority: 20, nice: 0, virt: '128M', res: '40M', cpu: 0.2, mem: 0.5, time: '0:01.20', command: '/sbin/init' },
      { pid: 2, user: 'root', priority: 20, nice: 0, virt: '0B', res: '0B', cpu: 0.0, mem: 0.0, time: '0:00.00', command: 'kthreadd' },
      { pid: 428, user: 'root', priority: 20, nice: 0, virt: '169M', res: '25M', cpu: 0.0, mem: 0.3, time: '0:00.65', command: '/usr/lib/systemd/systemd-journald' },
      { pid: 456, user: 'websim', priority: 20, nice: 0, virt: '286M', res: '82M', cpu: 1.2, mem: 2.1, time: '0:12.33', command: 'node /websim/server.js' },
      { pid: 892, user: 'user', priority: 20, nice: 0, virt: '42M', res: '12M', cpu: 0.0, mem: 0.2, time: '0:00.12', command: 'bash' },
      { pid: 1024, user: 'user', priority: 20, nice: 0, virt: '345M', res: '126M', cpu: 0.8, mem: 3.2, time: '0:05.44', command: 'firefox' }
    ];

    // Initialize performance monitoring
    let lastCPUTimes = new Array(cpuCount).fill(0);
    
    // Function to calculate CPU usage using Performance API
    const calculateCPUUsage = () => {
      const cpuUsage = [];
      const currentTime = performance.now();
      
      for (let i = 0; i < cpuCount; i++) {
        const timeDiff = currentTime - lastCPUTimes[i];
        // Calculate a more realistic CPU usage based on the actual core's work
        const usage = (timeDiff / 100) % 100; // This creates a more realistic pattern
        lastCPUTimes[i] = currentTime;
        cpuUsage.push(usage);
      }
      
      return cpuUsage;
    };

    // Get system memory info
    const getSystemMemory = () => {
      const memory = performance.memory || { totalJSHeapSize: 2048 * 1024 * 1024, usedJSHeapSize: 1024 * 1024 * 1024 };
      return {
        total: Math.floor(memory.totalJSHeapSize / (1024 * 1024)),
        used: Math.floor(memory.usedJSHeapSize / (1024 * 1024))
      };
    };

    const updateHtop = () => {
      const cpuUsage = calculateCPUUsage();
      const memInfo = getSystemMemory();
      const memTotal = 8192; // Fixed total memory for consistency
      const memUsed = Math.min(memTotal, Math.floor(memInfo.used * (memTotal / memInfo.total)));
      const swapUsed = Math.floor(Math.random() * 500);
      const swapTotal = 4096;
      const uptime = Math.floor(performance.now() / 1000);
      const loadAvg = cpuUsage.slice(0, 3).map(usage => usage / 100);

      // Update process stats with more realistic values based on CPU usage
      processes.forEach(proc => {
        proc.cpu = Math.max(0, (cpuUsage[0] / cpuCount) * (Math.random() + 0.5));
        proc.mem = Math.max(0, (memUsed / memTotal) * 100 * Math.random());
        const [mins, secs] = proc.time.split(':');
        const newSecs = parseFloat(secs) + 0.1;
        proc.time = `${mins}:${newSecs.toFixed(2)}`;
      });

      htopInterface.innerHTML = `
        <div class="htop-header">
          <div class="cpu-meters">
            ${cpuUsage.map((usage, i) => `
              <div class="meter">
                CPU${i + 1} [${'|'.repeat(Math.floor(usage / 5))}${' '.repeat(20 - Math.floor(usage / 5))}] ${usage.toFixed(1)}%
              </div>
            `).join('')}
          </div>
          <div class="mem-meter">
            Mem [${('|'.repeat(Math.floor((memUsed / memTotal) * 40)))}${' '.repeat(40 - Math.floor((memUsed / memTotal) * 40))}] ${memUsed}M/${memTotal}M
          </div>
          <div class="swap-meter">
            Swp [${('|'.repeat(Math.floor((swapUsed / swapTotal) * 40)))}${' '.repeat(40 - Math.floor((swapUsed / swapTotal) * 40))}] ${swapUsed}M/${swapTotal}M
          </div>
          <div class="tasks-info">
            Tasks: ${processes.length}, ${processes.filter(p => p.cpu > 0.1).length} running
            Load average: ${loadAvg.map(n => n.toFixed(2)).join(' ')}
            Uptime: ${Math.floor(uptime / 3600)}:${Math.floor((uptime % 3600) / 60)}:${uptime % 60}
          </div>
        </div>
        <div class="htop-processes">
          <div class="process-header">
            PID  USER     PRI  NI   VIRT   RES   CPU%  MEM%  TIME+    COMMAND
          </div>
          ${processes.map(proc => `
            <div class="process-row">
              ${proc.pid.toString().padEnd(5)} 
              ${proc.user.padEnd(8)}
              ${proc.priority.toString().padEnd(4)}
              ${proc.nice.toString().padEnd(4)}
              ${proc.virt.padEnd(6)}
              ${proc.res.padEnd(6)}
              ${proc.cpu.toFixed(1).padEnd(6)}
              ${proc.mem.toFixed(1).padEnd(6)}
              ${proc.time.padEnd(8)}
              ${proc.command}
            </div>
          `).join('')}
        </div>
        <div class="htop-footer">
          F1Help  F2Setup  F3Search  F4Filter  F5Tree  F6SortBy  F7Nice  F8Kill  F9Kill  F10Quit
        </div>
      `;
    };

    // Rest of the htop code remains the same...
    terminal.querySelector('.window-content').innerHTML = '';
    terminal.querySelector('.window-content').appendChild(htopInterface);
    updateHtop();

    const updateInterval = setInterval(updateHtop, 500);

    const handleHtopKeyboard = (e) => {
      if (e.key === 'q' || (e.key === 'F10' || e.keyCode === 121)) {
        clearInterval(updateInterval);
        document.removeEventListener('keydown', handleHtopKeyboard);
        terminal.querySelector('.window-content').innerHTML = terminalContent;
        document.getElementById('terminal-input').focus();
      }
    };

    document.addEventListener('keydown', handleHtopKeyboard);
  }
}

class ScriptRunner {
  constructor(commands) {
    this.commands = commands;
    this.sandbox = {
      console: {
        log: (...args) => this.output.push(args.join(' ')),
        error: (...args) => this.output.push(`Error: ${args.join(' ')}`),
      },
      setTimeout,
      clearTimeout,
      setInterval,
      clearInterval,
      Math,
      Date,
      terminal: {
        print: (text) => this.output.push(text),
        commands: this.commands,
      }
    };
    this.output = [];
  }

  async execute(code) {
    this.output = [];
    
    try {
      const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
      const fn = new AsyncFunction('sandbox', `
        with (sandbox) {
          ${code}
        }
      `);
      
      await fn(this.sandbox);
      return this.output.join('\n');
    } catch (error) {
      throw new Error(`Script execution failed: ${error.message}`);
    }
  }
}