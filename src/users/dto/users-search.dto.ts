import { Type } from 'class-transformer';
import { IsOptional, IsString, IsNumber, IsPositive } from 'class-validator';

/**
 * Query parameters of the request to search users.
 * @property {string} q - The query to search. Can be part of a code, name, comment, objective or programme.
 * @property {string} firstName - The first name of the user. Optional.
 * @property {string} lastName - The last name of the user. Optional.
 * @property {string} nickName - The mail of the user. Optional.
 * @property {string} branch - The branch of the user. Optional.
 * @property {string} branchOption - The branch option of the user. Optional.
 * @property {string} UE - An UE of the user. Optional.
 * @property {string} type - The type of user. Optional.
 * @property {string} semester - The number of semester in the user branch. Optional.
 * @property {string} studentId - The student id given by UTT. Optional.
 * @property {string} phoneNumber - The phone number of the user. Optional.
 * @property {string} mail - The mail of the user. Optional.
 * @property {number} page - The page of the results. Optional. Must be a positive number.
 */
export default class UsersSearchDto {
  @IsString()
  @IsOptional()
  q?: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  nickname?: string;

  @IsString()
  @IsOptional()
  mail?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  branchCode?: string;

  @IsString()
  @IsOptional()
  branchOptionCode?: string;

  @IsString()
  @IsOptional()
  ue?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsNumber()
  @IsOptional()
  semesterNumber?: number;

  @IsNumber()
  @IsOptional()
  studentId?: number;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  @IsOptional()
  page?: number;
}
