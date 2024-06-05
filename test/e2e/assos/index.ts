import { INestApplication } from '@nestjs/common';
import SearchE2ESpec from './search.e2e-spec';

export default function AssoE2ESpec(app: () => INestApplication) {
  describe('Assos', () => {
    SearchE2ESpec(app);
  });
}
