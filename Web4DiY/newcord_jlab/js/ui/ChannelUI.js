export class ChannelUI {
  constructor(room) {
    this.room = room;
    this.selectedChannelId = null;
    this.currentServerId = null;
    this.channelList = document.getElementById('channel-list');
    this.channelName = document.getElementById('channel-name');
    this.channelActions = document.getElementById('channel-actions');
    this.createChannelBtn = document.getElementById('create-channel-btn');
    this.createChannelModal = document.getElementById('create-channel-modal');
    this.channelNameInput = document.getElementById('channel-name-input');
    this.confirmChannelBtn = document.getElementById('confirm-channel-btn');
    this.cancelChannelBtn = document.getElementById('cancel-channel-btn');
    this.deleteChannelBtn = document.getElementById('delete-channel-btn');
    
    // Initialize with empty channels
    this.channels = [];
    
    this.setupEventListeners();
    this.subscribeToChannels();
  }

  setupEventListeners() {
    this.createChannelBtn.addEventListener('click', () => this.showCreateChannelModal());
    this.confirmChannelBtn.addEventListener('click', () => this.createChannel());
    this.cancelChannelBtn.addEventListener('click', () => this.hideCreateChannelModal());
    this.deleteChannelBtn.addEventListener('click', () => this.deleteChannel());

    document.addEventListener('serverSelected', (e) => {
      this.currentServerId = e.detail.id;
      this.selectedChannelId = null;
      this.channelName.textContent = 'Select a channel';
      this.renderChannels();
    });
  }

  subscribeToChannels() {
    // Maintain reference to filtered collection
    this.room.collection('channel').subscribe((channels) => {
      this.channels = channels;
      if (this.currentServerId) {
        const filteredChannels = channels.filter(c => c.server_id === this.currentServerId);
        this.renderChannelsList(filteredChannels);
      }
    });
  }

  renderChannelsList(channels) {
    this.channelList.innerHTML = '';
    
    channels.forEach(channel => {
      const channelEl = document.createElement('div');
      channelEl.className = `channel flex items-center px-3 py-2 rounded-lg text-slate-400 
        hover:text-white cursor-pointer transition-all duration-200 transform hover:translate-x-1
        ${this.selectedChannelId === channel.id ? 'bg-slate-800 text-white translate-x-1' : ''}`;
      
      channelEl.innerHTML = `
        <span class="material-icons mr-2 text-lg">#</span>
        ${channel.name}
      `;
      
      channelEl.addEventListener('click', () => this.selectChannel(channel));
      
      // Add animation
      channelEl.style.opacity = '0';
      channelEl.style.transform = 'translateX(-10px)';
      this.channelList.appendChild(channelEl);
      
      // Trigger animation
      requestAnimationFrame(() => {
        channelEl.style.transition = 'all 0.3s ease';
        channelEl.style.opacity = '1';
        channelEl.style.transform = this.selectedChannelId === channel.id ? 'translateX(4px)' : 'translateX(0)';
      });
    });
  }

  async renderChannels() {
    if (!this.currentServerId) return;
    
    // Use cached channels instead of making new request
    const filteredChannels = this.channels.filter(c => c.server_id === this.currentServerId);
    this.renderChannelsList(filteredChannels);
  }

  selectChannel(channel) {
    this.selectedChannelId = channel.id;
    this.channelName.textContent = channel.name;
    this.channelActions.classList.remove('hidden');
    this.renderChannels();
    
    // Dispatch event with animation
    const event = new CustomEvent('channelSelected', { 
      detail: { ...channel, animate: true }
    });
    document.dispatchEvent(event);
  }

  showCreateChannelModal() {
    if (!this.currentServerId) return;
    this.createChannelModal.classList.remove('hidden');
    this.createChannelModal.style.opacity = '0';
    this.channelNameInput.focus();
    
    requestAnimationFrame(() => {
      this.createChannelModal.style.transition = 'opacity 0.2s ease';
      this.createChannelModal.style.opacity = '1';
    });
  }

  hideCreateChannelModal() {
    this.createChannelModal.style.opacity = '0';
    setTimeout(() => {
      this.createChannelModal.classList.add('hidden');
      this.channelNameInput.value = '';
    }, 200);
  }

  async createChannel() {
    const name = this.channelNameInput.value.trim();
    if (!name || !this.currentServerId) return;

    try {
      const channel = await this.room.collection('channel').create({
        name,
        server_id: this.currentServerId,
        created_at: new Date().toISOString()
      });
      
      this.hideCreateChannelModal();
      
      // Auto-select the newly created channel
      setTimeout(() => {
        this.selectChannel(channel);
      }, 300);
      
    } catch (error) {
      console.error('Error creating channel:', error);
    }
  }

  async deleteChannel() {
    if (!this.selectedChannelId) return;
    
    try {
      const channelEl = this.channelList.querySelector(`[data-channel-id="${this.selectedChannelId}"]`);
      if (channelEl) {
        channelEl.style.opacity = '0';
        channelEl.style.transform = 'translateX(-10px)';
      }
      
      await this.room.collection('channel').delete(this.selectedChannelId);
      this.selectedChannelId = null;
      this.channelName.textContent = 'Select a channel';
      this.channelActions.classList.add('hidden');
      
    } catch (error) {
      console.error('Error deleting channel:', error);
    }
  }
}