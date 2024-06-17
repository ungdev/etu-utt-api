import {Global, Module} from "@nestjs/common";
import {SemesterService} from "./semester.service";

@Global()
@Module({
  providers: [SemesterService],
  exports: [SemesterService],
})
export class SemesterModule {}
