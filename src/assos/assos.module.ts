import { Module } from '@nestjs/common';
import { AssosController } from './assos.controller';
import { AssosService } from './assos.service';
import { ImageMediaModule } from '../media/image/imagemedia.module';
import { LexicalModule } from '../lexical/lexical.module';
import UsersService from '../users/users.service';
import WeeklyWithoutAssoidController from './weekly/weekly-without-asso-id.controller';
import { WeeklyWithAssoIdController } from './weekly/weekly-with-asso-id.controller';
import WeeklyService from './weekly/weekly.service';

/**
 * Defines the `Assos` module. This module handles all routes prefixed by `/assos`.
 * Includes `Assos` listing, details
 */
@Module({
  controllers: [AssosController, WeeklyWithoutAssoidController, WeeklyWithAssoIdController],
  providers: [AssosService, WeeklyService, UsersService],
  imports: [ImageMediaModule, LexicalModule],
})
export class AssosModule {}
