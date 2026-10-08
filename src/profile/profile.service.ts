import { PrismaService } from '@/prisma/prisma.service.js';
import { RawHomepageWidget } from '@/prisma/types.js';
import { HomepageWidgetsUpdateElement } from '@/profile/dto/req/homepage-widgets-update-req.dto.js';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  getHomepageWidgets(userId: string): Promise<RawHomepageWidget[]> {
    return this.prisma.userHomepageWidget.findMany({
      where: {
        userId,
      },
      orderBy: {
        x: 'asc',
      },
    });
  }

  async setHomepageWidgets(userId: string, widgets: HomepageWidgetsUpdateElement[]): Promise<RawHomepageWidget[]> {
    return (
      await this.prisma.user.update({
        where: { id: userId },
        data: { homepageWidgets: { deleteMany: {}, createMany: { data: widgets } } },
        select: {
          homepageWidgets: {
            orderBy: {
              x: 'asc',
            },
          },
        },
      })
    ).homepageWidgets;
  }
}
