import { RequestMethod } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA, VERSION_METADATA } from '@nestjs/common/constants.js';

const enabledShards = new Set((process.env.API_SHARD_SELECTION?.split(',') ?? []).map((s) => s.trim()));

function isShardEnabled(shards: string[]) {
  return process.env.API_SHARD_SELECTION === '*' || !enabledShards.isDisjointFrom(new Set(shards));
}

export const skippedRoutes: Record<
  string,
  {
    path: string;
    method: string;
    version: number | undefined;
  }[]
> = {};

export function ShardExclusive(...shards: string[]): MethodDecorator {
  return function (target: object, _key: string | symbol, descriptor: PropertyDescriptor) {
    if (isShardEnabled(shards)) return;

    const handler = descriptor.value;
    if (!(target.constructor.name in skippedRoutes)) skippedRoutes[target.constructor.name] = [];
    skippedRoutes[target.constructor.name].push({
      method: RequestMethod[Reflect.getMetadata(METHOD_METADATA, handler)],
      path: Reflect.getMetadata(PATH_METADATA, handler),
      version: Reflect.getMetadata(VERSION_METADATA, handler),
    });
    Reflect.deleteMetadata(PATH_METADATA, handler);
    Reflect.deleteMetadata(METHOD_METADATA, handler);
  };
}
