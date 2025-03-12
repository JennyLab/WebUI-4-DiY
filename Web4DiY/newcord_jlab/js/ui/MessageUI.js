import { formatEmoji } from '../utils/emoji.js';
import { formatMentions } from '../utils/emoji.js';

export class MessageUI {
  constructor(room) {
    this.room = room;
    this.currentChannelId = null;
    this.messagesList = document.getElementById('messages');
    this.messageInput = document.getElementById('message-input');
    this.messages = [];

    // Track messages being uploaded
    this.uploadsContainer = document.createElement('div');
    this.uploadsContainer.className = 'uploads-container absolute -top-8 left-0 right-0 px-4';
    this.messageInput.parentElement.appendChild(this.uploadsContainer);

    this.replyingTo = null; // Track message being replied to
    this.replyPreview = document.createElement('div');
    this.replyPreview.className = 'reply-preview hidden bg-slate-800 p-2 rounded-t-lg border-l-2 border-indigo-500';
    this.messageInput.parentElement.insertBefore(this.replyPreview, this.messageInput);

    // Add file upload support
    this.fileInput = document.getElementById('file-input');
    this.uploadBtn = document.getElementById('upload-btn');
    this.setupFileUpload();

    this.setupEventListeners();
    this.subscribeToMessages();

    // Add emoji picker
    this.emojiBtn = document.getElementById('emoji-btn');
    this.emojiPicker = document.getElementById('emoji-picker');
    this.setupEmojiPicker();

    // Add mention suggestions container
    this.mentionSuggestions = document.createElement('div');
    this.mentionSuggestions.className = 'mention-suggestions hidden';
    this.messageInput.parentElement.appendChild(this.mentionSuggestions);

    this.setupMentionSystem();

    // Support for paste
    this.messageInput.addEventListener('paste', async (e) => {
      const items = (e.clipboardData || e.originalEvent.clipboardData).items;
      
      for (const item of items) {
        if (item.kind === 'file') {
          const file = item.getAsFile();
          await this.handleFileUpload(file);
        }
      }
    });
  }

