import {
  ProtoObject,
  StaticImplements,
  ProtoObjectStaticMethods,
  protoObjectFactory,
} from "protoobject";

// Example using interface and factory pattern
interface IUserRights extends ProtoObject<IUserRights> {
  isAdmin: boolean;
  updatedAt: Date;
}

/**
 * Example of creating a class using factory pattern with TypeScript
 * This approach provides type safety and interface compliance
 */
export const UserRights = protoObjectFactory<IUserRights>({
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
 * Example of creating a simple ProtoObject heir with TypeScript decorators
 * The decorator ensures static method compliance at compile time
 */
@StaticImplements<ProtoObjectStaticMethods<UserAddress>>()
export class UserAddress extends ProtoObject<UserAddress> {
  constructor(data?: Partial<UserAddress>) {
    super(data);
    // Note: assign data after calling super() to ensure proper field initialization
    if (data) this.assign(data);
    return this;
  }

  country!: string;
  postCode!: string;
}

/**
 * Example of creating a complex ProtoObject heir with TypeScript
 * Includes full type safety, decorators, and custom serialization
 */
@StaticImplements<ProtoObjectStaticMethods<User>>()
export class User extends ProtoObject<User> {
  constructor(data?: Partial<User>) {
    super(data);
    // Note: assign data after calling super() to ensure proper field initialization
    if (data) this.assign(data);
    return this;
  }

  id!: string;
  email!: string;
  createdAt!: Date;
  photo?: Buffer;
  address?: UserAddress;
  rights?: IUserRights;

  /**
   * Custom JSON serialization for complex types
   * Standard types (String, Number, Boolean) are handled automatically
   */
  public toJSON(): { [key: string]: any } {
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
  public static fromJSON<User>(data: { [key: string]: unknown }): User {
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
      address: data.address
        ? UserAddress.fromJSON<UserAddress>(
            data.address as { [key: string]: unknown }
          )
        : undefined,
      rights: data.rights ? UserRights.fromJSON(data.rights) : undefined,
    }) as unknown as User;
  }
}
