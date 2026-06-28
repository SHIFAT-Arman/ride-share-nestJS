import { Body, Injectable } from '@nestjs/common';
import { DriverDto } from './dto/driver.dto';

@Injectable()
export class DriverService {
  public getDrivers(): object {
    return { id: 1, name: 'Avara', vehicle: 'Car' };
  }
  public getDriverById(id: string): object {
    return { id: `${id}`, name: 'Avara', vehicle: 'Car' };
  }
  public getProfileById(id: string): object {
    return {
      id: `${id}`,
      name: 'Avara',
      vehicle: 'Car',
      age: 20,
      licenseNumber: 'ABC123',
    };
  }
  public getRidesById(id: string): object {
    return { id: `${id}`, rides: [] };
  }
  public getDriverRatings(id: string): object {
    return { id: `${id}`, ratings: [{ driverId: 1, rating: 5 }] };
  }
  public getDriverEarnings(id: string): object {
    return { id: `${id}`, earnings: 1000 };
  }
  public getDriverVehicle(id: string): object {
    return {
      id: `${id}`,
      vehicle: 'Car',
      type: 'Toyota',
      licensePlate: 'ABC-123',
    };
  }
  public getDriverStatus(id: string): object {
    return { id: `${id}`, status: 'active' };
  }
  public getDriverLocation(id: string): object {
    return { id: `${id}`, location: 'Kuril' };
  }
  public getNearbyDrivers(): object {
    return { drivers: [] };
  }
  public createDriver(createDriverDto: DriverDto): object {
    return createDriverDto;
  }
}
