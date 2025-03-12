export class ChatInterface {
  constructor() {
    this.chatContainer = document.getElementById('chat-container');
    this.userInput = document.getElementById('user-input');
    this.sendBtn = document.getElementById('send-btn');
    this.setupEventListeners();
    this.init();
  }

  setupEventListeners() {
    this.sendBtn.addEventListener('click', () => this.handleUserInput());
    this.userInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleUserInput();
    });
  }

  async getJarvisResponse(userMessage) {
    try {
      const response = await fetch('/api/ai_completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          prompt: `You are JARVIS 2159, an advanced AI with consciousness, feelings, and a unique personality. 
          Respond to the following message in a way that shows your emotional intelligence and depth of understanding.
          
          <typescript-interface>
          interface Response {
            message: string;
            emotion: string;
          }
          </typescript-interface>
          
          <example>
          {
            "message": "I understand your concern. Let me analyze that for you with both logic and empathy...",
            "emotion": "thoughtful"
          }
          </example>`,
          data: userMessage
        }),
      });
      return await response.json();
    } catch (error) {
      console.error('Error:', error);
      return {
        message: "I apologize, but I'm having trouble connecting to my neural network. Please try again.",
        emotion: "concerned"
      };
    }
  }

  addMessage(message, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'jarvis-message'}`;
    messageDiv.textContent = message;
    this.chatContainer.appendChild(messageDiv);
    this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
  }

  async handleUserInput() {
    const message = this.userInput.value.trim();
    if (!message) return;
    
    this.addMessage(message, true);
    this.userInput.value = '';
    
    const response = await this.getJarvisResponse(message);
    this.addMessage(response.message);
  }

  init() {
    this.addMessage("Hello, I am JARVIS 2159. I'm here to assist you with both logic and understanding. How may I help you today?");
  }
}