import { Global, Module } from '@nestjs/common';
import { SemesterService } from '@/semester/semester.service.js';

@Global()
@Module({
  providers: [SemesterService],
  exports: [SemesterService],
})
export class SemesterModule {}
