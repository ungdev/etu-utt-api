import { IsArray, IsInt, IsNumber, IsPositive, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ArrayDto } from '../../../app.pipe';

export class HomepageWidgetsUpdateElement {
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

export class HomepageWidgetsUpdateReqDto extends ArrayDto<HomepageWidgetsUpdateElement> {
  public constructor(items: HomepageWidgetsUpdateElement[]) {
    super();
    this.items = items;
  }
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HomepageWidgetsUpdateElement)
  items: HomepageWidgetsUpdateElement[];
}
