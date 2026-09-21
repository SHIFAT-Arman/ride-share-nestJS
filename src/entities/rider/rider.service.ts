import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { Rider } from './rider.entity';
import { Driver } from '../driver/driver.entity';
import { CreateRiderDto } from './dto/create-rider.dto';
import { UpdateRiderDto } from './dto/update-rider.dto';
import { RiderStatus } from './enums/rider-status.enum';
import { FindRiderParams } from './params/find-rider.params';
import { ProfilePictureService } from '../common/profile-picture/profile-picture.service';
import { UploadProfilePictureResponseDto } from '../common/dto/upload-profile-picture-response.dto';
import { UserService } from '../user/user.service';
import { UserType } from '../../auth/user-type.enum';

@Injectable()
export class RiderService {
  constructor(
    @InjectRepository(Rider)
    private readonly riderRepository: Repository<Rider>,
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
    private readonly profilePictureService: ProfilePictureService,
    private readonly userService: UserService,
  ) {}

  public async getRiderList(
    filter: FindRiderParams,
  ): Promise<[Rider[], number]> {
    const where: FindOptionsWhere<Rider> = {};

    if (filter.id) where.id = filter.id;
    if (filter.status) where.status = filter.status;
    if (filter.firstName) where.firstName = ILike(`%${filter.firstName}%`);
    if (filter.lastName) where.lastName = ILike(`%${filter.lastName}%`);

    return await this.riderRepository.findAndCount({
      where,
      skip: filter.offset,
      take: filter.limit,
      order: { createdAt: 'ASC' },
      relations: { user: true },
    });
  }

  public async getRiderById(id: string): Promise<Rider | null> {
    await this.userService.restoreIfSoftDeleted(id);
    const rider = await this.riderRepository.findOne({
      where: { id },
      relations: { user: true },
    });
    if (!rider) throw new NotFoundException(`Rider with id '${id}' not found.`);
    return rider;
  }

  public async createRider(createRiderDto: CreateRiderDto): Promise<Rider> {
    const { email, password, ...profile } = createRiderDto;
    // ponytail: user row can orphan if this save fails; wrap in a transaction if that starts happening
    const user = await this.userService.create(email, password, UserType.RIDER);
    const rider = this.riderRepository.create({
      ...profile,
      id: user.id,
      user,
    });
    return this.riderRepository.save(rider);
  }

  public async updateRiderById(
    id: string,
    updateRiderDto: UpdateRiderDto,
  ): Promise<Rider> {
    const rider = await this.riderRepository.findOne({
      where: { id },
      relations: { user: true },
    });
    if (!rider) throw new NotFoundException(`Rider with id '${id}' not found.`);
    const { email, ...profile } = updateRiderDto;
    if (email) await this.userService.updateEmail(id, email);
    this.riderRepository.merge(rider, profile);
    const saved = await this.riderRepository.save(rider);
    if (email) saved.user.email = email;
    return saved;
  }

  public async updateRiderStatus(
    id: string,
    status: RiderStatus,
  ): Promise<Rider> {
    const rider = await this.riderRepository.findOne({
      where: { id },
      relations: { user: true },
    });
    if (!rider) throw new NotFoundException(`Rider with id '${id}' not found.`);
    rider.status = status;
    return this.riderRepository.save(rider);
  }

  public async deleteRiderById(id: string): Promise<void> {
    const rider = await this.riderRepository.findOneBy({ id });
    if (!rider) throw new NotFoundException(`Rider with id '${id}' not found.`);
    await this.riderRepository.softRemove(rider);
    // Dual accounts share users.id — keep the login if a driver profile remains.
    const driverAlive = await this.driverRepository.existsBy({ id });
    await this.userService.softDeleteOrKeepForSibling(
      id,
      driverAlive,
      UserType.DRIVER,
    );
  }

  /** Soft-remove the rider row only — keeps the users row (e.g. role upgrade). */
  public async softRemoveProfile(id: string): Promise<Rider> {
    const rider = await this.riderRepository.findOne({
      where: { id },
      relations: { user: true },
    });
    if (!rider) throw new NotFoundException(`Rider with id '${id}' not found.`);
    return this.riderRepository.softRemove(rider);
  }

  public async hasProfile(id: string): Promise<boolean> {
    return this.riderRepository.existsBy({ id });
  }

  /** True if a rider row exists, including soft-deleted (legacy promote). */
  public async hasProfileIncludingDeleted(id: string): Promise<boolean> {
    const rider = await this.riderRepository.findOne({
      where: { id },
      withDeleted: true,
      select: { id: true },
    });
    return !!rider;
  }

  /** Restore a soft-deleted rider row if present. Returns true when a live rider exists after. */
  public async restoreIfSoftDeleted(id: string): Promise<boolean> {
    const rider = await this.riderRepository.findOne({
      where: { id },
      withDeleted: true,
    });
    if (!rider) return false;
    if (rider.deletedAt) {
      await this.riderRepository.recover(rider);
    }
    return true;
  }

  public async uploadProfilePicture(
    id: string,
    file: Express.Multer.File,
  ): Promise<UploadProfilePictureResponseDto> {
    const rider = await this.riderRepository.findOneBy({ id });
    if (!rider) throw new NotFoundException(`Rider with id '${id}' not found.`);

    const profilePictureUrl = await this.profilePictureService.replace(
      rider.profilePictureUrl ?? null,
      file,
      'riders',
    );
    this.riderRepository.merge(rider, { profilePictureUrl });
    await this.riderRepository.save(rider);
    return { profilePictureUrl };
  }
}
