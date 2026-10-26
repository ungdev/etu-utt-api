import { ConsoleLogger } from '@nestjs/common';
import { skippedRoutes } from './shard.decorator.js';

export class ShardingAwareLogger extends ConsoleLogger {
  log(message: any, ...optionalParams: any[]) {
    super.log(message, ...optionalParams);

    const context = optionalParams.at(-1);

    if (context === 'RoutesResolver' && typeof message === 'string' && message.split(' ')[0] in skippedRoutes) {
      const version = message.match(/\(version: (.*?)\)/)[1];
      for (const route of skippedRoutes[message.split(' ')[0]])
        super.warn(
          `Skipped {${route.path}, ${route.method}} (version: ${route.version || version}) route`,
          'RouterExplorer',
        );
    }
  }
}
