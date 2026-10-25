import { ApiProperty } from '@nestjs/swagger';
import { AssoAccessAttemptStatus } from '@/assos/interfaces/asso.interface.js';

export class AssosAccessAttemptResDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  assoEmail: string;

  @ApiProperty({ enum: ['CREATE', 'CLAIM'], nullable: true })
  action: string | null;

  @ApiProperty()
  accepted: boolean;

  @ApiProperty({ enum: AssoAccessAttemptStatus })
  status: AssoAccessAttemptStatus;

  @ApiProperty({ nullable: true })
  failureReason: number | null;

  @ApiProperty({ nullable: true })
  assoId: string | null;

  @ApiProperty({ nullable: true })
  confirmedAt: Date | null;

  @ApiProperty({ nullable: true })
  confirmationFailureReason: number | null;
}
