import { describe, it, after } from "node:test";
import { equal, ok } from "node:assert";
import {
  ProtoObjectTCP,
  MessageType,
  ProtoObjectTCPServer,
  ProtoObjectTCPClient,
  StaticImplements,
  type ProtoObjectTCPStaticMethods,
  type TCPMessage,
} from "../../src";

// Test entity class
@StaticImplements<ProtoObjectTCPStaticMethods<TestMessage>>()
class TestMessage extends ProtoObjectTCP<TestMessage> {
  constructor(data?: Partial<TestMessage>) {
    super(data);
    return this;
  }
}

describe("ProtoObjectTCP Tests", () => {
  const servers: ProtoObjectTCPServer[] = [];
  const clients: ProtoObjectTCPClient[] = [];

  after(async () => {
    // Close all clients first
    for (const client of clients) {
      try {
        client.disconnect();
      } catch {}
    }

    // Close all servers with timeout
    for (const server of servers) {
      try {
        await Promise.race([
          server.stop(),
          new Promise((resolve) => setTimeout(resolve, 1000)),
        ]);
      } catch {}
    }

    // Give extra time for cleanup
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  it("should create and deserialize TCP messages", () => {
    const originalMessage = new TestMessage();
    (originalMessage as any).name = "Test Message";
    (originalMessage as any).data = "Hello World";

    // Create a mock TCP message structure
    const tcpMessage: TCPMessage = {
      id: "test-123",
      type: MessageType.REQUEST,
      timestamp: Date.now(),
      data: originalMessage.toJSON(),
    };

    const deserializedMessage = TestMessage.fromTCPMessage(tcpMessage);

    ok(deserializedMessage);
    equal((deserializedMessage as any).name, "Test Message");
    equal((deserializedMessage as any).data, "Hello World");
  });

  it("should create and start TCP server", async () => {
    const port = 0; // Let OS choose available port
    const server = new ProtoObjectTCPServer(port);
    servers.push(server);

    // Start server with timeout
    await Promise.race([
      server.start(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Server start timeout")), 2000)
      ),
    ]);

    // Verify server exists and can get connected clients
    const connectedClients = server.getConnectedClients();
    ok(Array.isArray(connectedClients));
    equal(connectedClients.length, 0); // No clients connected yet
  });

  it("should create TCP client", () => {
    const client = new ProtoObjectTCPClient("localhost", 0); // Use port 0 (won't connect)
    clients.push(client);

    // Verify client was created
    ok(client);
  });

  it("should handle message creation", () => {
    const client = new ProtoObjectTCPClient("localhost", 0);
    clients.push(client);

    // Create test message
    const testMessage = new TestMessage();
    (testMessage as any).name = "Test";
    (testMessage as any).data = "Hello Server";

    // Verify message was created properly
    ok(testMessage);
    equal((testMessage as any).name, "Test");
    equal((testMessage as any).data, "Hello Server");
  });

  it("should handle broadcasting without connected clients", async () => {
    const port = 0; // Let OS choose available port
    const server = new ProtoObjectTCPServer(port);
    servers.push(server);

    await Promise.race([
      server.start(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Server start timeout")), 2000)
      ),
    ]);

    // Create test message
    const testMessage = new TestMessage();
    (testMessage as any).name = "Broadcast";
    (testMessage as any).data = "Hello Everyone";

    // Test broadcast method (should not throw even with no clients)
    try {
      testMessage.broadcastTCP(server, MessageType.NOTIFICATION);
      ok(true); // If we get here, broadcast method exists and works
    } catch (error) {
      ok(false, `Broadcast should not throw: ${error}`);
    }
  });
});
