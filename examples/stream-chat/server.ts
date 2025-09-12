import { StreamChatMessage } from "./stream-chat-message.js";

/**
 * Streaming Chat Server using @sergdudko/objectstream for efficient message processing
 */
async function startStreamingChatServer() {
  const PORT = 8081;

  console.log(
    "🚀 Starting Streaming Chat Server with @sergdudko/objectstream..."
  );
  console.log(`📡 Server will listen on port ${PORT}`);

  // Create streaming server for efficient ProtoObject processing
  const server = StreamChatMessage.createStreamingTCPServer(
    StreamChatMessage,
    PORT
  );

  // Store connected clients
  const clients = new Map<string, any>();
  const rooms = new Map<string, Set<string>>();

  server.on("connection", (socket) => {
    const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    clients.set(clientId, { socket, username: null, room: "general" });

    console.log(`🔗 New client connected: ${clientId}`);

    socket.on("close", () => {
      const client = clients.get(clientId);
      if (client?.username) {
        // Remove from room
        const roomClients = rooms.get(client.room);
        roomClients?.delete(clientId);

        // Broadcast leave message
        const leaveMessage = StreamChatMessage.createPublicMessage(
          "System",
          `${client.username} left the chat`,
          client.room
        );
        broadcastToRoom(client.room, leaveMessage, clientId);
      }

      clients.delete(clientId);
      console.log(`❌ Client disconnected: ${clientId}`);
    });
  });

  // Handle received objects through streaming
  server.on("objectReceived", (message: StreamChatMessage, socket) => {
    console.log(`📨 Received message: ${message.getFormattedMessage()}`);

    const clientId = Array.from(clients.entries()).find(
      ([, client]) => client.socket === socket
    )?.[0];

    if (!clientId) return;

    const client = clients.get(clientId);
    if (!client) return;

    // Handle different message types
    if (message.message?.startsWith("/join ")) {
      handleJoinRoom(clientId, message);
    } else if (message.message?.startsWith("/username ")) {
      handleSetUsername(clientId, message);
    } else if (message.isPrivateMessage()) {
      handlePrivateMessage(message);
    } else {
      handlePublicMessage(clientId, message);
    }
  });

  function handleJoinRoom(clientId: string, message: StreamChatMessage) {
    const client = clients.get(clientId);
    if (!client) return;

    const newRoom = message.message?.replace("/join ", "").trim() || "general";
    const oldRoom = client.room;

    // Remove from old room
    rooms.get(oldRoom)?.delete(clientId);

    // Add to new room
    if (!rooms.has(newRoom)) {
      rooms.set(newRoom, new Set());
    }
    rooms.get(newRoom)?.add(clientId);

    client.room = newRoom;

    const joinMessage = StreamChatMessage.createPublicMessage(
      "System",
      `${client.username || clientId} joined ${newRoom}`,
      newRoom
    );

    broadcastToRoom(newRoom, joinMessage);
  }

  function handleSetUsername(clientId: string, message: StreamChatMessage) {
    const client = clients.get(clientId);
    if (!client) return;

    const newUsername = message.message?.replace("/username ", "").trim();
    if (!newUsername) return;

    const oldUsername = client.username;
    client.username = newUsername;

    // Add to room if not already there
    if (!rooms.has(client.room)) {
      rooms.set(client.room, new Set());
    }
    rooms.get(client.room)?.add(clientId);

    const welcomeMessage = oldUsername
      ? StreamChatMessage.createPublicMessage(
          "System",
          `${oldUsername} is now known as ${newUsername}`,
          client.room
        )
      : StreamChatMessage.createPublicMessage(
          "System",
          `${newUsername} joined the chat`,
          client.room
        );

    broadcastToRoom(client.room, welcomeMessage);
  }

  function handlePrivateMessage(message: StreamChatMessage) {
    if (!message.targetUser) return;

    // Find target client
    const targetClient = Array.from(clients.entries()).find(
      ([, client]) => client.username === message.targetUser
    );

    if (targetClient) {
      const [targetId, target] = targetClient;
      sendToClient(targetId, message);
    }
  }

  function handlePublicMessage(clientId: string, message: StreamChatMessage) {
    const client = clients.get(clientId);
    if (!client?.username) return;

    // Update message with client info
    message.username = client.username;
    message.room = client.room;
    message.timestamp = new Date();

    broadcastToRoom(client.room, message, clientId);
  }

  function broadcastToRoom(
    room: string,
    message: StreamChatMessage,
    excludeClientId?: string
  ) {
    const roomClients = rooms.get(room);
    if (!roomClients) return;

    roomClients.forEach((clientId) => {
      if (clientId !== excludeClientId) {
        sendToClient(clientId, message);
      }
    });
  }

  function sendToClient(clientId: string, message: StreamChatMessage) {
    const client = clients.get(clientId);
    if (client?.socket) {
      // Using streaming approach with @sergdudko/objectstream
      const messageBuffer = Buffer.from(JSON.stringify(message.toJSON()));
      client.socket.write(messageBuffer);
    }
  }

  // Start server
  server.listen(PORT, () => {
    console.log(`✅ Streaming Chat Server is running on port ${PORT}`);
    console.log("📋 Available commands:");
    console.log("   /username <name> - Set your username");
    console.log("   /join <room>     - Join a room");
    console.log("   Just type to send public messages");
    console.log("🔄 Using @sergdudko/objectstream for efficient serialization");
  });

  // Graceful shutdown
  process.on("SIGINT", () => {
    console.log("\\n🛑 Shutting down server...");
    server.close(() => {
      console.log("✅ Server closed");
      process.exit(0);
    });
  });
}

// Start the server
startStreamingChatServer().catch(console.error);
