import { Module } from '@nestjs/common';
import { AnnalsService } from './annals.service';
import { AnnalsController } from './annals.controller';
import { UEService } from '../ue.service';

@Module({
  controllers: [AnnalsController],
  providers: [AnnalsService, UEService],
})
export class AnnalsModule {}
