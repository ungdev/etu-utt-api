import { ApiProperty } from '@nestjs/swagger';

export class UeSyncErrorResDto {
  @ApiProperty({ nullable: true })
  ueCode: string | null;

  @ApiProperty()
  message: string;
}

export class UeSyncResDto {
  @ApiProperty()
  created: number;

  @ApiProperty()
  updated: number;

  @ApiProperty()
  failed: number;

  @ApiProperty({ type: UeSyncErrorResDto, isArray: true })
  errors: UeSyncErrorResDto[];
}
