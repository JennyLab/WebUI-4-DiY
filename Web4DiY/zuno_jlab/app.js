class FileSystem {
  constructor() {
    this.files = new Map();
    this.selectedFolder = null;
    
    // Initialize with default files
    this.files.set('/', {
      type: 'folder',
      name: '/',
      children: ['index.html', 'styles.css', 'app.js']
    });
    
    this.files.set('index.html', {
      type: 'file',
      name: 'index.html',
      content: '<!DOCTYPE html>\n<html>\n<head>\n  <title>My Page</title>\n</head>\n<body>\n  \n</body>\n</html>'
    });
    
    this.files.set('styles.css', {
      type: 'file',
      name: 'styles.css',
      content: '/* Add your styles here */\n'
    });
    
    this.files.set('app.js', {
      type: 'file',
      name: 'app.js',
      content: '// Add your JavaScript code here\n'
    });
  }

  createFile(name, parentPath = '/') {
    const path = parentPath === '/' ? name : `${parentPath}/${name}`;
    if (this.files.has(path)) {
      throw new Error('File already exists');
    }

    this.files.set(path, {
      type: 'file',
      name,
      content: ''
    });

    const parent = this.files.get(parentPath);
    parent.children.push(path);
  }

  createFolder(name, parentPath = '/') {
    const path = parentPath === '/' ? name : `${parentPath}/${name}`;
    if (this.files.has(path)) {
      throw new Error('Folder already exists');
    }

    this.files.set(path, {
      type: 'folder',
      name,
      children: []
    });

    const parent = this.files.get(parentPath);
    parent.children.push(path);
  }

  getFile(path) {
    return this.files.get(path);
  }

  updateFile(path, content) {
    const file = this.files.get(path);
    if (file && file.type === 'file') {
      file.content = content;
    }
  }

  deleteFile(path) {
    const file = this.files.get(path);
    if (!file) {
      throw new Error('File not found');
    }

    // If it's a folder, recursively delete all contents
    if (file.type === 'folder') {
      for (const childPath of [...file.children]) {
        this.deleteFile(childPath);
      }
    }

    // Remove from parent's children array
    const parentPath = path.split('/').slice(0, -1).join('/') || '/';
    const parent = this.files.get(parentPath);
    if (parent) {
      parent.children = parent.children.filter(child => child !== path);
    }

    // Delete the file/folder itself
    this.files.delete(path);
  }

  isImage(filename) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  }

  isJson(filename) {
    return filename.toLowerCase().endsWith('.json');
  }
}

class ZunoEditor {
  constructor() {
    this.editors = {};
    this.previewWindow = null;
    this.fileSystem = new FileSystem();
    this.activeEditor = null;
    this.initializeEditors();
    this.setupEventListeners();
    this.renderFileTree();
    this.setupAiSupport();
    this.setupImageViewer();
    
    // Set initial active editor
    this.openFile('index.html');
  }

  initializeEditors() {
    // Initialize HTML editor
    this.editors.html = CodeMirror(document.getElementById('htmlEditor'), {
      mode: 'htmlmixed',
      theme: 'monokai',
      lineNumbers: true,
      autoCloseTags: true,
      autoCloseBrackets: true,
      matchBrackets: true,
      value: this.fileSystem.getFile('index.html').content
    });

    // Initialize CSS editor
    this.editors.css = CodeMirror(document.getElementById('cssEditor'), {
      mode: 'css',
      theme: 'monokai',
      lineNumbers: true,
      autoCloseBrackets: true,
      matchBrackets: true,
      value: this.fileSystem.getFile('styles.css').content
    });

    // Initialize JavaScript editor
    this.editors.js = CodeMirror(document.getElementById('jsEditor'), {
      mode: 'javascript',
      theme: 'monokai',
      lineNumbers: true,
      autoCloseBrackets: true,
      matchBrackets: true,
      value: this.fileSystem.getFile('app.js').content
    });

    // Hide all editors initially
    Object.values(this.editors).forEach(editor => {
      editor.getWrapperElement().parentNode.style.display = 'none';
    });
  }

