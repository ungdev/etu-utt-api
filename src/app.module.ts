import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProfileModule } from './profile/profile.module';
import { UsersModule } from './users/users.module';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { PermissionGuard } from './auth/guard/permission.guard';
import { RoleGuard } from './auth/guard/role.guard';
import { UeModule } from './ue/ue.module';
import { JwtGuard } from './auth/guard';
//import { TimetableModule } from './timetable/timetable.module';
import { ConfigModule } from './config/config.module';
import { HttpModule } from './http/http.module';
import { BranchModule } from './branch/branch.module';
import { AssosModule } from './assos/assos.module';
import { TranslationInterceptor } from './app.interceptor';
import { SemesterModule } from './semester/semester.module';

@Module({
  imports: [
    ConfigModule,
    HttpModule,
    PrismaModule,
    SemesterModule,
    AuthModule,
    ProfileModule,
    UsersModule,
    UeModule,
    /// FOR THE MOMENT, DON'T CARE ABOUT THIS MODULE
    /// WE WILL SEE LATER HOW WE MANAGE TIMETABLES, IF WE EVEN MANAGE THEM AT ALL
    //TimetableModule,
    BranchModule,
    AssosModule,
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
    {
      provide: APP_INTERCEPTOR,
      useClass: TranslationInterceptor,
    },
  ],
})
export class AppModule {}
