import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Driver } from './driver.entity';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { FindDriverParams } from './params/find-driver.params';
import { DriverStatus } from './enums/driver-status.enum';
import { ProfilePictureService } from '../common/profile-picture/profile-picture.service';
import { UploadProfilePictureResponseDto } from '../common/dto/upload-profile-picture-response.dto';

@Injectable()
export class DriverService {
  constructor(
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
    private readonly profilePictureService: ProfilePictureService,
  ) {}

  public async getDriverList(
    filter: FindDriverParams,
  ): Promise<[Driver[], number]> {
    const where: FindOptionsWhere<Driver> = {};

    if (filter.id) where.id = filter.id;
    if (filter.status) where.status = filter.status;
    if (filter.firstName) where.firstName = ILike(`%${filter.firstName}%`);
    if (filter.lastName) where.lastName = ILike(`%${filter.lastName}%`);

    return await this.driverRepository.findAndCount({
      where,
      skip: filter.offset,
      take: filter.limit,
      order: { createdAt: 'ASC' },
    });
  }

  public async getDriverById(id: string): Promise<Driver | null> {
    const driver = await this.driverRepository.findOne({
      where: { id },
      relations: { vehicle: true },
    });
    if (!driver)
      throw new NotFoundException(`Driver with id '${id}' not found.`);
    return driver;
  }

  public async createDriver(createDriverDto: CreateDriverDto): Promise<Driver> {
    const hashedPass = await bcrypt.hash(createDriverDto.password, 12);
    const driver = this.driverRepository.create({
      ...createDriverDto,
      password: hashedPass,
    });
    return this.driverRepository.save(driver);
  }

  public async updateDriverById(
    id: string,
    updateDriverDto: UpdateDriverDto,
  ): Promise<Driver> {
    const driver = await this.driverRepository.findOneBy({ id });
    if (!driver)
      throw new NotFoundException(`Driver with id '${id}' not found.`);
    this.driverRepository.merge(driver, updateDriverDto);
    return this.driverRepository.save(driver);
  }

  public async updateDriverStatus(
    id: string,
    status: DriverStatus,
  ): Promise<Driver> {
    const driver = await this.driverRepository.findOneBy({ id });
    if (!driver)
      throw new NotFoundException(`Driver with id '${id}' not found.`);
    driver.status = status;
    return this.driverRepository.save(driver);
  }

  public async deleteDriverById(id: string): Promise<void> {
    const driver = await this.driverRepository.findOneBy({ id });
    if (!driver)
      throw new NotFoundException(`Driver with id '${id}' not found.`);
    await this.driverRepository.softRemove(driver);
  }

  public async uploadProfilePicture(
    id: string,
    file: Express.Multer.File,
  ): Promise<UploadProfilePictureResponseDto> {
    const driver = await this.driverRepository.findOneBy({ id });
    if (!driver)
      throw new NotFoundException(`Driver with id '${id}' not found.`);

    const profilePictureUrl = await this.profilePictureService.replace(
      driver.profilePictureUrl ?? null,
      file,
      'drivers',
    );
    this.driverRepository.merge(driver, { profilePictureUrl });
    await this.driverRepository.save(driver);
    return { profilePictureUrl };
  }

  public async findOneByEmail(email: string): Promise<Driver | null> {
    return await this.driverRepository.findOneBy({ email });
  }
}
