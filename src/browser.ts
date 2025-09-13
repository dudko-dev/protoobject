/**
 * Browser-compatible exports of protoobject
 * @module protoobject/browser
 * @author Siarhei Dudko <siarhei@dudko.dev>
 */

// Core classes (browser-compatible)
export { ProtoObject } from "./classes/proto-object.js";

// Decorators (browser-compatible)
export { StaticImplements } from "./decorators/static-implements.js";

// Types (browser-compatible)
export type { AnyObject } from "./types/any-object.js";
export type { UnknownObject } from "./types/unknown-object.js";
export type { ValidatorFunction } from "./types/validator-function.js";
export type { ProtoObjectDynamicMethods } from "./types/dynamic-methods.js";
export type { ProtoObjectStaticMethods } from "./types/static-methods.js";
export type { RecordTransformer } from "./types/record-transformer.js";
export type { CollectionTransformer } from "./types/collection-transformer.js";
export type { StorageType, StorageOptions } from "./types/browser-storage.js";

// Utilities (browser-compatible)
export { protoObjectFactory } from "./utils/protoobject-factory.js";
export { ProtoObjectBrowserStorage } from "./utils/protoobject-browser-storage.js";

// Note: The following modules are Node.js-specific and not available in browser:
// - ProtoObjectSQLite (requires node:sqlite and node:crypto)
// - ProtoObjectTCP (requires node:net)
// - ProtoObjectCrypto (requires node:crypto)
// - ProtoObjectFS (requires node:fs, node:path, node:events)
// - ProtoObjectStream (requires node:stream via @sergdudko/objectstream)
