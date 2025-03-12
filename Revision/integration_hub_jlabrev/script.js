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
      const logo = generateLogoSVG(integrationName); // Generate SVG logo based on name
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

  function generateLogoSVG(name) {
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('class', 'card-logo');

    const colors = ['#2ecc71', '#3498db', '#9b59b6', '#e67e22', '#e74c3c'];
    const bgColor = colors[Math.floor(Math.random() * colors.length)];

    const circle = document.createElementNS(svgNS, 'circle');
    circle.setAttribute('cx', '50');
    circle.setAttribute('cy', '50');
    circle.setAttribute('r', '50');
    circle.setAttribute('fill', bgColor);
    svg.appendChild(circle);

    const text = document.createElementNS(svgNS, 'text');
    text.setAttribute('x', '50');
    text.setAttribute('y', '50');
    text.setAttribute('dominant-baseline', 'middle');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', '#fff');
    text.setAttribute('font-size', '2em');
    text.setAttribute('font-family', 'sans-serif');
    text.textContent = name.substring(0, 2).toUpperCase(); // First two letters
    svg.appendChild(text);
    return svg;
  }


  function displayIntegrations(page) {
    integrationGrid.innerHTML = '';
    const startIndex = (page - 1) * cardsPerPage;
    const endIndex = startIndex + cardsPerPage;
    const pageIntegrations = integrations.slice(startIndex, endIndex);

    pageIntegrations.forEach(integration => {
      const card = document.createElement('div');
      card.classList.add('integration-card');
      card.innerHTML = `
        ${integration.logo}
        <h3 class="card-title">${integration.name}</h3>
      `;
      card.addEventListener('click', () => showInfoPanel(integration));
      integrationGrid.appendChild(card);
    });
  }

  function showInfoPanel(integration) {
    panelTitle.textContent = integration.name;
    panelDetails.innerHTML = `
      <p><strong>Category:</strong> ${integration.category}</p>
      <p><strong>Provider:</strong> ${integration.provider}</p>
      <p><strong>API Type:</strong> ${integration.apiType}</p>
      <p><strong>Description:</strong> ${integration.description}</p>
    `;
    infoPanel.classList.remove('hidden');
  }

  closeButton.addEventListener('click', () => {
    infoPanel.classList.add('hidden');
  });

  window.addEventListener('click', (event) => {
    if (event.target == infoPanel) {
      infoPanel.classList.add('hidden');
    }
  });

  function updatePaginationButtons() {
    pageNumbersContainer.innerHTML = '';
    for (let i = 1; i <= totalPages; i++) {
      const pageNumberSpan = document.createElement('span');
      pageNumberSpan.textContent = i;
      if (i === currentPage) {
        pageNumberSpan.classList.add('current-page');
      }
      pageNumberSpan.addEventListener('click', () => {
        currentPage = i;
        displayIntegrations(currentPage);
        updatePaginationButtons();
      });
      pageNumbersContainer.appendChild(pageNumberSpan);
    }
  }

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