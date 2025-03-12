export class Browser {
  constructor(windowManager) {
    this.windowManager = windowManager;
    this.proxyUrl = 'https://websim.ai/proxy';
  }

  createBrowserWindow() {
    const windowId = this.windowManager.createWindow({
      title: 'Mozilla Firefox',
      type: 'browser',
      width: 800,
      height: 600
    });

    const window = this.windowManager.windows.get(windowId);
    const content = window.element.querySelector('.window-content');

    content.innerHTML = `
      <div class="browser-toolbar">
        <input type="text" class="url-bar" placeholder="Enter URL">
        <button class="refresh">🔄</button>
      </div>
      <iframe class="browser-frame" sandbox="allow-same-origin allow-scripts allow-forms"></iframe>
    `;

    const urlBar = content.querySelector('.url-bar');
    const frame = content.querySelector('.browser-frame');
    const refresh = content.querySelector('.refresh');

    urlBar.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        try {
          const url = urlBar.value;
          const response = await this.fetchThroughProxy(url);
          frame.srcdoc = await response.text();
        } catch (error) {
          frame.srcdoc = `<h1>Error loading page</h1><p>${error.message}</p>`;
        }
      }
    });

    refresh.onclick = () => {
      if (urlBar.value) {
        urlBar.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      }
    };

    // Load default homepage
    urlBar.value = 'https://www.mozilla.org';
    urlBar.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
  }

  async fetchThroughProxy(url) {
    const headers = {
      'X-Requested-With': 'Mozilla/5.0',
      'X-Forwarded-For': this.generateRandomIP(),
      'User-Agent': this.generateRandomUserAgent()
    };

    return fetch(`${this.proxyUrl}?url=${encodeURIComponent(url)}`, { headers });
  }

  generateRandomIP() {
    return Array(4).fill(0).map(() => Math.floor(Math.random() * 256)).join('.');
  }

  generateRandomUserAgent() {
    const versions = ['78.0.1', '79.0', '80.0.1', '81.0'];
    const version = versions[Math.floor(Math.random() * versions.length)];
    return `Mozilla/5.0 (X11; Linux x86_64; rv:${version}) Gecko/20100101 Firefox/${version}`;
  }
}