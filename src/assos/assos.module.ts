import { Module } from '@nestjs/common';
import { AssosController } from '@/assos/assos.controller.js';
import { AssosService } from '@/assos/assos.service.js';
import { ImageMediaModule } from '@/media/image/imagemedia.module.js';
import { LexicalModule } from '@/lexical/lexical.module.js';
import { UsersService } from '@/users/users.service.js';
import { WeeklyWithoutAssoIdController } from '@/assos/weekly/weekly-without-asso-id.controller.js';
import { WeeklyWithAssoIdController } from '@/assos/weekly/weekly-with-asso-id.controller.js';
import { WeeklyService } from '@/assos/weekly/weekly.service.js';

/**
 * Defines the `Assos` module. This module handles all routes prefixed by `/assos`.
 * Includes `Assos` listing, details
 */
@Module({
  controllers: [AssosController, WeeklyWithoutAssoIdController, WeeklyWithAssoIdController],
  providers: [AssosService, WeeklyService, UsersService],
  imports: [ImageMediaModule, LexicalModule],
})
export class AssosModule {}
