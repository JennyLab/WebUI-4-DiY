export class RoleUI {
  constructor(room) {
    this.room = room;
    this.currentServerId = null;
    this.roleList = document.getElementById('role-list');
    this.createRoleBtn = document.getElementById('create-role-btn');
    this.createRoleModal = document.getElementById('create-role-modal');
    this.roleNameInput = document.getElementById('role-name-input');
    this.roleColorInput = document.getElementById('role-color-input');
    this.confirmRoleBtn = document.getElementById('confirm-role-btn');
    this.cancelRoleBtn = document.getElementById('cancel-role-btn');

    // Initialize with empty roles
    this.roles = [];

    this.setupEventListeners();
    this.subscribeToRoles();
  }

  setupEventListeners() {
    this.createRoleBtn.addEventListener('click', () => this.showCreateRoleModal());
    this.confirmRoleBtn.addEventListener('click', () => this.createRole());
    this.cancelRoleBtn.addEventListener('click', () => this.hideCreateRoleModal());

    document.addEventListener('serverSelected', (e) => {
      this.currentServerId = e.detail.id;
      this.roleList.innerHTML = '';
      this.renderRoles();
    });
  }

  subscribeToRoles() {
    this.room.collection('role').subscribe((roles) => {
      this.roles = roles;
      if (this.currentServerId) {
        const filteredRoles = roles.filter(r => r.server_id === this.currentServerId);
        this.renderRolesList(filteredRoles);
      }
    });
  }

  async renderRoles() {
    if (!this.currentServerId) return;

    // Use cached roles instead of making new request
    const filteredRoles = this.roles.filter(r => r.server_id === this.currentServerId);
    this.renderRolesList(filteredRoles);
  }

  renderRolesList(roles) {
    this.roleList.innerHTML = '';
    
    roles.forEach(role => {
      const roleEl = document.createElement('div');
      roleEl.className = 'flex items-center justify-between px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800/50';
      
      roleEl.innerHTML = `
        <div class="flex items-center">
          <span class="w-3 h-3 rounded-full mr-2" style="background-color: ${role.color}"></span>
          <span style="color: ${role.color}">${role.name}</span>
        </div>
        <button class="delete-role-btn text-red-500 hover:text-red-400 opacity-0 group-hover:opacity-100">
          <span class="material-icons text-sm">close</span>
        </button>
      `;
      
      roleEl.querySelector('.delete-role-btn').addEventListener('click', () => this.deleteRole(role.id));
      this.roleList.appendChild(roleEl);
    });
  }

  showCreateRoleModal() {
    if (!this.currentServerId) return;
    this.createRoleModal.classList.remove('hidden');
    this.roleNameInput.focus();
  }

  hideCreateRoleModal() {
    this.createRoleModal.classList.add('hidden');
    this.roleNameInput.value = '';
    this.roleColorInput.value = '#ffffff';
  }

  async createRole() {
    const name = this.roleNameInput.value.trim();
    const color = this.roleColorInput.value;
    if (!name || !this.currentServerId) return;

    await this.room.collection('role').create({
      name,
      color,
      server_id: this.currentServerId,
      created_at: new Date().toISOString()
    });

    this.hideCreateRoleModal();
  }

  async deleteRole(roleId) {
    await this.room.collection('role').delete(roleId);
  }
}