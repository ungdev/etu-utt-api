import { Module } from '@nestjs/common';
import { UEController } from './ue.controller';
import { UEService } from './ue.service';

@Module({
  controllers: [UEController],
  providers: [UEService],
})
export class UEModule {}
