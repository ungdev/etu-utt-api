import { CreditService } from './credit.service';
import { Controller, Get } from '@nestjs/common';
import { IsPublic } from '../../auth/decorator';

@Controller('ue/credit')
export class CreditController {
  constructor(private creditService: CreditService) {}

  @Get()
  @IsPublic()
  async getCreditCategories() {
    return this.creditService.getCreditCategories();
  }
}
