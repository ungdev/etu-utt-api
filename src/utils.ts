import { Language, Permission } from '@prisma/client';
import { Translation } from './prisma/types';
import {
  ALL_PERMISSIONS,
  ApiPermission,
  UserPermission,
  isApiPermission,
} from './auth/interfaces/permissions.interface';

/**
 * Returns a new object built from the given object with only the specified keys.
 * @param obj The object to transform.
 * @param keys The keys to pick.
 */
export function pick<T extends object, K extends keyof T>(obj: T, ...keys: K[]): Pick<T, K>;
/**
 * Filters an object keeping only the given keys. This overload can be used in a pipe,
 * for example with `Array.map` or `Promise.then`.
 * @param keys The keys to pick.
 */
export function pick<T extends object, K extends keyof T>(...keys: K[]): (obj: T) => Pick<T, K>;
export function pick<T extends object, K extends keyof T>(objOrKey: T | K, ...keys: K[]) {
  return typeof objOrKey === 'object'
    ? (Object.fromEntries(Object.entries(objOrKey).filter(([key]) => keys.includes(key as K))) as Pick<T, K>)
    : (value: T) => pick<T, K>(value, objOrKey as K, ...keys);
}

/**
 * Filters an object from the given keys. This function returns a new object and does not mutate the original one.
 * @param obj The object to transform.
 * @param keys The keys to omit.
 */
export function omit<T extends object, K extends keyof T>(obj: T, ...keys: K[]): Omit<T, K>;
/**
 * Filters an object from the given keys. This overload can be used in a pipe,
 * for example with `Array.map` or `Promise.then`.
 * @param keys The keys to omit.
 */
export function omit<T extends object, K extends keyof T>(...keys: K[]): (obj: T) => Omit<T, K>;
export function omit<T extends object, K extends keyof T>(objOrKey: T | K, ...keys: K[]) {
  return typeof objOrKey === 'object'
    ? (Object.fromEntries(Object.entries(objOrKey).filter(([key]) => !keys.includes(key as K))) as Omit<T, K>)
    : (value: T) => omit<T, K>(value, objOrKey as K, ...keys);
}

export function doesEntryIncludeSome(entry: string | string[], ...values: string[]) {
  if (!Array.isArray(entry)) return values.includes(entry);
  return values.some((value) => entry.includes(value));
}

export function getTranslation(translation: Translation | null, language: Language) {
  return translation?.[language] ?? translation?.fr ?? null;
}

export const translationSelect = {
  select: {
    fr: true,
    en: true,
    de: true,
    es: true,
    zh: true,
  },
};

export class PermissionManager {
  public readonly apiPermissions: ApiPermission[];
  public readonly userPermissions: {
    [k in UserPermission]?: ALL_PERMISSIONS | string[];
  };

  constructor() {
    this.apiPermissions = [];
    this.userPermissions = {};
  }

  can(permission: ApiPermission): boolean;
  can(permission: UserPermission, userId: string): boolean;
  can(permission: Permission, userId?: string) {
    if (isApiPermission(permission)) {
      return this.apiPermissions.includes(permission);
    }
    return this.userPermissions[permission] === ALL_PERMISSIONS || this.userPermissions[permission].includes(userId);
  }

  add(permission: ApiPermission): PermissionManager;
  add(permission: UserPermission, userId?: string): PermissionManager;
  add(permission: Permission, userId?: string): PermissionManager {
    if (isApiPermission(permission)) {
      if (!this.apiPermissions.includes(permission)) {
        this.apiPermissions.push(permission);
      }
    } else if (this.userPermissions[permission] != ALL_PERMISSIONS) {
      if (!userId) {
        this.userPermissions[permission] = ALL_PERMISSIONS;
      } else if (!this.userPermissions[permission]) {
        this.userPermissions[permission] = [userId];
      } else {
        (this.userPermissions[permission] as string[]).push(userId);
      }
    }
    return this;
  }
}
