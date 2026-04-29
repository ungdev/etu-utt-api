import { Injectable } from '@nestjs/common';
import { AssoWeekly } from '../interfaces/weekly.interface';
import { Prisma } from '../../prisma/build/client';
import { Translation } from '../../prisma/types';
import WeeklyResDto from './dto/res/weekly-res.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '../../config/config.service';

@Injectable()
export default class WeeklyService {
  constructor(readonly prisma: PrismaService, readonly config: ConfigService) {}

  async searchWeeklies(assoId: string, from: Date, to: Date, page: number): Promise<{ weeklies: AssoWeekly[], count: number }> {
    const where = {
      assoId,
      date: { gte: from, lte: to },
    } satisfies Prisma.AssoWeeklyWhereInput;
    const count = await this.prisma.assoWeekly.count({ where });
    const weeklies = await this.prisma.normalize.assoWeekly.findMany({ where, skip: (page - 1) * this.config.PAGINATION_PAGE_SIZE, take: this.config.PAGINATION_PAGE_SIZE });
    return { weeklies, count };
  }

  async addWeekly(assoId: string, title: Translation, message: Translation, date): Promise<AssoWeekly> {
    return this.prisma.normalize.assoWeekly.create({
      data: {
        asso: { connect: { id: assoId } },
        titleTranslation: { create: title },
        bodyTranslation: { create: message },
        date,
      }
    });
  }

  getWeeklySendDate(sendWeek: Date): Date {
    return new Date(
      Date.UTC(
        sendWeek.getUTCFullYear(),
        sendWeek.getUTCMonth(),
        sendWeek.getUTCDate() + this.config.WEEKLY_SEND_DAY,
        this.config.WEEKLY_SEND_HOUR,
        0,
        -Date.getTimezoneOffset('Europe/Paris')
      )
    );
  }

  async getWeekly(weeklyId: string, assoId?: string): Promise<WeeklyResDto> {
    return this.prisma.normalize.assoWeekly.findUnique({ where: { id: weeklyId, assoId } });
  }

  async hasWeekly(assoId: string, date: Date, exclude: string = undefined): Promise<boolean> {
    return (await this.prisma.assoWeekly.count({
      where: {
        assoId,
        date,
        ...(exclude ? { id: { not: exclude } } : {})
      }
    })) > 0;
  }

  async updateWeekly(weeklyId: string, fields: { title: Translation, message: Translation, date: Date }): Promise<AssoWeekly> {
    return this.prisma.normalize.assoWeekly.update({
      where: { id: weeklyId },
      data: {
        titleTranslation: { update: fields.title },
        bodyTranslation: { update: fields.message },
        date: fields.date,
      }
    });
  }

  async deleteWeekly(weeklyId: string): Promise<AssoWeekly> {
    return this.prisma.normalize.assoWeekly.delete({ where: { id: weeklyId } });
  }
}