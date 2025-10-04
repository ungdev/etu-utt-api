import { Injectable, Param, ParseUUIDPipe, PipeTransform } from '@nestjs/common';
import { AppException, ERROR_CODE } from '../../exceptions';
import { AssosService } from '../assos.service';

export const ParamMember = (paramName = 'memberId') =>
  Param(
    paramName,
    new ParseUUIDPipe({ exceptionFactory: () => new AppException(ERROR_CODE.PARAM_NOT_UUID, paramName) }),
    ParseAssoMemberPipe,
  );

@Injectable()
class ParseAssoMemberPipe implements PipeTransform<string> {
  constructor(private readonly assosService: AssosService) {}
  async transform(value: string) {
    const membership = await this.assosService.getMembership(value.toUpperCase());
    if (!membership) throw new AppException(ERROR_CODE.NO_SUCH_ASSO_MEMBERSHIP, value);
    return membership;
  }
}
