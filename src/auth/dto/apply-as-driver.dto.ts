import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
} from 'class-validator';
import { VehicleType } from '../../entities/vehicle/enums/vehicle-type.enum';

/** Rider self-apply: upgrades the signed-in account (no new email/password). */
export class ApplyAsDriverDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsNotEmpty()
  @IsEnum(VehicleType)
  vehicleType: VehicleType;

  @IsString()
  @IsNotEmpty()
  licensePlate: string;

  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  seatingCapacity: number;
}
