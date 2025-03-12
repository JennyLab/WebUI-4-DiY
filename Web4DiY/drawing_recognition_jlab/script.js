document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('drawingCanvas');
    const ctx = canvas.getContext('2d');
    const penButton = document.getElementById('pen');
    const eraserButton = document.getElementById('eraser');
    const paintButton = document.getElementById('paint');
    const colorButtons = document.querySelectorAll('.color-btn');
    const clearButton = document.getElementById('clearBtn');
    const guessButton = document.getElementById('guessBtn');
    const resultDiv = document.getElementById('result');
    const guessText = document.getElementById('guess');
    const tryAgainButton = document.getElementById('tryAgain');
    const copyBtn = document.getElementById('copyBtn');
    const sizeInput = document.getElementById('sizeInput');
    const addLayerBtn = document.getElementById('addLayerBtn');
    const layersList = document.getElementById('layersList');
    const imageInput = document.getElementById('imageInput');
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    const bgMusic = document.getElementById('bgMusic');
    const muteBtn = document.getElementById('muteBtn');
    
    // Background music controls
    let isMuted = false;
    
    // Auto-play music when page loads
    bgMusic.play().catch(e => {
        console.log("Auto-play prevented by browser, waiting for user interaction:", e);
        // Set up event to play on first interaction as fallback
        document.body.addEventListener('click', function() {
            if (bgMusic.paused) {
                bgMusic.play().catch(e => console.log("Autoplay prevented:", e));
            }
        }, {once: true});
    });
    
    muteBtn.addEventListener('click', function() {
        if (isMuted) {
            bgMusic.play();
            muteBtn.textContent = "🔊 Sound On";
            muteBtn.classList.remove('muted');
        } else {
            bgMusic.pause();
            muteBtn.textContent = "🔇 Sound Off";
            muteBtn.classList.add('muted');
        }
        isMuted = !isMuted;
    });
    
    // Set canvas dimensions for proper touch/mouse coordinates
    function resizeCanvas() {
        const displayWidth = canvas.clientWidth;
        const displayHeight = canvas.clientHeight;
        
        if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
            canvas.width = displayWidth;
            canvas.height = displayHeight;
        }
    }
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Layers management
    const layers = [];
    let activeLayerIndex = 0;
    
    // Create initial layer
    function createLayer(name = `Layer ${layers.length + 1}`) {
        // Create a new offscreen canvas
        const layerCanvas = document.createElement('canvas');
        layerCanvas.width = canvas.width;
        layerCanvas.height = canvas.height;
        const layerCtx = layerCanvas.getContext('2d');
        
        // Fill with white background only for the first layer
        if (layers.length === 0) {
            layerCtx.fillStyle = '#ffffff';
            layerCtx.fillRect(0, 0, layerCanvas.width, layerCanvas.height);
        }
        
        // Add to our layers array
        const layer = {
            name: name,
            canvas: layerCanvas,
            context: layerCtx,
            visible: true,
            offsetX: 0,
            offsetY: 0,
            isDragging: false
        };
        
        layers.push(layer);
        activeLayerIndex = layers.length - 1;
        
        // Update the UI
        updateLayersList();
        return layer;
    }
    
    // Initialize with one layer
    createLayer();
    
    // Drawing state
    let isDrawing = false;
    let currentTool = 'pen';
    let currentColor = '#000000';
    let lastX = 0;
    let lastY = 0;
    let currentSize = 5; // Default pen size
    
    // Initialize size input
    sizeInput.value = currentSize;
    
    // Common drawing setup
    function startPosition(e) {
        isDrawing = true;
        const pos = getPosition(e);
        lastX = pos.x;
        lastY = pos.y;
    }
    
    function endPosition() {
        if (isDrawing) {
            isDrawing = false;
            saveState(); // Save state after drawing
        }
    }
    
    function draw(e) {
        if (!isDrawing) return;
        
        const pos = getPosition(e);
        
        // Get the active layer context
        const layerCtx = layers[activeLayerIndex].context;
        
        layerCtx.lineJoin = 'round';
        layerCtx.lineCap = 'round';
        
        if (currentTool === 'pen') {
            layerCtx.strokeStyle = currentColor;
            layerCtx.lineWidth = currentSize;
        } else if (currentTool === 'eraser') {
            layerCtx.strokeStyle = 'white';
            layerCtx.lineWidth = currentSize * 2; // Eraser is slightly larger
        }
        
        layerCtx.beginPath();
        layerCtx.moveTo(lastX, lastY);
        layerCtx.lineTo(pos.x, pos.y);
        layerCtx.stroke();
        
        lastX = pos.x;
        lastY = pos.y;
        
        // Redraw all layers on main canvas
        redrawCanvas();
    }
    
    // Paint bucket fill function
    function paintFill(e) {
        if (currentTool !== 'paint') return;
        
        const pos = getPosition(e);
        const layerCtx = layers[activeLayerIndex].context;
        const imageData = layerCtx.getImageData(0, 0, canvas.width, canvas.height);
        const targetColor = getPixelColor(imageData, pos.x, pos.y);
        const fillColor = hexToRgba(currentColor);
        
        // Don't fill if already the same color
        if (colorsMatch(targetColor, fillColor)) return;
        
        floodFill(imageData, pos.x, pos.y, targetColor, fillColor);
        layerCtx.putImageData(imageData, 0, 0);
        redrawCanvas();
        saveState(); // Save state after filling
    }
    
    // Helper to get position regardless of mouse or touch event
    function getPosition(e) {
        let x, y;
        const rect = canvas.getBoundingClientRect();
        
        if (e.type.includes('touch')) {
            x = e.touches[0].clientX - rect.left;
            y = e.touches[0].clientY - rect.top;
        } else {
            x = e.clientX - rect.left;
            y = e.clientY - rect.top;
        }
        
        return { x, y };
    }
    
    // Get pixel color at position
    function getPixelColor(imageData, x, y) {
        const index = (Math.floor(y) * imageData.width + Math.floor(x)) * 4;
        return {
            r: imageData.data[index],
            g: imageData.data[index + 1],
            b: imageData.data[index + 2],
            a: imageData.data[index + 3]
        };
    }
    
    // Convert hex color to rgba
    function hexToRgba(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return { r, g, b, a: 255 };
    }
    
    // Check if two colors match
    function colorsMatch(c1, c2) {
        const tolerance = 10; // Allow some tolerance for anti-aliasing
        return Math.abs(c1.r - c2.r) <= tolerance &&
               Math.abs(c1.g - c2.g) <= tolerance &&
               Math.abs(c1.b - c2.b) <= tolerance &&
               Math.abs(c1.a - c2.a) <= tolerance;
    }
    
    // Flood fill algorithm
    function floodFill(imageData, x, y, targetColor, fillColor) {
        const width = imageData.width;
        const height = imageData.height;
        const data = imageData.data;
        
        // Create a queue and visited array
        const queue = [{x: Math.floor(x), y: Math.floor(y)}];
        const visited = new Set();
        
        while (queue.length > 0) {
            const current = queue.shift();
            const cx = current.x;
            const cy = current.y;
            
            // Skip if already visited or out of bounds
            if (cx < 0 || cy < 0 || cx >= width || cy >= height || visited.has(`${cx},${cy}`)) {
                continue;
            }
            
            // Mark as visited
            visited.add(`${cx},${cy}`);
            
            // Get current pixel color
            const pixelIndex = (cy * width + cx) * 4;
            const currentColor = {
                r: data[pixelIndex],
                g: data[pixelIndex + 1],
                b: data[pixelIndex + 2],
                a: data[pixelIndex + 3]
            };
            
            // If color doesn't match target, skip
            if (!colorsMatch(currentColor, targetColor)) {
                continue;
            }
            
            // Set new color
            data[pixelIndex] = fillColor.r;
            data[pixelIndex + 1] = fillColor.g;
            data[pixelIndex + 2] = fillColor.b;
            data[pixelIndex + 3] = fillColor.a;
            
            // Add neighboring pixels to queue
            queue.push({x: cx + 1, y: cy});
            queue.push({x: cx - 1, y: cy});
            queue.push({x: cx, y: cy + 1});
            queue.push({x: cx, y: cy - 1});
        }
    }
    
    // Layer functions
    function updateLayersList() {
        layersList.innerHTML = '';
        
        layers.forEach((layer, index) => {
            const layerItem = document.createElement('div');
            layerItem.className = `layer-item ${index === activeLayerIndex ? 'active' : ''}`;
            
            const visibilityIcon = document.createElement('span');
            visibilityIcon.className = 'layer-visibility';
            visibilityIcon.textContent = layer.visible ? '👁️' : '👁️‍🗨️';
            
            const layerName = document.createElement('span');
            layerName.className = 'layer-name';
            layerName.textContent = layer.name;
            
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'layer-buttons';
            
            if (layers.length > 1) {
                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = '❌';
                deleteBtn.title = 'Delete layer';
                deleteBtn.onclick = (e) => {
                    e.stopPropagation();
                    deleteLayer(index);
                };
                buttonContainer.appendChild(deleteBtn);
            }
            
            layerItem.appendChild(visibilityIcon);
            layerItem.appendChild(layerName);
            layerItem.appendChild(buttonContainer);
            
            // Event listeners
            layerItem.onclick = () => setActiveLayer(index);
            
            // Layer movement handlers - long press to start dragging
            let pressTimer;
            layerItem.addEventListener('mousedown', function() {
                pressTimer = window.setTimeout(function() {
                    startLayerDragging(index);
                }, 300); // 300ms for long press
            });
            
            layerItem.addEventListener('mouseup', function() {
                clearTimeout(pressTimer);
            });
            
            layerItem.addEventListener('mouseleave', function() {
                clearTimeout(pressTimer);
            });
            
            // Touch support for long press
            layerItem.addEventListener('touchstart', function(e) {
                pressTimer = window.setTimeout(function() {
                    startLayerDragging(index);
                }, 300);
            });
            
            layerItem.addEventListener('touchend', function() {
                clearTimeout(pressTimer);
            });
            
            visibilityIcon.onclick = (e) => {
                e.stopPropagation();
                toggleLayerVisibility(index);
            };
            
            layersList.appendChild(layerItem);
        });
        
        redrawCanvas();
    }
    
    function setActiveLayer(index) {
        activeLayerIndex = index;
        updateLayersList();
    }
    
    function deleteLayer(index) {
        // Can't delete if there's only one layer
        if (layers.length <= 1) return;
        
        layers.splice(index, 1);
        
        // If we deleted the active layer, select another one
        if (activeLayerIndex >= layers.length) {
            activeLayerIndex = layers.length - 1;
        }
        
        updateLayersList();
    }
    
    function toggleLayerVisibility(index) {
        layers[index].visible = !layers[index].visible;
        updateLayersList();
    }
    
    function redrawCanvas() {
        // Clear the main canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw each visible layer onto the main canvas
        layers.forEach(layer => {
            if (layer.visible) {
                ctx.drawImage(layer.canvas, layer.offsetX, layer.offsetY);
            }
        });
    }
    
    // Update all layer canvases on resize
    function resizeAllLayers() {
        layers.forEach(layer => {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            const tempCtx = tempCanvas.getContext('2d');
            
            // Copy current content to temp canvas
            tempCtx.drawImage(layer.canvas, 0, 0, canvas.width, canvas.height);
            
            // Resize layer canvas
            layer.canvas.width = canvas.width;
            layer.canvas.height = canvas.height;
            
            // Copy back
            layer.context.drawImage(tempCanvas, 0, 0);
        });
        
        redrawCanvas();
    }
    
    // Image importing
    function handleImageImport(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                // Create a new layer for the image
                const layer = createLayer(`Image ${layers.length}`);
                
                // Calculate dimensions to maintain aspect ratio
                let width, height;
                if (img.width > img.height) {
                    width = canvas.width;
                    height = (img.height / img.width) * canvas.width;
                } else {
                    height = canvas.height;
                    width = (img.width / img.height) * canvas.height;
                }
                
                // Center the image
                const x = (canvas.width - width) / 2;
                const y = (canvas.height - height) / 2;
                
                // Draw the image on the layer
                layer.context.drawImage(img, x, y, width, height);
                redrawCanvas();
                saveState(); // Save state after importing
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
    
    // Undo/Redo functionality
    const historyStates = [];
    let currentHistoryIndex = -1;
    const maxHistoryStates = 20;
    
    function saveState() {
        // Remove any future states if we're not at the end of history
        if (currentHistoryIndex < historyStates.length - 1) {
            historyStates.splice(currentHistoryIndex + 1);
        }
        
        // Save the current state of all layers
        const state = layers.map(layer => {
            const layerCanvas = document.createElement('canvas');
            layerCanvas.width = canvas.width;
            layerCanvas.height = canvas.height;
            const layerCtx = layerCanvas.getContext('2d');
            layerCtx.drawImage(layer.canvas, 0, 0);
            
            return {
                canvas: layerCanvas,
                name: layer.name,
                visible: layer.visible
            };
        });
        
        // Add to history
        historyStates.push({
            layers: state,
            activeLayerIndex: activeLayerIndex
        });
        
        // Limit history size
        if (historyStates.length > maxHistoryStates) {
            historyStates.shift();
        } else {
            currentHistoryIndex++;
        }
        
        // Update button states
        updateHistoryButtons();
    }
    
    function restoreState(state) {
        // Clear current layers
        layers.length = 0;
        
        // Restore layers from history
        state.layers.forEach(historyLayer => {
            const layerCanvas = document.createElement('canvas');
            layerCanvas.width = canvas.width;
            layerCanvas.height = canvas.height;
            const layerCtx = layerCanvas.getContext('2d');
            layerCtx.drawImage(historyLayer.canvas, 0, 0);
            
            layers.push({
                name: historyLayer.name,
                canvas: layerCanvas,
                context: layerCtx,
                visible: historyLayer.visible
            });
        });
        
        // Restore active layer
        activeLayerIndex = state.activeLayerIndex;
        
        // Update UI
        updateLayersList();
        redrawCanvas();
    }
    
    function undo() {
        if (currentHistoryIndex > 0) {
            currentHistoryIndex--;
            restoreState(historyStates[currentHistoryIndex]);
            updateHistoryButtons();
        }
    }
    
    function redo() {
        if (currentHistoryIndex < historyStates.length - 1) {
            currentHistoryIndex++;
            restoreState(historyStates[currentHistoryIndex]);
            updateHistoryButtons();
        }
    }
    
    function updateHistoryButtons() {
        undoBtn.disabled = currentHistoryIndex <= 0;
        redoBtn.disabled = currentHistoryIndex >= historyStates.length - 1;
    }
    
    // Save initial state
    saveState();
    
    function clearButton_onClick() {
        // Clear only the active layer with white fill instead of transparent
        const layerCtx = layers[activeLayerIndex].context;
        layerCtx.fillStyle = '#ffffff';
        layerCtx.fillRect(0, 0, canvas.width, canvas.height);
        redrawCanvas();
        saveState(); // Save state after clearing
    }
    
    // Copy drawing functionality
    copyBtn.addEventListener('click', async function() {
        // Convert the canvas to a data URL
        const dataUrl = canvas.toDataURL('image/png');
        
        // Show loading state
        copyBtn.textContent = "Generating...";
        copyBtn.disabled = true;
        
        try {
            // Generate an image based on the drawing
            const result = await websim.imageGen({
                prompt: `Create a detailed image based on this drawing: ${guessText.textContent}`,
                width: 512,  
                height: 512, 
            });
            
            // Create a temporary link element
            const previewContainer = document.createElement('div');
            previewContainer.className = 'image-preview';
            
            const closeBtn = document.createElement('button');
            closeBtn.className = 'close-btn';
            closeBtn.textContent = '×';
            closeBtn.onclick = () => document.body.removeChild(previewContainer);
            
            const image = document.createElement('img');
            image.src = result.url;
            image.alt = "AI Generated Image";
            
            const downloadBtn = document.createElement('button');
            downloadBtn.className = 'download-btn';
            downloadBtn.textContent = 'Download';
            downloadBtn.onclick = () => {
                const downloadLink = document.createElement('a');
                downloadLink.href = result.url;
                downloadLink.download = 'ai-creation.png';
                downloadLink.click();
            };
            
            previewContainer.appendChild(closeBtn);
            previewContainer.appendChild(image);
            previewContainer.appendChild(downloadBtn);
            document.body.appendChild(previewContainer);
        } catch (error) {
            console.error("Error generating image:", error);
            alert("Failed to generate image. Please try again.");
        } finally {
            // Reset button state
            copyBtn.textContent = "Generate AI Image";
            copyBtn.disabled = false;
        }
    });
    
    // Event listeners for drawing
    canvas.addEventListener('mousedown', (e) => {
        if (currentTool === 'paint') {
            paintFill(e);
        } else {
            startPosition(e);
        }
    });
    
    canvas.addEventListener('mouseup', endPosition);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseleave', endPosition);
    
    // Touch support
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (currentTool === 'paint') {
            paintFill(e);
        } else {
            startPosition(e);
        }
    });
    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        endPosition();
    });
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        draw(e);
    });
    
    // Tool selection
    penButton.addEventListener('click', function() {
        currentTool = 'pen';
        penButton.classList.add('active');
        eraserButton.classList.remove('active');
        paintButton.classList.remove('active');
    });
    
    eraserButton.addEventListener('click', function() {
        currentTool = 'eraser';
        eraserButton.classList.add('active');
        penButton.classList.remove('active');
        paintButton.classList.remove('active');
    });
    
    paintButton.addEventListener('click', function() {
        currentTool = 'paint';
        paintButton.classList.add('active');
        penButton.classList.remove('active');
        eraserButton.classList.remove('active');
    });
    
    // Size input
    sizeInput.addEventListener('input', function() {
        currentSize = parseInt(this.value);
    });
    
    // Color selection
    colorButtons.forEach(button => {
        button.addEventListener('click', function() {
            currentColor = this.getAttribute('data-color');
            colorButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Only switch to pen if using eraser
            if (currentTool === 'eraser') {
                currentTool = 'pen';
                penButton.classList.add('active');
                eraserButton.classList.remove('active');
                paintButton.classList.remove('active');
            }
        });
    });
    
    // Set black as default active color
    colorButtons[0].classList.add('active');
    
    // Clear canvas
    clearButton.addEventListener('click', clearButton_onClick);
    
    // Layer management
    addLayerBtn.addEventListener('click', function() {
        createLayer();
        saveState(); // Save state after adding layer
    });
    
    // Undo/Redo event listeners
    undoBtn.addEventListener('click', undo);
    redoBtn.addEventListener('click', redo);
    
    // Image import
    imageInput.addEventListener('change', handleImageImport);
    
    // Guess drawing
    guessButton.addEventListener('click', async function() {
        const dataUrl = canvas.toDataURL('image/png');
        
        // Show loading state
        guessText.textContent = "Thinking...";
        resultDiv.classList.remove('result-hidden');
        resultDiv.classList.add('result');
        
        try {
            // Using the AI vision capabilities to analyze the drawing with improved prompt
            const completion = await websim.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: "You are an expert at recognizing drawings. Give a concise response identifying what the user has drawn. Be playful but accurate. If the drawing is unclear, say 'I'm not sure!' but try your best guess. Importantly, pay close attention to the shape of any drawing elements whether they're black on white or white on black. Focus on the lines, shapes, and forms created by the contrast between areas."
                    },
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: "What is this drawing of? Focus on the main subject of the drawing and be specific. Look for shapes created by lines or filled areas regardless of color."
                            },
                            {
                                type: "image_url",
                                image_url: { url: dataUrl }
                            }
                        ]
                    }
                ]
            });
            
            // Show the result
            guessText.textContent = completion.content;
            
        } catch (error) {
            console.error("Error analyzing drawing:", error);
            guessText.textContent = "I couldn't analyze that drawing!";
        }
    });
    
    // Try again button
    tryAgainButton.addEventListener('click', function() {
        resultDiv.classList.add('result-hidden');
        resultDiv.classList.remove('result');
        // Clear all layers with white background
        layers.forEach(layer => {
            layer.context.fillStyle = '#ffffff';
            layer.context.fillRect(0, 0, canvas.width, canvas.height);
        });
        redrawCanvas();
    });
    
    // Update canvas resize function
    const oldResizeCanvas = resizeCanvas;
    resizeCanvas = function() {
        oldResizeCanvas();
        resizeAllLayers();
    };
    
    // Layer movement functions
    function startLayerDragging(index) {
        setActiveLayer(index);
        layers[index].isDragging = true;
        
        // Add dragging class to canvas
        canvas.classList.add('dragging-layer');
        
        // Show dragging indicator
        const indicator = document.createElement('div');
        indicator.className = 'drag-indicator';
        indicator.textContent = `Moving ${layers[index].name}`;
        document.querySelector('.canvas-container').appendChild(indicator);
        
        // Set events to track movement
        canvas.addEventListener('mousemove', moveLayer);
        canvas.addEventListener('mouseup', stopLayerDragging);
        canvas.addEventListener('touchmove', moveLayer);
        canvas.addEventListener('touchend', stopLayerDragging);
    }
    
    function moveLayer(e) {
        const layer = layers[activeLayerIndex];
        if (!layer.isDragging) return;
        
        const pos = getPosition(e);
        const deltaX = pos.x - lastX;
        const deltaY = pos.y - lastY;
        
        layer.offsetX += deltaX;
        layer.offsetY += deltaY;
        
        lastX = pos.x;
        lastY = pos.y;
        
        redrawCanvas();
    }
    
    function stopLayerDragging() {
        const layer = layers[activeLayerIndex];
        if (layer.isDragging) {
            layer.isDragging = false;
            
            // Remove dragging class from canvas
            canvas.classList.remove('dragging-layer');
            
            // Remove dragging indicator
            const indicator = document.querySelector('.drag-indicator');
            if (indicator) {
                indicator.parentNode.removeChild(indicator);
            }
            
            saveState(); // Save state after moving layer
        }
        
        canvas.removeEventListener('mousemove', moveLayer);
        canvas.removeEventListener('mouseup', stopLayerDragging);
        canvas.removeEventListener('touchmove', moveLayer);
        canvas.removeEventListener('touchend', stopLayerDragging);
    }
    
    // Download drawing functionality
    const downloadBtn = document.createElement('button');
    downloadBtn.id = 'downloadBtn';
    downloadBtn.className = 'action-btn';
    downloadBtn.textContent = '📥 Download';
    downloadBtn.addEventListener('click', function() {
        const downloadLink = document.createElement('a');
        downloadLink.href = canvas.toDataURL('image/png');
        downloadLink.download = 'my-drawing.png';
        downloadLink.click();
    });
    
    // Add download button to tools div
    document.querySelector('.tools').appendChild(downloadBtn);
});