  setupEventListeners() {
    // Preview button
    document.getElementById('previewBtn').addEventListener('click', () => this.preview());

    // Download button
    document.getElementById('downloadBtn').addEventListener('click', () => this.downloadFiles());
    
    // Settings button
    document.getElementById('settingsBtn').addEventListener('click', () => this.openSettings());
    
    // File system event listeners
    document.getElementById('createFileBtn').addEventListener('click', () => this.createFile());
    document.getElementById('createFolderBtn').addEventListener('click', () => this.createFolder());
    document.getElementById('importBtn').addEventListener('click', () => this.importFiles());
    
    // File tree click handler
    document.getElementById('fileTree').addEventListener('click', (e) => {
      const item = e.target.closest('.file-tree-item');
      if (item) {
        this.handleFileTreeItemClick(item);
      }
    });
  }

  setupAiSupport() {
    document.getElementById('aiBtn').addEventListener('click', () => this.openAiPrompt());
    document.getElementById('closeAi').addEventListener('click', () => {
      document.getElementById('aiModal').classList.remove('active');
    });
    document.getElementById('submitAiPrompt').addEventListener('click', () => this.processAiPrompt());
  }

  setupImageViewer() {
    const imageViewer = document.createElement('div');
    imageViewer.className = 'image-viewer';
    document.querySelector('.editors').appendChild(imageViewer);
    this.imageViewer = imageViewer;
  }

  createFile() {
    const name = prompt('Enter file name:');
    if (!name) return;

    try {
      this.fileSystem.createFile(name, this.fileSystem.selectedFolder || '/');
      this.renderFileTree();
    } catch (error) {
      alert(error.message);
    }
  }

  createFolder() {
    const name = prompt('Enter folder name:');
    if (!name) return;

    try {
      this.fileSystem.createFolder(name, this.fileSystem.selectedFolder || '/');
      this.renderFileTree();
    } catch (error) {
      alert(error.message);
    }
  }

  handleFileTreeItemClick(item) {
    const path = item.dataset.path;
    const file = this.fileSystem.getFile(path);

    // Clear previous selection
    document.querySelectorAll('.file-tree-item').forEach(i => i.classList.remove('selected'));
    item.classList.add('selected');

    if (file.type === 'folder') {
      this.fileSystem.selectedFolder = path;
    } else {
      this.openFile(path);
    }
  }

