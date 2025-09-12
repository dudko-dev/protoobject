/**
 * A universal class for creating any JSON objects and simple manipulations with them.
 * @module protoobject
 * @author Siarhei Dudko <siarhei@dudko.dev>
 * @copyright 2024
 * @license MIT
 * @version 1.1.0
 */

// Core classes
export { ProtoObject } from "./classes/proto-object.js";

// SQLite integration
export {
  ProtoObjectSQLite,
  RecordState,
} from "./classes/proto-object-sqlite.js";

// TCP Network integration
export {
  ProtoObjectTCP,
  MessageType,
  ProtoObjectTCPServer,
  ProtoObjectTCPClient,
} from "./classes/proto-object-tcp.js";
export type {
  TCPMessage,
  ProtoObjectTCPStaticMethods,
} from "./classes/proto-object-tcp.js";

// Stream processing with @sergdudko/objectstream
export { ProtoObjectStream } from "./classes/proto-object-stream.js";

// Crypto integration
export {
  ProtoObjectCrypto,
  EncryptionAlgorithm,
  HashAlgorithm,
} from "./classes/proto-object-crypto.js";
export type {
  EncryptedData,
  ProtoObjectCryptoStaticMethods,
} from "./classes/proto-object-crypto.js";

// File System integration
export {
  ProtoObjectFS,
  FileOperationType,
  FileFormat,
} from "./classes/proto-object-fs.js";
export type {
  FileOperationResult,
  ProtoObjectFSStaticMethods,
  CSVFieldMapping,
} from "./classes/proto-object-fs.js";

// Decorators
export { StaticImplements } from "./decorators/static-implements.js";

// Types
export type { AnyObject } from "./types/any-object.js";
export type { UnknownObject } from "./types/unknown-object.js";
export type { ValidatorFunction } from "./types/validator-function.js";
export type { ProtoObjectDynamicMethods } from "./types/dynamic-methods.js";
export type { ProtoObjectStaticMethods } from "./types/static-methods.js";
export type { RecordTransformer } from "./types/record-transformer.js";
export type { CollectionTransformer } from "./types/collection-transformer.js";

// Utilities
export { protoObjectFactory } from "./utils/protoobject-factory.js";
