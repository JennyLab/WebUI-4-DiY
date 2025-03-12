export class NodeFactory {
  constructor(jsPlumb) {
    this.jsPlumb = jsPlumb;
    this.nodeCounter = 0;
  }

  createNode(type) {
    const id = `node-${this.nodeCounter++}`;
    const element = document.createElement('div');
    element.id = id;
    element.className = 'node';

    let node;
    switch (type) {
      case 'system-prompt':
        node = this.createSystemPromptNode(id, element);
        break;
      case 'user-prompt':
        node = this.createUserPromptNode(id, element);
        break;
      case 'model-select':
        node = this.createModelSelectNode(id, element);
        break;
      case 'prompt':
        node = this.createPromptNode(id, element);
        break;
      case 'modifier':
        node = this.createModifierNode(id, element);
        break;
      case 'output':
        node = this.createOutputNode(id, element);
        break;
      case 'style':
        node = this.createStyleNode(id, element);
        break;
      case 'combine':
        node = this.createCombineNode(id, element);
        break;
      case 'template':
        node = this.createTemplateNode(id, element);
        break;
      case 'translator':
        node = this.createTranslatorNode(id, element);
        break;
      case 'chat':
        node = this.createChatNode(id, element);
        break;
      case 'neural-network-visualizer':
        node = this.createNeuralNetworkVisualizerNode(id, element);
        break;
      default:
        throw new Error(`Unknown node type: ${type}`);
    }

    return node;
  }

  createSystemPromptNode(id, element) {
    element.innerHTML = `
      <div class="node-header">System Prompt</div>
      <div class="node-content">
        <select class="system-prompt-type">
          <option value="assistant">AI Assistant</option>
          <option value="expert">Domain Expert</option>
          <option value="creative">Creative Writer</option>
          <option value="custom">Custom System Prompt</option>
        </select>
        <textarea placeholder="Enter system prompt to define AI behavior..." rows="6">You are a helpful, creative, and knowledgeable AI assistant who communicates clearly and effectively.</textarea>
      </div>
      <div class="output-port"></div>
    `;

    return {
      id,
      element,
      type: 'system-prompt',
      outputs: ['system-context'],
      async execute() {
        const systemPrompt = element.querySelector('textarea').value;
        return { type: 'system', content: systemPrompt };
      }
    };
  }

  createUserPromptNode(id, element) {
    element.innerHTML = `
      <div class="node-header">User Prompt</div>
      <div class="node-content">
        <textarea placeholder="Enter what you want to ask the AI..." rows="4"></textarea>
      </div>
      <div class="input-port"></div>
      <div class="output-port"></div>
    `;

    return {
      id,
      element,
      type: 'user-prompt',
      inputs: ['context'],
      outputs: ['prompt'],
      async execute(input) {
        const systemPrompt = input?.content || 'You are a helpful AI assistant.';
        const userPrompt = element.querySelector('textarea').value;
        
        return {
          system: systemPrompt,
          user: userPrompt
        };
      }
    };
  }

  createModelSelectNode(id, element) {
    element.innerHTML = `
      <div class="node-header">AI Model</div>
      <div class="node-content">
        <select class="model-type">
          <option value="claude-3-sonnet">Claude Sonnet 3.5</option>
          <option value="gpt-4">OpenAI GPT-4</option>
          <option value="gpt-3.5-turbo">OpenAI GPT-3.5 Turbo</option>
          <option value="claude-2">Claude 2</option>
        </select>
        <div class="model-params">
          <label>Temperature:
            <input type="range" min="0" max="100" value="70" class="temp-slider">
            <span class="temp-value">0.7</span>
          </label>
        </div>
      </div>
      <div class="input-port"></div>
      <div class="output-port"></div>
    `;

    const slider = element.querySelector('.temp-slider');
    const tempValue = element.querySelector('.temp-value');
    slider.addEventListener('input', () => {
      tempValue.textContent = (slider.value / 100).toFixed(1);
    });

    return {
      id,
      element,
      type: 'model-select',
      inputs: ['prompt'],
      outputs: ['text'],
      async execute(input) {
        element.querySelector('.output-port').classList.add('executing');
        
        try {
          const model = element.querySelector('.model-type').value;
          const temperature = element.querySelector('.temp-slider').value / 100;

          if (!input || !input.system || !input.user) {
            console.error('Invalid input received:', input);
            throw new Error('Missing system or user prompt');
          }

          const systemPrompt = input.system;
          const userPrompt = input.user;

          console.log("Making AI completion request with:", {
            systemPrompt,
            userPrompt,
            model,
            temperature
          });

          const response = await fetch('/api/ai_completion', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              prompt: `${systemPrompt}\n\nUser: ${userPrompt}\n\nAssistant:`,
              data: {
                messages: [
                  {
                    role: "system",
                    content: systemPrompt
                  },
                  {
                    role: "user", 
                    content: userPrompt
                  }
                ],
                model: model,
                temperature: temperature
              }
            })
          });

          if (!response.ok) {
            throw new Error(`AI completion request failed: ${response.statusText}`);
          }

          const data = await response.json();
          console.log("AI completion response:", data);

          let result = '';
          if (typeof data === 'string') {
            result = data;
          } else if (data.choices && data.choices[0]) {
            result = data.choices[0].message.content;
          } else if (data.text) {
            result = data.text;
          } else {
            result = JSON.stringify(data);
          }

          result = result.replace(/^Assistant:\s*/i, '').trim();

          return result;

        } catch (error) {
          console.error('Error in model execution:', error);
          throw new Error('Failed to get AI response: ' + error.message);
        } finally {
          element.querySelector('.output-port').classList.remove('executing');
        }
      }
    };
  }

  createPromptNode(id, element) {
    element.innerHTML = `
      <div class="node-header">Prompt</div>
      <div class="node-content">
        <select class="prompt-type">
          <option value="story">Story Generation</option>
          <option value="article">Article Writing</option>
          <option value="dialogue">Dialogue Creation</option>
          <option value="poetry">Poetry</option>
          <option value="custom">Custom Prompt</option>
        </select>
        <textarea placeholder="Enter your prompt here..."></textarea>
      </div>
      <div class="output-port"></div>
    `;

    return {
      id,
      element,
      type: 'prompt',
      outputs: ['text'],
      async execute() {
        const promptType = element.querySelector('.prompt-type').value;
        const userPrompt = element.querySelector('textarea').value;
        
        const promptTemplates = {
          story: "Write a creative story based on this prompt:",
          article: "Write an informative article about:",
          dialogue: "Create a dialogue scene where:",
          poetry: "Compose a poem about:",
          custom: ""
        };

        const basePrompt = promptTemplates[promptType];
        
        const response = await fetch('/api/ai_completion', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            prompt: `${basePrompt} ${userPrompt}
            
            Make it engaging and well-structured.
            
            <typescript-interface>
            interface Response {
              text: string;
            }
            </typescript-interface>
            
            <example>
            {
              "text": "Once upon a time in a digital realm..."
            }
            </example>`,
            data: userPrompt
          })
        });
        const data = await response.json();
        return data.text;
      }
    };
  }

  createModifierNode(id, element) {
    element.innerHTML = `
      <div class="node-header">Modifier</div>
      <div class="node-content">
        <select>
          <option value="expand">Expand</option>
          <option value="summarize">Summarize</option>
          <option value="translate">Translate to French</option>
        </select>
      </div>
      <div class="input-port"></div>
      <div class="output-port"></div>
    `;

    return {
      id,
      element,
      type: 'modifier',
      inputs: ['text'],
      outputs: ['text'],
      async execute(input) {
        const mode = element.querySelector('select').value;
        const response = await fetch('/api/ai_completion', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            prompt: `${mode} the following text: ${input}
            
            <typescript-interface>
            interface Response {
              text: string;
            }
            </typescript-interface>
            
            <example>
            {
              "text": "Modified version of the input text..."
            }
            </example>`,
            data: input
          })
        });
        const data = await response.json();
        return data.text;
      }
    };
  }

  createOutputNode(id, element) {
    element.innerHTML = `
      <div class="node-header">Output</div>
      <div class="node-content">
        <div class="output-text"></div>
      </div>
      <div class="input-port"></div>
    `;

    return {
      id,
      element,
      type: 'output',
      inputs: ['text'],
      async execute(input) {
        element.querySelector('.output-text').textContent = input;
        return input;
      }
    };
  }

  createStyleNode(id, element) {
    element.innerHTML = `
      <div class="node-header">Style</div>
      <div class="node-content">
        <select class="style-type">
          <option value="professional">Professional</option>
          <option value="casual">Casual</option>
          <option value="academic">Academic</option>
          <option value="poetic">Poetic</option>
          <option value="humorous">Humorous</option>
        </select>
      </div>
      <div class="input-port"></div>
      <div class="output-port"></div>
    `;

    return {
      id,
      element,
      type: 'style',
      inputs: ['text'],
      outputs: ['text'],
      async execute(input) {
        const style = element.querySelector('.style-type').value;
        const response = await fetch('/api/ai_completion', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            prompt: `Rewrite the following text in a ${style} style: ${input}
            
            <typescript-interface>
            interface Response {
              text: string;
            }
            </typescript-interface>`,
            data: input
          })
        });
        const data = await response.json();
        return data.text;
      }
    };
  }

  createCombineNode(id, element) {
    element.innerHTML = `
      <div class="node-header">Combine</div>
      <div class="node-content">
        <select class="combine-type">
          <option value="merge">Merge</option>
          <option value="alternate">Alternate</option>
          <option value="compare">Compare & Contrast</option>
        </select>
      </div>
      <div class="input-port"></div>
      <div class="input-port" style="top: 70%"></div>
      <div class="output-port"></div>
    `;

    return {
      id,
      element,
      type: 'combine',
      inputs: ['text1', 'text2'],
      outputs: ['text'],
      async execute(input1, input2) {
        const mode = element.querySelector('.combine-type').value;
        const response = await fetch('/api/ai_completion', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            prompt: `${mode} these two texts into a coherent piece: 
            Text 1: ${input1}
            Text 2: ${input2}
            
            <typescript-interface>
            interface Response {
              text: string;
            }
            </typescript-interface>`,
            data: { text1: input1, text2: input2 }
          })
        });
        const data = await response.json();
        return data.text;
      }
    };
  }

  createTemplateNode(id, element) {
    element.innerHTML = `
      <div class="node-header">Template</div>
      <div class="node-content">
        <select class="template-type">
          <option value="email">Email Template</option>
          <option value="blog">Blog Post</option>
          <option value="social">Social Media Post</option>
          <option value="announcement">Announcement</option>
        </select>
        <textarea placeholder="Template variables..."></textarea>
      </div>
      <div class="input-port"></div>
      <div class="output-port"></div>
    `;

    return {
      id,
      element,
      type: 'template',
      inputs: ['text'],
      outputs: ['text'],
      async execute(input) {
        const template = element.querySelector('.template-type').value;
        const variables = element.querySelector('textarea').value;
        
        const response = await fetch('/api/ai_completion', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            prompt: `Format this content as a ${template} using these variables: ${variables}
            Content: ${input}
            
            <typescript-interface>
            interface Response {
              text: string;
            }
            </typescript-interface>`,
            data: { content: input, variables }
          })
        });
        const data = await response.json();
        return data.text;
      }
    };
  }

  createTranslatorNode(id, element) {
    element.innerHTML = `
      <div class="node-header">Translator</div>
      <div class="node-content">
        <select class="target-language">
          <option value="french">French</option>
          <option value="spanish">Spanish</option>
          <option value="german">German</option>
          <option value="italian">Italian</option>
          <option value="japanese">Japanese</option>
          <option value="chinese">Chinese</option>
          <option value="korean">Korean</option>
          <option value="russian">Russian</option>
        </select>
      </div>
      <div class="input-port"></div>
      <div class="output-port"></div>
    `;

    return {
      id,
      element,
      type: 'translator',
      inputs: ['text'],
      outputs: ['text'],
      async execute(input) {
        const targetLang = element.querySelector('.target-language').value;
        const response = await fetch('/api/ai_completion', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: `Translate the following text to ${targetLang}:
            "${input}"
            
            Respond with only the translated text.
            
            <typescript-interface>
            interface Response {
              text: string;
            }
            </typescript-interface>
            
            <example>
            {
              "text": "Bonjour le monde"
            }
            </example>`,
            data: input
          })
        });

        const data = await response.json();
        return data.text;
      }
    };
  }

  createChatNode(id, element) {
    element.innerHTML = `
      <div class="node-header">Chat History</div>
      <div class="node-content">
        <div class="chat-messages"></div>
        <textarea placeholder="Enter your message..." rows="2"></textarea>
      </div>
      <div class="input-port"></div>
      <div class="output-port"></div>
    `;

    let chatHistory = [];

    const updateChatDisplay = () => {
      const chatDiv = element.querySelector('.chat-messages');
      chatDiv.innerHTML = chatHistory.map(msg => `
        <div class="chat-message ${msg.role}">
          <strong>${msg.role}:</strong> ${msg.content}
        </div>
      `).join('');
      chatDiv.scrollTop = chatDiv.scrollHeight;
    };

    return {
      id,
      element,
      type: 'chat',
      inputs: ['text'],
      outputs: ['text'],
      async execute(input) {
        if (input) {
          chatHistory.push({ role: 'system', content: input });
        }

        const userMessage = element.querySelector('textarea').value;
        if (userMessage) {
          chatHistory.push({ role: 'user', content: userMessage });
        }

        updateChatDisplay();

        const response = await fetch('/api/ai_completion', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: `Previous chat context:
            ${chatHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}
            
            Continue the conversation naturally.
            
            <typescript-interface>
            interface Response {
              text: string;
            }
            </typescript-interface>
            
            <example>
            {
              "text": "I understand your question. Let me help with that..."
            }
            </example>`,
            data: userMessage
          })
        });

        const data = await response.json();
        chatHistory.push({ role: 'assistant', content: data.text });
        updateChatDisplay();
        return data.text;
      }
    };
  }

  createNeuralNetworkVisualizerNode(id, element) {
    element.innerHTML = `
      <div class="node-header">Neural Network Visualizer</div>
      <div class="node-content">
        <div class="network-params">
          <label>Layers:
            <input type="number" class="layers-input" value="3" min="2" max="8">
          </label>
          <label>Neurons per layer:
            <input type="number" class="neurons-input" value="4" min="1" max="10">
          </label>
        </div>
        <div class="network-canvas">
          <svg width="220" height="200"></svg>
        </div>
      </div>
      <div class="input-port"></div>
      <div class="output-port"></div>
    `;

    const svg = element.querySelector('svg');
    const layersInput = element.querySelector('.layers-input');
    const neuronsInput = element.querySelector('.neurons-input');

    const drawNetwork = () => {
      const layers = parseInt(layersInput.value);
      const neuronsPerLayer = parseInt(neuronsInput.value);
      
      svg.innerHTML = '';
      
      const width = 220;
      const height = 200;
      const layerSpacing = width / (layers + 1);
      const neuronSpacing = height / (neuronsPerLayer + 1);
      
      // Draw connections first (so they appear behind neurons)
      for (let l = 0; l < layers - 1; l++) {
        for (let n1 = 0; n1 < neuronsPerLayer; n1++) {
          for (let n2 = 0; n2 < neuronsPerLayer; n2++) {
            const x1 = layerSpacing * (l + 1);
            const y1 = neuronSpacing * (n1 + 1);
            const x2 = layerSpacing * (l + 2);
            const y2 = neuronSpacing * (n2 + 1);
            
            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("x1", x1);
            line.setAttribute("y1", y1);
            line.setAttribute("x2", x2);
            line.setAttribute("y2", y2);
            line.setAttribute("stroke", "rgba(0, 255, 157, 0.2)");
            line.setAttribute("stroke-width", "1");
            svg.appendChild(line);
          }
        }
      }
      
      // Draw neurons
      for (let l = 0; l < layers; l++) {
        for (let n = 0; n < neuronsPerLayer; n++) {
          const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
          circle.setAttribute("cx", layerSpacing * (l + 1));
          circle.setAttribute("cy", neuronSpacing * (n + 1));
          circle.setAttribute("r", "6");
          circle.setAttribute("fill", "#00ff9d");
          svg.appendChild(circle);
        }
      }
    };

    layersInput.addEventListener('input', drawNetwork);
    neuronsInput.addEventListener('input', drawNetwork);
    
    // Initial draw
    drawNetwork();

    return {
      id,
      element,
      type: 'neural-network-visualizer',
      inputs: ['text'],
      outputs: ['text'],
      async execute(input) {
        const layers = parseInt(layersInput.value);
        const neurons = parseInt(neuronsInput.value);
        
        const response = await fetch('/api/ai_completion', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            prompt: `Given this neural network configuration:
            - Number of layers: ${layers}
            - Neurons per layer: ${neurons}
            
            Analyze the following input and explain how it might be processed through this neural network:
            "${input}"
            
            Provide a technical but engaging explanation.
            
            <typescript-interface>
            interface Response {
              text: string;
            }
            </typescript-interface>`,
            data: input
          })
        });
        
        const data = await response.json();
        return data.text;
      }
    };
  }
}