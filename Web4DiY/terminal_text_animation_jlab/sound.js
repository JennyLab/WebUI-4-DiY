class SoundManager {
  constructor() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.isEnabled = true;
    this.soundType = 'mechanical'; // Default sound type
  }

  setSoundType(type) {
    this.soundType = type;
  }

  async createKeySound() {
    switch(this.soundType) {
      case 'mechanical':
        await this.createMechanicalKeySound();
        break;
      case 'typewriter':
        await this.createTypewriterKeySound();
        break;
    }
  }

  async createMechanicalKeySound() {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filterNode = this.audioContext.createBiquadFilter();
    
    oscillator.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.type = 'square';
    const baseFreq = 440 + Math.random() * 220;
    oscillator.frequency.setValueAtTime(baseFreq, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(baseFreq * 0.9, this.audioContext.currentTime + 0.05);
    
    filterNode.type = 'lowpass';
    filterNode.frequency.setValueAtTime(1500, this.audioContext.currentTime);
    
    gainNode.gain.setValueAtTime(0.04, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);
    
    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.05);
  }

  async createTypewriterKeySound() {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filterNode = this.audioContext.createBiquadFilter();
    
    oscillator.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(220 + Math.random() * 100, this.audioContext.currentTime);
    
    filterNode.type = 'bandpass';
    filterNode.frequency.setValueAtTime(500, this.audioContext.currentTime);
    filterNode.Q.value = 5;
    
    gainNode.gain.setValueAtTime(0.25, this.audioContext.currentTime); 
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.08);
    
    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.08);
  }

  async createDeleteSound() {
    // Use typewriter sound for delete
    await this.createTypewriterKeySound();
  }

  playKeypress() {
    if (this.isEnabled) {
      this.createKeySound();
    }
  }

  playDelete() {
    if (this.isEnabled) {
      this.createDeleteSound();
    }
  }
}

const soundManager = new SoundManager();