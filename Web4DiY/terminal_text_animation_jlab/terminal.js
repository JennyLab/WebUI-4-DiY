let animationSteps = [];
let isPlaying = false;

const typingConfig = {
  baseDelay: 150,  
  randomVariation: 50,  
  fastKeys: new Set(['e', 'a', 'i', 'o', 'n', 's', 'h', 'r', 't', ' ']), 
  slowKeys: new Set(['z', 'q', 'x', 'j', 'k', 'v', 'b', 'p', 'y']),     
  punctuation: new Set(['.', ',', '!', '?', ';', ':']),                  
  consecutiveMultiplier: 0.8,  
  deleteBaseDelay: 120,  
  deleteVariation: 30,
};

function getTypingDelay(currentChar, previousChar) {
  let delay = typingConfig.baseDelay;
  
  delay += (Math.random() * 2 - 1) * typingConfig.randomVariation;
  
  if (typingConfig.fastKeys.has(currentChar.toLowerCase())) {
    delay *= 0.8;
  } else if (typingConfig.slowKeys.has(currentChar.toLowerCase())) {
    delay *= 1.3;
  }
  
  if (typingConfig.punctuation.has(currentChar)) {
    delay *= 1.5;
  }
  
  if (currentChar === previousChar) {
    delay *= typingConfig.consecutiveMultiplier;
  }
  
  if (typingConfig.punctuation.has(previousChar)) {
    delay += 200;
  }
  
  if (previousChar === ' ') {
    delay += 50;
  }
  
  return Math.max(30, Math.min(400, delay));
}

function getDeleteDelay() {
  const baseDelay = typingConfig.deleteBaseDelay;
  const variation = (Math.random() * 2 - 1) * typingConfig.deleteVariation;
  return Math.max(30, Math.min(200, baseDelay + variation));
}

async function typeText(text, element, speed = 1.0) {
  let previousChar = '';
  
  for (let i = 0; i < text.length; i++) {
    const currentChar = text[i];
    element.textContent += currentChar;
    await updateCursor();
    const delay = getTypingDelay(currentChar, previousChar) / speed;
    soundManager.playKeypress();
    await new Promise(resolve => setTimeout(resolve, delay));
    previousChar = currentChar;
  }
}

async function deleteText(element, charCount, type = 'normal', speed = 1) {
  const cursor = element.querySelector('.cursor');
  if (cursor) cursor.remove();

  let charsToDelete = charCount;
  
  if (type === 'all') {
    charsToDelete = element.textContent.length;
  } else if (type === 'tillbreak') {
    const text = element.textContent;
    const indexOfBreak = text.lastIndexOf('\n');
    if (indexOfBreak === -1) {
      charsToDelete = text.length;
    } else {
      charsToDelete = text.length - indexOfBreak;
    }
  }

  while (charsToDelete > 0 && element.textContent.length > 0) {
    const text = element.textContent;
    element.textContent = text.slice(0, -1);
    await updateCursor();
    soundManager.playDelete();
    const delay = getDeleteDelay() / speed;
    await new Promise(resolve => setTimeout(resolve, delay));
    charsToDelete--;
  }
}

