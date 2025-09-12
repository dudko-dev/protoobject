# Streaming Chat Example with @sergdudko/objectstream

This example demonstrates how to use ProtoObject library with `@sergdudko/objectstream` for efficient TCP communication with automatic serialization/deserialization.

## Features

- 🚀 **Streaming Serialization**: Uses `@sergdudko/objectstream` for efficient ProtoObject ↔ JSON ↔ Buffer conversion
- 🔄 **Bidirectional Communication**: Real-time chat with automatic object streaming
- 🏠 **Room Support**: Join different chat rooms
- 💬 **Private Messages**: Send direct messages to specific users
- 📝 **Command System**: Built-in commands for user interaction
- 🛡️ **Type Safety**: Full TypeScript support with ProtoObject validation

## Architecture

```
[ProtoObject] → [JSON] → [Buffer] → [Network] → [Buffer] → [JSON] → [ProtoObject]
     ↑                                                                      ↓
   Client                                                                Server
```

The streaming pipeline automatically handles:

1. **Serialization**: `ProtoObject.toJSON()` → `JSON.stringify()` → `Buffer`
2. **Network Transmission**: TCP socket communication
3. **Deserialization**: `Buffer` → `JSON.parse()` → `ProtoObject.fromJSON()`

## Quick Start

### 1. Install Dependencies

```bash
npm install @sergdudko/objectstream
```

### 2. Start the Server

```bash
npm run example:stream-chat:server
```

### 3. Start Client(s)

In separate terminals:

```bash
npm run example:stream-chat:client
```

## Usage

### Available Commands

- `/username <name>` - Set your username
- `/join <room>` - Join a chat room (default: "general")
- `/private <user> <message>` - Send a private message
- `/quit` - Exit the chat

### Example Chat Session

```
👤 Please enter your username: Alice
✅ Connected to streaming chat server!

[general] Alice: Hello everyone!
[general] System: Bob joined the chat
[general] Bob: Hi Alice!

Alice: /join dev
[dev] System: Alice joined dev

Alice: /private Bob Hello Bob, can you join the dev room?
[PRIVATE to Bob] Alice: Hello Bob, can you join the dev room?
```

## Code Structure

### StreamChatMessage Class

```typescript
class StreamChatMessage extends ProtoObjectTCP<StreamChatMessage> {
  public id?: string;
  public username?: string;
  public message?: string;
  public timestamp?: Date;
  public room?: string;
  public isPrivate?: boolean;
  public targetUser?: string;
}
```

### Streaming Server Setup

```typescript
// Create streaming server for efficient ProtoObject processing
const server = StreamChatMessage.createStreamingTCPServer(StreamChatMessage, PORT);

// Handle received objects through streaming
server.on("objectReceived", (message: StreamChatMessage, socket) => {
  console.log(`📨 Received: ${message.getFormattedMessage()}`);
  // Process message...
});
```

### Streaming Client Setup

```typescript
// Create streaming client
const client = StreamChatMessage.createStreamingTCPClient(StreamChatMessage, HOST, PORT);

// Handle received messages through streaming
client.on("objectReceived", (message: StreamChatMessage) => {
  console.log(message.getFormattedMessage());
});
```

## Benefits of @sergdudko/objectstream Integration

### 1. **Performance**

- Efficient streaming serialization without blocking
- Automatic buffering and parsing
- Minimal memory overhead

### 2. **Reliability**

- Built-in error handling
- Stream backpressure management
- Graceful connection handling

### 3. **Developer Experience**

- Automatic type conversion
- No manual Buffer/JSON handling
- Clean, readable code

### 4. **Scalability**

- Handles multiple concurrent connections
- Non-blocking I/O operations
- Memory-efficient processing

## Comparison: Traditional vs Streaming Approach

### Traditional Approach

```typescript
// Manual serialization
const jsonString = JSON.stringify(message.toJSON());
const buffer = Buffer.from(jsonString);
socket.write(buffer);

// Manual deserialization
socket.on('data', (buffer) => {
  const jsonString = buffer.toString();
  const data = JSON.parse(jsonString);
  const message = StreamChatMessage.fromJSON(data);
});
```

### Streaming Approach with @sergdudko/objectstream

```typescript
// Automatic bidirectional streaming
const pipeline = ProtoObjectStream.createSerializationPipeline(StreamChatMessage);
socket.pipe(pipeline.deserialize).pipe(pipeline.serialize).pipe(socket);

// Just handle the objects
stream.on('data', (message: StreamChatMessage) => {
  // message is already a proper ProtoObject instance
});
```

## Advanced Features

### Custom Message Types

```typescript
// Public message
const publicMsg = StreamChatMessage.createPublicMessage("Alice", "Hello!", "general");

// Private message
const privateMsg = StreamChatMessage.createPrivateMessage("Alice", "Secret!", "Bob");

// Check message type
if (message.isPrivateMessage()) {
  // Handle private logic
}
```

### Room Management

```typescript
// Join room
const joinMsg = new StreamChatMessage({
  message: "/join developers",
  username: "Alice"
});

// Broadcast to room
broadcastToRoom("developers", message, excludeClientId);
```

### Message Formatting

```typescript
// Get formatted display
const formatted = message.getFormattedMessage();
// Output: "14:30:25 [general] Alice: Hello everyone!"

// Private message format
// Output: "14:30:25 [PRIVATE to Bob] Alice: Secret message"
```

## Testing

Run the streaming chat example:

```bash
# Terminal 1 - Start server
npm run example:stream-chat:server

# Terminal 2 - Start client 1
npm run example:stream-chat:client

# Terminal 3 - Start client 2  
npm run example:stream-chat:client
```

Try different scenarios:

- Multiple users in same room
- Private messaging
- Room switching
- Connection handling

## Next Steps

This example demonstrates the foundation for building:

- 🌐 **Real-time Applications**: Games, collaborative tools
- 🔄 **Microservices**: Service-to-service communication
- 📊 **Data Streaming**: Analytics, monitoring systems
- 🤖 **IoT Networks**: Device communication protocols
- 🔒 **Secure Channels**: Encrypted data transmission

The streaming approach with ProtoObject + `@sergdudko/objectstream` provides a robust foundation for any real-time communication needs.
