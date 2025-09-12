/**
 * ProtoObjectStream - Streaming utilities for ProtoObject using @sergdudko/objectstream
 * @description Provides methods for efficient streaming serialization and deserialization
 * @author Siarhei Dudko <siarhei@dudko.dev>
 */

/* eslint-disable no-unused-vars */
import { Transform } from "node:stream";
import { Stringifer, Parser } from "@sergdudko/objectstream";

/**
 * Utility class for streaming ProtoObject serialization using @sergdudko/objectstream
 */
export class ProtoObjectStream {
  /**
   * Create a transform stream that converts ProtoObject instances to Buffer
   * @returns Transform stream for object-to-buffer conversion
   */
  public static createObjectToBufferStream(): Transform {
    return new Transform({
      objectMode: true,
      transform(
        chunk: any,
        _encoding: string,
        callback: (_error?: Error | null, _data?: any) => void
      ) {
        try {
          // Convert ProtoObject to plain object if it has toJSON method
          const plainObject =
            chunk && typeof chunk.toJSON === "function"
              ? chunk.toJSON()
              : chunk;

          const stringifer = new Stringifer();
          let result = "";

          stringifer.on("data", (data: Buffer) => {
            result += data.toString();
          });

          stringifer.on("end", () => {
            callback(null, Buffer.from(result));
          });

          stringifer.on("error", (error: Error) => {
            callback(error);
          });

          stringifer.write(plainObject);
          stringifer.end();
        } catch (error) {
          callback(error instanceof Error ? error : new Error(String(error)));
        }
      },
    });
  }

  /**
   * Create a transform stream that converts Buffer to ProtoObject instances
   * @param objectClass - The ProtoObject class constructor
   * @returns Transform stream for buffer-to-object conversion
   */
  static createBufferToObjectStream<T>(
    objectClass: new (data?: any) => T
  ): Transform {
    return new Transform({
      objectMode: true,
      transform(
        chunk: Buffer,
        encoding: string,
        callback: (error?: Error | null, data?: any) => void
      ) {
        try {
          const parser = new Parser();

          parser.on("data", (obj: any) => {
            // Convert plain object back to ProtoObject instance if fromJSON exists
            const result =
              objectClass && typeof (objectClass as any).fromJSON === "function"
                ? (objectClass as any).fromJSON(obj)
                : new objectClass(obj);
            callback(null, result);
          });

          parser.on("error", (error: Error) => {
            callback(error);
          });

          parser.write(chunk);
          parser.end();
        } catch (error) {
          callback(error instanceof Error ? error : new Error(String(error)));
        }
      },
    });
  }

  /**
   * Create a complete serialization pipeline
   * @param objectClass - The ProtoObject class constructor
   * @returns Object with serialize and deserialize transforms
   */
  static createSerializationPipeline<T>(objectClass: new (data?: any) => T) {
    return {
      serialize: this.createObjectToBufferStream(),
      deserialize: this.createBufferToObjectStream<T>(objectClass),
    };
  }

  /**
   * Create a bidirectional stream for two-way communication
   * @param objectClass - The ProtoObject class constructor
   * @returns Transform stream for bidirectional communication
   */
  static createBidirectionalStream<T>(
    objectClass: new (data?: any) => T
  ): Transform {
    return new Transform({
      objectMode: true,
      transform(
        chunk: any,
        encoding: string,
        callback: (error?: Error | null, data?: any) => void
      ) {
        try {
          if (Buffer.isBuffer(chunk)) {
            // Buffer to object - deserialize
            const parser = new Parser();

            parser.on("data", (obj: any) => {
              const result =
                objectClass &&
                typeof (objectClass as any).fromJSON === "function"
                  ? (objectClass as any).fromJSON(obj)
                  : new objectClass(obj);
              callback(null, result);
            });

            parser.on("error", (error: Error) => {
              callback(error);
            });

            parser.write(chunk);
            parser.end();
          } else if (
            chunk &&
            typeof chunk.toJSON === "function" &&
            !Buffer.isBuffer(chunk)
          ) {
            // Object to buffer - serialize (but not if it's already a Buffer)
            const plainObject = chunk.toJSON();
            const stringifer = new Stringifer();
            let result = "";

            stringifer.on("data", (data: Buffer) => {
              result += data.toString();
            });

            stringifer.on("end", () => {
              callback(null, Buffer.from(result));
            });

            stringifer.on("error", (error: Error) => {
              callback(error);
            });

            stringifer.write(plainObject);
            stringifer.end();
          } else {
            // Pass through
            callback(null, chunk);
          }
        } catch (error) {
          callback(error instanceof Error ? error : new Error(String(error)));
        }
      },
    });
  }
}
