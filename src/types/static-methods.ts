/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable no-unused-vars */

import { AnyObject } from "./any-object";
import { UnknownObject } from "./unknown-object";
import { RecordTransformer } from "./record-transformer";
import { ProtoObjectDynamicMethods } from "./dynamic-methods";
import { CollectionTransformer } from "./collection-transformer";
import { ValidatorFunction } from "./validator-function";

/**
 * Static methods of the ProtoObject class and its heirs
 */
export interface ProtoObjectStaticMethods<
  T extends ProtoObjectDynamicMethods<T>,
> {
  /**
   * A class constructor
   */
  new (data?: Partial<T>): T;

  /**
   * Get all properties of an object and its prototypes
   *
   * @param data - any non-null object, such as an instance of the ProtoObject class or its heir
   * @returns - an array of the properties information
   */
  getProperties(data: { [key: PropertyKey]: unknown }): {
    key: PropertyKey;
    value: unknown;
    descriptor: PropertyDescriptor;
  }[];

  /**
   * Get all enumerable properties of an object and its prototypes
   *
   * @param data - any non-null object, such as an instance of the ProtoObject class or its heir
   * @param options - options for the returned array of properties
   * @param options.onlyWritable - return only writable properties
   * @returns - an array of the properties information
   */
  getEnumerableProperties<T extends ProtoObjectDynamicMethods<T>>(
    data: {
      [key: PropertyKey]: unknown;
    },

    options?: {
      onlyWritable: boolean;
    }
  ): {
    key: PropertyKey;
    value: unknown;
    descriptor: PropertyDescriptor;
  }[];

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
  recursiveAssign<T extends ProtoObjectDynamicMethods<T>>(
    obj: unknown,

    data?: unknown
  ): T;

  /**
   * Deep assign data to an instance of the ProtoObject class or its heir
   *
   * @param obj - a ProtoObject class or its heir
   * @param data - a ProtoObject class or its heir or any other object
   * @returns - a assigned ProtoObject class or its heir
   */
  deepAssign<T extends ProtoObjectDynamicMethods<T>>(
    obj: T,
    data?: Partial<T>
  ): T;

  /**
   * The converter of values into simple types
   *
   * @param data - a value to convert to a simple type
   * @returns - a simple type
   */
  valueToJSON(data: unknown): unknown;

  /**
   * The converter of simple types into values
   *
   * @param data - a simple type to convert to a value
   * @returns - a value
   */
  valueFromJSON(data: unknown): unknown;

  /**
   * A method for converting a simple json to ProtoObject class or its heir
   *
   * @param data - a simple json data
   * @returns - a ProtoObject class or its heir
   */
  fromJSON: (data: AnyObject) => T;

  /**
   * Factory for creating a data transformer for the ProtoObject class or its heir
   *
   * @param param0 - data validators
   * @param param0.validatorTo - data validator when converting to a simple JSON object
   * @param param0.validatorFrom - data validator when converting to a class
   * @returns data transformer for the ProtoObject class or its heir
   */
  recordTransformer: (options: {
    validatorTo?: ValidatorFunction<T>;
    validatorFrom?: ValidatorFunction<UnknownObject>;
  }) => RecordTransformer<T, UnknownObject>;

  /**
   * Factory for creating a data transformer for the array of ProtoObject classes or its heirs
   *
   * @param param0 - data validators
   * @param param0.validatorTo - data validator when converting to a simple JSON object
   * @param param0.validatorFrom - data validator when converting to a class
   * @returns data transformer for the array of the ProtoObject classes or its heirs
   */
  collectionTransformer: (options: {
    validatorTo?: ValidatorFunction<T>;
    validatorFrom?: ValidatorFunction<UnknownObject>;
  }) => CollectionTransformer<T, UnknownObject>;
}
