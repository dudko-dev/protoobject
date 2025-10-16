import { UnknownObject } from "../types/unknown-object.js";
import { ProtoObjectDynamicMethods } from "../types/dynamic-methods.js";
import { ProtoObjectStaticMethods } from "../types/static-methods.js";
import { ValidatorFunction } from "../types/validator-function.js";

/**
 * A universal class for creating any JSON objects and simple manipulations with them.
 */
export class ProtoObject<T extends ProtoObjectDynamicMethods<T>>
  implements ProtoObjectDynamicMethods<T>
{
  /**
   *
   * @param data - ProtoObject or its heir properties
   * @returns - the ProtoObject or its heir
   */
  constructor(data?: Partial<T>) {
    return ProtoObject.deepAssign<T>(this as unknown as T, data ?? {});
  }

  /**
   * Get all properties of an object and its prototypes
   *
   * @param data - any non-null object, such as an instance of the ProtoObject class or its heir
   * @returns - an array of the properties information
   */
  public static getProperties(data: {
    [key: PropertyKey]: unknown;
  }): { key: PropertyKey; value: unknown; descriptor: PropertyDescriptor }[] {
    const props: {
      key: PropertyKey;
      value: unknown;
      descriptor: PropertyDescriptor;
    }[] = [];
    // eslint-disable-next-line guard-for-in
    for (const key in data) {
      const prop = Object.getOwnPropertyDescriptor(data, key);
      if (prop) props.push({ key, value: prop?.value, descriptor: prop });
    }
    return props;
  }

  /**
   * Get all enumerable properties of an object and its prototypes
   *
   * @param data - any non-null object, such as an instance of the ProtoObject class or its heir
   * @param options - options for the returned array of properties
   * @param options.onlyWritable - return only writable properties
   * @returns - an array of the properties information
   */
  public static getEnumerableProperties<T extends ProtoObject<T>>(
    data: {
      [key: PropertyKey]: unknown;
    },
    options: { onlyWritable: boolean } = { onlyWritable: false }
  ): { key: PropertyKey; value: unknown; descriptor: PropertyDescriptor }[] {
    const classNode = this as unknown as ProtoObjectStaticMethods<T>;
    return classNode
      .getProperties(data)
      .filter(
        (prop) =>
          !prop.descriptor.get &&
          !prop.descriptor.set &&
          prop.descriptor.enumerable
      )
      .filter((prop) =>
        options?.onlyWritable ? prop.descriptor.writable : true
      );
  }

  /**
   * A recursive function for assigning properties to an object or returning a property
   * if it is not interchangeable
   *
   * WARN: The first transferred object will be changed.
   *
   * @param obj - an object such as a ProtoObject or its heir or an object property
   * @param data - an object such as a ProtoObject or its heir or an object property
   * @returns - an object such as a ProtoObject or its heir or an object property
   */
  public static recursiveAssign<T extends ProtoObject<T>, K>(
    obj: unknown,
    data?: unknown
  ): K {
    const classNode = this as unknown as ProtoObjectStaticMethods<T>;
    if (
      typeof obj === "undefined" ||
      obj === null ||
      (typeof data !== "undefined" && typeof obj !== typeof data)
    )
      return data as K;
    if (data === null) return data as K;
    switch (typeof data) {
      case "undefined":
        return obj as K;
      case "bigint":
      case "boolean":
      case "function":
      case "number":
      case "string":
      case "symbol":
        return data as K;
      case "object": {
        if (Array.isArray(data)) {
          return data as K;
        }
        if (
          data instanceof ProtoObject &&
          data?.constructor?.name !== obj?.constructor?.name
        ) {
          return data.copy();
        }
        if (
          !(data instanceof ProtoObject) &&
          typeof data.constructor === "function" &&
          data.constructor?.name !== "Object"
        ) {
          return data as K;
        }
        for (const prop of classNode.getEnumerableProperties(
          data as { [key: string]: unknown }
        )) {
          if (typeof prop.key !== "string") continue;
          const origProp = Object.getOwnPropertyDescriptor(obj, prop.key);
          if (
            !origProp ||
            (!origProp.get &&
              !origProp.set &&
              origProp.enumerable &&
              origProp.writable)
          ) {
            (obj as UnknownObject)[prop.key] = classNode.recursiveAssign(
              (obj as UnknownObject)[prop.key],
              (data as UnknownObject)[prop.key]
            );
          } else {
            continue;
          }
        }
        return obj as K;
      }
    }
    return obj as K;
  }

  /**
   * Deep assign data to an instance of the ProtoObject class or its heir
   *
   * @param obj - a ProtoObject class or its heir
   * @param data - a ProtoObject class or its heir or any other object
   * @returns - a assigned ProtoObject class or its heir
   */
  public static deepAssign<T extends ProtoObject<T>>(
    obj: T,
    data?: Partial<T>
  ): T {
    const classNode = this as unknown as ProtoObjectStaticMethods<T>;
    return classNode.recursiveAssign(obj, data ?? {}) as T;
  }

  /**
   * The converter of values into simple types
   *
   * @param data - a value to convert to a simple type
   * @returns - a simple type
   */
  public static valueToJSON(data: unknown): unknown {
    switch (typeof data) {
      case "boolean":
      case "number":
      case "string":
        return data;
      default:
        return undefined;
    }
  }

  /**
   * The converter of simple types into values
   *
   * @param data - a simple type to convert to a value
   * @returns - a value
   */
  public static valueFromJSON(data: unknown): unknown {
    switch (typeof data) {
      case "boolean":
      case "number":
      case "string":
        return data;
      default:
        return undefined;
    }
  }

  /**
   * A method for converting a simple json to ProtoObject class or its heir
   *
   * @param data - a simple json data
   * @returns - a ProtoObject class or its heir
   */
  public static fromJSON<T extends ProtoObject<T>>(data: {
    [key: string]: unknown;
  }): T {
    const classNode = this as unknown as ProtoObjectStaticMethods<T>;
    const json: { [key: string]: unknown } = {};
    // eslint-disable-next-line guard-for-in
    for (const key in data) {
      const value = classNode.valueFromJSON(data[key]);
      if (value) json[key as string] = value;
    }
    return new classNode(json as Partial<T>);
  }

  /**
   * A method for converting a ProtoObject class or its heir to simple json
   *
   * @returns - a simple json
   */
  public toJSON(): { [key: string]: any } {
    const classNode = this
      .constructor as unknown as ProtoObjectStaticMethods<T>;
    const json: { [key: string]: unknown } = {};
    const props = ProtoObject.getEnumerableProperties(
      this as unknown as { [key: string]: unknown }
    );
    for (const prop of props) {
      const value = classNode.valueToJSON(prop.value);
      if (value) json[prop.key as string] = value;
    }
    return json;
  }

  /**
   * A method for converting a ProtoObject class or its heir to a string
   *
   * @returns - string
   */
  public toString() {
    return JSON.stringify(this.toJSON());
  }

  /**
   * Copying a ProtoObject class or its heirs
   *
   * @returns - a deep copy of the ProtoObject object or its heir
   */
  public copy(): T {
    const classNode = this.constructor as ProtoObjectStaticMethods<T>;
    return classNode.fromJSON(this.toJSON());
  }

  /**
   * Deep assign data to an instance of the ProtoObject class or its heir
   *
   * @param data - a ProtoObject class or its heir or any other object
   * @returns - a assigned ProtoObject class or its heir
   */
  public assign(data: Partial<T>): T {
    const classNode = this.constructor as ProtoObjectStaticMethods<T>;
    return classNode.deepAssign<T>(this as unknown as T, data);
  }

  /**
   * Factory for creating a data transformer for the ProtoObject class or its heir
   *
   * @param param0 - data validators
   * @param param0.validatorTo - data validator when converting to a simple JSON object
   * @param param0.validatorFrom - data validator when converting to a class
   * @returns data transformer for the ProtoObject class or its heir
   */
  public static recordTransformer<T extends ProtoObject<T>>({
    validatorTo,
    validatorFrom,
  }: {
    validatorTo?: ValidatorFunction<T>;
    validatorFrom?: ValidatorFunction<UnknownObject>;
  }) {
    const classNode = this as unknown as ProtoObjectStaticMethods<T>;
    return {
      to(obj: unknown): UnknownObject | undefined {
        if (!obj || (typeof validatorTo === "function" && !validatorTo(obj)))
          return undefined;
        return (obj as T).toJSON() as UnknownObject;
      },
      from(json: unknown): T | undefined {
        if (
          !json ||
          (typeof validatorFrom === "function" && !validatorFrom(json))
        )
          return undefined;
        return classNode.fromJSON(json) as T;
      },
    };
  }

  /**
   * Factory for creating a data transformer for the array of ProtoObject classes or its heirs
   *
   * @param param0 - data validators
   * @param param0.validatorTo - data validator when converting to a simple JSON object
   * @param param0.validatorFrom - data validator when converting to a class
   * @returns data transformer for the array of the ProtoObject classes or its heirs
   */
  public static collectionTransformer<T extends ProtoObject<T>>({
    validatorTo,
    validatorFrom,
  }: {
    validatorTo?: ValidatorFunction<T>;
    validatorFrom?: ValidatorFunction<UnknownObject>;
  }) {
    const classNode = this as unknown as ProtoObjectStaticMethods<T>;
    return {
      to(objArr: unknown): UnknownObject[] | undefined {
        if (!Array.isArray(objArr)) return undefined;
        return objArr
          .filter(
            (obj) =>
              !!obj && (typeof validatorTo !== "function" || !!validatorTo(obj))
          )
          .map<UnknownObject>((obj) => obj.toJSON());
      },
      from(jsonArr: unknown): T[] | undefined {
        if (!Array.isArray(jsonArr)) return undefined;
        return jsonArr
          .filter(
            (json) =>
              !!json &&
              (typeof validatorFrom !== "function" || !!validatorFrom(json))
          )
          .map<T>((json) => classNode.fromJSON(json));
      },
    };
  }
}
