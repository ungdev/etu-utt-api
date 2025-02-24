import { PrismaService } from '../../prisma/prisma.service';
import { Application } from './interfaces/application.interface';
import { Injectable } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export default class ApplicationService {
  constructor(private prisma: PrismaService, private authService: AuthService) {}

  getFromUserId(userId: string): Promise<Application[]> {
    return this.prisma.apiApplication.findMany({ where: { userId } });
  }

  async createApplication(userId: string, applicationName: string, redirectUrl: string): Promise<Application> {
    return this.prisma.withDefaultBehaviour.apiApplication.create({
      data: {
        name: applicationName,
        redirectUrl,
        user: { connect: { id: userId } },
        clientSecret: AuthService.generateToken(),
      },
    });
  }

  async regenerateApiKeyToken(userId: string, applicationId: string, tokenExpiresIn?: number): Promise<string> {
    const updatedApiKey = await this.prisma.withDefaultBehaviour.apiKey.upsert({
      where: { userId_applicationId: { userId, applicationId } },
      update: { token: AuthService.generateToken(), tokenUpdatedAt: new Date() },
      create: { userId, applicationId, token: AuthService.generateToken(), tokenUpdatedAt: new Date() },
    });
    return this.authService.signAuthenticationToken(updatedApiKey.token, tokenExpiresIn);
  }

  async get(applicationId: string): Promise<Application> {
    return this.prisma.apiApplication.findUnique({ where: { id: applicationId } });
  }
}
