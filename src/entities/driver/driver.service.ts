import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { Driver } from './driver.entity';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { FindDriverParams } from './params/find-driver.params';
import { DriverStatus } from './enums/driver-status.enum';
import { ProfilePictureService } from '../common/profile-picture/profile-picture.service';
import { UploadProfilePictureResponseDto } from '../common/dto/upload-profile-picture-response.dto';
import { UserService } from '../user/user.service';
import { UserType } from '../../auth/user-type.enum';

@Injectable()
export class DriverService {
  constructor(
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
    private readonly profilePictureService: ProfilePictureService,
    private readonly userService: UserService,
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
      relations: { user: true },
    });
  }

  public async getDriverById(id: string): Promise<Driver | null> {
    const driver = await this.driverRepository.findOne({
      where: { id },
      relations: { vehicle: true, user: true },
    });
    if (!driver)
      throw new NotFoundException(`Driver with id '${id}' not found.`);
    return driver;
  }

  public async createDriver(createDriverDto: CreateDriverDto): Promise<Driver> {
    const { email, password, ...profile } = createDriverDto;
    // ponytail: user row can orphan if this save fails; wrap in a transaction if that starts happening
    const user = await this.userService.create(
      email,
      password,
      UserType.DRIVER,
    );
    const driver = this.driverRepository.create({
      ...profile,
      id: user.id,
      user,
    });
    return this.driverRepository.save(driver);
  }

  public async updateDriverById(
    id: string,
    updateDriverDto: UpdateDriverDto,
  ): Promise<Driver> {
    const driver = await this.driverRepository.findOne({
      where: { id },
      relations: { user: true },
    });
    if (!driver)
      throw new NotFoundException(`Driver with id '${id}' not found.`);
    const { email, ...profile } = updateDriverDto;
    if (email) await this.userService.updateEmail(id, email);
    this.driverRepository.merge(driver, profile);
    const saved = await this.driverRepository.save(driver);
    if (email) saved.user.email = email;
    return saved;
  }

  public async updateDriverStatus(
    id: string,
    status: DriverStatus,
  ): Promise<Driver> {
    const driver = await this.driverRepository.findOne({
      where: { id },
      relations: { user: true },
    });
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
    await this.userService.softDelete(id);
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
}
