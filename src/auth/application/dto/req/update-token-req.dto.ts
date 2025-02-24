import {IsInt, IsPositive} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export default class UpdateTokenReqDto {
  @IsInt()
  @IsPositive()
  @ApiProperty({ description: 'How much time this token should be working' })
  expiresIn: number;
}
