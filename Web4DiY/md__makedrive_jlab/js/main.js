import { DriveManager } from './driveManager.js';
import { CommandParser } from './commandParser.js';
import { UIManager } from './uiManager.js';

const driveManager = new DriveManager();
const commandParser = new CommandParser(driveManager);
const uiManager = new UIManager(driveManager, commandParser);

// Initialize UI
uiManager.init();

// Keep focus on input when clicking anywhere in the terminal
document.querySelector('.terminal').addEventListener('click', (e) => {
  if (!e.target.closest('.modal') && !e.target.closest('button')) {
    document.getElementById('commandInput').focus();
  }
});