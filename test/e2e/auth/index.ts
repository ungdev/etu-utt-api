import { INestApplication } from '@nestjs/common';
import SignUpE2ESpec from './signup-e2e-spec';
import SignInE2ESpec from './signin-e2e-spec';
import VerifyE2ESpec from './verify-e2e-spec';

export default function AuthE2ESpec(app: () => INestApplication) {
  describe('Auth', () => {
    SignUpE2ESpec(app);
    SignInE2ESpec(app);
    VerifyE2ESpec(app);
  });
}
