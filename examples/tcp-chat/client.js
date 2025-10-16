import {
  ProtoObjectTCP,
  ProtoObjectTCPClient,
  MessageType,
} from "../../dist/esm/index.js";
import { createInterface } from "node:readline";

/**
 * Same message classes as in server
 */
class ChatMessage extends ProtoObjectTCP {
  constructor(data) {
    super(data);
    if (data) this.assign(data);
  }

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

class SystemNotification extends ProtoObjectTCP {
  constructor(data) {
    super(data);
    if (data) this.assign(data);
  }

  type = "info";
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
 * TCP chat client
 */
class ChatClient {
  constructor(host = "localhost", port = 3000) {
    this.client = new ProtoObjectTCPClient(host, port);
    this.username = null;
    this.currentRoom = "general";
    this.setupClient();
    this.setupReadline();
  }

  setupClient() {
    this.client.on("connected", () => {
      console.log("🟢 Connected to chat server!");
      console.log("💬 Enter /nick YourName to start");
      this.showPrompt();
    });

    this.client.on("disconnected", () => {
      console.log("🔴 Disconnected from server");
      process.exit(0);
    });

    this.client.on("message", (tcpMessage) => {
      this.handleServerMessage(tcpMessage);
    });

    this.client.on("error", (error) => {
      console.error("❌ Connection error:", error.message);
    });
  }

  setupReadline() {
    this.rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    this.rl.on("line", (input) => {
      this.handleUserInput(input.trim());
    });

    this.rl.on("SIGINT", () => {
      console.log("\n👋 Goodbye!");
      this.disconnect();
    });
  }

  handleServerMessage(tcpMessage) {
    const { type, data } = tcpMessage;

    try {
      if (data.username && data.message && !data.type) {
        // This is a chat message
        const message = ChatMessage.fromJSON(data);
        this.displayChatMessage(message);
      } else if (data.type) {
        // This is a system notification
        const notification = SystemNotification.fromJSON(data);
        this.displaySystemNotification(notification, type);
      }
    } catch (error) {
      console.error("❌ Message processing error:", error);
    }

    this.showPrompt();
  }

  displayChatMessage(message) {
    const time = message.timestamp.toLocaleTimeString();
    const roomInfo = message.room !== "general" ? `[${message.room}]` : "";

    // Clear current input line
    process.stdout.write("\r\x1b[K");

    if (message.username === this.username) {
      console.log(
        `\x1b[36m[${time}]${roomInfo} You: ${message.message}\x1b[0m`
      );
    } else {
      console.log(
        `\x1b[32m[${time}]${roomInfo} ${message.username}: ${message.message}\x1b[0m`
      );
    }
  }

  displaySystemNotification(notification, messageType) {
    const time = notification.timestamp.toLocaleTimeString();

    // Clear current input line
    process.stdout.write("\r\x1b[K");

    let color = "\x1b[33m"; // yellow by default
    let prefix = "ℹ️";

    switch (notification.type) {
      case "error":
        color = "\x1b[31m"; // red
        prefix = "❌";
        break;
      case "user_joined":
        color = "\x1b[32m"; // green
        prefix = "👋";
        break;
      case "user_left":
        color = "\x1b[90m"; // gray
        prefix = "👤";
        break;
      case "warning":
        color = "\x1b[33m"; // yellow
        prefix = "⚠️";
        break;
    }

    console.log(`${color}[${time}] ${prefix} ${notification.message}\x1b[0m`);
  }

  handleUserInput(input) {
    if (!input) {
      this.showPrompt();
      return;
    }

    if (input.startsWith("/")) {
      // System command
      this.sendSystemCommand(input);
    } else {
      // Regular message
      if (!this.username) {
        console.log("❌ Please introduce yourself first with /nick YourName");
        this.showPrompt();
        return;
      }
      this.sendChatMessage(input);
    }
  }

  sendChatMessage(text) {
    const message = new ChatMessage({
      username: this.username,
      message: text,
      timestamp: new Date(),
      room: this.currentRoom,
    });

    this.client.send(message, MessageType.REQUEST);
  }

  sendSystemCommand(command) {
    // Update local data for some commands
    if (command.startsWith("/nick ")) {
      const newUsername = command.substring(6).trim();
      if (newUsername) {
        this.username = newUsername;
      }
    } else if (command.startsWith("/join ")) {
      const newRoom = command.substring(6).trim();
      if (newRoom) {
        this.currentRoom = newRoom;
      }
    }

    const notification = new SystemNotification({
      type: "command",
      message: command,
      timestamp: new Date(),
    });

    this.client.send(notification, MessageType.REQUEST);
  }

  showPrompt() {
    const roomInfo =
      this.currentRoom !== "general" ? `[${this.currentRoom}]` : "";
    const userInfo = this.username ? `${this.username}${roomInfo}` : "guest";
    process.stdout.write(`\x1b[1m${userInfo}>\x1b[0m `);
  }

  async connect() {
    try {
      await this.client.connect();
    } catch (error) {
      console.error("❌ Failed to connect to server:", error.message);
      process.exit(1);
    }
  }

  disconnect() {
    this.client.disconnect();
    this.rl.close();
    process.exit(0);
  }

  showHelp() {
    console.log("\n💬 Chat commands:");
    console.log("  /nick NAME     - set username");
    console.log("  /join ROOM - go to room");
    console.log("  /users        - show users in room");
    console.log("  /rooms        - show available rooms");
    console.log("  /help         - show this help");
    console.log("  Ctrl+C        - exit chat");
    console.log("\nJust type a message to send to chat.\n");
  }
}

// Starting client
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const host = args[0] || "localhost";
  const port = parseInt(args[1]) || 3000;

  console.log("🚀 TCP Chat Client");
  console.log(`📡 Connecting to ${host}:${port}...`);

  const client = new ChatClient(host, port);

  // Show help on startup
  client.showHelp();

  client.connect().catch((error) => {
    console.error("❌ Connection error:", error);
    process.exit(1);
  });
}

export { ChatClient };
