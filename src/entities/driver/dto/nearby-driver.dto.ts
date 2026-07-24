import { VehicleType } from 'src/entities/vehicle/enums/vehicle-type.enum';

export class NearbyDriverDto {
  driverId: number;

  vehicleId: number;

  vehicleType: VehicleType;

  driverName: string;

  vehicleName: string;

  vehiclePlate: string;

  distanceInMeters: number;

  estimatedArrivalTimeInMinutes: number;

  location: {
    latitude: number;
    longitude: number;
  };
}
