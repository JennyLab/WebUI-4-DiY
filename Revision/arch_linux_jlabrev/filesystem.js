export class FileSystem {
  constructor() {
    // Add user authentication data
    this.users = {
      root: {
        password: 'root',
        sudo: true
      },
      user: {
        password: null,
        sudo: false
      }
    };
    
    this.currentUser = 'user';
    this.authenticated = false;

    this.root = {
      type: 'dir',
      name: '/',
      children: {
        bin: {
          type: 'dir',
          name: 'bin',
          children: {
            'bash': { type: 'file', name: 'bash', content: '#!/bin/bash' },
            'ls': { type: 'file', name: 'ls', content: '#!/bin/bash' },
            'cd': { type: 'file', name: 'cd', content: '#!/bin/bash' }
          }
        },
        boot: {
          type: 'dir',
          name: 'boot',
          children: {
            'initramfs-linux.img': { type: 'file', name: 'initramfs-linux.img', content: 'binary content' },
            'vmlinuz-linux': { type: 'file', name: 'vmlinuz-linux', content: 'binary content' }
          }
        },
        dev: {
          type: 'dir',
          name: 'dev',
          children: {
            'sda': { type: 'file', name: 'sda', content: 'block device' },
            'sda1': { type: 'file', name: 'sda1', content: 'block device' },
            'null': { type: 'file', name: 'null', content: '' }
          }
        },
        etc: {
          type: 'dir',
          name: 'etc',
          children: {
            'fstab': { type: 'file', name: 'fstab', content: '# /etc/fstab' },
            'passwd': { type: 'file', name: 'passwd', content: 'root:x:0:0::/root:/bin/bash' },
            'pacman.conf': { type: 'file', name: 'pacman.conf', content: '# Pacman config file' },
            'hostname': { type: 'file', name: 'hostname', content: 'archlinux' }
          }
        },
        home: {
          type: 'dir',
          name: 'home',
          children: {
            user: {
              type: 'dir',
              name: 'user',
              children: {
                'Documents': {
                  type: 'dir',
                  name: 'Documents',
                  children: {
                    'welcome.txt': {
                      type: 'file',
                      name: 'welcome.txt',
                      content: 'Welcome to Arch Linux Simulator!\n'
                    }
                  }
                },
                'Downloads': {
                  type: 'dir',
                  name: 'Downloads',
                  children: {}
                },
                'Pictures': {
                  type: 'dir',
                  name: 'Pictures',
                  children: {}
                },
                '.bashrc': {
                  type: 'file',
                  name: '.bashrc',
                  content: '# ~/.bashrc'
                },
                '.config': {
                  type: 'dir',
                  name: '.config',
                  children: {}
                }
              }
            }
          }
        },
        lib: {
          type: 'dir',
          name: 'lib',
          children: {
            'modules': { type: 'dir', name: 'modules', children: {} }
          }
        },
        mnt: {
          type: 'dir',
          name: 'mnt',
          children: {}
        },
        opt: {
          type: 'dir',
          name: 'opt',
          children: {}
        },
        proc: {
          type: 'dir',
          name: 'proc',
          children: {
            'cpuinfo': { type: 'file', name: 'cpuinfo', content: 'processor information' },
            'meminfo': { type: 'file', name: 'meminfo', content: 'memory information' }
          }
        },
        root: {
          type: 'dir',
          name: 'root',
          children: {
            '.bashrc': { type: 'file', name: '.bashrc', content: '# root\'s bashrc' }
          }
        },
        run: {
          type: 'dir',
          name: 'run',
          children: {}
        },
        sbin: {
          type: 'dir',
          name: 'sbin',
          children: {
            'init': { type: 'file', name: 'init', content: '#!/bin/bash' }
          }
        },
        srv: {
          type: 'dir',
          name: 'srv',
          children: {}
        },
        sys: {
          type: 'dir',
          name: 'sys',
          children: {}
        },
        tmp: {
          type: 'dir',
          name: 'tmp',
          children: {}
        },
        usr: {
          type: 'dir',
          name: 'usr',
          children: {
            'bin': { type: 'dir', name: 'bin', children: {} },
            'lib': { type: 'dir', name: 'lib', children: {} },
            'share': { type: 'dir', name: 'share', children: {} }
          }
        },
        var: {
          type: 'dir',
          name: 'var',
          children: {
            'log': { type: 'dir', name: 'log', children: {} },
            'cache': { type: 'dir', name: 'cache', children: {} }
          }
        }
      }
    };
    
    this.currentDir = this.root.children.home.children.user;
    this.currentPath = '/home/user';
    this.authenticated = false;
    this.initializeWebSimScripts();
  }

  validatePassword(username, password) {
    return this.users[username] && this.users[username].password === password;
  }

  hasSudoAccess(username) {
    return this.users[username] && this.users[username].sudo;
  }

  setPassword(username, password) {
    if (this.users[username]) {
      this.users[username].password = password;
    }
  }

  async initializeWebSimScripts() {
    // Add example script showcasing websim.ai integration
    this.currentDir.children['websim-demo.js'] = {
      type: 'file',
      name: 'websim-demo.js',
      content: `
// Example script for websim.ai integration
console.log('Welcome to WebSim Integration Demo!');

// Create a new script
terminal.commands.touch(['my-script.js']);
terminal.print('Created new script file');

// You can share scripts using the share command:
// terminal.commands.share(['my-script.js']);

// And load shared scripts using the load command:
// terminal.commands.load(['script-id']);
      `.trim()
    };
  }

  resolvePath(path) {
    if (!path || path === '.') return this.currentDir;
    
    // Handle parent directory
    if (path === '..') {
      const parentPath = this.currentPath.split('/').slice(0, -1).join('/') || '/';
      const parent = this.resolveAbsolutePath(parentPath);
      return parent;
    }
    
    // Handle absolute vs relative paths
    return path.startsWith('/') ? 
      this.resolveAbsolutePath(path) : 
      this.resolveRelativePath(path);
  }

  resolveAbsolutePath(path) {
    const parts = path.split('/').filter(p => p);
    let current = this.root;
    
    if (path === '/') return current;
    
    for (const part of parts) {
      if (!current.children || !current.children[part]) {
        throw new Error(`Path not found: ${path}`);
      }
      current = current.children[part];
    }
    
    return current;
  }

  resolveRelativePath(path) {
    const parts = path.split('/').filter(p => p);
    let current = this.currentDir;
    
    for (const part of parts) {
      if (part === '..') {
        // Go up one directory
        const parentPath = this.currentPath.split('/').slice(0, -1).join('/') || '/';
        current = this.resolveAbsolutePath(parentPath);
      } else if (part === '.') {
        // Stay in current directory
        continue;
      } else {
        if (!current.children || !current.children[part]) {
          throw new Error(`Path not found: ${path}`);
        }
        current = current.children[part];
      }
    }
    
    return current;
  }

  navigateToPath(path) {
    if (!path) {
      // Default to home directory if no path provided
      this.currentDir = this.resolveAbsolutePath('/home/user');
      this.currentPath = '/home/user';
      return this.currentDir;
    }

    const target = this.resolvePath(path);
    
    if (target.type !== 'dir') {
      throw new Error(`Not a directory: ${path}`);
    }

    // Update current path based on whether the input was absolute or relative
    if (path.startsWith('/')) {
      this.currentPath = path;
    } else {
      // Handle relative path navigation
      const parts = path.split('/').filter(p => p);
      let newPath = [...this.currentPath.split('/').filter(p => p)];
      
      for (const part of parts) {
        if (part === '..') {
          newPath.pop();
        } else if (part !== '.') {
          newPath.push(part);
        }
      }
      
      this.currentPath = '/' + newPath.join('/');
    }

    this.currentDir = target;
    return target;
  }

  createDir(name) {
    if (this.currentDir.children[name]) {
      throw new Error(`Directory already exists: ${name}`);
    }
    this.currentDir.children[name] = {
      type: 'dir',
      name,
      children: {}
    };
  }

  async createFile(name, content = '') {
    if (this.currentDir.children[name]) {
      throw new Error(`File already exists: ${name}`);
    }
    
    // Create virtual file
    this.currentDir.children[name] = {
      type: 'file',
      name,
      content,
      lastModified: new Date()
    };
  }
}