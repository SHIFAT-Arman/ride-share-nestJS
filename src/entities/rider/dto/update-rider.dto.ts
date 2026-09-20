import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { RiderStatus } from '../enums/rider-status.enum';

export class UpdateRiderDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class UpdateRiderStatusDto {
  @IsNotEmpty()
  @IsEnum(RiderStatus)
  status: RiderStatus;
}
