export class ImageGenerator {
  constructor() {
    this.endpoint = '/api/ai_completion';
    this.setupEventListeners();
  }

  setupEventListeners() {
    const generateBtn = document.getElementById('generateImageBtn');
    generateBtn.addEventListener('click', () => this.generateImage());
  }

  async generateImage() {
    const prompt = document.getElementById('imagePrompt').value;
    const size = document.getElementById('imageSize').value;
    const style = document.getElementById('imageStyle').value;

    if (!prompt) {
      this.showError('Please enter a prompt');
      return;
    }

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          prompt: `Generate an image based on this description. Return the image URL.
          Style: ${style}
          Size: ${size}
          
          interface Response {
            imageUrl: string;
          }
          
          {
            "imageUrl": "https://images.websim.ai/generated/123.png"
          }
          `,
          data: prompt,
        }),
      });

      const data = await response.json();
      this.displayGeneratedImage(data.imageUrl);
    } catch (error) {
      this.showError('Failed to generate image');
    }
  }

  displayGeneratedImage(imageUrl) {
    const container = document.getElementById('generatedImages');
    const imageDiv = document.createElement('div');
    imageDiv.className = 'generated-image';
    
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = 'Generated image';
    
    imageDiv.appendChild(img);
    container.insertBefore(imageDiv, container.firstChild);
  }

  showError(message) {
    // Use the existing notification system
    const event = new CustomEvent('notification', {
      detail: { message, type: 'error' }
    });
    document.dispatchEvent(event);
  }
}