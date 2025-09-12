"use strict";
const { ProtoObject, protoObjectFactory } = require("protoobject");

// Import our example classes
const { User, UserAddress, UserRights } = require("./user-classes");

console.log("🚀 ProtoObject JavaScript Example\n");

// 1. Create user address
const address = new UserAddress({
  country: "USA",
  postCode: "10001",
});

// 2. Create user rights using factory
const rights = UserRights.fromJSON({
  isAdmin: false,
  updatedAt: new Date().toJSON(),
});

// 3. Create user with complex data
const user = new User({
  id: "user-123",
  email: "john@example.com",
  createdAt: new Date(),
  photo: Buffer.from("example-image-data", "utf8"),
  address: address,
  rights: rights,
});

console.log("✅ Created user:", user.constructor.name);
console.log("📧 Email:", user.email);
console.log("🏠 Address:", `${user.address.country}, ${user.address.postCode}`);
console.log("🔐 Admin rights:", user.rights.isAdmin);

// 4. Serialize to JSON
const jsonData = user.toJSON();
console.log("\n📄 Serialized to JSON:");
console.log(JSON.stringify(jsonData, null, 2));

// 5. Deserialize from JSON
const userFromJson = User.fromJSON(jsonData);
console.log("\n♻️  Deserialized from JSON:");
console.log("📧 Email:", userFromJson.email);
console.log("📅 Created:", userFromJson.createdAt.toISOString());

// 6. Copy object
const userCopy = user.copy();
console.log("\n📋 Copied user:");
console.log("✅ Different instances:", user !== userCopy);
console.log(
  "✅ Same data:",
  JSON.stringify(user.toJSON()) === JSON.stringify(userCopy.toJSON())
);

console.log("\n🎉 JavaScript example completed successfully!");
