import { Translation } from '../../../prisma/types';

export default class DaymailResDto {
  id: string;
  assoId: string;
  createdAt: Date;
  title: Translation;
  message: Translation;
  date: Date;
}
