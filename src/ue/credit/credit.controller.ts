import { CreditService } from './credit.service';
import { Controller, Get } from '@nestjs/common';
import { IsPublic } from '../../auth/decorator';
import { CreditCategory } from './interfaces/credit-category.interface';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import CreditCategoryResDto from './dto/res/credit-category-res.dto';

@Controller('ue/credit')
@ApiTags('UE Credit')
export class CreditController {
  constructor(private creditService: CreditService) {}

  @Get()
  @IsPublic()
  @ApiOperation({ description: 'Get the different credit categories available at the UTT.' })
  @ApiOkResponse({ type: CreditCategoryResDto })
  async getCreditCategories(): Promise<CreditCategory[]> {
    return this.creditService.getCreditCategories();
  }
}
