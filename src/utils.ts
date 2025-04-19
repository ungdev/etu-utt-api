import { Language, Permission } from '@prisma/client';
import { Translation } from './prisma/types';
import {
  ALL_PERMISSIONS,
  ApiPermission,
  UserPermission,
  PermissionsDescriptor,
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
  private readonly permissions: PermissionsDescriptor;

  constructor(permissions: PermissionsDescriptor) {
    this.permissions = permissions;
  }

  can(permission: ApiPermission): boolean;
  can(permission: UserPermission, userId: string): boolean;
  can(permission: Permission, userId?: string) {
    return (
      this.permissions[permission] &&
      (this.permissions[permission] === ALL_PERMISSIONS || this.permissions[permission].includes(userId))
    );
  }
}
