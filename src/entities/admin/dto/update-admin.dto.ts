import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { AdminRole } from '../admin-role.model';

export class UpdateAdminDto {
  @IsOptional()
  country?: string;

  @IsOptional()
  @IsDateString()
  joiningDate: string;

  @IsOptional()
  @IsEnum(AdminRole)
  role: AdminRole;
}
