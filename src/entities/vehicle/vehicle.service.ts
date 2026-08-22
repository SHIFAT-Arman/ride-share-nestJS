import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle } from './vehicle.entity';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { Driver } from '../driver/driver.entity';

@Injectable()
export class VehicleService {
  constructor(
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
  ) {}

  public async getVehicleById(id: string): Promise<Vehicle | null> {
    return this.vehicleRepository.findOne({
      where: { id },
      relations: { driver: true },
    });
  }

  async createVehicle(
    createVehicleDto: CreateVehicleDto,
    driverId: string,
  ): Promise<Vehicle> {
    const vehicle = this.vehicleRepository.create({
      vehicleType: createVehicleDto.vehicleType,
      licensePlate: createVehicleDto.licensePlate,
      seatingCapacity: createVehicleDto.seatingCapacity,
      driver: { id: driverId } as Driver,
    });
    return await this.vehicleRepository.save(vehicle);
  }
}
