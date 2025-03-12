document.addEventListener('DOMContentLoaded', () => {
  const integrationGrid = document.getElementById('integration-grid');
  const infoPanel = document.getElementById('info-panel');
  const panelTitle = document.getElementById('panel-title');
  const panelDetails = document.getElementById('panel-details');
  const closeButton = document.querySelector('.close-button');
  const prevPageButton = document.getElementById('prev-page');
  const nextPageButton = document.getElementById('next-page');
  const pageNumbersContainer = document.getElementById('page-numbers');

  const integrationsData = [
    // ... integrations data will be added here ...
  ];

  const integrations = generateIntegrations(200); // Generate 200 dummy integrations
  const cardsPerPage = 20;
  let currentPage = 1;
  let totalPages = Math.ceil(integrations.length / cardsPerPage);

  function generateIntegrations(count) {
    const integrationList = [];
    const categories = ["Technology", "Security", "Social", "Services", "Tools", "Wiki", "Code Search", "IOC", "Vulnerability (MITRE)", "Cloud", "Computing", "Virtual Office", "Mail", "Open Source Apps", "Networking", "Connectors", "Web Hooks", "Providers", "Custom Web", "Webhooks", "Websocket", "Rest", "OAUTh", "HTTP"];
    const providers = ["Google", "Microsoft", "Amazon", "Facebook", "Twitter", "GitHub", "Slack", "Jira", "Salesforce", "ServiceNow", "...", "Very Long Provider Name Example"]; // Example providers

    for (let i = 1; i <= count; i++) {
      const randomCategoryIndex = Math.floor(Math.random() * categories.length);
      const randomProviderIndex = Math.floor(Math.random() * providers.length);
      const integrationName = `${providers[randomProviderIndex]} ${categories[randomCategoryIndex]} Integration ${i}`;
      const logo = generateLogoSVG(categories[randomCategoryIndex]); // Generate SVG logo based on category
      const apiType = ["REST API", "WebSocket", "OAuth 2.0", "HTTP", "Custom API"][Math.floor(Math.random() * 5)];
      const description = `This is a sample description for ${integrationName}. It integrates with ${categories[randomCategoryIndex]} using ${apiType}.`;

      integrationList.push({
        name: integrationName,
        logo: logo.outerHTML,
        category: categories[randomCategoryIndex],
        provider: providers[randomProviderIndex],
        apiType: apiType,
        description: description
      });
    }
    return integrationList;
  }

  function generateLogoSVG(category) {
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.classList.add('card-logo');

    let iconPath;
    let logoClass = '';

    switch (category) {
      case 'Webhooks':
      case 'Web Hooks':
      case 'Webhooks':
        iconPath = `
          <path d="M17 22V2h-4v20h4zm-10 0V9h-4v13h4zm20 0V2h-4v20h4zM7 9l-5 4.5 5 4.5V9zm20 0l-5 4.5 5 4.5V9z"/>
        `;
        logoClass = 'logo-webhook';
        break;
      case 'Database':
      case 'Open Source Apps':
        iconPath = `<path d="M2 6c0-1.1.9-2 2-2h20a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6zm2-2v12h20V4H4zM4 20h20a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2z"/>`; // Database icon
        logoClass = 'logo-database';
        break;
      case 'Social':
      case 'Social Media':
        iconPath = `<path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm0 14.17L18.83 16H4V4h16v14.17zM7 9h2v2H7V9zm4 0h2v2h-2V9zm4 0h2v2h-2V9z"/>`; // Social icon
        logoClass = 'logo-social';
        break;
      case 'Web':
      case 'Custom Web':
        iconPath = `<path d="M22 12c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2s10 4.48 10 10zm-2 0c0-4.42-3.58-8-8-8S4 7.58 4 12s3.58 8 8 8 8-3.58 8-8zM10 9.96h4c.28 0 .5.22.5.5v3c0 .28-.22.5-.5.5h-4c-.28 0-.5-.22-.5-.5v-3c0-.28.22-.5.5-.5z"/>`; // Web icon
        logoClass = 'logo-web';
        break;
      case 'REST API':
      case 'API':
      case 'Connectors':
      case 'Providers':
        iconPath = `<path d="M13 9h-2V7h2v2zm0 4h-2v-2h2v2zm0 4h-2v-2h2v2zm6 0h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2zM7 9H5V7h2v2zm0 4H5v-2h2v2zm0 4H5v-2h2v2zm12-8H7c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 14H7V7h12v14z"/>`; // API icon
        logoClass = 'logo-api';
        break;
      default:
        iconPath = `<path d="M5 13h14v-2H5v2zm-2 2h14v-2H3v2zm0 4h14v-2H3v2zm0-8h2v6H3V9zm18 0h2v8h-2V9zm-8 8h8v-2h-8v2zm0-4h8v-2h-8v2zM3 3v2h18V3H3zm16 4h2V5h-2v2zm-8-4h8v2h-8V3zm-8 4h2V5H3v2z"/>`; // Default gears icon
        logoClass = '';
        break;
    }

    svg.innerHTML = iconPath;
    if (logoClass) {
      svg.classList.add(logoClass);
    }
    return svg;
  }

  function displayIntegrations(page, currentIntegrations) {
    integrationGrid.innerHTML = '';
    const integrationsToDisplay = currentIntegrations || integrations;
    const startIndex = (page - 1) * cardsPerPage;
    const endIndex = startIndex + cardsPerPage;
    const pageIntegrations = integrationsToDisplay.slice(startIndex, endIndex);

    pageIntegrations.forEach(integration => {
      const card = document.createElement('div');
      card.classList.add('integration-card');

      const bookmarkIcon = generateBookmarkIcon();
      bookmarkIcon.classList.add('card-actions-top-right');
      bookmarkIcon.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent card click when icon is clicked
        toggleBookmark(bookmarkIcon);
      });

      card.appendChild(bookmarkIcon);

      card.innerHTML += `
        ${generateLogoSVG(integration.category).outerHTML}
        <h3 class="card-title">${integration.name}</h3>
        <div class="card-actions-bottom">
          <div class="card-button add-code-btn">${generateAddCodeIcon().outerHTML}</div>
          <div class="card-button clone-btn">${generateCloneIcon().outerHTML}</div>
          <div class="card-button delete-btn">${generateDeleteIcon().outerHTML}</div>
        </div>
      `;
      card.addEventListener('click', () => showInfoPanel(integration));

      const addCodeButton = card.querySelector('.card-button.add-code-btn');
      addCodeButton.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent card click
        showCardCodeEditor(card, integration);
      });
      const cloneButton = card.querySelector('.card-button.clone-btn');
      cloneButton.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent card click
        cloneIntegration(integration);
      });
      const deleteButton = card.querySelector('.card-button.delete-btn');
      deleteButton.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent card click
        deleteIntegration(integration);
      });

      integrationGrid.appendChild(card);
    });
  }

  function generateBookmarkIcon() {
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.innerHTML = `<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>`;
    return svg;
  }

  function toggleBookmark(icon) {
    icon.querySelector('path').classList.toggle('active'); // Simple active class toggle
  }

  function showInfoPanel(integration) {
    const panelTitle = document.getElementById('panel-title');
    const panelDetails = document.getElementById('panel-details');
    const panelEditArea = document.getElementById('panel-edit-area');

    if (!panelTitle || !panelDetails || !panelEditArea) {
      console.error('One or more info panel elements not found.');
      return; // Exit if elements are not found
    }

    panelTitle.textContent = integration.name;
    panelDetails.innerHTML = `
      <p><strong>Category:</strong> ${integration.category}</p>
      <p><strong>Provider:</strong> ${integration.provider}</p>
      <p><strong>API Type:</strong> ${integration.apiType}</p>
      <div id="current-description-panel">${integration.description}</div>
    `;

    const panelEditAreaElem = document.getElementById('panel-edit-area'); // Re-select inside function scope
    if (panelEditAreaElem) {
      panelEditAreaElem.classList.remove('active'); // Hide edit area initially
    }

    const editButtonHTML = `<button id="edit-description-btn">Edit Description</button>`;
    panelDetails.innerHTML += editButtonHTML;

    const editDescriptionButton = panelDetails.querySelector('#edit-description-btn');
    if (editDescriptionButton) {
      editDescriptionButton.addEventListener('click', () => {
        showPanelCodeEditor(integration);
      });
    }

    infoPanel.classList.remove('hidden');
  }

  function showPanelCodeEditor(integration) {
    const panelDetailsDiv = document.getElementById('panel-details');
    const currentDescriptionPanel = panelDetailsDiv.querySelector('#current-description-panel');
    const panelEditArea = document.getElementById('panel-edit-area');
    const panelEditTextarea = document.getElementById('panel-edit-textarea');

    if (!panelDetailsDiv || !currentDescriptionPanel || !panelEditArea || !panelEditTextarea) {
      console.error('One or more panel editor elements not found.');
      return;
    }

    currentDescriptionPanel.style.display = 'none'; // Hide description
    panelEditArea.classList.add('active'); // Show edit area

    panelEditTextarea.value = integration.description; // Populate textarea

    if (!panelEditArea.querySelector('.edit-buttons')) { // Avoid duplicate buttons
      const editButtonsDiv = document.createElement('div');
      editButtonsDiv.classList.add('edit-buttons');
      editButtonsDiv.innerHTML = `
        <button class="save edit-panel-save">Save</button>
        <button class="cancel edit-panel-cancel">Cancel</button>
      `;
      panelEditArea.appendChild(editButtonsDiv);

      const saveButton = panelEditArea.querySelector('.edit-panel-save');
      if (saveButton) {
        saveButton.addEventListener('click', () => {
          savePanelDescription(integration, panelEditTextarea.value);
          currentDescriptionPanel.innerHTML = integration.description; // Update displayed description
          currentDescriptionPanel.style.display = 'block'; // Show description again
          panelEditArea.classList.remove('active'); // Hide edit area
        });
      }

      const cancelButton = panelEditArea.querySelector('.edit-panel-cancel');
      if (cancelButton) {
        cancelButton.addEventListener('click', () => {
          currentDescriptionPanel.style.display = 'block'; // Show description again
          panelEditArea.classList.remove('active'); // Hide edit area
        });
      }
    }
  }

  function savePanelDescription(integration, newDescription) {
    integration.description = newDescription;
  }

  function showCardCodeEditor(card, integration) {
    // For simplicity, re-using panel's edit area for card code editor as well.
    // In real app, might want separate editor in card itself.
    const infoPanel = document.getElementById('info-panel');
    const panelTitle = document.getElementById('panel-title');
    const panelDetails = document.getElementById('panel-details');
    const panelEditArea = document.getElementById('panel-edit-area');
    const panelEditTextarea = document.getElementById('panel-edit-textarea');

    if (!panelTitle || !panelDetails || !panelEditArea || !panelEditTextarea) {
      console.error('One or more panel editor elements for card code editor not found.');
      return;
    }

    panelTitle.textContent = `Edit Code: ${integration.name}`;
    panelDetails.innerHTML = `
      <div id="current-code-panel">
        <p>Edit code for this integration:</p>
      </div>
    `;
    const currentCodePanel = panelDetails.querySelector('#current-code-panel');

    panelEditArea.classList.add('active'); // Show edit area
    panelEditTextarea.value = integration.code || ''; // Load existing code or empty

    if (!panelEditArea.querySelector('.edit-buttons')) { // Avoid duplicate buttons
      const editButtonsDiv = document.createElement('div');
      editButtonsDiv.classList.add('edit-buttons');
      editButtonsDiv.innerHTML = `
        <button class="save edit-card-save">Save Code</button>
        <button class="cancel edit-card-cancel">Cancel</button>
      `;
      panelEditArea.appendChild(editButtonsDiv);

      const saveButton = panelEditArea.querySelector('.edit-card-save');
      if (saveButton) {
        saveButton.addEventListener('click', () => {
          saveCardCode(integration, panelEditTextarea.value);
          infoPanel.classList.add('hidden'); // Close panel after save for card editor
        });
      }

      const cancelButton = panelEditArea.querySelector('.edit-card-cancel');
      if (cancelButton) {
        cancelButton.addEventListener('click', () => {
          infoPanel.classList.add('hidden'); // Close panel on cancel for card editor
        });
      }
    }

    infoPanel.classList.remove('hidden'); // Show panel as code editor
  }

  function saveCardCode(integration, newCode) {
    integration.code = newCode; // Store code directly in integration object for now
    console.log(`Code saved for ${integration.name}:`, newCode); // For debugging
  }

  function cloneIntegration(integrationToClone) {
    const clonedIntegration = { ...integrationToClone }; // Simple clone
    clonedIntegration.name = `Clone of ${integrationToClone.name}`;
    integrations.push(clonedIntegration);
    totalPages = Math.ceil(integrations.length / cardsPerPage);
    displayIntegrations(currentPage);
    updatePaginationButtons();
    console.log(`Integration cloned: ${clonedIntegration.name}`); // For debugging
  }

  function deleteIntegration(integrationToDelete) {
    const index = integrations.indexOf(integrationToDelete);
    if (index > -1) {
      integrations.splice(index, 1);
      totalPages = Math.ceil(integrations.length / cardsPerPage);
      if (currentPage > totalPages && currentPage > 1) {
        currentPage = totalPages; // Go to last page if current becomes empty
      }
      displayIntegrations(currentPage);
      updatePaginationButtons();
      console.log(`Integration deleted: ${integrationToDelete.name}`); // For debugging
    }
  }

  function generateAddCodeIcon() {
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.innerHTML = `<path d="M14 10H2v2h12v-2zm0-4H2v2h12V6zM2 16h8v-2H2v2zm19.5-8.5l-7-7c-.3-.3-.7-.5-1.1-.5H11v19h9c.4 0 .7-.2 1-.5l7-7c.3-.3.5-.7.5-1.1v-8zM18 16H12v-9h6.6l3.4 3.4V16z"/>`; // Code Icon
    return svg;
  }

  function generateCloneIcon() {
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.innerHTML = `<path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>`; // Plus Icon (for Clone - can be replaced with a more specific clone icon)
    return svg;
  }

  function generateDeleteIcon() {
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.innerHTML = `<path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>`; // Trash Icon
    return svg;
  }

  const backButton = document.getElementById('back-button');
  backButton.addEventListener('click', () => {
    window.history.back(); // Simple back navigation
  });

  const searchInput = document.getElementById('search-input');
  const searchButton = document.getElementById('search-button');
  let currentSearchTerm = '';

  function filterIntegrations(term) {
    currentSearchTerm = term.toLowerCase();
    const filteredIntegrations = integrations.filter(integration => {
      return integration.name.toLowerCase().includes(currentSearchTerm) ||
             integration.description.toLowerCase().includes(currentSearchTerm);
    });
    totalPages = Math.ceil(filteredIntegrations.length / cardsPerPage);
    currentPage = 1; // Reset to first page after search
    displayIntegrations(currentPage, filteredIntegrations);
    updatePaginationButtons(filteredIntegrations); // Pass filtered integrations
  }

  function updatePaginationButtons(currentIntegrations) {
    const integrationsForPaging = currentIntegrations || integrations;
    totalPages = Math.ceil(integrationsForPaging.length / cardsPerPage);

    pageNumbersContainer.innerHTML = '';
    if (totalPages <= 1) return; // Hide pagination if only one page

    for (let i = 1; i <= totalPages; i++) {
      const pageNumberSpan = document.createElement('span');
      pageNumberSpan.textContent = i;
      if (i === currentPage) {
        pageNumberSpan.classList.add('current-page');
      }
      pageNumberSpan.addEventListener('click', () => {
        currentPage = i;
        displayIntegrations(currentPage, currentIntegrations); // Pass currentIntegrations
        updatePaginationButtons(currentIntegrations); // Keep passing for consistent paging
      });
      pageNumbersContainer.appendChild(pageNumberSpan);
    }
  }

  searchButton.addEventListener('click', () => {
    filterIntegrations(searchInput.value);
  });

  searchInput.addEventListener('input', () => { // Live search on input
    filterIntegrations(searchInput.value);
  });

  closeButton.addEventListener('click', () => {
    infoPanel.classList.add('hidden');
  });

  window.addEventListener('click', (event) => {
    if (event.target == infoPanel) {
      infoPanel.classList.add('hidden');
    }
  });

  prevPageButton.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      displayIntegrations(currentPage);
      updatePaginationButtons();
    }
  });

  nextPageButton.addEventListener('click', () => {
    if (currentPage < totalPages) {
      currentPage++;
      displayIntegrations(currentPage);
      updatePaginationButtons();
    }
  });

  displayIntegrations(currentPage);
  updatePaginationButtons();
});