import { Global, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategy';
import { UsersModule } from '../users/users.module';
import { LdapModule } from '../ldap/ldap.module';
import { UeService } from '../../src/ue/ue.service';

@Global()
@Module({
  imports: [JwtModule.register({}), UsersModule],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, LdapModule, UeService],
  exports: [JwtStrategy],
})
export class AuthModule {}
