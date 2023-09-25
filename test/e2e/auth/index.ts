import { INestApplication } from '@nestjs/common';
import SignUpE2eSpec from './signup-e2e-spec';
import SignInE2ESpec from './signin-e2e-spec';

export default function AuthE2ESpec(app: () => INestApplication) {
  describe('Auth', () => {
    SignUpE2eSpec(app);
    SignInE2ESpec(app);
  });
}
