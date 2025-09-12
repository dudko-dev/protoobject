/**
 * ProtoObjectCrypto - Cryptographic utilities for ProtoObject
 * @description Provides encryption, hashing, and digital signature capabilities
 * @author Siarhei Dudko <siarhei@dudko.dev>
 * @copyright 2024
 * @license MIT
 */

import {
  createHash,
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";
import { ProtoObject } from "./proto-object.js";
import type { ProtoObjectDynamicMethods } from "../types/dynamic-methods.js";

/* eslint-disable no-unused-vars */
/**
 * Encryption algorithms supported
 */
export enum EncryptionAlgorithm {
  AES256 = "aes-256-cbc",
  AES192 = "aes-192-cbc",
  AES128 = "aes-128-cbc",
}

/**
 * Hash algorithms supported
 */
export enum HashAlgorithm {
  SHA256 = "sha256",
  SHA512 = "sha512",
  MD5 = "md5",
}

/**
 * Encrypted data structure
 */
export interface EncryptedData {
  algorithm: EncryptionAlgorithm;
  data: string;
  iv: string;
  salt: string;
}

/**
 * Static methods interface for Crypto ProtoObject classes
 */
export interface ProtoObjectCryptoStaticMethods<
  T extends ProtoObjectDynamicMethods<T>,
> {
  new (data?: Partial<T>): T;
  fromJSON<U extends ProtoObjectDynamicMethods<U>>(data: {
    [key: string]: unknown;
  }): U;
}
/* eslint-enable no-unused-vars */

/**
 * Base class for Crypto-enabled ProtoObjects
 */
export class ProtoObjectCrypto<
  T extends ProtoObjectDynamicMethods<T>,
> extends ProtoObject<T> {
  private _hash?: string;

  constructor(data?: Partial<T>) {
    super(data);
  }

  /**
   * Generate hash of the object
   * @param algorithm - Hash algorithm to use
   * @returns Hash string
   */
  generateHash(algorithm: HashAlgorithm = HashAlgorithm.SHA256): string {
    const data = JSON.stringify(this.toJSON());
    const hash = createHash(algorithm).update(data).digest("hex");
    this._hash = hash;
    return hash;
  }

  /**
   * Get stored hash
   * @returns Hash string or undefined
   */
  getHash(): string | undefined {
    return this._hash;
  }

  /**
   * Encrypt object data
   * @param password - Encryption password
   * @param algorithm - Encryption algorithm
   * @returns Encrypted data structure
   */
  encrypt(
    password: string,
    algorithm: EncryptionAlgorithm = EncryptionAlgorithm.AES256
  ): EncryptedData {
    const data = JSON.stringify(this.toJSON());
    const salt = randomBytes(16);
    const iv = randomBytes(16);

    // Derive key from password and salt
    const key = createHash("sha256")
      .update(password + salt.toString("hex"))
      .digest();

    const cipher = createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(data, "utf8", "hex");
    encrypted += cipher.final("hex");

    return {
      algorithm,
      data: encrypted,
      iv: iv.toString("hex"),
      salt: salt.toString("hex"),
    };
  }

  /**
   * Decrypt encrypted data
   * @param encryptedData - Encrypted data structure
   * @param password - Decryption password
   * @returns Decrypted object data
   */
  static decrypt(encryptedData: EncryptedData, password: string): any {
    const { algorithm, data, iv, salt } = encryptedData;

    // Derive key from password and salt
    const key = createHash("sha256")
      .update(password + salt)
      .digest();

    const decipher = createDecipheriv(algorithm, key, Buffer.from(iv, "hex"));
    let decrypted = decipher.update(data, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return JSON.parse(decrypted);
  }

  /**
   * Generate random salt for encryption
   * @param length - Salt length in bytes
   * @returns Hex string salt
   */
  static generateSalt(length: number = 16): string {
    return randomBytes(length).toString("hex");
  }

  /**
   * Verify hash of the object
   * @param expectedHash - Expected hash value
   * @param algorithm - Hash algorithm used
   * @returns True if hash matches
   */
  verifyHash(
    expectedHash: string,
    algorithm: HashAlgorithm = HashAlgorithm.SHA256
  ): boolean {
    const currentHash = this.generateHash(algorithm);
    return currentHash === expectedHash;
  }

  /**
   * Create encrypted backup of the object
   * @param password - Encryption password
   * @param algorithm - Encryption algorithm
   * @returns Encrypted backup data
   */
  createEncryptedBackup(
    password: string,
    algorithm: EncryptionAlgorithm = EncryptionAlgorithm.AES256
  ) {
    const hash = this.generateHash();
    const encrypted = this.encrypt(password, algorithm);

    return {
      hash,
      encrypted,
      timestamp: Date.now(),
      algorithm,
    };
  }
}
