import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CreditService {
  constructor(private prisma: PrismaService) {}

  getCreditCategories() {
    return this.prisma.uECreditCategory.findMany({});
  }
}
