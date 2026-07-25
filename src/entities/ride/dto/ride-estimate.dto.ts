import { LocationDto } from 'src/entities/location/dto/location.dto';
import { IsEnum, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { VehicleType } from 'src/entities/vehicle/enums/vehicle-type.enum';

export class RideEstimateDto {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => LocationDto)
  pickup: LocationDto;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => LocationDto)
  destination: LocationDto;

  @IsNotEmpty()
  @IsEnum(VehicleType)
  vehicleType: VehicleType;
}
