import { IsInt, IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { VehicleType } from '../enums/vehicle-type.enum';

export class CreateVehicleDto {
  @IsNotEmpty()
  @IsString()
  @IsEnum(VehicleType)
  vehicleType: VehicleType;

  @IsString()
  @IsNotEmpty()
  licensePlate: string;

  @IsInt()
  @IsNotEmpty()
  seatingCapacity: number;

  // driver: DriverEntity;
}
