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

export const regex = {
  uuid: /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/,
  timetableOccurrenceId: /^\d+@[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/,
};
