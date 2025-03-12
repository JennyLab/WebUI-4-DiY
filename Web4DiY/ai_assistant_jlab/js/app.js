import { ChatManager } from './chatManager.js';
import { UIManager } from './uiManager.js';
import { ImageGenerator } from './imageGenerator.js';
import { ForumManager } from './forumManager.js';

const chatManager = new ChatManager();
const uiManager = new UIManager(chatManager);
const imageGenerator = new ImageGenerator();
const forumManager = new ForumManager();

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
  uiManager.init();
});