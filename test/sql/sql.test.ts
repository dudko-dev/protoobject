"use strict";
import { describe, it } from "node:test";
import { deepEqual, equal } from "node:assert";
import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import { ApplicationRecord } from "./example-heir-class";
import { BaseRecord, RecordState } from "./example-base-class";

describe("Equivalence check", function () {
  const db = new DatabaseSync(":memory:");
  db.prepare(
    `CREATE TABLE IF NOT EXISTS "applications" (
	"id" VARCHAR(36) PRIMARY KEY,
	"api_key" VARCHAR(36) NOT NULL DEFAULT "",
	"app_name" VARCHAR(255) NOT NULL DEFAULT "",
	"app_params" VARCHAR(8000) NOT NULL,
	"created_at" VARCHAR(30) NOT NULL DEFAULT "1970-01-01T00:00:00.000Z",
	"updated_at" VARCHAR(30) NOT NULL DEFAULT "1970-01-01T00:00:00.000Z",
	"record_state" INTEGER NOT NULL DEFAULT 0
);`
  ).run();
  it("Basic field verification", async () => {
    const data: Partial<ApplicationRecord> = {
      app_name: "ProtoObject Test App",
      app_params: {
        string: "test",
        number: 1,
        boolean: true,
        null: null,
      },
    };
    const appRecord = new ApplicationRecord(data);
    equal(
      appRecord instanceof ApplicationRecord,
      true,
      `appRecord must be instance of ApplicationRecord`
    );
    equal(
      appRecord instanceof BaseRecord,
      true,
      `appRecord must be instance of BaseRecord`
    );
    equal(typeof appRecord.id, "string", `appRecord.id must be a string`);
    equal(
      typeof appRecord.api_key,
      "string",
      `appRecord.api_key must be a string`
    );
    equal(
      appRecord.app_name,
      data.app_name,
      `appRecord.app_name and data.app_name must equal`
    );
    deepEqual(
      appRecord.app_params,
      data.app_params,
      `appRecord.app_params and data.app_params must equal`
    );
    equal(
      appRecord.created_at instanceof Date,
      true,
      `appRecord.created_at must be instance of Date`
    );
    equal(
      appRecord.updated_at instanceof Date,
      true,
      `appRecord.updated_at must be instance of Date`
    );
    equal(
      appRecord.record_state,
      RecordState.ACTIVE,
      `appRecord.record_state and RecordState.ACTIVE must equal`
    );
  });
  it("Insert and getById verification (base)", async () => {
    const data: Partial<ApplicationRecord> = {
      id: randomUUID(),
      app_name: "ProtoObject Test App",
      app_params: {
        string: "test",
        number: 1,
        boolean: true,
        null: null,
      },
    };
    await new ApplicationRecord(data).insert(db);
    const appRecord = await ApplicationRecord.getById<ApplicationRecord>(
      db,
      data.id as string
    );
    equal(
      appRecord instanceof ApplicationRecord,
      true,
      `appRecord must be instance of ApplicationRecord`
    );
    equal(
      appRecord instanceof BaseRecord,
      true,
      `appRecord must be instance of BaseRecord`
    );
    equal(typeof appRecord?.id, "string", `appRecord.id must be a string`);
    equal(
      typeof appRecord?.api_key,
      "string",
      `appRecord.api_key must be a string`
    );
    equal(
      appRecord?.app_name,
      data.app_name,
      `appRecord.app_name and data.app_name must equal`
    );
    deepEqual(
      appRecord?.app_params,
      data.app_params,
      `appRecord.app_params and data.app_params must equal`
    );
    equal(
      appRecord?.created_at instanceof Date,
      true,
      `appRecord.created_at must be instance of Date`
    );
    equal(
      appRecord?.updated_at instanceof Date,
      true,
      `appRecord.updated_at must be instance of Date`
    );
    equal(
      appRecord?.record_state,
      RecordState.ACTIVE,
      `appRecord.record_state and RecordState.ACTIVE must equal`
    );
  });
  it("Insert and getById verification (equals)", async () => {
    const data: Partial<ApplicationRecord> = {
      id: randomUUID(),
      app_name: "ProtoObject Test App",
      app_params: {
        string: "test",
        number: 1,
        boolean: true,
        null: null,
      },
    };
    const appRecord1 = new ApplicationRecord(data);
    await appRecord1.insert(db);
    const appRecord2 = await ApplicationRecord.getById<ApplicationRecord>(
      db,
      data.id as string
    );
    equal(appRecord2?.id, data.id, `appRecord2.id and data.id must equal`);
    equal(
      appRecord2?.api_key,
      appRecord1.api_key,
      `appRecord2.api_key and appRecord1.api_key must equal`
    );
    equal(
      appRecord2?.app_name,
      data.app_name,
      `appRecord2.app_name and data.app_name must equal`
    );
    deepEqual(
      appRecord2?.app_params,
      data.app_params,
      `appRecord2.app_params and data.app_params must equal`
    );
    equal(
      appRecord2?.created_at.toJSON(),
      appRecord1.created_at.toJSON(),
      `appRecord2.created_at and appRecord1.created_at must equal`
    );
    equal(
      appRecord2?.updated_at.toJSON(),
      appRecord1.updated_at.toJSON(),
      `appRecord2.updated_at and appRecord1.updated_at must equal`
    );
    equal(
      appRecord2?.record_state,
      appRecord1.record_state,
      `appRecord2.record_state and appRecord1.record_state must equal`
    );
  });
  it("Update verification", async () => {
    const data: Partial<ApplicationRecord> = {
      id: randomUUID(),
      app_name: "ProtoObject Test App",
      app_params: {
        string: "test",
        number: 1,
        boolean: true,
        null: null,
      },
    };
    const data2: Partial<ApplicationRecord> = {
      app_name: "ProtoObject Test App 2",
      app_params: {
        param: "test",
      },
    };
    const appRecord1 = new ApplicationRecord(data);
    await appRecord1.insert(db);
    await appRecord1.assign(data2).update(db);
    const appRecord2 = await ApplicationRecord.getById<ApplicationRecord>(
      db,
      data.id as string
    );
    equal(appRecord2?.id, data.id, `appRecord2.id and data.id must equal`);
    equal(
      appRecord2?.api_key,
      appRecord1.api_key,
      `appRecord2.api_key and appRecord1.api_key must equal`
    );
    equal(
      appRecord2?.app_name,
      data2.app_name,
      `appRecord2.app_name and data2.app_name must equal`
    );
    deepEqual(
      appRecord2?.app_params,
      { ...data?.app_params, ...data2?.app_params },
      `appRecord2.app_params and appRecord1.app_params must equal`
    );
    equal(
      appRecord2?.created_at.toJSON(),
      appRecord1.created_at.toJSON(),
      `appRecord2.created_at and appRecord1.created_at must equal`
    );
    equal(
      appRecord2?.updated_at.toJSON(),
      appRecord1.updated_at.toJSON(),
      `appRecord2.updated_at and appRecord1.updated_at must equal`
    );
    equal(
      appRecord2?.record_state,
      appRecord1.record_state,
      `appRecord2.record_state and appRecord1.record_state must equal`
    );
  });
  it("Soft delete verification", async () => {
    const data: Partial<ApplicationRecord> = {
      id: randomUUID(),
      app_name: "ProtoObject Test App",
      app_params: {
        string: "test",
        number: 1,
        boolean: true,
        null: null,
      },
    };
    const appRecord1 = new ApplicationRecord(data);
    await appRecord1.insert(db);
    await appRecord1.softDelete(db);
    const appRecord2 = await ApplicationRecord.getById<ApplicationRecord>(
      db,
      data.id as string
    );
    equal(appRecord2?.id, data.id, `appRecord2.id and data.id must equal`);
    equal(
      appRecord2?.api_key,
      appRecord1.api_key,
      `appRecord2.api_key and appRecord1.api_key must equal`
    );
    equal(
      appRecord2?.app_name,
      data.app_name,
      `appRecord2.app_name and data.app_name must equal`
    );
    deepEqual(
      appRecord2?.app_params,
      data?.app_params,
      `appRecord2.app_params and data.app_params must equal`
    );
    equal(
      appRecord2?.created_at.toJSON(),
      appRecord1.created_at.toJSON(),
      `appRecord2.created_at and appRecord1.created_at must equal`
    );
    equal(
      appRecord2?.updated_at.toJSON(),
      appRecord1.updated_at.toJSON(),
      `appRecord2.updated_at and appRecord1.updated_at must equal`
    );
    equal(
      appRecord2?.record_state,
      RecordState.DELETED,
      `appRecord2.record_state and RecordState.DELETED must equal`
    );
  });
  it("Hard delete verification", async () => {
    const data: Partial<ApplicationRecord> = {
      id: randomUUID(),
      app_name: "ProtoObject Test App",
      app_params: {
        string: "test",
        number: 1,
        boolean: true,
        null: null,
      },
    };
    const appRecord1 = new ApplicationRecord(data);
    await appRecord1.insert(db);
    await appRecord1.delete(db);
    const appRecord2 = await ApplicationRecord.getById<ApplicationRecord>(
      db,
      data.id as string
    );
    equal(appRecord2, undefined, `appRecord2 must be equal undefined`);
  });
});
