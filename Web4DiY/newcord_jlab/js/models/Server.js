export class Server {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.ownerId = data.owner_id;
    this.icon = data.icon || 'groups';
    this.created_at = data.created_at || new Date().toISOString();
  }

  static async create(room, name, ownerId) {
    const server = await room.collection('server').create({
      name,
      owner_id: ownerId,
      created_at: new Date().toISOString()
    });
    return new Server(server);
  }

  static async getAll(room) {
    const servers = room.collection('server').getList();
    return servers.map(server => new Server(server));
  }

  isOwner(userId) {
    return this.ownerId === userId;
  }
}