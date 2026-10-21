import { DynamicModule, INestApplication, VersioningType } from '@nestjs/common';
import { AuthModule } from '@/auth/auth.module.js';
import { PrismaModule } from '@/prisma/prisma.module.js';
import { ProfileModule } from '@/profile/profile.module.js';
import { UsersModule } from '@/users/users.module.js';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { PermissionGuard } from '@/auth/guard/permission.guard.js';
import { RoleGuard } from '@/auth/guard/role.guard.js';
import { UeModule } from '@/ue/ue.module.js';
import { JwtGuard } from '@/auth/guard/index.js';
import { TimetableModule } from '@/timetable/timetable.module.js';
import { ConfigModule } from '@/config/config.module.js';
import { HttpModule } from '@/http/http.module.js';
import { BranchModule } from '@/branch/branch.module.js';
import { AssosModule } from '@/assos/assos.module.js';
import { TranslationInterceptor } from '@/app.interceptor.js';
import { SemesterModule } from '@/semester/semester.module.js';
import { ImageMediaModule } from '@/media/image/imagemedia.module.js';
import { MailModule } from '@/mail/mail.module.js';
import { AppValidationPipe } from '@/app.pipe.js';
import { NotFoundFilter } from '@/exceptions.js';

export class AppModule {
  static register(): DynamicModule {
    return {
      module: AppModule,
      imports: [
        ConfigModule,
        HttpModule,
        PrismaModule,
        ImageMediaModule,
        MailModule,
        SemesterModule,
        AuthModule.register(),
        ProfileModule,
        UsersModule,
        UeModule,
        TimetableModule,
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
    }
  }
  static initApp(app: INestApplication) {
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });
    // This env variable is not set in ConfigModule because we use it before modules are loaded
    app.setGlobalPrefix(process.env.API_PREFIX);
    app.useGlobalPipes(new AppValidationPipe());
    app.useGlobalFilters(new NotFoundFilter())
    app.enableCors({ origin: '*' });
  }
}
