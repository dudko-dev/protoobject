import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { ProtoObject } from "./proto-object.js";
import { ProtoObjectStaticMethods } from "../types/static-methods.js";
import { StaticImplements } from "../decorators/static-implements.js";

/* eslint-disable no-unused-vars, @typescript-eslint/no-shadow */
export enum RecordState {
  ACTIVE,
  DELETED,
}

export interface ProtoObjectSQLiteBase {
  id?: string;
  created_at?: Date;
  updated_at?: Date;
  record_state?: RecordState;
}

export interface ProtoObjectSQLiteStaticMethods<T extends ProtoObjectSQLite<T>>
  extends ProtoObjectStaticMethods<T> {
  table: string;
  primaryKey: string;
  getById<T extends ProtoObjectSQLite<T>>(
    db: DatabaseSync,
    id: string
  ): Promise<T | undefined>;
  findBy<T extends ProtoObjectSQLite<T>>(
    db: DatabaseSync,
    criteria: Partial<T>
  ): Promise<T[]>;
  findOneBy<T extends ProtoObjectSQLite<T>>(
    db: DatabaseSync,
    criteria: Partial<T>
  ): Promise<T | undefined>;
  count<T extends ProtoObjectSQLite<T>>(
    db: DatabaseSync,
    criteria?: Partial<T>
  ): Promise<number>;
  createTable(db: DatabaseSync): Promise<void>;
  dropTable(db: DatabaseSync): Promise<void>;
}
/* eslint-enable no-unused-vars, @typescript-eslint/no-shadow */

/**
 * A universal class for creating ProtoObject entities with SQLite integration
 * Extends ProtoObject with database operations using node:sqlite
 */
@StaticImplements<ProtoObjectSQLiteStaticMethods<ProtoObjectSQLite<any>>>()
export class ProtoObjectSQLite<
  T extends ProtoObjectSQLite<T>,