function parseCommand(input) {
  const commands = [];
  let currentText = '';
  let currentIndex = 0;
  let nextSpeed = 1.0;

  while (currentIndex < input.length) {
    if (input[currentIndex] === '/' && currentIndex + 1 < input.length) {
      if (input.slice(currentIndex).startsWith('//')) {
        if (currentText.trim()) {
          commands.push({ type: 'text', content: currentText.trim(), speed: nextSpeed });
          nextSpeed = 1.0;
          currentText = '';
        }
        commands.push({ type: 'text', content: '\n', speed: nextSpeed });
        nextSpeed = 1.0;
        currentIndex += 2;
        continue;
      }

      if (currentText.trim()) {
        commands.push({ type: 'text', content: currentText.trim(), speed: nextSpeed });
        nextSpeed = 1.0;
        currentText = '';
      }

      if (input.slice(currentIndex).startsWith('/pause[') || input.slice(currentIndex).startsWith('/p[')) {
        const isLongFormat = input.slice(currentIndex).startsWith('/pause[');
        const startIndex = currentIndex + (isLongFormat ? 7 : 3);
        const endBracket = input.indexOf(']', currentIndex);
        if (endBracket !== -1) {
          const value = parseFloat(input.slice(startIndex, endBracket));
          if (!isNaN(value)) {
            commands.push({ type: 'pause', duration: isLongFormat ? value : value * 1000 });
          }
          currentIndex = endBracket + 1;
          continue;
        }
      } else if (input.slice(currentIndex).startsWith('/speed[') || input.slice(currentIndex).startsWith('/s[')) {
        const isLongFormat = input.slice(currentIndex).startsWith('/speed[');
        const startIndex = currentIndex + (isLongFormat ? 7 : 3);
        const endBracket = input.indexOf(']', currentIndex);
        if (endBracket !== -1) {
          const speed = parseFloat(input.slice(startIndex, endBracket));
          if (!isNaN(speed)) {
            nextSpeed = speed;
          }
          currentIndex = endBracket + 1;
          continue;
        }
      } else if (input.slice(currentIndex).startsWith('/remove[') || input.slice(currentIndex).startsWith('/r[')) {
        const isLongFormat = input.slice(currentIndex).startsWith('/remove[');
        const startIndex = currentIndex + (isLongFormat ? 8 : 3);
        const endBracket = input.indexOf(']', currentIndex);
        if (endBracket !== -1) {
          const value = input.slice(startIndex, endBracket);
          if (value === 'all' || value === 'tillbreak') {
            commands.push({ type: 'remove', special: value, speed: nextSpeed });
            nextSpeed = 1.0;
          } else {
            const chars = parseInt(value);
            if (!isNaN(chars)) {
              commands.push({ type: 'remove', chars, speed: nextSpeed });
              nextSpeed = 1.0;
            }
          }
          currentIndex = endBracket + 1;
          continue;
        }
      }
      
      // This is a single '/' being used as a space
      commands.push({ type: 'text', content: ' ', speed: nextSpeed });
      nextSpeed = 1.0;
      currentIndex++;
      continue;
    }
    currentText += input[currentIndex];
    currentIndex++;
  }

  if (currentText.trim()) {
    commands.push({ type: 'text', content: currentText.trim(), speed: nextSpeed });
  }

  return commands;
}

async function updateCursor() {
  const existingCursors = document.querySelectorAll('.cursor');
  existingCursors.forEach(cursor => cursor.remove());
  
  const output = document.getElementById('output');
  const cursor = document.createElement('span');
  cursor.className = 'cursor';
  cursor.textContent = '|';
  output.appendChild(cursor);
}

