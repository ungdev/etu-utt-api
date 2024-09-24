import { PrismaService } from '../prisma/prisma.service';
import { RawHomepageWidget } from '../prisma/types';
import { HomepageWidgetsUpdateElement } from './dto/req/homepage-widgets-update-req.dto';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  getHomepageWidgets(userId: string): Promise<RawHomepageWidget[]> {
    return this.prisma.userHomepageWidget.findMany({
      where: {
        userId,
      },
    });
  }

  async setHomepageWidgets(userId: string, widgets: HomepageWidgetsUpdateElement[]): Promise<RawHomepageWidget[]> {
    return (
      await this.prisma.withDefaultBehaviour.user.update({
        where: { id: userId },
        data: { homepageWidgets: { deleteMany: {}, createMany: { data: widgets } } },
        select: { homepageWidgets: true },
      })
    ).homepageWidgets;
  }
}
