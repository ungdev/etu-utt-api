import { PrismaService } from '../prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { RawSemester } from '../prisma/types';

@Injectable()
export class SemesterService {
  constructor(private prisma: PrismaService) {}

  async getCurrentSemester(): Promise<RawSemester | null> {
    /*const concurrentCurrentSemesters = await this.prisma.semester.findMany({
      where: {
        end: {
          gte: new Date(),
        },
        start: {
          lte: new Date(),
        },
      },
    });
    if (concurrentCurrentSemesters.length)
      return concurrentCurrentSemesters.mappedSort((semester) => semester.start).reverse()[0];
    // Find new semester end date
    const endDate =
      (
        await this.prisma.semester.findFirst({
          where: {
            end: {
              lt: new Date(),
            },
          },
          orderBy: {
            end: 'desc',
          },
        })
      )?.end ?? new Date(Date.now() - 1000); // Ensure dates are different
    do {
      endDate.setMonth(endDate.getMonth() + 6);
    } while (endDate < new Date());
    const startDate = new Date(endDate);
    startDate.setMonth(startDate.getMonth() - 6);
    const middleOfSemester = new Date(startDate);
    middleOfSemester.setMonth(middleOfSemester.getMonth() + 3);
    return this.prisma.semester.create({
      data: {
        code: `${middleOfSemester.getMonth() <= 6 ? 'P' : 'A'}${middleOfSemester.getFullYear() % 100}`,
        start: startDate,
        end: endDate,
      },
    });*/
    return this.prisma.semester.findFirst({
      where: {
        end: {
          gte: new Date(),
        },
        start: {
          lte: new Date(),
        },
      },
    });
  }
}
