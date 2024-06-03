import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
//import { ConfigModule } from '@nestjs/config';
import { ProfileModule } from './profile/profile.module';
import { UsersModule } from './users/users.module';
import { APP_GUARD } from '@nestjs/core';
import { PermissionGuard } from './auth/guard/permission.guard';
import { RoleGuard } from './auth/guard/role.guard';
import { UEModule } from './ue/ue.module';
import { JwtGuard } from './auth/guard';
import { TimetableModule } from './timetable/timetable.module';
import { AnnalsModule } from './ue/annals/annals.module';
import { CommentsModule } from './ue/comments/comments.module';
import { ConfigModule } from './config/config.module';
import { HttpModule } from './http/http.module';
import { BranchModule } from './branch/branch.module';

@Module({
  imports: [
    ConfigModule,
    HttpModule,
    PrismaModule,
    AuthModule,
    ProfileModule,
    UsersModule,
    AnnalsModule, // Order is important: this module SHALL be imported before UEModule
    CommentsModule, // Must be imported before UEModule
    UEModule,
    TimetableModule,
    BranchModule,
  ],
  // The providers below are used for all the routes of the api.
  // For example, the JwtGuard is used for all the routes and checks whether the user is authenticated.
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RoleGuard,
    },
  ],
})
export class AppModule {}
