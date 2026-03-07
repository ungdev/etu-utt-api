import { Module } from '@nestjs/common';
import { AssosController } from '@/assos/assos.controller';
import { AssosService } from '@/assos/assos.service';
import { ImageMediaModule } from '@/media/image/imagemedia.module';
import { LexicalModule } from '@/lexical/lexical.module';
import UsersService from '@/users/users.service';
import WeeklyWithoutAssoidController from '@/assos/weekly/weekly-without-asso-id.controller';
import { WeeklyWithAssoIdController } from '@/assos/weekly/weekly-with-asso-id.controller';
import WeeklyService from '@/assos/weekly/weekly.service';

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
