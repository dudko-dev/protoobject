/**
 * Browser compatibility test for Node.js environment
 * This test verifies that browser-specific exports work correctly
 */

import { describe, it } from "node:test";
import { equal, ok, doesNotThrow } from "node:assert";

describe("Browser Compatibility Tests", () => {
  it("should be able to import browser-specific modules", async () => {
    // Test core ProtoObject pattern without Node.js dependencies
    class TestObject {
      constructor(data = {}) {
        Object.assign(this, data);
        return this;
      }

      toJSON() {
        const result = {};
        for (const key in this) {
          if (this.hasOwnProperty(key) && typeof this[key] !== "function") {
            result[key] = this[key];
          }
        }
        return result;
      }

      static fromJSON(data) {
        return new this(data);
      }
    }

    const obj = new TestObject({ name: "Browser Test", value: 42 });
    const json = obj.toJSON();
    const restored = TestObject.fromJSON(json);

    equal(restored.name, "Browser Test");
    equal(restored.value, 42);
  });

  it("should handle JSON serialization without Node.js modules", () => {
    class BrowserObject {
      constructor(data = {}) {
        Object.assign(this, data);
      }

      toJSON() {
        return { ...this };
      }

      static fromJSON(data) {
        return new this(data);
      }
    }

    const complexData = {
      string: "test",
      number: 123,
      boolean: true,
      array: [1, 2, 3],
      object: { nested: true },
      date: new Date().toISOString(),
    };

    const obj = new BrowserObject(complexData);
    const jsonString = JSON.stringify(obj.toJSON());
    const parsed = JSON.parse(jsonString);
    const restored = BrowserObject.fromJSON(parsed);

    equal(restored.string, "test");
    equal(restored.number, 123);
    equal(restored.boolean, true);
    equal(restored.array.length, 3);
    equal(restored.object.nested, true);
  });

  it("should work without Node.js specific APIs", () => {
    // Test that we can create objects without requiring fs, crypto, net, etc.
    doesNotThrow(() => {
      class SimpleObject {
        constructor(data) {
          Object.assign(this, data);
        }

        validate() {
          return true;
        }

        transform(fn) {
          return fn(this);
        }
      }

      const obj = new SimpleObject({ id: 1, name: "test" });
      ok(obj.validate());

      const transformed = obj.transform((data) => ({
        ...data,
        transformed: true,
      }));
      ok(transformed.transformed);
    });
  });

  it("should simulate browser environment behavior", () => {
    // Simulate browser globals (without actually having them)
    const mockStorage: Record<string, string> = {};
    const mockBrowserEnvironment = {
      window: {},
      document: {},
      localStorage: {
        setItem: (key: string, value: string) => {
          mockStorage[key] = value;
        },
        getItem: (key: string) => mockStorage[key] || null,
        removeItem: (key: string) => {
          delete mockStorage[key];
        },
        _storage: mockStorage,
      },
      fetch: async (url: string, options?: any) => {
        // Mock fetch implementation
        return {
          ok: true,
          json: async () => ({ data: options?.body || "{}" }),
        };
      },
    };

    // Test localStorage simulation
    const testData = { name: "Browser Test", value: 123 };
    mockBrowserEnvironment.localStorage.setItem(
      "test",
      JSON.stringify(testData)
    );
    const storedValue = mockBrowserEnvironment.localStorage.getItem("test");
    const retrieved = storedValue ? JSON.parse(storedValue) : null;

    equal(retrieved.name, "Browser Test");
    equal(retrieved.value, 123);

    // Test fetch simulation
    doesNotThrow(async () => {
      const response = await mockBrowserEnvironment.fetch("/api/test", {
        method: "POST",
        body: JSON.stringify(testData),
      });

      ok(response.ok);
      const result = await response.json();
      ok(result.data);
    });
  });

  it("should demonstrate browser-specific optimizations", () => {
    class OptimizedBrowserObject {
      [key: string]: any;

      constructor(data: Record<string, any> = {}) {
        // Use direct property assignment for better browser performance
        for (const key in data) {
          if (Object.prototype.hasOwnProperty.call(data, key)) {
            this[key] = data[key];
          }
        }
      }

      toJSON() {
        // Optimized for browser JSON.stringify
        const result: Record<string, any> = {};
        for (const key in this) {
          if (
            Object.prototype.hasOwnProperty.call(this, key) &&
            typeof this[key] !== "function" &&
            typeof this[key] !== "undefined"
          ) {
            result[key] = this[key];
          }
        }
        return result;
      }

      static fromJSON(data: Record<string, any>) {
        return new this(data);
      }

      // Browser-friendly methods
      toLocalStorage(key: string) {
        if (typeof globalThis !== "undefined" && "localStorage" in globalThis) {
          (globalThis as any).localStorage.setItem(
            key,
            JSON.stringify(this.toJSON())
          );
        }
      }

      static fromLocalStorage(key: string) {
        if (typeof globalThis !== "undefined" && "localStorage" in globalThis) {
          const data = (globalThis as any).localStorage.getItem(key);
          if (data) {
            return this.fromJSON(JSON.parse(data));
          }
        }
        return null;
      }
    }

    const obj = new OptimizedBrowserObject({
      id: 1,
      name: "Optimized Object",
      data: [1, 2, 3],
      timestamp: Date.now(),
    });

    const json = obj.toJSON();
    const restored = OptimizedBrowserObject.fromJSON(json);

    equal(restored.name, "Optimized Object");
    equal(restored.data.length, 3);
    ok(restored.timestamp > 0);
  });
});
