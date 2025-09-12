import { ProtoObjectTCP } from "../../src/classes/proto-object-tcp.js";
import { StaticImplements } from "../../src/decorators/static-implements.js";
import type { ProtoObjectDynamicMethods } from "../../src/types/dynamic-methods.js";

/**
 * Streaming Chat Message using @sergdudko/objectstream for efficient serialization
 */
@StaticImplements<ProtoObjectDynamicMethods<StreamChatMessage>>()
export class StreamChatMessage extends ProtoObjectTCP<StreamChatMessage> {
  public id?: string;
  public username?: string;
  public message?: string;
  public timestamp?: Date;
  public room?: string;
  public isPrivate?: boolean;
  public targetUser?: string;

  constructor(data?: Partial<StreamChatMessage>) {
    super(data);
    if (data) this.assign(data);
  }

  public toJSON(): { [key: string]: any } {
    const result: { [key: string]: any } = {};

    if (this.id !== undefined) result.id = this.id;
    if (this.username !== undefined) result.username = this.username;
    if (this.message !== undefined) result.message = this.message;
    if (this.timestamp !== undefined)
      result.timestamp = this.timestamp.toISOString();
    if (this.room !== undefined) result.room = this.room;
    if (this.isPrivate !== undefined) result.isPrivate = this.isPrivate;
    if (this.targetUser !== undefined) result.targetUser = this.targetUser;

    return result;
  }

  public static fromJSON<T>(data: { [key: string]: unknown }): T {
    return new StreamChatMessage({
      id: typeof data.id === "string" ? data.id : undefined,
      username: typeof data.username === "string" ? data.username : undefined,
      message: typeof data.message === "string" ? data.message : undefined,
      timestamp:
        typeof data.timestamp === "string"
          ? new Date(data.timestamp)
          : undefined,
      room: typeof data.room === "string" ? data.room : undefined,
      isPrivate:
        typeof data.isPrivate === "boolean" ? data.isPrivate : undefined,
      targetUser:
        typeof data.targetUser === "string" ? data.targetUser : undefined,
    }) as T;
  }

  /**
   * Create a public message
   */
  public static createPublicMessage(
    username: string,
    message: string,
    room: string = "general"
  ): StreamChatMessage {
    return new StreamChatMessage({
      id: crypto.randomUUID(),
      username,
      message,
      timestamp: new Date(),
      room,
      isPrivate: false,
    });
  }

  /**
   * Create a private message
   */
  public static createPrivateMessage(
    username: string,
    message: string,
    targetUser: string
  ): StreamChatMessage {
    return new StreamChatMessage({
      id: crypto.randomUUID(),
      username,
      message,
      timestamp: new Date(),
      isPrivate: true,
      targetUser,
    });
  }

  /**
   * Check if this is a private message
   */
  public isPrivateMessage(): boolean {
    return this.isPrivate === true && !!this.targetUser;
  }

  /**
   * Get formatted message for display
   */
  public getFormattedMessage(): string {
    const timeStr = this.timestamp?.toLocaleTimeString() || "";
    const prefix = this.isPrivateMessage()
      ? `[PRIVATE to ${this.targetUser}]`
      : `[${this.room}]`;
    return `${timeStr} ${prefix} ${this.username}: ${this.message}`;
  }
}
