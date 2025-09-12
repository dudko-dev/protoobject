import { StreamChatMessage } from "./stream-chat-message.js";
import { createConnection } from "node:net";
import { createInterface } from "node:readline";

/**
 * Streaming Chat Client using @sergdudko/objectstream
 */
async function startStreamingChatClient() {
  const HOST = "localhost";
  const PORT = 8081;

  console.log(
    "🚀 Starting Streaming Chat Client with @sergdudko/objectstream..."
  );
  console.log(`🔗 Connecting to ${HOST}:${PORT}`);

  // Create streaming client
  const client = StreamChatMessage.createStreamingTCPClient(
    StreamChatMessage,
    HOST,
    PORT
  );

  // Setup readline for user input
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  let username: string | null = null;
  let currentRoom = "general";

  // Handle received messages through streaming
  client.on("objectReceived", (message: StreamChatMessage) => {
    console.log(`\\r${message.getFormattedMessage()}`);
    showPrompt();
  });

  client.on("connected", () => {
    console.log("✅ Connected to streaming chat server!");
    console.log("📋 Available commands:");
    console.log("   /username <name> - Set your username");
    console.log("   /join <room>     - Join a room");
    console.log("   /private <user> <message> - Send private message");
    console.log("   /quit            - Exit the chat");
    console.log("");

    if (!username) {
      rl.question("👤 Please enter your username: ", (name) => {
        username = name.trim();
        sendCommand(`/username ${username}`);
        startChatLoop();
      });
    } else {
      startChatLoop();
    }
  });

  client.on("disconnected", () => {
    console.log("❌ Disconnected from server");
    process.exit(0);
  });

  client.on("error", (error) => {
    console.error("💥 Connection error:", error.message);
    process.exit(1);
  });

  function startChatLoop() {
    showPrompt();
    rl.on("line", (input) => {
      const message = input.trim();

      if (!message) {
        showPrompt();
        return;
      }

      if (message === "/quit") {
        console.log("👋 Goodbye!");
        client.disconnect();
        process.exit(0);
      }

      if (message.startsWith("/")) {
        handleCommand(message);
      } else {
        sendPublicMessage(message);
      }

      showPrompt();
    });
  }

  function handleCommand(command: string) {
    if (command.startsWith("/username ")) {
      const newUsername = command.replace("/username ", "").trim();
      username = newUsername;
      sendCommand(command);
    } else if (command.startsWith("/join ")) {
      const room = command.replace("/join ", "").trim();
      currentRoom = room;
      sendCommand(command);
    } else if (command.startsWith("/private ")) {
      const parts = command.replace("/private ", "").split(" ");
      if (parts.length < 2) {
        console.log("❌ Usage: /private <username> <message>");
        return;
      }

      const targetUser = parts[0];
      const message = parts.slice(1).join(" ");
      sendPrivateMessage(targetUser, message);
    } else {
      console.log("❌ Unknown command. Type /quit to exit.");
    }
  }

  function sendCommand(command: string) {
    const message = StreamChatMessage.createPublicMessage(
      username || "Anonymous",
      command,
      currentRoom
    );
    sendMessage(message);
  }

  function sendPublicMessage(text: string) {
    const message = StreamChatMessage.createPublicMessage(
      username || "Anonymous",
      text,
      currentRoom
    );
    sendMessage(message);
  }

  function sendPrivateMessage(targetUser: string, text: string) {
    const message = StreamChatMessage.createPrivateMessage(
      username || "Anonymous",
      text,
      targetUser
    );
    sendMessage(message);
  }

  function sendMessage(message: StreamChatMessage) {
    // Using streaming approach with @sergdudko/objectstream
    if (client.socket) {
      const messageBuffer = Buffer.from(JSON.stringify(message.toJSON()));
      client.socket.write(messageBuffer);
    }
  }

  function showPrompt() {
    process.stdout.write(`[${currentRoom}] ${username || "Anonymous"}: `);
  }

  // Connect to server
  client.connect();

  // Graceful shutdown
  process.on("SIGINT", () => {
    console.log("\\n👋 Goodbye!");
    client.disconnect();
    process.exit(0);
  });
}

// Start the client
startStreamingChatClient().catch(console.error);
