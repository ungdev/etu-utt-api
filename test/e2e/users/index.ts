import { INestApplication } from '@nestjs/common';
import SearchE2ESpec from './search-e2e-spec';
import GetUserE2ESpec from './get-user-e2e-spec';

export default function UsersE2ESpec(app: () => INestApplication) {
  describe('User', () => {
    SearchE2ESpec(app);
    GetUserE2ESpec(app);
  });
}
