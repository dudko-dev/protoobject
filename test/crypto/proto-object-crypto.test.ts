import { describe, it } from "node:test";
import { ok, equal, notEqual } from "node:assert";
import {
  ProtoObjectCrypto,
  EncryptionAlgorithm,
  HashAlgorithm,
} from "../../src/classes/proto-object-crypto.js";

// Test class for crypto operations
class TestCryptoObject extends ProtoObjectCrypto<TestCryptoObject> {
  public id?: string;
  public message?: string;
  public value?: number;

  constructor(data?: Partial<TestCryptoObject>) {
    super(data);
    if (data) this.assign(data);
  }

  public toJSON(): { [key: string]: any } {
    const result: { [key: string]: any } = {};

    if (this.id !== undefined) result.id = this.id;
    if (this.message !== undefined) result.message = this.message;
    if (this.value !== undefined) result.value = this.value;

    return result;
  }

  public static fromJSON<T>(data: { [key: string]: unknown }): T {
    return new TestCryptoObject({
      id: typeof data.id === "string" ? data.id : undefined,
      message: typeof data.message === "string" ? data.message : undefined,
      value: typeof data.value === "number" ? data.value : undefined,
    }) as T;
  }
}

describe("ProtoObjectCrypto", function () {
  it("should generate hash", async () => {
    const obj = new TestCryptoObject({
      id: "test-123",
      message: "Hello World",
      value: 42,
    });

    const hash = obj.generateHash();

    ok(typeof hash === "string");
    ok(hash.length > 0);
    equal(obj.getHash(), hash);
  });

  it("should verify hash", async () => {
    const obj = new TestCryptoObject({
      id: "test-456",
      message: "Test Message",
      value: 100,
    });

    const hash = obj.generateHash(HashAlgorithm.SHA256);

    ok(obj.verifyHash(hash, HashAlgorithm.SHA256));

    // Change data and verify hash doesn't match
    obj.value = 200;
    ok(!obj.verifyHash(hash, HashAlgorithm.SHA256));
  });

  it("should encrypt and decrypt data", async () => {
    const obj = new TestCryptoObject({
      id: "crypto-test",
      message: "Secret Message",
      value: 999,
    });

    const password = "super-secret-password";
    const encrypted = obj.encrypt(password, EncryptionAlgorithm.AES256);

    ok(encrypted.algorithm === EncryptionAlgorithm.AES256);
    ok(typeof encrypted.data === "string");
    ok(typeof encrypted.iv === "string");
    ok(typeof encrypted.salt === "string");

    // Decrypt and verify
    const decrypted = ProtoObjectCrypto.decrypt(encrypted, password);

    equal(decrypted.id, obj.id);
    equal(decrypted.message, obj.message);
    equal(decrypted.value, obj.value);
  });

  it("should create encrypted backup", async () => {
    const obj = new TestCryptoObject({
      id: "backup-test",
      message: "Backup Test",
      value: 777,
    });

    const password = "backup-password";
    const backup = obj.createEncryptedBackup(password);

    ok(typeof backup.hash === "string");
    ok(backup.encrypted);
    ok(typeof backup.timestamp === "number");
    ok(backup.algorithm === EncryptionAlgorithm.AES256);

    // Verify we can decrypt the backup
    const decrypted = ProtoObjectCrypto.decrypt(backup.encrypted, password);
    equal(decrypted.id, obj.id);
    equal(decrypted.message, obj.message);
    equal(decrypted.value, obj.value);
  });

  it("should generate salt", async () => {
    const salt1 = ProtoObjectCrypto.generateSalt();
    const salt2 = ProtoObjectCrypto.generateSalt(32);

    ok(typeof salt1 === "string");
    ok(typeof salt2 === "string");
    ok(salt1.length === 32); // 16 bytes = 32 hex chars
    ok(salt2.length === 64); // 32 bytes = 64 hex chars
    notEqual(salt1, salt2);
  });
});
