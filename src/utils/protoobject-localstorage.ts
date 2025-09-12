/* eslint-env browser */
/* global window */
import { ProtoObject } from "../classes/proto-object";
import { ProtoObjectStaticMethods } from "../types/static-methods";
import { UnknownObject } from "../types/unknown-object";

/**
 * ProtoObject localStorage utility for browser environments
 * Provides save/load functionality for ProtoObject instances in localStorage
 */
export class ProtoObjectLocalStorage {
  /**
   * Save ProtoObject instance to localStorage
   *
   * @param key - localStorage key
   * @param obj - ProtoObject instance to save
   * @returns true if saved successfully, false otherwise
   */
  public static save<T extends ProtoObject<T>>(
    key: string,
    obj: T
  ): boolean {
    try {
      if (typeof window === "undefined" || !window.localStorage) {
        return false;
      }
      
      const json = obj.toJSON();
      const serialized = JSON.stringify(json);
      window.localStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      console.error("ProtoObjectLocalStorage.save error:", error);
      return false;
    }
  }

  /**
   * Load ProtoObject instance from localStorage
   *
   * @param key - localStorage key
   * @param ClassConstructor - ProtoObject class constructor
   * @returns ProtoObject instance or undefined if not found/error
   */
  public static load<T extends ProtoObject<T>>(
    key: string,
    ClassConstructor: ProtoObjectStaticMethods<T>
  ): T | undefined {
    try {
      if (typeof window === "undefined" || !window.localStorage) {
        return undefined;
      }

      const serialized = window.localStorage.getItem(key);
      if (!serialized) {
        return undefined;
      }

      const json = JSON.parse(serialized) as UnknownObject;
      return ClassConstructor.fromJSON(json);
    } catch (error) {
      console.error("ProtoObjectLocalStorage.load error:", error);
      return undefined;
    }
  }

  /**
   * Remove ProtoObject from localStorage
   *
   * @param key - localStorage key
   * @returns true if removed successfully, false otherwise
   */
  public static remove(key: string): boolean {
    try {
      if (typeof window === "undefined" || !window.localStorage) {
        return false;
      }

      window.localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error("ProtoObjectLocalStorage.remove error:", error);
      return false;
    }
  }

  /**
   * Check if key exists in localStorage
   *
   * @param key - localStorage key
   * @returns true if key exists, false otherwise
   */
  public static exists(key: string): boolean {
    try {
      if (typeof window === "undefined" || !window.localStorage) {
        return false;
      }

      return window.localStorage.getItem(key) !== null;
    } catch (error) {
      console.error("ProtoObjectLocalStorage.exists error:", error);
      return false;
    }
  }

  /**
   * Get all ProtoObject keys from localStorage with a prefix
   *
   * @param prefix - key prefix to filter by
   * @returns array of matching keys
   */
  public static getKeys(prefix?: string): string[] {
    try {
      if (typeof window === "undefined" || !window.localStorage) {
        return [];
      }

      const keys: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && (!prefix || key.startsWith(prefix))) {
          keys.push(key);
        }
      }
      return keys;
    } catch (error) {
      console.error("ProtoObjectLocalStorage.getKeys error:", error);
      return [];
    }
  }

  /**
   * Clear all localStorage items with a prefix
   *
   * @param prefix - key prefix to filter by
   * @returns number of removed items
   */
  public static clear(prefix?: string): number {
    try {
      if (typeof window === "undefined" || !window.localStorage) {
        return 0;
      }

      const keysToRemove = this.getKeys(prefix);
      keysToRemove.forEach(key => window.localStorage.removeItem(key));
      return keysToRemove.length;
    } catch (error) {
      console.error("ProtoObjectLocalStorage.clear error:", error);
      return 0;
    }
  }

  /**
   * Save array of ProtoObject instances to localStorage
   *
   * @param key - localStorage key
   * @param objects - array of ProtoObject instances
   * @returns true if saved successfully, false otherwise
   */
  public static saveArray<T extends ProtoObject<T>>(
    key: string,
    objects: T[]
  ): boolean {
    try {
      if (typeof window === "undefined" || !window.localStorage) {
        return false;
      }

      const jsonArray = objects.map(obj => obj.toJSON());
      const serialized = JSON.stringify(jsonArray);
      window.localStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      console.error("ProtoObjectLocalStorage.saveArray error:", error);
      return false;
    }
  }

  /**
   * Load array of ProtoObject instances from localStorage
   *
   * @param key - localStorage key
   * @param ClassConstructor - ProtoObject class constructor
   * @returns array of ProtoObject instances or undefined if not found/error
   */
  public static loadArray<T extends ProtoObject<T>>(
    key: string,
    ClassConstructor: ProtoObjectStaticMethods<T>
  ): T[] | undefined {
    try {
      if (typeof window === "undefined" || !window.localStorage) {
        return undefined;
      }

      const serialized = window.localStorage.getItem(key);
      if (!serialized) {
        return undefined;
      }

      const jsonArray = JSON.parse(serialized) as UnknownObject[];
      if (!Array.isArray(jsonArray)) {
        return undefined;
      }

      return jsonArray.map(json => ClassConstructor.fromJSON(json));
    } catch (error) {
      console.error("ProtoObjectLocalStorage.loadArray error:", error);
      return undefined;
    }
  }
}
