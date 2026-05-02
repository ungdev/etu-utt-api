import { E2EAppProvider } from '../../utils/test_utils';
import GetLinksE2ESpec from './get-links.e2e-spec';
import CreateLinkE2ESpec from './create-link.e2e-spec';
import UpdateLinkE2ESpec from './update-link.e2e-spec';
import DeleteLinkE2ESpec from './delete-link.e2e-spec';

export default function LinkE2ESpec(app: E2EAppProvider) {
  describe('Link', () => {
    GetLinksE2ESpec(app);
    CreateLinkE2ESpec(app);
    UpdateLinkE2ESpec(app);
    DeleteLinkE2ESpec(app);
  });
}
