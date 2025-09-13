/* eslint-env browser */
/* global window, indexedDB, document */
import { ProtoObject } from "../classes/proto-object";
import { ProtoObjectStaticMethods } from "../types/static-methods";
import { UnknownObject } from "../types/unknown-object";
import type { StorageType, StorageOptions } from "../types/browser-storage";

// Re-export types for convenience
export type { StorageType, StorageOptions } from "../types/browser-storage";

/**
 * Universal ProtoObject browser storage utility
 * Supports localStorage, sessionStorage, IndexedDB, cookies, BroadcastChannel, and Web Workers
 */
export class ProtoObjectBrowserStorage {
  private static workers = new Map<string, Worker>();
  private static channels = new Map<string, BroadcastChannel>();
  private static idbDatabases = new Map<string, IDBDatabase>();

  /**
   * Save ProtoObject instance to browser storage
   */
  public static async save<T extends ProtoObject<any>>(
    key: string,
    obj: T,
    options: StorageOptions = { type: "local" }
  ): Promise<boolean> {
    try {
      const json = obj.toJSON();
      const serialized = JSON.stringify(json);
      return await this.saveData(key, json, serialized, options);
    } catch (error) {
      console.error("ProtoObjectBrowserStorage.save error:", error);
      return false;
    }
  }

  /**
   * Load ProtoObject instance from browser storage
   */
  public static async load<T extends ProtoObject<any>>(
    key: string,
    ClassConstructor: ProtoObjectStaticMethods<T>,
    options: StorageOptions = { type: "local" }
  ): Promise<T | undefined> {
    try {
      const data = await this.loadData(key, options);
      return data ? ClassConstructor.fromJSON(data) : undefined;
    } catch (error) {
      console.error("ProtoObjectBrowserStorage.load error:", error);
      return undefined;
    }
  }

  /**
   * Remove item from browser storage
   */
  public static async remove(
    key: string,
    options: StorageOptions = { type: "local" }
  ): Promise<boolean> {
    return await this.removeData(key, options);
  }

  /**
   * Check if key exists in browser storage
   */
  public static async exists(
    key: string,
    options: StorageOptions = { type: "local" }
  ): Promise<boolean> {
    return await this.existsData(key, options);
  }

  /**
   * Get all keys with optional prefix filter
   */
  public static async getKeys(
    prefix?: string,
    options: StorageOptions = { type: "local" }
  ): Promise<string[]> {
    return await this.getKeysData(prefix, options);
  }

  /**
   * Clear storage with optional prefix filter
   */
  public static async clear(
    prefix?: string,
    options: StorageOptions = { type: "local" }
  ): Promise<number> {
    try {
      const keys = await this.getKeys(prefix, options);
      let removed = 0;

      for (const key of keys) {
        if (await this.remove(key, options)) {
          removed += 1;
        }
      }

      return removed;
    } catch (error) {
      console.error("ProtoObjectBrowserStorage.clear error:", error);
      return 0;
    }
  }

  // Private delegation methods to reduce code duplication
  private static async saveData(
    key: string,
    json: UnknownObject,
    serialized: string,
    options: StorageOptions
  ): Promise<boolean> {
    switch (options.type) {
      case "local":
        return this.saveToWebStorage(key, serialized, "localStorage");

      case "session":
        return this.saveToWebStorage(key, serialized, "sessionStorage");

      case "indexeddb":
        return await this.saveToIndexedDB(key, json, options);

      case "cookies":
        return this.saveToCookies(key, serialized, options);

      case "broadcast":
        return this.saveToBroadcast(key, json, options);

      case "worker":
        return await this.saveToWorker(key, json, options);

      default:
        console.error(`Unsupported storage type: ${options.type}`);
        return false;
    }
  }

  private static async loadData(
    key: string,
    options: StorageOptions
  ): Promise<UnknownObject | undefined> {
    switch (options.type) {
      case "local":
        return this.loadFromWebStorage(key, "localStorage");

      case "session":
        return this.loadFromWebStorage(key, "sessionStorage");

      case "indexeddb":
        return await this.loadFromIndexedDB(key, options);

      case "cookies":
        return this.loadFromCookies(key);

      case "broadcast":
        return this.loadFromBroadcast(key, options);

      case "worker":
        return await this.loadFromWorker(key, options);

      default:
        console.error(`Unsupported storage type: ${options.type}`);
        return undefined;
    }
  }

