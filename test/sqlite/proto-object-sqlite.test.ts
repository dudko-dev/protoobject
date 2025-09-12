import { describe, it } from "node:test";
import { equal, ok } from "node:assert";
import { DatabaseSync } from "node:sqlite";
import { ProtoObjectSQLite, RecordState, StaticImplements } from "../../src";
import { ProtoObjectSQLiteStaticMethods } from "../../src/classes/proto-object-sqlite";

// Test entity classes
@StaticImplements<ProtoObjectSQLiteStaticMethods<User>>()
class User extends ProtoObjectSQLite<User> {
  constructor(data?: Partial<User>) {
    super(data);
    if (data) this.assign(data);
    return this;
  }

  public static override table = "users";

  public name!: string;
  public email!: string;
  public age?: number;

  public static async createTable(db: DatabaseSync): Promise<void> {
    const sql = `
      CREATE TABLE IF NOT EXISTS ${this.table} (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        age INTEGER,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        record_state INTEGER NOT NULL DEFAULT 0
      )
    `;
    db.prepare(sql).run();
  }

  public toJSON(): { [key: string]: any } {
    const baseData = super.toJSON();
    const result: { [key: string]: any } = { ...baseData };

    if (this.name !== undefined) result.name = this.name;
    if (this.email !== undefined) result.email = this.email;
    if (this.age !== undefined) result.age = this.age;

    return result;
  }

  public static fromJSON<T>(data: { [key: string]: unknown }): T {
    return new User({
      ...super.fromJSON(data),
      name: typeof data.name === "string" ? data.name : undefined,
      email: typeof data.email === "string" ? data.email : undefined,
      age: typeof data.age === "number" ? data.age : undefined,
    }) as T;
  }
}

@StaticImplements<ProtoObjectSQLiteStaticMethods<Profile>>()
class Profile extends ProtoObjectSQLite<Profile> {
  constructor(data?: Partial<Profile>) {
    super(data);
    if (data) this.assign(data);
    return this;
  }

  public static override table = "profiles";

  public user_id!: string;
  public bio?: string;
  public avatar_url?: string;

  public static async createTable(db: DatabaseSync): Promise<void> {
    const sql = `
      CREATE TABLE IF NOT EXISTS ${this.table} (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        bio TEXT,
        avatar_url TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        record_state INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `;
    db.prepare(sql).run();
  }

  public toJSON(): { [key: string]: any } {
    const baseData = super.toJSON();
    const result: { [key: string]: any } = { ...baseData };

    if (this.user_id !== undefined) result.user_id = this.user_id;
    if (this.bio !== undefined) result.bio = this.bio;
    if (this.avatar_url !== undefined) result.avatar_url = this.avatar_url;

    return result;
  }

  public static fromJSON<T>(data: { [key: string]: unknown }): T {
    return new Profile({
      ...super.fromJSON(data),
      user_id: typeof data.user_id === "string" ? data.user_id : undefined,
      bio: typeof data.bio === "string" ? data.bio : undefined,
      avatar_url:
        typeof data.avatar_url === "string" ? data.avatar_url : undefined,
    }) as T;
  }
}

