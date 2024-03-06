import { IsNumber, IsPositive, IsString, Min } from 'class-validator';

export class ParkingUpdateDto {
  @IsNumber()
  @Min(0)
  x: number;

  @IsNumber()
  @Min(0)
  y: number;

  @IsNumber()
  @IsPositive()
  width: number;

  @IsNumber()
  @IsPositive()
  height: number;

  @IsString()
  widget: string;
}
