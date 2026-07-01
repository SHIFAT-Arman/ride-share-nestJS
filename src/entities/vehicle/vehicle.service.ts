import { Injectable } from '@nestjs/common';
import { VehicleDto } from './dto/vehicle.dto';

@Injectable()
export class VehicleService {
  getVehicle(): string {
    return 'All Vehicle';
  }

  getAllVehicle(): object {
    return { name: 'Car', id: '12' };
  }

  getVehicleTypes(): string[] {
    return ['Sedan', 'SUV', 'Truck', 'Motorcycle'];
  }

  getVehicleByID(id: number, name: string): object {
    return { id: id, name: name };
  }

  getVehicleByIDandName(id: number, name: string): object {
    return { id: id, name: name };
  }

  getVehicleByIDandDriver(id: number, driver: string): object {
    return { id: id, driver: driver };
  }

  getVerificationStatus(id: string): object {
    return { vehicleId: id, verificationStatus: 'Verified' };
  }

  patchVehicle(id: number, vehicleDto: VehicleDto): object {
    return { message: `Vehicle ${id} partially updated`, data: vehicleDto };
  }

  uploadVehicleImage(id: number, vehicleDto: VehicleDto): object {
    return { message: `Image uploaded for vehicle ${id}`, data: vehicleDto };
  }
}
