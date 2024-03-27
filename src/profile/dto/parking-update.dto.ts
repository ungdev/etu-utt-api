import { IsInt, IsNumber, IsPositive, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ArrayDto } from '../../app.pipe';

export class ParkingUpdateElement {
  @IsNumber()
  @IsInt()
  @Min(0)
  x: number;

  @IsNumber()
  @IsInt()
  @Min(0)
  y: number;

  @IsNumber()
  @IsInt()
  @IsPositive()
  width: number;

  @IsNumber()
  @IsInt()
  @IsPositive()
  height: number;

  @IsString()
  widget: string;
}

export class ParkingUpdateDto extends ArrayDto<ParkingUpdateElement> {
  public constructor(items: ParkingUpdateElement[]) {
    super();
    this.items = items;
  }
  @ValidateNested({ each: true })
  @Type(() => ParkingUpdateElement)
  items: ParkingUpdateElement[];
}
