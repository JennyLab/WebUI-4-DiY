// hex-editor.js
export class HexEditor {
  constructor(container) {
    this.container = container;
    this.fileInput = null;
    this.randomizeColorsButton = null;
    this.markSelectionButton = null;
    this.removeMarkButton = null;
    this.columnsSelect = null;
    this.hexEditorContainer = null;
    this.marksList = document.getElementById('marks-list');
    this.marks = []; // Array to store marks

    this.handleFileSelect = this.handleFileSelect.bind(this);
    this.displayHexEditor = this.displayHexEditor.bind(this);
  }

  initialize() {
    this.container.innerHTML = `
      <section id="hex-editor">
        <h2>Hex Editor</h2>
        <div class="controls">
          <input type="file" id="file-input">
          <button id="randomize-colors">Randomize Colors</button>
          <button id="mark-selection">Mark Selection</button>
          <button id="remove-mark">Remove Mark</button>
          <label for="columns">Columns:</label>
          <select id="columns">
            <option value="8">8</option>
            <option value="16" selected>16</option>
          </select>
        </div>
        <div id="hex-editor-container"></div>
      </section>
    `;

    this.fileInput = this.container.querySelector('#file-input');
    this.randomizeColorsButton = this.container.querySelector('#randomize-colors');
    this.markSelectionButton = this.container.querySelector('#mark-selection');
    this.removeMarkButton = this.container.querySelector('#remove-mark');
    this.columnsSelect = this.container.querySelector('#columns');
    this.hexEditorContainer = this.container.querySelector('#hex-editor-container');

    this.fileInput.addEventListener('change', this.handleFileSelect);
    // Add event listeners for other controls
  }

  handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const buffer = e.target.result;
        this.displayHexEditor(buffer, this.hexEditorContainer);
      };
      reader.readAsArrayBuffer(file);
    }
  }

  displayHexEditor(buffer, hexEditorContainer) {
    hexEditorContainer.innerHTML = ''; // Clear existing content

    const byteArray = new Uint8Array(buffer);
    const hexData = Array.from(byteArray)
      .map(byte => byte.toString(16).padStart(2, '0').toUpperCase());
    const stringData = Array.from(byteArray)
      .map(byte => {
        if (byte >= 32 && byte <= 126) {
          return String.fromCharCode(byte);
        } else {
          return '.';
        }
      });

    const bytesPerLine = parseInt(this.columnsSelect.value, 10);
    for (let i = 0; i < hexData.length; i += bytesPerLine) {
      const hexLine = hexData.slice(i, i + bytesPerLine).join(' ');
      const stringLine = stringData.slice(i, i + bytesPerLine).join('');

      const lineContainer = document.createElement('div');
      lineContainer.classList.add('hex-line');

      const hexSpan = document.createElement('span');
      hexSpan.classList.add('hex-bytes');
      hexSpan.textContent = hexLine;
      hexSpan.contentEditable = true; // Make hex editable

      const stringSpan = document.createElement('span');
      stringSpan.classList.add('hex-string');
      stringSpan.textContent = stringLine;
      stringSpan.contentEditable = true; // Make string editable

      lineContainer.appendChild(hexSpan);
      lineContainer.appendChild(stringSpan);
      hexEditorContainer.appendChild(lineContainer);
    }
  }
}