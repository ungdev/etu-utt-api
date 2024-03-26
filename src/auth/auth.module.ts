import { Global, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategy';
import { UsersModule } from '../users/users.module';
import { LdapModule } from '../ldap/ldap.module';
import { UEModule } from 'src/ue/ue.module';

@Global()
@Module({
  imports: [JwtModule.register({}), UsersModule],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, LdapModule, UEModule],
  exports: [JwtStrategy],
})
export class AuthModule {}
