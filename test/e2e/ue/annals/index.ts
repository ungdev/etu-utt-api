import DeleteAnnal from './delete-annal.e2e-spec';
import GetAnnalFile from './get-annal-file.e2e-spec';
import GetAnnalMetadata from './get-annal-metadata.e2e-spec';
import GetAnnal from './get-annals.e2e-spec';
import EditAnnal from './patch-annal.e2e-spec';
import PostAnnal from './upload-annal.e2e-spec';
import { E2EAppProvider } from '../../../utils/test_utils';

export default function AnnalsE2ESpec(app: E2EAppProvider) {
  describe('Annals', () => {
    GetAnnalMetadata(app);
    GetAnnal(app);
    GetAnnalFile(app);
    EditAnnal(app);
    DeleteAnnal(app);
    PostAnnal(app);
  });
}
