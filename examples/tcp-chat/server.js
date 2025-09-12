import {
  ProtoObjectTCP,
  ProtoObjectTCPServer,
  MessageType,
} from "../../lib/esm/index.js";

/**
 * Chat message from user
 */
class ChatMessage extends ProtoObjectTCP {
  constructor(data) {
    super(data);
    if (data) this.assign(data);
  }

  // Message fields
  username = "";
  message = "";
  timestamp = new Date();
  room = "general";

  toJSON() {
    return {
      ...super.toJSON(),
      username: this.username,
      message: this.message,
      timestamp: this.timestamp.toJSON(),
      room: this.room,
    };
  }

  static fromJSON(data) {
    return new ChatMessage({
      ...data,
      timestamp: new Date(data.timestamp),
    });
  }
}

/**
 * Chat user
 */
class ChatUser extends ProtoObjectTCP {
  constructor(data) {
    super(data);
    if (data) this.assign(data);
  }

  // User fields
  username = "";
  room = "general";
  joinedAt = new Date();
  isOnline = true;

  toJSON() {
    return {
      ...super.toJSON(),
      username: this.username,
      room: this.room,
      joinedAt: this.joinedAt.toJSON(),
      isOnline: this.isOnline,
    };
  }

  static fromJSON(data) {
    return new ChatUser({
      ...data,
      joinedAt: new Date(data.joinedAt),
    });
  }
}

/**
 * System notification
 */
class SystemNotification extends ProtoObjectTCP {
  constructor(data) {
    super(data);
    if (data) this.assign(data);
  }

  // Notification fields
  type = "info"; // info, warning, error, user_joined, user_left
  message = "";
  timestamp = new Date();
  room = "general";

  toJSON() {
    return {
      ...super.toJSON(),
      type: this.type,
      message: this.message,
      timestamp: this.timestamp.toJSON(),
      room: this.room,
    };
  }

  static fromJSON(data) {
    return new SystemNotification({
      ...data,
      timestamp: new Date(data.timestamp),
    });
  }
}

/**
 * Simple TCP chat server
 */
class ChatServer {
  constructor(port = 3000) {
    this.server = new ProtoObjectTCPServer(port);
    this.users = new Map(); // clientId -> ChatUser
    this.rooms = new Map(); // roomName -> Set<clientId>
    this.messageHistory = []; // last 100 messages
    this.setupServer();
  }

  setupServer() {
    this.server.on("clientConnected", (clientId, socket) => {
      console.log(`[SERVER] Client connected: ${clientId}`);

      // Send welcome message
      const welcome = new SystemNotification({
        type: "info",
        message: `Welcome to chat! Introduce yourself with /nick NAME`,
        room: "general",
      });

      this.server.sendToClient(clientId, welcome, MessageType.NOTIFICATION);
    });

    this.server.on("clientDisconnected", (clientId) => {
      const user = this.users.get(clientId);
      if (user) {
        console.log(`[SERVER] User .* disconnected`);

        // Notify others about leaving
        const notification = new SystemNotification({
          type: "user_left",
          message: `${user.username} left chat`,
          room: user.room,
        });

        this.broadcastToRoom(user.room, notification, clientId);
        this.removeUserFromRoom(clientId, user.room);
        this.users.delete(clientId);
      }
    });

    this.server.on("message", (clientId, tcpMessage) => {
      try {
        const { type, data } = tcpMessage;

        switch (type) {
          case MessageType.REQUEST:
            if (data.username && data.message) {
              // This is a chat message
              const chatMessage = ChatMessage.fromJSON(data);
              this.handleChatMessage(clientId, chatMessage);
            } else if (data.type) {
              // This is a system command
              const notification = SystemNotification.fromJSON(data);
              this.handleSystemCommand(clientId, notification);
            }
            break;

          default:
            console.log(`[SERVER] Unknown message type: ${type}`);
        }
      } catch (error) {
        console.error(`[SERVER] Message processing error:`, error);
      }
    });

    this.server.on("error", (error) => {
      console.error(`[SERVER] Server error:`, error);
    });
  }

  handleChatMessage(clientId, message) {
    const user = this.users.get(clientId);
    if (!user) {
      const error = new SystemNotification({
        type: "error",
        message: "Please introduce yourself first with /nick NAME",
      });
      this.server.sendToClient(clientId, error, MessageType.ERROR);
      return;
    }

    // Update username in message
    message.username = user.username;
    message.room = user.room;
    message.timestamp = new Date();

    console.log(
      `[CHAT][${message.room}] ${message.username}: ${message.message}`
    );

    // Add to history
    this.messageHistory.push(message);
    if (this.messageHistory.length > 100) {
      this.messageHistory.shift();
    }

    // Broadcast to all in room
    this.broadcastToRoom(message.room, message);
  }

