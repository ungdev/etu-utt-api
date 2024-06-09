import {Dummies, e2eSuite} from "../../utils/test_utils";
import {createAsso, createUser} from "../../utils/fakedb";
import * as pactum from "pactum";
import {ERROR_CODE} from "../../../src/exceptions";
import {faker} from "@faker-js/faker";

const GetAssoE2ESpec = e2eSuite("GET /assos/:id", (app) => {
  const asso = createAsso(app);

  it('should return a 400 as the id param is not valid', () => pactum.spec().get('/assos/thisisnotavaliduuid').expectAppError(ERROR_CODE.PARAM_NOT_UUID, 'assoId'));

  it('should return a 404 as asso is not found', () => pactum.spec().get(`/assos/${Dummies.UUID}`).expectAppError(ERROR_CODE.NO_SUCH_ASSO, Dummies.UUID));

  it('should successfully return the asso', () => pactum.spec().get(`/assos/${asso.id}`).expectAsso(asso));
});

export default GetAssoE2ESpec;