  setupEventListeners() {
    this.messageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        // Allow new line with shift+enter
        if (e.shiftKey) {
          return;
        }
        // Otherwise send message
        e.preventDefault();
        this.sendMessage();
      }
    });

    document.addEventListener('channelSelected', (e) => {
      this.currentChannelId = e.detail.id;
      this.renderMessages();
    });

    // Add reply functionality
    this.messagesList.addEventListener('click', (e) => {
      const replyBtn = e.target.closest('.reply-btn');
      if (replyBtn) {
        const messageEl = replyBtn.closest('.message');
        const messageId = messageEl.dataset.messageId;
        const content = messageEl.querySelector('.message-content').innerHTML;
        const username = messageEl.querySelector('.message-username').textContent;
        this.startReply(messageId, content, username);
      }

      // Close reply preview button
      if (e.target.closest('.close-reply-btn')) {
        this.cancelReply();
      }
    });
  }

  setupFileUpload() {
    this.uploadBtn.addEventListener('click', () => {
      this.fileInput.click();
    });

    this.fileInput.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files || []);
      for (const file of files) {
        await this.handleFileUpload(file);
      }
      // Clear input
      this.fileInput.value = '';
    });
  }

  async handleFileUpload(file) {
    try {
      const maxSize = 10 * 1024 * 1024; // 10MB limit
      if (file.size > maxSize) {
        alert('File too large! Maximum size is 10MB');
        return;
      }

      // Show loading state in uploads container
      const loadingEl = document.createElement('div');
      loadingEl.className = 'bg-slate-800/90 p-2 rounded text-slate-400 text-sm flex items-center space-x-2 mb-2';
      loadingEl.innerHTML = `
        <div class="upload-loading mr-2"></div>
        <span>Uploading ${file.name}...</span>
      `;
      this.uploadsContainer.appendChild(loadingEl);

      // Upload file
      const url = await websim.upload(file);

      // Remove loading element
      loadingEl.remove();

      // Get file extension
      const ext = file.name.split('.').pop().toLowerCase();

      // Create markdown for file
      let markdown = '';
      if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
        markdown = `\n![${file.name}](${url})`;
      } else if (['mp4', 'webm', 'ogg'].includes(ext)) {
        markdown = `\n<video controls src="${url}" />`;
      } else {
        markdown = `\n[📎 ${file.name}](${url})`;
      }

      // Insert at cursor position or append
      const start = this.messageInput.selectionStart;
      const end = this.messageInput.selectionEnd;
      const text = this.messageInput.value;
      this.messageInput.value = text.slice(0, start) + markdown + text.slice(end);
      
      // Move cursor after insertion
      this.messageInput.selectionStart = start + markdown.length;
      this.messageInput.selectionEnd = start + markdown.length;
      this.messageInput.focus();

    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file. Please try again.');
    }
  }

  setupEmojiPicker() {
    this.emojiBtn.addEventListener('click', () => {
      this.emojiPicker.classList.toggle('hidden');
    });

    // Close emoji picker when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.emojiBtn.contains(e.target) && 
          !this.emojiPicker.contains(e.target)) {
        this.emojiPicker.classList.add('hidden');
      }
    });

    // Initialize emoji picker with updated styling
    const picker = new EmojiMart.Picker({
      onEmojiSelect: (emoji) => {
        // Insert emoji at cursor position
        const start = this.messageInput.selectionStart;
        const end = this.messageInput.selectionEnd;
        const text = this.messageInput.value;
        this.messageInput.value = text.slice(0, start) + emoji.native + text.slice(end);
        
        // Move cursor after emoji
        this.messageInput.selectionStart = start + emoji.native.length;
        this.messageInput.selectionEnd = start + emoji.native.length;
        this.messageInput.focus();

        // Hide picker after selection
        this.emojiPicker.classList.add('hidden');
      },
      theme: 'dark',
      showPreview: false,
      showSkinTones: false,
      emojiSize: 20,
      set: 'apple',
      color: '#6366f1', // Indigo color to match theme
      categoryColor: '#94a3b8',
      skinTonePosition: 'none',
      searchPosition: 'top',
      perLine: 8
    });
    this.emojiPicker.appendChild(picker);
  }

  setupMentionSystem() {
    this.messageInput.addEventListener('input', () => {
      const cursorPos = this.messageInput.selectionStart;
      const text = this.messageInput.value;
      
      // Find @ symbol before cursor
      const lastAtSymbol = text.lastIndexOf('@', cursorPos - 1);
      if (lastAtSymbol === -1) {
        this.hideMentionSuggestions();
        return;
      }

      // Get partial username after @
      const partialUsername = text.slice(lastAtSymbol + 1, cursorPos);
      // Only show suggestions if we have at least one character after @
      if (partialUsername.length > 0) {
        this.showMentionSuggestions(partialUsername);
      } else {
        this.hideMentionSuggestions();
      }
    });

    // Close suggestions when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.mentionSuggestions.contains(e.target) && 
          !this.messageInput.contains(e.target)) {
        this.hideMentionSuggestions();
      }
    });
  }

  showMentionSuggestions(partialUsername) {
    // Get all usernames from connected peers
    const usernames = Object.values(this.room.party.peers)
      .map(peer => peer.username)
      .filter(username => 
        username.toLowerCase().includes(partialUsername.toLowerCase()));

    if (usernames.length === 0) {
      this.hideMentionSuggestions();
      return;
    }

    this.mentionSuggestions.innerHTML = '';
    usernames.forEach(username => {
      const suggestion = document.createElement('div');
      suggestion.className = 'mention-suggestion p-2 hover:bg-slate-800/50 flex items-center space-x-2 transition-colors cursor-pointer';
      suggestion.innerHTML = `
        <img src="https://images.websim.ai/avatar/${username}" 
          class="w-6 h-6 rounded-full"
          alt="${username}">
        <span class="text-slate-300">${username}</span>
      `;
      
      suggestion.addEventListener('click', () => {
        this.insertMention(username);
        this.hideMentionSuggestions();
      });
      
      this.mentionSuggestions.appendChild(suggestion);
    });

    this.mentionSuggestions.classList.remove('hidden');
  }

  hideMentionSuggestions() {
    this.mentionSuggestions.classList.add('hidden');
  }

  insertMention(username) {
    const cursorPos = this.messageInput.selectionStart;
    const text = this.messageInput.value;
    const lastAtSymbol = text.lastIndexOf('@', cursorPos - 1);
    
    const beforeMention = text.slice(0, lastAtSymbol);
    const afterMention = text.slice(cursorPos);
    
    this.messageInput.value = `${beforeMention}@${username} ${afterMention}`;
    this.messageInput.focus();
    const newCursorPos = beforeMention.length + username.length + 2;
    this.messageInput.setSelectionRange(newCursorPos, newCursorPos);
  }

  subscribeToMessages() {
    this.room.collection('message').subscribe((messages) => {
      this.messages = messages;
      if (this.currentChannelId) {
        const filteredMessages = messages.filter(m => m.channel_id === this.currentChannelId);
        this.renderMessagesList(filteredMessages);
      }
    });
  }

  async renderMessages() {
    if (!this.currentChannelId) return;

    // Use cached messages instead of making new request
    const filteredMessages = this.messages.filter(m => m.channel_id === this.currentChannelId);
    this.renderMessagesList(filteredMessages);
  }

  renderMessagesList(messages) {
    this.messagesList.innerHTML = '';
    
    messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    messages.forEach((message, index) => {
      const messageEl = document.createElement('div');
      messageEl.dataset.messageId = message.id;
      
      // Find replied message if exists
      let replyHtml = '';
      if (message.reply_to) {
        const repliedMessage = messages.find(m => m.id === message.reply_to);
        if (repliedMessage) {
          replyHtml = `
            <div class="flex items-center mb-2 text-sm text-slate-400">
              <span class="material-icons text-sm mr-1">reply</span>
              Replying to <span class="font-medium ml-1">${repliedMessage.username}</span>
              <div class="ml-2 text-slate-500 line-clamp-1">${repliedMessage.content}</div>
            </div>
          `;
        }
      }

      const time = new Date(message.created_at).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });

      const isOwnMessage = message.username === this.room.party.client.username;

      // Add mention highlighting
      const isOwnUsername = this.room.party.client.username;
      const isMentioned = message.mentions?.includes(isOwnUsername);
      
      messageEl.className = `message flex flex-col hover:bg-slate-800/50 p-3 rounded-lg transition-all duration-200 group
        ${isMentioned ? 'mentioned' : ''}`;

      // Get all connected usernames for mention formatting
      const allUsernames = Object.values(this.room.party.peers)
        .map(peer => peer.username);

      // Format content with emojis and mentions
      let content = formatEmoji(message.content);
      content = formatMentions(content, allUsernames);
      const sanitizedContent = DOMPurify.sanitize(marked.parse(content));

      messageEl.innerHTML = `
        ${replyHtml}
        <div class="flex items-start">
          <img src="https://images.websim.ai/avatar/${message.username}" 
            class="w-10 h-10 rounded-full mr-4">
          <div class="flex-1 min-w-0">
            <div class="flex items-baseline justify-between">
              <div class="flex items-center">
                <span class="message-username font-medium text-white mr-2">${message.username}</span>
                <span class="text-xs text-slate-400">${time}</span>
              </div>
              <div class="flex items-center space-x-2">
                <button class="reply-btn opacity-0 group-hover:opacity-100 text-slate-400 hover:text-white transition-all">
                  <span class="material-icons text-sm">reply</span>
                </button>
                ${isOwnMessage ? `
                  <button class="delete-msg-btn opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 transition-all">
                    <span class="material-icons text-sm">delete</span>
                  </button>
                ` : ''}
              </div>
            </div>
            <div class="text-slate-300 markdown message-content">
              ${sanitizedContent}
            </div>
          </div>
        </div>
      `;

      // Handle video scaling
      messageEl.querySelectorAll('.message-content video').forEach(video => {
        video.classList.add('max-w-[400px]', 'max-h-[300px]', 'rounded-lg');
        video.controls = true;
      });

      // Handle image scaling
      messageEl.querySelectorAll('.message-content img').forEach(img => {
        img.classList.add('max-w-[400px]', 'max-h-[300px]', 'rounded-lg', 'object-contain');
      });

      // Add delete functionality
      if (isOwnMessage) {
        const deleteBtn = messageEl.querySelector('.delete-msg-btn');
        deleteBtn.addEventListener('click', async () => {
          try {
            await this.room.collection('message').delete(message.id);
            messageEl.style.opacity = '0';
            messageEl.style.transform = 'translateX(-20px)';
            setTimeout(() => messageEl.remove(), 300);
          } catch (error) {
            console.error('Error deleting message:', error);
          }
        });
      }

      // Add animation
      messageEl.style.opacity = '0';
      messageEl.style.transform = 'translateY(20px)';
      this.messagesList.appendChild(messageEl);

      // Trigger animation with slight delay
      setTimeout(() => {
        messageEl.style.transition = 'all 0.3s ease';
        messageEl.style.opacity = '1';
        messageEl.style.transform = 'translateY(0)';
      }, index * 50);
    });

    this.messagesList.scrollTop = this.messagesList.scrollHeight;
  }

  startReply(messageId, content, username) {
    this.replyingTo = messageId;
    this.replyPreview.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="flex items-center text-sm text-slate-400">
          <span class="material-icons text-sm mr-1">reply</span>
          Replying to <span class="font-medium ml-1">${username}</span>
        </div>
        <button class="close-reply-btn text-slate-400 hover:text-white">
          <span class="material-icons text-sm">close</span>
        </button>
      </div>
      <div class="text-slate-300 text-sm mt-1 line-clamp-1">${content}</div>
    `;
    this.replyPreview.classList.remove('hidden');
    this.messageInput.focus();
  }

  cancelReply() {
    this.replyingTo = null;
    this.replyPreview.classList.add('hidden');
    this.replyPreview.innerHTML = '';
  }

  async sendMessage() {
    let content = this.messageInput.value.trim();
    if (!content || !this.currentChannelId) return;

    // Format emojis and mentions
    content = formatEmoji(content);
    
    try {
      // Get all connected usernames for mention detection
      const allUsernames = Object.values(this.room.party.peers)
        .map(peer => peer.username);
      
      const messageData = {
        content,
        channel_id: this.currentChannelId,
        username: this.room.party.client.username,
        created_at: new Date().toISOString(),
        // Store mentioned usernames to highlight messages for mentioned users
        mentions: [...new Set(content.match(/@(\w+)/g) || [])].map(m => m.slice(1))
      };

      // Add reply data if replying
      if (this.replyingTo) {
        messageData.reply_to = this.replyingTo;
      }

      // Send message
      await this.room.collection('message').create(messageData);
      
      // Clear input and reply preview
      this.messageInput.value = '';
      this.cancelReply();
      
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }
}