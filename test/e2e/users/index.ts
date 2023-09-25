import { INestApplication } from '@nestjs/common';
import SearchE2ESpec from './search-e2e-spec';
import FindE2ESpec from './find-e2e-spec';

export default function UsersE2ESpec(app: () => INestApplication) {
  describe('User', () => {
    SearchE2ESpec(app);
    FindE2ESpec(app);
  });
}
