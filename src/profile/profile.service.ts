import { PrismaService } from '../prisma/prisma.service';
import { RawParkingWidget } from '../prisma/types';
import { ParkingUpdateElement } from './dto/parking-update.dto';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  getParking(userId: string): Promise<RawParkingWidget[]> {
    return this.prisma.userParkingWidget.findMany({
      where: {
        userId,
      },
    });
  }

  async setParking(userId: string, parking: ParkingUpdateElement[]): Promise<RawParkingWidget[]> {
    return (
      await this.prisma.withDefaultBehaviour.user.update({
        where: { id: userId },
        data: { parkingWidgets: { deleteMany: {}, createMany: { data: parking } } },
        select: { parkingWidgets: true },
      })
    ).parkingWidgets;
  }
}
