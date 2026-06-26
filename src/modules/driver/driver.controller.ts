import { Controller, Get, Param } from '@nestjs/common';
import { DriverService } from './driver.service';

@Controller('/v1/api/drivers')
export class DriverController {
  constructor(private readonly driverService: DriverService) {}

  @Get()
  public getDrivers(): object {
    return this.driverService.getDrivers();
  }
  @Get('/:id')
  public getDriverById(@Param('id') id: string): object {
    return this.driverService.getDriverById(id);
  }
  @Get('/:id/profile')
  public getProfileById(@Param('id') id: string): object {
    return this.driverService.getProfileById(id);
  }
  @Get('/:id/rides')
  public getRidesById(@Param('id') id: string): object {
    return this.driverService.getRidesById(id);
  }
  @Get('/:id/ratings')
  public getDriverRatings(@Param('id') id: string): object {
    return this.driverService.getDriverRatings(id);
  }
  @Get('/:id/earnings')
  public getDriverEarnings(@Param('id') id: string): object {
    return this.driverService.getDriverEarnings(id);
  }
  @Get('/:id/vehicle')
  public getDriverVehicle(@Param('id') id: string): object {
    return this.driverService.getDriverVehicle(id);
  }
  @Get('/:id/status')
  public getDriverStatus(@Param('id') id: string): object {
    return { id: `${id}`, status: 'active' };
  }
  @Get('/:id/location')
  public getDriverLocation(@Param('id') id: string): object {
    return this.driverService.getDriverLocation(id);
  }
  @Get('/nearby')
  public getNearbyDrivers(): object {
    return { drivers: [] };
  }
}
