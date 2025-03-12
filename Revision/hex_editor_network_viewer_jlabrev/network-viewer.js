// network-viewer.js
import cytoscape from 'cytoscape';

export class NetworkViewer {
  constructor(container) {
    this.container = container;
    this.startCaptureButton = null;
    this.stopCaptureButton = null;
    this.packetList = null;
    this.networkGraphContainer = null;

    this.initialize = this.initialize.bind(this);
    this.startCapture = this.startCapture.bind(this);
    this.stopCapture = this.stopCapture.bind(this);
    this.displayPacket = this.displayPacket.bind(this);
    this.createNetworkGraph = this.createNetworkGraph.bind(this);
  }

  initialize() {
    this.container.innerHTML = `
      <section id="network-viewer">
        <h2>Network Package Viewer</h2>
        <button id="start-capture">Start Capture</button>
        <button id="stop-capture">Stop Capture</button>
        <div id="packet-list"></div>
        <div id="network-graph"></div>
      </section>
    `;

    this.startCaptureButton = this.container.querySelector('#start-capture');
    this.stopCaptureButton = this.container.querySelector('#stop-capture');
    this.packetList = this.container.querySelector('#packet-list');
    this.networkGraphContainer = this.container.querySelector('#network-graph');

    this.startCaptureButton.addEventListener('click', this.startCapture);
    this.stopCaptureButton.addEventListener('click', this.stopCapture);

    this.createNetworkGraph(this.networkGraphContainer);

    // Example packet data (for demonstration purposes)
    const examplePackets = [
      "Packet 1: Source=192.168.1.1, Destination=8.8.8.8, Protocol=UDP",
      "Packet 2: Source=10.0.0.1, Destination=10.0.0.2, Protocol=TCP",
      "Packet 3: Source=172.217.160.142, Destination=192.168.1.100, Protocol=HTTP"
    ];

    examplePackets.forEach(packet => this.displayPacket(packet, this.packetList));
  }

  startCapture() {
    alert('Network capture started (placeholder).  Real implementation would require backend and deeper system access.');
    // In a real application, you would start capturing network packets here.
  }

  stopCapture() {
    alert('Network capture stopped (placeholder).');
    // In a real application, you would stop capturing network packets here.
  }

  displayPacket(packetData, packetList) {
    const packetDiv = document.createElement('div');
    packetDiv.textContent = packetData; // Replace with formatted packet info
    packetList.appendChild(packetDiv);
  }

  createNetworkGraph(networkGraphContainer) {
    const cy = cytoscape({
      container: networkGraphContainer,

      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#666',
            'label': 'data(id)'
          }
        },

        {
          selector: 'edge',
          style: {
            'width': 3,
            'line-color': '#ccc',
            'target-arrow-color': '#ccc',
            'target-arrow-shape': 'triangle'
          }
        }
      ],

      elements: [
        { data: { id: '192.168.1.1' } },
        { data: { id: '8.8.8.8' } },
        { data: { id: '10.0.0.1' } },
        { data: { id: '10.0.0.2' } },
        { data: { id: '172.217.160.142' } },
        { data: { id: '192.168.1.100' } },

        { data: { id: 'edge1', source: '192.168.1.1', target: '8.8.8.8' } },
        { data: { id: 'edge2', source: '10.0.0.1', target: '10.0.0.2' } },
        { data: { id: 'edge3', source: '172.217.160.142', target: '192.168.1.100' } }
      ],

      layout: {
        name: 'cose', //cola
        nodeRepulsion: 400000,
        idealEdgeLength: 1000
      }
    });
  }
}