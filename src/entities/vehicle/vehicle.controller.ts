import { Controller, Get, Param } from '@nestjs/common';
import { VehicleService } from './vehicle.service';
import { Vehicle } from './vehicle.entity';

@Controller('/v1/api/vehicles')
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}

  @Get(':id')
  public async getVehicleById(
    @Param('id') id: string,
  ): Promise<Vehicle | null> {
    return this.vehicleService.getVehicleById(id);
  }
}
