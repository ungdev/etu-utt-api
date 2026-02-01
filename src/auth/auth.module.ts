import { DynamicModule, Global, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategy/jwt.strategy';
import { UsersModule } from '../users/users.module';
import { LdapModule } from '../ldap/ldap.module';
import { UeService } from '../ue/ue.service';
import ApplicationController from './application/application.controller';
import ApplicationService from './application/application.service';
import PermissionsController from './permissions/permissions.controller';
import PermissionsService from './permissions/permissions.service';
import { isProdEnv } from '../config/config.module';
import { AuthDebugController } from './auth-debug.controller';

/*@Global()
@Module({
  imports: [JwtModule.register({}), UsersModule],
  controllers: [AuthController, ApplicationController, PermissionsController, ...additionalControllers],
  providers: [AuthService, JwtStrategy, ApplicationService, LdapModule, UeService, PermissionsService],
  exports: [],
})*/
export class AuthModule {
  static register(): DynamicModule {
    const additionalControllers = isProdEnv() ? [] : [AuthDebugController];
    return {
      module: AuthModule,
      global: true,
      imports: [JwtModule.register({}), UsersModule],
      controllers: [AuthController, ApplicationController, PermissionsController, ...additionalControllers],
      providers: [AuthService, JwtStrategy, ApplicationService, LdapModule, UeService, PermissionsService],
      exports: [],
    };
  }
}
