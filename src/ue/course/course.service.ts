import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RawUeCourse } from 'src/prisma/types';
import { UeCourse } from './interfaces/course.interface';

@Injectable()
export class CourseService {
  constructor(private prisma: PrismaService) {}

  /**
   * Fetch the database and try to match the ueCourse with an existing ueCourse.
   * If found return it's id, otherwise null
   * @param course the course to match
   * @returns {Promise<string | null>}
   */
  async findCourse(course: UeCourse): Promise<string | null> {
    const result = await this.prisma.ueCourse.findFirst({
      select: {
        id: true,
      },
      where: {
        semesterId: course.semesterId,
        type: course.type,
        ue: {
          code: course.ueCode,
        },
        timetableEntry: {
          eventStart: course.timetableEntry.startDate,
          location: course.timetableEntry.location,
          type: 'COURSE',
        },
      },
    });
    return result?.id;
  }

  async createCourse(course: UeCourse): Promise<RawUeCourse> {
    const MS_IN_WEEKS = 1000 * 60 * 60 * 24 * 7;
    return await this.prisma.ueCourse.create({
      data: {
        type: course.type,
        ue: {
          connect: {
            code: course.ueCode,
          },
        },
        semester: {
          connect: {
            code: course.semesterId,
          },
        },
        timetableEntry: {
          create: {
            eventStart: course.timetableEntry.startDate,
            location: course.timetableEntry.location,
            type: 'COURSE',
            occurrencesCount: course.timetableEntry.count,
            occurrenceDuration: course.timetableEntry.duration,
            repeatEvery: MS_IN_WEEKS,
          },
        },
      },
    });
  }

  async addUserToCourse(courseId: string, userId: string) {
    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        courses: {
          connect: { id: courseId },
        },
      },
    });
  }
}
