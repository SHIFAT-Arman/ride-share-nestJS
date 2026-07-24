import { NearbyDriverDto } from 'src/entities/driver/dto/nearby-driver.dto';

export class RideEstimateResponseDto {
  estimatedFare: number;

  estimatedDistanceInKm: number;

  estimatedDurationInMinutes: number;

  nearbyDrivers: NearbyDriverDto[];
}
