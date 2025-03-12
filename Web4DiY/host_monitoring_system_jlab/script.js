import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

let hostsData = [];
let currentView = 'card'; // Default view
let currentTheme = localStorage.getItem('theme') || 'dark';
document.documentElement.setAttribute('data-theme', currentTheme);

function generateRandomData() {
    const hosts = [
        { host: '8.8.8.8', protocol: 'UDP::53' },
        { host: 'https://www.google.com', protocol: 'TCP::443' },
        { host: 'lab.jennylab.net', protocol: 'TCP::80' },
        { host: '192.168.1.1', protocol: 'ICMP::0' },
        {host: 'example.com', protocol: 'TCP::22'}
    ];

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));

    return hosts.map(h => ({
        status: ['red', 'green', 'yellow'][Math.floor(Math.random() * 3)],
        host: h.host,
        protocol: h.protocol,
        timestamp: new Date(oneDayAgo.getTime() + Math.floor(Math.random() * (24 * 60 * 60 * 1000))),
        heartbeat: Array.from({ length: 96 }, (_, i) => {
            const time = new Date(oneDayAgo.getFullYear(), oneDayAgo.getMonth(), oneDayAgo.getDate(), 0, i * 15, 0); // Start at 00:00
            return {
              status: ['red', 'green', 'yellow', 'gray'][Math.floor(Math.random() * 4)],
              time: time
            };
        }),
        chartData: generateRealisticTTLData(now, 24),
        active: Math.random() < 0.8  // 80% chance of being active
    }));
}

function generateRealisticTTLData(endTime, count) {
    // Create a more realistic TTL pattern
    const patterns = [
        // Normal pattern (stable)
        () => ({ base: 64, variance: 5, trend: 0 }),
        // Degrading pattern (increasing latency)
        () => ({ base: 64, variance: 10, trend: 0.8 }),
        // Fluctuating pattern (network congestion)
        () => ({ base: 80, variance: 20, trend: 0 }),
        // Spike pattern (occasional high latency)
        () => ({ base: 70, variance: 5, trend: 0, spikes: true })
    ];
    
    const pattern = patterns[Math.floor(Math.random() * patterns.length)]();
    
    return Array.from({ length: count }, (_, i) => {
        let value = pattern.base;
        
        // Add trend (gradual increase/decrease)
        value += pattern.trend * i;
        
        // Add random variance
        value += (Math.random() * 2 - 1) * pattern.variance;
        
        // Add occasional spikes if specified
        if (pattern.spikes && Math.random() < 0.1) {
            value += 50 + Math.random() * 100;
        }
        
        // Ensure reasonable bounds
        value = Math.max(20, Math.min(250, value));
        
        return {
            time: new Date(endTime.getTime() - ((count - i) * 60 * 60 * 1000)), // Hourly intervals
            value: Math.round(value),
            ttl: Math.round(value)
        };
    }).sort((a, b) => a.time - b.time);
}

function renderHeartbeat(heartbeatData) {
    const container = d3.create("svg")
        .attr("width", 96 * 3)  // width
        .attr("height", 15);    //  height
        

    const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("background-color", "lightgray")
    .style("border", "solid")
    .style("border-color", "black")
    .style("border-width", "0.5px")
    .style("border-radius", "1px")
    .style("padding", "1px")
    .style("font-size", "7.5px")
    .style("color", "black");


    container.selectAll("rect")
        .data(heartbeatData)
        .join("rect")
        .attr("x", (d, i) => i * 3)
        .attr("width", 2)
        .attr("height", 15)
        .attr("fill", d => {
            switch (d.status) {
                case 'red': return 'red';
                case 'green': return 'green';
                case 'yellow': return 'yellow';
                case 'gray': return 'gray';
                default: return 'gray';
            }
        })
        .on("mouseover", function(event, d) {
          d3.select(this).attr("stroke", "black").attr("stroke-width", 1); // Highlight block

            tooltip.style("opacity", 1)
               .html(d.time.toLocaleTimeString()) // Show time
              .style("left", (event.pageX + 10) + "px")
              .style("top", (event.pageY - 20) + "px");

        })
        .on("mouseout", function() {
             d3.select(this).attr("stroke", null);
            tooltip.style("opacity", 0);
        })
        .on("click", function(event,d){

           tooltip.style("opacity", 1)
               .html(d.time.toLocaleTimeString()) // Show time
              .style("left", (event.pageX + 10) + "px")
              .style("top", (event.pageY - 20) + "px");

            setTimeout(() => {
                 tooltip.style("opacity", 0);
            },2000); //hace que desaparezca a los 2 segundos
        });

    return container.node();
}

