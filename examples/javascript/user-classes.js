"use strict";
const { ProtoObject, protoObjectFactory } = require("protoobject");

/**
 * Example of creating a class using factory pattern
 * This approach is useful when you want to avoid inheritance
 */
const UserRights = protoObjectFactory({
  fromJSON(data) {
    return new this({
      ...ProtoObject.fromJSON(data),
      updatedAt: new Date(data?.updatedAt),
    });
  },
  toJSON() {
    return {
      ...UserRights?.prototype?.toJSON?.call(this),
      updatedAt: this.updatedAt?.toJSON(),
    };
  },
});

/**
 * Example of creating a simple ProtoObject heir using inheritance
 */
class UserAddress extends ProtoObject {
  constructor(data) {
    super(data);
    // Note: assign data after calling super() to ensure proper field initialization
    if (data) this.assign(data);
    return this;
  }

  country;
  postCode;
}

/**
 * Example of creating a complex ProtoObject heir with custom serialization
 */
class User extends ProtoObject {
  constructor(data) {
    super(data);
    // Note: assign data after calling super() to ensure proper field initialization
    if (data) this.assign(data);
    return this;
  }

  id;
  email;
  createdAt;
  photo;
  address;
  rights;

  /**
   * Custom JSON serialization for complex types
   * Standard types (String, Number, Boolean) are handled automatically
   */
  toJSON() {
    return {
      ...super.toJSON.call(this),
      createdAt: this.createdAt.toJSON(),
      photo:
        this.photo instanceof Buffer ? this.photo.toString("hex") : undefined,
      address:
        this.address instanceof UserAddress ? this.address.toJSON() : undefined,
      rights:
        this.rights instanceof UserRights ? this.rights?.toJSON() : undefined,
    };
  }

  /**
   * Custom JSON deserialization for complex types
   * Standard types (String, Number, Boolean) are handled automatically
   */
  static fromJSON(data) {
    return new User({
      ...super.fromJSON(data),
      createdAt:
        typeof data.createdAt === "string"
          ? new Date(data.createdAt)
          : undefined,
      photo:
        typeof data.photo === "string"
          ? Buffer.from(data.photo, "hex")
          : undefined,
      address: data.address ? UserAddress.fromJSON(data.address) : undefined,
      rights: data.rights ? UserRights.fromJSON(data.rights) : undefined,
    });
  }
}

module.exports = {
  User,
  UserAddress,
  UserRights,
};
