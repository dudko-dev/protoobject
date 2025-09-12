import { describe, it } from "node:test";
import { ok, equal } from "node:assert";
import { join } from "node:path";
import { promises as fs } from "node:fs";
import {
  ProtoObjectFS,
  FileFormat,
  FileOperationType,
} from "../../src/classes/proto-object-fs.js";

// Test class for file operations
class TestFileObject extends ProtoObjectFS<TestFileObject> {
  public id?: string;
  public name?: string;
  public data?: any;

  constructor(data?: Partial<TestFileObject>) {
    super(data);
    if (data) this.assign(data);
  }

  public toJSON(): { [key: string]: any } {
    const result: { [key: string]: any } = {};

    if (this.id !== undefined) result.id = this.id;
    if (this.name !== undefined) result.name = this.name;
    if (this.data !== undefined) result.data = this.data;

    return result;
  }

  public static fromJSON<T>(data: { [key: string]: unknown }): T {
    return new TestFileObject({
      id: typeof data.id === "string" ? data.id : undefined,
      name: typeof data.name === "string" ? data.name : undefined,
      data: data.data,
    }) as T;
  }
}

describe("ProtoObjectFS", function () {
  it("should save and load from file", async () => {
    const obj = new TestFileObject({
      id: "test-123",
      name: "Test Object",
      data: { value: 42, active: true },
    });

    const tempPath = join(process.cwd(), "temp_test_file.json");

    try {
      // Save to file
      const saveResult = await obj.saveToFile(tempPath, FileFormat.JSON);

      ok(saveResult.success);
      equal(saveResult.operation, FileOperationType.SAVE);
      equal(saveResult.filePath, tempPath);

      // Load from file
      const loadedObj =
        await TestFileObject.loadFromFile<TestFileObject>(tempPath);

      equal(loadedObj.id, obj.id);
      equal(loadedObj.name, obj.name);
      equal(loadedObj.data.value, obj.data.value);
      equal(loadedObj.data.active, obj.data.active);

      // Clean up
      await fs.unlink(tempPath);
    } catch (error) {
      // Clean up on error
      try {
        await fs.unlink(tempPath);
      } catch {
        // Ignore cleanup errors
      }
      throw error;
    }
  });

  it("should handle file operations with result tracking", async () => {
    const obj = new TestFileObject({
      id: "operations-test",
      name: "Operations Test",
    });

    const tempPath = join(process.cwd(), "operations_test.json");

    try {
      // Save operation
      const saveResult = await obj.saveToFile(tempPath, FileFormat.JSON);
      ok(saveResult.success);
      equal(saveResult.operation, FileOperationType.SAVE);

      // Verify file exists
      const stats = await fs.stat(tempPath);
      ok(stats.isFile());

      // Clean up
      await fs.unlink(tempPath);
    } catch (error) {
      // Clean up on error
      try {
        await fs.unlink(tempPath);
      } catch {
        // Ignore cleanup errors
      }
      throw error;
    }
  });
});
