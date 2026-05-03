import { Global, Module } from '@nestjs/common';
import { AuthController } from '@/auth/auth.controller';
import { AuthService } from '@/auth/auth.service';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from '@/auth/strategy/jwt.strategy';
import { UsersModule } from '@/users/users.module';
import { LdapModule } from '@/ldap/ldap.module';
import { UeService } from '@/ue/ue.service';
import ApplicationController from '@/auth/application/application.controller';
import ApplicationService from '@/auth/application/application.service';
import PermissionsController from '@/auth/permissions/permissions.controller';
import PermissionsService from '@/auth/permissions/permissions.service';

@Global()
@Module({
  imports: [JwtModule.register({}), UsersModule],
  controllers: [AuthController, ApplicationController, PermissionsController],
  providers: [AuthService, JwtStrategy, ApplicationService, LdapModule, UeService, PermissionsService],
  exports: [],
})
export class AuthModule {}
