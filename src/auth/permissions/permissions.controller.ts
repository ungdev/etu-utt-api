import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import PermissionsService from './permissions.service';
import { GetPermissions } from '../decorator/get-permissions.decorator';
import { PermissionManager } from '../../utils';
import PermissionsResDto from './dto/res/permissions.dto';
import { AuthService } from '../auth.service';
import { AppException, ERROR_CODE } from '../../exceptions';

@Controller('auth/permissions')
@ApiTags('Permissions')
export default class PermissionsController {
  constructor(private permissionsService: PermissionsService, private authService: AuthService) {}

  @Get('/current')
  @ApiOperation({ description: 'Returns the permission of an application.' })
  @ApiOkResponse({ type: PermissionsResDto })
  getOwnPermissions(@GetPermissions() permissions: PermissionManager): PermissionsResDto {
    return this.formatPermissions(permissions);
  }

  @Get('/:apiKey')
  @ApiOperation({ description: 'Returns the permission of an application.' })
  @ApiOkResponse({ type: () => PermissionsResDto })
  async getPermissions(@Param('apiKey') apiKey: string): Promise<PermissionsResDto> {
    if (!(await this.authService.doesApiKeyExist(apiKey))) throw new AppException(ERROR_CODE.NO_SUCH_API_KEY, apiKey);
    const permissions = await this.permissionsService.getPermissionsFromApiKeyId(apiKey);
    return this.formatPermissions(permissions);
  }

  private formatPermissions(permissions: PermissionManager): PermissionsResDto {
    return {
      hardPermissions: permissions.hardPermissions.sort(),
      softPermissions: Object.entries(permissions.softPermissions).map(([permission, users]) => ({
        permission,
        users,
      })).mappedSort((permission) => permission.permission),
    };
  }
}
