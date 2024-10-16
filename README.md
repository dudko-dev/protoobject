# ProtoObject

A universal class for creating any JSON objects and simple manipulations with them.

Just inherit from this class and easily organize your work with data. This can be data storage in an SQL/NoSQL database, data storage in localStorage/sessionStorage, simple transfer of data serialization on one side and the same idle deserialization of data on the other side. You can write your own ProtoBuffer protocol on top of this library and use it for RPC or to write a universal data library for FrontEnd and BackEnd.

Think of it as a data framework.

Inspired by gRPC and Firebase.

[![npm](https://img.shields.io/npm/v/protoobject.svg)](https://www.npmjs.com/package/protoobject)
[![npm](https://img.shields.io/npm/dy/protoobject.svg)](https://www.npmjs.com/package/protoobject)
[![NpmLicense](https://img.shields.io/npm/l/protoobject.svg)](https://www.npmjs.com/package/protoobject)
![GitHub last commit](https://img.shields.io/github/last-commit/dudko-dev/protoobject.svg)
![GitHub release](https://img.shields.io/github/release/dudko-dev/protoobject.svg)

## INSTALL

```bash
 npm i protoobject --save
```

## DOCS

### The main methods of the ProtoObject class

These methods ensure that the class and its heirs interact with the external system and will not contain backward incompatible changes.

| type of the property | name of the property | description |
| --- | --- | --- |
| static | `fromJSON` | A method for converting a simple json to ProtoObject class or its heir |
| dynamic | `toJSON` | A method for converting a ProtoObject class or its heir to simple json |
| dynamic | `toString` | A method for converting a ProtoObject class or its heir to a string |
| dynamic | `copy` | Copying a ProtoObject class or its heirs |
| dynamic | `assign` | Deep assign data to an instance of the ProtoObject class or its heir |
| static | `recordTransformer` | Factory for creating a data transformer for the ProtoObject class or its heir |
| static | `collectionTransformer` | Factory for creating a data transformer for the array of ProtoObject classes or its heirs |

### The auxiliary methods of the ProtoObject class

These methods ensure the operation of the class itself and can change significantly over time.

| type of the property | name of the property | description |
| --- | --- | --- |
| static | `getProperties` | Get all properties of an object and its prototypes |
| static | `getEnumerableProperties` | Get all enumerable properties of an object and its prototypes |
| static | `recursiveAssign` | A recursive function for assigning properties to an object or returning a property if it is not interchangeable |
| static | `deepAssign` | Deep assign data to an instance of the ProtoObject class or its heir |
| static | `valueToJSON` | The converter of values into simple types |
| static | `valueFromJSON` | The converter of simple types into values |

### JavaScript

Creating an heir class

#### JavaScript - Creating an heir class using inheritance

Note that you cannot use static method validation using a decorator in JavaScript, TypeScript provides more features.

Note the call to `this.assign(data);` in the constructor of your own class. This is due to the code build, which causes your class to first call `super(data);` and then apply the value of the properties specified in the class (if the value is not specified, `undefined` will be applied). This is the reason why `super(data);` will not make an assignment for the properties specified in your class.

```js
class UserAddress extends ProtoObject {
  constructor(data) {
    if (data) this.assign(data);
    return this;
  }

  country;

  postCode;
}
```

#### JavaScript - Creating an heir class using a factory

You can skip fields with standard types `String`, `Number`, `Boolean` and use a superclass converters (`UserRights?.prototype?.toJSON?.call(this)` and `ProtoObject.fromJSON(data)`) for these types, but you must implement the conversion of the remaining types manually.

```js
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
```

#### JavaScript - Creating an heir class using inheritance with conversion of additional data types

Note that you cannot use static method validation using a decorator in JavaScript, TypeScript provides more features.

Note the call to `this.assign(data);` in the constructor of your own class. This is due to the code build, which causes your class to first call `super(data);` and then apply the value of the properties specified in the class (if the value is not specified, `undefined` will be applied). This is the reason why `super(data);` will not make an assignment for the properties specified in your class.

You can skip fields with standard types `String`, `Number`, `Boolean` and use a superclass converters (`super.toJSON()` and `super.fromJSON(data)`) for these types, but you must implement the conversion of the remaining types manually.

```js
class User extends ProtoObject {
  constructor(data) {
    super(data);
    if (data) this.assign(data);
    return this;
  }

  id;

  email;

  createdAt;

  photo;

  address;

  toJSON() {
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
```

### TypeScript

Creating an heir class

#### TypeScript - Creating an heir class using inheritance

Note that to check the static properties of a class, you can use the decorator `@StaticImplements<ProtoObjectStaticMethods<User>>()`.

Note the call to `this.assign(data);` in the constructor of your own class. This is due to the code build, which causes your class to first call `super(data);` and then apply the value of the properties specified in the class (if the value is not specified, `undefined` will be applied). This is the reason why `super(data);` will not make an assignment for the properties specified in your class.

```js
@StaticImplements<ProtoObjectStaticMethods<UserAddress>>()
export class UserAddress extends ProtoObject<UserAddress> {
  constructor(data?: Partial<UserAddress>) {
    super(data);
    if (data) this.assign(data);
    return this;
  }

  country!: string;

  postCode!: string;
}
```

#### TypeScript - Creating an heir class using a factory

You can skip fields with standard types `String`, `Number`, `Boolean` and use a superclass converters (`UserRights?.prototype?.toJSON?.call(this)` and `ProtoObject.fromJSON(data)`) for these types, but you must implement the conversion of the remaining types manually.

```js
interface IUserRights extends ProtoObject<IUserRights> {
  isAdmin: boolean;
  updatedAt: Date;
}
const UserRights = protoObjectFactory<IUserRights>({
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
```

#### TypeScript - Creating an heir class using inheritance with conversion of additional data types

Note that to check the static properties of a class, you can use the decorator `@StaticImplements<ProtoObjectStaticMethods<User>>()`.

Note the call to `this.assign(data);` in the constructor of your own class. This is due to the code build, which causes your class to first call `super(data);` and then apply the value of the properties specified in the class (if the value is not specified, `undefined` will be applied). This is the reason why `super(data);` will not make an assignment for the properties specified in your class.

You can skip fields with standard types `String`, `Number`, `Boolean` and use a superclass converters (`super.toJSON()` and `super.fromJSON(data)`) for these types, but you must implement the conversion of the remaining types manually.

```js
@StaticImplements<ProtoObjectStaticMethods<User>>()
class User extends ProtoObject<User> {
  constructor(data?: Partial<User>) {
    super(data);
    if (data) this.assign(data);
    return this;
  }

  id!: string;

  email!: string;

  createdAt!: Date;

  photo?: Buffer;

  address?: UserAddress;

  rights?: IUserRights;

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

  public static fromJSON<User>(data: { [key: string]: unknown }): User {
    return new User({
      ...(super.fromJSON<any>(data) as User),
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
```

## LICENSE

MIT
