"use strict";
const { describe, it } = require("node:test");
const { deepEqual, notEqual, equal } = require("node:assert");
const { ProtoObject } = require("../../lib/");
const { UserAddress, User, UserRights } = require("./exapmle");
const { randomUUID } = require("node:crypto");

describe("Equivalence check", function () {
  const id = randomUUID();
  const email = "example@dudko.dev";
  const createdAt = new Date();
  const photo = Buffer.from(
    "R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==",
    "base64"
  );
  const jsonUserAddress = {
    country: "USA",
    postCode: "10001",
  };
  const userAddress = UserAddress.fromJSON(jsonUserAddress);
  const jsonUserRights = {
    isAdmin: true,
    updatedAt: new Date().toJSON(),
  };
  const userRights = UserRights.fromJSON(jsonUserRights);
  it("Checking the equivalence of two instances:", () => {
    const protoObject1 = new User({
      id,
      email,
      createdAt,
      photo,
      address: userAddress,
      rights: userRights,
    });
    const protoObject2 = new User({
      id,
      email,
      createdAt,
      photo,
      address: userAddress,
      rights: userRights,
    });
    notEqual(
      protoObject1,
      protoObject2,
      `${protoObject1?.constructor?.name} and ${protoObject2?.constructor?.name} are equivalent`
    );
    deepEqual(
      protoObject1,
      protoObject2,
      `${protoObject1?.constructor?.name} and ${protoObject2?.constructor?.name} contain different properties`
    );
  });
  it("Checking object copying:", () => {
    const protoObject1 = new User({
      id,
      email,
      createdAt,
      photo,
      address: userAddress,
      rights: userRights,
    });
    const protoObject2 = protoObject1.copy();
    notEqual(
      protoObject1,
      protoObject2,
      `${protoObject1?.constructor?.name} and ${protoObject2?.constructor?.name} are equivalent`
    );
    deepEqual(
      protoObject1,
      protoObject2,
      `${protoObject1?.constructor?.name} and ${protoObject2?.constructor?.name} contain different properties`
    );
  });
  it("Checking the transformation to json:", () => {
    const protoObject = new User({
      id,
      email,
      createdAt,
      photo,
      address: userAddress,
      rights: userRights,
    });
    const jsonObject = protoObject.toJSON();
    deepEqual(
      jsonObject,
      {
        id,
        email,
        createdAt: createdAt.toJSON(),
        photo: photo.toString("hex"),
        address: jsonUserAddress,
        rights: jsonUserRights,
      },
      `Objects contain different properties`
    );
  });
  it("Checking the transformation from json:", () => {
    const protoObject1 = new User({
      id,
      email,
      createdAt,
      photo,
      address: userAddress,
      rights: userRights,
    });
    const protoObject2 = User.fromJSON({
      id,
      email,
      createdAt: createdAt.toJSON(),
      photo: photo.toString("hex"),
      address: jsonUserAddress,
      rights: jsonUserRights,
    });
    notEqual(
      protoObject1,
      protoObject2,
      `${protoObject1?.constructor?.name} and ${protoObject2?.constructor?.name} are equivalent`
    );
    deepEqual(
      protoObject1,
      protoObject2,
      `${protoObject1?.constructor?.name} and ${protoObject2?.constructor?.name} contain different properties`
    );
  });
  it("Checking the assignment:", () => {
    const protoObject1 = new User({
      id,
      email,
      createdAt,
      photo,
      address: userAddress,
      rights: userRights,
    });
    const protoObject2 = User.fromJSON({
      id,
      email: "example2@dudko.dev",
      createdAt: new Date().toJSON(),
      address: {
        country: "GE",
      },
    });
    protoObject1.assign(protoObject2);
    const protoObject3 = User.fromJSON({
      id: protoObject1.id,
      email: protoObject2.email,
      createdAt: protoObject2.createdAt.toJSON(),
      photo: protoObject1.photo?.toString("hex"),
      address: {
        country: protoObject2.address?.country,
        postCode: protoObject1.address?.postCode,
      },
      rights: protoObject1.rights?.toJSON(),
    });
    deepEqual(
      protoObject1,
      protoObject3,
      `${protoObject1?.constructor?.name} and ${protoObject3?.constructor?.name} contain different properties`
    );
  });
});
