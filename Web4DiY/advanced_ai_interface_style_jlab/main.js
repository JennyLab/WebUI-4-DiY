import { Terminal } from './terminal.js';
import { ChatInterface } from './chat.js';

// Initialize both interfaces
const terminal = new Terminal();
const chat = new ChatInterface();

// Tab switching logic
const tabs = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.tab;
    
    tabs.forEach(t => t.classList.remove('active'));
    tabContents.forEach(content => content.classList.add('hidden'));
    
    tab.classList.add('active');
    document.getElementById(`${target}-tab`).classList.remove('hidden');
    
    if (target === 'terminal') {
      document.getElementById('terminal-input').focus();
    } else {
      document.getElementById('user-input').focus();
    }
  });
});