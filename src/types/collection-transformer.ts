/* eslint-disable no-unused-vars */

import { ProtoObjectDynamicMethods } from "./dynamic-methods";

/**
 * A data transformer for the array of ProtoObject classes or its heirs
 *
 */
export interface CollectionTransformer<
  T extends ProtoObjectDynamicMethods<T>,
  K,
> {
  /**
   * Converter of an array of ProtoObject classes or its heirs to simple jsons
   *
   * @param objectArr - the array of ProtoObject classes or its heirs
   * @returns - the array of the simple jsons
   */
  to: (objectArr: unknown) => K[] | undefined;
  /**
   * Converter of an array of simple jsons to ProtoObject classes or its heirs
   *
   * @param jsonArr - the array of the simple jsons
   * @returns - the array of ProtoObject classes or its heirs
   */
  from: (jsonArr: unknown) => T[] | undefined;
}
