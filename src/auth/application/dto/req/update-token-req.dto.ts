import { IsInt, IsOptional, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTokenReqDto {
  @IsInt()
  @IsPositive()
  @ApiProperty({ description: 'How much time this token should be working' })
  @IsOptional()
  expiresIn?: number;
}
