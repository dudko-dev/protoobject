import {
  ProtoObject,
  StaticImplements,
  ProtoObjectStaticMethods,
  protoObjectFactory,
} from "../../src";

//! An option to create classes based on the interface and factory
interface IUserRights extends ProtoObject<IUserRights> {
  isAdmin: boolean;
  updatedAt: Date;
}
/**
 * Example of the ProtoObject heir
 *
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
 * Example of the ProtoObject heir
 *
 */
//! Use a decorator to check the static properties of an object.
@StaticImplements<ProtoObjectStaticMethods<UserAddress>>()
export class UserAddress extends ProtoObject<UserAddress> {
  constructor(data?: Partial<UserAddress>) {
    super(data);
    //! Note that if you have described the class fields inside the class,
    //! then you need to assign them inside the class constructor, because
    //! the assign inside the superclass constructor will be overwritten by
    //! undefined field values. This is a feature of the library build.
    if (data) this.assign(data);
    return this;
  }

  country!: string;

  postCode!: string;
}

/**
 * Example of the ProtoObject heir
 *
 */
//! Use a decorator to check the static properties of an object.
@StaticImplements<ProtoObjectStaticMethods<User>>()
export class User extends ProtoObject<User> {
  constructor(data?: Partial<User>) {
    super(data);
    //! Note that if you have described the class fields inside the class,
    //! then you need to assign them inside the class constructor, because
    //! the assign inside the superclass constructor will be overwritten by
    //! undefined field values. This is a feature of the library build.
    if (data) this.assign(data);
    return this;
  }

  id!: string;

  email!: string;

  createdAt!: Date;

  photo?: Buffer;

  address?: UserAddress;

  rights?: IUserRights;

  //! You can skip fields with standard types `String`, `Number`, `Boolean`
  //! and use a superclass converter for these types, but you must implement
  //! the conversion of the remaining types manually.
  public toJSON(): { [key: string]: any } {
    return {
      ...super.toJSON(),
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
