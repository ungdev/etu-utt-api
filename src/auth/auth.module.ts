import { Global, Module } from '@nestjs/common';
import { AuthController } from '@/auth/auth.controller.js';
import { AuthService } from '@/auth/auth.service.js';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from '@/auth/strategy/jwt.strategy.js';
import { UsersModule } from '@/users/users.module.js';
import { LdapModule } from '@/ldap/ldap.module.js';
import { UeService } from '@/ue/ue.service.js';
import { ApplicationController } from '@/auth/application/application.controller.js';
import { ApplicationService } from '@/auth/application/application.service.js';
import { PermissionsController } from '@/auth/permissions/permissions.controller.js';
import { PermissionsService } from '@/auth/permissions/permissions.service.js';

@Global()
@Module({
  imports: [JwtModule.register({}), UsersModule],
  controllers: [AuthController, ApplicationController, PermissionsController],
  providers: [AuthService, JwtStrategy, ApplicationService, LdapModule, UeService, PermissionsService],
  exports: [],
})
export class AuthModule {}
