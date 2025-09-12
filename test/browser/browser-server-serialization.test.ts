/**
 * Browser-Server serialization compatibility test
 * This test verifies that objects serialized in browser can be deserialized on server and vice versa
 */

import { describe, it } from "node:test";
import { equal, ok, deepEqual } from "node:assert";

describe("Browser-Server Serialization Compatibility Tests", () => {
  // Simulate browser ProtoObject pattern (no Node.js imports)
  class BrowserProtoObject {
    [key: string]: any;

    constructor(data: Record<string, any> = {}) {
      Object.assign(this, data);
      return this;
    }

    toJSON() {
      const result: Record<string, any> = {};
      for (const key in this) {
        if (this.hasOwnProperty(key) && typeof this[key] !== "function") {
          result[key] = this[key];
        }
      }
      return result;
    }

    static fromJSON(data: Record<string, any>) {
      return new this(data);
    }
  }

  // Simulate server ProtoObject (with potential Node.js features)
  class ServerProtoObject {
    [key: string]: any;

    constructor(data: Record<string, any> = {}) {
      Object.assign(this, data);
      return this;
    }

    toJSON() {
      const result: Record<string, any> = {};
      for (const key in this) {
        if (this.hasOwnProperty(key) && typeof this[key] !== "function") {
          // Handle special Node.js types if needed
          if (this[key] instanceof Date) {
            result[key] = this[key].toISOString();
          } else if (Buffer.isBuffer && Buffer.isBuffer(this[key])) {
            result[key] = this[key].toString("base64");
          } else {
            result[key] = this[key];
          }
        }
      }
      return result;
    }

    static fromJSON(data: Record<string, any>) {
      const instance = new this();
      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          // Handle special type restoration
          if (typeof data[key] === "string" && key.endsWith("_date")) {
            instance[key] = new Date(data[key]);
          } else {
            instance[key] = data[key];
          }
        }
      }
      return instance;
    }
  }

  it("should serialize object in browser format and deserialize on server", () => {
    // Simulate browser creating object
    const browserObject = new BrowserProtoObject({
      id: 1,
      name: "User from Browser",
      email: "user@browser.com",
      preferences: {
        theme: "dark",
        language: "en",
      },
      tags: ["browser", "user"],
      created_at: "2024-12-01T10:00:00.000Z",
      active: true,
    });

    // Browser serializes to JSON string
    const browserJSON = JSON.stringify(browserObject.toJSON());

    // Simulate sending to server via HTTP
    const receivedOnServer = JSON.parse(browserJSON);

    // Server deserializes from received data
    const serverObject = ServerProtoObject.fromJSON(receivedOnServer);

    // Verify data integrity
    equal(serverObject.id, 1);
    equal(serverObject.name, "User from Browser");
    equal(serverObject.email, "user@browser.com");
    deepEqual(serverObject.preferences, { theme: "dark", language: "en" });
    deepEqual(serverObject.tags, ["browser", "user"]);
    equal(serverObject.created_at, "2024-12-01T10:00:00.000Z");
    equal(serverObject.active, true);
  });

  it("should serialize object on server and deserialize in browser format", () => {
    // Simulate server creating object with special types
    const serverObject = new ServerProtoObject({
      id: 2,
      name: "User from Server",
      email: "user@server.com",
      created_date: new Date("2024-12-01T10:00:00.000Z"),
      updated_at: "2024-12-01T15:30:00.000Z",
      metadata: {
        ip: "192.168.1.1",
        userAgent: "Mozilla/5.0...",
      },
      permissions: ["read", "write"],
    });

    // Server serializes to JSON string
    const serverJSON = JSON.stringify(serverObject.toJSON());

    // Simulate sending to browser via HTTP
    const receivedInBrowser = JSON.parse(serverJSON);

    // Browser deserializes from received data
    const browserObject = BrowserProtoObject.fromJSON(receivedInBrowser);

    // Verify data integrity
    equal(browserObject.id, 2);
    equal(browserObject.name, "User from Server");
    equal(browserObject.email, "user@server.com");
    equal(browserObject.created_date, "2024-12-01T10:00:00.000Z");
    equal(browserObject.updated_at, "2024-12-01T15:30:00.000Z");
    deepEqual(browserObject.metadata, {
      ip: "192.168.1.1",
      userAgent: "Mozilla/5.0...",
    });
    deepEqual(browserObject.permissions, ["read", "write"]);
  });

  it("should handle complex nested objects between browser and server", () => {
    // Complex object with deep nesting
    const complexData = {
      user: {
        id: 123,
        profile: {
          name: "John Doe",
          contacts: {
            email: "john@example.com",
            phone: "+1234567890",
          },
          preferences: {
            notifications: {
              email: true,
              push: false,
              sms: true,
            },
            privacy: {
              publicProfile: false,
              shareData: true,
            },
          },
        },
        history: [
          { action: "login", timestamp: "2024-12-01T10:00:00.000Z" },
          { action: "update_profile", timestamp: "2024-12-01T10:15:00.000Z" },
          { action: "logout", timestamp: "2024-12-01T11:00:00.000Z" },
        ],
      },
      session: {
        id: "sess_123456",
        expires: "2024-12-02T10:00:00.000Z",
        permissions: ["read", "write", "delete"],
      },
    };

    // Browser -> Server
    const browserObj = new BrowserProtoObject(complexData);
    const browserSerialized = JSON.stringify(browserObj.toJSON());
    const serverReceived = JSON.parse(browserSerialized);
    const serverObj = ServerProtoObject.fromJSON(serverReceived);

    // Server -> Browser
    const serverSerialized = JSON.stringify(serverObj.toJSON());
    const browserReceived = JSON.parse(serverSerialized);
    const browserRestored = BrowserProtoObject.fromJSON(browserReceived);

    // Verify complex nested structure preservation
    equal(browserRestored.user.id, 123);
    equal(browserRestored.user.profile.name, "John Doe");
    equal(browserRestored.user.profile.contacts.email, "john@example.com");
    equal(browserRestored.user.profile.preferences.notifications.email, true);
    equal(
      browserRestored.user.profile.preferences.privacy.publicProfile,
      false
    );
    equal(browserRestored.user.history.length, 3);
    equal(browserRestored.user.history[0].action, "login");
    equal(browserRestored.session.id, "sess_123456");
    deepEqual(browserRestored.session.permissions, ["read", "write", "delete"]);
  });

  it("should handle edge cases in browser-server communication", () => {
    const edgeCaseData = {
      // Primitive types
      string: "test string",
      number: 42,
      boolean: true,
      null_value: null,
      undefined_value: undefined,

      // Arrays
      empty_array: [],
      number_array: [1, 2, 3],
      mixed_array: [1, "two", true, null],

      // Objects
      empty_object: {},
      nested_object: { a: { b: { c: "deep" } } },

      // Special strings
      json_string: '{"embedded": "json"}',
      date_string: "2024-12-01T10:00:00.000Z",
      unicode_string: "Hello 世界 🌍",

      // Numbers
      zero: 0,
      negative: -42,
      float: 3.14159,

      // Edge cases
      very_long_string: "x".repeat(1000),
      special_chars: "!@#$%^&*()[]{}|;:,.<>?",
    };

    // Test round-trip: Browser -> Server -> Browser
    const browserObj1 = new BrowserProtoObject(edgeCaseData);
    const serialized1 = JSON.stringify(browserObj1.toJSON());
    const serverObj = ServerProtoObject.fromJSON(JSON.parse(serialized1));
    const serialized2 = JSON.stringify(serverObj.toJSON());
    const browserObj2 = BrowserProtoObject.fromJSON(JSON.parse(serialized2));

    // Verify all edge cases preserved (except undefined which becomes null in JSON)
    equal(browserObj2.string, "test string");
    equal(browserObj2.number, 42);
    equal(browserObj2.boolean, true);
    equal(browserObj2.null_value, null);
    equal(browserObj2.undefined_value, undefined); // Should be undefined (not serialized)
    deepEqual(browserObj2.empty_array, []);
    deepEqual(browserObj2.number_array, [1, 2, 3]);
    deepEqual(browserObj2.mixed_array, [1, "two", true, null]);
    deepEqual(browserObj2.empty_object, {});
    equal(browserObj2.nested_object.a.b.c, "deep");
    equal(browserObj2.unicode_string, "Hello 世界 🌍");
    equal(browserObj2.zero, 0);
    equal(browserObj2.negative, -42);
    equal(browserObj2.float, 3.14159);
    equal(browserObj2.very_long_string.length, 1000);
    equal(browserObj2.special_chars, "!@#$%^&*()[]{}|;:,.<>?");
  });

  it("should maintain performance with large objects in browser-server communication", () => {
    // Generate large dataset
    const largeData = {
      users: [],
      metadata: {
        total: 1000,
        generated: new Date().toISOString(),
        version: "1.0.0",
      },
    };

    // Generate 1000 user objects
    for (let i = 0; i < 1000; i++) {
      (largeData.users as any[]).push({
        id: i,
        name: `User ${i}`,
        email: `user${i}@example.com`,
        active: i % 2 === 0,
        tags: [`tag${i % 10}`, `category${i % 5}`],
        profile: {
          created: `2024-${String((i % 12) + 1).padStart(2, "0")}-01T00:00:00.000Z`,
          settings: {
            theme: i % 2 === 0 ? "dark" : "light",
            notifications: i % 3 === 0,
          },
        },
      });
    }

    const startTime = Date.now();

    // Browser -> Server
    const browserObj = new BrowserProtoObject(largeData);
    const browserSerialized = JSON.stringify(browserObj.toJSON());

    // Server processing
    const serverReceived = JSON.parse(browserSerialized);
    const serverObj = ServerProtoObject.fromJSON(serverReceived);

    // Server -> Browser
    const serverSerialized = JSON.stringify(serverObj.toJSON());
    const browserReceived = JSON.parse(serverSerialized);
    const browserRestored = BrowserProtoObject.fromJSON(browserReceived);

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Verify data integrity
    equal(browserRestored.metadata.total, 1000);
    equal(browserRestored.users.length, 1000);
    equal(browserRestored.users[0].name, "User 0");
    equal(browserRestored.users[999].name, "User 999");
    equal(browserRestored.users[500].profile.settings.theme, "dark"); // 500 % 2 === 0, so theme is "dark"

    // Performance check (should complete within reasonable time)
    ok(
      duration < 5000,
      `Large object processing took ${duration}ms (should be < 5000ms)`
    );

    // Memory check (approximate)
    const serializedSize = browserSerialized.length;
    ok(serializedSize > 100000, `Serialized size: ${serializedSize} bytes`);
  });
});
