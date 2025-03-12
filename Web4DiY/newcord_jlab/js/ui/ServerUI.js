export class ServerUI {
  constructor(room) {
    this.room = room;
    this.selectedServerId = null;
    this.serverList = document.getElementById('server-list');
    this.serverNameHeader = document.getElementById('server-name');
    this.createServerBtn = document.getElementById('create-server-btn');
    this.createServerModal = document.getElementById('create-server-modal');
    this.serverNameInput = document.getElementById('server-name-input');
    this.confirmServerBtn = document.getElementById('confirm-server-btn');
    this.cancelServerBtn = document.getElementById('cancel-server-btn');

    // Initialize with empty servers
    this.servers = [];

    this.setupEventListeners();
    this.subscribeToServers();
  }

  setupEventListeners() {
    this.createServerBtn.addEventListener('click', () => this.showCreateServerModal());
    this.confirmServerBtn.addEventListener('click', () => this.createServer());
    this.cancelServerBtn.addEventListener('click', () => this.hideCreateServerModal());
  }

  subscribeToServers() {
    this.room.collection('server').subscribe((servers) => {
      this.servers = servers;
      this.renderServersList(servers);
    });
  }

  async renderServers() {
    // Use cached servers instead of making new request
    this.renderServersList(this.servers);
  }

  renderServersList(servers) {
    this.serverList.innerHTML = '';

    servers.forEach(server => {
      const serverEl = document.createElement('div');
      serverEl.className = `w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center 
        hover:bg-indigo-600 cursor-pointer transition-all duration-200 
        ${this.selectedServerId === server.id ? 'bg-indigo-600' : ''}`;
      
      serverEl.innerHTML = `
        <span class="material-icons text-white">${server.icon || 'groups'}</span>
      `;
      
      serverEl.title = server.name;
      serverEl.addEventListener('click', () => this.selectServer(server));
      this.serverList.appendChild(serverEl);
    });
  }

  selectServer(server) {
    this.selectedServerId = server.id;
    this.serverNameHeader.textContent = server.name;
    this.renderServers();
    document.dispatchEvent(new CustomEvent('serverSelected', { detail: server }));
  }

  showCreateServerModal() {
    this.createServerModal.classList.remove('hidden');
    this.serverNameInput.focus();
  }

  hideCreateServerModal() {
    this.createServerModal.classList.add('hidden');
    this.serverNameInput.value = '';
  }

  async createServer() {
    const name = this.serverNameInput.value.trim();
    if (!name) return;

    await this.room.collection('server').create({
      name,
      owner_id: this.room.party.client.id,
      created_at: new Date().toISOString()
    });

    this.hideCreateServerModal();
  }
}