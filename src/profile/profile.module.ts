import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';

@Module({
  controllers: [ProfileController],
  providers: [ProfileService],
  imports: [PrismaModule, UsersModule],
})
export class ProfileModule {}