async function preview() {
  if (isPlaying) return;
  isPlaying = true;
  
  const output = document.getElementById('output');
  output.innerHTML = '';
  await updateCursor();

  let previousText = '';
  
  for (const step of animationSteps) {
    switch (step.type) {
      case 'text':
        const span = document.createElement('span');
        output.appendChild(span);
        
        if (step.text === '\n') {
          span.textContent = '\n';
          previousText = output.textContent;
          await updateCursor();
        } else {
          await typeText(step.text, span, step.speed);
          previousText = output.textContent;
        }
        break;
        
      case 'pause':
        await new Promise(resolve => setTimeout(resolve, step.delay));
        break;
        
      case 'remove':
        const cursor = output.querySelector('.cursor');
        if (cursor) cursor.remove();
        
        const currentTextContent = output.textContent;
        const charsToDelete = Math.min(step.chars, currentTextContent.length);
        const finalText = currentTextContent.slice(0, -charsToDelete);
        
        const tempSpan = document.createElement('span');
        tempSpan.textContent = currentTextContent;
        output.innerHTML = '';
        output.appendChild(tempSpan);
        
        for (let i = 0; i < charsToDelete; i++) {
          tempSpan.textContent = tempSpan.textContent.slice(0, -1);
          await updateCursor();
          soundManager.playDelete();
          const delay = getDeleteDelay() / (step.speed || 1); // Apply speed to delete delay
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        break;
    }
  }
  
  isPlaying = false;
}

function clearSteps() {
  animationSteps = [];
  updateStepsList();
  document.getElementById('output').innerHTML = '';
  updateCursor();
}

async function generateVideo() {
  if (isPlaying) return;
  isPlaying = true;
  
  const terminal = document.querySelector('.terminal');
  const frames = [];
  
  const output = document.getElementById('output');
  output.innerHTML = '';
  await updateCursor();
  
  frames.push(await html2canvas(terminal));
  
  for (const step of animationSteps) {
    switch (step.type) {
      case 'text':
        const span = document.createElement('span');
        output.appendChild(span);
        
        if (step.text === '\n') {
          span.textContent = '\n';
          await updateCursor();
          frames.push(await html2canvas(terminal));
        } else {
          for (let i = 0; i < step.text.length; i++) {
            span.textContent += step.text[i];
            await updateCursor();
            soundManager.playKeypress();
            frames.push(await html2canvas(terminal));
            await new Promise(resolve => setTimeout(resolve, getTypingDelay(step.text[i], i > 0 ? step.text[i-1] : '') / step.speed));
          }
        }
        break;
        
      case 'pause':
        const pauseFrames = Math.ceil(step.delay / (1000 / 30)); // 30fps
        for (let i = 0; i < pauseFrames; i++) {
          frames.push(await html2canvas(terminal));
        }
        break;
    }
  }
  
  const canvas = document.createElement('canvas');
  canvas.width = frames[0].width;
  canvas.height = frames[0].height;
  const ctx = canvas.getContext('2d');
  
  const videoStream = canvas.captureStream(30);
  const mediaRecorder = new MediaRecorder(videoStream, {
    mimeType: 'video/webm;codecs=vp9'
  });
  
  const chunks = [];
  mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
  
  mediaRecorder.onstop = () => {
    const blob = new Blob(chunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'terminal-animation.webm';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    isPlaying = false;
  };
  
  mediaRecorder.start();
  
  let frameIndex = 0;
  function drawNextFrame() {
    if (frameIndex < frames.length) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(frames[frameIndex], 0, 0);
      frameIndex++;
      requestAnimationFrame(drawNextFrame);
    } else {
      mediaRecorder.stop();
    }
  }
  
  drawNextFrame();
}

function deleteStep(index) {
  animationSteps.splice(index, 1);
  updateStepsList();
}

function addStep() {
  const input = document.getElementById('text').value;
  if (!input) return;

  const commands = parseCommand(input);
  
  commands.forEach(command => {
    switch (command.type) {
      case 'text':
        animationSteps.push({ 
          text: command.content,
          speed: command.speed,  
          type: 'text'
        });
        break;
      case 'pause':
        animationSteps.push({
          type: 'pause',
          delay: command.duration
        });
        break;
      case 'remove':
        animationSteps.push({
          type: 'remove',
          chars: command.chars,
          speed: command.speed  
        });
        break;
    }
  });

  updateStepsList();
  document.getElementById('text').value = '';
}

function updateStepsList() {
  const stepsList = document.getElementById('steps');
  const container = stepsList.parentElement;
  
  // Add copy all button if it doesn't exist
  if (!container.querySelector('.copy-all-btn')) {
    const copyAllBtn = document.createElement('button');
    copyAllBtn.className = 'copy-all-btn';
    copyAllBtn.textContent = '📋 Copy All Steps';
    copyAllBtn.onclick = () => {
      let currentSpeed = 1;
      const stepsText = animationSteps.map((step, index) => {
        let command = '';
        
        if (step.speed && step.speed !== currentSpeed) {
          currentSpeed = step.speed;
          command = `/s[${step.speed}] `;
        }
        
        switch(step.type) {
          case 'text':
            if (step.text === '\n') return command + '//';
            if (step.text === ' ') return '/';
            return command + step.text;
          case 'pause':
            return `/p[${step.delay/1000}]`;
          case 'remove':
            if (step.special) {
              return command + `/r[${step.special}]`;
            }
            return command + `/r[${step.chars}]`;
        }
      }).join(' ');
      
      navigator.clipboard.writeText(stepsText).then(() => {
        copyAllBtn.textContent = '✓ Copied!';
        setTimeout(() => {
          copyAllBtn.textContent = '📋 Copy All Steps';
        }, 2000);
      });
    };
    container.insertBefore(copyAllBtn, stepsList);
  }

  stepsList.innerHTML = '';
  
  let lastOpenStepIndex = -1;

  animationSteps.forEach((step, index) => {
    const li = document.createElement('li');
    li.draggable = true;
    
    li.addEventListener('dragstart', (e) => {
      li.classList.add('dragging');
      e.dataTransfer.setData('text/plain', index.toString());
    });
    
    li.addEventListener('dragend', () => {
      li.classList.remove('dragging');
      document.querySelectorAll('#steps li').forEach(item => {
        item.classList.remove('drag-over', 'drag-over-top', 'drag-over-bottom');
      });
    });
    
    li.addEventListener('dragover', (e) => {
      e.preventDefault();
      const rect = li.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      
      if (e.clientY < midY) {
        li.classList.add('drag-over', 'drag-over-top');
        li.classList.remove('drag-over-bottom');
      } else {
        li.classList.add('drag-over', 'drag-over-bottom');
        li.classList.remove('drag-over-top');
      }
    });
    
    li.addEventListener('dragleave', () => {
      li.classList.remove('drag-over', 'drag-over-top', 'drag-over-bottom');
    });
    
    li.addEventListener('drop', (e) => {
      e.preventDefault();
      const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'));
      const targetIndex = index;
      
      if (sourceIndex !== targetIndex) {
        const rect = li.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        const insertAfter = e.clientY > midY;
        
        const item = animationSteps[sourceIndex];
        animationSteps.splice(sourceIndex, 1);
        animationSteps.splice(insertAfter ? targetIndex : targetIndex - (sourceIndex < targetIndex ? 1 : 0), 0, item);
        updateStepsList();
      }
      
      li.classList.remove('drag-over', 'drag-over-top', 'drag-over-bottom');
    });
    
    const header = document.createElement('div');
    header.className = 'step-header';
    
    const stepInfo = document.createElement('span');
    switch (step.type) {
      case 'text':
        if (step.text === '\n') {
          stepInfo.textContent = `Line Break ${step.speed !== 1 ? `(speed: ${step.speed}x)` : ''}`;
        } else if (step.text === ' ') {
          stepInfo.textContent = 'Space';
        } else {
          stepInfo.textContent = `"${step.text}" ${step.speed !== 1 ? `(speed: ${step.speed}x)` : ''}`;
        }
        break;
      case 'pause':
        stepInfo.textContent = `Pause ${step.delay}ms`;
        break;
      case 'remove':
        if (step.special) {
          stepInfo.textContent = `Remove ${step.special === 'all' ? 'all characters' : 'until line break'} ${step.speed !== 1 ? `(speed: ${step.speed}x)` : ''}`;
        } else {
          stepInfo.textContent = `Remove ${step.chars} characters ${step.speed !== 1 ? `(speed: ${step.speed}x)` : ''}`;
        }
        break;
    }
    
    const controls = document.createElement('div');
    controls.className = 'step-buttons';

    // Only show edit button for text (not spaces/linebreaks), pause, and remove steps
    if ((step.type === 'text' && step.text !== '\n' && step.text !== ' ') || 
        step.type === 'pause' || 
        step.type === 'remove') {
      const editBtn = document.createElement('button');
      editBtn.innerHTML = '<img src="file_blue_grad_paint-0.png" width="24" height="24">';
      editBtn.title = 'Edit';
      editBtn.onclick = (e) => {
        e.stopPropagation();
        const content = document.querySelector('.step-content.visible');
        if (content) {
          content.classList.remove('visible');
        }
        
        const newContent = li.querySelector('.step-content');
        if (newContent && !newContent.classList.contains('visible') && lastOpenStepIndex !== index) {
          newContent.classList.add('visible');
          lastOpenStepIndex = index;
        } else {
          lastOpenStepIndex = -1;
        }
      };
      controls.appendChild(editBtn);
    }

    const copyBtn = document.createElement('button');
    copyBtn.innerHTML = '<img src="compare_documents.png" width="24" height="24">';
    copyBtn.title = 'Copy';
    copyBtn.onclick = (e) => {
      e.stopPropagation();
      const newStep = JSON.parse(JSON.stringify(step));
      animationSteps.splice(index + 1, 0, newStep);
      updateStepsList();
    };

    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = '<img src="Recycle_Bin_Windows_98_empty.png" width="24" height="24">';
    deleteBtn.title = 'Delete';
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      deleteStep(index);
    };

    controls.appendChild(copyBtn);
    controls.appendChild(deleteBtn);
    
    header.appendChild(stepInfo);
    header.appendChild(controls);
    
    li.appendChild(header);

    if ((step.type === 'text' && step.text !== '\n' && step.text !== ' ') || 
        step.type === 'pause' || 
        step.type === 'remove') {
      const content = document.createElement('div');
      content.className = 'step-content';
      if (lastOpenStepIndex === index) {
        content.classList.add('visible');
      }
      
      const form = document.createElement('div');
      form.className = 'step-edit-form';
      
      switch (step.type) {
        case 'text':
          const textInput = document.createElement('input');
          textInput.type = 'text';
          textInput.value = step.text;
          textInput.placeholder = 'Text';
          textInput.onchange = () => {
            step.text = textInput.value;
            updateStepsList();
          };
          
          const speedInput = document.createElement('input');
          speedInput.type = 'number';
          speedInput.step = '0.1';
          speedInput.value = step.speed;
          speedInput.placeholder = 'Speed';
          speedInput.onchange = () => {
            step.speed = parseFloat(speedInput.value);
            updateStepsList();
          };
          
          form.appendChild(textInput);
          form.appendChild(speedInput);
          break;
          
        case 'pause':
          const pauseInput = document.createElement('input');
          pauseInput.type = 'number';
          pauseInput.value = step.delay;
          pauseInput.placeholder = 'Delay (ms)';
          pauseInput.onchange = () => {
            step.delay = parseInt(pauseInput.value);
            updateStepsList();
          };
          
          form.appendChild(pauseInput);
          break;
          
        case 'remove':
          if (!step.special) {
            const removeInput = document.createElement('input');
            removeInput.type = 'number';
            removeInput.value = step.chars;
            removeInput.placeholder = 'Characters to remove';
            removeInput.onchange = () => {
              step.chars = parseInt(removeInput.value);
              updateStepsList();
            };
            form.appendChild(removeInput);
          }
          
          const speedInputRemove = document.createElement('input');
          speedInputRemove.type = 'number';
          speedInputRemove.step = '0.1';
          speedInputRemove.value = step.speed || 1;
          speedInputRemove.placeholder = 'Speed';
          speedInputRemove.onchange = () => {
            step.speed = parseFloat(speedInputRemove.value);
            updateStepsList();
          };
          form.appendChild(speedInputRemove);
          break;
      }
      
      content.appendChild(form);
      li.appendChild(content);
    }
    
    stepsList.appendChild(li);
  });
}

