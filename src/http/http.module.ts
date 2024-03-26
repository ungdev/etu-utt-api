import { Global, Module } from '@nestjs/common';
import { HttpModule as AxiosHttpModule } from '@nestjs/axios';

/**
 * Module for the HTTP client. It's only purpose is to make the module global.
 * Works exactly the same as the native HttpModule.
 */
@Global()
@Module({
  imports: [AxiosHttpModule],
  exports: [AxiosHttpModule],
})
export class HttpModule {}
