import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { LinkService } from './link.service';
import { LinkResDto } from './dto/res/link-res.dto';
import { getTranslation, pick } from '../utils';
import { Link } from './link.interface';
import { IsPublic, RequireApiPermission } from '../auth/decorator';
import { LinkReqDto } from './dto/req/link-req.dto';
import { AppException, ERROR_CODE } from '../exceptions';
import { ApiAppErrorResponse } from '../app.dto';
import { Language } from '@prisma/client';
import { GetLanguage } from '../app.decorator';
import { UUIDParam } from '../app.pipe';

@Controller('link')
export class LinkController {
  constructor(private readonly linkService: LinkService) {}

  @Get()
  @IsPublic()
  public async get(@GetLanguage() language: Language) {
    return (await this.linkService.getLinks()).mappedSort((link) => getTranslation(link.name, language)).map(this.formatLink);
  }

  @Post()
  @RequireApiPermission('API_MODIFY_LINKS')
  @ApiAppErrorResponse(ERROR_CODE.LINK_ALREADY_EXISTS, 'This link already exists')
  public async create(@Body() dto: LinkReqDto) {
    if (await this.linkService.hyperlinkExists(dto.hyperlink)) throw new AppException(ERROR_CODE.LINK_ALREADY_EXISTS);
    const link = await this.linkService.create(dto.name, dto.tooltip, dto.hyperlink);
    return this.formatLink(link);
  }

  @Patch('/:id')
  @RequireApiPermission('API_MODIFY_LINKS')
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_LINK)
  public async update(@UUIDParam('id') id, @Body() dto: LinkReqDto) {
    if (!(await this.linkService.idExists(id))) throw new AppException(ERROR_CODE.NO_SUCH_LINK, id);
    const link = await this.linkService.update(id, pick(dto, 'name', 'tooltip', 'hyperlink'));
    return this.formatLink(link);
  }

  formatLink(link: Link): LinkResDto {
    return pick(link, 'id', 'name', 'tooltip', 'hyperlink');
  }
}