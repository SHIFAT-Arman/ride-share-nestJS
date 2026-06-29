import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { AdminRole } from '../admin-role.model';
import { Transform } from 'class-transformer';

export class CreateAdminDto {
  // id
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @IsEnum(AdminRole)
  role: AdminRole;

  @IsNotEmpty()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
  })
  @IsBoolean()
  isActive: boolean;

  @IsOptional()
  profilePictureUrl: string;

  @IsNotEmpty()
  @IsDateString() // e.g: 2026-06-28
  createdAt: Date;

  @IsOptional()
  @IsDateString()
  updatedAt: Date;
}
