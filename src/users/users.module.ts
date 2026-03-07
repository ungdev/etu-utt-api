import { Global, Module } from '@nestjs/common';
import UsersController from '@/users/users.controller';
import UsersService from '@/users/users.service';
import { ImageMediaModule } from '@/media/image/imagemedia.module';

@Global()
@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
  imports: [ImageMediaModule],
})
export class UsersModule {}
