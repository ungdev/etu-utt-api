import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AuthValidateReqDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Token that has been returned by the EtuUTT website',
  })
  token: string;

  @IsString()
  @IsNotEmpty()
  clientSecret: string;
}
