import { PrismaService } from '../../prisma/prisma.service';
import { Application } from './interfaces/application.interface';
import { Injectable } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export default class ApplicationService {
  constructor(private prisma: PrismaService, private authService: AuthService) {}

  getFromUserId(userId: string): Promise<Application[]> {
    return this.prisma.normalize.apiApplication.findMany({ where: { ownerId: userId } });
  }

  async createApplication(userId: string, applicationName: string, redirectUrl: string): Promise<Application> {
    return this.prisma.normalize.apiApplication.create({
      data: {
        name: applicationName,
        redirectUrl,
        owner: { connect: { id: userId } },
        clientSecret: AuthService.generateToken(),
      },
    });
  }

  async exists(applicationId: string): Promise<boolean> {
    return (await this.prisma.apiApplication.count({ where: { id: applicationId } })) > 0;
  }

  async get(applicationId: string): Promise<Application> {
    return this.prisma.normalize.apiApplication.findUnique({ where: { id: applicationId } });
  }

  async regenerateClientSecret(applicationId: string): Promise<string> {
    const updatedApplication = await this.prisma.apiApplication.update({
      where: { id: applicationId },
      data: { clientSecret: AuthService.generateToken() },
    });
    return updatedApplication.clientSecret;
  }

  async regenerateApiKeyToken(userId: string, applicationId: string, tokenExpiresIn?: number): Promise<string> {
    const updatedApiKey = await this.prisma.apiKey.upsert({
      where: { userId_applicationId: { userId, applicationId } },
      update: { token: AuthService.generateToken() },
      create: { userId, applicationId, token: AuthService.generateToken() },
    });
    return this.authService.signAuthenticationToken(updatedApiKey.token, tokenExpiresIn);
  }
}
