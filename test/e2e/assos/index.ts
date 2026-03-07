import { INestApplication } from '@nestjs/common';
import SearchE2ESpec from '#/e2e/assos/search.e2e-spec';
import GetAssoE2ESpec from '#/e2e/assos/get-asso.e2e-spec';
import UpdateAssoE2ESpec from '#/e2e/assos/update-asso.e2e-spec';
import GetAssoMembersE2ESpec from '#/e2e/assos/list-members.e2e-spec';
import AddAssoMemberE2ESpec from '#/e2e/assos/add-member.e2e-spec';
import KickAssoMemberE2ESpec from '#/e2e/assos/kick-member.e2e-spec';
import UpdateAssoMemberE2ESpec from '#/e2e/assos/update-member.e2e-spec';
import CreateAssoRoleE2ESpec from '#/e2e/assos/create-role.e2e-spec';
import DeleteAssoRoleE2ESpec from '#/e2e/assos/delete-role.e2e-spec';
import UpdateAssoRoleE2ESpec from '#/e2e/assos/update-role.e2e-spec';
import CreateWeeklyE2ESpec from '#/e2e/assos/create-weekly.e2e-spec';
import SearchWeekliesE2ESpec from '#/e2e/assos/search-weeklies.e2e-spec';
import UpdateWeeklyE2ESpec from '#/e2e/assos/update-weekly.e2e-spec';
import DeleteWeeklyE2ESpec from '#/e2e/assos/delete-weekly.e2e-spec';
import GetWeeklyInfoE2ESpec from '#/e2e/assos/get-weekly-info.e2e-spec';

export default function AssoE2ESpec(app: () => INestApplication) {
  describe('Assos', () => {
    SearchE2ESpec(app);
    GetAssoE2ESpec(app);
    UpdateAssoE2ESpec(app);
    GetAssoMembersE2ESpec(app);
    AddAssoMemberE2ESpec(app);
    KickAssoMemberE2ESpec(app);
    UpdateAssoMemberE2ESpec(app);
    CreateAssoRoleE2ESpec(app);
    DeleteAssoRoleE2ESpec(app);
    UpdateAssoRoleE2ESpec(app);
    GetWeeklyInfoE2ESpec(app);
    SearchWeekliesE2ESpec(app);
    CreateWeeklyE2ESpec(app);
    UpdateWeeklyE2ESpec(app);
    DeleteWeeklyE2ESpec(app);
  });
}
