import GetE2ESpec from './get.e2e-spec';
import UpdateE2ESpec from './update-e2e-spec';
import { E2EAppProvider } from '../../utils/test_utils';
import GetParkingE2ESpec from './get-parking.e2e-spec';
import SetParkingE2ESpec from './set-parking.e2e-spec';

export default function ProfileE2ESpec(app: E2EAppProvider) {
  describe('Profile', () => {
    GetE2ESpec(app);
    UpdateE2ESpec(app);
    GetParkingE2ESpec(app);
    SetParkingE2ESpec;
  });
}
