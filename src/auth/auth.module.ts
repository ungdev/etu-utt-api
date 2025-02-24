import { Global, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategy';
import { UsersModule } from '../users/users.module';
import { LdapModule } from '../ldap/ldap.module';
import { UeService } from '../ue/ue.service';
import ApplicationController from './application/application.controller';
import ApplicationService from './application/application.service';

@Global()
@Module({
  imports: [JwtModule.register({}), UsersModule],
  controllers: [AuthController, ApplicationController],
  providers: [AuthService, JwtStrategy, ApplicationService, LdapModule, UeService],
  exports: [],
})
export class AuthModule {}
