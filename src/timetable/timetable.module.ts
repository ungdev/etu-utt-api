import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module.js';
import { TimetableService } from '@/timetable/timetable.service.js';
import { TimetableController } from '@/timetable/timetable.controller.js';
import { UeModule } from '@/ue/ue.module.js';

@Module({
  controllers: [TimetableController],
  providers: [TimetableService],
  imports: [PrismaModule, UeModule],
  exports: [TimetableService],
})
export class TimetableModule {}
