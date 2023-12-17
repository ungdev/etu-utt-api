import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import TimetableService from './timetable.service';
import { TimetableController } from './timetable.controller';

@Module({
  controllers: [TimetableController],
  providers: [TimetableService],
  imports: [PrismaModule],
  exports: [TimetableService],
})
export class TimetableModule {}
