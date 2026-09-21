import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, FindOptionsWhere, ILike, Repository } from 'typeorm';
import { Driver } from './driver.entity';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { FindDriverParams } from './params/find-driver.params';
import { DriverStatus } from './enums/driver-status.enum';
import { ProfilePictureService } from '../common/profile-picture/profile-picture.service';
import { UploadProfilePictureResponseDto } from '../common/dto/upload-profile-picture-response.dto';
import { UserService } from '../user/user.service';
import { UserType } from '../../auth/user-type.enum';
import { ApplyAsDriverDto } from '../../auth/dto/apply-as-driver.dto';
import { Rider } from '../rider/rider.entity';
import { User } from '../user/user.entity';
import { Vehicle } from '../vehicle/vehicle.entity';

@Injectable()
export class DriverService {
  constructor(
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
    @InjectRepository(Rider)
    private readonly riderRepository: Repository<Rider>,
    private readonly profilePictureService: ProfilePictureService,
    private readonly userService: UserService,
    private readonly dataSource: DataSource,
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
    await this.userService.restoreIfSoftDeleted(id);
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

  /**
   * Add a driver profile + vehicle under the same user id.
   * Keeps the rider profile so the account can switch dashboards.
   * Re-applies by restoring a soft-deleted driver row (same PK).
   */
  public async promoteRider(
    userId: string,
    dto: ApplyAsDriverDto,
  ): Promise<{ email: string }> {
    return this.dataSource.transaction(async (manager) => {
      const rider = await manager.findOne(Rider, {
        where: { id: userId },
        relations: { user: true },
      });
      if (!rider) {
        throw new NotFoundException(`Rider with id '${userId}' not found.`);
      }

      // Don't load vehicle here — recover/cascade on soft-delete breaks entities
      // that lack DeleteDateColumn (Vehicle).
      const existingDriver = await manager.findOne(Driver, {
        where: { id: userId },
        withDeleted: true,
      });
      if (existingDriver && !existingDriver.deletedAt) {
        throw new ConflictException('Already registered as a driver');
      }

      await manager.update(User, userId, { role: UserType.DRIVER });

      if (existingDriver?.deletedAt) {
        await manager.restore(Driver, userId);
        await manager.update(Driver, userId, {
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          profilePictureUrl:
            rider.profilePictureUrl ?? existingDriver.profilePictureUrl,
        });
      } else {
        await manager.save(
          manager.create(Driver, {
            id: userId,
            firstName: dto.firstName,
            lastName: dto.lastName,
            phone: dto.phone,
            profilePictureUrl: rider.profilePictureUrl,
            user: { id: userId } as User,
          }),
        );
      }

      const vehicle = await manager.findOne(Vehicle, {
        where: { driver: { id: userId } },
      });
      if (vehicle) {
        await manager.update(Vehicle, vehicle.id, {
          vehicleType: dto.vehicleType,
          licensePlate: dto.licensePlate,
          seatingCapacity: dto.seatingCapacity,
        });
      } else {
        await manager.save(
          manager.create(Vehicle, {
            vehicleType: dto.vehicleType,
            licensePlate: dto.licensePlate,
            seatingCapacity: dto.seatingCapacity,
            driver: { id: userId } as Driver,
          }),
        );
      }

      return { email: rider.user.email };
    });
  }

  public async hasProfile(id: string): Promise<boolean> {
    return this.driverRepository.existsBy({ id });
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
    // Dual accounts share users.id — keep the login if a rider profile remains.
    const riderAlive = await this.riderRepository.existsBy({ id });
    await this.userService.softDeleteOrKeepForSibling(
      id,
      riderAlive,
      UserType.RIDER,
    );
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
