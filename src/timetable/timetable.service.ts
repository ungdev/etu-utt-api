import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TimetableEntry } from './interfaces/timetable.interface';
// import { Timetable } from './interfaces/timetable.interface';

@Injectable()
export default class TimetableService {
  constructor(private prisma: PrismaService) {}

  async getTimetableOfUserInNext24h(userId: string, from: Date): Promise<TimetableEntry[]> {
    return this.getTimetableOfUserInNextXSeconds(userId, from, 24 * 3600);
  }

  async getTimetableOfUserInNextXSeconds(userId: string, from: Date, seconds: number): Promise<TimetableEntry[]> {
    const entries = (
      await this.prisma.timetableEntry.findMany({
        where: {
          timetableGroup: { userTimetableGroups: { some: { userId } } },
          eventStart: { lte: from },
          eventEnd: { gte: from },
        },
        include: { timetableGroup: { select: { userTimetableGroups: { where: { userId }, take: 1 } } } },
      })
    )
      // Filter entries that will not appear in the next X seconds
      // An event begins in the next X seconds if (now - start) % repeat is less than X
      // We don't compare directly with X, since we also need to take into account the end hour of the occurrence
      // (the occurrence could have started, but not ended, and we would still want to return it)
      .filter(
        (entry) =>
          (from.getTime() - entry.eventStart.getTime()) % (entry.repeatEvery ?? Number.POSITIVE_INFINITY) <
          seconds + entry.occurrenceDuration.getTime(),
      )
      // Sort entries by priority, then by event length
      .sort((entry1, entry2) => {
        const priorityDifference =
          entry1.timetableGroup.userTimetableGroups[0].priority - entry2.timetableGroup.userTimetableGroups[1].priority;
        if (priorityDifference !== 0) {
          return priorityDifference;
        }
        return (
          entry1.eventEnd.getTime() -
          entry1.eventStart.getTime() -
          (entry2.eventEnd.getTime() - entry2.eventStart.getTime())
        );
      });
    // Fetch the primary entries (the ones not overwriting another entry), and modify them according to the other entries
    const primaryEntries = entries.filter((entry) => !entry.overrideTimetableEntryId);
    for (const entry of entries) {
      if (!entry.overrideTimetableEntryId) continue;
      const primaryEntryIndex = primaryEntries.findIndex((e) => e.id === entry.overrideTimetableEntryId);
      if (primaryEntryIndex === -1) {
        // This should never happen : user X is not concerned about entry A, but is concerned about entry B, and entry B overwrites entry A
        console.warn('User is concerned about overwritting an event they are not concerned about');
        continue;
      }
      primaryEntries[primaryEntryIndex] = {
        ...primaryEntries[primaryEntryIndex],
        // Replace null values by undefined
        ...Object.fromEntries(Object.values(entry).map((key, value) => [key, value ?? undefined])),
      };
    }
    return entries;
  }
}
