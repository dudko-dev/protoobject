import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import {
  ProtoObject,
  ProtoObjectStaticMethods,
  StaticImplements,
} from "../../src/index.js";

export enum RecordState {
  ACTIVE,
  DELETED,
}

export interface BaseRecordStaticMethods<T extends BaseRecord<T>>
  extends ProtoObjectStaticMethods<T> {
  table: string;
  getById<T extends BaseRecord<T>>(
    db: DatabaseSync,
    id: BaseRecord<T>["id"]
  ): Promise<T | undefined>;
}

@StaticImplements<BaseRecordStaticMethods<BaseRecord<any>>>()
export class BaseRecord<T extends BaseRecord<T>> extends ProtoObject<T> {
  constructor(data?: Partial<T>) {
    super(data);
    if (data) this.assign(data);
    if (typeof this.record_state === "undefined")
      this.record_state = RecordState.ACTIVE;
    if (!this.id) this.id = randomUUID();
    const dt = new Date();
    if (!this.created_at) this.created_at = dt;
    if (!this.updated_at) this.updated_at = dt;
    return this;
  }

  public static table = `base`;

  public id!: string;

  public created_at!: Date;

  public updated_at!: Date;

  public record_state!: RecordState;

  public static async getById<T extends BaseRecord<T>>(
    db: DatabaseSync,
    id: BaseRecord<T>["id"]
  ): Promise<T | undefined> {
    const dbRecord = (await db
      .prepare(`SELECT * FROM ${this.table} WHERE id = ?`)
      .get(id)) as Partial<T>;
    return dbRecord ? this.fromJSON<T>(dbRecord) : undefined;
  }

  public async reload(db: DatabaseSync): Promise<T> {
    const classNode = this.constructor as BaseRecordStaticMethods<T>;
    const dbRecord = await classNode.getById<T>(db, this.id);
    if (!dbRecord) throw new Error("Not Found");
    return this.assign(classNode.fromJSON(dbRecord));
  }

  public async insert(db: DatabaseSync): Promise<void> {
    const classNode = this.constructor as BaseRecordStaticMethods<T>;
    this.created_at = new Date();
    this.updated_at = new Date();
    const jsonData = this.toJSON();
    await Promise.resolve(
      db
        .prepare(
          `INSERT INTO ${classNode.table} (${Object.keys(jsonData).join(", ")}) VALUES (${Object.keys(
            jsonData
          )
            .map((e, i) => `?`)
            .join(", ")})`
        )
        .run(...Object.values(jsonData))
    );
    return;
  }

  public async update(db: DatabaseSync): Promise<void> {
    const classNode = this.constructor as BaseRecordStaticMethods<T>;
    this.updated_at = new Date();
    const jsonData = this.toJSON();
    delete jsonData.id;
    await Promise.resolve(
      db
        .prepare(
          `UPDATE ${classNode.table} SET ${Object.keys(jsonData)
            .map((e, i) => `${e} = ?`)
            .join(", ")} WHERE id = ?`
        )
        .run(...Object.values(jsonData), this.id)
    );
    return;
  }

  public async softDelete(db: DatabaseSync): Promise<void> {
    this.record_state = RecordState.DELETED;
    this.updated_at = new Date();
    await this.update(db);
    return;
  }

  public async delete(db: DatabaseSync): Promise<void> {
    const classNode = this.constructor as BaseRecordStaticMethods<T>;
    const jsonData = this.toJSON();
    delete jsonData.id;
    await Promise.resolve(
      db.prepare(`DELETE FROM ${classNode.table} WHERE id = ?`).run(this.id)
    );
    return;
  }

  public static fromJSON<T>(data: { [key: string]: unknown }) {
    return new this({
      ...super.fromJSON(data),
      created_at:
        typeof data.created_at === "string"
          ? new Date(data.created_at)
          : undefined,
      updated_at:
        typeof data.updated_at === "string"
          ? new Date(data.updated_at)
          : undefined,
    }) as T;
  }

  public toJSON(): { [key: string]: any } {
    return {
      ...super.toJSON.call(this),
      created_at: this.created_at?.toJSON(),
      updated_at: this.updated_at?.toJSON(),
    };
  }
}
