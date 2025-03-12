export class Role {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.color = data.color;
    this.serverId = data.server_id;
    this.created_at = data.created_at || new Date().toISOString();
  }

  static async create(room, name, color, serverId) {
    const role = await room.collection('role').create({
      name,
      color,
      server_id: serverId,
      created_at: new Date().toISOString()
    });
    return new Role(role);
  }

  static async getByServer(room, serverId) {
    const roles = room.collection('role').filter({ server_id: serverId }).getList();
    return roles.map(role => new Role(role));
  }
  
  static async delete(room, roleId) {
    await room.collection('role').delete(roleId);
  }
}