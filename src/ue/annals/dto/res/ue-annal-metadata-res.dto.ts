import { UeAnnalTypeResDto } from '@/ue/annals/dto/res/ue-annal-type-res.dto.js';

export class UeAnnalMetadataResDto {
  types: UeAnnalTypeResDto[];
  semesters: string[];
}
