import { Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { ConfigService } from '@/config/config.service.js';

import { ApiAppErrorResponse } from '@/app.dto.js';
import { AppException, ERROR_CODE } from '@/exceptions.js';
import { UeSyncResDto } from '@/webhooks/dto/ue-sync-res.dto.js';
import { WebhooksService } from '@/webhooks/webhooks.service.js';
import { UeSyncStats } from '@/webhooks/interfaces/ue.interface.js';
import { ShardExclusive } from '@/sharding/shard.decorator.js';
import { IsPublic } from '@/auth/decorator/public.decorator.js';

@Controller('')
@ApiTags('Webhooks')
export class WebhooksController {
  constructor(
    readonly config: ConfigService,
    readonly webhooksService: WebhooksService,
  ) {}

  @ShardExclusive('webhooks')
  @IsPublic()
  @Post('/assos/sync')
  @ApiOperation({
    description: "Triggers the synchronisation of the Associations emails adresses from the UTT's Sympa API.",
  })
  @ApiAppErrorResponse(ERROR_CODE.WEBHOOK_NOT_IMPLEMENTED_YET, 'This webhook is not implemented yet')
  async syncAssosFromSympa() {
    throw new AppException(ERROR_CODE.WEBHOOK_NOT_IMPLEMENTED_YET);
  }

  @ShardExclusive('webhooks')
  @IsPublic()
  @Post('/assos/weekly/send')
  @ApiOperation({
    description: 'Triggers the sending of the weekly events email.',
  })
  @ApiAppErrorResponse(ERROR_CODE.WEBHOOK_NOT_IMPLEMENTED_YET, 'This webhook is not implemented yet')
  async sendWeekly() {
    throw new AppException(ERROR_CODE.WEBHOOK_NOT_IMPLEMENTED_YET);
  }

  @ShardExclusive('webhooks')
  @IsPublic()
  @Post('/ue/sync')
  @ApiOperation({
    description: "Triggers the synchronisation of the UEs from the UTT's SIEP API.",
  })
  @ApiOkResponse({ type: UeSyncResDto })
  @ApiAppErrorResponse(ERROR_CODE.WEBHOOK_SYNC_UE_FAILED, 'The DNUM UE synchronization could not be completed')
  async syncUesFromDnumAPI(): Promise<UeSyncStats> {
    return this.webhooksService.syncUesFromDnumAPI();
  }

  @ShardExclusive('webhooks')
  @IsPublic()
  @Post('/media/purge')
  @ApiOperation({
    description: 'Triggers the purging of unused media files.',
  })
  @ApiAppErrorResponse(ERROR_CODE.WEBHOOK_NOT_IMPLEMENTED_YET, 'This webhook is not implemented yet')
  async purgeUnusedMedia() {
    throw new AppException(ERROR_CODE.WEBHOOK_NOT_IMPLEMENTED_YET);
  }
}
