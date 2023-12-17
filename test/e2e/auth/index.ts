import SignUpE2ESpec from './signup-e2e-spec';
import SignInE2ESpec from './signin-e2e-spec';
import VerifyE2ESpec from './verify-e2e-spec';
import { E2EAppProvider } from '../../test_utils';

export default function AuthE2ESpec(app: E2EAppProvider) {
  describe('Auth', () => {
    SignUpE2ESpec(app);
    SignInE2ESpec(app);
    VerifyE2ESpec(app);
  });
}
