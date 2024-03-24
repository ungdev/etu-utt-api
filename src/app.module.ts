import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
//import { ConfigModule } from '@nestjs/config';
import { ProfileModule } from './profile/profile.module';
import { UsersModule } from './users/users.module';
import { APP_GUARD } from '@nestjs/core';
import { PermissionGuard } from './auth/guard/permission.guard';
import { UEModule } from './ue/ue.module';
import { JwtGuard } from './auth/guard';
import { TimetableModule } from './timetable/timetable.module';
import { ConfigModule } from './config/config.module';
import { HttpModule } from './http/http.module';

@Module({
  imports: [
    ConfigModule,
    HttpModule,
    PrismaModule,
    AuthModule,
    ProfileModule,
    UsersModule,
    UEModule,
    TimetableModule,
  ],
  // The providers below are used for all the routes of the api.
  // For example, the JwtGuard is used for all the routes and checks whether the user is authentified.
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
  ],
})
export class AppModule {}
