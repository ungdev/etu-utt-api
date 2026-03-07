import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { ConfigService, isTestEnv } from '@/config/config.service';

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      // Ok, for some reason it still loads the normal .env.dev file.
      // I tried to remove the ternary to make it always load the .env.dev.test file.
      // It loads the .env.dev.test file properly, but overrides it with the normal .env.dev file
      envFilePath: isTestEnv ? '.env.test' : '.env.dev',
    }),
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
