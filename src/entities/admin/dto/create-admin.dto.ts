import {
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDateString,
} from 'class-validator';
import { AdminRole } from '../admin-role.model';
import { Type } from 'class-transformer';

export class CreateAdminDto {
  // Admin table
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  password: string;

  @IsNotEmpty()
  @IsEnum(AdminRole)
  role: AdminRole;

  // AdminProfile table
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsDateString()
  joiningDate?: string;

  @IsOptional()
  @IsString()
  profilePictureUrl?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  age?: number;
}
