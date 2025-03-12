document.addEventListener('DOMContentLoaded', async () => {
  const room = new WebsimSocket();
  const browserContent = document.querySelector('.browser-content');
  const backBtn = document.querySelector('.back');
  const forwardBtn = document.querySelector('.forward');
  const refreshBtn = document.querySelector('.refresh');
  const bookmarkBtn = document.querySelector('.bookmark');
  const tabsContainer = document.querySelector('.tabs');
  const urlInput = document.getElementById('urlInput');

  let publishedSites = [];
  let tabs = [];
  let activeTabId = null;

  class Tab {
    constructor(id, title = 'New Tab', url = 'buss://home.site') {
      this.id = id;
      this.title = title;
      this.url = url;
      this.history = [url]; // Array to store visited URLs
      this.currentHistoryIndex = 0; // Current position in history
    }

    // Add new URL to history
    addToHistory(url) {
      // Remove any forward history when adding new URL
      this.history = this.history.slice(0, this.currentHistoryIndex + 1);
      this.history.push(url);
      this.currentHistoryIndex = this.history.length - 1;
      this.url = url;
    }

    // Go back in history
    goBack() {
      if (this.currentHistoryIndex > 0) {
        this.currentHistoryIndex--;
        this.url = this.history[this.currentHistoryIndex];
        return this.url;
      }
      return null;
    }

    // Go forward in history
    goForward() {
      if (this.currentHistoryIndex < this.history.length - 1) {
        this.currentHistoryIndex++;
        this.url = this.history[this.currentHistoryIndex];
        return this.url;
      }
      return null;
    }
  }

  const createTab = (url = 'buss://home.site') => {
    if (tabs.length >= 6) return;
    
    const id = Date.now().toString();
    const tab = new Tab(id, 'New Tab', url);
    tabs.push(tab);
    
    const tabElement = document.createElement('div');
    tabElement.className = 'tab';
    tabElement.setAttribute('data-tab-id', id);
    tabElement.innerHTML = `
      <span class="tab-title">New Tab</span>
      <span class="material-icons close-tab">close</span>
    `;
    
    tabsContainer.insertBefore(tabElement, document.querySelector('.new-tab'));
    
    tabElement.querySelector('.close-tab').addEventListener('click', (e) => {
      e.stopPropagation();
      closeTab(id);
    });
    
    tabElement.addEventListener('click', () => {
      setActiveTab(id);
    });

    const contentElement = document.createElement('div');
    contentElement.className = 'tab-content';
    contentElement.setAttribute('data-tab-id', id);
    browserContent.appendChild(contentElement);

    setActiveTab(id);
    loadSite(url);
    
    return tab;
  };

  const closeTab = (tabId) => {
    if (tabs.length === 1) return;
    
    const tabIndex = tabs.findIndex(t => t.id === tabId);
    tabs = tabs.filter(t => t.id !== tabId);
    
    document.querySelector(`.tab[data-tab-id="${tabId}"]`).remove();
    document.querySelector(`.tab-content[data-tab-id="${tabId}"]`).remove();
    
    if (activeTabId === tabId) {
      const newActiveTab = tabs[Math.min(tabIndex, tabs.length - 1)];
      setActiveTab(newActiveTab.id);
    }
  };

  const setActiveTab = (tabId) => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    
    document.querySelector(`.tab[data-tab-id="${tabId}"]`).classList.add('active');
    document.querySelector(`.tab-content[data-tab-id="${tabId}"]`).classList.add('active');
    
    activeTabId = tabId;
    const tab = tabs.find(t => t.id === tabId);
    if (tab) {
      urlInput.value = tab.url; 
    }
  };

  const updateTabTitle = (tabId, title) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab) {
      tab.title = title;
      document.querySelector(`.tab[data-tab-id="${tabId}"] .tab-title`).textContent = title;
    }
  };

  const translations = {
    en: {
      searchPlaceholder: "Search published sites...",
      chooseFile: "Choose File",
      publish: "Publish",
      noResults: "No results found",
      sitePublished: "Site published successfully!",
      errorPublishing: "Error publishing site",
      enterSiteName: "Please enter a site name",
      selectFile: "Please select a file",
      invalidSiteName: "Site name can only contain letters, numbers, and hyphens",
      urlTaken: "This URL is already taken",
      zipError: "ZIP must contain an index.html file",
      searchResults: "Search Results",
      close: "Close",
      indexRequired: "Index.html file is required"
    },
    es: {
      searchPlaceholder: "Buscar sitios publicados...",
      chooseFile: "Elegir archivo",
      publish: "Publicar",
      noResults: "No se encontraron resultados",
      sitePublished: "¡Sitio publicado exitosamente!",
      errorPublishing: "Error al publicar el sitio",
      enterSiteName: "Por favor ingrese un nombre de sitio",
      selectFile: "Por favor seleccione un archivo",
      invalidSiteName: "El nombre del sitio solo puede contener letras, números y guiones",
      urlTaken: "Esta URL ya está en uso",
      zipError: "El ZIP debe contener un archivo index.html",
      searchResults: "Resultados de búsqueda",
      close: "Cerrar",
      indexRequired: "El archivo index.html es requerido"
    },
    fr: {
      searchPlaceholder: "Rechercher des sites publiés...",
      chooseFile: "Choisir un fichier",
      publish: "Publier",
      noResults: "Aucun résultat trouvé",
      sitePublished: "Site publié avec succès !",
      errorPublishing: "Erreur lors de la publication",
      enterSiteName: "Veuillez entrer un nom de site",
      selectFile: "Veuillez sélectionner un fichier",
      invalidSiteName: "Le nom du site ne peut contenir que des lettres, des chiffres et des tirets",
      urlTaken: "Cette URL est déjà prise",
      zipError: "Le ZIP doit contenir un fichier index.html",
      searchResults: "Résultats de recherche",
      close: "Fermer",
      indexRequired: "Le fichier index.html est requis"
    },
    de: {
      searchPlaceholder: "Veröffentlichte Seiten durchsuchen...",
      chooseFile: "Datei auswählen",
      publish: "Veröffentlichen",
      noResults: "Keine Ergebnisse gefunden",
      sitePublished: "Seite erfolgreich veröffentlicht!",
      errorPublishing: "Fehler beim Veröffentlichen",
      enterSiteName: "Bitte geben Sie einen Seitennamen ein",
      selectFile: "Bitte wählen Sie eine Datei aus",
      invalidSiteName: "Der Seitenname darf nur Buchstaben, Zahlen und Bindestriche enthalten",
      urlTaken: "Diese URL ist bereits vergeben",
      zipError: "Die ZIP-Datei muss eine index.html enthalten",
      searchResults: "Suchergebnisse",
      close: "Schließen",
      indexRequired: "Die Datei index.html ist erforderlich"
    }
  };

  const userLang = navigator.language.split('-')[0] || 'en';
  const t = translations[userLang] || translations.en;

  const performSearch = async (searchTerm) => {
    if (!searchTerm.trim()) return;
    
    urlInput.value = `buss://search=${searchTerm}.site`;
    const activeTab = tabs.find(t => t.id === activeTabId);
    activeTab.history.splice(activeTab.currentHistoryIndex + 1);
    activeTab.history.push(urlInput.value);
    activeTab.currentHistoryIndex = activeTab.history.length - 1;

    const sites = await room.collection('sites').getList();
    const filteredSites = sites.filter(site => 
      site.url.replace('buss://', '').replace('.site', '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const content = document.querySelector(`.tab-content[data-tab-id="${activeTabId}"]`);
    content.innerHTML = `
      <div class="search-results-page">
        <div class="search-results-content">
          ${filteredSites.length ? filteredSites.map(site => `
            <div class="site-item" data-url="${site.url}">
              <div class="site-preview">
                <span class="material-icons">language</span>
              </div>
              <div class="site-info">
                <div class="site-name">${site.url.replace('buss://', '').replace('.site', '')}</div>
                <div class="site-url">${site.url}</div>
              </div>
            </div>
          `).join('') : `<div class="no-results">${t.noResults}</div>`}
        </div>
      </div>
    `;

    content.querySelectorAll('.site-item').forEach(item => {
      item.addEventListener('click', () => {
        createTab(item.dataset.url);
      });
    });
  };

  const setupSearch = () => {
    const content = document.querySelector(`.tab-content[data-tab-id="${activeTabId}"]`);
    const searchInput = content.querySelector('.search-input');
    searchInput.placeholder = t.searchPlaceholder;

    searchInput.addEventListener('keypress', async (e) => {
      if (e.key === 'Enter') {
        const searchTerm = searchInput.value.toLowerCase();
        performSearch(searchTerm);
      }
    });
  };

  const setupPublishingHandlers = () => {
    const content = document.querySelector(`.tab-content[data-tab-id="${activeTabId}"]`);
    if (!content) return; // Guard against null content
    
    const publishBtn = content.querySelector('.publish-btn');
    const siteFile = content.querySelector('#siteFile');
    const urlInput = content.querySelector('.url-input');
    const additionalFilesBtn = content.querySelector('.additional-files-btn');
    const additionalFiles = content.querySelector('#additionalFiles');

    // Guard against any null elements
    if (!publishBtn || !siteFile || !urlInput || !additionalFilesBtn || !additionalFiles) {
      console.error('Required elements not found');
      return;
    }

    let additionalFilesSelected = [];
    
    siteFile.onchange = () => {
      const file = siteFile.files[0];
      const btn = content.querySelector('.custom-file-btn');
      if (file) {
        btn.innerHTML = `
          <span class="material-icons">description</span>
          ${file.name}
        `;
      } else {
        btn.innerHTML = `
          <span class="material-icons">upload_file</span>
          ${t.chooseFile}
        `;
      }
    };

    siteFile.setAttribute('accept', '.html');
    additionalFiles.setAttribute('accept', '.css,.jpg,.jpeg,.png,.gif,.mp3,.wav,.ogg,.js');

    const createFilesPreview = () => {
      let preview = document.querySelector('.files-preview');
      if (!preview) {
        preview = document.createElement('div');
        preview.className = 'files-preview';
        additionalFilesBtn.appendChild(preview);
      }
        
      preview.innerHTML = additionalFilesSelected.map(file => `
        <div class="file-item">
          <span class="material-icons">${
            file.type.startsWith('image/') ? 'image' :
            file.type.startsWith('audio/') ? 'audiotrack' :
            file.name.endsWith('.css') ? 'style' :
            file.name.endsWith('.js') ? 'code' : 'insert_drive_file'
          }</span>
          <span class="file-name">${file.name}</span>
          <span class="material-icons remove-file" data-file="${file.name}">close</span>
        </div>
      `).join('');

      if (additionalFilesSelected.length === 0) {
        preview.remove();
      }

      preview.querySelectorAll('.remove-file').forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          const fileName = btn.dataset.file;
          additionalFilesSelected = additionalFilesSelected.filter(f => f.name !== fileName);
          updateAdditionalFilesButton();
        };
      });
    };

    additionalFilesBtn.onclick = () => {
      const preview = document.querySelector('.files-preview');
      if (preview) {
        preview.classList.toggle('show');
      } else if (additionalFilesSelected.length < 4) {
        additionalFiles.click();
      }
    };

    additionalFiles.onchange = () => {
      const newFiles = Array.from(additionalFiles.files);
        
      for (const file of newFiles) {
        if (additionalFilesSelected.length >= 4) break;
        if (!additionalFilesSelected.some(f => f.name === file.name)) {
          additionalFilesSelected.push(file);
        }
      }

      updateAdditionalFilesButton();
      additionalFiles.value = ''; 
    };

    const updateAdditionalFilesButton = () => {
      const totalFiles = additionalFilesSelected.length;
        
      if (totalFiles > 0) {
        additionalFilesBtn.classList.add('has-files');
        additionalFilesBtn.innerHTML = `
          <span class="material-icons">attachment</span>
          Additional Files
          <span class="additional-files-badge">${totalFiles}</span>
        `;
        createFilesPreview();
      } else {
        additionalFilesBtn.classList.remove('has-files');
        additionalFilesBtn.innerHTML = `
          <span class="material-icons">attachment</span>
          Additional Files
        `;
        const preview = additionalFilesBtn.querySelector('.files-preview');
        if (preview) preview.remove();
      }
    };

    publishBtn.onclick = async () => {
      const mainFile = siteFile.files[0];
      if (!mainFile) {
        showError(t.selectFile);
        return;
      }

      if (!mainFile.name.toLowerCase().endsWith('.html')) {
        showError(t.indexRequired);
        return;
      }

      const siteName = urlInput.value.trim();
      if (!siteName) {
        showError(t.enterSiteName);
        return;
      }

      if (!/^[a-zA-Z0-9-]+$/.test(siteName)) {
        showError(t.invalidSiteName);
        return;
      }

      const url = `buss://${siteName}.site`;

      try {
        const mainFileContent = await readFileAsText(mainFile);
          
        const resources = {};
        for (const file of additionalFilesSelected) {
          if (file.type.startsWith('image/') || file.type.startsWith('audio/')) {
            resources[file.name] = await readFileAsDataURL(file);
          } else {
            resources[file.name] = await readFileAsText(file);
          }
        }

        let processedHTML = mainFileContent;
          
        processedHTML = processedHTML.replace(
          /(src|href)="([^"]+)"/g,
          (match, attr, path) => {
            if (path.startsWith('http') || path.startsWith('data:')) {
              return match;
            }
            const fileName = path.split('/').pop();
            if (resources[fileName]) {
              return `${attr}="${resources[fileName]}"`;
            }
            return match;
          }
        );

        processedHTML = processedHTML.replace(
          /<link[^>]+href="([^"]+\.css)"[^>]*>/g,
          (match, path) => {
            const fileName = path.split('/').pop();
            if (resources[fileName]) {
              return `<style>${resources[fileName]}</style>`;
            }
            return match;
          }
        );

        processedHTML = processedHTML.replace(
          /<script[^>]+src="([^"]+\.js)"[^>]*><\/script>/g,
          (match, path) => {
            const fileName = path.split('/').pop();
            if (resources[fileName]) {
              return `<script>${resources[fileName]}</script>`;
            }
            return match;
          }
        );

        const existingSite = await room.collection('sites')
          .filter({ url })
          .getList();

        if (existingSite.length > 0) {
          showError(t.urlTaken);
          return;
        }

        await room.collection('sites').create({
          url,
          content: processedHTML,
        });

        urlInput.value = '';
        siteFile.value = '';
        additionalFiles.value = '';
        additionalFilesSelected = [];
        updateAdditionalFilesButton();
          
        content.querySelector('.custom-file-btn').innerHTML = `
          <span class="material-icons">upload_file</span>
          ${t.chooseFile}
        `;
          
        showError(t.sitePublished);
      } catch (error) {
        showError(t.errorPublishing);
        console.error(error);
      }
    };
  };

  const showError = (messageKey) => {
    const message = t[messageKey] || messageKey;
    const content = document.querySelector(`.tab-content[data-tab-id="${activeTabId}"]`);
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    content.querySelector('.upload-section').appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 3000);
  };

  const showDiscoverPage = async () => {
    const content = document.querySelector(`.tab-content[data-tab-id="${activeTabId}"]`);
    if (!content) return;

    const sites = await room.collection('sites').getList();
    
    content.innerHTML = `
      <div class="search-results-page">
        <div class="discover-header">
          <h1 class="discover-title">Discover Sites</h1>
          <p class="discover-subtitle">Explore all the amazing sites published on BussinBrowser</p>
        </div>
        <div class="site-grid">
          ${sites.length ? sites.map(site => `
            <div class="site-item" data-url="${site.url}">
              <div class="site-preview">
                <span class="material-icons">language</span>
              </div>
              <div class="site-info">
                <div class="site-name">${site.url.replace('buss://', '').replace('.site', '')}</div>
                <div class="site-url">${site.url}</div>
              </div>
            </div>
          `).join('') : `<div class="no-results">${t.noResults}</div>`}
        </div>
      </div>
    `;

    content.querySelectorAll('.site-item').forEach(item => {
      item.addEventListener('click', () => {
        createTab(item.dataset.url);
      });
    });
  };

  const showHomepage = () => {
    const content = document.querySelector(`.tab-content[data-tab-id="${activeTabId}"]`);
    if (!content) return; // Guard against null content

    content.innerHTML = `
      <div class="homepage">
        <button class="discover-btn">
          <span class="material-icons">travel_explore</span>
        </button>
        <span class="material-icons logo-large">language</span>
        <h1 class="logo-text">BussinBrowser</h1>
        <p class="subtitle">The coolest way to browse the web.<br>Stay bussin', stay browsing.</p>
        <div class="search-container">
          <span class="material-icons search-icon">search</span>
          <input type="text" class="search-input" placeholder="${t.searchPlaceholder}">
        </div>
        <div class="upload-section">
          <button class="help-btn">
            <span class="material-icons">help_outline</span>
          </button>
          <div class="file-input-wrapper">
            <button class="custom-file-btn">
              <span class="material-icons">upload_file</span>
              ${t.chooseFile}
            </button>
            <input type="file" id="siteFile" accept=".html">
          </div>
          <button class="additional-files-btn">
            <span class="material-icons">attachment</span>
            Additional Files
          </button>
          <input type="file" id="additionalFiles" multiple style="display: none;" accept=".css,.jpg,.jpeg,.png,.gif,.mp3,.wav,.ogg,.js">
          <div class="url-input-container">
            <span class="url-prefix">buss://</span>
            <input type="text" class="url-input" maxlength="20" placeholder="site-name">
            <span class="url-suffix">.site</span>
          </div>
          <button class="publish-btn" id="publishBtn">
            <span class="material-icons">cloud_upload</span>
            ${t.publish}
          </button>
        </div>
      </div>
    `;

    // Add event listener for discover button
    const discoverBtn = content.querySelector('.discover-btn');
    if (discoverBtn) {
      discoverBtn.addEventListener('click', () => {
        urlInput.value = 'buss://discover.site';
        loadSite('buss://discover.site');
      });
    }

    setupSearch();
    setupPublishingHandlers();

    const helpBtn = content.querySelector('.help-btn');
    if (helpBtn) {
      helpBtn.addEventListener('click', showTutorial);
    }
  };

  const showTutorial = () => {
    const overlay = document.createElement('div');
    overlay.className = 'tutorial-overlay';
  
    const modal = document.createElement('div');
    modal.className = 'tutorial-modal';
    modal.innerHTML = `
      <div class="tutorial-title">
        <span>How to Use BussinBrowser</span>
        <button class="tutorial-close">
          <span class="material-icons">close</span>
        </button>
      </div>
      
      <div class="tutorial-section">
        <h3>Publishing Sites</h3>
        <p>You can publish any HTML site to BussinBrowser in a few simple steps:</p>
        <ul>
          <li>Upload your <span class="highlight">index.html</span> file using the main file upload button</li>
          <li>Add any additional resources (images, audio, CSS, JS) using the <span class="highlight">Additional Files</span> button</li>
          <li>Choose a unique site name that will become your URL</li>
          <li>Click Publish to make your site live!</li>
        </ul>
      </div>

      <div class="tutorial-section">
        <h3>WebSim Projects</h3>
        <p>For WebSim AI-generated projects, follow these steps:</p>
        <ul>
          <li>Tell the AI to: <span class="highlight">"put it all in one HTML file, you can still use CSS and JS but all in one HTML file"</span></li>
          <li>Download the combined HTML file</li>
          <li>Upload the HTML file using the main file upload</li>
          <li>If your project needs images or audio, upload those using the Additional Files button</li>
        </ul>
      </div>

      <div class="tutorial-section">
        <h3>Additional Files</h3>
        <p>You can include up to 4 additional files with your site:</p>
        <ul>
          <li>Supported files: Images (.jpg, .png, .gif), Audio (.mp3, .wav, .ogg), CSS (.css), JavaScript (.js)</li>
          <li>Files are automatically linked to your HTML</li>
          <li>Access files using their original filenames in your HTML</li>
        </ul>
      </div>

      <div class="tutorial-section">
        <h3>Browsing Sites</h3>
        <p>Navigate published sites using these features:</p>
        <ul>
          <li>Use the search bar on the homepage to find sites</li>
          <li>Click site links to open them in new tabs</li>
          <li>Use back/forward buttons to navigate history</li>
          <li>Refresh button to reload the current site</li>
        </ul>
      </div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(modal);

    const closeModal = () => {
      overlay.remove();
      modal.remove();
    };

    overlay.addEventListener('click', closeModal);
    modal.querySelector('.tutorial-close').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => e.stopPropagation());
  };

  const updateUrlInput = (url) => {
    if (urlInput) {
      urlInput.value = url;
    }
  };

  const loadSite = async (url) => {
    const activeTab = tabs.find(t => t.id === activeTabId);
    if (!activeTab) return;

    // Add URL to tab's history
    activeTab.addToHistory(url);
    updateUrlInput(url);
    
    const content = document.querySelector(`.tab-content[data-tab-id="${activeTabId}"]`);

    if (url === 'buss://home.site') {
      showHomepage();
      updateTabTitle(activeTabId, 'Home');
      return;
    }

    if (url === 'buss://discover.site') {
      showDiscoverPage();
      updateTabTitle(activeTabId, 'Discover');
      return;
    }

    const searchMatch = url.match(/buss:\/\/search=(.+)\.site/);
    if (searchMatch) {
      const searchTerm = decodeURIComponent(searchMatch[1]);
      updateTabTitle(activeTabId, `Search: ${searchTerm}`);
      
      urlInput.value = `buss://search=${searchTerm}.site`;
      
      const sites = await room.collection('sites').getList();
      const filteredSites = sites.filter(site => 
        site.url.replace('buss://', '').replace('.site', '').toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      content.innerHTML = `
        <div class="search-results-page">
          <div class="search-results-content">
            ${filteredSites.length ? filteredSites.map(site => `
              <div class="site-item" data-url="${site.url}">
                <div class="site-preview">
                  <span class="material-icons">language</span>
                </div>
                <div class="site-info">
                  <div class="site-name">${site.url.replace('buss://', '').replace('.site', '')}</div>
                  <div class="site-url">${site.url}</div>
                </div>
              </div>
            `).join('') : `<div class="no-results">${t.noResults}</div>`}
          </div>
        </div>
      `;

      content.querySelectorAll('.site-item').forEach(item => {
        item.addEventListener('click', () => {
          const newUrl = item.dataset.url;
          urlInput.value = newUrl; 
          createTab(newUrl);
        });
      });
      return;
    }

    const sites = await room.collection('sites').getList();
    const site = sites.find(s => s.url === url);
    
    if (site) {
      content.innerHTML = `
        <div class="site-container">
          ${site.content}
        </div>
      `;
      
      const siteContainer = content.querySelector('.site-container');
      siteContainer.style.cssText = `
        width: 100%;
        height: 100%;
        overflow: auto;
        background: white;
        position: relative;
      `;
      
      updateUrlInput(url);
      updateTabTitle(activeTabId, url.replace('buss://', '').replace('.site', ''));
    }
  };

  // Update back/forward button handlers
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      const activeTab = tabs.find(t => t.id === activeTabId);
      if (activeTab) {
        const previousUrl = activeTab.goBack();
        if (previousUrl) {
          loadSite(previousUrl);
        }
      }
    });
  }

  if (forwardBtn) {
    forwardBtn.addEventListener('click', () => {
      const activeTab = tabs.find(t => t.id === activeTabId);
      if (activeTab) {
        const nextUrl = activeTab.goForward();
        if (nextUrl) {
          loadSite(nextUrl);
        }
      }
    });
  }

  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      const activeTab = tabs.find(t => t.id === activeTabId);
      if (activeTab) {
        loadSite(activeTab.url);
      }
    });
  }

  if (bookmarkBtn) {
    bookmarkBtn.addEventListener('click', () => {
      const icon = bookmarkBtn.querySelector('.material-icons');
      if (icon) {
        icon.textContent = icon.textContent === 'star_border' ? 'star' : 'star_border';
      }
    });
  }

  // Add event listeners for window control buttons
  const minimizeBtn = document.querySelector('.minimize');
  const maximizeBtn = document.querySelector('.maximize');
  const closeBtn = document.querySelector('.close');

  if (minimizeBtn) {
    minimizeBtn.addEventListener('click', () => {
      // Do nothing or add different minimize behavior if needed
    });
  }

  if (maximizeBtn) {
    maximizeBtn.addEventListener('click', () => {
      // Do nothing or add different maximize behavior if needed
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      window.close();
    });
  }

  if (urlInput) {
    urlInput.addEventListener('keypress', async (e) => {
      if (e.key === 'Enter') {
        const url = urlInput.value;
        if (url.startsWith('buss://')) {
          await loadSite(url);
        } else {
          const content = document.querySelector(`.tab-content[data-tab-id="${activeTabId}"]`);
          if (content) {
            content.innerHTML = `
              <div class="homepage">
                <h1 class="logo-text">Nice try!</h1>
                <p class="subtitle">This browser only supports buss:// URLs.<br>Try publishing a site first!</p>
              </div>
            `;
          }
        }
      }
    });
  }

  // Subscribe to site updates
  room.collection('sites').subscribe(async () => {
    const sites = await room.collection('sites').getList();
    publishedSites = sites;
  });

  createTab();

  if (tabsContainer) {
    const newTabBtn = document.createElement('div');
    newTabBtn.className = 'tab new-tab';
    newTabBtn.innerHTML = '<span class="material-icons">add</span>';
    newTabBtn.addEventListener('click', () => createTab());
    tabsContainer.appendChild(newTabBtn);
  }
});

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}