function renderChart(chartData, containerWidth, containerHeight) {
  const margin = { top: 5, right: 5, bottom: 20, left: 25 };
  const width = containerWidth - margin.left - margin.right;
  const height = containerHeight - margin.top - margin.bottom;

  const svg = d3.create("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleTime()
      .domain(d3.extent(chartData, d => d.time))
      .range([0, width]);

  const y = d3.scaleLinear()
      .domain([0, d3.max(chartData, d => d.value) * 1.1])
      .range([height, 0]);

  // Add grid lines
  svg.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(5).tickSize(-height).tickFormat(""))
      .selectAll("line")
      .style("stroke", "rgba(100, 149, 237, 0.1)");

  svg.append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(y).ticks(5).tickSize(-width).tickFormat(""))
      .selectAll("line")
      .style("stroke", "rgba(100, 149, 237, 0.1)");

  // Add X axis
  svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d3.timeFormat("%H:%M")))
      .selectAll("text")
      .style("font-size", "7px")
      .style("fill", "#bdc3c7");

  // Add Y axis
  svg.append("g")
      .call(d3.axisLeft(y).ticks(5))
      .selectAll("text")
      .style("font-size", "7px")
      .style("fill", "#bdc3c7");

  // Add Y axis label
  svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -margin.left + 10)
      .attr("x", -height / 2)
      .attr("dy", "0.71em")
      .style("text-anchor", "middle")
      .style("font-size", "7px")
      .style("fill", "#4fc3f7")
      .text("TTL (ms)");

  // Create area under the curve
  svg.append("path")
      .datum(chartData)
      .attr("fill", "url(#gradient)")
      .attr("fill-opacity", 0.3)
      .attr("d", d3.area()
        .x(d => x(d.time))
        .y0(height)
        .y1(d => y(d.value))
        .curve(d3.curveMonotoneX));
  
  // Add gradient for area
  const gradient = svg.append("defs")
    .append("linearGradient")
    .attr("id", "gradient")
    .attr("x1", "0%")
    .attr("y1", "0%")
    .attr("x2", "0%")
    .attr("y2", "100%");
  
  gradient.append("stop")
    .attr("offset", "0%")
    .attr("stop-color", "#4fc3f7")
    .attr("stop-opacity", 0.8);
  
  gradient.append("stop")
    .attr("offset", "100%")
    .attr("stop-color", "#4fc3f7")
    .attr("stop-opacity", 0.1);

  // Create line generator
  const line = d3.line()
      .x(d => x(d.time))
      .y(d => y(d.value))
      .curve(d3.curveMonotoneX);

  // Add the line path
  svg.append("path")
      .datum(chartData)
      .attr("fill", "none")
      .attr("stroke", "#4fc3f7")
      .attr("stroke-width", 2)
      .attr("d", line);
      
  // Add data points with enhanced interaction
  svg.selectAll(".data-point")
      .data(chartData)
      .enter()
      .append("circle")
      .attr("class", "data-point")
      .attr("cx", d => x(d.time))
      .attr("cy", d => y(d.value))
      .attr("r", 3)
      .attr("fill", "#2c3e50")
      .attr("stroke", "#4fc3f7")
      .attr("stroke-width", 1)
      .on("mouseover", function(event, d) {
          d3.select(this)
              .attr("r", 5)
              .attr("fill", "#4fc3f7");
          
          // Show tooltip
          const tooltip = d3.select("body").append("div")
          .attr("class", "chart-tooltip")
          .style("position", "absolute")
          .style("background", "rgba(22, 25, 32, 0.9)")
          .style("color", "#4fc3f7")
          .style("padding", "6px")
          .style("border-radius", "4px")
          .style("font-size", "12px")
          .style("opacity", 1)
          .html(`TTL: ${d.ttl}ms<br>Time: ${d.time.toLocaleTimeString()}<br>Date: ${d.time.toLocaleDateString()}`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
          
          setTimeout(() => {
              tooltip.style("opacity", 0);
              setTimeout(() => tooltip.remove(), 300);
          }, 2000);
      })
      .on("mouseout", function() {
          d3.select(this)
              .attr("r", 3)
              .attr("fill", "#2c3e50");
      });

  return svg.node();
}

