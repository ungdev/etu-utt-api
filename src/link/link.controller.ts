import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Patch, Post } from '@nestjs/common';
import { LinkService } from './link.service';
import { LinkResDto } from './dto/res/link-res.dto';
import { PermissionManager, pick } from '../utils';
import { Link } from './link.interface';
import { GetUser, IsPublic, RequireApiPermission } from '../auth/decorator';
import { LinkReqDto } from './dto/req/link-req.dto';
import { AppException, ERROR_CODE } from '../exceptions';
import { ApiAppErrorResponse } from '../app.dto';
import { UUIDParam } from '../app.pipe';
import { User } from '../users/interfaces/user.interface';
import { GetPermissions } from '../auth/decorator/get-permissions.decorator';
import { HttpStatusCode } from 'axios';
import { ApiOperation } from '@nestjs/swagger';

@Controller('link')
export class LinkController {
  constructor(private readonly linkService: LinkService) {}

  @Get()
  @IsPublic()
  @ApiOperation({ description: 'Returns all the links. If user is not connected, only public links will get returned.' })
  public async get(@GetUser() user: User, @GetPermissions() permissions: PermissionManager) {
    let links = await this.linkService.getLinks();
    if (!user) {
      links = links.filter((link) => link.public);
    }
    return links
      .mappedSort((link) => link.position)
      .map((link) => this.formatLink(link, permissions.can('API_MODIFY_LINKS')));
  }

  @Post()
  @RequireApiPermission('API_MODIFY_LINKS')
  @ApiOperation({ description: 'Creates a link.' })
  @ApiAppErrorResponse(ERROR_CODE.LINK_ALREADY_EXISTS, 'This link already exists')
  public async create(@Body() dto: LinkReqDto) {
    if (await this.linkService.hyperlinkExists(dto.hyperlink)) throw new AppException(ERROR_CODE.LINK_ALREADY_EXISTS);
    const link = await this.linkService.create(dto.name, dto.tooltip, dto.hyperlink, dto.public, dto.position);
    return this.formatLink(link, true);
  }

  @Patch('/:id')
  @RequireApiPermission('API_MODIFY_LINKS')
  @ApiOperation({ description: 'Updates a link with the given body. Any field not in the body will not be updated.' })
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_LINK)
  public async update(@UUIDParam('id') id: string, @Body() dto: LinkReqDto) {
    if (!(await this.linkService.idExists(id))) throw new AppException(ERROR_CODE.NO_SUCH_LINK, id);
    const link = await this.linkService.update(id, {
      ...pick(dto, 'name', 'tooltip', 'hyperlink', 'position'),
      public_: dto.public,
    });
    return this.formatLink(link, true);
  }

  @Delete('/:id')
  @RequireApiPermission('API_MODIFY_LINKS')
  @ApiOperation({ description: 'Deletes a link.' })
  @ApiAppErrorResponse(ERROR_CODE.NO_SUCH_LINK)
  public async delete(@UUIDParam('id') id: string) {
    if (!(await this.linkService.idExists(id))) throw new AppException(ERROR_CODE.NO_SUCH_LINK, id);
    const link = await this.linkService.delete(id);
    return this.formatLink(link, true);
  }

  formatLink(link: Link, admin: boolean): LinkResDto {
    return {
      ...pick(link, 'id', 'name', 'tooltip', 'hyperlink'),
      ...(admin ? { public: link.public } : {}),
    };
  }
}