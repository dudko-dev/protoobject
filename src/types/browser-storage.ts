/**
 * Storage types supported by ProtoObjectBrowserStorage
 */
export type StorageType =
  | "local"
  | "session"
  | "indexeddb"
  | "cookies"
  | "broadcast"
  | "worker";

/**
 * Configuration for ProtoObject browser storage
 */
export interface StorageOptions {
  /**
   * Type of storage to use
   */
  type: StorageType;

  /**
   * Database name for IndexedDB (optional, defaults to 'ProtoObjectDB')
   */
  dbName?: string;

  /**
   * Object store name for IndexedDB (optional, defaults to 'objects')
   */
  storeName?: string;

  /**
   * Cookie domain (optional, defaults to current domain)
   */
  domain?: string;

  /**
   * Cookie path (optional, defaults to '/')
   */
  path?: string;

  /**
   * Cookie max age in seconds (optional, defaults to 1 year)
   */
  maxAge?: number;

  /**
   * Worker script URL for worker storage
   */
  workerScript?: string;

  /**
   * Broadcast channel name (optional, defaults to 'protoobject-channel')
   */
  channelName?: string;
}
