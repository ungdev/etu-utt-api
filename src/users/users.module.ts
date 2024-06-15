import { Global, Module } from '@nestjs/common';
import UsersController from './users.controller';
import UsersService from './users.service';

@Global()
@Module({ controllers: [UsersController], providers: [UsersService], exports: [UsersService] })
export class UsersModule {}
