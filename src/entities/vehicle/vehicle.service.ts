import { Injectable } from '@nestjs/common';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { Vehicle } from './vehicle.entity';
import { Repository } from 'typeorm';
import { DriverEntity } from '../driver/driver.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class VehicleService {
  constructor(
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
  ) {}
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

  patchVehicle(id: number, createVehicleDto: CreateVehicleDto): object {
    return {
      message: `Vehicle ${id} partially updated`,
      data: createVehicleDto,
    };
  }

  uploadVehicleImage(id: number, createVehicleDto: CreateVehicleDto): object {
    return {
      message: `Image uploaded for vehicle ${id}`,
      data: createVehicleDto,
    };
  }

  async createVehicle(
    createVehicleDto: CreateVehicleDto,
    driverId: string,
  ): Promise<Vehicle> {
    const vehicle = this.vehicleRepository.create({
      vehicleType: createVehicleDto.vehicleType,
      licensePlate: createVehicleDto.licensePlate,
      seatingCapacity: createVehicleDto.seatingCapacity,
      driver: { id: parseInt(driverId) } as DriverEntity,
    });

    return await this.vehicleRepository.save(vehicle);
  }
}
