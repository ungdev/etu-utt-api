import { INestApplication } from '@nestjs/common';
import SearchE2ESpec from './search-e2e-spec';

export default function UEE2ESpec(app: () => INestApplication) {
  describe('UE', () => {
    SearchE2ESpec(app);
  });
}
