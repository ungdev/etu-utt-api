import { Module } from '@nestjs/common';
import { AssosController } from './assos.controller';
import { AssosService } from './assos.service';
import UsersService from '../users/users.service';

/**
 * Defines the `Assos` module. This module handles all routes prefixed by `/assos`.
 * Includes `Assos` listing, details
 */
@Module({
  controllers: [AssosController],
  providers: [AssosService, UsersService],
})
export class AssosModule {}
