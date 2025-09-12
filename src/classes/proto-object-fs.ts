import {
  promises as fs,
  createReadStream,
  createWriteStream,
  watch,
} from "node:fs";
import { join, dirname, extname } from "node:path";
import { EventEmitter } from "node:events";
import { ProtoObject } from "./proto-object.js";
import { StaticImplements } from "../decorators/static-implements.js";
import type { ProtoObjectDynamicMethods } from "../types/dynamic-methods.js";

/* eslint-disable no-unused-vars */
/**
 * File operation types
 */
export enum FileOperationType {
  SAVE = "SAVE",
  LOAD = "LOAD",
  DELETE = "DELETE",
  WATCH = "WATCH",
}

/**
 * File formats supported
 */
export enum FileFormat {
  JSON = ".json",
  CSV = ".csv",
  TEXT = ".txt",
}

/**
 * File operation result
 */
export interface FileOperationResult {
  success: boolean;
  operation: FileOperationType;
  filePath: string;
  error?: Error;
}

/**
 * Static methods interface for FS ProtoObject classes
 */
export interface ProtoObjectFSStaticMethods<
  T extends ProtoObjectDynamicMethods<T>,
> {
  new (data?: Partial<T>): T;
  fromJSON<U extends ProtoObjectDynamicMethods<U>>(data: {
    [key: string]: unknown;
  }): U;
  loadFromFile<U extends ProtoObjectDynamicMethods<U>>(
    filePath: string
  ): Promise<U>;
  loadManyFromDirectory<U extends ProtoObjectDynamicMethods<U>>(
    directoryPath: string
  ): Promise<U[]>;
}

/**
 * CSV field mapping for exports
 */
export interface CSVFieldMapping {
  [propertyName: string]: string; // propertyName -> CSV column name
}
/* eslint-enable no-unused-vars */

/**
 * File system watcher for ProtoObject files
 */
export class ProtoObjectFileWatcher extends EventEmitter {
  private watchers: Map<string, any> = new Map();

  /**
   * Watch a file for changes
   */
  public watchFile(filePath: string): void {
    if (this.watchers.has(filePath)) {
      return; // Already watching
    }

    const watcher = watch(filePath, (eventType, filename) => {
      this.emit("fileChanged", {
        filePath,
        eventType,
        filename,
        timestamp: new Date(),
      });
    });

    this.watchers.set(filePath, watcher);
  }

  /**
   * Stop watching a file
   */
  public unwatchFile(filePath: string): void {
    const watcher = this.watchers.get(filePath);
    if (watcher) {
      watcher.close();
      this.watchers.delete(filePath);
    }
  }

  /**
   * Stop watching all files
   */
  public unwatchAll(): void {
    this.watchers.forEach((watcher) => watcher.close());
    this.watchers.clear();
  }
}

/**
 * Base class for File System enabled ProtoObjects
 */
@StaticImplements<ProtoObjectFSStaticMethods<any>>()
export class ProtoObjectFS<
  T extends ProtoObjectDynamicMethods<T>,
