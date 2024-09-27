import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import TimetableService from './timetable.service';
import { TimetableController } from './timetable.controller';
import { UeModule } from 'src/ue/ue.module';

@Module({
  controllers: [TimetableController],
  providers: [TimetableService],
  imports: [PrismaModule, UeModule],
  exports: [TimetableService],
})
export class TimetableModule {}
