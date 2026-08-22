import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Rider } from './rider.entity';
import { CreateRiderDto } from './dto/create-rider.dto';
import { UpdateRiderDto } from './dto/update-rider.dto';
import { FindRiderParams } from './params/find-rider.params';
import { ProfilePictureService } from '../common/profile-picture/profile-picture.service';
import { UploadProfilePictureResponseDto } from '../common/dto/upload-profile-picture-response.dto';

@Injectable()
export class RiderService {
  constructor(
    @InjectRepository(Rider)
    private readonly riderRepository: Repository<Rider>,
    private readonly profilePictureService: ProfilePictureService,
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
    });
  }

  public async getRiderById(id: string): Promise<Rider | null> {
    const rider = await this.riderRepository.findOneBy({ id });
    if (!rider) throw new NotFoundException(`Rider with id '${id}' not found.`);
    return rider;
  }

  public async createRider(createRiderDto: CreateRiderDto): Promise<Rider> {
    const hashedPass = await bcrypt.hash(createRiderDto.password, 12);
    const rider = this.riderRepository.create({
      ...createRiderDto,
      password: hashedPass,
    });
    return this.riderRepository.save(rider);
  }

  public async updateRiderById(
    id: string,
    updateRiderDto: UpdateRiderDto,
  ): Promise<Rider> {
    const rider = await this.riderRepository.findOneBy({ id });
    if (!rider) throw new NotFoundException(`Rider with id '${id}' not found.`);
    this.riderRepository.merge(rider, updateRiderDto);
    return this.riderRepository.save(rider);
  }

  public async deleteRiderById(id: string): Promise<void> {
    const rider = await this.riderRepository.findOneBy({ id });
    if (!rider) throw new NotFoundException(`Rider with id '${id}' not found.`);
    await this.riderRepository.softRemove(rider);
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

  public async findOneByEmail(email: string): Promise<Rider | null> {
    return await this.riderRepository.findOneBy({ email });
  }
}
