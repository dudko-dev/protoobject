/* eslint-disable no-unused-vars */

/**
 * The function of validating the fields of an object when it is transformed from/to a database
 */
export type ValidatorFunction<T> = (data: unknown) => T | undefined;
