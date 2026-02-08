import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { LinkService } from './link.service';
import { LinkResDto } from './dto/res/link-res.dto';
import { pick } from '../utils';
import { Link } from './link.interface';
import { IsPublic, RequireApiPermission } from '../auth/decorator';
import { LinkCreateReqDto } from './dto/req/link-create-req.dto';
import { AppException, ERROR_CODE } from '../exceptions';
import { ApiAppErrorResponse } from '../app.dto';
import { LinkUpdateReqDto } from './dto/req/link-update-req.dto';

@Controller('link')
export class LinkController {
  constructor(private readonly linkService: LinkService) {}

  @Get()
  @IsPublic()
  public async get() {
    return (await this.linkService.getLinks()).map(this.formatLink);
  }

  @Post()
  @RequireApiPermission('API_MODIFY_LINKS')
  @ApiAppErrorResponse(ERROR_CODE.LINK_ALREADY_EXISTS, 'This link already exists')
  public async create(@Body() dto: LinkCreateReqDto) {
    if (await this.linkService.linkExists(dto.link)) throw new AppException(ERROR_CODE.LINK_ALREADY_EXISTS);
    const link = await this.linkService.create(dto.name, dto.tooltip, dto.link);
    return this.formatLink(link);
  }

  @Patch('/:id')
  @RequireApiPermission('API_MODIFY_LINKS')
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_LINK)
  public async update(@Body() dto: LinkUpdateReqDto) {
    if (!(await this.linkService.idExists(dto.id))) throw new AppException(ERROR_CODE.NO_SUCH_LINK, dto.id);
    const link = await this.linkService.update(dto.id, pick(dto, 'name', 'tooltip', 'link'));
    return this.formatLink(link);
  }

  formatLink(link: Link): LinkResDto {
    return pick(link, 'id', 'name', 'tooltip', 'link');
  }
}