const presets = {
  greeting: [
    { type: 'text', text: 'Hello!', speed: 1 },
    { type: 'pause', delay: 500 },
    { type: 'text', text: '\n', speed: 1 },
    { type: 'text', text: 'Welcome to the Terminal Text Animator', speed: 1.2 },
    { type: 'pause', delay: 1000 },
    { type: 'text', text: '\n', speed: 1 },
    { type: 'text', text: 'Have fun creating amazing animations! 🎨', speed: 1.5 }
  ],
  
  hacker: [
    { type: 'text', text: 'INITIATING SYSTEM ACCESS...', speed: 2 },
    { type: 'pause', delay: 800 },
    { type: 'text', text: '\n', speed: 1 },
    { type: 'text', text: 'BYPASSING FIREWALL', speed: 1.5 },
    { type: 'pause', delay: 400 },
    { type: 'text', text: '...', speed: 0.3 },
    { type: 'pause', delay: 500 },
    { type: 'text', text: '\n', speed: 1 },
    { type: 'text', text: 'ACCESS GRANTED! 🔓', speed: 2 }
  ],
  
  typing: [
    { type: 'text', text: 'The quick brown fox', speed: 1 },
    { type: 'pause', delay: 300 },
    { type: 'remove', chars: 3, speed: 1.5 },
    { type: 'text', text: 'dog', speed: 1 },
    { type: 'text', text: '\n', speed: 1 },
    { type: 'text', text: 'jumps over the lazy dog 🦊', speed: 1.2 }
  ],
  
  story: [
    { type: 'text', text: 'Once upon a time...', speed: 0.8 },
    { type: 'pause', delay: 1000 },
    { type: 'text', text: '\n', speed: 1 },
    { type: 'text', text: 'in a digital world far, far away', speed: 1 },
    { type: 'pause', delay: 800 },
    { type: 'text', text: '\n', speed: 1 },
    { type: 'text', text: 'there was a magical terminal ✨', speed: 1.2 }
  ],
  
  glitch: [
    { type: 'text', text: 'SYSTEM', speed: 3 },
    { type: 'remove', chars: 6, speed: 4 },
    { type: 'text', text: 'ERR0R', speed: 2 },
    { type: 'pause', delay: 300 },
    { type: 'remove', chars: 5, speed: 3 },
    { type: 'text', text: 'MALFUNCTION', speed: 2.5 },
    { type: 'text', text: '\n', speed: 1 },
    { type: 'text', text: '░█░█░█░█░', speed: 4 }
  ],
  
  countdown: [
    { type: 'text', text: '5', speed: 1 },
    { type: 'pause', delay: 1000 },
    { type: 'remove', chars: 1, speed: 2 },
    { type: 'text', text: '4', speed: 1 },
    { type: 'pause', delay: 1000 },
    { type: 'remove', chars: 1, speed: 2 },
    { type: 'text', text: '3', speed: 1 },
    { type: 'pause', delay: 1000 },
    { type: 'remove', chars: 1, speed: 2 },
    { type: 'text', text: '2', speed: 1 },
    { type: 'pause', delay: 1000 },
    { type: 'remove', chars: 1, speed: 2 },
    { type: 'text', text: '1', speed: 1 },
    { type: 'pause', delay: 1000 },
    { type: 'remove', chars: 1, speed: 2 },
    { type: 'text', text: 'LAUNCH! 🚀', speed: 3 }
  ]
};

function loadPreset(presetName) {
  clearSteps();
  animationSteps = [...presets[presetName]];
  updateStepsList();
}

function toggleSound() {
  const btn = document.querySelector('.sound-toggle');
  soundManager.isEnabled = !soundManager.isEnabled;
  btn.textContent = soundManager.isEnabled ? '🔊' : '🔇';
  
  // Save preference
  localStorage.setItem('soundEnabled', soundManager.isEnabled);
}

// Initialize sound preference
document.addEventListener('DOMContentLoaded', () => {
  const savedPreference = localStorage.getItem('soundEnabled');
  if (savedPreference !== null) {
    soundManager.isEnabled = savedPreference === 'true';
  }
  const btn = document.querySelector('.sound-toggle');
  btn.textContent = soundManager.isEnabled ? '🔊' : '🔇';
});