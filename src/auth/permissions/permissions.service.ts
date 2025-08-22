import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserPermission } from '../interfaces/permissions.interface';
import { PermissionManager } from '../../utils';

@Injectable()
export default class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPermissionsFromApiKeyId(apiKeyId: string): Promise<PermissionManager> {
    const rawPermissions = await this.prisma.apiKeyPermission.findMany({ where: { apiKey: { id: apiKeyId } } });
    const permissions = new PermissionManager();
    for (const permission of rawPermissions) {
      // If it's an API permission, permission.userId will be undefined, so it does not really matter that typing isn't exact here.
      permissions.add(permission.permission as UserPermission, permission.userId);
    }
    return permissions;
  }
}
