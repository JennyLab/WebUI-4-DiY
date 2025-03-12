export class Channel {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.serverId = data.server_id;
    this.created_at = data.created_at || new Date().toISOString();
  }

  static async create(room, name, serverId) {
    try {
      const channel = await room.collection('channel').create({
        name,
        server_id: serverId,
        created_at: new Date().toISOString()
      });
      return new Channel(channel);
    } catch (error) {
      console.error('Error creating channel:', error);
      throw error;
    }
  }

  static async getByServer(room, serverId) {
    try {
      const channels = await room.collection('channel')
        .filter({ server_id: serverId })
        .getList();
      return channels.map(channel => new Channel(channel));
    } catch (error) {
      console.error('Error getting channels:', error);
      return [];
    }
  }

  static async delete(room, channelId) {
    try {
      await room.collection('channel').delete(channelId);
    } catch (error) {
      console.error('Error deleting channel:', error);
      throw error;
    }
  }
}