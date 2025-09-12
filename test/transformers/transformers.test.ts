import { describe, it } from "node:test";
import { deepEqual } from "node:assert";
import { protoObjectFactory } from "../../src";

// Test class implementation using factory instead of inheritance
const User = protoObjectFactory({
  fromJSON(data: { [key: string]: unknown }) {
    return new (this as any)({
      id: data.id as string,
      name: data.name as string,
      email: data.email as string,
    });
  },
  toJSON() {
    return {
      id: (this as any).id,
      name: (this as any).name,
      email: (this as any).email,
    };
  },
});

describe("ProtoObject Transformers", () => {
  const testUsers = [
    { id: "1", name: "John", email: "john@example.com" },
    { id: "2", name: "Jane", email: "jane@example.com" },
    { id: "3", name: "Bob", email: "bob@example.com" },
  ];

  it("recordTransformer should transform single object to/from JSON", () => {
    const transformer = User.recordTransformer({});

    const user = new User(testUsers[0]);

    // Transform to JSON
    const json = transformer.to(user);
    deepEqual(
      json,
      {
        id: "1",
        name: "John",
        email: "john@example.com",
      },
      "Object should be transformed to JSON correctly"
    );

    // Transform from JSON
    const userFromJson = transformer.from(json);
    deepEqual(
      userFromJson?.toJSON(),
      user.toJSON(),
      "Object should be restored from JSON correctly"
    );
  });

  it("recordTransformer should handle validation", () => {
    const transformer = User.recordTransformer({});

    const validUser = new User(testUsers[0]);

    // Valid object should transform
    const validJson = transformer.to(validUser);
    deepEqual(validJson, testUsers[0], "Valid object should transform");

    // Valid JSON should transform back
    const userFromValidJson = transformer.from(testUsers[0]);
    deepEqual(
      userFromValidJson?.toJSON(),
      testUsers[0],
      "Valid JSON should transform back"
    );
  });

  it("collectionTransformer should transform array of objects to/from JSON", () => {
    const transformer = User.collectionTransformer({});

    const users = testUsers.map((data) => new User(data));

    // Transform to JSON array
    const jsonArray = transformer.to(users);
    deepEqual(
      jsonArray,
      testUsers,
      "Array should be transformed to JSON correctly"
    );

    // Transform from JSON array
    const usersFromJson = transformer.from(jsonArray);
    const usersJsonData = usersFromJson?.map((u) => u.toJSON());
    deepEqual(
      usersJsonData,
      testUsers,
      "Array should be restored from JSON correctly"
    );
  });

  it("collectionTransformer should handle validation", () => {
    const transformer = User.collectionTransformer({});

    const users = [new User(testUsers[0]), new User(testUsers[1])];

    // Should filter out invalid objects
    const jsonArray = transformer.to(users);
    deepEqual(
      jsonArray,
      [testUsers[0], testUsers[1]],
      "Should filter out valid objects"
    );

    // Should handle valid JSON
    const usersFromJson = transformer.from([testUsers[0], testUsers[1]]);
    deepEqual(usersFromJson?.length, 2, "Should handle valid JSON");
    deepEqual(
      usersFromJson?.[0]?.toJSON(),
      testUsers[0],
      "First user should be valid"
    );
    deepEqual(
      usersFromJson?.[1]?.toJSON(),
      testUsers[1],
      "Second user should be valid"
    );
  });

  it("collectionTransformer should handle non-array input", () => {
    const transformer = User.collectionTransformer({});

    // Non-array input should return undefined
    deepEqual(
      transformer.to("not an array"),
      undefined,
      "Non-array to() should return undefined"
    );
    deepEqual(
      transformer.from("not an array"),
      undefined,
      "Non-array from() should return undefined"
    );
    deepEqual(
      transformer.to(null),
      undefined,
      "Null to() should return undefined"
    );
    deepEqual(
      transformer.from(null),
      undefined,
      "Null from() should return undefined"
    );
  });
});
