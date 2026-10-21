import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service.js';

@Injectable()
export class CreditService {
  constructor(private prisma: PrismaService) {}

  getCreditCategories() {
    return this.prisma.ueCreditCategory.findMany({});
  }
}
