import { ApiProperty } from '@nestjs/swagger';
import { IsHash, IsNotEmpty, IsString } from 'class-validator';

export default class TimetableImportDto {
  @IsString()
  @IsNotEmpty()
  @IsHash('sha256')
  @ApiProperty({ description: 'The uid of the file, should be a sha-256' })
  uid: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ enum: ['https://monedt.utt.fr/calendrier/', 'http://localhost:3042/'] })
  service: string;
}
