import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { UserType } from 'src/auth/user-type.enum';

export class UpdateAdminDto {
  @IsOptional()
  country?: string;

  @IsOptional()
  @IsDateString()
  joiningDate: string;

  @IsOptional()
  @IsEnum(UserType)
  role?: UserType;
}
