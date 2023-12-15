import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import TimetableService from './timetable.service';

@Module({
  providers: [TimetableService],
  imports: [PrismaModule],
  exports: [TimetableService],
})
export class TimetableModule {}
