/* eslint-disable no-unused-vars */

import { ProtoObjectDynamicMethods } from "./dynamic-methods.js";

/**
 * A data transformer for the ProtoObject class or its heir
 *
 */
export interface RecordTransformer<T extends ProtoObjectDynamicMethods<T>, K> {
  /**
   * Converter of a ProtoObject class or its heir to simple json
   *
   * @param objectArr - the ProtoObject class or its heir
   * @returns - the simple json
   */
  to: (obj: unknown) => K | undefined;
  /**
   * Converter of a simple json to ProtoObject class or its heir
   *
   * @param jsonArr - the simple json
   * @returns - the ProtoObject class or its heir
   */
  from: (json: unknown) => T | undefined;
}