  private static async removeData(
    key: string,
    options: StorageOptions
  ): Promise<boolean> {
    try {
      switch (options.type) {
        case "local":
          return this.removeFromWebStorage(key, "localStorage");

        case "session":
          return this.removeFromWebStorage(key, "sessionStorage");

        case "indexeddb":
          return await this.removeFromIndexedDB(key, options);

        case "cookies":
          return this.removeFromCookies(key, options);

        case "broadcast":
          return this.removeFromBroadcast(key, options);

        case "worker":
          return await this.removeFromWorker(key, options);

        default:
          console.error(`Unsupported storage type: ${options.type}`);
          return false;
      }
    } catch (error) {
      console.error("ProtoObjectBrowserStorage.remove error:", error);
      return false;
    }
  }

  private static async existsData(
    key: string,
    options: StorageOptions
  ): Promise<boolean> {
    try {
      switch (options.type) {
        case "local":
          return this.existsInWebStorage(key, "localStorage");

        case "session":
          return this.existsInWebStorage(key, "sessionStorage");

        case "indexeddb":
          return await this.existsInIndexedDB(key, options);

        case "cookies":
          return this.existsInCookies(key);

        case "broadcast":
          return this.existsInBroadcast(key, options);

        case "worker":
          return await this.existsInWorker(key, options);

        default:
          console.error(`Unsupported storage type: ${options.type}`);
          return false;
      }
    } catch (error) {
      console.error("ProtoObjectBrowserStorage.exists error:", error);
      return false;
    }
  }

  private static async getKeysData(
    prefix: string | undefined,
    options: StorageOptions
  ): Promise<string[]> {
    try {
      switch (options.type) {
        case "local":
          return this.getKeysFromWebStorage(prefix, "localStorage");

        case "session":
          return this.getKeysFromWebStorage(prefix, "sessionStorage");

        case "indexeddb":
          return await this.getKeysFromIndexedDB(prefix, options);

        case "cookies":
          return this.getKeysFromCookies(prefix);

        case "broadcast":
          return this.getKeysFromBroadcast(prefix, options);

        case "worker":
          return await this.getKeysFromWorker(prefix, options);

        default:
          console.error(`Unsupported storage type: ${options.type}`);
          return [];
      }
    } catch (error) {
      console.error("ProtoObjectBrowserStorage.getKeys error:", error);
      return [];
    }
  }

  // Private methods for Web Storage (localStorage/sessionStorage)
  private static saveToWebStorage(
    key: string,
    serialized: string,
    storageType: "localStorage" | "sessionStorage"
  ): boolean {
    if (typeof window === "undefined" || !window[storageType]) {
      return false;
    }
    window[storageType].setItem(key, serialized);
    return true;
  }

  private static loadFromWebStorage(
    key: string,
    storageType: "localStorage" | "sessionStorage"
  ): UnknownObject | undefined {
    if (typeof window === "undefined" || !window[storageType]) {
      return undefined;
    }
    const serialized = window[storageType].getItem(key);
    return serialized ? JSON.parse(serialized) : undefined;
  }

  private static removeFromWebStorage(
    key: string,
    storageType: "localStorage" | "sessionStorage"
  ): boolean {
    if (typeof window === "undefined" || !window[storageType]) {
      return false;
    }
    window[storageType].removeItem(key);
    return true;
  }

  private static existsInWebStorage(
    key: string,
    storageType: "localStorage" | "sessionStorage"
  ): boolean {
    if (typeof window === "undefined" || !window[storageType]) {
      return false;
    }
    return window[storageType].getItem(key) !== null;
  }

