import { ApiProperty } from '@nestjs/swagger';
import { IsHash, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export default class TimetableImportDto {
  @IsString()
  @IsNotEmpty()
  @IsHash('sha256')
  @ApiProperty({ description: 'The uid of the file, should be a sha-256' })
  uid: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Select the timetable provider to use, not all providers are accepted',
    default: 'https://monedt.utt.fr/calendrier/',
  })
  service = 'https://monedt.utt.fr/calendrier/';
}
