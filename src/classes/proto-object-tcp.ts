import { createServer, createConnection, Server, Socket } from "node:net";
import { EventEmitter } from "node:events";
import { ProtoObject } from "./proto-object.js";
import { StaticImplements } from "../decorators/static-implements.js";
import type { ProtoObjectDynamicMethods } from "../types/dynamic-methods.js";

/* eslint-disable no-unused-vars */
/**
 * Message types for TCP communication
 */
export enum MessageType {
  REQUEST = "REQUEST",
  RESPONSE = "RESPONSE",
  NOTIFICATION = "NOTIFICATION",
  ERROR = "ERROR",
}

/**
 * TCP Message wrapper
 */
export interface TCPMessage<T = any> {
  id: string;
  type: MessageType;
  timestamp: number;
  data: T;
}

/**
 * Static methods interface for TCP ProtoObject classes
 */
export interface ProtoObjectTCPStaticMethods<
  T extends ProtoObjectDynamicMethods<T>,
> {
  new (data?: Partial<T>): T;
  fromJSON<U extends ProtoObjectDynamicMethods<U>>(data: {
    [key: string]: unknown;
  }): U;
}
/* eslint-enable no-unused-vars */

/**
 * TCP Server for ProtoObject communication
 */
export class ProtoObjectTCPServer extends EventEmitter {
  private server: Server;
  private clients: Map<string, Socket> = new Map();

  /* eslint-disable no-unused-vars */
  constructor(private port: number = 3000) {
    super();
    this.server = createServer();
    this.setupServer();
  }
  /* eslint-enable no-unused-vars */

  private setupServer(): void {
    this.server.on("connection", (socket: Socket) => {
      const clientId = `${socket.remoteAddress}:${socket.remotePort}`;
      this.clients.set(clientId, socket);

      console.log(`Client connected: ${clientId}`);
      this.emit("clientConnected", clientId, socket);

      socket.on("data", (buffer: Buffer) => {
        try {
          const messages = this.parseMessages(buffer);
          messages.forEach((message) => {
            this.emit("message", clientId, message);
          });
        } catch (error) {
          this.emit("error", error);
        }
      });

      socket.on("close", () => {
        this.clients.delete(clientId);
        console.log(`Client disconnected: ${clientId}`);
        this.emit("clientDisconnected", clientId);
      });

      socket.on("error", (error) => {
        this.emit("error", error);
      });
    });
  }

  private parseMessages(buffer: Buffer): TCPMessage[] {
    const messages: TCPMessage[] = [];
    let offset = 0;

    while (offset < buffer.length) {
      // Read message length (4 bytes)
      if (offset + 4 > buffer.length) break;
      const messageLength = buffer.readUInt32BE(offset);
      offset += 4;

      // Read message data
      if (offset + messageLength > buffer.length) break;
      const messageData = buffer.subarray(offset, offset + messageLength);
      offset += messageLength;

      try {
        const message: TCPMessage = JSON.parse(messageData.toString());
        messages.push(message);
      } catch (error) {
        console.error("Error parsing message:", error);
      }
    }

    return messages;
  }

