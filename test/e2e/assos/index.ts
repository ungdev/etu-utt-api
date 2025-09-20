import { INestApplication } from '@nestjs/common';
import SearchE2ESpec from './search.e2e-spec';
import GetAssoE2ESpec from './get-asso.e2e-spec';
import GetAssoMembersE2ESpec from './list-members.e2e-spec';
import AddAssoMemberE2ESpec from './add-member.e2e-spec';
import KickAssoMemberE2ESpec from './kick-member.e2e-spec';
import UpdateAssoMemberE2ESpec from './update-member.e2e-spec';

export default function AssoE2ESpec(app: () => INestApplication) {
  describe('Assos', () => {
    SearchE2ESpec(app);
    GetAssoE2ESpec(app);
    GetAssoMembersE2ESpec(app);
    AddAssoMemberE2ESpec(app);
    KickAssoMemberE2ESpec(app);
    UpdateAssoMemberE2ESpec(app);
  });
}
