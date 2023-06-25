import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { ProfileModule } from './profile/profile.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Ok, for some reason it still loads the normal .env file.
      // I tried to remove the ternary to make it always load the .env.test file.
      // It loads the .env.test file properly, but overrides it with the normal .env file
      // envFilePath: process.env.NODE_ENV === 'test' ? '.env' : '.env.test',
    }),
    PrismaModule,
    AuthModule,
    ProfileModule,
  ],
})
export class AppModule {}