  public start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.listen(this.port, (error?: Error) => {
        if (error) {
          reject(error);
        } else {
          console.log(`TCP Server listening on port ${this.port}`);
          resolve();
        }
      });
    });
  }

  public stop(): Promise<void> {
    return new Promise((resolve) => {
      this.server.close(() => {
        console.log("TCP Server stopped");
        resolve();
      });
    });
  }

  public sendToClient<T extends ProtoObject<T>>(
    clientId: string,
    object: T,
    type: MessageType = MessageType.NOTIFICATION
  ): boolean {
    const socket = this.clients.get(clientId);
    if (!socket) return false;

    const message: TCPMessage<any> = {
      id: this.generateId(),
      type,
      timestamp: Date.now(),
      data: object.toJSON(),
    };

    return this.sendMessage(socket, message);
  }

  public broadcast<T extends ProtoObject<T>>(
    object: T,
    type: MessageType = MessageType.NOTIFICATION
  ): void {
    const message: TCPMessage<any> = {
      id: this.generateId(),
      type,
      timestamp: Date.now(),
      data: object.toJSON(),
    };

    this.clients.forEach((socket) => {
      this.sendMessage(socket, message);
    });
  }

  private sendMessage(socket: Socket, message: TCPMessage): boolean {
    try {
      const messageData = Buffer.from(JSON.stringify(message));
      const lengthBuffer = Buffer.allocUnsafe(4);
      lengthBuffer.writeUInt32BE(messageData.length, 0);

      socket.write(Buffer.concat([lengthBuffer, messageData]));
      return true;
    } catch (error) {
      console.error("Error sending message:", error);
      return false;
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  public getConnectedClients(): string[] {
    return Array.from(this.clients.keys());
  }
}

/**
 * TCP Client for ProtoObject communication
 */
export class ProtoObjectTCPClient extends EventEmitter {
  private socket: Socket | null = null;
  private messageBuffer: Buffer = Buffer.alloc(0);

  /* eslint-disable no-unused-vars */
  constructor(
    private host: string = "localhost",
    private port: number = 3000
  ) {
    super();
  }
  /* eslint-enable no-unused-vars */

  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = createConnection(this.port, this.host);

      this.socket.on("connect", () => {
        console.log(`Connected to server ${this.host}:${this.port}`);
        this.emit("connected");
        resolve();
      });

      this.socket.on("data", (buffer: Buffer) => {
        this.messageBuffer = Buffer.concat([this.messageBuffer, buffer]);
        this.processMessages();
      });

      this.socket.on("close", () => {
        console.log("Disconnected from server");
        this.emit("disconnected");
      });

      this.socket.on("error", (error) => {
        this.emit("error", error);
        reject(error);
      });
    });
  }

  private processMessages(): void {
    let offset = 0;

    while (offset + 4 <= this.messageBuffer.length) {
      const messageLength = this.messageBuffer.readUInt32BE(offset);

      if (offset + 4 + messageLength > this.messageBuffer.length) {
        break; // Wait for more data
      }

      const messageData = this.messageBuffer.subarray(
        offset + 4,
        offset + 4 + messageLength
      );

      try {
        const message: TCPMessage = JSON.parse(messageData.toString());
        this.emit("message", message);
      } catch (error) {
        console.error("Error parsing message:", error);
      }

      offset += 4 + messageLength;
    }

    this.messageBuffer = this.messageBuffer.subarray(offset);
  }

  public send<T extends ProtoObject<T>>(
    object: T,
    type: MessageType = MessageType.REQUEST
  ): boolean {
    if (!this.socket) return false;

    const message: TCPMessage<any> = {
      id: this.generateId(),
      type,
      timestamp: Date.now(),
      data: object.toJSON(),
    };

    try {
      const messageData = Buffer.from(JSON.stringify(message));
      const lengthBuffer = Buffer.allocUnsafe(4);
      lengthBuffer.writeUInt32BE(messageData.length, 0);

      this.socket.write(Buffer.concat([lengthBuffer, messageData]));
      return true;
    } catch (error) {
      console.error("Error sending message:", error);
      return false;
    }
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.end();
      this.socket = null;
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}

/**
 * Base class for TCP-enabled ProtoObjects
 */
@StaticImplements<ProtoObjectTCPStaticMethods<any>>()
export class ProtoObjectTCP<
  T extends ProtoObjectDynamicMethods<T>,
> extends ProtoObject<T> {
  constructor(data?: Partial<T>) {
    super(data);
  }

  /**
   * Send this object through TCP client
   */
  public sendTCP(
    client: ProtoObjectTCPClient,
    type: MessageType = MessageType.REQUEST
  ): boolean {
    return client.send(this as any, type);
  }

  /**
   * Broadcast this object through TCP server
   */
  public broadcastTCP(
    server: ProtoObjectTCPServer,
    type: MessageType = MessageType.NOTIFICATION
  ): void {
    server.broadcast(this as any, type);
  }

  /**
   * Send this object to specific client through TCP server
   */
  public sendToClientTCP(
    server: ProtoObjectTCPServer,
    clientId: string,
    type: MessageType = MessageType.RESPONSE
  ): boolean {
    return server.sendToClient(clientId, this as any, type);
  }

  /**
   * Create object from TCP message
   */
  public static fromTCPMessage<U extends ProtoObjectDynamicMethods<U>>(
    message: TCPMessage
  ): U {
    return this.fromJSON<U>(message.data);
  }
}