function renderView() {
    const container = document.getElementById('mainPContainer');
    container.innerHTML = ''; // Clear previous content

    if (currentView === 'table') {
        container.style.display = 'block';  // for table
        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');

        const headerRow = document.createElement('tr');
        ['Status', 'Host', 'Protocol', 'Timestamp', 'Monitor HeartBeat', 'Status Chart', 'Actions'].forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        hostsData.forEach((host, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><span class="status-indicator status-${host.status}"></span></td>
                <td>${host.host}</td>
                <td>${host.protocol}</td>
                <td class = "timestamp ${host.status === "green"? "timestamp-ok":"timestamp-no"}">${host.timestamp.toLocaleString()}</td>
                <td><div class="heartbeat-container"></div></td>
                <td><div class="chart-container"></div></td>
                <td class="buttons-cell">
                   <button class="activate-btn">${host.active ? 'Deactivate' : 'Activate'}</button>
                    <button class="edit-btn">Edit</button>
                    <button class="delete-btn">Delete</button>
                </td>
            `;

            const heartbeatContainer = row.querySelector('.heartbeat-container');
            heartbeatContainer.appendChild(renderHeartbeat(host.heartbeat));
            const chartContainer = row.querySelector('.chart-container');
            chartContainer.appendChild(renderChart(host.chartData, 150, 50)); // Use fixed dimensions


            tbody.appendChild(row);
        });
        table.appendChild(tbody);
        container.appendChild(table);

     setButtonHandlers(); // Add Event Listeners
    } else {
        container.style.display = 'flex';  // for cards
        hostsData.forEach((host, index) => {
            const card = document.createElement('div');
            card.classList.add('card');
            card.innerHTML = `
                <p><span class="status-indicator status-${host.status}"></span> <strong></strong> ${host.host}</p>
                <p><strong>Protocol:</strong> ${host.protocol}</p>
                <p class = "timestamp ${host.status === "green"? "timestamp-ok":"timestamp-no"}"><strong>Timestamp:</strong> ${host.timestamp.toLocaleString()}</p>
                <p><strong>Monitor HeartBeat:</strong></p><div class="heartbeat-container"></div>
                <p><strong>Status Chart:</strong> <div class="chart-container"></div></p>
                  <p class="buttons-cell" id="buttons-cell-card">
                   <button class="activate-btn">${host.active ? 'Deactivate' : 'Activate'}</button>
                    <button class="edit-btn">Edit</button>
                    <button class="delete-btn">Delete</button>
                </p>
            `;
             const heartbeatContainer = card.querySelector('.heartbeat-container');
            heartbeatContainer.appendChild(renderHeartbeat(host.heartbeat));

            const chartContainer = card.querySelector('.chart-container');
            chartContainer.appendChild(renderChart(host.chartData, 250, 75));


            container.appendChild(card);
        });
         setButtonHandlers();// Add Event Listeners
    }

}

function setButtonHandlers(){
        // Event listeners for action buttons, using symbols and tooltips
        document.querySelectorAll('.activate-btn').forEach((btn, index) => {
             btn.textContent = '▶️'; // Play symbol for Activate
            btn.addEventListener('click', () => {
                hostsData[index].active = !hostsData[index].active;
                 btn.textContent = hostsData[index].active ? '⏸️' : '▶️'; // Toggle symbol
                renderView();
            });
        });
          document.querySelectorAll('.delete-btn').forEach((btn, index) => {
           btn.textContent = '🗑️'; // Trash symbol for Delete
        btn.addEventListener('click', () => {
            // Remove the element at the clicked index
            hostsData.splice(index, 1);

            // Re-render the view to reflect the changes
            renderView();
        });
    });
     document.querySelectorAll('.edit-btn').forEach((btn, index) => {
         btn.textContent = '✏️';
     });
}

function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);
    
    // Update theme toggle button text
    const themeToggle = document.getElementById('themeToggle');
    themeToggle.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
}

document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('themeToggle');
    themeToggle.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
    themeToggle.addEventListener('click', toggleTheme);
});

document.getElementById('addHost').addEventListener('click', () => {
    const hostInput = document.getElementById('hostInput');
    const hostValue = hostInput.value.trim();

    if (hostValue) {
        const [host, protocolPort = ''] = hostValue.split(' ');
        const protocol = protocolPort.split("::")[0] || 'TCP';
        const port = protocolPort.split("::")[1] || '80'; //extraemos el puerto

        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));

        const newHost = {
            status: 'yellow', // Initial status
            host: host,
            protocol: `${protocol}::${port}`, //protocol format
            timestamp: new Date(oneDayAgo.getTime() + Math.floor(Math.random() * (24 * 60 * 60 * 1000))), //random
            heartbeat: Array.from({ length: 96 },  (_, i) => {
            const time = new Date(oneDayAgo.getFullYear(), oneDayAgo.getMonth(), oneDayAgo.getDate(), 0, i * 15, 0); // Start at 00:00
            return {
              status: 'gray',
              time: time
            };
        }),  // Initial heartbeat
            chartData: generateRealisticTTLData(now, 24),
            active: true
        };

        hostsData.push(newHost);
        renderView();
        hostInput.value = ''; // Clear input
    } else {
        alert('Please enter a valid host value.');
    }
});

document.getElementById('tableViewBtn').textContent = '☰'; // Table view symbol
document.getElementById('cardViewBtn').textContent = '🗄️'; // Card View symbol
document.getElementById('addHost').textContent = '➕'; // Plus symbol for add
hostsData = generateRandomData();
renderView();

document.getElementById('tableViewBtn').addEventListener('click', () => {
    currentView = 'table';
    renderView();
});

document.getElementById('cardViewBtn').addEventListener('click', () => {
    currentView = 'card';
    renderView();
});