import { ServerUI } from './ui/ServerUI.js';
import { ChannelUI } from './ui/ChannelUI.js';
import { MessageUI } from './ui/MessageUI.js';

// Initialize websocket connection
const room = new WebsimSocket();

// Initialize UI components
const serverUI = new ServerUI(room);
const channelUI = new ChannelUI(room);
const messageUI = new MessageUI(room);

// Get DOM elements
const onlineUsers = document.getElementById('online-users');
const currentUser = document.getElementById('current-user');

// Initialize current user
function initCurrentUser() {
  const { username, avatarUrl } = room.party.client;
  currentUser.innerHTML = `
    <div class="flex items-center space-x-3 w-full">
      <img src="${avatarUrl}" class="w-10 h-10 rounded-full">
      <div class="flex flex-col min-w-0">
        <div class="text-white font-medium">${username}</div>
        <div class="text-slate-400 text-xs">Online</div>
      </div>
    </div>
  `;
}

// Render online users
function renderOnlineUsers(peers) {
  onlineUsers.innerHTML = '';
  
  for (const clientId in peers) {
    const { username, avatarUrl } = peers[clientId];
    const userEl = document.createElement('div');
    userEl.className = 'flex items-center p-2 rounded-lg hover:bg-slate-800/50 transition-colors';
    userEl.innerHTML = `
      <img src="${avatarUrl}" class="w-8 h-8 rounded-full">
      <div class="ml-2">
        <div class="text-white text-sm">${username}</div>
        <div class="text-slate-400 text-xs">Online</div>
      </div>
    `;
    onlineUsers.appendChild(userEl);
  }
}

// Subscribe to peers
room.party.subscribe((peers) => {
  renderOnlineUsers(peers);
});

// Initialize the app
function init() {
  initCurrentUser();
}

init();