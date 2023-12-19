import { BadRequestException, PipeTransform } from '@nestjs/common';

export class RegexPipe implements PipeTransform<string, string> {
  constructor(private regex: RegExp) {}

  transform(value: string) {
    if (!value.match(this.regex)) {
      throw new BadRequestException(`Validation failed (match with regex ${this.regex} is expected)`);
    }
    return value;
  }
}
