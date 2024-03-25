import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Ok, for some reason it still loads the normal .env.dev file.
      // I tried to remove the ternary to make it always load the .env.dev.test file.
      // It loads the .env.dev.test file properly, but overrides it with the normal .env.dev file
      envFilePath: process.env.NODE_ENV === 'test' ? '.env.test' : '.env.dev',
    }),
    PrismaModule,
    AuthModule,
    ProfileModule,
    UsersModule,
    AnnalsModule, // Order is important: this module SHALL be imported before UEModule
    CommentsModule, // Must be imported before UEModule
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
    {
      provide: APP_GUARD,
      useClass: RoleGuard,
    },
  ],
})
export class AppModule {}
