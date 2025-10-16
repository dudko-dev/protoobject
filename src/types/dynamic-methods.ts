/* eslint-disable no-unused-vars */

import { AnyObject } from "./any-object.js";

/**
 * Dynamic methods of the ProtoObject class and its heirs
 */
export interface ProtoObjectDynamicMethods<T> {
  /**
   * A method for converting a ProtoObject class or its heir to simple json
   *
   * @returns - a simple json
   */
  toJSON: () => AnyObject;

  /**
   * A method for converting a ProtoObject class or its heir to a string
   *
   * @returns - string
   */
  toString(): string;

  /**
   * Copying a ProtoObject class or its heirs
   *
   * @returns - a deep copy of the ProtoObject object or its heir
   */
  copy: () => T;

  /**
   * Deep assign data to an instance of the ProtoObject class or its heir
   *
   * @param data - a ProtoObject class or its heir or any other object
   * @returns - a assigned ProtoObject class or its heir
   */
  assign: (data: Partial<T>) => T;
}
