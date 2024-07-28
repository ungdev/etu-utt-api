import { Type } from 'class-transformer';
import { IsNumber, IsPositive, IsString, IsOptional, Length } from 'class-validator';

/**
 * Query parameters of the request to search UEs.
 * @property {string} q - The query to search. Can be part of a code, name, comment, objective or programme.
 * @property {string} branch - The branch of the UE. Optional.
 * @property {string} branchOption - The branch option of the UE. Optional.
 * @property {string} creditType - The type of credit of the UE. Optional.
 * @property {string} availableAtSemester - The semester where the UE is available. Optional. Must be a semester code (ie. containing 3 characters).
 * @property {number} page - The page of the results. Optional. Must be a positive number.
 */
export class UeSearchDto {
  @IsString()
  @IsOptional()
  q?: string;

  @IsString()
  @IsOptional()
  branch?: string;

  @IsString()
  @IsOptional()
  branchOption?: string;

  @IsString()
  @IsOptional()
  creditType?: string;

  @IsString()
  @Length(3)
  @IsOptional()
  availableAtSemester?: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  @IsOptional()
  page?: number;

  @IsString()
  @Length(2)
  @IsOptional()
  preferredLang?: string;
}
