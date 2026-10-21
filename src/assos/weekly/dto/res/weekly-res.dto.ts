import { Translation } from '@/prisma/types';

export default class WeeklyResDto {
  id: string;
  assoId: string;
  createdAt: Date;
  title: Translation;
  message: Translation;
  date: Date;
}