describe("ProtoObjectSQLite Tests", function () {
  let db: DatabaseSync;

  // Setup in-memory database for each test
  function setupDatabase() {
    db = new DatabaseSync(":memory:");
    User.createTable(db);
    Profile.createTable(db);
  }

  function teardownDatabase() {
    if (db) {
      db.close();
    }
  }

  it("should create and setup tables", async () => {
    setupDatabase();

    // Tables should exist after creation
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table'")
      .all();
    const tableNames = tables.map((t: any) => t.name);

    ok(tableNames.includes("users"));
    ok(tableNames.includes("profiles"));

    teardownDatabase();
  });

  it("should insert and retrieve records", async () => {
    setupDatabase();

    const user = new User({
      name: "John Doe",
      email: "john@example.com",
      age: 30,
    });

    // Insert user
    await user.insert(db);

    // Retrieve by ID
    const retrievedUser = await User.getById<User>(db, user.id);
    ok(retrievedUser);
    equal(retrievedUser.name, "John Doe");
    equal(retrievedUser.email, "john@example.com");
    equal(retrievedUser.age, 30);
    equal(retrievedUser.record_state, RecordState.ACTIVE);

    teardownDatabase();
  });

  it("should update records", async () => {
    setupDatabase();

    const user = new User({
      name: "Jane Doe",
      email: "jane@example.com",
      age: 25,
    });

    await user.insert(db);

    // Add small delay to ensure different timestamps
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Update user
    user.name = "Jane Smith";
    user.age = 26;
    await user.update(db);

    // Verify update
    const updated = await User.getById<User>(db, user.id);
    ok(updated);
    equal(updated.name, "Jane Smith");
    equal(updated.age, 26);
    ok(updated.updated_at > updated.created_at);

    teardownDatabase();
  });

  it("should find records by criteria", async () => {
    setupDatabase();

    // Create multiple users
    const user1 = new User({
      name: "Alice",
      email: "alice@example.com",
      age: 20,
    });
    const user2 = new User({ name: "Bob", email: "bob@example.com", age: 30 });
    const user3 = new User({
      name: "Charlie",
      email: "charlie@example.com",
      age: 20,
    });

    await user1.insert(db);
    await user2.insert(db);
    await user3.insert(db);

    // Find by age
    const twentyYearOlds = await User.findBy<User>(db, { age: 20 });
    equal(twentyYearOlds.length, 2);

    // Find by name
    const alice = await User.findOneBy<User>(db, { name: "Alice" });
    ok(alice);
    equal(alice.email, "alice@example.com");

    teardownDatabase();
  });

  it("should count records", async () => {
    setupDatabase();

    // Initially no records
    const initialCount = await User.count<User>(db);
    equal(initialCount, 0);

    // Add some records
    await new User({ name: "User 1", email: "user1@example.com" }).insert(db);
    await new User({ name: "User 2", email: "user2@example.com" }).insert(db);

    // Count all
    const totalCount = await User.count<User>(db);
    equal(totalCount, 2);

    teardownDatabase();
  });

  it("should soft delete records", async () => {
    setupDatabase();

    const user = new User({
      name: "To Delete",
      email: "delete@example.com",
    });

    await user.insert(db);
    equal(user.record_state, RecordState.ACTIVE);

    // Soft delete
    await user.softDelete(db);
    equal(user.record_state, RecordState.DELETED);

    // Record should still exist in database
    const deleted = await User.getById<User>(db, user.id);
    ok(deleted);
    equal(deleted.record_state, RecordState.DELETED);

    teardownDatabase();
  });

  it("should hard delete records", async () => {
    setupDatabase();

    const user = new User({
      name: "To Remove",
      email: "remove@example.com",
    });

    await user.insert(db);

    // Verify exists
    ok(await user.exists(db));

    // Hard delete
    await user.delete(db);

    // Record should not exist
    const deleted = await User.getById<User>(db, user.id);
    equal(deleted, undefined);

    teardownDatabase();
  });

  it("should work with related entities", async () => {
    setupDatabase();

    // Create user
    const user = new User({
      name: "Profile User",
      email: "profile@example.com",
    });
    await user.insert(db);

    // Create profile
    const profile = new Profile({
      user_id: user.id,
      bio: "This is my bio",
      avatar_url: "https://example.com/avatar.jpg",
    });
    await profile.insert(db);

    // Retrieve profile
    const retrievedProfile = await Profile.getById<Profile>(db, profile.id);
    ok(retrievedProfile);
    equal(retrievedProfile.user_id, user.id);
    equal(retrievedProfile.bio, "This is my bio");

    // Find profile by user_id
    const userProfile = await Profile.findOneBy<Profile>(db, {
      user_id: user.id,
    });
    ok(userProfile);
    equal(userProfile.id, profile.id);

    teardownDatabase();
  });

  it("should handle save method (insert or update)", async () => {
    setupDatabase();

    const user = new User({
      name: "Save Test",
      email: "save@example.com",
    });

    // First save should insert
    await user.save(db);
    const inserted = await User.getById<User>(db, user.id);
    ok(inserted);

    // Modify and save again should update
    user.name = "Save Test Updated";
    await user.save(db);

    const updated = await User.getById<User>(db, user.id);
    ok(updated);
    equal(updated.name, "Save Test Updated");

    teardownDatabase();
  });

  it("should serialize and deserialize correctly", async () => {
    setupDatabase();

    const originalUser = new User({
      name: "Serialize Test",
      email: "serialize@example.com",
      age: 35,
    });

    await originalUser.insert(db);

    // Serialize to JSON
    const json = originalUser.toJSON();
    ok(json.id);
    ok(json.created_at);
    ok(json.updated_at);
    equal(json.name, "Serialize Test");
    equal(json.age, 35);

    // Deserialize from JSON
    const deserialized = User.fromJSON<User>(json);
    equal(deserialized.name, originalUser.name);
    equal(deserialized.email, originalUser.email);
    equal(deserialized.age, originalUser.age);
    equal(deserialized.id, originalUser.id);

    teardownDatabase();
  });
});
