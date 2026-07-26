import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDriverDto, UpdateDriverDto } from './dto/driver.dto';
import { DriverEntity, DriverStatus } from './driver.entity';

@Injectable()
export class DriverService {
  constructor(
    @InjectRepository(DriverEntity)
    private readonly driverRepo: Repository<DriverEntity>,
  ) {}

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
  public async createDriver(dto: CreateDriverDto): Promise<DriverEntity> {
    const driver = this.driverRepo.create(dto);
    return this.driverRepo.save(driver);
  }

  public async changeStatus(
    id: number,
    status: DriverStatus,
  ): Promise<DriverEntity> {
    const driver = await this.driverRepo.findOneBy({ id });
    if (!driver) {
      throw new NotFoundException(`Driver with id ${id} not found`);
    }
    driver.status = status;
    return this.driverRepo.save(driver);
  }

  public async findInactive(): Promise<DriverEntity[]> {
    return this.driverRepo.find({ where: { status: DriverStatus.INACTIVE } });
  }
  public async findActive(): Promise<DriverEntity[]> {
    return this.driverRepo.find({ where: { status: DriverStatus.ACTIVE } });
  }

  public async findOlderThan40(): Promise<DriverEntity[]> {
    return this.driverRepo
      .createQueryBuilder('driver')
      .where('driver.age > :age', { age: 40 })
      .getMany();
  }
  public async findFullNameById(
    id: number,
  ): Promise<{ id: number; fullName: string }> {
    const driver = await this.driverRepo.findOneBy({ id });
    if (!driver) {
      throw new NotFoundException(`Driver with id ${id} not found`);
    }
    return { id: driver.id, fullName: driver.fullName };
  }
  public async deleteDriver(id: number): Promise<{ message: string }> {
    const result = await this.driverRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Driver with id ${id} not found`);
    }
    return { message: `Driver with id ${id} deleted successfully` };
  }
  async updateDriver(
    id: number,
    updateDriverDto: UpdateDriverDto,
  ): Promise<DriverEntity> {
    const driver = await this.driverRepo.findOneBy({ id });
    if (!driver) {
      throw new NotFoundException(`Driver with id ${id} not found`);
    }

    Object.assign(driver, updateDriverDto);

    return this.driverRepo.save(driver);
  }
}
