import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationParams } from 'src/entities/common/pagination/pagination.params';
import { DriverStatus } from '../enums/driver-status.enum';

export class FindDriverParams extends PaginationParams {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsOptional()
  @IsEnum(DriverStatus)
  status?: DriverStatus;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;
}
