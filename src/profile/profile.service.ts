import { PrismaService } from '../prisma/prisma.service';
import { RawParkingWidget } from '../prisma/types';
import { ParkingUpdateDto } from './dto/parking-update.dto';
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

  async setParking(userId: string, parking: ParkingUpdateDto[]): Promise<RawParkingWidget[]> {
    return (
      await this.prisma.withDefaultBehaviour.user.update({
        where: { id: userId },
        data: { userParkingWidget: { deleteMany: {}, createMany: { data: parking } } },
        select: { userParkingWidget: true },
      })
    ).userParkingWidget;
  }
}
