import { CreditService } from '@/ue/credit/credit.service';
import { Controller, Get } from '@nestjs/common';
import { IsPublic } from '@/auth/decorator';
import { CreditCategory } from '@/ue/credit/interfaces/credit-category.interface';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import CreditCategoryResDto from '@/ue/credit/dto/res/credit-category-res.dto';

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
