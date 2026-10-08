import { Global, Module } from '@nestjs/common';
import { UsersController } from '@/users/users.controller.js';
import { UsersService } from '@/users/users.service.js';
import { ImageMediaModule } from '@/media/image/imagemedia.module.js';

@Global()
@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
  imports: [ImageMediaModule],
})
export class UsersModule {}
