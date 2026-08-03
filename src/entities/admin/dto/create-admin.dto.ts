import {
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDateString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { AdminRole } from '../admin-role.model';
import { Type } from 'class-transformer';

export class CreateAdminDto {
  // Admin table
  @IsEmail({}, { message: 'Please provide a valid email address.' })
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @MinLength(8, {
    message: 'Password must be at least 8 characters long.',
  })
  @MaxLength(32, {
    message: 'Password cannot exceed 32 characters.',
  })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#()_\-+=])[A-Za-z\d@$!%*?&^#()_\-+=]+$/,
    {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
    },
  )
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
