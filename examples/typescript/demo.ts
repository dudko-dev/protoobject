import { ProtoObject, protoObjectFactory } from "protoobject";
import { User, UserAddress, UserRights } from "./user-classes";

console.log("🚀 ProtoObject TypeScript Example\n");

// 1. Create user address with type safety
const address = new UserAddress({
  country: "USA",
  postCode: "10001",
});

// 2. Create user rights using factory with interface
const rights = UserRights.fromJSON({
  isAdmin: true,
  updatedAt: new Date().toJSON(),
});

// 3. Create user with full type safety
const user = new User({
  id: "user-456",
  email: "jane@example.com",
  createdAt: new Date(),
  photo: Buffer.from("typescript-example-data", "utf8"),
  address: address,
  rights: rights,
});

console.log("✅ Created user:", user.constructor.name);
console.log("📧 Email:", user.email);
console.log(
  "🏠 Address:",
  `${user.address?.country}, ${user.address?.postCode}`
);
console.log("🔐 Admin rights:", user.rights?.isAdmin);

// 4. Serialize to JSON with type safety
const jsonData: { [key: string]: any } = user.toJSON();
console.log("\n📄 Serialized to JSON:");
console.log(JSON.stringify(jsonData, null, 2));

// 5. Deserialize from JSON with types
const userFromJson = User.fromJSON<User>(jsonData);
console.log("\n♻️  Deserialized from JSON:");
console.log("📧 Email:", userFromJson.email);
console.log("📅 Created:", userFromJson.createdAt.toISOString());

// 6. Copy object with type preservation
const userCopy = user.copy();
console.log("\n📋 Copied user:");
console.log("✅ Different instances:", user !== userCopy);
console.log(
  "✅ Same data:",
  JSON.stringify(user.toJSON()) === JSON.stringify(userCopy.toJSON())
);

// 7. Demonstrate type safety
const typedUser: User = user; // TypeScript ensures type safety
console.log("\n🔒 Type-safe access:");
console.log("📧 Email (typed):", typedUser.email);
// console.log(typedUser.nonExistentField); // Would cause TypeScript error

console.log("\n🎉 TypeScript example completed successfully!");
