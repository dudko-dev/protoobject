"use strict";
const { ProtoObject, protoObjectFactory } = require("../../lib/cjs/");

/**
 * Example of the ProtoObject heir
 *
 */
//! An option to create classes based on the factory
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
 * Example of the ProtoObject heir
 *
 */
//! Using the decorator for additional verification of static methods is only
//! available for TypeScript.
class UserAddress extends ProtoObject {
  constructor(data) {
    super(data);
    //! Note that if you have described the class fields inside the class,
    //! then you need to assign them inside the class constructor, because
    //! the assign inside the superclass constructor will be overwritten by
    //! undefined field values. This is a feature of the library build.
    if (data) this.assign(data);
    return this;
  }

  country;

  postCode;
}

/**
 * Example of the ProtoObject heir
 *
 */
//! Using the decorator for additional verification of static methods is only
//! available for TypeScript.
class User extends ProtoObject {
  constructor(data) {
    super(data);
    //! Note that if you have described the class fields inside the class,
    //! then you need to assign them inside the class constructor, because
    //! the assign inside the superclass constructor will be overwritten by
    //! undefined field values. This is a feature of the library build.
    if (data) this.assign(data);
    return this;
  }

  id;

  email;

  createdAt;

  photo;

  address;

  //! You can skip fields with standard types `String`, `Number`, `Boolean`
  //! and use a superclass converter for these types, but you must implement
  //! the conversion of the remaining types manually.
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

  //! You can skip fields with standard types `String`, `Number`, `Boolean`
  //! and use a superclass converter for these types, but you must implement
  //! the conversion of the remaining types manually.
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
