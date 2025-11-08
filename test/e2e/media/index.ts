import { E2EAppProvider } from '#/utils/test_utils';
import { GetMediaE2ESpec } from './image/get-media.e2e-spec';
import { UploadMediaE2ESpec } from './image/upload-media.e2e-spec';

export default function MediaE2ESpec(app: E2EAppProvider) {
  describe('Media', () => {
    GetMediaE2ESpec(app);
    UploadMediaE2ESpec(app);
  });
}
