import { INestApplication } from '@nestjs/common';
import DeleteAnnal from '#/e2e/ue/annals/delete-annal.e2e-spec';
import GetAnnalFile from '#/e2e/ue/annals/get-annal-file.e2e-spec';
import GetAnnalMetadata from '#/e2e/ue/annals/get-annal-metadata.e2e-spec';
import GetAnnal from '#/e2e/ue/annals/get-annals.e2e-spec';
import EditAnnal from '#/e2e/ue/annals/patch-annal.e2e-spec';
import PostAnnal from '#/e2e/ue/annals/upload-annal.e2e-spec';

export default function AnnalsE2ESpec(app: () => INestApplication) {
  describe('Annals', () => {
    GetAnnalMetadata(app);
    GetAnnal(app);
    GetAnnalFile(app);
    EditAnnal(app);
    DeleteAnnal(app);
    PostAnnal(app);
  });
}
