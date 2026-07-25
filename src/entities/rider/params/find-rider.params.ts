import { IsEnum, IsOptional } from 'class-validator';
import { RiderStatus } from '../enums/rider-status.enum';

export class FindRiderParams {
  @IsOptional()
  @IsEnum(RiderStatus)
  status?: RiderStatus;
}
