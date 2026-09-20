import { NearbyDriverDto } from 'src/entities/driver/dto/nearby-driver.dto';

export class RideEstimateResponseDto {
  estimatedFare: number;

  estimatedDistanceInKm: number;

  estimatedDurationInMinutes: number;

  /** GeoJSON LineString coordinates [lng, lat][] for the map polyline. */
  geometry: [number, number][];

  nearbyDrivers: NearbyDriverDto[];
}
