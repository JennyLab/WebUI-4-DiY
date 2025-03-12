export class Message {
  constructor(data) {
    this.id = data.id;
    this.content = data.content;
    this.username = data.username;
    this.channelId = data.channel_id;
    this.createdAt = data.created_at;
    this.replyTo = data.reply_to || null; // ID of message being replied to
  }

  static async create(room, data) {
    return await room.collection('message').create({
      content: data.content,
      channel_id: data.channelId,
      username: data.username,
      created_at: new Date().toISOString(),
      reply_to: data.replyTo
    });
  }

  static async delete(room, messageId) {
    await room.collection('message').delete(messageId);
  }
}