  handleSystemCommand(clientId, notification) {
    const message = notification.message;

    if (message.startsWith("/nick ")) {
      const username = message.substring(6).trim();
      if (username) {
        const oldUser = this.users.get(clientId);
        const user = new ChatUser({
          username,
          room: oldUser?.room || "general",
        });

        this.users.set(clientId, user);
        this.addUserToRoom(clientId, user.room);

        const response = new SystemNotification({
          type: "info",
          message: `You are now .* Welcome to room .*!`,
        });
        this.server.sendToClient(clientId, response, MessageType.RESPONSE);

        // Notify others about connection
        const announcement = new SystemNotification({
          type: "user_joined",
          message: `${username} joined the chat`,
          room: user.room,
        });
        this.broadcastToRoom(user.room, announcement, clientId);

        // Send recent messages
        this.sendRecentMessages(clientId, user.room);
      }
    } else if (message.startsWith("/join ")) {
      const roomName = message.substring(6).trim();
      this.joinRoom(clientId, roomName);
    } else if (message === "/users") {
      this.sendUserList(clientId);
    } else if (message === "/rooms") {
      this.sendRoomList(clientId);
    } else {
      const error = new SystemNotification({
        type: "error",
        message:
          "Unknown command. Available: /nick NAME, /join ROOM, /users, /rooms",
      });
      this.server.sendToClient(clientId, error, MessageType.ERROR);
    }
  }

  joinRoom(clientId, roomName) {
    const user = this.users.get(clientId);
    if (!user) return;

    const oldRoom = user.room;
    this.removeUserFromRoom(clientId, oldRoom);

    user.room = roomName;
    this.addUserToRoom(clientId, roomName);

    const response = new SystemNotification({
      type: "info",
      message: `You moved to room "${roomName}"`,
    });
    this.server.sendToClient(clientId, response, MessageType.RESPONSE);

    // Notify old room
    const leftNotification = new SystemNotification({
      type: "user_left",
      message: `${user.username} moved to another room`,
      room: oldRoom,
    });
    this.broadcastToRoom(oldRoom, leftNotification, clientId);

    // Notify new room
    const joinedNotification = new SystemNotification({
      type: "user_joined",
      message: `${user.username} joined the room`,
      room: roomName,
    });
    this.broadcastToRoom(roomName, joinedNotification, clientId);

    // Send recent messages new room
    this.sendRecentMessages(clientId, roomName);
  }

  sendUserList(clientId) {
    const user = this.users.get(clientId);
    if (!user) return;

    const roomUsers = this.rooms.get(user.room) || new Set();
    const userNames = Array.from(roomUsers)
      .map((id) => this.users.get(id)?.username)
      .filter(Boolean);

    const response = new SystemNotification({
      type: "info",
      message: `Users in "${user.room}": ${userNames.join(", ")}`,
    });
    this.server.sendToClient(clientId, response, MessageType.RESPONSE);
  }

  sendRoomList(clientId) {
    const roomNames = Array.from(this.rooms.keys());
    const response = new SystemNotification({
      type: "info",
      message: `Available rooms: ${roomNames.join(", ")}`,
    });
    this.server.sendToClient(clientId, response, MessageType.RESPONSE);
  }

  sendRecentMessages(clientId, room) {
    const recentMessages = this.messageHistory
      .filter((msg) => msg.room === room)
      .slice(-10);

    for (const message of recentMessages) {
      this.server.sendToClient(clientId, message, MessageType.NOTIFICATION);
    }
  }

  addUserToRoom(clientId, room) {
    if (!this.rooms.has(room)) {
      this.rooms.set(room, new Set());
    }
    this.rooms.get(room).add(clientId);
  }

  removeUserFromRoom(clientId, room) {
    const roomUsers = this.rooms.get(room);
    if (roomUsers) {
      roomUsers.delete(clientId);
      if (roomUsers.size === 0) {
        this.rooms.delete(room);
      }
    }
  }

  broadcastToRoom(room, object, excludeClientId = null) {
    const roomUsers = this.rooms.get(room);
    if (!roomUsers) return;

    for (const clientId of roomUsers) {
      if (clientId !== excludeClientId) {
        this.server.sendToClient(clientId, object, MessageType.NOTIFICATION);
      }
    }
  }

  async start() {
    await this.server.start();
    console.log("[SERVER] Chat server started!");
    console.log("[SERVER] Connect with clients and enjoy chatting!");
  }

  async stop() {
    await this.server.stop();
    console.log("[SERVER] Chat server stopped");
  }
}

// Starting server
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new ChatServer(3000);

  server.start().catch(console.error);

  // Graceful shutdown
  process.on("SIGINT", async () => {
    console.log("\n[SERVER] Received termination signal...");
    await server.stop();
    process.exit(0);
  });
}

export { ChatServer, ChatMessage, ChatUser, SystemNotification };
