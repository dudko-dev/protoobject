/**
 * A universal class for creating any JSON objects and simple manipulations with them.
 * @module protoobject
 * @author Siarhei Dudko <siarhei@dudko.dev>
 * @copyright 2024
 * @license MIT
 * @version 1.0.0
 */

import { ProtoObject } from "./classes/proto-object";
import { ProtoObjectDynamicMethods } from "./types/dynamic-methods";
import { ProtoObjectStaticMethods } from "./types/static-methods";
import { StaticImplements } from "./decorators/static-implements";
import { protoObjectFactory } from "./utils/protoobject-factory";

export {
  ProtoObject,
  StaticImplements,
  ProtoObjectDynamicMethods,
  ProtoObjectStaticMethods,
  protoObjectFactory,
};