  private static getKeysFromWebStorage(
    prefix: string | undefined,
    storageType: "localStorage" | "sessionStorage"
  ): string[] {
    if (typeof window === "undefined" || !window[storageType]) {
      return [];
    }

    const keys: string[] = [];
    const storage = window[storageType];

    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && (!prefix || key.startsWith(prefix))) {
        keys.push(key);
      }
    }

    return keys;
  }

  // Private methods for IndexedDB
  private static async getIndexedDB(
    options: StorageOptions
  ): Promise<IDBDatabase | undefined> {
    if (typeof window === "undefined" || !window.indexedDB) {
      return undefined;
    }

    const dbName = options.dbName || "ProtoObjectDB";

    if (this.idbDatabases.has(dbName)) {
      return this.idbDatabases.get(dbName);
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, 1);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        const db = request.result;
        this.idbDatabases.set(dbName, db);
        resolve(db);
      };

      request.onupgradeneeded = () => {
        const db = request.result;
        const storeName = options.storeName || "objects";

        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName);
        }
      };
    });
  }

  private static async saveToIndexedDB(
    key: string,
    data: UnknownObject,
    options: StorageOptions
  ): Promise<boolean> {
    const db = await this.getIndexedDB(options);
    if (!db) return false;

    return new Promise((resolve) => {
      const transaction = db.transaction(
        [options.storeName || "objects"],
        "readwrite"
      );
      const store = transaction.objectStore(options.storeName || "objects");
      const request = store.put(data, key);

      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    });
  }

  private static async loadFromIndexedDB(
    key: string,
    options: StorageOptions
  ): Promise<UnknownObject | undefined> {
    const db = await this.getIndexedDB(options);
    if (!db) return undefined;

    return new Promise((resolve) => {
      const transaction = db.transaction(
        [options.storeName || "objects"],
        "readonly"
      );
      const store = transaction.objectStore(options.storeName || "objects");
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result || undefined);
      request.onerror = () => resolve(undefined);
    });
  }

  private static async removeFromIndexedDB(
    key: string,
    options: StorageOptions
  ): Promise<boolean> {
    const db = await this.getIndexedDB(options);
    if (!db) return false;

    return new Promise((resolve) => {
      const transaction = db.transaction(
        [options.storeName || "objects"],
        "readwrite"
      );
      const store = transaction.objectStore(options.storeName || "objects");
      const request = store.delete(key);

      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    });
  }

  private static async existsInIndexedDB(
    key: string,
    options: StorageOptions
  ): Promise<boolean> {
    const data = await this.loadFromIndexedDB(key, options);
    return data !== undefined;
  }

  private static async getKeysFromIndexedDB(
    prefix: string | undefined,
    options: StorageOptions
  ): Promise<string[]> {
    const db = await this.getIndexedDB(options);
    if (!db) return [];

    return new Promise((resolve) => {
      const transaction = db.transaction(
        [options.storeName || "objects"],
        "readonly"
      );
      const store = transaction.objectStore(options.storeName || "objects");
      const request = store.getAllKeys();

      request.onsuccess = () => {
        const keys = request.result
          .map((key) => String(key))
          .filter((key) => !prefix || key.startsWith(prefix));
        resolve(keys);
      };

      request.onerror = () => resolve([]);
    });
  }

  // Private methods for Cookies
  private static saveToCookies(
    key: string,
    serialized: string,
    options: StorageOptions
  ): boolean {
    if (typeof document === "undefined") {
      return false;
    }

    try {
      const maxAge = options.maxAge || 31536000; // 1 year default
      const domain = options.domain ? `; domain=${options.domain}` : "";
      const path = `; path=${options.path || "/"}`;

      document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(serialized)}; max-age=${maxAge}${domain}${path}`;
      return true;
    } catch {
      return false;
    }
  }

  private static loadFromCookies(key: string): UnknownObject | undefined {
    if (typeof document === "undefined") {
      return undefined;
    }

    try {
      const encodedKey = encodeURIComponent(key);
      const cookies = document.cookie.split(";");

      for (const cookie of cookies) {
        const [cookieKey, cookieValue] = cookie.trim().split("=");
        if (cookieKey === encodedKey && cookieValue) {
          const decoded = decodeURIComponent(cookieValue);
          return JSON.parse(decoded);
        }
      }

      return undefined;
    } catch {
      return undefined;
    }
  }

  private static removeFromCookies(
    key: string,
    options: StorageOptions
  ): boolean {
    if (typeof document === "undefined") {
      return false;
    }

    try {
      const domain = options.domain ? `; domain=${options.domain}` : "";
      const path = `; path=${options.path || "/"}`;

      document.cookie = `${encodeURIComponent(key)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT${domain}${path}`;
      return true;
    } catch {
      return false;
    }
  }

  private static existsInCookies(key: string): boolean {
    return this.loadFromCookies(key) !== undefined;
  }

  private static getKeysFromCookies(prefix: string | undefined): string[] {
    if (typeof document === "undefined") {
      return [];
    }

    try {
      const keys: string[] = [];
      const cookies = document.cookie.split(";");

      for (const cookie of cookies) {
        const [cookieKey] = cookie.trim().split("=");
        if (cookieKey) {
          const decoded = decodeURIComponent(cookieKey);
          if (!prefix || decoded.startsWith(prefix)) {
            keys.push(decoded);
          }
        }
      }

      return keys;
    } catch {
      return [];
    }
  }

  // Private methods for BroadcastChannel
  private static getBroadcastChannel(
    options: StorageOptions
  ): BroadcastChannel | undefined {
    if (typeof window === "undefined" || !window.BroadcastChannel) {
      return undefined;
    }

    const channelName = options.channelName || "protoobject-channel";

    if (!this.channels.has(channelName)) {
      this.channels.set(channelName, new BroadcastChannel(channelName));
    }

    return this.channels.get(channelName);
  }

  private static saveToBroadcast(
    key: string,
    data: UnknownObject,
    options: StorageOptions
  ): boolean {
    const channel = this.getBroadcastChannel(options);
    if (!channel) return false;

    try {
      channel.postMessage({ type: "save", key, data });
      return true;
    } catch {
      return false;
    }
  }

  private static loadFromBroadcast(
    key: string,
    options: StorageOptions
  ): UnknownObject | undefined {
    const channel = this.getBroadcastChannel(options);
    if (!channel) return undefined;

    // BroadcastChannel is async by nature, this is a synchronous fallback
    // In real usage, you'd typically listen for messages
    try {
      channel.postMessage({ type: "load", key });
      return undefined; // Would need async implementation for real usage
    } catch {
      return undefined;
    }
  }

  private static removeFromBroadcast(
    key: string,
    options: StorageOptions
  ): boolean {
    const channel = this.getBroadcastChannel(options);
    if (!channel) return false;

    try {
      channel.postMessage({ type: "remove", key });
      return true;
    } catch {
      return false;
    }
  }

  private static existsInBroadcast(
    key: string,
    options: StorageOptions
  ): boolean {
    const channel = this.getBroadcastChannel(options);
    if (!channel) return false;

    try {
      channel.postMessage({ type: "exists", key });
      return false; // Would need async implementation for real usage
    } catch {
      return false;
    }
  }

  private static getKeysFromBroadcast(
    prefix: string | undefined,
    options: StorageOptions
  ): string[] {
    const channel = this.getBroadcastChannel(options);
    if (!channel) return [];

    try {
      channel.postMessage({ type: "getKeys", prefix });
      return []; // Would need async implementation for real usage
    } catch {
      return [];
    }
  }

  // Private methods for Web Worker
  private static getWorker(options: StorageOptions): Worker | undefined {
    if (
      typeof window === "undefined" ||
      !window.Worker ||
      !options.workerScript
    ) {
      return undefined;
    }

    if (!this.workers.has(options.workerScript)) {
      try {
        const worker = new Worker(options.workerScript);
        this.workers.set(options.workerScript, worker);
      } catch {
        return undefined;
      }
    }

    return this.workers.get(options.workerScript);
  }

  private static async saveToWorker(
    key: string,
    data: UnknownObject,
    options: StorageOptions
  ): Promise<boolean> {
    const worker = this.getWorker(options);
    if (!worker) return false;

    return new Promise((resolve) => {
      const messageId = Date.now().toString();

      const handleMessage = (event: MessageEvent) => {
        if (event.data.id === messageId) {
          worker.removeEventListener("message", handleMessage);
          resolve(event.data.success || false);
        }
      };

      worker.addEventListener("message", handleMessage);
      worker.postMessage({ id: messageId, type: "save", key, data });

      // Timeout after 5 seconds
      setTimeout(() => {
        worker.removeEventListener("message", handleMessage);
        resolve(false);
      }, 5000);
    });
  }

  private static async loadFromWorker(
    key: string,
    options: StorageOptions
  ): Promise<UnknownObject | undefined> {
    const worker = this.getWorker(options);
    if (!worker) return undefined;

    return new Promise((resolve) => {
      const messageId = Date.now().toString();

      const handleMessage = (event: MessageEvent) => {
        if (event.data.id === messageId) {
          worker.removeEventListener("message", handleMessage);
          resolve(event.data.data || undefined);
        }
      };

      worker.addEventListener("message", handleMessage);
      worker.postMessage({ id: messageId, type: "load", key });

      // Timeout after 5 seconds
      setTimeout(() => {
        worker.removeEventListener("message", handleMessage);
        resolve(undefined);
      }, 5000);
    });
  }

  private static async removeFromWorker(
    key: string,
    options: StorageOptions
  ): Promise<boolean> {
    const worker = this.getWorker(options);
    if (!worker) return false;

    return new Promise((resolve) => {
      const messageId = Date.now().toString();

      const handleMessage = (event: MessageEvent) => {
        if (event.data.id === messageId) {
          worker.removeEventListener("message", handleMessage);
          resolve(event.data.success || false);
        }
      };

      worker.addEventListener("message", handleMessage);
      worker.postMessage({ id: messageId, type: "remove", key });

      // Timeout after 5 seconds
      setTimeout(() => {
        worker.removeEventListener("message", handleMessage);
        resolve(false);
      }, 5000);
    });
  }

  private static async existsInWorker(
    key: string,
    options: StorageOptions
  ): Promise<boolean> {
    const worker = this.getWorker(options);
    if (!worker) return false;

    return new Promise((resolve) => {
      const messageId = Date.now().toString();

      const handleMessage = (event: MessageEvent) => {
        if (event.data.id === messageId) {
          worker.removeEventListener("message", handleMessage);
          resolve(event.data.exists || false);
        }
      };

      worker.addEventListener("message", handleMessage);
      worker.postMessage({ id: messageId, type: "exists", key });

      // Timeout after 5 seconds
      setTimeout(() => {
        worker.removeEventListener("message", handleMessage);
        resolve(false);
      }, 5000);
    });
  }

  private static async getKeysFromWorker(
    prefix: string | undefined,
    options: StorageOptions
  ): Promise<string[]> {
    const worker = this.getWorker(options);
    if (!worker) return [];

    return new Promise((resolve) => {
      const messageId = Date.now().toString();

      const handleMessage = (event: MessageEvent) => {
        if (event.data.id === messageId) {
          worker.removeEventListener("message", handleMessage);
          resolve(event.data.keys || []);
        }
      };

      worker.addEventListener("message", handleMessage);
      worker.postMessage({ id: messageId, type: "getKeys", prefix });

      // Timeout after 5 seconds
      setTimeout(() => {
        worker.removeEventListener("message", handleMessage);
        resolve([]);
      }, 5000);
    });
  }

  /**
   * Array operations
   */
  public static async saveArray<T extends ProtoObject<any>>(
    key: string,
    objects: T[],
    options: StorageOptions = { type: "local" }
  ): Promise<boolean> {
    try {
      const jsonArray = objects.map((obj) => obj.toJSON());
      const serialized = JSON.stringify({ array: jsonArray });
      return await this.saveData(
        key,
        { array: jsonArray },
        serialized,
        options
      );
    } catch (error) {
      console.error("ProtoObjectBrowserStorage.saveArray error:", error);
      return false;
    }
  }

  public static async loadArray<T extends ProtoObject<any>>(
    key: string,
    ClassConstructor: ProtoObjectStaticMethods<T>,
    options: StorageOptions = { type: "local" }
  ): Promise<T[] | undefined> {
    try {
      const data = await this.loadData(key, options);

      if (!data || !Array.isArray(data.array)) {
        return undefined;
      }

      return data.array.map((json: UnknownObject) =>
        ClassConstructor.fromJSON(json)
      );
    } catch (error) {
      console.error("ProtoObjectBrowserStorage.loadArray error:", error);
      return undefined;
    }
  }

  /**
   * Utility method to check storage support
   */
  public static getStorageSupport(): Record<StorageType, boolean> {
    return {
      local: typeof window !== "undefined" && !!window.localStorage,
      session: typeof window !== "undefined" && !!window.sessionStorage,
      indexeddb: typeof window !== "undefined" && !!window.indexedDB,
      cookies: typeof document !== "undefined",
      broadcast: typeof window !== "undefined" && !!window.BroadcastChannel,
      worker: typeof window !== "undefined" && !!window.Worker,
    };
  }

  /**
   * Cleanup method to close connections
   */
  public static cleanup(): void {
    // Close IndexedDB connections
    this.idbDatabases.forEach((db) => db.close());
    this.idbDatabases.clear();

    // Close BroadcastChannels
    this.channels.forEach((channel) => channel.close());
    this.channels.clear();

    // Terminate workers
    this.workers.forEach((worker) => worker.terminate());
    this.workers.clear();
  }
}
