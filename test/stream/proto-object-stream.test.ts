import { describe, it } from "node:test";
import { ok, equal } from "node:assert";
import { Transform } from "node:stream";
import { ProtoObjectStream } from "../../src/classes/proto-object-stream.js";
import { ProtoObject } from "../../src/classes/proto-object.js";
import { StaticImplements } from "../../src/decorators/static-implements.js";
import type { ProtoObjectStaticMethods } from "../../src/types/static-methods.js";

// Test class for streaming
@StaticImplements<ProtoObjectStaticMethods<TestStreamObject>>()
class TestStreamObject extends ProtoObject<TestStreamObject> {
  constructor(data?: Partial<TestStreamObject>) {
    super(data);
    if (data) this.assign(data);
  }

  public toJSON(): { [key: string]: any } {
    const result: { [key: string]: any } = {};

    if (this.id !== undefined) result.id = this.id;
    if (this.name !== undefined) result.name = this.name;
    if (this.value !== undefined) result.value = this.value;
    if (this.active !== undefined) result.active = this.active;

    return result;
  }

  public static fromJSON<T>(data: { [key: string]: unknown }): T {
    return new TestStreamObject({
      id: typeof data.id === "string" ? data.id : undefined,
      name: typeof data.name === "string" ? data.name : undefined,
      value: typeof data.value === "number" ? data.value : undefined,
      active: typeof data.active === "boolean" ? data.active : undefined,
    }) as T;
  }
}

describe("ProtoObjectStream with @sergdudko/objectstream", function () {
  it("should create object to buffer stream", async () => {
    const stream = ProtoObjectStream.createObjectToBufferStream();

    ok(stream instanceof Transform);
    equal((stream as any)._readableState.objectMode, true);
  });

  it("should create buffer to object stream", async () => {
    const stream =
      ProtoObjectStream.createBufferToObjectStream(TestStreamObject);

    ok(stream instanceof Transform);
    equal((stream as any)._readableState.objectMode, true);
  });

  it("should create serialization pipeline", async () => {
    const pipeline =
      ProtoObjectStream.createSerializationPipeline(TestStreamObject);

    ok(pipeline.serialize instanceof Transform);
    ok(pipeline.deserialize instanceof Transform);
  });

  it("should create bidirectional stream", async () => {
    const stream =
      ProtoObjectStream.createBidirectionalStream(TestStreamObject);

    ok(stream instanceof Transform);
    equal((stream as any)._readableState.objectMode, true);
  });

  it("should handle streaming serialization pipeline", async () => {
    return new Promise<void>((resolve, reject) => {
      const pipeline =
        ProtoObjectStream.createSerializationPipeline(TestStreamObject);

      const testObject = new TestStreamObject({
        id: "test-123",
        name: "Test Object",
        value: 42,
        active: true,
      });

      let serializedData: Buffer | null = null;
      let deserializedObject: TestStreamObject | null = null;

      // Setup serialization
      pipeline.serialize.on("data", (buffer: Buffer) => {
        serializedData = buffer;

        // Now deserialize
        pipeline.deserialize.write(buffer);
      });

      // Setup deserialization
      pipeline.deserialize.on("data", (obj: TestStreamObject) => {
        deserializedObject = obj;

        try {
          // Verify the round-trip
          ok(serializedData instanceof Buffer);
          ok(deserializedObject instanceof TestStreamObject);
          equal(deserializedObject.id, testObject.id);
          equal(deserializedObject.name, testObject.name);
          equal(deserializedObject.value, testObject.value);
          equal(deserializedObject.active, testObject.active);

          resolve();
        } catch (error) {
          reject(error);
        }
      });

      pipeline.serialize.on("error", reject);
      pipeline.deserialize.on("error", reject);

      // Start the test
      pipeline.serialize.write(testObject);
    });
  });

  it("should handle bidirectional streaming", async () => {
    return new Promise<void>((resolve, reject) => {
      const stream =
        ProtoObjectStream.createBidirectionalStream(TestStreamObject);

      const testObject = new TestStreamObject({
        id: "bidirectional-test",
        name: "Bidirectional Test",
        value: 100,
        active: false,
      });

      let receivedObject: TestStreamObject | null = null;

      stream.on("data", (result: TestStreamObject | Buffer) => {
        if (result instanceof TestStreamObject) {
          receivedObject = result;

          try {
            equal(receivedObject.id, testObject.id);
            equal(receivedObject.name, testObject.name);
            equal(receivedObject.value, testObject.value);
            equal(receivedObject.active, testObject.active);

            resolve();
          } catch (error) {
            reject(error);
          }
        } else if (result instanceof Buffer) {
          // If we receive a buffer, write it back to deserialize
          stream.write(result);
        }
      });

      stream.on("error", reject);

      // Write the object to trigger serialization
      stream.write(testObject);
    });
  });

  it("should handle multiple objects in sequence", async () => {
    return new Promise<void>((resolve, reject) => {
      const pipeline =
        ProtoObjectStream.createSerializationPipeline(TestStreamObject);

      const testObjects = [
        new TestStreamObject({ id: "1", name: "First", value: 1 }),
        new TestStreamObject({ id: "2", name: "Second", value: 2 }),
        new TestStreamObject({ id: "3", name: "Third", value: 3 }),
      ];

      const deserializedObjects: TestStreamObject[] = [];

      pipeline.deserialize.on("data", (obj: TestStreamObject) => {
        deserializedObjects.push(obj);

        if (deserializedObjects.length === testObjects.length) {
          try {
            equal(deserializedObjects.length, testObjects.length);

            testObjects.forEach((original, index) => {
              const deserialized = deserializedObjects[index];
              equal(deserialized.id, original.id);
              equal(deserialized.name, original.name);
              equal(deserialized.value, original.value);
            });

            resolve();
          } catch (error) {
            reject(error);
          }
        }
      });

      pipeline.serialize.on("data", (buffer: Buffer) => {
        pipeline.deserialize.write(buffer);
      });

      pipeline.serialize.on("error", reject);
      pipeline.deserialize.on("error", reject);

      // Send all objects
      testObjects.forEach((obj) => {
        pipeline.serialize.write(obj);
      });
    });
  });

  it("should handle undefined and null values correctly", async () => {
    return new Promise<void>((resolve, reject) => {
      const pipeline =
        ProtoObjectStream.createSerializationPipeline(TestStreamObject);

      const testObject = new TestStreamObject({
        id: "partial-test",
        name: undefined, // undefined should not be serialized
        value: 0, // zero should be serialized
        active: undefined, // undefined should not be serialized
      });

      pipeline.deserialize.on("data", (obj: TestStreamObject) => {
        try {
          equal(obj.id, "partial-test");
          equal(obj.name, undefined);
          equal(obj.value, 0);
          equal(obj.active, undefined);

          // Verify JSON doesn't contain undefined fields
          const json = obj.toJSON();
          ok("id" in json);
          ok(!("name" in json));
          ok("value" in json);
          ok(!("active" in json));

          resolve();
        } catch (error) {
          reject(error);
        }
      });

      pipeline.serialize.on("data", (buffer: Buffer) => {
        pipeline.deserialize.write(buffer);
      });

      pipeline.serialize.on("error", reject);
      pipeline.deserialize.on("error", reject);

      pipeline.serialize.write(testObject);
    });
  });
});