  openFile(path) {
    // Save current file content before switching
    if (this.activeEditor) {
      const currentPath = document.querySelector('.current-file').textContent.trim().replace(/^\S+\s+/, '');  // Remove icon text
      const file = this.fileSystem.getFile(currentPath);
      if (file && file.type === 'file') {
        file.content = this.activeEditor.getValue();
      }
    }

    const file = this.fileSystem.getFile(path);
    
    // Hide all editors and image viewer first
    Object.values(this.editors).forEach(ed => {
      ed.getWrapperElement().parentNode.style.display = 'none';
    });
    this.imageViewer.style.display = 'none';

    // Update current file display
    const currentFileEl = document.querySelector('.current-file');
    if (currentFileEl) {
      let icon = 'fa-file';
      if (this.fileSystem.isImage(file.name)) {
        icon = 'fa-image';
      } else if (file.name.endsWith('.html')) {
        icon = 'fa-file-lines';
      } else if (file.name.endsWith('.css')) {
        icon = 'fa-cloud';
      } else if (file.name.endsWith('.js')) {
        icon = 'fa-code';
      } else if (this.fileSystem.isJson(file.name)) {
        icon = 'fa-brackets-curly';
      }
      currentFileEl.innerHTML = `<i class="fas ${icon}"></i>${path}`;
    }

    if (this.fileSystem.isImage(file.name)) {
      // Display image
      this.imageViewer.style.display = 'block';
      this.imageViewer.innerHTML = `<img src="${file.content}" alt="${file.name}" style="max-width: 100%; height: auto;">`;
      this.activeEditor = null;
    } else {
      let editor;
      // Determine which editor to show based on file extension
      if (file.name.endsWith('.html')) {
        editor = this.editors.html;
      } else if (file.name.endsWith('.css')) {
        editor = this.editors.css;
      } else if (file.name.endsWith('.js')) {
        editor = this.editors.js;
      } else if (this.fileSystem.isJson(file.name)) {
        editor = this.editors.js; // Use JS editor for JSON with JSON mode
        editor.setOption('mode', 'application/json');
      }

      if (editor) {
        editor.setValue(file.content);
        editor.getWrapperElement().parentNode.style.display = 'block';
        editor.refresh();
        this.activeEditor = editor;
      }
    }

    // Update file tree selection
    document.querySelectorAll('.file-tree-item').forEach(item => {
      if (item.dataset.path === path) {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
    });
  }

  renderFileTree() {
    const fileTree = document.getElementById('fileTree');
    fileTree.innerHTML = '';

    const renderItem = (path) => {
      const item = this.fileSystem.getFile(path);
      const itemElement = document.createElement('div');
      itemElement.classList.add('file-tree-item');
      itemElement.dataset.path = path;

      const icon = document.createElement('i');
      icon.classList.add('fas');
      
      if (item.type === 'folder') {
        icon.classList.add('fa-folder');
      } else if (this.fileSystem.isImage(item.name)) {
        icon.classList.add('fa-image');
      } else {
        icon.classList.add('fa-file');
      }
      
      itemElement.appendChild(icon);
      itemElement.appendChild(document.createTextNode(item.name));

      // Add delete button
      const deleteBtn = document.createElement('i');
      deleteBtn.classList.add('fas', 'fa-trash', 'delete-btn');
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        if (confirm(`Are you sure you want to delete ${item.name}?`)) {
          this.fileSystem.deleteFile(path);
          this.renderFileTree();
          if (item.type === 'file') {
            // If we're deleting the currently open file, open index.html
            const currentSelected = document.querySelector('.file-tree-item.selected');
            if (currentSelected && currentSelected.dataset.path === path) {
              this.openFile('index.html');
            }
          }
        }
      };
      itemElement.appendChild(deleteBtn);

      if (item.type === 'folder') {
        const contents = document.createElement('div');
        contents.classList.add('folder-contents');
        item.children.forEach(childPath => {
          contents.appendChild(renderItem(childPath));
        });
        
        const container = document.createElement('div');
        container.appendChild(itemElement);
        container.appendChild(contents);
        return container;
      }

      return itemElement;
    };

    fileTree.appendChild(renderItem('/'));
  }

  openAiPrompt() {
    const aiModal = document.getElementById('aiModal');
    aiModal.classList.add('active');
    document.getElementById('aiPrompt').focus();
    
    // Close on click outside
    aiModal.onclick = (e) => {
      if (e.target === aiModal) {
        aiModal.classList.remove('active');
      }
    };
  }

