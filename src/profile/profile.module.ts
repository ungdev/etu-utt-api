import { Module } from '@nestjs/common';
import { ProfileController } from '@/profile/profile.controller.js';
import { ProfileService } from '@/profile/profile.service.js';
import { PrismaModule } from '@/prisma/prisma.module.js';
import { UsersModule } from '@/users/users.module.js';

@Module({
  controllers: [ProfileController],
  providers: [ProfileService],
  imports: [PrismaModule, UsersModule],
})
export class ProfileModule {}
