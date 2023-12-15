import { RawUser, RawUserInfos } from "../../prisma/types";

export interface User extends RawUser {
  infos: RawUserInfos;
}