> extends ProtoObject<T> {
  constructor(data?: Partial<T>) {
    super(data);
  }

  /**
   * Save object to file
   */
  public async saveToFile(
    filePath: string,
    format: FileFormat = FileFormat.JSON
  ): Promise<FileOperationResult> {
    try {
      // Ensure directory exists
      await fs.mkdir(dirname(filePath), { recursive: true });

      let content: string;
      switch (format) {
        case FileFormat.JSON:
          content = JSON.stringify(this.toJSON(), null, 2);
          break;
        case FileFormat.CSV:
          content = this.toCSV();
          break;
        case FileFormat.TEXT:
          content = this.toString();
          break;
        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      await fs.writeFile(filePath, content, "utf8");

      return {
        success: true,
        operation: FileOperationType.SAVE,
        filePath,
      };
    } catch (error) {
      return {
        success: false,
        operation: FileOperationType.SAVE,
        filePath,
        error: error as Error,
      };
    }
  }

  /**
   * Load object from file
   */
  public static async loadFromFile<U extends ProtoObjectDynamicMethods<U>>(
    filePath: string
  ): Promise<U> {
    try {
      const content = await fs.readFile(filePath, "utf8");
      const format = extname(filePath) as FileFormat;

      switch (format) {
        case FileFormat.JSON: {
          const data = JSON.parse(content);
          return this.fromJSON<U>(data);
        }
        case FileFormat.CSV:
          throw new Error("CSV loading not implemented yet");
        case FileFormat.TEXT:
          throw new Error("Text loading not implemented yet");
        default:
          throw new Error(`Unsupported format: ${format}`);
      }
    } catch (error) {
      throw new Error(`Failed to load from file ${filePath}: ${error}`);
    }
  }

  /**
   * Load multiple objects from directory
   */
  public static async loadManyFromDirectory<
    U extends ProtoObjectDynamicMethods<U>,
  >(directoryPath: string, pattern: string = "*.json"): Promise<U[]> {
    try {
      const files = await fs.readdir(directoryPath);
      const jsonFiles = files.filter((file) => {
        if (pattern === "*.json") return file.endsWith(".json");
        if (pattern === "*.csv") return file.endsWith(".csv");
        return true;
      });

      const objects: U[] = [];
      for (const file of jsonFiles) {
        try {
          const object = await this.loadFromFile<U>(join(directoryPath, file));
          objects.push(object);
        } catch (error) {
          console.error(`Error loading ${file}:`, error);
        }
      }

      return objects;
    } catch (error) {
      throw new Error(
        `Failed to load from directory ${directoryPath}: ${error}`
      );
    }
  }

  /**
   * Delete file
   */
  public async deleteFile(filePath: string): Promise<FileOperationResult> {
    try {
      await fs.unlink(filePath);

      return {
        success: true,
        operation: FileOperationType.DELETE,
        filePath,
      };
    } catch (error) {
      return {
        success: false,
        operation: FileOperationType.DELETE,
        filePath,
        error: error as Error,
      };
    }
  }

  /**
   * Save multiple objects to directory
   */
  /* eslint-disable no-unused-vars */
  public static async saveManyToDirectory<T extends ProtoObjectFS<T>>(
    objects: T[],
    directoryPath: string,
    fileNameGenerator: (obj: T, index: number) => string = (obj, i) =>
      `object_${i}.json`
  ): Promise<FileOperationResult[]> {
    /* eslint-enable no-unused-vars */
    const results: FileOperationResult[] = [];

    // Ensure directory exists
    await fs.mkdir(directoryPath, { recursive: true });

    for (let i = 0; i < objects.length; i++) {
      const obj = objects[i];
      const fileName = fileNameGenerator(obj, i);
      const filePath = join(directoryPath, fileName);

      const result = await obj.saveToFile(filePath);
      results.push(result);
    }

    return results;
  }

  /**
   * Convert to CSV format
   */
  public toCSV(fieldMapping?: CSVFieldMapping): string {
    const data = this.toJSON();
    const fields = fieldMapping ? Object.keys(fieldMapping) : Object.keys(data);

    // Header
    const headers = fields.map((field) =>
      fieldMapping ? fieldMapping[field] : field
    );

    // Values
    const values = fields.map((field) => {
      const value = data[field];
      if (value === null || value === undefined) return "";
      if (typeof value === "string" && value.includes(",")) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return String(value);
    });

    return `${headers.join(",")}\n${values.join(",")}`;
  }

  /**
   * Batch save with streaming for large datasets
   */
  public static async saveManyToFileStream<T extends ProtoObjectFS<T>>(
    objects: T[],
    filePath: string,
    format: FileFormat = FileFormat.JSON
  ): Promise<FileOperationResult> {
    try {
      // Ensure directory exists
      await fs.mkdir(dirname(filePath), { recursive: true });

      const writeStream = createWriteStream(filePath);

      if (format === FileFormat.JSON) {
        writeStream.write("[\n");

        for (let i = 0; i < objects.length; i++) {
          const obj = objects[i];
          const json = JSON.stringify(obj.toJSON(), null, 2);

          if (i > 0) writeStream.write(",\n");
          writeStream.write(json);
        }

        writeStream.write("\n]");
      } else if (format === FileFormat.CSV) {
        // Write CSV header
        if (objects.length > 0) {
          const headers = Object.keys(objects[0].toJSON()).join(",");
          writeStream.write(headers + "\n");

          for (const obj of objects) {
            const csvLine = obj.toCSV();
            const values = csvLine.split("\n")[1]; // Get only values, skip header
            writeStream.write(values + "\n");
          }
        }
      }

      writeStream.end();

      return new Promise((resolve, reject) => {
        writeStream.on("finish", () => {
          resolve({
            success: true,
            operation: FileOperationType.SAVE,
            filePath,
          });
        });

        writeStream.on("error", (error) => {
          reject({
            success: false,
            operation: FileOperationType.SAVE,
            filePath,
            error,
          });
        });
      });
    } catch (error) {
      return {
        success: false,
        operation: FileOperationType.SAVE,
        filePath,
        error: error as Error,
      };
    }
  }

  /**
   * Load large datasets with streaming
   */
  /* eslint-disable no-unused-vars */
  public static async loadManyFromFileStream<
    U extends ProtoObjectDynamicMethods<U>,
  >(
    filePath: string,
    callback: (object: U) => void | Promise<void>
  ): Promise<void> {
    /* eslint-enable no-unused-vars */
    const readStream = createReadStream(filePath);
    let buffer = "";

    return new Promise((resolve, reject) => {
      readStream.on("data", async (chunk: Buffer) => {
        buffer += chunk.toString();

        // Simple JSON array parsing (for demo purposes)
        if (buffer.includes("},{")) {
          const objects = buffer.split("},{");
          buffer = objects.pop() || ""; // Keep the last incomplete object

          for (let objStr of objects) {
            try {
              // Fix JSON formatting
              if (!objStr.startsWith("{")) objStr = "{" + objStr;
              if (!objStr.endsWith("}")) objStr = objStr + "}";

              const data = JSON.parse(objStr);
              const object = this.fromJSON<U>(data);
              await callback(object);
            } catch (error) {
              console.error("Error parsing object:", error);
            }
          }
        }
      });

      readStream.on("end", () => {
        resolve();
      });

      readStream.on("error", (error) => {
        reject(error);
      });
    });
  }

  /**
   * Create backup of object with timestamp
   */
  public async createBackup(
    backupDirectory: string
  ): Promise<FileOperationResult> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const className = this.constructor.name;
    const backupFileName = `${className}_backup_${timestamp}.json`;
    const backupPath = join(backupDirectory, backupFileName);

    return this.saveToFile(backupPath, FileFormat.JSON);
  }
}
