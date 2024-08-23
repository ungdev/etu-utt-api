import { Type } from 'class-transformer';
import { IsOptional, IsString, IsNumber, IsPositive, IsInt } from 'class-validator';

/**
 * Query parameters of the request to search users.
 * @property {string} q - The query to search. Can be part of a first name, last name, nickname, email address or phone number.
 * @property {string} firstName - The first name of the user. Optional.
 * @property {string} lastName - The last name of the user. Optional.
 * @property {string} nickname - The nickname of the user. Optional.
 * @property {string} branch - The branch of the user. Optional.
 * @property {string} branchOption - The branch option of the user. Optional.
 * @property {string} ue - An UE of the user. Optional.
 * @property {string} type - The type of user. Optional.
 * @property {string} semester - The number of semester in the user branch. Optional.
 * @property {string} studentId - The student id given by UTT. Optional.
 * @property {string} phoneNumber - The phone number of the user. Optional.
 * @property {string} mail - The mail of the user. Optional.
 * @property {number} page - The page of the results. Optional. Must be a positive number.
 */
export default class UsersSearchReqDto {
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
  @IsInt()
  @IsOptional()
  semesterNumber?: number;

  @IsNumber()
  @IsInt()
  @IsOptional()
  studentId?: number;

  @Type(() => Number)
  @IsNumber()
  @IsInt()
  @IsPositive()
  @IsOptional()
  page?: number;
}
