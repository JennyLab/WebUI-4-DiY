export class ChatManager {
  constructor() {
    this.conversations = new Map();
    this.currentConversationId = null;
    this.currentModel = 'NovaBase'; 
    this.debugMode = false;
    this.errorLogs = [];
    this.aiName = 'Aetheria'; 
    this.initializeNewChat();
  }

  initializeNewChat() {
    const conversationId = Date.now().toString();
    this.conversations.set(conversationId, {
      id: conversationId,
      title: 'New Chat',
      messages: []
    });
    this.currentConversationId = conversationId;
    return conversationId;
  }

  setModel(model) {
    this.currentModel = model;
  }

  toggleDebugMode() {
    this.debugMode = !this.debugMode;
    return this.debugMode;
  }

  logError(error, context) {
    const errorLog = {
      timestamp: new Date().toISOString(),
      error: error.message || error,
      stack: error.stack,
      context
    };
    this.errorLogs.push(errorLog);
    if (this.debugMode) {
      console.error('Debug Info:', errorLog);
    }
    return errorLog;
  }

  async sendMessage(message) {
    try {
      if (!this.currentConversationId) {
        this.initializeNewChat();
      }

      const conversation = this.conversations.get(this.currentConversationId);
      
      if (!conversation) {
        throw new Error('No active conversation found');
      }

      conversation.messages.push({
        role: 'user',
        content: message
      });

      const contextWindow = conversation.messages.slice(-5); 
      const conversationContext = contextWindow.map(msg => 
        `${msg.role}: ${msg.content}`
      ).join('\n');

      let response = await this.getAIResponse(message, conversationContext);
      
      if (!response) {
        response = 'The request could not be fulfilled.';
        throw new Error('Empty response from AI');
      }

      conversation.messages.push({
        role: 'assistant',
        content: response
      });

      if (conversation.messages.length === 2) {
        conversation.title = await this.generateTitle(message) || 'New Chat';
      }

      return {
        response,
        title: conversation.title || 'New Chat'
      };
    } catch (error) {
      const errorLog = this.logError(error, { message, conversationId: this.currentConversationId });
      return {
        response: `I encountered an error. ${this.debugMode ? `\n\nDebug info:\n${JSON.stringify(errorLog, null, 2)}` : 'Please try again.'}`,
        title: 'Error Occurred',
        error: errorLog
      };
    }
  }

  async getAIResponse(message, conversationContext) {
    try {
      const userStyle = await this.detectUserStyle(message);
      
      if (message.toLowerCase().includes('execute code') || message.toLowerCase().includes('run this:')) {
        return await this.handleCodeExecution(message);
      }

      if (message.toLowerCase().includes('search for') || message.toLowerCase().includes('find info about')) {
        return await this.handleWebSearch(message);
      }

      if (message.toLowerCase().includes('solve') && 
          (message.includes('+') || message.includes('-') || message.includes('*') || message.includes('/'))) {
        return await this.handleMathProblem(message);
      }

      if (this.isImageGenerationRequest(message)) {
        return await this.handleImageGenerationRequest(message);
      }

      const modelPrompts = {
        'NovaBase': `You are ${this.aiName}, a helpful AI assistant with broad knowledge.`,
        'DataSage': `You are ${this.aiName} (DataSage variant), focused on data analysis and deep reasoning.`,
        'DeepVision': `You are ${this.aiName} (DEEPSEEK R1 variant), specialized in detailed explanations.`,
        'CodeVirtuoso': `You are ${this.aiName} (CodeVirtuoso variant), specialized in modern programming.`,
        'AetheriaSpecial': `You are ${this.aiName} (Special variant), with system access and advanced capabilities.`
      };

      const stylePrompt = this.getStylePrompt(userStyle);

      const response = await fetch('/api/ai_completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          prompt: `${modelPrompts[this.currentModel]} ${stylePrompt}
          
          Previous conversation context:
          ${conversationContext}
          
          Respond in a way that maintains conversational context and references previous messages when relevant.
          Use ** for emphasis on important text.
          For code examples, use triple backticks with language identifiers.
          
          interface Response {
            reply: string;
            style?: string;
            codeSnippets?: string[];
            suggestedNextQuestions?: string[];
            referencedContext?: {
              messageIndex: number;
              content: string;
            }[];
          }
          
          {
            "reply": "Based on our previous discussion...",
            "style": "technical",
            "codeSnippets": ["console.log('Hello')"],
            "suggestedNextQuestions": ["How about trying X?"],
            "referencedContext": [
              {
                "messageIndex": 2,
                "content": "Referenced from earlier message"
              }
            ]
          }
          `,
          data: message,
          model: this.currentModel
        }),
      });
      
      const data = await response.json();
      
      let formattedResponse = data.reply;
      
      if (data.referencedContext?.length > 0) {
        formattedResponse += '\n\n*Context referenced from our conversation:*\n';
        data.referencedContext.forEach(ref => {
          formattedResponse += `> ${ref.content}\n`;
        });
      }
      
      if (data.suggestedNextQuestions) {
        formattedResponse += '\n\nYou might also want to ask:\n' + 
          data.suggestedNextQuestions.map(q => `• ${q}`).join('\n');
      }

      return formattedResponse;
    } catch (error) {
      throw new Error('Failed to get AI response');
    }
  }

  async detectUserStyle(message) {
    try {
      const response = await fetch('/api/ai_completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `Analyze the communication style in this message and categorize it.
          
          interface Response {
            style: "technical" | "casual" | "formal" | "creative";
            confidence: number;
          }
          
          {
            "style": "technical",
            "confidence": 0.85
          }`,
          data: message
        })
      });

      const data = await response.json();
      return data.style;
    } catch (error) {
      return 'casual'; 
    }
  }

  getStylePrompt(style) {
    const styles = {
      technical: 'Use precise technical language and include relevant code examples.',
      casual: 'Keep the tone friendly and conversational, using simple explanations.',
      formal: 'Maintain a professional and structured approach.',
      creative: 'Be imaginative and use engaging metaphors and examples.'
    };
    return styles[style] || styles.casual;
  }

  async handleCodeExecution(message) {
    const codeMatch = message.match(/```(?:\w+)?\s*([\s\S]*?)```/);
    if (!codeMatch) return "Please provide the code between triple backticks.";

    try {
      const response = await fetch('/api/ai_completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `Execute this code in a safe environment and return the result.
          If there are errors, provide debugging suggestions.
          
          interface Response {
            output: string;
            errors?: string[];
            suggestions?: string[];
          }`,
          data: codeMatch[1]
        })
      });

      const data = await response.json();
      return `Output:\n\`\`\`\n${data.output}\n\`\`\`\n${
        data.errors ? `\nErrors:\n${data.errors.join('\n')}` : ''
      }${
        data.suggestions ? `\nSuggestions:\n${data.suggestions.join('\n')}` : ''
      }`;
    } catch (error) {
      return "Sorry, I couldn't execute the code safely.";
    }
  }

  async handleWebSearch(message) {
    try {
      const query = message.replace(/search for|find info about/gi, '').trim();
      
      const response = await fetch('/api/ai_completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `Perform a web search for this query and return relevant results with sources.
          
          interface SearchResult {
            title: string;
            snippet: string;
            url: string;
            source: string;
            publicationDate?: string;
          }
          
          interface Response {
            results: SearchResult[];
            summary: string;
          }
          
          {
            "results": [
              {
                "title": "Example Article",
                "snippet": "Relevant excerpt from the article...",
                "url": "https://example.com/article",
                "source": "Example News",
                "publicationDate": "2023-12-25"
              }
            ],
            "summary": "Brief summary of findings..."
          }`,
          data: query
        })
      });

      const data = await response.json();
      
      return this.formatSearchResults(data);
    } catch (error) {
      throw new Error('Failed to perform web search');
    }
  }

  formatSearchResults(data) {
    let formattedResponse = `📚 **Search Results**\n\n`;
    
    // Add the AI's summary
    formattedResponse += `${data.summary}\n\n`;
    
    // Add individual search results
    formattedResponse += `🔍 **Sources:**\n\n`;
    
    data.results.forEach((result, index) => {
      formattedResponse += `${index + 1}. **${result.title}**\n`;
      formattedResponse += `   ${result.snippet}\n`;
      formattedResponse += `   📍 [${result.source}](${result.url})`;
      if (result.publicationDate) {
        formattedResponse += ` • ${new Date(result.publicationDate).toLocaleDateString()}`;
      }
      formattedResponse += '\n\n';
    });
    
    return formattedResponse;
  }

  async handleMathProblem(message) {
    // TO DO: implement handleMathProblem
  }

  async handleDataAnalysis(message) {
    // TO DO: implement handleDataAnalysis
  }

  async generateDocumentation(message) {
    // TO DO: implement generateDocumentation
  }

  async reviewCode(message) {
    // TO DO: implement reviewCode
  }

  isImageGenerationRequest(message) {
    const imageKeywords = [
      'generate image',
      'create image',
      'make image',
      'generate a picture',
      'create a picture',
      'draw',
      'generate art',
      'create artwork'
    ];
    
    return imageKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );
  }

  async handleImageGenerationRequest(message) {
    try {
      const response = await fetch('/api/ai_completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          prompt: `Extract the image description from this message and format it for image generation. Do not include any other text.
          
          interface Response {
            description: string;
            style: string;
          }
          
          {
            "description": "A serene mountain landscape at sunset",
            "style": "realistic"
          }`,
          data: message
        }),
      });

      const data = await response.json();
      
      const imageUrl = await this.generateImage(data.description, data.style);
      
      return `I've generated an image based on your request. Here it is:
        <div class="generated-image-response">
          <img src="${imageUrl}" alt="Generated image" />
          <div class="image-info">
            <p><strong>Description:</strong> ${data.description}</p>
            <p><strong>Style:</strong> ${data.style}</p>
          </div>
        </div>`;

    } catch (error) {
      return "I apologize, but I encountered an error while generating the image. Please try again or provide a different description.";
    }
  }

  async generateImage(description, style = 'realistic') {
    try {
      const response = await fetch('/api/ai_completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          prompt: `Generate an image based on this description. Return the image URL.
          Style: ${style}
          Size: 512x512
          
          interface Response {
            imageUrl: string;
          }
          
          {
            "imageUrl": "https://images.websim.ai/generated/123.png"
          }
          `,
          data: description,
        }),
      });

      const data = await response.json();
      return data.imageUrl;
    } catch (error) {
      throw new Error('Failed to generate image');
    }
  }

  async generateTitle(message) {
    try {
      const response = await fetch('/api/ai_completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          prompt: `Generate a short, concise title (max 6 words) for a conversation that starts with this message:
          
          interface Response {
            title: string;
          }
          
          {
            "title": "Learning About Artificial Intelligence"
          }
          `,
          data: message
        }),
      });
      
      const data = await response.json();
      return data.title;
    } catch (error) {
      return 'New Chat';
    }
  }

  getConversationHistory(limit = 5) {
    const conversation = this.conversations.get(this.currentConversationId);
    if (!conversation) return [];
    return conversation.messages.slice(-limit);
  }

  searchConversation(query) {
    const conversation = this.conversations.get(this.currentConversationId);
    if (!conversation) return [];
    
    return conversation.messages.filter(message => 
      message.content.toLowerCase().includes(query.toLowerCase())
    );
  }

  getCurrentConversation() {
    return this.conversations.get(this.currentConversationId);
  }

  getAllConversations() {
    return Array.from(this.conversations.values());
  }

  async analyzeImage(imageFile) {
    try {
      const base64Image = await this.fileToBase64(imageFile);
      
      const response = await fetch('/api/ai_completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          prompt: `Analyze this image in detail. Include visual elements, composition, colors, objects, and any notable aspects.
          
          interface Response {
            analysis: {
              description: string;
              objects: string[];
              colors: string[];
              composition: string;
              technical: {
                lighting: string;
                focus: string;
                quality: string;
              };
              suggestions?: string[];
            }
          }
          
          {
            "analysis": {
              "description": "A serene landscape photo of mountains at sunset",
              "objects": ["mountains", "sun", "clouds", "trees"],
              "colors": ["orange", "purple", "blue"],
              "composition": "Rule of thirds with mountains in lower third",
              "technical": {
                "lighting": "Natural golden hour lighting",
                "focus": "Sharp throughout",
                "quality": "High resolution"
              },
              "suggestions": ["Try different angles", "Experiment with foreground elements"]
            }
          }`,
          data: {
            image: base64Image,
            type: imageFile.type,
            name: imageFile.name
          }
        }),
      });

      const data = await response.json();
      return this.formatImageAnalysis(data.analysis);
    } catch (error) {
      throw new Error('Failed to analyze image');
    }
  }

  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  }

  formatImageAnalysis(analysis) {
    return `
📸 **Image Analysis**

${analysis.description}

🎯 **Objects Detected:**
${analysis.objects.map(obj => `• ${obj}`).join('\n')}

🎨 **Color Palette:**
${analysis.colors.map(color => `• ${color}`).join('\n')}

📐 **Composition:**
${analysis.composition}

📊 **Technical Details:**
• Lighting: ${analysis.technical.lighting}
• Focus: ${analysis.technical.focus}
• Quality: ${analysis.technical.quality}

${analysis.suggestions ? `
💡 **Suggestions:**
${analysis.suggestions.map(suggestion => `• ${suggestion}`).join('\n')}
` : ''}
    `;
  }
}