> extends ProtoObject<T> {
  constructor(data?: Partial<T>) {
    super(data);

    // Auto-initialize common fields if not provided
    if (typeof (this as any).record_state === "undefined") {
      (this as any).record_state = RecordState.ACTIVE;
    }
    if (!(this as any).id) {
      (this as any).id = randomUUID();
    }
    const now = new Date();
    if (!(this as any).created_at) {
      (this as any).created_at = now;
    }
    if (!(this as any).updated_at) {
      (this as any).updated_at = now;
    }

    return this;
  }

  // Default table name - should be overridden in subclasses
  public static table = "proto_objects";

  // Default primary key - can be overridden if needed
  public static primaryKey = "id";

  /**
   * Find record by ID
   */
  public static async getById<T extends ProtoObjectSQLite<T>>(
    db: DatabaseSync,
    id: string
  ): Promise<T | undefined> {
    try {
      const record = db
        .prepare(`SELECT * FROM ${this.table} WHERE ${this.primaryKey} = ?`)
        .get(id) as Partial<T>;
      return record ? this.fromJSON<T>(record) : undefined;
    } catch (error) {
      console.error(`Error getting record by ID: ${error}`);
      return undefined;
    }
  }

  /**
   * Find records by criteria
   */
  public static async findBy<T extends ProtoObjectSQLite<T>>(
    db: DatabaseSync,
    criteria: Partial<T>
  ): Promise<T[]> {
    try {
      const whereClause = Object.keys(criteria)
        .map((key) => `${key} = ?`)
        .join(" AND ");

      const sql = whereClause
        ? `SELECT * FROM ${this.table} WHERE ${whereClause}`
        : `SELECT * FROM ${this.table}`;

      const records = db
        .prepare(sql)
        .all(...Object.values(criteria)) as Partial<T>[];

      return records.map((record) => this.fromJSON<T>(record));
    } catch (error) {
      console.error(`Error finding records: ${error}`);
      return [];
    }
  }

  /**
   * Find one record by criteria
   */
  public static async findOneBy<T extends ProtoObjectSQLite<T>>(
    db: DatabaseSync,
    criteria: Partial<T>
  ): Promise<T | undefined> {
    const results = await this.findBy<T>(db, criteria);
    return results[0];
  }

  /**
   * Count records matching criteria
   */
  public static async count<T extends ProtoObjectSQLite<T>>(
    db: DatabaseSync,
    criteria?: Partial<T>
  ): Promise<number> {
    try {
      if (!criteria || Object.keys(criteria).length === 0) {
        const result = db
          .prepare(`SELECT COUNT(*) as count FROM ${this.table}`)
          .get() as { count: number };
        return result.count;
      }

      const whereClause = Object.keys(criteria)
        .map((key) => `${key} = ?`)
        .join(" AND ");

      const result = db
        .prepare(
          `SELECT COUNT(*) as count FROM ${this.table} WHERE ${whereClause}`
        )
        .get(...Object.values(criteria)) as { count: number };

      return result.count;
    } catch (error) {
      console.error(`Error counting records: ${error}`);
      return 0;
    }
  }

  /**
   * Create table for this entity
   * Override in subclasses to define custom schema
   */
  public static async createTable(db: DatabaseSync): Promise<void> {
    const sql = `
      CREATE TABLE IF NOT EXISTS ${this.table} (
        id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        record_state INTEGER NOT NULL DEFAULT 0
      )
    `;
    db.prepare(sql).run();
  }

  /**
   * Drop table for this entity
   */
  public static async dropTable(db: DatabaseSync): Promise<void> {
    db.prepare(`DROP TABLE IF EXISTS ${this.table}`).run();
  }

  /**
   * Reload current instance from database
   */
  public async reload(db: DatabaseSync): Promise<T> {
    if (!(this as any).id) {
      throw new Error("Cannot reload record without ID");
    }
    const classNode = this.constructor as ProtoObjectSQLiteStaticMethods<T>;
    const dbRecord = await classNode.getById<T>(db, (this as any).id);
    if (!dbRecord) {
      throw new Error(`Record with ID ${(this as any).id} not found`);
    }
    return this.assign(dbRecord);
  }

  /**
   * Save (insert or update) record to database
   */
  public async save(db: DatabaseSync): Promise<T> {
    if (!(this as any).id) {
      throw new Error("Cannot save record without ID");
    }
    const classNode = this.constructor as ProtoObjectSQLiteStaticMethods<T>;
    const existing = await classNode.getById<T>(db, (this as any).id);

    if (existing) {
      return this.update(db);
    } else {
      return this.insert(db);
    }
  }

  /**
   * Insert new record
   */
  public async insert(db: DatabaseSync): Promise<T> {
    const classNode = this.constructor as ProtoObjectSQLiteStaticMethods<T>;
    (this as any).created_at = new Date();
    (this as any).updated_at = new Date();

    const jsonData = this.toJSON();

    // Filter out undefined and null values
    const validData: { [key: string]: any } = {};
    Object.entries(jsonData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        validData[key] = value;
      }
    });

    if (Object.keys(validData).length === 0) {
      throw new Error("No valid data to insert");
    }

    const columns = Object.keys(validData);
    const placeholders = columns.map(() => "?").join(", ");

    const sql = `INSERT INTO ${classNode.table} (${columns.join(", ")}) VALUES (${placeholders})`;

    try {
      db.prepare(sql).run(...Object.values(validData));
      return this as unknown as T;
    } catch (error) {
      console.error(`Error inserting record: ${error}`);
      throw error;
    }
  }

  /**
   * Update existing record
   */
  public async update(db: DatabaseSync): Promise<T> {
    if (!(this as any).id) {
      throw new Error("Cannot update record without ID");
    }
    const classNode = this.constructor as ProtoObjectSQLiteStaticMethods<T>;
    (this as any).updated_at = new Date();

    const jsonData = this.toJSON();
    delete jsonData[classNode.primaryKey];

    const setClause = Object.keys(jsonData)
      .map((key) => `${key} = ?`)
      .join(", ");

    const sql = `UPDATE ${classNode.table} SET ${setClause} WHERE ${classNode.primaryKey} = ?`;

    try {
      db.prepare(sql).run(...Object.values(jsonData), (this as any).id);
      return this as unknown as T;
    } catch (error) {
      console.error(`Error updating record: ${error}`);
      throw error;
    }
  }

  /**
   * Soft delete (mark as deleted)
   */
  public async softDelete(db: DatabaseSync): Promise<T> {
    (this as any).record_state = RecordState.DELETED;
    return this.update(db);
  }

  /**
   * Hard delete (remove from database)
   */
  public async delete(db: DatabaseSync): Promise<void> {
    if (!(this as any).id) {
      throw new Error("Cannot delete record without ID");
    }
    const classNode = this.constructor as ProtoObjectSQLiteStaticMethods<T>;

    try {
      db.prepare(
        `DELETE FROM ${classNode.table} WHERE ${classNode.primaryKey} = ?`
      ).run((this as any).id);
    } catch (error) {
      console.error(`Error deleting record: ${error}`);
      throw error;
    }
  }

  /**
   * Check if record exists in database
   */
  public async exists(db: DatabaseSync): Promise<boolean> {
    if (!(this as any).id) {
      return false;
    }
    const classNode = this.constructor as ProtoObjectSQLiteStaticMethods<T>;
    const existing = await classNode.getById<T>(db, (this as any).id);
    return !!existing;
  }

  /**
   * Enhanced fromJSON with Date parsing
   */
  public static fromJSON<T>(data: { [key: string]: unknown }): T {
    const instance = new this() as any;
    Object.assign(instance, super.fromJSON(data));

    if (typeof data.created_at === "string") {
      instance.created_at = new Date(data.created_at);
    }
    if (typeof data.updated_at === "string") {
      instance.updated_at = new Date(data.updated_at);
    }

    return instance as T;
  }

  /**
   * Enhanced toJSON with Date serialization
   */
  public toJSON(): { [key: string]: any } {
    const baseData = super.toJSON();
    const result: { [key: string]: any } = { ...baseData };

    if ((this as any).created_at !== undefined)
      result.created_at = (this as any).created_at.toJSON();
    if ((this as any).updated_at !== undefined)
      result.updated_at = (this as any).updated_at.toJSON();

    return result;
  }
}
