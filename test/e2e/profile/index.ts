import { INestApplication } from '@nestjs/common';
import GetE2ESpec from './get-e2e-spec';
import UpdateE2ESpec from './update-e2e-spec';

export default function ProfileE2ESpec(app: () => INestApplication) {
  describe('Profile', () => {
    GetE2ESpec(app);
    UpdateE2ESpec(app);
  });
}
