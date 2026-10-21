import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export default class AssosAccessConfirmReqDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiPropertyOptional({ example: "Nom de l'association" })
  @IsString()
  @IsOptional()
  name?: string;
}
