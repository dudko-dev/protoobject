import { describe, it, beforeEach } from "node:test";
import { deepEqual, equal, ok } from "node:assert";
import { ProtoObjectLocalStorage } from "../../src/utils/protoobject-localstorage";
import { protoObjectFactory } from "../../src/utils/protoobject-factory";

// Mock localStorage for Node.js testing environment
const createMockLocalStorage = () => {
  const store: { [key: string]: string } = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] || null,
    clear: () => {
      Object.keys(store).forEach((key) => delete store[key]);
    },
  };
};

// Mock window and localStorage
(globalThis as any).window = {
  localStorage: createMockLocalStorage(),
};

// Test User class using factory
const User = protoObjectFactory({
  fromJSON(data: { [key: string]: unknown }) {
    return new (this as any)({
      id: data.id as string,
      name: data.name as string,
      email: data.email as string,
      createdAt: data.createdAt
        ? new Date(data.createdAt as string)
        : undefined,
    });
  },
  toJSON() {
    return {
      id: (this as any).id,
      name: (this as any).name,
      email: (this as any).email,
      createdAt: (this as any).createdAt?.toJSON(),
    };
  },
});

describe("ProtoObjectLocalStorage", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    (globalThis as any).window.localStorage.clear();
  });

  describe("save and load", () => {
    it("should save and load ProtoObject instance", () => {
      const user = new User({
        id: "1",
        name: "John Doe",
        email: "john@example.com",
        createdAt: new Date("2023-01-01"),
      });

      // Save user
      const saveResult = ProtoObjectLocalStorage.save("user:1", user);
      ok(saveResult, "Save should return true");

      // Load user
      const loadedUser = ProtoObjectLocalStorage.load("user:1", User);
      ok(loadedUser, "Loaded user should exist");
      deepEqual(
        loadedUser.toJSON(),
        user.toJSON(),
        "Loaded user should match original"
      );
    });

    it("should return undefined for non-existent key", () => {
      const loadedUser = ProtoObjectLocalStorage.load("non-existent", User);
      equal(
        loadedUser,
        undefined,
        "Should return undefined for non-existent key"
      );
    });

    it("should handle complex objects with dates", () => {
      const testDate = new Date("2023-05-15T10:30:00Z");
      const user = new User({
        id: "2",
        name: "Jane Smith",
        email: "jane@example.com",
        createdAt: testDate,
      });

      ProtoObjectLocalStorage.save("user:2", user);
      const loaded = ProtoObjectLocalStorage.load("user:2", User);

      ok(loaded, "Loaded user should exist");
      equal(loaded.id, "2", "ID should match");
      equal(loaded.name, "Jane Smith", "Name should match");
      equal(loaded.email, "jane@example.com", "Email should match");
      deepEqual(loaded.createdAt, testDate, "Date should be properly restored");
    });
  });

  describe("remove and exists", () => {
    it("should remove items from localStorage", () => {
      const user = new User({ id: "3", name: "Bob", email: "bob@example.com" });

      ProtoObjectLocalStorage.save("user:3", user);
      ok(
        ProtoObjectLocalStorage.exists("user:3"),
        "User should exist after save"
      );

      const removeResult = ProtoObjectLocalStorage.remove("user:3");
      ok(removeResult, "Remove should return true");
      ok(
        !ProtoObjectLocalStorage.exists("user:3"),
        "User should not exist after remove"
      );
    });

    it("should check existence correctly", () => {
      ok(
        !ProtoObjectLocalStorage.exists("missing"),
        "Non-existent key should return false"
      );

      const user = new User({
        id: "4",
        name: "Alice",
        email: "alice@example.com",
      });
      ProtoObjectLocalStorage.save("user:4", user);

      ok(
        ProtoObjectLocalStorage.exists("user:4"),
        "Existing key should return true"
      );
    });
  });

  describe("getKeys and clear", () => {
    it("should get keys with prefix", () => {
      const users = [
        new User({ id: "1", name: "User1", email: "user1@example.com" }),
        new User({ id: "2", name: "User2", email: "user2@example.com" }),
      ];

      ProtoObjectLocalStorage.save("user:1", users[0]);
      ProtoObjectLocalStorage.save("user:2", users[1]);
      ProtoObjectLocalStorage.save("settings:theme", users[0]); // Different prefix

      const userKeys = ProtoObjectLocalStorage.getKeys("user:");
      equal(userKeys.length, 2, "Should find 2 user keys");
      ok(userKeys.includes("user:1"), "Should include user:1");
      ok(userKeys.includes("user:2"), "Should include user:2");

      const allKeys = ProtoObjectLocalStorage.getKeys();
      equal(allKeys.length, 3, "Should find all 3 keys");
    });

    it("should clear keys with prefix", () => {
      const user = new User({
        id: "5",
        name: "User5",
        email: "user5@example.com",
      });

      ProtoObjectLocalStorage.save("user:5", user);
      ProtoObjectLocalStorage.save("user:6", user);
      ProtoObjectLocalStorage.save("settings:theme", user);

      const clearedCount = ProtoObjectLocalStorage.clear("user:");
      equal(clearedCount, 2, "Should clear 2 user items");

      ok(!ProtoObjectLocalStorage.exists("user:5"), "user:5 should be removed");
      ok(!ProtoObjectLocalStorage.exists("user:6"), "user:6 should be removed");
      ok(
        ProtoObjectLocalStorage.exists("settings:theme"),
        "settings:theme should remain"
      );
    });
  });

  describe("array operations", () => {
    it("should save and load arrays of objects", () => {
      const users = [
        new User({ id: "1", name: "User1", email: "user1@example.com" }),
        new User({ id: "2", name: "User2", email: "user2@example.com" }),
        new User({ id: "3", name: "User3", email: "user3@example.com" }),
      ];

      const saveResult = ProtoObjectLocalStorage.saveArray("users", users);
      ok(saveResult, "Save array should return true");

      const loadedUsers = ProtoObjectLocalStorage.loadArray("users", User);
      ok(loadedUsers, "Loaded users should exist");
      equal(loadedUsers.length, 3, "Should load 3 users");

      for (let i = 0; i < users.length; i++) {
        deepEqual(
          loadedUsers[i].toJSON(),
          users[i].toJSON(),
          `User ${i} should match`
        );
      }
    });

    it("should return undefined for non-existent array", () => {
      const result = ProtoObjectLocalStorage.loadArray(
        "non-existent-array",
        User
      );
      equal(
        result,
        undefined,
        "Should return undefined for non-existent array"
      );
    });

    it("should handle empty arrays", () => {
      const emptyUsers: any[] = [];

      ProtoObjectLocalStorage.saveArray("empty-users", emptyUsers);
      const loaded = ProtoObjectLocalStorage.loadArray("empty-users", User);

      ok(loaded, "Should load empty array");
      equal(loaded.length, 0, "Loaded array should be empty");
    });
  });

  describe("error handling", () => {
    it("should handle invalid JSON gracefully", () => {
      // Manually set invalid JSON
      (globalThis as any).window.localStorage.setItem(
        "invalid-json",
        "{ invalid json }"
      );

      const result = ProtoObjectLocalStorage.load("invalid-json", User);
      equal(result, undefined, "Should return undefined for invalid JSON");
    });

    it("should handle storage errors gracefully", () => {
      // Mock localStorage to throw errors
      const originalSetItem = (globalThis as any).window.localStorage.setItem;
      (globalThis as any).window.localStorage.setItem = () => {
        throw new Error("Storage full");
      };

      const user = new User({
        id: "error",
        name: "Error",
        email: "error@example.com",
      });
      const result = ProtoObjectLocalStorage.save("error-key", user);

      equal(result, false, "Should return false on storage error");

      // Restore original method
      (globalThis as any).window.localStorage.setItem = originalSetItem;
    });
  });

  describe("browser environment detection", () => {
    it("should handle missing window object", () => {
      const originalWindow = (globalThis as any).window;
      delete (globalThis as any).window;

      const user = new User({
        id: "test",
        name: "Test",
        email: "test@example.com",
      });

      const saveResult = ProtoObjectLocalStorage.save("test", user);
      equal(saveResult, false, "Should return false when window is undefined");

      const loadResult = ProtoObjectLocalStorage.load("test", User);
      equal(
        loadResult,
        undefined,
        "Should return undefined when window is undefined"
      );

      const existsResult = ProtoObjectLocalStorage.exists("test");
      equal(
        existsResult,
        false,
        "Should return false when window is undefined"
      );

      // Restore window
      (globalThis as any).window = originalWindow;
    });

    it("should handle missing localStorage", () => {
      const originalLocalStorage = (globalThis as any).window.localStorage;
      delete (globalThis as any).window.localStorage;

      const user = new User({
        id: "test",
        name: "Test",
        email: "test@example.com",
      });

      const saveResult = ProtoObjectLocalStorage.save("test", user);
      equal(
        saveResult,
        false,
        "Should return false when localStorage is undefined"
      );

      // Restore localStorage
      (globalThis as any).window.localStorage = originalLocalStorage;
    });
  });
});
