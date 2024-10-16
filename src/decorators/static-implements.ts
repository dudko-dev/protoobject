/* eslint-disable @typescript-eslint/no-unused-expressions */

/**
 * Use this decorator to check the static properties of a class
 *
 * Example: `@StaticImplements<ProtoObjectStaticMethods<User>>()`
 */
export const StaticImplements = <T>() => {
  return <U extends T>(constructor: U) => {
    constructor;
  };
};
