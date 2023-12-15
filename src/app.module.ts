import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { ProfileModule } from './profile/profile.module';
import { UsersModule } from './users/users.module';
import { TimetableModule } from './timetable/timetable.module';
import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import TimetableService from './timetable/timetable.service';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';

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
    TimetableModule,
  ],
})
export class AppModule implements OnModuleInit {
  constructor(private timetableService: TimetableService, private prisma: PrismaService) {}
  async onModuleInit() {
    console.log('Module initialized');
    const entry = await this.prisma.timetableEntry.create({
      data: {
        eventStart: new Date(Date.now()),
        eventEnd: new Date(Date.now()),
        type: 'CUSTOM',
        timetableGroup: { create: { name: 'tkt' } },
      },
      select: { timetableGroup: true },
    });
    const user1 = await this.prisma.user.create({
      data: {
        login: randomStringGenerator(),
        hash: 'aaa',
        firstName: 'User1',
        lastName: 'blibli',
        UserTimetableGroup: { create: { timetableGroupId: entry.timetableGroup.id, priority: 1 } },
      },
    });
    await this.prisma.user.create({
      data: {
        login: randomStringGenerator(),
        hash: 'aaa',
        firstName: 'User2',
        lastName: 'blublublu',
        UserTimetableGroup: { create: { timetableGroupId: entry.timetableGroup.id, priority: 1 } },
      },
    });
    await this.timetableService.getTimetableOfUserInNextXSeconds(user1.id, new Date(), 0);
  }
}
