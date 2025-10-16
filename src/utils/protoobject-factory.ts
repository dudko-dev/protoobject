import { ProtoObjectDynamicMethods } from "../types/dynamic-methods.js";
import { ProtoObject } from "../classes/proto-object.js";
import { ProtoObjectStaticMethods } from "../types/static-methods.js";

/**
 * A factory for creating classes based on the ProtoObject class
 *
 * @param methods - Methods that should be updated in the class being created.
 * @returns - an ProtoObject's heir
 */
export function protoObjectFactory<T extends ProtoObjectDynamicMethods<T>>(
  methods?: Partial<ProtoObjectStaticMethods<T> & ProtoObjectDynamicMethods<T>>
) {
  class CProtoObject extends ProtoObject<CProtoObject> {
    constructor(data: Partial<CProtoObject>) {
      super(data);
      if (methods) {
        Object.keys(methods)
          .filter(
            (key) =>
              typeof this[
                key as keyof ProtoObjectDynamicMethods<CProtoObject>
              ] === "function"
          )
          .map<keyof ProtoObjectDynamicMethods<CProtoObject>>(
            (key) => key as keyof ProtoObjectDynamicMethods<CProtoObject>
          )
          .forEach((key) => {
            this[key] = methods[key] as any;
          });
      }
    }
  }
  if (methods) {
    Object.keys(methods)
      .filter(
        (key) =>
          typeof CProtoObject[
            key as keyof ProtoObjectStaticMethods<CProtoObject>
          ] === "function"
      )
      .map<keyof ProtoObjectStaticMethods<CProtoObject>>(
        (key) => key as keyof ProtoObjectStaticMethods<CProtoObject>
      )
      .forEach((key) => {
        CProtoObject[key] = methods[key] as any;
      });
  }
  return CProtoObject as unknown as ProtoObjectStaticMethods<T>;
}