  async getAIResponse(prompt) {
    const apiKey = localStorage.getItem('apiKey');
    const selectedModel = localStorage.getItem('selectedModel') || 'gemini-1.5-flash';
    
    if (!apiKey) {
      throw new Error('API key not set. Please set it in settings.');
    }

    // Prepare the current project state
    const projectState = {
      files: {}
    };

    // Get all file contents
    this.fileSystem.files.forEach((file, path) => {
      if (file.type === 'file') {
        let content = file.content;
        if (path === 'index.html') content = this.editors.html.getValue();
        else if (path === 'styles.css') content = this.editors.css.getValue();
        else if (path === 'app.js') content = this.editors.js.getValue();
        projectState.files[path] = content;
      }
    });

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a web development AI assistant. Here is the current state of the project:

Current files and their contents:
${JSON.stringify(projectState, null, 2)}

User request: ${prompt}

Respond ONLY with a JSON object in this exact format:
{
  "actions": [
    {
      "type": "update_file",
      "path": "path/to/file",
      "content": "new file content"
    }
    // ... more actions
  ],
  "message": "Explanation of changes made"
}`
            }]
          }],
          safetySettings: [{
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_NONE"
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid response from AI');
      }

      const responseText = data.candidates[0].content.parts[0].text;
      
      // Find the JSON object in the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not find valid JSON in response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('AI Response Error:', error);
      throw new Error(`AI request failed: ${error.message}`);
    }
  }

  async applyAIChanges(aiResponse) {
    if (!aiResponse.actions || !Array.isArray(aiResponse.actions)) {
      throw new Error('Invalid AI response format');
    }

    // Process each action
    for (const action of aiResponse.actions) {
      try {
        switch (action.type) {
          case 'update_file':
            this.fileSystem.updateFile(action.path, action.content);
            if (action.path === 'index.html') this.editors.html.setValue(action.content);
            else if (action.path === 'styles.css') this.editors.css.setValue(action.content);
            else if (action.path === 'app.js') this.editors.js.setValue(action.content);
            break;
            
          case 'create_file':
            const pathParts = action.path.split('/');
            const fileName = pathParts.pop();
            const folderPath = pathParts.join('/') || '/';
            this.fileSystem.createFile(fileName, folderPath);
            this.fileSystem.updateFile(action.path, action.content);
            break;
            
          case 'delete_file':
            // Implementation for file deletion would go here
            break;
        }
      } catch (error) {
        console.error(`Error applying action ${action.type}:`, error);
        throw new Error(`Failed to apply changes: ${error.message}`);
      }
    }

    this.renderFileTree();
    return aiResponse.message || 'Changes applied successfully';
  }

  async processAiPrompt() {
    const prompt = document.getElementById('aiPrompt').value;
    const statusEl = document.getElementById('aiStatus');
    
    if (!prompt.trim()) {
      statusEl.textContent = 'Please enter a prompt';
      statusEl.className = 'ai-status error';
      return;
    }

    statusEl.textContent = 'Processing your request...';
    statusEl.className = 'ai-status loading';
    statusEl.style.display = 'block';

    try {
      const aiResponse = await this.getAIResponse(prompt);
      const message = await this.applyAIChanges(aiResponse);
      
      statusEl.textContent = message;
      statusEl.className = 'ai-status success';
      
      setTimeout(() => {
        document.getElementById('aiModal').classList.remove('active');
        this.showNotification('AI changes applied successfully!');
      }, 2000);

    } catch (error) {
      console.error('AI processing error:', error);
      statusEl.textContent = error.message || 'Failed to process AI request';
      statusEl.className = 'ai-status error';
    }
  }

  preview() {
    // Close existing preview window
    if (this.previewWindow && !this.previewWindow.closed) {
      this.previewWindow.close();
    }

    // Create new preview window
    this.previewWindow = window.open('about:blank', 'preview');

    // Get the content from all editors
    const htmlContent = this.editors.html.getValue();
    const cssContent = this.editors.css.getValue();
    const jsContent = this.editors.js.getValue();

    // Combine the content
    const combinedContent = this.getCombinedContent(htmlContent, cssContent, jsContent);

    // Write to the preview window
    this.previewWindow.document.open();
    this.previewWindow.document.write(combinedContent);
    this.previewWindow.document.close();
  }

  getCombinedContent(html, css, js) {
    // Parse the HTML content
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Add CSS
    const styleElement = doc.createElement('style');
    styleElement.textContent = css;
    doc.head.appendChild(styleElement);

    // Add JavaScript
    const scriptElement = doc.createElement('script');
    scriptElement.textContent = js;
    doc.body.appendChild(scriptElement);

    return doc.documentElement.outerHTML;
  }

  async downloadFiles() {
    const zip = new JSZip();
    
    // Add all files from the file system to the zip
    for (const [path, file] of this.fileSystem.files.entries()) {
      if (file.type === 'file') {
        // Get the current content if it's an open editor
        let content = file.content;
        if (path === 'index.html') {
          content = this.editors.html.getValue();
        } else if (path === 'styles.css') {
          content = this.editors.css.getValue();
        } else if (path === 'app.js') {
          content = this.editors.js.getValue();
        }
        
        // Handle image files differently
        if (this.fileSystem.isImage(file.name)) {
          // Convert base64 data URL to binary
          const base64Data = content.split(',')[1];
          const binaryData = atob(base64Data);
          const arrayBuffer = new ArrayBuffer(binaryData.length);
          const uint8Array = new Uint8Array(arrayBuffer);
          
          for (let i = 0; i < binaryData.length; i++) {
            uint8Array[i] = binaryData.charCodeAt(i);
          }
          
          zip.file(file.name, uint8Array, {binary: true});
        } else {
          zip.file(file.name, content);
        }
      }
    }
    
    try {
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "zuno-project.zip");
      this.showNotification('Files downloaded successfully!');
    } catch (error) {
      console.error('Download error:', error);
      this.showNotification('Error downloading files!', 'error');
    }
  }

  openSettings() {
    const settingsModal = document.getElementById('settingsModal');
    settingsModal.classList.add('active');
    
    // Load saved settings if they exist
    const apiKey = localStorage.getItem('apiKey') || '';
    const selectedModel = localStorage.getItem('selectedModel') || 'gemini-1.5-flash';
    
    document.getElementById('apiKey').value = apiKey;
    document.getElementById('modelSelect').value = selectedModel;
    
    // Close button handler
    document.getElementById('closeSettings').onclick = () => {
      // Save settings
      const newApiKey = document.getElementById('apiKey').value;
      const newModel = document.getElementById('modelSelect').value;
      
      localStorage.setItem('apiKey', newApiKey);
      localStorage.setItem('selectedModel', newModel);
      
      settingsModal.classList.remove('active');
      this.showNotification('Settings saved successfully!');
    };
    
    // Close on click outside
    settingsModal.onclick = (e) => {
      if (e.target === settingsModal) {
        settingsModal.classList.remove('active');
      }
    };
  }

  async importFiles() {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.html,.css,.js,.json,.txt,.jpg,.jpeg,.png,.gif,.bmp,.webp';

    input.onchange = async (e) => {
      const files = e.target.files;
      
      for (const file of files) {
        try {
          const currentFolder = this.fileSystem.selectedFolder || '/';
          const filePath = currentFolder === '/' ? file.name : `${currentFolder}/${file.name}`;
          
          // Handle different file types
          let content;
          if (this.fileSystem.isImage(file.name)) {
            content = await this.readFileAsDataURL(file);
          } else {
            content = await this.readFileContent(file);
          }
          
          this.fileSystem.createFile(file.name, currentFolder);
          this.fileSystem.updateFile(filePath, content);
        } catch (error) {
          this.showNotification(`Error importing ${file.name}: ${error.message}`, 'error');
        }
      }
      
      this.renderFileTree();
      this.showNotification('Files imported successfully!');
    };

    input.click();
  }

  readFileContent(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('Error reading file'));
      reader.readAsText(file);
    });
  }

  readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('Error reading file'));
      reader.readAsDataURL(file);
    });
  }

  showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: ${type === 'success' ? '#4CAF50' : '#f44336'};
      color: white;
      padding: 12px 24px;
      border-radius: 4px;
      animation: fadeInOut 2s ease-in-out forwards;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      document.body.removeChild(notification);
    }, 2000);
  }

}

// Initialize the editor when the page loads
document.addEventListener('DOMContentLoaded', () => {
  new ZunoEditor();
});