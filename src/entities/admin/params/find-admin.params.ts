import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { PaginationParams } from 'src/entities/common/pagination/pagination.params';
import { AdminRole } from '../admin-role.model';
import { AdminProfile } from '../adminProfile/admin-profile.entity';

export class AdminFilterParams extends PaginationParams {
  @IsOptional()
  @IsUUID()
  id: string;

  @IsOptional()
  @IsDateString()
  joiningDate: string;

  @IsOptional()
  country: string;

  @IsOptional()
  @IsString()
  firstName: string;

  @IsOptional()
  @IsString()
  lastName: string;

  @IsOptional()
  @IsEnum(AdminRole)
  role: AdminRole;
}
